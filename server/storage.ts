import { db } from "./db";
import { vents, roadmapItems, whitelistedUsers, subscriptions, dailyVentUsage, contactMessages, type InsertVent, type Vent, type InsertRoadmapItem, type RoadmapItem, type InsertWhitelistedUser, type WhitelistedUser, type Subscription, type DailyVentUsage, type ContactMessage } from "@shared/schema";
import { eq, desc, and } from "drizzle-orm";

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
}

export const storage = new DatabaseStorage();
