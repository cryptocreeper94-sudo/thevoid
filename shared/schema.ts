import { pgTable, text, serial, timestamp, boolean, varchar, jsonb, integer, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { sql } from "drizzle-orm";

// === VENTS SCHEMA ===
export const vents = pgTable("vents", {
  id: serial("id").primaryKey(),
  userId: text("user_id"), // Optional: if we add auth later
  audioUrl: text("audio_url"), // Optional: if we store recordings
  transcript: text("transcript").notNull(),
  response: text("response").notNull(),
  personality: text("personality").notNull(), // 'smart-ass', 'calming', etc.
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertVentSchema = createInsertSchema(vents).omit({ 
  id: true, 
  createdAt: true 
});

export type Vent = typeof vents.$inferSelect;
export type InsertVent = z.infer<typeof insertVentSchema>;

// === REPLIT AUTH SCHEMA (MANDATORY) ===
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)]
);

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// === CHAT INTEGRATION SCHEMA (MANDATORY FOR CHAT MODULE) ===
export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
  role: text("role").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// === WHITELISTED USERS SCHEMA ===
export const whitelistedUsers = pgTable("whitelisted_users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  pin: varchar("pin", { length: 4 }).notNull(),
  pinChanged: boolean("pin_changed").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertWhitelistedUserSchema = createInsertSchema(whitelistedUsers).omit({
  id: true,
  pinChanged: true,
  createdAt: true,
});

export type WhitelistedUser = typeof whitelistedUsers.$inferSelect;
export type InsertWhitelistedUser = z.infer<typeof insertWhitelistedUserSchema>;

// === ROADMAP SCHEMA ===
export const roadmapItems = pgTable("roadmap_items", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").notNull().default("planned"),
  priority: text("priority").notNull().default("medium"),
  category: text("category").notNull().default("feature"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertRoadmapItemSchema = createInsertSchema(roadmapItems).omit({
  id: true,
  createdAt: true,
});

export type RoadmapItem = typeof roadmapItems.$inferSelect;
export type InsertRoadmapItem = z.infer<typeof insertRoadmapItemSchema>;

// === SUBSCRIPTIONS SCHEMA ===
export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  voidId: varchar("void_id", { length: 12 }).unique(),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  stripePriceId: text("stripe_price_id"),
  status: text("status").notNull().default("free"),
  currentPeriodEnd: timestamp("current_period_end"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type Subscription = typeof subscriptions.$inferSelect;

// === DAILY VENT USAGE SCHEMA ===
export const dailyVentUsage = pgTable("daily_vent_usage", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  date: text("date").notNull(),
  ventCount: integer("vent_count").notNull().default(0),
});

export type DailyVentUsage = typeof dailyVentUsage.$inferSelect;

// === CONTACT MESSAGES SCHEMA ===
export const contactMessages = pgTable("contact_messages", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  subject: text("subject").notNull().default("general"),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export type ContactMessage = typeof contactMessages.$inferSelect;

// === API REQUEST/RESPONSE TYPES ===
export const createVentRequestSchema = z.object({
  audio: z.string(),
  personality: z.enum(['smart-ass', 'calming', 'therapist', 'hype-man', 'roast-master']),
  mimeType: z.string().optional().default("audio/webm"),
  extension: z.string().optional().default("webm"),
  userId: z.string().optional(),
  voicePreference: z.enum(['default', 'male', 'female']).optional().default('default'),
});

export type CreateVentRequest = z.infer<typeof createVentRequestSchema>;
