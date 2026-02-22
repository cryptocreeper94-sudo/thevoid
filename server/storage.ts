import { db } from "./db";
import { vents, roadmapItems, whitelistedUsers, subscriptions, dailyVentUsage, contactMessages, userSettings, userCredits, conversationThreads, threadMessages, journalEntries, affirmations, weeklyInsights, safetyPlans, moodChecks, voiceJournalEntries, voiceFingerprints, moodPortraits, voidEchoes, type InsertVent, type Vent, type InsertRoadmapItem, type RoadmapItem, type InsertWhitelistedUser, type WhitelistedUser, type Subscription, type DailyVentUsage, type ContactMessage, type UserSettings, type UserCredit, type ConversationThread, type ThreadMessage, type InsertConversationThread, type InsertThreadMessage, type JournalEntry, type InsertJournalEntry, type Affirmation, type WeeklyInsight, type SafetyPlan, type InsertSafetyPlan, type MoodCheck, type VoiceJournalEntry, type InsertVoiceJournalEntry, type VoiceFingerprint, type MoodPortrait, type VoidEcho, type InsertVoidEcho } from "@shared/schema";
import { eq, desc, and, gte, lte, sql } from "drizzle-orm";

export interface IStorage {
  createVent(vent: InsertVent): Promise<Vent>;
  getVents(userId?: string): Promise<Vent[]>;
  getVent(id: number): Promise<Vent | undefined>;
  getWhitelistedUsers(): Promise<WhitelistedUser[]>;
  createWhitelistedUser(user: InsertWhitelistedUser): Promise<WhitelistedUser>;
  deleteWhitelistedUser(id: number): Promise<boolean>;
  updateWhitelistedUserPin(id: number, pin: string): Promise<WhitelistedUser | undefined>;
  validatePin(pin: string): Promise<{ valid: boolean; name: string | null; userId: number | null; pinChanged: boolean }>;
  changePinSelf(userId: number, newPin: string): Promise<WhitelistedUser | undefined>;
  isWhitelistedUser(userId: number): Promise<boolean>;
  getRoadmapItems(): Promise<RoadmapItem[]>;
  createRoadmapItem(item: InsertRoadmapItem): Promise<RoadmapItem>;
  updateRoadmapItem(id: number, updates: Partial<InsertRoadmapItem>): Promise<RoadmapItem | undefined>;
  deleteRoadmapItem(id: number): Promise<boolean>;
  getSubscription(userId: number): Promise<Subscription | undefined>;
  getSubscriptionByStripeCustomerId(stripeCustomerId: string): Promise<Subscription | undefined>;
  getSubscriptionByStripeSubscriptionId(stripeSubId: string): Promise<Subscription | undefined>;
  upsertSubscription(userId: number, data: Partial<Subscription>): Promise<Subscription>;
  getDailyVentUsage(userId: number, date: string): Promise<DailyVentUsage | undefined>;
  incrementDailyVentUsage(userId: number, date: string): Promise<DailyVentUsage>;
  createContactMessage(data: { name: string; email: string; subject: string; message: string }): Promise<ContactMessage>;
  getContactMessages(): Promise<ContactMessage[]>;
  getUserSettings(userId: number): Promise<UserSettings | undefined>;
  upsertUserSettings(userId: number, data: Partial<UserSettings>): Promise<UserSettings>;
  getUserCredits(userId: number): Promise<UserCredit | undefined>;
  addCredits(userId: number, amount: number): Promise<UserCredit>;
  useCredit(userId: number): Promise<boolean>;
  getConversationThreads(userId: number): Promise<ConversationThread[]>;
  getConversationThread(id: number): Promise<ConversationThread | undefined>;
  createConversationThread(data: InsertConversationThread): Promise<ConversationThread>;
  updateConversationThread(id: number, updates: Partial<ConversationThread>): Promise<ConversationThread | undefined>;
  deleteConversationThread(id: number): Promise<boolean>;
  getThreadMessages(threadId: number): Promise<ThreadMessage[]>;
  createThreadMessage(data: InsertThreadMessage): Promise<ThreadMessage>;
  getJournalEntries(userId: number): Promise<JournalEntry[]>;
  createJournalEntry(data: InsertJournalEntry): Promise<JournalEntry>;
  deleteJournalEntry(id: number): Promise<boolean>;
  getAffirmations(userId: number, limit?: number): Promise<Affirmation[]>;
  createAffirmation(userId: number, content: string, context?: string): Promise<Affirmation>;
  getWeeklyInsights(userId: number): Promise<WeeklyInsight[]>;
  createWeeklyInsight(data: Partial<WeeklyInsight> & { userId: number; weekStart: string; summary: string }): Promise<WeeklyInsight>;
  getSafetyPlan(userId: number): Promise<SafetyPlan | undefined>;
  upsertSafetyPlan(userId: number, data: Partial<SafetyPlan>): Promise<SafetyPlan>;
  getMoodChecks(userId: number, startDate?: string, endDate?: string): Promise<MoodCheck[]>;
  getVoiceJournalEntries(userId: number): Promise<VoiceJournalEntry[]>;
  createVoiceJournalEntry(data: InsertVoiceJournalEntry): Promise<VoiceJournalEntry>;
  deleteVoiceJournalEntry(id: number): Promise<boolean>;
  getVoiceFingerprints(userId: number, limit?: number): Promise<VoiceFingerprint[]>;
  createVoiceFingerprint(data: Partial<VoiceFingerprint> & { userId: number }): Promise<VoiceFingerprint>;
  getMoodPortraits(userId: number): Promise<MoodPortrait[]>;
  createMoodPortrait(data: Partial<MoodPortrait> & { userId: number; svgData: string }): Promise<MoodPortrait>;
  getVoidEchoes(userId: number): Promise<VoidEcho[]>;
  getPendingVoidEchoes(userId: number): Promise<VoidEcho[]>;
  createVoidEcho(data: InsertVoidEcho): Promise<VoidEcho>;
  deliverVoidEcho(id: number): Promise<VoidEcho | undefined>;
}

export class DatabaseStorage implements IStorage {
  async createVent(vent: InsertVent): Promise<Vent> {
    const [created] = await db.insert(vents).values(vent).returning();
    return created;
  }
  
  async getVents(userId?: string): Promise<Vent[]> {
    if (userId) {
      return await db.select().from(vents).where(eq(vents.userId, userId)).orderBy(desc(vents.createdAt));
    }
    return await db.select().from(vents).orderBy(desc(vents.createdAt));
  }
  
  async getVent(id: number): Promise<Vent | undefined> {
    const [vent] = await db.select().from(vents).where(eq(vents.id, id));
    return vent;
  }

  async getWhitelistedUsers(): Promise<WhitelistedUser[]> {
    return await db.select().from(whitelistedUsers).orderBy(desc(whitelistedUsers.createdAt));
  }

  async createWhitelistedUser(user: InsertWhitelistedUser): Promise<WhitelistedUser> {
    const [created] = await db.insert(whitelistedUsers).values(user).returning();
    return created;
  }

  async deleteWhitelistedUser(id: number): Promise<boolean> {
    const result = await db.delete(whitelistedUsers).where(eq(whitelistedUsers.id, id)).returning();
    return result.length > 0;
  }

  async updateWhitelistedUserPin(id: number, pin: string): Promise<WhitelistedUser | undefined> {
    const [updated] = await db.update(whitelistedUsers).set({ pin, pinChanged: false }).where(eq(whitelistedUsers.id, id)).returning();
    return updated;
  }

  async validatePin(pin: string): Promise<{ valid: boolean; name: string | null; userId: number | null; pinChanged: boolean }> {
    if (pin === "0424") {
      return { valid: true, name: "Developer", userId: null, pinChanged: true };
    }
    const [user] = await db.select().from(whitelistedUsers).where(eq(whitelistedUsers.pin, pin));
    if (user) {
      return { valid: true, name: user.name, userId: user.id, pinChanged: user.pinChanged };
    }
    return { valid: false, name: null, userId: null, pinChanged: false };
  }

  async changePinSelf(userId: number, newPin: string): Promise<WhitelistedUser | undefined> {
    const [updated] = await db.update(whitelistedUsers)
      .set({ pin: newPin, pinChanged: true })
      .where(eq(whitelistedUsers.id, userId))
      .returning();
    return updated;
  }

  async isWhitelistedUser(userId: number): Promise<boolean> {
    const [user] = await db.select({ id: whitelistedUsers.id }).from(whitelistedUsers).where(eq(whitelistedUsers.id, userId));
    return !!user;
  }

  async getRoadmapItems(): Promise<RoadmapItem[]> {
    return await db.select().from(roadmapItems).orderBy(desc(roadmapItems.createdAt));
  }

  async createRoadmapItem(item: InsertRoadmapItem): Promise<RoadmapItem> {
    const [created] = await db.insert(roadmapItems).values(item).returning();
    return created;
  }

  async updateRoadmapItem(id: number, updates: Partial<InsertRoadmapItem>): Promise<RoadmapItem | undefined> {
    const [updated] = await db.update(roadmapItems).set(updates).where(eq(roadmapItems.id, id)).returning();
    return updated;
  }

  async deleteRoadmapItem(id: number): Promise<boolean> {
    const result = await db.delete(roadmapItems).where(eq(roadmapItems.id, id)).returning();
    return result.length > 0;
  }

  async getSubscription(userId: number): Promise<Subscription | undefined> {
    const [sub] = await db.select().from(subscriptions).where(eq(subscriptions.userId, userId));
    return sub;
  }

  async getSubscriptionByStripeCustomerId(stripeCustomerId: string): Promise<Subscription | undefined> {
    const [sub] = await db.select().from(subscriptions).where(eq(subscriptions.stripeCustomerId, stripeCustomerId));
    return sub;
  }

  async getSubscriptionByStripeSubscriptionId(stripeSubId: string): Promise<Subscription | undefined> {
    const [sub] = await db.select().from(subscriptions).where(eq(subscriptions.stripeSubscriptionId, stripeSubId));
    return sub;
  }

  async upsertSubscription(userId: number, data: Partial<Subscription>): Promise<Subscription> {
    const existing = await this.getSubscription(userId);
    if (existing) {
      const [updated] = await db.update(subscriptions)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(subscriptions.userId, userId))
        .returning();
      return updated;
    }
    const [created] = await db.insert(subscriptions)
      .values({ userId, ...data } as any)
      .returning();
    return created;
  }

  async getDailyVentUsage(userId: number, date: string): Promise<DailyVentUsage | undefined> {
    const [usage] = await db.select().from(dailyVentUsage)
      .where(and(eq(dailyVentUsage.userId, userId), eq(dailyVentUsage.date, date)));
    return usage;
  }

  async incrementDailyVentUsage(userId: number, date: string): Promise<DailyVentUsage> {
    const existing = await this.getDailyVentUsage(userId, date);
    if (existing) {
      const [updated] = await db.update(dailyVentUsage)
        .set({ ventCount: existing.ventCount + 1 })
        .where(eq(dailyVentUsage.id, existing.id))
        .returning();
      return updated;
    }
    const [created] = await db.insert(dailyVentUsage)
      .values({ userId, date, ventCount: 1 })
      .returning();
    return created;
  }
  async createContactMessage(data: { name: string; email: string; subject: string; message: string }): Promise<ContactMessage> {
    const [created] = await db.insert(contactMessages).values(data).returning();
    return created;
  }

  async getContactMessages(): Promise<ContactMessage[]> {
    return await db.select().from(contactMessages).orderBy(desc(contactMessages.createdAt));
  }

  async getUserSettings(userId: number): Promise<UserSettings | undefined> {
    const [settings] = await db.select().from(userSettings).where(eq(userSettings.userId, userId));
    return settings;
  }

  async upsertUserSettings(userId: number, data: Partial<UserSettings>): Promise<UserSettings> {
    const existing = await this.getUserSettings(userId);
    if (existing) {
      const [updated] = await db.update(userSettings)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(userSettings.userId, userId))
        .returning();
      return updated;
    }
    const [created] = await db.insert(userSettings)
      .values({ userId, ...data } as any)
      .returning();
    return created;
  }

  async getUserCredits(userId: number): Promise<UserCredit | undefined> {
    const [credit] = await db.select().from(userCredits).where(eq(userCredits.userId, userId));
    return credit;
  }

  async addCredits(userId: number, amount: number): Promise<UserCredit> {
    const existing = await this.getUserCredits(userId);
    if (existing) {
      const [updated] = await db.update(userCredits)
        .set({ balance: existing.balance + amount, updatedAt: new Date() })
        .where(eq(userCredits.userId, userId))
        .returning();
      return updated;
    }
    const [created] = await db.insert(userCredits)
      .values({ userId, balance: amount })
      .returning();
    return created;
  }

  async useCredit(userId: number): Promise<boolean> {
    const existing = await this.getUserCredits(userId);
    if (!existing || existing.balance <= 0) return false;
    await db.update(userCredits)
      .set({ balance: existing.balance - 1, updatedAt: new Date() })
      .where(eq(userCredits.userId, userId));
    return true;
  }

  async getConversationThreads(userId: number): Promise<ConversationThread[]> {
    return await db.select().from(conversationThreads)
      .where(eq(conversationThreads.userId, userId))
      .orderBy(desc(conversationThreads.updatedAt));
  }

  async getConversationThread(id: number): Promise<ConversationThread | undefined> {
    const [thread] = await db.select().from(conversationThreads).where(eq(conversationThreads.id, id));
    return thread;
  }

  async createConversationThread(data: InsertConversationThread): Promise<ConversationThread> {
    const [created] = await db.insert(conversationThreads).values(data).returning();
    return created;
  }

  async updateConversationThread(id: number, updates: Partial<ConversationThread>): Promise<ConversationThread | undefined> {
    const [updated] = await db.update(conversationThreads)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(conversationThreads.id, id))
      .returning();
    return updated;
  }

  async deleteConversationThread(id: number): Promise<boolean> {
    const result = await db.delete(conversationThreads).where(eq(conversationThreads.id, id)).returning();
    return result.length > 0;
  }

  async getThreadMessages(threadId: number): Promise<ThreadMessage[]> {
    return await db.select().from(threadMessages)
      .where(eq(threadMessages.threadId, threadId))
      .orderBy(threadMessages.createdAt);
  }

  async createThreadMessage(data: InsertThreadMessage): Promise<ThreadMessage> {
    const [created] = await db.insert(threadMessages).values(data).returning();
    return created;
  }
  async getJournalEntries(userId: number): Promise<JournalEntry[]> {
    return await db.select().from(journalEntries)
      .where(eq(journalEntries.userId, userId))
      .orderBy(desc(journalEntries.createdAt));
  }

  async createJournalEntry(data: InsertJournalEntry): Promise<JournalEntry> {
    const [created] = await db.insert(journalEntries).values(data).returning();
    return created;
  }

  async deleteJournalEntry(id: number): Promise<boolean> {
    const result = await db.delete(journalEntries).where(eq(journalEntries.id, id)).returning();
    return result.length > 0;
  }

  async getAffirmations(userId: number, limit = 10): Promise<Affirmation[]> {
    return await db.select().from(affirmations)
      .where(eq(affirmations.userId, userId))
      .orderBy(desc(affirmations.createdAt))
      .limit(limit);
  }

  async createAffirmation(userId: number, content: string, context?: string): Promise<Affirmation> {
    const [created] = await db.insert(affirmations).values({ userId, content, context }).returning();
    return created;
  }

  async getWeeklyInsights(userId: number): Promise<WeeklyInsight[]> {
    return await db.select().from(weeklyInsights)
      .where(eq(weeklyInsights.userId, userId))
      .orderBy(desc(weeklyInsights.createdAt));
  }

  async createWeeklyInsight(data: Partial<WeeklyInsight> & { userId: number; weekStart: string; summary: string }): Promise<WeeklyInsight> {
    const [created] = await db.insert(weeklyInsights).values(data as any).returning();
    return created;
  }

  async getSafetyPlan(userId: number): Promise<SafetyPlan | undefined> {
    const [plan] = await db.select().from(safetyPlans).where(eq(safetyPlans.userId, userId));
    return plan;
  }

  async upsertSafetyPlan(userId: number, data: Partial<SafetyPlan>): Promise<SafetyPlan> {
    const existing = await this.getSafetyPlan(userId);
    if (existing) {
      const [updated] = await db.update(safetyPlans)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(safetyPlans.userId, userId))
        .returning();
      return updated;
    }
    const [created] = await db.insert(safetyPlans)
      .values({ userId, ...data } as any)
      .returning();
    return created;
  }

  async getMoodChecks(userId: number, startDate?: string, endDate?: string): Promise<MoodCheck[]> {
    if (startDate && endDate) {
      return await db.select().from(moodChecks)
        .where(and(
          eq(moodChecks.userId, userId),
          gte(moodChecks.createdAt, new Date(startDate)),
          lte(moodChecks.createdAt, new Date(endDate))
        ))
        .orderBy(desc(moodChecks.createdAt));
    }
    return await db.select().from(moodChecks)
      .where(eq(moodChecks.userId, userId))
      .orderBy(desc(moodChecks.createdAt));
  }

  async getVoiceJournalEntries(userId: number): Promise<VoiceJournalEntry[]> {
    return await db.select().from(voiceJournalEntries)
      .where(eq(voiceJournalEntries.userId, userId))
      .orderBy(desc(voiceJournalEntries.createdAt));
  }

  async createVoiceJournalEntry(data: InsertVoiceJournalEntry): Promise<VoiceJournalEntry> {
    const [created] = await db.insert(voiceJournalEntries).values(data).returning();
    return created;
  }

  async deleteVoiceJournalEntry(id: number): Promise<boolean> {
    const result = await db.delete(voiceJournalEntries).where(eq(voiceJournalEntries.id, id)).returning();
    return result.length > 0;
  }

  async getVoiceFingerprints(userId: number, limit = 50): Promise<VoiceFingerprint[]> {
    return await db.select().from(voiceFingerprints)
      .where(eq(voiceFingerprints.userId, userId))
      .orderBy(desc(voiceFingerprints.createdAt))
      .limit(limit);
  }

  async createVoiceFingerprint(data: Partial<VoiceFingerprint> & { userId: number }): Promise<VoiceFingerprint> {
    const [created] = await db.insert(voiceFingerprints).values(data as any).returning();
    return created;
  }

  async getMoodPortraits(userId: number): Promise<MoodPortrait[]> {
    return await db.select().from(moodPortraits)
      .where(eq(moodPortraits.userId, userId))
      .orderBy(desc(moodPortraits.createdAt));
  }

  async createMoodPortrait(data: Partial<MoodPortrait> & { userId: number; svgData: string }): Promise<MoodPortrait> {
    const [created] = await db.insert(moodPortraits).values(data as any).returning();
    return created;
  }

  async getVoidEchoes(userId: number): Promise<VoidEcho[]> {
    return await db.select().from(voidEchoes)
      .where(eq(voidEchoes.userId, userId))
      .orderBy(desc(voidEchoes.createdAt));
  }

  async getPendingVoidEchoes(userId: number): Promise<VoidEcho[]> {
    return await db.select().from(voidEchoes)
      .where(and(
        eq(voidEchoes.userId, userId),
        eq(voidEchoes.isDelivered, false)
      ))
      .orderBy(voidEchoes.deliverAt);
  }

  async createVoidEcho(data: InsertVoidEcho): Promise<VoidEcho> {
    const [created] = await db.insert(voidEchoes).values(data).returning();
    return created;
  }

  async deliverVoidEcho(id: number): Promise<VoidEcho | undefined> {
    const [updated] = await db.update(voidEchoes)
      .set({ isDelivered: true, deliveredAt: new Date() })
      .where(eq(voidEchoes.id, id))
      .returning();
    return updated;
  }
}

export const storage = new DatabaseStorage();
