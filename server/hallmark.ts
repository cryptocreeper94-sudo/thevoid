import crypto from "crypto";
import { db } from "./db";
import { hallmarks, trustStamps, hallmarkCounter } from "@shared/schema";
import { eq, sql } from "drizzle-orm";

const APP_PREFIX = "VO";
const APP_NAME = "THE VOID";
const COUNTER_ID = "vo-master";

function generateDataHash(payload: Record<string, any>): string {
  const str = JSON.stringify(payload);
  return crypto.createHash("sha256").update(str).digest("hex");
}

function simulatedTxHash(): string {
  return "0x" + crypto.randomBytes(32).toString("hex");
}

function simulatedBlockHeight(): string {
  return String(Math.floor(1000000 + Math.random() * 9000000));
}

async function getNextSequence(): Promise<number> {
  const result = await db.execute(sql`
    INSERT INTO hallmark_counter (id, current_sequence)
    VALUES (${COUNTER_ID}, '1')
    ON CONFLICT (id) DO UPDATE
    SET current_sequence = (CAST(hallmark_counter.current_sequence AS INTEGER) + 1)::TEXT
    RETURNING current_sequence
  `);
  return parseInt((result as any).rows?.[0]?.current_sequence || (result as any)[0]?.current_sequence || "1", 10);
}

function formatHallmarkId(sequence: number): string {
  return `${APP_PREFIX}-${String(sequence).padStart(8, "0")}`;
}

export async function generateHallmark(params: {
  userId?: number | null;
  appId: string;
  productName: string;
  releaseType: string;
  metadata?: Record<string, any>;
}): Promise<typeof hallmarks.$inferSelect> {
  const sequence = await getNextSequence();
  const thId = formatHallmarkId(sequence);
  const timestamp = new Date().toISOString();

  const hashPayload = {
    thId,
    userId: params.userId || null,
    appId: params.appId,
    appName: APP_NAME,
    productName: params.productName,
    releaseType: params.releaseType,
    timestamp,
  };

  const dataHash = generateDataHash(hashPayload);
  const txHash = simulatedTxHash();
  const blockHeight = simulatedBlockHeight();

  const [hallmark] = await db.insert(hallmarks).values({
    thId,
    userId: params.userId || null,
    appId: params.appId,
    appName: APP_NAME,
    productName: params.productName,
    releaseType: params.releaseType,
    metadata: params.metadata || null,
    dataHash,
    txHash,
    blockHeight,
    verificationUrl: `/api/hallmark/${thId}/verify`,
    hallmarkId: sequence,
  }).returning();

  return hallmark;
}

export async function createTrustStamp(params: {
  userId?: number | null;
  category: string;
  data: Record<string, any>;
}): Promise<typeof trustStamps.$inferSelect> {
  const timestamp = new Date().toISOString();
  const stampData = {
    ...params.data,
    appContext: "thevoid",
    timestamp,
  };

  const dataHash = generateDataHash(stampData);
  const txHash = simulatedTxHash();
  const blockHeight = simulatedBlockHeight();

  const [stamp] = await db.insert(trustStamps).values({
    userId: params.userId || null,
    category: params.category,
    data: stampData,
    dataHash,
    txHash,
    blockHeight,
  }).returning();

  return stamp;
}

export async function seedGenesisHallmark(): Promise<void> {
  const genesisId = `${APP_PREFIX}-00000001`;

  const existing = await db.select().from(hallmarks).where(eq(hallmarks.thId, genesisId));
  if (existing.length > 0) {
    console.log(`Genesis hallmark ${genesisId} already exists.`);
    return;
  }

  await db.execute(sql`
    INSERT INTO hallmark_counter (id, current_sequence)
    VALUES (${COUNTER_ID}, '0')
    ON CONFLICT (id) DO UPDATE SET current_sequence = '0'
  `);

  const metadata = {
    ecosystem: "Trust Layer",
    version: "1.0.0",
    domain: "thevoid.tlid.io",
    operator: "DarkWave Studios LLC",
    chain: "Trust Layer Blockchain",
    consensus: "Proof of Trust",
    launchDate: "2026-08-23T00:00:00.000Z",
    nativeAsset: "SIG",
    utilityToken: "Shells",
    parentApp: "Trust Layer Hub",
    parentGenesis: "TH-00000001",
  };

  await generateHallmark({
    userId: null,
    appId: "thevoid-genesis",
    productName: "Genesis Block",
    releaseType: "genesis",
    metadata,
  });

  console.log(`Genesis hallmark ${genesisId} created successfully.`);
}

export async function verifyHallmark(hallmarkId: string): Promise<{
  verified: boolean;
  hallmark?: typeof hallmarks.$inferSelect;
  error?: string;
}> {
  const [record] = await db.select().from(hallmarks).where(eq(hallmarks.thId, hallmarkId));
  if (!record) {
    return { verified: false, error: "Hallmark not found" };
  }

  return {
    verified: true,
    hallmark: record,
  };
}

export async function getGenesisHallmark(): Promise<typeof hallmarks.$inferSelect | null> {
  const genesisId = `${APP_PREFIX}-00000001`;
  const [record] = await db.select().from(hallmarks).where(eq(hallmarks.thId, genesisId));
  return record || null;
}
