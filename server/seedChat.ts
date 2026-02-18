import { db } from "./db";
import { chatChannels } from "@shared/schema";
import { eq } from "drizzle-orm";

const DEFAULT_CHANNELS = [
  { name: "general", description: "General discussion for all THE VOID members", category: "ecosystem", isDefault: true },
  { name: "announcements", description: "Official announcements from DarkWave Studios", category: "ecosystem", isDefault: false },
  { name: "darkwavestudios-support", description: "Support for DarkWave Studios products", category: "app-support", isDefault: false },
  { name: "garagebot-support", description: "Support for GarageBot.io", category: "app-support", isDefault: false },
  { name: "tlid-marketing", description: "Trust Layer ID marketing and updates", category: "app-support", isDefault: false },
  { name: "guardian-ai", description: "Guardian AI discussion and support", category: "app-support", isDefault: false },
];

export async function seedChatChannels() {
  try {
    for (const channel of DEFAULT_CHANNELS) {
      const existing = await db.select().from(chatChannels).where(eq(chatChannels.name, channel.name));
      if (existing.length === 0) {
        await db.insert(chatChannels).values(channel);
        console.log(`[Chat Seed] Created channel: #${channel.name}`);
      }
    }
    console.log("[Chat Seed] Channel seeding complete");
  } catch (err) {
    console.error("[Chat Seed] Error seeding channels:", err);
  }
}
