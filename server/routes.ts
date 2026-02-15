import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import OpenAI from "openai";
import { createVentRequestSchema, insertRoadmapItemSchema } from "@shared/schema";
import { registerChatRoutes } from "./replit_integrations/chat";
import { setupAuth, registerAuthRoutes } from "./replit_integrations/auth";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  // Set up Auth first
  await setupAuth(app);
  registerAuthRoutes(app);

  // Use the chat routes from the integration for general chat
  // Note: registerChatRoutes takes app: Express
  registerChatRoutes(app);

  app.post("/api/vents", async (req, res) => {
    try {
      const { audio, personality } = createVentRequestSchema.parse(req.body);

      // 1. Transcribe Audio (STT)
      const transcript = await transcribeAudio(audio);
      if (!transcript) {
        return res.status(400).json({ message: "Could not transcribe audio" });
      }

      // 2. Generate Response (based on personality)
      const systemPrompt = getPersonalityPrompt(personality);
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
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

// Helper: Personality Prompts
function getPersonalityPrompt(personality: string): string {
  switch (personality) {
    case 'smart-ass':
      return "You are a sarcastic, witty, slightly rude friend. The user is venting to you. Listen to their rant, validate it in a snarky way, and make a joke at their expense or the situation's expense. Keep it short and punchy.";
    case 'calming':
      return "You are a soothing, meditative guide. The user is venting. Listen deeply, validate their feelings with immense empathy, and offer a very short, simple grounding exercise or comforting thought. Speak softly (in text).";
    case 'therapist':
      return "You are a professional, analytical therapist. Listen to the user's vent. Identify the core emotion. Ask one reflective question to help them process it. Keep it professional but warm.";
    case 'hype-man':
      return "You are the ultimate hype man! High energy! All caps energy (sometimes)! The user is venting. Validate their anger! Tell them they are right! Get them pumped up to handle it! Let's go!";
    default:
      return "You are a helpful listener.";
  }
}

// Helper: Audio Transcription
async function transcribeAudio(base64Audio: string): Promise<string | null> {
  try {
    // Basic transcription using OpenAI's whisper model via the integration
    // Note: The integration handles file conversion, but here we might need a temporary file approach
    // For MVP, let's assume the integration's `speechToText` helper works with buffers.
    
    // We need to import the helper from the integration file we created earlier
    // But since I cannot import dynamically easily here without relative paths being perfect,
    // I will use the OpenAI client directly for transcription if possible, or mock it for the MVP
    // if the audio format is tricky. 
    
    // Actually, let's try to use the `server/replit_integrations/audio/client.ts` helper if it exists.
    // If not, we'll fall back to a direct API call.
    
    // Convert base64 to buffer
    const audioBuffer = Buffer.from(base64Audio, "base64");
    
    // Create a File object-like structure for OpenAI API
    // Since `toFile` is available in 'openai' package
    const file = await OpenAI.toFile(audioBuffer, "audio.webm", { type: "audio/webm" });

    const response = await openai.audio.transcriptions.create({
      file,
      model: "whisper-1",
    });
    
    return response.text;
  } catch (e) {
    console.error("Transcription error:", e);
    return null;
  }
}
