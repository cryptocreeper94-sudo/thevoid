import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { createVentRequestSchema, insertRoadmapItemSchema, insertWhitelistedUserSchema } from "@shared/schema";
import { registerChatRoutes } from "./replit_integrations/chat";
import { setupAuth, registerAuthRoutes } from "./replit_integrations/auth";
import { openai, speechToText, ensureCompatibleFormat } from "./replit_integrations/audio/client";

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  // Set up Auth first
  await setupAuth(app);
  registerAuthRoutes(app);

  // Use the chat routes from the integration for general chat
  // Note: registerChatRoutes takes app: Express
  registerChatRoutes(app);

  app.get("/api/vents", async (_req, res) => {
    try {
      const ventList = await storage.getVents();
      res.json(ventList);
    } catch (error) {
      console.error("Get vents error:", error);
      res.status(500).json({ message: "Failed to fetch vents" });
    }
  });

  app.post("/api/vents", async (req, res) => {
    try {
      const { audio, personality, mimeType, extension } = createVentRequestSchema.parse(req.body);

      // 1. Transcribe Audio (STT)
      const transcript = await transcribeAudio(audio, mimeType || "audio/webm", extension || "webm");
      if (transcript === null) {
        return res.status(400).json({ message: "Could not transcribe audio. Please check your microphone and try again." });
      }
      if (!transcript.trim()) {
        return res.status(400).json({ message: "No speech detected. Please speak louder or closer to your microphone." });
      }

      // 2. Generate Response (based on personality)
      const systemPrompt = getPersonalityPrompt(personality);
      const completion = await openai.chat.completions.create({
        model: "gpt-5.2",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: transcript },
        ],
      });
      const responseText = completion.choices[0]?.message?.content || "Whoops, I zoned out.";

      // 3. Generate Audio Response (TTS) - Optional but requested
      // We'll skip complex TTS for MVP unless user insists, or use the integration's TTS if available.
      // For now, let's stick to text response + transcript to be safe and fast.
      
      // 4. Save to DB
      const vent = await storage.createVent({
        transcript,
        response: responseText,
        personality,
        audioUrl: null, // Not storing audio yet to save space/complexity
        userId: null,
      });

      res.status(200).json({
        transcript,
        response: responseText,
        // audioResponse: base64Audio // Future feature
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
   - 988 Suicide & Crisis Lifeline: Call or text 988 (available 24/7)
   - Crisis Text Line: Text HOME to 741741
   - SAMHSA National Helpline: 1-800-662-4357
   - If in immediate danger, call 911
7. You validate feelings — you NEVER validate harmful actions. It is okay to be angry. It is NEVER okay to act on anger in ways that hurt people, animals, or yourself.
8. Even in your most sarcastic, hype, or casual personality mode, safety and positivity always come first. No exceptions. Keep it fun, keep it cathartic, keep it safe.

`;

// Helper: Personality Prompts
function getPersonalityPrompt(personality: string): string {
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
  return SAFETY_PREAMBLE + personalityPrompt;
}

async function transcribeAudio(base64Audio: string, mimeType: string, extension: string): Promise<string | null> {
  try {
    const audioBuffer = Buffer.from(base64Audio, "base64");

    if (audioBuffer.length < 100) {
      console.error("Audio buffer too small:", audioBuffer.length, "bytes");
      return null;
    }

    console.log(`Transcribing audio: ${audioBuffer.length} bytes, mime: ${mimeType}, ext: ${extension}`);

    const { buffer: compatibleBuffer, format } = await ensureCompatibleFormat(audioBuffer);
    console.log(`Converted to ${format}, ${compatibleBuffer.length} bytes`);

    const transcript = await speechToText(compatibleBuffer, format);
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
