import { db } from "./db";
import { vents, roadmapItems, type InsertVent, type Vent, type InsertRoadmapItem, type RoadmapItem } from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  createVent(vent: InsertVent): Promise<Vent>;
  getVents(): Promise<Vent[]>;
  getVent(id: number): Promise<Vent | undefined>;
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
  
  async getVents(): Promise<Vent[]> {
    return await db.select().from(vents).orderBy(desc(vents.createdAt));
  }
  
  async getVent(id: number): Promise<Vent | undefined> {
    const [vent] = await db.select().from(vents).where(eq(vents.id, id));
    return vent;
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
