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
  isFounder: boolean("is_founder").default(false),
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

// === USER PERSONALITY TUNING SCHEMA ===
export const userSettings = pgTable("user_settings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique(),
  sarcasmLevel: integer("sarcasm_level").notNull().default(50),
  empathyLevel: integer("empathy_level").notNull().default(50),
  responseLength: text("response_length").notNull().default("medium"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserSettingsSchema = createInsertSchema(userSettings).omit({
  id: true,
  updatedAt: true,
});

export type UserSettings = typeof userSettings.$inferSelect;
export type InsertUserSettings = z.infer<typeof insertUserSettingsSchema>;

// === CREDIT PACKS SCHEMA ===
export const creditPacks = pgTable("credit_packs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  credits: integer("credits").notNull().default(0),
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type CreditPack = typeof creditPacks.$inferSelect;

export const userCredits = pgTable("user_credits", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique(),
  balance: integer("balance").notNull().default(0),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UserCredit = typeof userCredits.$inferSelect;

// === CONVERSATION THREADS SCHEMA ===
export const conversationThreads = pgTable("conversation_threads", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  personality: text("personality").notNull().default("smart-ass"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertConversationThreadSchema = createInsertSchema(conversationThreads).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type ConversationThread = typeof conversationThreads.$inferSelect;
export type InsertConversationThread = z.infer<typeof insertConversationThreadSchema>;

export const threadMessages = pgTable("thread_messages", {
  id: serial("id").primaryKey(),
  threadId: integer("thread_id").notNull().references(() => conversationThreads.id, { onDelete: "cascade" }),
  role: text("role").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertThreadMessageSchema = createInsertSchema(threadMessages).omit({
  id: true,
  createdAt: true,
});

export type ThreadMessage = typeof threadMessages.$inferSelect;
export type InsertThreadMessage = z.infer<typeof insertThreadMessageSchema>;

// === TRUST LAYER SSO & SIGNAL CHAT SCHEMA ===
export const chatUsers = pgTable("chat_users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  displayName: text("display_name").notNull(),
  avatarColor: text("avatar_color").notNull().default("#06b6d4"),
  role: text("role").notNull().default("member"),
  trustLayerId: text("trust_layer_id").unique(),
  voidId: varchar("void_id", { length: 12 }),
  isOnline: boolean("is_online").default(false),
  lastSeen: timestamp("last_seen").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertChatUserSchema = createInsertSchema(chatUsers).omit({
  id: true,
  avatarColor: true,
  role: true,
  trustLayerId: true,
  isOnline: true,
  lastSeen: true,
  createdAt: true,
});

export type ChatUser = typeof chatUsers.$inferSelect;
export type InsertChatUser = z.infer<typeof insertChatUserSchema>;

export const chatChannels = pgTable("chat_channels", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  description: text("description"),
  category: text("category").notNull().default("ecosystem"),
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export type ChatChannel = typeof chatChannels.$inferSelect;

export const chatMessages = pgTable("chat_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  channelId: varchar("channel_id").notNull(),
  userId: varchar("user_id").notNull(),
  content: text("content").notNull(),
  replyToId: varchar("reply_to_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type ChatMessage = typeof chatMessages.$inferSelect;

// === AFFILIATE REFERRALS SCHEMA ===
export const referrals = pgTable("referrals", {
  id: serial("id").primaryKey(),
  referrerVoidId: varchar("referrer_void_id", { length: 12 }).notNull(),
  referrerUserId: integer("referrer_user_id").notNull(),
  referredUserId: integer("referred_user_id").notNull(),
  referredSubscriptionId: integer("referred_subscription_id"),
  status: text("status").notNull().default("pending"),
  rewardCredited: boolean("reward_credited").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export type Referral = typeof referrals.$inferSelect;

// === BLOCKCHAIN HALLMARK / VOID STAMPS SCHEMA ===
export const voidStamps = pgTable("void_stamps", {
  id: serial("id").primaryKey(),
  voidId: varchar("void_id", { length: 12 }).notNull().unique(),
  userId: integer("user_id").notNull(),
  stampHash: text("stamp_hash").notNull().unique(),
  blockNumber: integer("block_number").notNull(),
  previousHash: text("previous_hash"),
  payload: jsonb("payload"),
  verified: boolean("verified").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export type VoidStamp = typeof voidStamps.$inferSelect;

// === GAMIFICATION: ACHIEVEMENTS & STREAKS ===
export const achievements = pgTable("achievements", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 50 }).notNull().unique(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  icon: text("icon").notNull().default("star"),
  category: text("category").notNull().default("general"),
  requirement: integer("requirement").notNull().default(1),
});

export type Achievement = typeof achievements.$inferSelect;

export const userAchievements = pgTable("user_achievements", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  achievementKey: varchar("achievement_key", { length: 50 }).notNull(),
  unlockedAt: timestamp("unlocked_at").defaultNow(),
});

export type UserAchievement = typeof userAchievements.$inferSelect;

export const ventStreaks = pgTable("vent_streaks", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique(),
  currentStreak: integer("current_streak").notNull().default(0),
  longestStreak: integer("longest_streak").notNull().default(0),
  lastVentDate: text("last_vent_date"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type VentStreak = typeof ventStreaks.$inferSelect;

export const dailyPrompts = pgTable("daily_prompts", {
  id: serial("id").primaryKey(),
  prompt: text("prompt").notNull(),
  category: text("category").notNull().default("general"),
  activeDate: text("active_date").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow(),
});

export type DailyPrompt = typeof dailyPrompts.$inferSelect;

export const moodChecks = pgTable("mood_checks", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  ventId: integer("vent_id"),
  moodBefore: integer("mood_before").notNull(),
  moodAfter: integer("mood_after"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type MoodCheck = typeof moodChecks.$inferSelect;

// === AI BLOG SCHEMA ===
export const blogPosts = pgTable("blog_posts", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 200 }).notNull().unique(),
  title: text("title").notNull(),
  excerpt: text("excerpt").notNull(),
  content: text("content").notNull(),
  category: text("category").notNull().default("wellness"),
  tags: text("tags").array().default(sql`'{}'::text[]`),
  metaDescription: text("meta_description"),
  published: boolean("published").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export type BlogPost = typeof blogPosts.$inferSelect;

// === API REQUEST/RESPONSE TYPES ===
export const createVentRequestSchema = z.object({
  audio: z.string(),
  personality: z.enum(['smart-ass', 'calming', 'therapist', 'hype-man', 'roast-master']),
  mimeType: z.string().optional().default("audio/webm"),
  extension: z.string().optional().default("webm"),
  userId: z.string().optional(),
  voicePreference: z.enum(['default', 'male', 'female']).optional().default('default'),
  sarcasmLevel: z.number().min(0).max(100).optional(),
  empathyLevel: z.number().min(0).max(100).optional(),
});

export type CreateVentRequest = z.infer<typeof createVentRequestSchema>;
