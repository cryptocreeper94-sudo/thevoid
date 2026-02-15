import { db } from "./db";
import { vents, type InsertVent, type Vent } from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  createVent(vent: InsertVent): Promise<Vent>;
  getVents(): Promise<Vent[]>;
  getVent(id: number): Promise<Vent | undefined>;
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
}

export const storage = new DatabaseStorage();
