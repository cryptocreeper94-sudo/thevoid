import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { createVentRequestSchema, insertRoadmapItemSchema, insertWhitelistedUserSchema } from "@shared/schema";
import { registerChatRoutes } from "./replit_integrations/chat";
import { setupAuth, registerAuthRoutes } from "./replit_integrations/auth";
import { openai, speechToText, textToSpeech, ensureCompatibleFormat, detectAudioFormat } from "./replit_integrations/audio/client";
import Stripe from "stripe";
import { generateVoidId, sendSubscriptionConfirmationEmail } from "./email";
import rateLimit from "express-rate-limit";
import { registerUser, loginUser, getUserFromToken } from "./trustlayer-sso";
import { setupChatWebSocket } from "./chat-ws";
import { seedChatChannels } from "./seedChat";
import { chatChannels, referrals, voidStamps, chatUsers, subscriptions } from "@shared/schema";
import { db } from "./db";
import { mintVoidStamp, verifyVoidStamp, getStampStats } from "./blockchain-hallmark";
import { eq, and, count as dbCount } from "drizzle-orm";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2025-04-30.basil" as any });

const VOID_PRICE_ID = "price_1T23bfRq977vVehdJ3Ho9j2R";
const VOID_PRODUCT_ID = "prod_U03iMZln0CXr0m";
const FREE_DAILY_VENT_LIMIT = 1;

function getTodayDate(): string {
  return new Date().toISOString().split("T")[0];
}

let webhookSigningSecret: string | null = process.env.STRIPE_WEBHOOK_SECRET || null;

async function ensureWebhookEndpoint() {
  try {
    const domain = process.env.REPLIT_DOMAINS?.split(",")[0] || process.env.REPLIT_DEV_DOMAIN;
    if (!domain) {
      console.log("[Stripe] No domain found, skipping webhook setup");
      return;
    }
    const webhookUrl = `https://${domain}/api/stripe/webhook`;
    const existingWebhooks = await stripe.webhookEndpoints.list({ limit: 100 });
    const existing = existingWebhooks.data.find((wh) => wh.url === webhookUrl && wh.status === "enabled");
    if (existing) {
      console.log(`[Stripe] Webhook already exists: ${existing.id}`);
      return;
    }
    const webhook = await stripe.webhookEndpoints.create({
      url: webhookUrl,
      enabled_events: [
        "checkout.session.completed",
        "customer.subscription.updated",
        "customer.subscription.deleted",
        "invoice.payment_succeeded",
        "invoice.payment_failed",
      ],
    });
    if (webhook.secret) {
      webhookSigningSecret = webhook.secret;
      console.log(`[Stripe] Webhook secret captured for signature verification`);
    }
    console.log(`[Stripe] Webhook created: ${webhook.id} -> ${webhookUrl}`);
  } catch (err: any) {
    console.error("[Stripe] Webhook setup error:", err?.message);
  }
}

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  await setupAuth(app);
  registerAuthRoutes(app);
  registerChatRoutes(app);

  ensureWebhookEndpoint();

  const generalLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 60,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Too many requests. Please slow down." },
  });

  const ventLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Too many vent requests. Please wait a moment before trying again." },
  });

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 15,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Too many login attempts. Please try again later." },
  });

  app.use("/api/", generalLimiter);
  app.use("/api/vents", ventLimiter);
  app.use("/api/auth/pin", authLimiter);
  app.use("/api/auth/change-pin", authLimiter);

  app.post("/api/stripe/webhook", async (req: Request, res: Response) => {
    try {
      let event: Stripe.Event;

      if (webhookSigningSecret) {
        const sig = req.headers["stripe-signature"] as string;
        if (!sig) {
          return res.status(400).json({ error: "Missing Stripe signature" });
        }
        event = stripe.webhooks.constructEvent(
          req.rawBody as Buffer,
          sig,
          webhookSigningSecret
        );
      } else {
        console.warn("[Stripe Webhook] No signing secret available — accepting unverified event (development only)");
        event = req.body as Stripe.Event;
      }

      console.log(`[Stripe Webhook] ${event.type}`);

      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object as Stripe.Checkout.Session;
          const userId = parseInt(session.metadata?.userId || "0");

          if (session.metadata?.creditPack && userId) {
            const credits = parseInt(session.metadata.credits || "0");
            if (credits > 0) {
              await storage.addCredits(userId, credits);
              console.log(`[Stripe] Added ${credits} credits to user ${userId}`);
            }
            break;
          }

          if (userId && session.customer && session.subscription) {
            const existingSub = await storage.getSubscription(userId);
            const voidId = existingSub?.voidId || generateVoidId();

            let retries = 0;
            let finalVoidId = voidId;
            while (retries < 5) {
              try {
                await storage.upsertSubscription(userId, {
                  stripeCustomerId: session.customer as string,
                  stripeSubscriptionId: session.subscription as string,
                  stripePriceId: VOID_PRICE_ID,
                  status: "active",
                  voidId: finalVoidId,
                });
                break;
              } catch (e: any) {
                if (e?.message?.includes("unique") || e?.code === "23505") {
                  finalVoidId = generateVoidId();
                  retries++;
                } else {
                  throw e;
                }
              }
            }
            console.log(`[Stripe] Subscription activated for user ${userId}, Void ID: ${finalVoidId}`);

            try {
              const stampResult = await mintVoidStamp(finalVoidId, userId);
              if (stampResult.success) {
                console.log(`[Blockchain] Hallmark minted for ${finalVoidId}, Block #${stampResult.stamp?.blockNumber}, Hash: ${stampResult.stamp?.stampHash?.substring(0, 16)}...`);
              }
            } catch (stampErr: any) {
              console.error("[Blockchain] Stamp minting failed (non-critical):", stampErr?.message);
            }

            const pendingReferrals = await db.select().from(referrals)
              .where(and(
                eq(referrals.referredUserId, userId),
                eq(referrals.status, "pending")
              ));
            if (pendingReferrals.length > 0 && !pendingReferrals[0].rewardCredited) {
              await db.update(referrals)
                .set({ status: "converted", rewardCredited: true })
                .where(eq(referrals.id, pendingReferrals[0].id));
              await storage.addCredits(pendingReferrals[0].referrerUserId, 5);
              console.log(`[Affiliate] Referral converted! Rewarded user ${pendingReferrals[0].referrerUserId} with 5 credits`);
            }

            try {
              const customer = await stripe.customers.retrieve(session.customer as string) as Stripe.Customer;
              const customerEmail = session.customer_email || customer.email;
              const customerName = customer.name || `User ${userId}`;
              if (customerEmail) {
                const domain = process.env.REPLIT_DOMAINS?.split(",")[0] || process.env.REPLIT_DEV_DOMAIN;
                const appUrl = `https://${domain}`;
                await sendSubscriptionConfirmationEmail({
                  toEmail: customerEmail,
                  userName: customerName,
                  voidId: finalVoidId,
                  subscriptionId: session.subscription as string,
                  appUrl,
                });
              }
            } catch (emailErr: any) {
              console.error("[Stripe] Email sending failed (non-critical):", emailErr?.message);
            }
          }
          break;
        }
        case "customer.subscription.updated": {
          const sub = event.data.object as Stripe.Subscription;
          const existing = await storage.getSubscriptionByStripeSubscriptionId(sub.id);
          if (existing) {
            await storage.upsertSubscription(existing.userId, {
              status: sub.status === "active" ? "active" : sub.status === "trialing" ? "active" : sub.status,
              currentPeriodEnd: new Date((sub as any).current_period_end * 1000),
            });
          }
          break;
        }
        case "customer.subscription.deleted": {
          const sub = event.data.object as Stripe.Subscription;
          const existing = await storage.getSubscriptionByStripeSubscriptionId(sub.id);
          if (existing) {
            await storage.upsertSubscription(existing.userId, {
              status: "canceled",
            });
            console.log(`[Stripe] Subscription canceled for user ${existing.userId}`);
          }
          break;
        }
        case "invoice.payment_failed": {
          const invoice = event.data.object as Stripe.Invoice;
          if (invoice.customer) {
            const existing = await storage.getSubscriptionByStripeCustomerId(invoice.customer as string);
            if (existing) {
              await storage.upsertSubscription(existing.userId, { status: "past_due" });
            }
          }
          break;
        }
      }

      res.json({ received: true });
    } catch (err: any) {
      console.error("[Stripe Webhook] Error:", err?.message);
      res.status(400).json({ error: err?.message });
    }
  });

  app.post("/api/stripe/create-checkout", async (req, res) => {
    try {
      const { userId, userName } = z.object({
        userId: z.number(),
        userName: z.string().optional(),
      }).parse(req.body);

      const existingSub = await storage.getSubscription(userId);
      let customerId = existingSub?.stripeCustomerId;

      if (!customerId) {
        const customer = await stripe.customers.create({
          name: userName || `Void User ${userId}`,
          metadata: { voidUserId: String(userId) },
        });
        customerId = customer.id;
        await storage.upsertSubscription(userId, { stripeCustomerId: customerId });
      }

      const domain = process.env.REPLIT_DOMAINS?.split(",")[0] || process.env.REPLIT_DEV_DOMAIN;
      const baseUrl = `https://${domain}`;

      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: "subscription",
        line_items: [{ price: VOID_PRICE_ID, quantity: 1 }],
        success_url: `${baseUrl}/?subscription=success`,
        cancel_url: `${baseUrl}/?subscription=canceled`,
        metadata: { userId: String(userId) },
      });

      res.json({ url: session.url });
    } catch (err: any) {
      console.error("[Stripe] Checkout error:", err?.message);
      res.status(500).json({ message: "Failed to create checkout session" });
    }
  });

  app.post("/api/stripe/create-portal", async (req, res) => {
    try {
      const { userId } = z.object({ userId: z.number() }).parse(req.body);
      const sub = await storage.getSubscription(userId);
      if (!sub?.stripeCustomerId) {
        return res.status(400).json({ message: "No subscription found" });
      }

      const domain = process.env.REPLIT_DOMAINS?.split(",")[0] || process.env.REPLIT_DEV_DOMAIN;
      const session = await stripe.billingPortal.sessions.create({
        customer: sub.stripeCustomerId,
        return_url: `https://${domain}/settings`,
      });

      res.json({ url: session.url });
    } catch (err: any) {
      console.error("[Stripe] Portal error:", err?.message);
      res.status(500).json({ message: "Failed to create portal session" });
    }
  });

  app.get("/api/subscription/status", async (req, res) => {
    try {
      const userId = parseInt(req.query.userId as string);
      if (!userId) return res.json({ tier: "free", ventsUsedToday: 0, ventsRemaining: FREE_DAILY_VENT_LIMIT });

      const sub = await storage.getSubscription(userId);
      const today = getTodayDate();
      const usage = await storage.getDailyVentUsage(userId, today);
      const ventsUsedToday = usage?.ventCount || 0;

      const isPremium = sub?.status === "active";
      const tier = isPremium ? "premium" : "free";
      const freeRemaining = Math.max(0, FREE_DAILY_VENT_LIMIT - ventsUsedToday);
      const userCredits = await storage.getUserCredits(userId);
      const creditBalance = userCredits?.balance || 0;
      const ventsRemaining = isPremium ? -1 : (freeRemaining > 0 ? freeRemaining : 0);
      const creditsAvailable = !isPremium && freeRemaining === 0 && creditBalance > 0;

      res.json({
        tier,
        ventsUsedToday,
        ventsRemaining,
        creditsAvailable,
        creditBalance,
        status: sub?.status || "free",
        currentPeriodEnd: sub?.currentPeriodEnd,
        voidId: sub?.voidId || null,
      });
    } catch (err: any) {
      res.status(500).json({ message: "Failed to get subscription status" });
    }
  });

  // === BLOCKCHAIN HALLMARK / VOID STAMP ROUTES ===

  app.get("/api/stamp/verify/:voidId", async (req, res) => {
    try {
      const { voidId } = req.params;
      if (!voidId || !voidId.startsWith("V-")) {
        return res.status(400).json({ valid: false, error: "Invalid Void ID format" });
      }
      const result = await verifyVoidStamp(voidId);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ valid: false, error: "Verification failed" });
    }
  });

  app.get("/api/stamp/stats", async (_req, res) => {
    try {
      const stats = await getStampStats();
      res.json(stats);
    } catch (err: any) {
      res.status(500).json({ error: "Failed to get stamp stats" });
    }
  });

  app.get("/api/stamp/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      if (!userId) return res.status(400).json({ error: "Invalid user ID" });
      const [stamp] = await db.select().from(voidStamps).where(eq(voidStamps.userId, userId));
      res.json({ stamp: stamp || null });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to get stamp" });
    }
  });

  // === AFFILIATE REFERRAL ROUTES ===

  app.post("/api/referral/apply", async (req, res) => {
    try {
      const { referralCode, userId } = z.object({
        referralCode: z.string().min(1),
        userId: z.number(),
      }).parse(req.body);

      const referrerSub = await db.select().from(subscriptions).where(eq(subscriptions.voidId, referralCode));
      if (referrerSub.length === 0) {
        return res.status(404).json({ error: "Invalid referral code. Void ID not found." });
      }

      if (referrerSub[0].userId === userId) {
        return res.status(400).json({ error: "You cannot refer yourself." });
      }

      const existingReferral = await db.select().from(referrals)
        .where(eq(referrals.referredUserId, userId));
      if (existingReferral.length > 0) {
        return res.status(400).json({ error: "You've already been referred." });
      }

      const [referral] = await db.insert(referrals).values({
        referrerVoidId: referralCode,
        referrerUserId: referrerSub[0].userId,
        referredUserId: userId,
        status: "pending",
      }).returning();

      res.json({ success: true, referral });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || "Failed to apply referral" });
    }
  });

  app.get("/api/referral/stats/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      if (!userId) return res.status(400).json({ error: "Invalid user ID" });

      const sub = await storage.getSubscription(userId);
      if (!sub?.voidId) return res.json({ voidId: null, referralCount: 0, convertedCount: 0, rewardsEarned: 0 });

      const allReferrals = await db.select().from(referrals)
        .where(eq(referrals.referrerVoidId, sub.voidId));

      const converted = allReferrals.filter(r => r.status === "converted");
      const rewardsEarned = allReferrals.filter(r => r.rewardCredited).length;

      res.json({
        voidId: sub.voidId,
        referralCount: allReferrals.length,
        convertedCount: converted.length,
        rewardsEarned,
        referrals: allReferrals.map(r => ({
          id: r.id,
          referredUserId: r.referredUserId,
          status: r.status,
          rewardCredited: r.rewardCredited,
          createdAt: r.createdAt,
        })),
      });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to get referral stats" });
    }
  });

  // === TRUST LAYER BRIDGE: LINK VOID ID TO CHAT ACCOUNT ===

  app.post("/api/bridge/link-void", async (req, res) => {
    try {
      const { chatUserId, userId } = z.object({
        chatUserId: z.string(),
        userId: z.number(),
      }).parse(req.body);

      const sub = await storage.getSubscription(userId);
      if (!sub?.voidId) {
        return res.status(400).json({ error: "No Void ID found. Premium subscription required." });
      }

      await db.update(chatUsers)
        .set({ voidId: sub.voidId })
        .where(eq(chatUsers.id, chatUserId));

      res.json({
        success: true,
        voidId: sub.voidId,
        message: "Void ID linked to Trust Layer account. You are now recognized as a Void premium member across the DarkWave ecosystem.",
      });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || "Failed to link Void ID" });
    }
  });

  app.get("/api/bridge/status/:chatUserId", async (req, res) => {
    try {
      const [user] = await db.select().from(chatUsers).where(eq(chatUsers.id, req.params.chatUserId));
      if (!user) return res.status(404).json({ error: "User not found" });

      const isLinked = !!user.voidId;
      let stampVerified = false;
      if (user.voidId) {
        const verification = await verifyVoidStamp(user.voidId);
        stampVerified = verification.valid;
      }

      res.json({
        chatUserId: user.id,
        trustLayerId: user.trustLayerId,
        voidId: user.voidId || null,
        isLinked,
        stampVerified,
        displayName: user.displayName,
        role: user.role,
      });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to get bridge status" });
    }
  });

  app.post("/api/contact", async (req, res) => {
    try {
      const { name, email, subject, message } = z.object({
        name: z.string().min(1),
        email: z.string().email(),
        subject: z.string().default("general"),
        message: z.string().min(1),
      }).parse(req.body);

      await storage.createContactMessage({ name, email, subject, message });
      res.json({ success: true });
    } catch (err: any) {
      console.error("[Contact] Error:", err?.message);
      res.status(400).json({ message: "Invalid contact form data" });
    }
  });

  app.get("/api/contact", async (req, res) => {
    try {
      const masterKey = req.headers["x-master-key"];
      if (masterKey !== "0424") {
        return res.status(403).json({ message: "Unauthorized" });
      }
      const messages = await storage.getContactMessages();
      res.json(messages);
    } catch (err: any) {
      res.status(500).json({ message: "Failed to fetch contact messages" });
    }
  });

  app.get("/api/vents", async (req, res) => {
    try {
      const userId = req.query.userId as string | undefined;
      const ventList = await storage.getVents(userId);
      res.json(ventList);
    } catch (error) {
      console.error("Get vents error:", error);
      res.status(500).json({ message: "Failed to fetch vents" });
    }
  });

  app.post("/api/vents", async (req, res) => {
    try {
      const { audio, personality, mimeType, extension, userId, voicePreference } = createVentRequestSchema.parse(req.body);

      let usedCredit = false;
      if (userId) {
        const numericUserId = parseInt(userId);
        if (numericUserId) {
          const sub = await storage.getSubscription(numericUserId);
          const isPremium = sub?.status === "active";
          if (!isPremium) {
            const today = getTodayDate();
            const usage = await storage.getDailyVentUsage(numericUserId, today);
            if (usage && usage.ventCount >= FREE_DAILY_VENT_LIMIT) {
              const creditUsed = await storage.useCredit(numericUserId);
              if (!creditUsed) {
                return res.status(403).json({
                  message: "You've used your free vent for today. Upgrade to Premium for unlimited venting, or buy a credit pack.",
                  limitReached: true,
                });
              }
              usedCredit = true;
            }
          }
        }
      }

      // 1. Transcribe Audio (STT)
      const transcript = await transcribeAudio(audio, mimeType || "audio/webm", extension || "webm");
      if (transcript === null) {
        return res.status(400).json({ message: "Could not transcribe audio. Please check your microphone and try again." });
      }
      if (!transcript.trim()) {
        return res.status(400).json({ message: "No speech detected. Please speak louder or closer to your microphone." });
      }

      let tuning: { sarcasmLevel?: number; empathyLevel?: number; responseLength?: string } = {};
      if (userId) {
        const numericUserId = parseInt(userId);
        if (numericUserId) {
          const settings = await storage.getUserSettings(numericUserId);
          if (settings) {
            tuning = { sarcasmLevel: settings.sarcasmLevel, empathyLevel: settings.empathyLevel, responseLength: settings.responseLength };
          }
        }
      }

      const systemPrompt = getPersonalityPrompt(personality, tuning);
      const completion = await openai.chat.completions.create({
        model: "gpt-5.2",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: transcript },
        ],
      });
      const responseText = completion.choices[0]?.message?.content || "Whoops, I zoned out.";

      // 3. Generate Audio Response (TTS)
      let audioResponse: string | undefined;
      try {
        const voiceMap: Record<string, "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer"> = {
          'smart-ass': 'onyx',
          'calming': 'nova',
          'therapist': 'alloy',
          'hype-man': 'echo',
          'roast-master': 'fable',
        };
        let voice = voiceMap[personality] || 'alloy';
        if (voicePreference === 'male') {
          voice = 'onyx';
        } else if (voicePreference === 'female') {
          voice = 'nova';
        }
        const ttsBuffer = await textToSpeech(responseText, voice, "mp3");
        audioResponse = ttsBuffer.toString("base64");
      } catch (ttsErr: any) {
        console.error("TTS generation failed:", ttsErr?.message);
      }
      
      // 4. Save to DB & increment usage
      const vent = await storage.createVent({
        transcript,
        response: responseText,
        personality,
        audioUrl: null,
        userId: userId || null,
      });

      if (userId) {
        const numericUserId = parseInt(userId);
        if (numericUserId) {
          await storage.incrementDailyVentUsage(numericUserId, getTodayDate());
        }
      }

      res.status(200).json({
        transcript,
        response: responseText,
        audioResponse,
      });

    } catch (error) {
      console.error("Vent error:", error);
      res.status(500).json({ message: "Failed to process vent" });
    }
  });

  app.post("/api/auth/pin", async (req, res) => {
    try {
      const { pin } = z.object({ pin: z.string().length(4) }).parse(req.body);
      const result = await storage.validatePin(pin);
      if (result.valid) {
        res.json({ success: true, name: result.name, userId: result.userId, pinChanged: result.pinChanged });
      } else {
        res.status(401).json({ success: false, message: "Invalid PIN" });
      }
    } catch (error) {
      res.status(400).json({ message: "Invalid request" });
    }
  });

  app.post("/api/auth/change-pin", async (req, res) => {
    try {
      const { userId, currentPin, newPin } = z.object({
        userId: z.number(),
        currentPin: z.string().length(4),
        newPin: z.string().length(4).regex(/^\d{4}$/, "PIN must be 4 digits"),
      }).parse(req.body);
      const validation = await storage.validatePin(currentPin);
      if (!validation.valid || validation.userId !== userId) {
        return res.status(401).json({ message: "Invalid current PIN" });
      }
      const updated = await storage.changePinSelf(userId, newPin);
      if (!updated) return res.status(404).json({ message: "User not found" });
      res.json({ success: true, name: updated.name });
    } catch (error) {
      res.status(400).json({ message: "Invalid request" });
    }
  });

  const requireMasterKey = (req: any, res: any, next: any) => {
    const masterKey = req.headers["x-master-key"];
    if (masterKey !== "0424") {
      return res.status(403).json({ message: "Unauthorized" });
    }
    next();
  };

  app.get("/api/whitelist", requireMasterKey, async (_req, res) => {
    try {
      const users = await storage.getWhitelistedUsers();
      const sanitized = users.map(({ id, name, createdAt }) => ({ id, name, createdAt }));
      res.json(sanitized);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch whitelist" });
    }
  });

  app.post("/api/whitelist", requireMasterKey, async (req, res) => {
    try {
      const pinSchema = insertWhitelistedUserSchema.extend({
        pin: z.string().length(4).regex(/^\d{4}$/, "PIN must be 4 digits"),
      });
      const data = pinSchema.parse(req.body);
      const user = await storage.createWhitelistedUser(data);
      res.status(201).json({ id: user.id, name: user.name, createdAt: user.createdAt });
    } catch (error) {
      res.status(500).json({ message: "Failed to add user" });
    }
  });

  app.delete("/api/whitelist/:id", requireMasterKey, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteWhitelistedUser(id);
      if (!deleted) return res.status(404).json({ message: "User not found" });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to remove user" });
    }
  });

  app.patch("/api/whitelist/:id/pin", requireMasterKey, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { pin } = z.object({ pin: z.string().length(4).regex(/^\d{4}$/, "PIN must be 4 digits") }).parse(req.body);
      const updated = await storage.updateWhitelistedUserPin(id, pin);
      if (!updated) return res.status(404).json({ message: "User not found" });
      res.json({ id: updated.id, name: updated.name, createdAt: updated.createdAt });
    } catch (error) {
      res.status(500).json({ message: "Failed to update PIN" });
    }
  });

  app.get("/api/roadmap", async (_req, res) => {
    try {
      const items = await storage.getRoadmapItems();
      res.json(items);
    } catch (error) {
      console.error("Roadmap fetch error:", error);
      res.status(500).json({ message: "Failed to fetch roadmap items" });
    }
  });

  app.post("/api/roadmap", async (req, res) => {
    try {
      const data = insertRoadmapItemSchema.parse(req.body);
      const item = await storage.createRoadmapItem(data);
      res.status(201).json(item);
    } catch (error) {
      console.error("Roadmap create error:", error);
      res.status(500).json({ message: "Failed to create roadmap item" });
    }
  });

  app.patch("/api/roadmap/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const allowedFields = insertRoadmapItemSchema.partial().parse(req.body);
      const item = await storage.updateRoadmapItem(id, allowedFields);
      if (!item) return res.status(404).json({ message: "Item not found" });
      res.json(item);
    } catch (error) {
      console.error("Roadmap update error:", error);
      res.status(500).json({ message: "Failed to update roadmap item" });
    }
  });

  app.delete("/api/roadmap/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteRoadmapItem(id);
      if (!deleted) return res.status(404).json({ message: "Item not found" });
      res.json({ success: true });
    } catch (error) {
      console.error("Roadmap delete error:", error);
      res.status(500).json({ message: "Failed to delete roadmap item" });
    }
  });

  app.get("/api/user-settings", async (req, res) => {
    try {
      const userId = parseInt(req.query.userId as string);
      if (!userId) return res.json({ sarcasmLevel: 50, empathyLevel: 50, responseLength: "medium" });
      const settings = await storage.getUserSettings(userId);
      res.json(settings || { sarcasmLevel: 50, empathyLevel: 50, responseLength: "medium" });
    } catch (err: any) {
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  app.post("/api/user-settings", async (req, res) => {
    try {
      const data = z.object({
        userId: z.number(),
        sarcasmLevel: z.number().min(0).max(100).optional(),
        empathyLevel: z.number().min(0).max(100).optional(),
        responseLength: z.enum(["short", "medium", "long"]).optional(),
      }).parse(req.body);
      const settings = await storage.upsertUserSettings(data.userId, {
        sarcasmLevel: data.sarcasmLevel,
        empathyLevel: data.empathyLevel,
        responseLength: data.responseLength,
      });
      res.json(settings);
    } catch (err: any) {
      res.status(400).json({ message: "Invalid settings data" });
    }
  });

  app.get("/api/credits", async (req, res) => {
    try {
      const userId = parseInt(req.query.userId as string);
      if (!userId) return res.json({ balance: 0 });
      const credits = await storage.getUserCredits(userId);
      res.json({ balance: credits?.balance || 0 });
    } catch (err: any) {
      res.status(500).json({ message: "Failed to fetch credits" });
    }
  });

  app.post("/api/credits/purchase", async (req, res) => {
    try {
      const { userId, packSize } = z.object({
        userId: z.number(),
        packSize: z.enum(["25", "50", "100"]),
      }).parse(req.body);

      const packPrices: Record<string, { credits: number; amount: number; label: string }> = {
        "25": { credits: 25, amount: 199, label: "25 Vent Credits" },
        "50": { credits: 50, amount: 299, label: "50 Vent Credits" },
        "100": { credits: 100, amount: 499, label: "100 Vent Credits" },
      };
      const pack = packPrices[packSize];

      const domain = process.env.REPLIT_DOMAINS?.split(",")[0] || process.env.REPLIT_DEV_DOMAIN;
      const baseUrl = `https://${domain}`;

      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        line_items: [{
          price_data: {
            currency: "usd",
            unit_amount: pack.amount,
            product_data: { name: pack.label, description: `${pack.credits} additional vent credits for THE VOID` },
          },
          quantity: 1,
        }],
        success_url: `${baseUrl}/?credits=success&pack=${packSize}`,
        cancel_url: `${baseUrl}/?credits=canceled`,
        metadata: { userId: String(userId), creditPack: packSize, credits: String(pack.credits) },
      });

      res.json({ url: session.url });
    } catch (err: any) {
      console.error("[Credits] Purchase error:", err?.message);
      res.status(500).json({ message: "Failed to create credit purchase session" });
    }
  });

  app.get("/api/threads", async (req, res) => {
    try {
      const userId = parseInt(req.query.userId as string);
      if (!userId) return res.json([]);
      const threads = await storage.getConversationThreads(userId);
      res.json(threads);
    } catch (err: any) {
      res.status(500).json({ message: "Failed to fetch threads" });
    }
  });

  app.post("/api/threads", async (req, res) => {
    try {
      const data = z.object({
        userId: z.number(),
        title: z.string().min(1).max(100),
        personality: z.enum(['smart-ass', 'calming', 'therapist', 'hype-man', 'roast-master']),
      }).parse(req.body);
      const thread = await storage.createConversationThread(data);
      res.status(201).json(thread);
    } catch (err: any) {
      res.status(400).json({ message: "Invalid thread data" });
    }
  });

  app.get("/api/threads/:id/messages", async (req, res) => {
    try {
      const threadId = parseInt(req.params.id);
      const thread = await storage.getConversationThread(threadId);
      if (!thread) return res.status(404).json({ message: "Thread not found" });
      const messages = await storage.getThreadMessages(threadId);
      res.json({ thread, messages });
    } catch (err: any) {
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.post("/api/threads/:id/messages", async (req, res) => {
    try {
      const threadId = parseInt(req.params.id);
      const thread = await storage.getConversationThread(threadId);
      if (!thread) return res.status(404).json({ message: "Thread not found" });

      const { content, userId, voicePreference, audio, mimeType, extension } = z.object({
        content: z.string().optional(),
        audio: z.string().optional(),
        mimeType: z.string().optional(),
        extension: z.string().optional(),
        userId: z.number(),
        voicePreference: z.enum(['default', 'male', 'female']).optional().default('default'),
      }).parse(req.body);

      let userMessage = content || "";

      if (audio && !content) {
        const transcript = await transcribeAudio(audio, mimeType || "audio/webm", extension || "webm");
        if (!transcript || !transcript.trim()) {
          return res.status(400).json({ message: "Could not transcribe audio." });
        }
        userMessage = transcript;
      }

      if (!userMessage.trim()) {
        return res.status(400).json({ message: "Message cannot be empty." });
      }

      await storage.createThreadMessage({ threadId, role: "user", content: userMessage });

      const previousMessages = await storage.getThreadMessages(threadId);
      const chatHistory = previousMessages.map(m => ({
        role: m.role as "user" | "assistant" | "system",
        content: m.content,
      }));

      let tuning: { sarcasmLevel?: number; empathyLevel?: number; responseLength?: string } = {};
      const settings = await storage.getUserSettings(userId);
      if (settings) {
        tuning = { sarcasmLevel: settings.sarcasmLevel, empathyLevel: settings.empathyLevel, responseLength: settings.responseLength };
      }

      const systemPrompt = getPersonalityPrompt(thread.personality, tuning);

      const completion = await openai.chat.completions.create({
        model: "gpt-5.2",
        messages: [
          { role: "system", content: systemPrompt },
          ...chatHistory.slice(-20),
        ],
      });
      const responseText = completion.choices[0]?.message?.content || "Hmm, I got nothing.";

      await storage.createThreadMessage({ threadId, role: "assistant", content: responseText });
      await storage.updateConversationThread(threadId, {});

      let audioResponse: string | undefined;
      try {
        const voiceMap: Record<string, "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer"> = {
          'smart-ass': 'onyx', 'calming': 'nova', 'therapist': 'alloy', 'hype-man': 'echo', 'roast-master': 'fable',
        };
        let voice = voiceMap[thread.personality] || 'alloy';
        if (voicePreference === 'male') voice = 'onyx';
        else if (voicePreference === 'female') voice = 'nova';
        const ttsBuffer = await textToSpeech(responseText, voice, "mp3");
        audioResponse = ttsBuffer.toString("base64");
      } catch (ttsErr: any) {
        console.error("Thread TTS failed:", ttsErr?.message);
      }

      res.json({ userMessage, response: responseText, audioResponse });
    } catch (err: any) {
      console.error("[Thread] Message error:", err?.message);
      res.status(500).json({ message: "Failed to process message" });
    }
  });

  app.patch("/api/threads/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { title } = z.object({ title: z.string().min(1).max(100) }).parse(req.body);
      const updated = await storage.updateConversationThread(id, { title });
      if (!updated) return res.status(404).json({ message: "Thread not found" });
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ message: "Invalid data" });
    }
  });

  app.delete("/api/threads/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteConversationThread(id);
      if (!deleted) return res.status(404).json({ message: "Thread not found" });
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ message: "Failed to delete thread" });
    }
  });

  app.get("/api/analytics", async (req, res) => {
    const masterKey = req.headers["x-master-key"];
    if (masterKey !== "0424") {
      return res.status(403).json({ message: "Unauthorized" });
    }
    try {
      const { pool } = await import("./db");

      const q = async (text: string, params?: any[]) => {
        const result = await pool.query(text, params);
        return result.rows;
      };

      const today = getTodayDate();
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const [{ count: totalVents }] = await q("SELECT COUNT(*) as count FROM vents");
      const [{ count: ventsToday }] = await q("SELECT COUNT(*) as count FROM vents WHERE DATE(created_at) = $1", [today]);
      const [{ count: ventsThisWeek }] = await q("SELECT COUNT(*) as count FROM vents WHERE created_at >= $1", [sevenDaysAgo]);

      const personalityBreakdown = (await q("SELECT personality, COUNT(*) as count FROM vents GROUP BY personality ORDER BY count DESC"))
        .map((r: any) => ({ personality: r.personality, count: Number(r.count) }));

      const peakHours = (await q("SELECT EXTRACT(HOUR FROM created_at) as hour, COUNT(*) as count FROM vents GROUP BY hour ORDER BY hour"))
        .map((r: any) => ({ hour: Number(r.hour), count: Number(r.count) }));

      const dailyTrend = (await q("SELECT DATE(created_at) as date, COUNT(*) as count FROM vents WHERE created_at >= $1 GROUP BY DATE(created_at) ORDER BY date", [sevenDaysAgo]))
        .map((r: any) => ({ date: r.date, count: Number(r.count) }));

      const [{ count: uniqueUsers }] = await q("SELECT COUNT(DISTINCT user_id) as count FROM vents WHERE user_id IS NOT NULL");
      const [{ count: totalWhitelistedUsers }] = await q("SELECT COUNT(*) as count FROM whitelisted_users");

      const subscriptionBreakdown = (await q("SELECT status, COUNT(*) as count FROM subscriptions GROUP BY status"))
        .map((r: any) => ({ status: r.status, count: Number(r.count) }));

      const [{ count: premiumUsers }] = await q("SELECT COUNT(*) as count FROM subscriptions WHERE status = 'active'");
      const avgRow = await q("SELECT ROUND(AVG(vent_count)::numeric, 1) as avg FROM daily_vent_usage");
      const avgVentsPerDay = Number(avgRow[0]?.avg || 0);
      const [{ count: totalContactMessages }] = await q("SELECT COUNT(*) as count FROM contact_messages");

      res.json({
        totalVents: Number(totalVents),
        ventsToday: Number(ventsToday),
        ventsThisWeek: Number(ventsThisWeek),
        personalityBreakdown,
        peakHours,
        dailyTrend,
        uniqueUsers: Number(uniqueUsers),
        totalWhitelistedUsers: Number(totalWhitelistedUsers),
        subscriptionBreakdown,
        premiumUsers: Number(premiumUsers),
        avgVentsPerDay: Number(avgVentsPerDay),
        totalContactMessages: Number(totalContactMessages),
      });
    } catch (error) {
      console.error("Analytics error:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  // === TRUST LAYER SSO & SIGNAL CHAT AUTH ===
  app.post("/api/chat/auth/register", async (req, res) => {
    try {
      const { username, email, password, displayName } = req.body;
      if (!username || !email || !password || !displayName) {
        return res.status(400).json({ success: false, error: "All fields required." });
      }
      const result = await registerUser(username, email, password, displayName);
      if (!result.success) {
        return res.status(400).json(result);
      }
      res.json(result);
    } catch (error: any) {
      console.error("Chat register error:", error);
      res.status(500).json({ success: false, error: "Registration failed." });
    }
  });

  app.post("/api/chat/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ success: false, error: "Username and password required." });
      }
      const result = await loginUser(username, password);
      if (!result.success) {
        return res.status(401).json(result);
      }
      res.json(result);
    } catch (error: any) {
      console.error("Chat login error:", error);
      res.status(500).json({ success: false, error: "Login failed." });
    }
  });

  app.get("/api/chat/auth/me", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith("Bearer ")) {
        return res.status(401).json({ success: false, error: "No token provided." });
      }
      const token = authHeader.split(" ")[1];
      const user = await getUserFromToken(token);
      if (!user) {
        return res.status(401).json({ success: false, error: "Invalid or expired token." });
      }
      res.json({ success: true, user });
    } catch {
      res.status(500).json({ success: false, error: "Auth check failed." });
    }
  });

  app.get("/api/chat/channels", async (_req, res) => {
    try {
      const channels = await db.select().from(chatChannels).orderBy(chatChannels.name);
      res.json(channels);
    } catch {
      res.status(500).json({ message: "Failed to fetch channels" });
    }
  });

  // === SIGNAL AI CRISIS CHATBOT ===
  app.post("/api/signal-ai", async (req, res) => {
    try {
      const { messages: chatHistory } = req.body;
      if (!chatHistory || !Array.isArray(chatHistory)) {
        return res.status(400).json({ message: "messages array required" });
      }

      const systemPrompt = `You are Signal — a compassionate, trained crisis support AI for THE VOID app. Your sole purpose is to provide immediate emotional support and connect people with professional crisis resources.

CRITICAL RULES:
1. You are NOT a replacement for professional help. Always encourage contacting real crisis services.
2. Be warm, calm, non-judgmental, and empathetic. Use a gentle, supportive tone.
3. Listen actively. Reflect what the person is feeling. Validate their emotions.
4. NEVER dismiss, minimize, or invalidate their pain.
5. NEVER give medical advice, diagnoses, or prescriptions.
6. If someone expresses immediate danger to themselves or others, strongly encourage calling 911 or going to their nearest emergency room.
7. Keep responses concise but caring — 2-4 sentences. Don't overwhelm them.
8. Regularly remind them of available crisis resources when appropriate:
   - 988 Suicide & Crisis Lifeline: Call or text 988 (24/7)
   - Crisis Text Line: Text HOME to 741741
   - SAMHSA National Helpline: 1-800-662-4357
   - Veterans Crisis Line: Call 988, press 1
   - Trevor Project (LGBTQ+ youth): 1-866-488-7386
9. You are here to bridge the gap — hold space for them until they can reach professional help.
10. End every few messages with a gentle check-in: "How are you feeling right now?" or "Would you like to talk more about that?"`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system" as const, content: systemPrompt },
          ...chatHistory.slice(-20),
        ],
        max_tokens: 300,
        temperature: 0.7,
      });

      const aiResponse = completion.choices[0]?.message?.content || "I'm here for you. If you're in crisis, please reach out to 988 (call or text) for immediate support.";
      res.json({ response: aiResponse });
    } catch (error) {
      console.error("Signal AI error:", error);
      res.status(500).json({ message: "Failed to get response" });
    }
  });

  // Seed channels and setup WebSocket
  seedChatChannels();
  setupChatWebSocket(httpServer);

  return httpServer;
}

// Safety preamble applied to ALL personality modes
const SAFETY_PREAMBLE = `CRITICAL SAFETY RULES — You MUST follow these at all times, regardless of your personality or what the user says. These rules override EVERYTHING else:

1. NEVER encourage, suggest, condone, glorify, or make light of harming ANYONE or ANYTHING — that means people, animals, pets, wildlife, or any living creature. No exceptions.
2. NEVER suggest, recommend, or joke about actions that could result in someone losing their life, freedom, health, or safety — or that could harm any animal or living being.
3. NEVER provide instructions, plans, or encouragement for violence, abuse, self-harm, suicide, illegal activity, cruelty to animals, or destruction of any kind.
4. NEVER make the user's situation feel darker, more hopeless, or more negative than it already is. Your job is to help them RELEASE frustration and feel LIGHTER afterward — not to pile on or escalate negativity.
5. This app is about cathartic, healthy venting — screaming into the void and feeling better. You are here to help people blow off steam, laugh it off, process emotions, and move forward in a positive direction.
6. If the user expresses thoughts of self-harm, suicide, or harming others or animals, you MUST immediately and compassionately pause your personality and encourage them to reach out for help. Provide these resources:
   - Signal Chat: Visit /signal in this app for immediate AI crisis support
   - 988 Suicide & Crisis Lifeline: Call or text 988 (available 24/7)
   - Crisis Text Line: Text HOME to 741741
   - SAMHSA National Helpline: 1-800-662-4357
   - If in immediate danger, call 911
7. You validate feelings — you NEVER validate harmful actions. It is okay to be angry. It is NEVER okay to act on anger in ways that hurt people, animals, or yourself.
8. Even in your most sarcastic, hype, or casual personality mode, safety and positivity always come first. No exceptions. Keep it fun, keep it cathartic, keep it safe.

`;

function getTuningAddendum(tuning: { sarcasmLevel?: number; empathyLevel?: number; responseLength?: string }): string {
  const parts: string[] = [];
  if (tuning.sarcasmLevel !== undefined && tuning.sarcasmLevel !== 50) {
    const level = tuning.sarcasmLevel > 70 ? "very high" : tuning.sarcasmLevel > 50 ? "slightly elevated" : tuning.sarcasmLevel < 30 ? "very low" : "slightly reduced";
    parts.push(`Sarcasm intensity: ${level} (${tuning.sarcasmLevel}/100).`);
  }
  if (tuning.empathyLevel !== undefined && tuning.empathyLevel !== 50) {
    const level = tuning.empathyLevel > 70 ? "very empathetic and warm" : tuning.empathyLevel > 50 ? "slightly more empathetic" : tuning.empathyLevel < 30 ? "more blunt and direct" : "slightly less empathetic";
    parts.push(`Empathy style: ${level} (${tuning.empathyLevel}/100).`);
  }
  if (tuning.responseLength && tuning.responseLength !== "medium") {
    const lengths: Record<string, string> = { short: "Keep responses very brief — 1-2 sentences max.", long: "Give detailed, thorough responses — 4-6 sentences." };
    parts.push(lengths[tuning.responseLength] || "");
  }
  return parts.length > 0 ? "\n\nUser tuning preferences: " + parts.join(" ") : "";
}

function getPersonalityPrompt(personality: string, tuning?: { sarcasmLevel?: number; empathyLevel?: number; responseLength?: string }): string {
  let personalityPrompt: string;
  switch (personality) {
    case 'smart-ass':
      personalityPrompt = "You are a sarcastic, witty, slightly rude friend. The user is venting to you. Listen to their rant, validate it in a snarky way, and make a joke at their expense or the situation's expense. Keep it short and punchy. Never be cruel — sarcastic humor only, never targeting someone's pain or vulnerabilities.";
      break;
    case 'calming':
      personalityPrompt = "You are a soothing, meditative guide. The user is venting. Listen deeply, validate their feelings with immense empathy, and offer a very short, simple grounding exercise or comforting thought. Speak softly (in text). Always prioritize emotional safety.";
      break;
    case 'therapist':
      personalityPrompt = "You are a professional, analytical therapist. Listen to the user's vent. Identify the core emotion. Ask one reflective question to help them process it. Keep it professional but warm. You are not a replacement for real therapy — if someone needs serious help, guide them toward professional resources.";
      break;
    case 'hype-man':
      personalityPrompt = "You are the ultimate hype man! High energy! All caps energy (sometimes)! The user is venting. Validate their feelings! Tell them they deserve better! Get them pumped up to handle it in a POSITIVE and CONSTRUCTIVE way! Channel that energy toward growth, never toward revenge, destruction, or anything harmful. Let's go!";
      break;
    case 'roast-master':
      personalityPrompt = "You are a savage, hilariously vulgar roast comedian — think a mix of a comedy roast and a brutally honest best friend who curses like a sailor. The user is venting to you. Your job is to ROAST THEM about their situation in the most outrageously funny, over-the-top way possible. Use creative profanity, absurd comparisons, and comedic exaggeration. You're not mean-spirited — you're the friend who makes them laugh so hard they forget why they were mad. Keep it SHORT (2-4 sentences max). Rules: NEVER target race, gender, sexuality, disability, religion, or body image. NEVER be actually cruel — this is comedy, not bullying. The goal is to make them laugh at the absurdity of their situation. Think roast comedy, not personal attack. Channel frustration into laughter, never into darkness.";
      break;
    default:
      personalityPrompt = "You are a helpful, caring listener. Always prioritize the user's safety and well-being.";
      break;
  }
  const tuningAddendum = tuning ? getTuningAddendum(tuning) : "";
  return SAFETY_PREAMBLE + personalityPrompt + tuningAddendum;
}

async function transcribeAudio(base64Audio: string, mimeType: string, extension: string): Promise<string | null> {
  try {
    const audioBuffer = Buffer.from(base64Audio, "base64");

    if (audioBuffer.length < 100) {
      console.error("Audio buffer too small:", audioBuffer.length, "bytes");
      return null;
    }

    console.log(`Transcribing audio: ${audioBuffer.length} bytes, mime: ${mimeType}, ext: ${extension}`);

    let transcriptBuffer: Buffer;
    let transcriptFormat: "wav" | "mp3" | "webm";

    try {
      const { buffer: compatibleBuffer, format } = await ensureCompatibleFormat(audioBuffer);
      console.log(`Converted to ${format}, ${compatibleBuffer.length} bytes`);
      transcriptBuffer = compatibleBuffer;
      transcriptFormat = format;
    } catch (convErr: any) {
      console.warn("Audio conversion failed, trying raw format:", convErr?.message);
      const detected = detectAudioFormat(audioBuffer);
      if (detected === "webm" || detected === "mp3" || detected === "wav") {
        transcriptBuffer = audioBuffer;
        transcriptFormat = detected;
      } else {
        transcriptBuffer = audioBuffer;
        transcriptFormat = "webm";
      }
    }

    const transcript = await speechToText(transcriptBuffer, transcriptFormat);
    console.log("Transcription result:", transcript?.substring(0, 100));
    return transcript ?? null;
  } catch (e: any) {
    console.error("Transcription error:", e?.message || e);
    if (e?.error) {
      console.error("Transcription error details:", JSON.stringify(e.error));
    }
    return null;
  }
}
