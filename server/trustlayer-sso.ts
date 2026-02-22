import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "./db";
import { chatUsers } from "@shared/schema";
import { eq } from "drizzle-orm";

const JWT_SECRET = process.env.JWT_SECRET || "dev-jwt-secret-change-me";
const SALT_ROUNDS = 12;
const TOKEN_EXPIRY = "7d";

const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;

function generateTrustLayerId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  return `tl-${timestamp}-${random}`;
}

function generateAvatarColor(): string {
  const colors = ["#06b6d4", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#3b82f6", "#ef4444", "#6366f1"];
  return colors[Math.floor(Math.random() * colors.length)];
}

export function signToken(userId: string, trustLayerId: string, voidId?: string | null): string {
  const payload: any = { userId, trustLayerId, iss: "trust-layer-sso" };
  if (voidId) payload.voidId = voidId;
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
}

export function verifyToken(token: string): { userId: string; trustLayerId: string; voidId?: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (decoded.iss !== "trust-layer-sso") return null;
    return { userId: decoded.userId, trustLayerId: decoded.trustLayerId, voidId: decoded.voidId || undefined };
  } catch {
    return null;
  }
}

export function validatePassword(password: string): { valid: boolean; message: string } {
  if (!PASSWORD_REGEX.test(password)) {
    return {
      valid: false,
      message: "Password must be at least 8 characters with 1 uppercase letter and 1 special character.",
    };
  }
  return { valid: true, message: "" };
}

export async function registerUser(username: string, email: string, password: string, displayName: string) {
  const passwordCheck = validatePassword(password);
  if (!passwordCheck.valid) {
    return { success: false, error: passwordCheck.message };
  }

  const existing = await db.select().from(chatUsers).where(eq(chatUsers.username, username));
  if (existing.length > 0) {
    return { success: false, error: "Username already taken." };
  }

  const existingEmail = await db.select().from(chatUsers).where(eq(chatUsers.email, email));
  if (existingEmail.length > 0) {
    return { success: false, error: "Email already registered." };
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const trustLayerId = generateTrustLayerId();
  const avatarColor = generateAvatarColor();

  const [user] = await db.insert(chatUsers).values({
    username,
    email: email.toLowerCase(),
    passwordHash,
    displayName,
    avatarColor,
    trustLayerId,
  }).returning();

  const token = signToken(user.id, trustLayerId, user.voidId);

  return {
    success: true,
    user: {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      email: user.email,
      avatarColor: user.avatarColor,
      role: user.role,
      trustLayerId: user.trustLayerId,
      voidId: user.voidId || null,
    },
    token,
  };
}

export async function loginUser(username: string, password: string) {
  const [user] = await db.select().from(chatUsers).where(eq(chatUsers.username, username));
  if (!user) {
    return { success: false, error: "Invalid username or password." };
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return { success: false, error: "Invalid username or password." };
  }

  await db.update(chatUsers).set({ isOnline: true, lastSeen: new Date() }).where(eq(chatUsers.id, user.id));

  const token = signToken(user.id, user.trustLayerId || "", user.voidId);

  return {
    success: true,
    user: {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      email: user.email,
      avatarColor: user.avatarColor,
      role: user.role,
      trustLayerId: user.trustLayerId,
      voidId: user.voidId || null,
    },
    token,
  };
}

export async function ecosystemLogin(identifier: string, credential: string) {
  if (!identifier || !credential || typeof identifier !== "string" || typeof credential !== "string") {
    return { success: false, error: "Trust Layer ID or email and credential are required." };
  }
  const trimmedId = identifier.trim();
  const trimmedCred = credential.trim();
  if (!trimmedId || !trimmedCred) {
    return { success: false, error: "Trust Layer ID or email and credential are required." };
  }

  let user;
  if (trimmedId.startsWith("tl-")) {
    const [found] = await db.select().from(chatUsers).where(eq(chatUsers.trustLayerId, trimmedId));
    user = found;
  }
  if (!user) {
    const [found] = await db.select().from(chatUsers).where(eq(chatUsers.email, trimmedId.toLowerCase()));
    user = found;
  }
  if (!user) {
    return { success: false, error: "No ecosystem account found. Check your Trust Layer ID or email." };
  }
  if (!user.trustLayerId) {
    return { success: false, error: "This account is not linked to the Trust Layer ecosystem. Please sign in with your username and password instead." };
  }

  let authenticated = false;
  if (user.ecosystemPinHash && /^\d{4,8}$/.test(trimmedCred)) {
    authenticated = await bcrypt.compare(trimmedCred, user.ecosystemPinHash);
  }
  if (!authenticated) {
    authenticated = await bcrypt.compare(trimmedCred, user.passwordHash);
  }
  if (!authenticated) {
    return { success: false, error: "Invalid credential. Please check your password or ecosystem PIN." };
  }

  await db.update(chatUsers).set({ isOnline: true, lastSeen: new Date() }).where(eq(chatUsers.id, user.id));

  const token = signToken(user.id, user.trustLayerId, user.voidId);

  return {
    success: true,
    user: {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      email: user.email,
      avatarColor: user.avatarColor,
      role: user.role,
      trustLayerId: user.trustLayerId,
      voidId: user.voidId || null,
      ecosystemApp: user.ecosystemApp || null,
    },
    token,
  };
}

export async function getUserFromToken(token: string) {
  const decoded = verifyToken(token);
  if (!decoded) return null;

  const [user] = await db.select().from(chatUsers).where(eq(chatUsers.id, decoded.userId));
  if (!user) return null;

  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    email: user.email,
    avatarColor: user.avatarColor,
    role: user.role,
    trustLayerId: user.trustLayerId,
    voidId: user.voidId || null,
  };
}
