import crypto from "crypto";
import { db } from "./db";
import { voidStamps } from "@shared/schema";
import { eq, desc, count } from "drizzle-orm";

function computeStampHash(data: {
  voidId: string;
  userId: number;
  blockNumber: number;
  previousHash: string | null;
  timestamp: string;
}): string {
  const payload = JSON.stringify({
    voidId: data.voidId,
    userId: data.userId,
    block: data.blockNumber,
    prev: data.previousHash,
    ts: data.timestamp,
    issuer: "darkwave-studios-void",
    network: "trust-layer-v1",
  });
  return crypto.createHash("sha256").update(payload).digest("hex");
}

export async function mintVoidStamp(voidId: string, userId: number): Promise<{
  success: boolean;
  stamp?: typeof voidStamps.$inferSelect;
  error?: string;
}> {
  const existing = await db.select().from(voidStamps).where(eq(voidStamps.voidId, voidId));
  if (existing.length > 0) {
    return { success: true, stamp: existing[0] };
  }

  const lastStamp = await db.select().from(voidStamps).orderBy(desc(voidStamps.blockNumber)).limit(1);
  const blockNumber = lastStamp.length > 0 ? lastStamp[0].blockNumber + 1 : 1;
  const previousHash = lastStamp.length > 0 ? lastStamp[0].stampHash : null;
  const mintedAt = new Date().toISOString();

  const stampHash = computeStampHash({ voidId, userId, blockNumber, previousHash, timestamp: mintedAt });

  const payload = {
    voidId,
    userId,
    issuer: "DarkWave Studios",
    network: "Trust Layer v1",
    type: "VOID_PREMIUM_HALLMARK",
    mintedAt,
    ecosystem: "darkwave",
    standard: "DW-STAMP-1.0",
  };

  const [stamp] = await db.insert(voidStamps).values({
    voidId,
    userId,
    stampHash,
    blockNumber,
    previousHash,
    payload,
    verified: true,
  }).returning();

  return { success: true, stamp };
}

export async function verifyVoidStamp(voidId: string): Promise<{
  valid: boolean;
  stamp?: typeof voidStamps.$inferSelect;
  verification?: {
    hashMatch: boolean;
    chainIntegrity: boolean;
    issuer: string;
    network: string;
    blockNumber: number;
    mintedAt: string;
  };
}> {
  const [stamp] = await db.select().from(voidStamps).where(eq(voidStamps.voidId, voidId));
  if (!stamp) {
    return { valid: false };
  }

  const payload = stamp.payload as any;
  const mintedAt = payload?.mintedAt;
  if (!mintedAt) {
    return { valid: false, stamp };
  }

  const expectedHash = computeStampHash({
    voidId: stamp.voidId,
    userId: stamp.userId,
    blockNumber: stamp.blockNumber,
    previousHash: stamp.previousHash,
    timestamp: mintedAt,
  });

  const hashMatch = stamp.stampHash === expectedHash;

  let chainIntegrity = true;
  if (stamp.blockNumber === 1) {
    chainIntegrity = stamp.previousHash === null;
  } else if (stamp.previousHash) {
    const [prevStamp] = await db.select().from(voidStamps)
      .where(eq(voidStamps.stampHash, stamp.previousHash));
    if (!prevStamp) {
      chainIntegrity = false;
    } else if (prevStamp.blockNumber !== stamp.blockNumber - 1) {
      chainIntegrity = false;
    }
  }

  return {
    valid: stamp.verified === true && hashMatch && chainIntegrity,
    stamp,
    verification: {
      hashMatch,
      chainIntegrity,
      issuer: "DarkWave Studios",
      network: "Trust Layer v1",
      blockNumber: stamp.blockNumber,
      mintedAt,
    },
  };
}

export async function getStampChain(limit = 20): Promise<typeof voidStamps.$inferSelect[]> {
  return db.select().from(voidStamps).orderBy(desc(voidStamps.blockNumber)).limit(limit);
}

export async function getStampStats(): Promise<{
  totalStamps: number;
  latestBlock: number;
  chainHealth: string;
}> {
  const [countResult] = await db.select({ total: count() }).from(voidStamps);
  const [latest] = await db.select().from(voidStamps).orderBy(desc(voidStamps.blockNumber)).limit(1);

  return {
    totalStamps: countResult?.total || 0,
    latestBlock: latest?.blockNumber || 0,
    chainHealth: "healthy",
  };
}
