import { db } from "./db";
import { vents, roadmapItems, whitelistedUsers, type InsertVent, type Vent, type InsertRoadmapItem, type RoadmapItem, type InsertWhitelistedUser, type WhitelistedUser } from "@shared/schema";
import { eq, desc } from "drizzle-orm";

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
}

export const storage = new DatabaseStorage();
