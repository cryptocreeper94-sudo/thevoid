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
import { registerUser, loginUser, getUserFromToken, ecosystemLogin } from "./trustlayer-sso";
import { setupChatWebSocket } from "./chat-ws";
import { seedChatChannels } from "./seedChat";
import { chatChannels, referrals, voidStamps, chatUsers, subscriptions, achievements, userAchievements, ventStreaks, dailyPrompts, moodChecks, blogPosts, vents, voiceJournalEntries, voidEchoes, moodPortraits } from "@shared/schema";
import { db } from "./db";
import { mintVoidStamp, verifyVoidStamp, getStampStats } from "./blockchain-hallmark";
import { eq, and, count as dbCount } from "drizzle-orm";
import { uploadMedia, getMedia, deleteMedia, getUserMedia, isTrustVaultMediaId, healthCheck as tvHealthCheck } from "./trustvault";
import crypto from "crypto";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2025-04-30.basil" as any });

const VOID_FOUNDERS_PRICE_ID = "price_1T23bfRq977vVehdJ3Ho9j2R";
const VOID_STANDARD_PRICE_ID = "price_1T2JdkRq977vVehd3ZcYfDKB";
const VOID_PRODUCT_ID = "prod_U03iMZln0CXr0m";
const FREE_DAILY_VENT_LIMIT = 1;
const FOUNDERS_LIMIT = 1000;

async function getUserTrustLayerInfo(userId: number): Promise<{ trustLayerId: string | null; voidId: string | null }> {
  try {
    const [chatUser] = await db.select({
      trustLayerId: chatUsers.trustLayerId,
      voidId: chatUsers.voidId,
    }).from(chatUsers).where(eq(chatUsers.id, String(userId)));
    if (chatUser?.trustLayerId) return chatUser;
    const [sub] = await db.select({ voidId: subscriptions.voidId }).from(subscriptions).where(eq(subscriptions.userId, userId));
    return { trustLayerId: null, voidId: sub?.voidId || null };
  } catch {
    return { trustLayerId: null, voidId: null };
  }
}

function getTodayDate(): string {
  return new Date().toISOString().split("T")[0];
}

async function getFounderCount(): Promise<number> {
  const result = await db.select({ count: dbCount() }).from(subscriptions).where(eq(subscriptions.isFounder, true));
  return Number(result[0]?.count || 0);
}

async function getActivePriceId(): Promise<string> {
  const founderCount = await getFounderCount();
  return founderCount < FOUNDERS_LIMIT ? VOID_FOUNDERS_PRICE_ID : VOID_STANDARD_PRICE_ID;
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

  // === SEO ROUTES ===

  app.get("/sitemap.xml", async (_req: Request, res: Response) => {
    const BASE_URL = "https://intothevoid.app";
    
    const staticRoutes = [
      { loc: "/", changefreq: "weekly", priority: "1.0" },
      { loc: "/mission", changefreq: "monthly", priority: "0.8" },
      { loc: "/blog", changefreq: "weekly", priority: "0.8" },
      { loc: "/zen", changefreq: "monthly", priority: "0.7" },
      { loc: "/signal", changefreq: "monthly", priority: "0.7" },
      { loc: "/contact", changefreq: "monthly", priority: "0.6" },
      { loc: "/privacy", changefreq: "yearly", priority: "0.4" },
      { loc: "/terms", changefreq: "yearly", priority: "0.4" },
    ];

    let blogEntries = "";
    try {
      const posts = await db.select({ slug: blogPosts.slug, createdAt: blogPosts.createdAt }).from(blogPosts);
      for (const post of posts) {
        const lastmod = post.createdAt ? new Date(post.createdAt).toISOString().split("T")[0] : new Date().toISOString().split("T")[0];
        blogEntries += `
  <url>
    <loc>${BASE_URL}/blog/${post.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`;
      }
    } catch (e) {
      console.error("Sitemap blog fetch error:", e);
    }

    const today = new Date().toISOString().split("T")[0];
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticRoutes.map(r => `  <url>
    <loc>${BASE_URL}${r.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${r.changefreq}</changefreq>
    <priority>${r.priority}</priority>
  </url>`).join("\n")}
${blogEntries}
</urlset>`;

    res.set("Content-Type", "application/xml");
    res.send(xml);
  });

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
  app.use("/api/chat/auth/ecosystem-login", authLimiter);

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
                const isFounderFromCheckout = session.metadata?.isFounder === "true";
                const checkoutPriceId = isFounderFromCheckout ? VOID_FOUNDERS_PRICE_ID : VOID_STANDARD_PRICE_ID;
                await storage.upsertSubscription(userId, {
                  stripeCustomerId: session.customer as string,
                  stripeSubscriptionId: session.subscription as string,
                  stripePriceId: checkoutPriceId,
                  status: "active",
                  voidId: finalVoidId,
                  isFounder: isFounderFromCheckout,
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

      const activePriceId = await getActivePriceId();
      const isFounderCheckout = activePriceId === VOID_FOUNDERS_PRICE_ID;

      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: "subscription",
        line_items: [{ price: activePriceId, quantity: 1 }],
        success_url: `${baseUrl}/?subscription=success`,
        cancel_url: `${baseUrl}/?subscription=canceled`,
        metadata: { userId: String(userId), isFounder: isFounderCheckout ? "true" : "false" },
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
        isFounder: sub?.isFounder || false,
      });
    } catch (err: any) {
      res.status(500).json({ message: "Failed to get subscription status" });
    }
  });

  // === FOUNDERS PRICING INFO ===

  app.get("/api/pricing/info", async (_req, res) => {
    try {
      const founderCount = await getFounderCount();
      const foundersRemaining = Math.max(0, FOUNDERS_LIMIT - founderCount);
      const isFoundersPricing = founderCount < FOUNDERS_LIMIT;
      res.json({
        foundersPrice: 9.99,
        standardPrice: 14.99,
        isFoundersPricing,
        foundersRemaining,
        foundersLimit: FOUNDERS_LIMIT,
        founderCount,
      });
    } catch (err: any) {
      res.status(500).json({ message: "Failed to get pricing info" });
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
      let tvMediaId: string | null = null;
      if (userId) {
        const numericUserId = parseInt(userId);
        if (numericUserId) {
          const sub = await storage.getSubscription(numericUserId);
          if (sub?.status === "active") {
            const tlInfo = await getUserTrustLayerInfo(numericUserId);
            if (tlInfo.trustLayerId) {
              try {
                const tvResult = await uploadMedia({
                  trustLayerId: tlInfo.trustLayerId,
                  voidId: tlInfo.voidId,
                  mediaType: "audio",
                  format: "webm",
                  encoding: "base64",
                  data: audio,
                  source: "vent",
                  metadata: { personality, duration: audio.length },
                  tags: ["vent", personality, getTodayDate()],
                  title: `Vent — ${personality}`,
                });
                tvMediaId = tvResult.mediaId;
              } catch (e: any) {
                console.error("[TrustVault] Vent upload failed (non-blocking):", e.message);
              }
            }
          }
        }
      }

      const vent = await storage.createVent({
        transcript,
        response: responseText,
        personality,
        audioUrl: tvMediaId,
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
        tvMediaId,
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

  app.post("/api/chat/auth/ecosystem-login", async (req, res) => {
    try {
      const { identifier, credential } = z.object({
        identifier: z.string().min(1, "Trust Layer ID or email required"),
        credential: z.string().min(1, "Password or PIN required"),
      }).parse(req.body);
      const result = await ecosystemLogin(identifier, credential);
      if (!result.success) {
        return res.status(401).json(result);
      }
      console.log(`[Ecosystem Login] ${result.user?.email} authenticated via Trust Layer (${result.user?.trustLayerId})`);
      res.json(result);
    } catch (error: any) {
      console.error("Ecosystem login error:", error);
      res.status(500).json({ success: false, error: "Login failed. Please try again." });
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
  seedEcosystemMembers();
  setupChatWebSocket(httpServer);

  // === GAMIFICATION ROUTES ===
  seedAchievements();
  seedDailyPrompt();

  app.get("/api/gamification/streak/:userId", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId as string);
      if (isNaN(userId)) return res.status(400).json({ message: "Invalid userId" });
      const [streak] = await db.select().from(ventStreaks).where(eq(ventStreaks.userId, userId));
      res.json(streak || { currentStreak: 0, longestStreak: 0, lastVentDate: null });
    } catch (e) { res.status(500).json({ message: "Failed to get streak" }); }
  });

  app.get("/api/gamification/achievements/:userId", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId as string);
      if (isNaN(userId)) return res.status(400).json({ message: "Invalid userId" });
      const all = await db.select().from(achievements);
      const unlocked = await db.select().from(userAchievements).where(eq(userAchievements.userId, userId));
      res.json({ all, unlocked: unlocked.map((u) => u.achievementKey) });
    } catch (e) { res.status(500).json({ message: "Failed to get achievements" }); }
  });

  app.get("/api/gamification/mood-stats/:userId", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId as string);
      if (isNaN(userId)) return res.status(400).json({ message: "Invalid userId" });
      const recent = await db.select().from(moodChecks).where(eq(moodChecks.userId, userId)).orderBy(moodChecks.createdAt).limit(50);
      const withAfter = recent.filter((m) => m.moodAfter !== null);
      const avgBefore = withAfter.length > 0 ? withAfter.reduce((s, m) => s + m.moodBefore, 0) / withAfter.length : 3;
      const avgAfter = withAfter.length > 0 ? withAfter.reduce((s, m) => s + (m.moodAfter ?? 0), 0) / withAfter.length : 3;
      res.json({ recent: recent.slice(-20).reverse(), avgBefore: Math.round(avgBefore * 10) / 10, avgAfter: Math.round(avgAfter * 10) / 10 });
    } catch (e) { res.status(500).json({ message: "Failed to get mood stats" }); }
  });

  app.post("/api/gamification/mood", async (req: Request, res: Response) => {
    try {
      const { userId, ventId, moodBefore, moodAfter } = req.body;
      if (!userId || moodBefore === undefined) return res.status(400).json({ message: "Missing fields" });
      const [created] = await db.insert(moodChecks).values({ userId, ventId, moodBefore, moodAfter }).returning();
      res.json(created);
    } catch (e) { res.status(500).json({ message: "Failed to save mood" }); }
  });

  app.post("/api/gamification/streak/update", async (req: Request, res: Response) => {
    try {
      const { userId } = req.body;
      if (!userId) return res.status(400).json({ message: "Missing userId" });
      const today = getTodayDate();
      const [existing] = await db.select().from(ventStreaks).where(eq(ventStreaks.userId, userId));
      if (!existing) {
        const [created] = await db.insert(ventStreaks).values({ userId, currentStreak: 1, longestStreak: 1, lastVentDate: today }).returning();
        await checkAndAwardAchievements(userId, 1);
        return res.json(created);
      }
      if (existing.lastVentDate === today) return res.json(existing);
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split("T")[0];
      let newStreak = 1;
      if (existing.lastVentDate === yesterdayStr) {
        newStreak = existing.currentStreak + 1;
      }
      const newLongest = Math.max(existing.longestStreak, newStreak);
      const [updated] = await db.update(ventStreaks).set({ currentStreak: newStreak, longestStreak: newLongest, lastVentDate: today, updatedAt: new Date() }).where(eq(ventStreaks.userId, userId)).returning();
      await checkAndAwardAchievements(userId, newStreak);
      res.json(updated);
    } catch (e) { res.status(500).json({ message: "Failed to update streak" }); }
  });

  app.get("/api/gamification/daily-prompt", async (_req: Request, res: Response) => {
    try {
      const today = getTodayDate();
      const [prompt] = await db.select().from(dailyPrompts).where(eq(dailyPrompts.activeDate, today));
      res.json(prompt || null);
    } catch (e) { res.status(500).json({ message: "Failed to get prompt" }); }
  });

  // === AI BLOG ROUTES ===
  seedBlogPosts();

  app.get("/api/blog", async (_req: Request, res: Response) => {
    try {
      const posts = await db.select().from(blogPosts).where(eq(blogPosts.published, true)).orderBy(blogPosts.createdAt);
      res.json(posts);
    } catch (e) { res.status(500).json({ message: "Failed to get blog posts" }); }
  });

  app.get("/api/blog/:slug", async (req: Request, res: Response) => {
    try {
      const [post] = await db.select().from(blogPosts).where(eq(blogPosts.slug, req.params.slug as string));
      if (!post) return res.status(404).json({ message: "Post not found" });
      res.json(post);
    } catch (e) { res.status(500).json({ message: "Failed to get blog post" }); }
  });

  // === JOURNAL ROUTES ===
  app.get("/api/journal", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.query.userId as string);
      if (!userId) return res.json([]);
      const entries = await storage.getJournalEntries(userId);
      res.json(entries);
    } catch (e) { res.status(500).json({ message: "Failed to fetch journal entries" }); }
  });

  app.post("/api/journal", async (req: Request, res: Response) => {
    try {
      const data = z.object({
        userId: z.number(),
        content: z.string().min(1),
        moodTag: z.string().optional(),
        personality: z.string().optional(),
      }).parse(req.body);

      let aiResponse: string | undefined;
      if (data.personality) {
        const personalityPrompts: Record<string, string> = {
          "smart-ass": "You're a witty, sarcastic friend who responds to journal entries with clever observations and humor while still being supportive.",
          "calming": "You're a calming, zen presence who responds to journal entries with soothing, peaceful wisdom.",
          "therapist": "You're a compassionate therapist who responds to journal entries with professional insights and gentle guidance.",
          "hype-man": "You're an enthusiastic hype man who responds to journal entries with energetic encouragement and positivity.",
          "roast-master": "You're a roast master who responds to journal entries with playful roasts while still being empathetic at heart.",
        };
        const systemPrompt = personalityPrompts[data.personality] || personalityPrompts["calming"];
        const response = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt + " Keep response under 150 words." },
            { role: "user", content: data.content },
          ],
          max_tokens: 300,
        });
        aiResponse = response.choices[0]?.message?.content || undefined;
      }

      const entry = await storage.createJournalEntry({
        userId: data.userId,
        content: data.content,
        moodTag: data.moodTag,
        personality: data.personality,
        aiResponse,
      });
      res.json(entry);
    } catch (e: any) {
      console.error("Journal create error:", e);
      res.status(500).json({ message: "Failed to create journal entry" });
    }
  });

  app.delete("/api/journal/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id as string);
      const deleted = await storage.deleteJournalEntry(id);
      if (!deleted) return res.status(404).json({ message: "Entry not found" });
      res.json({ success: true });
    } catch (e) { res.status(500).json({ message: "Failed to delete journal entry" }); }
  });

  // === AFFIRMATIONS ROUTES ===
  app.get("/api/affirmations", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.query.userId as string);
      if (!userId) return res.json([]);
      const items = await storage.getAffirmations(userId);
      res.json(items);
    } catch (e) { res.status(500).json({ message: "Failed to fetch affirmations" }); }
  });

  app.post("/api/affirmations/generate", async (req: Request, res: Response) => {
    try {
      const data = z.object({ userId: z.number() }).parse(req.body);
      const recentVents = await storage.getVents(String(data.userId));
      const ventContext = recentVents.slice(0, 5).map(v => v.transcript).join("\n");

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a deeply empathetic affirmation generator for THE VOID app. Based on the user's recent venting topics, generate 3 personalized, powerful affirmations that directly address their struggles and reframe them positively. Each affirmation should be 1-2 sentences. Format as a JSON array of strings. Make them feel personal, not generic.",
          },
          {
            role: "user",
            content: ventContext || "The user is new and hasn't vented yet. Generate 3 universal but powerful affirmations about self-worth, resilience, and growth.",
          },
        ],
        max_tokens: 500,
        response_format: { type: "json_object" },
      });

      const parsed = JSON.parse(response.choices[0]?.message?.content || '{"affirmations":[]}');
      const affirmationTexts: string[] = parsed.affirmations || parsed.items || Object.values(parsed).flat();

      const created = [];
      for (const text of affirmationTexts) {
        if (typeof text === "string" && text.trim()) {
          const aff = await storage.createAffirmation(data.userId, text.trim(), ventContext?.substring(0, 200));
          created.push(aff);
        }
      }
      res.json(created);
    } catch (e: any) {
      console.error("Affirmation generation error:", e);
      res.status(500).json({ message: "Failed to generate affirmations" });
    }
  });

  // === WEEKLY INSIGHTS ROUTES ===
  app.get("/api/insights", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.query.userId as string);
      if (!userId) return res.json([]);
      const insights = await storage.getWeeklyInsights(userId);
      res.json(insights);
    } catch (e) { res.status(500).json({ message: "Failed to fetch insights" }); }
  });

  app.post("/api/insights/generate", async (req: Request, res: Response) => {
    try {
      const data = z.object({ userId: z.number() }).parse(req.body);
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const weekStart = weekAgo.toISOString().split("T")[0];

      const recentVents = await storage.getVents(String(data.userId));
      const weekVents = recentVents.filter(v => v.createdAt && new Date(v.createdAt) >= weekAgo);
      const moods = await storage.getMoodChecks(data.userId);
      const weekMoods = moods.filter(m => m.createdAt && new Date(m.createdAt) >= weekAgo);

      const avgBefore = weekMoods.length > 0 ? Math.round(weekMoods.reduce((s, m) => s + m.moodBefore, 0) / weekMoods.length) : undefined;
      const avgAfter = weekMoods.length > 0 ? Math.round(weekMoods.filter(m => m.moodAfter).reduce((s, m) => s + (m.moodAfter || 0), 0) / weekMoods.filter(m => m.moodAfter).length) : undefined;

      const ventSummary = weekVents.slice(0, 10).map(v => `[${v.personality}] ${v.transcript?.substring(0, 100)}`).join("\n");

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are an insightful emotional wellness analyst for THE VOID app. Analyze the user's weekly venting data and provide a JSON response with: summary (2-3 sentence overview of their week), triggers (array of strings - key emotional triggers identified), growthNotes (1-2 sentences about positive growth or progress), moodTrend (one word: improving, stable, declining, or mixed).",
          },
          {
            role: "user",
            content: `This week: ${weekVents.length} vents. Average mood before venting: ${avgBefore || 'N/A'}/5, after: ${avgAfter || 'N/A'}/5.\n\nVent topics:\n${ventSummary || "No vents this week."}`,
          },
        ],
        max_tokens: 500,
        response_format: { type: "json_object" },
      });

      const parsed = JSON.parse(response.choices[0]?.message?.content || "{}");
      const insight = await storage.createWeeklyInsight({
        userId: data.userId,
        weekStart,
        summary: parsed.summary || "Your weekly insight is being prepared.",
        triggers: parsed.triggers || [],
        growthNotes: parsed.growthNotes,
        moodTrend: parsed.moodTrend || "stable",
        ventCount: weekVents.length,
        avgMoodBefore: avgBefore,
        avgMoodAfter: avgAfter,
      });
      res.json(insight);
    } catch (e: any) {
      console.error("Insight generation error:", e);
      res.status(500).json({ message: "Failed to generate weekly insight" });
    }
  });

  // === MOOD ANALYTICS ROUTES ===
  app.get("/api/mood/analytics", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.query.userId as string);
      if (!userId) return res.json({ moods: [], summary: {} });
      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;
      const moods = await storage.getMoodChecks(userId, startDate, endDate);

      const totalChecks = moods.length;
      const avgBefore = totalChecks > 0 ? +(moods.reduce((s, m) => s + m.moodBefore, 0) / totalChecks).toFixed(1) : 0;
      const withAfter = moods.filter(m => m.moodAfter !== null);
      const avgAfter = withAfter.length > 0 ? +(withAfter.reduce((s, m) => s + (m.moodAfter || 0), 0) / withAfter.length).toFixed(1) : 0;
      const avgImprovement = totalChecks > 0 && withAfter.length > 0 ? +(avgAfter - avgBefore).toFixed(1) : 0;

      const dailyData: Record<string, { before: number[]; after: number[] }> = {};
      moods.forEach(m => {
        const day = m.createdAt ? new Date(m.createdAt).toISOString().split("T")[0] : "unknown";
        if (!dailyData[day]) dailyData[day] = { before: [], after: [] };
        dailyData[day].before.push(m.moodBefore);
        if (m.moodAfter !== null) dailyData[day].after.push(m.moodAfter!);
      });

      const chartData = Object.entries(dailyData).map(([date, vals]) => ({
        date,
        avgBefore: +(vals.before.reduce((a, b) => a + b, 0) / vals.before.length).toFixed(1),
        avgAfter: vals.after.length > 0 ? +(vals.after.reduce((a, b) => a + b, 0) / vals.after.length).toFixed(1) : null,
      })).sort((a, b) => a.date.localeCompare(b.date));

      res.json({
        moods,
        summary: { totalChecks, avgBefore, avgAfter, avgImprovement },
        chartData,
      });
    } catch (e) { res.status(500).json({ message: "Failed to fetch mood analytics" }); }
  });

  // === SAFETY PLAN ROUTES ===
  app.get("/api/safety-plan", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.query.userId as string);
      if (!userId) return res.json(null);
      const plan = await storage.getSafetyPlan(userId);
      res.json(plan || null);
    } catch (e) { res.status(500).json({ message: "Failed to fetch safety plan" }); }
  });

  app.post("/api/safety-plan", async (req: Request, res: Response) => {
    try {
      const data = z.object({
        userId: z.number(),
        warningSignals: z.array(z.string()).optional(),
        copingStrategies: z.array(z.string()).optional(),
        supportContacts: z.array(z.object({ name: z.string(), phone: z.string() })).optional(),
        professionalContacts: z.array(z.object({ name: z.string(), phone: z.string() })).optional(),
        safeEnvironment: z.string().optional(),
        reasonsToLive: z.array(z.string()).optional(),
      }).parse(req.body);
      const plan = await storage.upsertSafetyPlan(data.userId, {
        warningSignals: data.warningSignals,
        copingStrategies: data.copingStrategies,
        supportContacts: data.supportContacts,
        professionalContacts: data.professionalContacts,
        safeEnvironment: data.safeEnvironment,
        reasonsToLive: data.reasonsToLive,
      });
      res.json(plan);
    } catch (e: any) {
      console.error("Safety plan error:", e);
      res.status(500).json({ message: "Failed to save safety plan" });
    }
  });

  // === VENT LIBRARY ROUTES ===
  app.get("/api/vent-library", async (req: Request, res: Response) => {
    try {
      const userId = req.query.userId as string;
      if (!userId) return res.json([]);
      const allVents = await storage.getVents(userId);
      const personality = req.query.personality as string;
      const search = req.query.search as string;
      let filtered = allVents;
      if (personality && personality !== "all") {
        filtered = filtered.filter(v => v.personality === personality);
      }
      if (search) {
        const lower = search.toLowerCase();
        filtered = filtered.filter(v => v.transcript?.toLowerCase().includes(lower) || v.response?.toLowerCase().includes(lower));
      }
      res.json(filtered);
    } catch (e) { res.status(500).json({ message: "Failed to fetch vent library" }); }
  });

  // === VOICE JOURNAL ROUTES ===
  app.get("/api/voice-journal", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.query.userId as string);
      if (!userId) return res.json([]);
      const entries = await storage.getVoiceJournalEntries(userId);
      res.json(entries);
    } catch (e) { res.status(500).json({ message: "Failed to fetch voice journal" }); }
  });

  app.post("/api/voice-journal", async (req: Request, res: Response) => {
    try {
      const data = z.object({
        userId: z.number(),
        audio: z.string(),
        mimeType: z.string().optional().default("audio/webm"),
        extension: z.string().optional().default("webm"),
        cleanUp: z.boolean().optional().default(false),
        isPlayMode: z.boolean().optional().default(false),
      }).parse(req.body);

      const transcript = await transcribeAudio(data.audio, data.mimeType, data.extension);
      if (!transcript) return res.status(400).json({ message: "Could not transcribe audio" });

      let cleanedTranscript: string | undefined;
      if (data.cleanUp) {
        const cleanResponse = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: "Clean up this voice journal transcript. Fix grammar, remove filler words (um, uh, like), organize thoughts into clear paragraphs, but preserve the original meaning and voice exactly. Do NOT add new content or change what was said." },
            { role: "user", content: transcript },
          ],
          max_tokens: 2000,
        });
        cleanedTranscript = cleanResponse.choices[0]?.message?.content || undefined;
      }

      let audioRef: string | undefined = data.audio.substring(0, 500000);
      const sub = await storage.getSubscription(data.userId);
      if (sub?.status === "active") {
        const tlInfo = await getUserTrustLayerInfo(data.userId);
        if (tlInfo.trustLayerId) {
          try {
            const tvResult = await uploadMedia({
              trustLayerId: tlInfo.trustLayerId,
              voidId: tlInfo.voidId,
              mediaType: "audio",
              format: data.extension || "webm",
              encoding: "base64",
              data: data.audio,
              source: "voice-journal",
              metadata: { isPlayMode: data.isPlayMode },
              title: `Voice Journal — ${new Date().toLocaleDateString()}`,
            });
            audioRef = tvResult.mediaId;
          } catch (e: any) {
            console.error("[TrustVault] Voice journal upload failed (non-blocking):", e.message);
          }
        }
      }

      const entry = await storage.createVoiceJournalEntry({
        userId: data.userId,
        rawTranscript: transcript,
        cleanedTranscript,
        audioData: audioRef,
        isPlayMode: data.isPlayMode,
      });
      res.json(entry);
    } catch (e: any) {
      console.error("Voice journal error:", e);
      res.status(500).json({ message: "Failed to save voice journal entry" });
    }
  });

  app.delete("/api/voice-journal/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id as string);
      const entries = await storage.getVoiceJournalEntries(parseInt(req.query.userId as string) || 0);
      const entry = entries.find(e => e.id === id);
      if (entry?.audioData && isTrustVaultMediaId(entry.audioData)) {
        deleteMedia(entry.audioData).catch(e => console.error("[TrustVault] Journal delete failed:", e));
      }
      const deleted = await storage.deleteVoiceJournalEntry(id);
      if (!deleted) return res.status(404).json({ message: "Entry not found" });
      res.json({ success: true });
    } catch (e) { res.status(500).json({ message: "Failed to delete voice journal entry" }); }
  });

  // === VOICE FINGERPRINT ROUTES ===
  app.get("/api/voice-fingerprint", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.query.userId as string);
      if (!userId) return res.json([]);
      const fingerprints = await storage.getVoiceFingerprints(userId);
      res.json(fingerprints);
    } catch (e) { res.status(500).json({ message: "Failed to fetch voice fingerprints" }); }
  });

  app.post("/api/voice-fingerprint/analyze", async (req: Request, res: Response) => {
    try {
      const data = z.object({
        userId: z.number(),
        transcript: z.string().min(1),
        ventId: z.number().optional(),
        isPlayMode: z.boolean().optional().default(false),
      }).parse(req.body);

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are an emotional voice analysis AI. Analyze the emotional content of this transcript and return a JSON object with these fields:
- energy (0-100): How energetic/activated the speaker sounds
- tension (0-100): Level of stress/tension detected
- pace (0-100): How rushed/fast the speech patterns suggest
- warmth (0-100): Emotional warmth and positivity
- stability (0-100): Emotional steadiness and composure
- dominantEmotion: One of: "joy", "anger", "sadness", "fear", "surprise", "disgust", "neutral", "anxious", "frustrated", "hopeful", "exhausted"
- emotionConfidence (0-100): How confident you are in the dominant emotion
- summary: A 1-2 sentence insight about the speaker's emotional state, written directly to them (e.g. "You sound like you're carrying a lot of tension today, but there's resilience underneath.")
Return ONLY valid JSON.`,
          },
          { role: "user", content: data.transcript },
        ],
        max_tokens: 500,
        response_format: { type: "json_object" },
      });

      const analysis = JSON.parse(response.choices[0]?.message?.content || "{}");
      const fingerprint = await storage.createVoiceFingerprint({
        userId: data.userId,
        ventId: data.ventId,
        energy: Math.min(100, Math.max(0, analysis.energy || 50)),
        tension: Math.min(100, Math.max(0, analysis.tension || 50)),
        pace: Math.min(100, Math.max(0, analysis.pace || 50)),
        warmth: Math.min(100, Math.max(0, analysis.warmth || 50)),
        stability: Math.min(100, Math.max(0, analysis.stability || 50)),
        dominantEmotion: analysis.dominantEmotion || "neutral",
        emotionConfidence: Math.min(100, Math.max(0, analysis.emotionConfidence || 50)),
        summary: analysis.summary || null,
        isPlayMode: data.isPlayMode,
      });
      res.json(fingerprint);
    } catch (e: any) {
      console.error("Voice fingerprint error:", e);
      res.status(500).json({ message: "Failed to analyze voice fingerprint" });
    }
  });

  // === MOOD PORTRAIT ROUTES ===
  app.get("/api/mood-portraits", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.query.userId as string);
      if (!userId) return res.json([]);
      const portraits = await storage.getMoodPortraits(userId);
      res.json(portraits);
    } catch (e) { res.status(500).json({ message: "Failed to fetch mood portraits" }); }
  });

  app.post("/api/mood-portraits/generate", async (req: Request, res: Response) => {
    try {
      const data = z.object({ userId: z.number() }).parse(req.body);
      const fingerprints = await storage.getVoiceFingerprints(data.userId, 20);
      const recentMoods = await storage.getMoodChecks(data.userId);

      const emotionData = fingerprints.length > 0
        ? fingerprints.map(f => ({ emotion: f.dominantEmotion, energy: f.energy, tension: f.tension, warmth: f.warmth }))
        : [{ emotion: "neutral", energy: 50, tension: 30, warmth: 60 }];

      const moodData = recentMoods.slice(0, 10).map(m => ({ before: m.moodBefore, after: m.moodAfter }));

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You generate abstract SVG art from emotional data. Create a unique, beautiful abstract SVG (300x300 viewBox) that represents the user's emotional landscape. Use organic shapes (circles, ellipses, paths with curves), gradients, and colors that map to emotions:
- Joy/warmth: warm golds, oranges, soft pinks
- Sadness: deep blues, muted purples
- Anger/tension: reds, sharp angles
- Calm/stability: greens, smooth curves
- Fear/anxiety: dark grays, scattered shapes
- Hope: light cyan, upward curves
Blend emotions together like watercolors. Make it beautiful and unique. Return ONLY the SVG markup (no json wrapping, just raw SVG starting with <svg>). Keep it under 3000 characters.`,
          },
          {
            role: "user",
            content: `Emotional data: ${JSON.stringify(emotionData)}. Mood trends: ${JSON.stringify(moodData)}`,
          },
        ],
        max_tokens: 1500,
      });

      let svgData = response.choices[0]?.message?.content || "";
      const svgMatch = svgData.match(/<svg[\s\S]*<\/svg>/);
      if (svgMatch) svgData = svgMatch[0];

      const dominantEmotion = emotionData[0]?.emotion || "neutral";

      let svgRef = svgData;
      const sub = await storage.getSubscription(data.userId);
      if (sub?.status === "active") {
        const tlInfo = await getUserTrustLayerInfo(data.userId);
        if (tlInfo.trustLayerId) {
          try {
            const tvResult = await uploadMedia({
              trustLayerId: tlInfo.trustLayerId,
              voidId: tlInfo.voidId,
              mediaType: "image",
              format: "svg",
              encoding: "utf-8",
              data: svgData,
              source: "mood-portrait",
              metadata: { dominantMood: dominantEmotion, dataPoints: fingerprints.length + recentMoods.length },
              title: `Mood Portrait — ${dominantEmotion}`,
            });
            svgRef = tvResult.mediaId;
          } catch (e: any) {
            console.error("[TrustVault] Mood portrait upload failed (non-blocking):", e.message);
          }
        }
      }

      const portrait = await storage.createMoodPortrait({
        userId: data.userId,
        svgData: svgRef,
        dominantMood: dominantEmotion,
        colorPalette: emotionData.slice(0, 5).map(e => e.emotion),
        dataPoints: fingerprints.length + recentMoods.length,
      });
      res.json(portrait);
    } catch (e: any) {
      console.error("Mood portrait error:", e);
      res.status(500).json({ message: "Failed to generate mood portrait" });
    }
  });

  // === VOID ECHO (TIME CAPSULE) ROUTES ===
  app.get("/api/void-echoes", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.query.userId as string);
      if (!userId) return res.json([]);
      const echoes = await storage.getVoidEchoes(userId);
      res.json(echoes);
    } catch (e) { res.status(500).json({ message: "Failed to fetch void echoes" }); }
  });

  app.get("/api/void-echoes/pending", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.query.userId as string);
      if (!userId) return res.json([]);
      const pending = await storage.getPendingVoidEchoes(userId);
      const now = new Date();
      const ready = pending.filter(e => e.deliverAt && new Date(e.deliverAt) <= now);
      for (const echo of ready) {
        await storage.deliverVoidEcho(echo.id);
      }
      res.json(ready);
    } catch (e) { res.status(500).json({ message: "Failed to check pending echoes" }); }
  });

  app.post("/api/void-echoes", async (req: Request, res: Response) => {
    try {
      const data = z.object({
        userId: z.number(),
        audio: z.string().optional(),
        transcript: z.string().min(1),
        deliverAt: z.string().optional(),
        deliverTrigger: z.string().optional().default("date"),
      }).parse(req.body);

      const aiResponse = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are the Void Echo keeper. The user is recording a message to their future self. Write a brief, warm note (1-2 sentences) that will accompany this message when it's delivered. Something encouraging and reflective, like a gentle reminder of their past wisdom.",
          },
          { role: "user", content: data.transcript },
        ],
        max_tokens: 150,
      });

      let echoAudioRef: string | undefined = data.audio?.substring(0, 500000);
      if (data.audio) {
        const sub = await storage.getSubscription(data.userId);
        if (sub?.status === "active") {
          const tlInfo = await getUserTrustLayerInfo(data.userId);
          if (tlInfo.trustLayerId) {
            try {
              const tvResult = await uploadMedia({
                trustLayerId: tlInfo.trustLayerId,
                voidId: tlInfo.voidId,
                mediaType: "audio",
                format: "webm",
                encoding: "base64",
                data: data.audio,
                source: "void-echo",
                metadata: { deliverAt: data.deliverAt, deliverTrigger: data.deliverTrigger },
                title: `Void Echo — ${data.deliverAt || "future"}`,
              });
              echoAudioRef = tvResult.mediaId;
            } catch (e: any) {
              console.error("[TrustVault] Void echo upload failed (non-blocking):", e.message);
            }
          }
        }
      }

      const echo = await storage.createVoidEcho({
        userId: data.userId,
        audioData: echoAudioRef,
        transcript: data.transcript,
        deliverAt: data.deliverAt ? new Date(data.deliverAt) : null,
        deliverTrigger: data.deliverTrigger,
        aiNote: aiResponse.choices[0]?.message?.content || null,
      });
      res.json(echo);
    } catch (e: any) {
      console.error("Void echo error:", e);
      res.status(500).json({ message: "Failed to create void echo" });
    }
  });

  // === TRUSTVAULT INTEGRATION ROUTES ===
  app.get("/api/trustvault/media/:mediaId", async (req: Request, res: Response) => {
    try {
      const mediaId = req.params.mediaId as string;
      if (!isTrustVaultMediaId(mediaId)) {
        return res.status(400).json({ message: "Invalid TrustVault media ID" });
      }
      const media = await getMedia(mediaId);
      if (!media) return res.status(404).json({ message: "Media not found" });
      res.json(media);
    } catch (e: any) {
      console.error("[TrustVault] Media retrieval error:", e.message);
      res.status(500).json({ message: "Failed to retrieve media" });
    }
  });

  app.get("/api/trustvault/library/:userId", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId as string);
      if (!userId) return res.status(400).json({ message: "Invalid user ID" });
      const sub = await storage.getSubscription(userId);
      if (sub?.status !== "active") {
        return res.status(403).json({ message: "Premium subscription required", requiresPremium: true });
      }
      const tlInfo = await getUserTrustLayerInfo(userId);
      if (!tlInfo.trustLayerId) return res.json({ items: [], total: 0, hasMore: false });
      const source = req.query.source as string | undefined;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;
      const sort = (req.query.sort as "newest" | "oldest") || "newest";
      const result = await getUserMedia(tlInfo.trustLayerId, { source, limit, offset, sort });
      res.json(result);
    } catch (e: any) {
      console.error("[TrustVault] Library error:", e.message);
      res.status(500).json({ message: "Failed to fetch media library" });
    }
  });

  app.get("/api/trustvault/health", async (_req: Request, res: Response) => {
    const healthy = await tvHealthCheck();
    res.json({ connected: healthy, service: "TrustVault V1 API" });
  });

  app.post("/api/trustvault/webhook", async (req: Request, res: Response) => {
    try {
      const signature = req.headers["x-trustvault-signature"] as string;
      const timestampHeader = req.headers["x-trustvault-timestamp"] as string;

      if (!signature || !timestampHeader) {
        console.warn("[TrustVault Webhook] Missing signature or timestamp headers");
        return res.status(401).json({ error: "Missing signature headers" });
      }

      const apiSecret = process.env.TRUSTVAULT_API_KEY;
      if (!apiSecret) {
        console.error("[TrustVault Webhook] TRUSTVAULT_API_KEY not configured");
        return res.status(500).json({ error: "Webhook verification not configured" });
      }

      if (!/^[a-f0-9]{64}$/i.test(signature)) {
        console.warn("[TrustVault Webhook] Malformed signature header");
        return res.status(401).json({ error: "Malformed signature" });
      }

      const rawBody = req.rawBody as Buffer;
      const rawPayload = rawBody ? rawBody.toString("utf8") : JSON.stringify(req.body);
      const signedPayload = `${timestampHeader}.${rawPayload}`;
      const expectedSignature = crypto
        .createHmac("sha256", apiSecret)
        .update(signedPayload)
        .digest("hex");

      const sigBuffer = Buffer.from(signature, "hex");
      const expectedBuffer = Buffer.from(expectedSignature, "hex");
      if (sigBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
        console.warn("[TrustVault Webhook] Invalid signature — rejecting event");
        return res.status(401).json({ error: "Invalid signature" });
      }

      const tsValue = parseInt(timestampHeader, 10);
      const tsMs = tsValue < 1e12 ? tsValue * 1000 : tsValue;
      const MAX_AGE_MS = 5 * 60 * 1000;
      const eventAge = Date.now() - tsMs;
      if (isNaN(eventAge) || eventAge < 0 || eventAge > MAX_AGE_MS) {
        console.warn("[TrustVault Webhook] Stale or future event rejected (age: " + eventAge + "ms)");
        return res.status(401).json({ error: "Stale event" });
      }

      const { event, mediaId, userId, timestamp } = req.body;
      console.log(`[TrustVault Webhook] Verified ${event} — mediaId: ${mediaId}, user: ${userId}, at: ${timestamp}`);

      if (event === "media.deleted") {
        console.log(`[TrustVault] Media ${mediaId} deleted externally — clearing local references`);
        await Promise.allSettled([
          db.update(vents).set({ audioUrl: null }).where(eq(vents.audioUrl, mediaId)),
          db.update(voiceJournalEntries).set({ audioData: null }).where(eq(voiceJournalEntries.audioData, mediaId)),
          db.update(voidEchoes).set({ audioData: null }).where(eq(voidEchoes.audioData, mediaId)),
          db.update(moodPortraits).set({ svgData: "" }).where(eq(moodPortraits.svgData, mediaId)),
        ]);
      }

      if (event === "media.flagged") {
        console.log(`[TrustVault] Media ${mediaId} flagged for user ${userId} — logged for review`);
      }

      if (event === "service.quota_warning") {
        console.warn(`[TrustVault] Storage quota warning for user ${userId}: approaching limit`);
      }

      res.json({ received: true });
    } catch (e: any) {
      console.error("[TrustVault Webhook] Error processing event:", e?.message || e);
      return res.status(500).json({ error: "Internal webhook error" });
    }
  });

  return httpServer;
}

// === GAMIFICATION & BLOG SEED HELPERS ===
async function seedAchievements() {
  try {
    const existing = await db.select().from(achievements);
    if (existing.length > 0) return;
    const defs = [
      { key: "first_vent", title: "First Scream", description: "Complete your first vent session", icon: "zap", category: "milestone", requirement: 1 },
      { key: "streak_3", title: "On a Roll", description: "Maintain a 3-day venting streak", icon: "flame", category: "streak", requirement: 3 },
      { key: "streak_7", title: "Week Warrior", description: "Maintain a 7-day venting streak", icon: "flame", category: "streak", requirement: 7 },
      { key: "streak_30", title: "Void Devotee", description: "Maintain a 30-day venting streak", icon: "crown", category: "streak", requirement: 30 },
      { key: "all_personalities", title: "Personality Explorer", description: "Try all 5 AI personalities", icon: "sparkles", category: "exploration", requirement: 5 },
      { key: "premium_member", title: "Premium Soul", description: "Subscribe to Premium", icon: "crown", category: "milestone", requirement: 1 },
      { key: "mood_tracker", title: "Mood Mapper", description: "Complete 10 mood check-ins", icon: "heart", category: "wellness", requirement: 10 },
      { key: "night_owl", title: "Night Owl", description: "Vent after midnight", icon: "star", category: "special", requirement: 1 },
      { key: "conversation_starter", title: "Deep Diver", description: "Start 5 conversation threads", icon: "message", category: "engagement", requirement: 5 },
      { key: "zen_master", title: "Zen Master", description: "Complete 10 breathing sessions", icon: "sparkles", category: "wellness", requirement: 10 },
    ];
    await db.insert(achievements).values(defs);
    console.log("[Gamification] Seeded achievements");
  } catch (e) { console.log("[Gamification] Achievements already seeded or error"); }
}

async function seedDailyPrompt() {
  try {
    const today = getTodayDate();
    const [existing] = await db.select().from(dailyPrompts).where(eq(dailyPrompts.activeDate, today));
    if (existing) return;
    const prompts = [
      { prompt: "What's one thing you wish you could say to someone but haven't?", category: "reflection" },
      { prompt: "Describe the last thing that made you genuinely angry. Why did it hit so hard?", category: "anger" },
      { prompt: "If your stress had a color and shape, what would it look like?", category: "creative" },
      { prompt: "What's something you're tired of pretending is fine?", category: "honesty" },
      { prompt: "Think of a boundary you need to set. Vent about why it's hard.", category: "boundaries" },
      { prompt: "What would you tell your younger self about handling frustration?", category: "wisdom" },
      { prompt: "Describe a moment this week where you felt genuinely at peace.", category: "gratitude" },
    ];
    const dayIdx = new Date().getDay();
    const selected = prompts[dayIdx % prompts.length];
    await db.insert(dailyPrompts).values({ ...selected, activeDate: today });
    console.log("[Gamification] Seeded daily prompt");
  } catch (e) { console.log("[Gamification] Daily prompt seed error"); }
}

async function checkAndAwardAchievements(userId: number, currentStreak: number) {
  try {
    const streakAchievements = [
      { key: "first_vent", req: 1 },
      { key: "streak_3", req: 3 },
      { key: "streak_7", req: 7 },
      { key: "streak_30", req: 30 },
    ];
    for (const sa of streakAchievements) {
      if (currentStreak >= sa.req) {
        const [exists] = await db.select().from(userAchievements).where(and(eq(userAchievements.userId, userId), eq(userAchievements.achievementKey, sa.key)));
        if (!exists) {
          await db.insert(userAchievements).values({ userId, achievementKey: sa.key });
          console.log(`[Gamification] Awarded ${sa.key} to user ${userId}`);
        }
      }
    }
  } catch (e) { console.error("[Gamification] Achievement check error:", e); }
}

async function seedBlogPosts() {
  try {
    const existing = await db.select().from(blogPosts).limit(1);
    if (existing.length > 0) return;
    const posts = [
      {
        slug: "science-of-venting",
        title: "The Science of Venting: Why Screaming Into the Void Actually Works",
        excerpt: "Research shows that emotional expression through voice reduces cortisol levels and activates the parasympathetic nervous system.",
        content: `## Why We Need to Vent

The urge to express frustration isn't a weakness — it's biology. When stress hormones build up, your body needs an outlet. Suppressing emotions has been linked to increased anxiety, depression, and even physical health problems.

## The Cortisol Connection

Cortisol, the stress hormone, spikes when we bottle up emotions. Research from the University of Texas found that participants who expressed their frustrations through voice experienced a 23% greater reduction in cortisol compared to those who wrote about them.

## Voice vs. Text

There's something uniquely powerful about using your voice. When you speak — or shout — your body engages differently. The vibrations in your vocal cords activate the vagus nerve, which helps regulate your nervous system.

### The Vagus Nerve Effect

- Speaking activates the vagus nerve, promoting calm
- Lower vocal tones trigger parasympathetic response
- The physical act of exhaling while speaking naturally slows heart rate

## How THE VOID Uses This Science

Our voice-first approach isn't just a design choice — it's grounded in research. By encouraging vocal expression and pairing it with AI that responds in varied emotional registers, we create a feedback loop that helps process and release tension.

## Practical Tips

- Don't hold back — volume and intensity matter
- Try different AI personalities to match your emotional state
- Use the Zen Zone breathing exercises after an intense vent
- Track your mood before and after to see the impact over time`,
        category: "science",
        tags: ["cortisol", "venting", "mental-health", "voice-therapy"],
        metaDescription: "Discover the science behind why venting and vocal expression reduces stress. Learn how voice-first emotional processing works.",
      },
      {
        slug: "breathing-techniques-anxiety",
        title: "5 Breathing Techniques That Actually Calm Anxiety (In Under 5 Minutes)",
        excerpt: "From Navy SEAL box breathing to the 4-7-8 method, these evidence-based techniques can lower your heart rate in minutes.",
        content: `## Why Breathing Works

Your breath is the only autonomic function you can consciously control. By changing your breathing pattern, you can directly influence your heart rate, blood pressure, and nervous system state.

## 1. Box Breathing (4-4-4-4)

Used by Navy SEALs and first responders, box breathing creates a sense of control and focus.

- Inhale for 4 seconds
- Hold for 4 seconds
- Exhale for 4 seconds
- Hold for 4 seconds
- Repeat 4 times

## 2. The 4-7-8 Method

Developed by Dr. Andrew Weil, this technique acts as a natural tranquilizer for your nervous system.

- Inhale through your nose for 4 seconds
- Hold your breath for 7 seconds
- Exhale slowly through your mouth for 8 seconds

## 3. Physiological Sigh

Discovered by Stanford researchers, this is the fastest way to calm down in real-time.

- Take a quick double inhale through your nose
- Follow with a long, slow exhale through your mouth
- Even one cycle can reduce stress

## 4. Alternate Nostril Breathing

A yoga technique that balances your nervous system and reduces anxiety.

- Close your right nostril, inhale through the left
- Close your left nostril, exhale through the right
- Inhale through the right, close it
- Exhale through the left

## 5. Belly Breathing

The simplest technique — perfect for beginners and daily practice.

- Place one hand on your chest, one on your belly
- Breathe so only your belly hand moves
- Practice for 5 minutes daily

## Try It Now

Head to the Zen Zone in THE VOID to practice guided versions of these techniques with visual timers and ambient sounds.`,
        category: "wellness",
        tags: ["breathing", "anxiety", "meditation", "calm"],
        metaDescription: "Learn 5 proven breathing techniques for anxiety relief including box breathing, 4-7-8 method, and physiological sigh.",
      },
      {
        slug: "emotional-intelligence-digital-age",
        title: "Emotional Intelligence in the Digital Age: Why AI Might Be Your Best Listener",
        excerpt: "How AI-powered emotional support tools are filling a gap in modern mental wellness without replacing human connection.",
        content: `## The Loneliness Paradox

We're more connected than ever, yet loneliness is at epidemic levels. Social media gives us audiences but rarely gives us listeners. The result? A generation that has plenty of followers but few people to truly talk to.

## The Judgment Gap

One of the biggest barriers to emotional expression is fear of judgment. Studies show that 67% of people hold back their true feelings because they worry about how others will react.

### Why We Bottle Up

- Fear of being seen as "too much"
- Worry about burdening friends and family
- Uncertainty about how emotions will be received
- Social pressure to "stay positive"

## Enter AI: The Non-Judgmental Space

AI doesn't judge. It doesn't get tired. It doesn't gossip. For many people, this creates a uniquely safe space for raw emotional expression.

## What AI Does Well

- Provides immediate availability — no scheduling, no waiting
- Offers consistent responses without emotional fatigue
- Creates a safe space free from social consequences
- Can adapt its communication style to what you need

## What AI Cannot Replace

- Deep human empathy built on shared experience
- Physical comfort (hugs, presence)
- Long-term therapeutic relationships
- Crisis intervention and clinical care

## The Hybrid Approach

The healthiest approach uses AI tools like THE VOID alongside human connection. Vent to the void when you need immediate release. Talk to your therapist for deeper work. Call a friend when you need to be seen.

## THE VOID's Philosophy

We built THE VOID not to replace human connection, but to complement it. Sometimes you need to process the raw emotion before you're ready to have a constructive conversation with the people in your life.`,
        category: "technology",
        tags: ["AI", "emotional-intelligence", "mental-health", "digital-wellness"],
        metaDescription: "Explore how AI emotional support tools complement human connection in modern mental wellness practices.",
      },
      {
        slug: "streak-habit-science",
        title: "The Psychology of Streaks: How Daily Habits Transform Mental Health",
        excerpt: "Why maintaining a daily venting streak can rewire your brain's approach to stress management.",
        content: `## The Power of Consistency

James Clear's research on habit formation shows that small, consistent actions compound into transformative change. A daily 2-minute vent might seem insignificant, but over 30 days it creates a new neural pathway for emotional processing.

## How Streaks Work in Your Brain

When you maintain a streak, your brain releases dopamine not just for the activity, but for the act of maintaining consistency. This creates a positive feedback loop.

### The Habit Loop

- Cue: Feeling stressed or frustrated
- Routine: Opening THE VOID and venting
- Reward: Emotional release + streak maintenance + AI response

## Why Streaks Are Powerful

- They reduce decision fatigue (you don't debate whether to do it)
- They build identity (you become "someone who processes emotions")
- They compound benefits over time
- They create accountability without judgment

## The Streak Sweet Spots

- 3 days: Initial momentum builds
- 7 days: Habit starts to feel natural
- 21 days: New neural pathways strengthen
- 30 days: The behavior becomes part of your identity

## Tips for Maintaining Your Streak

- Set a consistent time each day
- Start small — even a 30-second vent counts
- Use daily prompts when you're not sure what to say
- Don't break the chain — the streak itself becomes motivating

## Beyond Streaks: Mood Tracking

Pairing your streak with mood check-ins creates powerful self-awareness. Over time, you'll notice patterns in what triggers stress and how effectively venting resolves it.`,
        category: "psychology",
        tags: ["habits", "streaks", "psychology", "self-improvement"],
        metaDescription: "Learn the psychology behind streaks and daily habits, and how consistent emotional expression improves mental health.",
      },
    ];
    await db.insert(blogPosts).values(posts);
    console.log("[Blog] Seeded initial blog posts");
  } catch (e) { console.log("[Blog] Posts already seeded or error"); }
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

async function seedEcosystemMembers() {
  try {
    const bcrypt = await import("bcryptjs");
    const ecosystemMembers = [
      { firstName: "Kathy", lastName: "Nguyen", email: "kathy@happyeats.io",
        password: "HappyEats@2025", pin: "7724", trustLayerId: "tl-kathy-he01", ecosystemApp: "Happy Eats", username: "kathy.nguyen" },
      { firstName: "Marcus", lastName: "Chen", email: "marcus@trusthome.io",
        password: "TrustHome@2025", pin: "8832", trustLayerId: "tl-marcus-th01", ecosystemApp: "TrustHome", username: "marcus.chen" },
      { firstName: "Devon", lastName: "Blackwell", email: "devon@signal.dw",
        password: "Signal@2025", pin: "6619", trustLayerId: "tl-devon-sig01", ecosystemApp: "Signal", username: "devon.blackwell" },
    ];
    for (const m of ecosystemMembers) {
      const [existing] = await db.select().from(chatUsers).where(eq(chatUsers.email, m.email));
      if (existing) continue;
      const passwordHash = await bcrypt.hash(m.password, 12);
      const pinHash = await bcrypt.hash(m.pin, 12);
      await db.insert(chatUsers).values({
        username: m.username,
        email: m.email,
        passwordHash,
        displayName: `${m.firstName} ${m.lastName}`,
        trustLayerId: m.trustLayerId,
        ecosystemPinHash: pinHash,
        ecosystemApp: m.ecosystemApp,
      });
      console.log(`[Ecosystem Seed] Created ${m.ecosystemApp} member: ${m.email} (${m.trustLayerId})`);
    }
  } catch (e: any) {
    if (!e?.message?.includes("duplicate")) {
      console.error("[Ecosystem Seed] Error:", e?.message || e);
    }
  }
}
