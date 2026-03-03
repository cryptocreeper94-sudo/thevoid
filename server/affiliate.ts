import { Router, Request, Response } from "express";
import { db } from "./db";
import { affiliateReferrals, affiliateCommissions, whitelistedUsers } from "@shared/schema";
import { eq, and, sql, count, sum } from "drizzle-orm";
import { createTrustStamp } from "./hallmark";

const router = Router();

const COMMISSION_TIERS = [
  { name: "diamond", minReferrals: 50, rate: 0.20 },
  { name: "platinum", minReferrals: 30, rate: 0.175 },
  { name: "gold", minReferrals: 15, rate: 0.15 },
  { name: "silver", minReferrals: 5, rate: 0.125 },
  { name: "base", minReferrals: 0, rate: 0.10 },
];

function computeTier(convertedCount: number): { name: string; rate: number } {
  for (const tier of COMMISSION_TIERS) {
    if (convertedCount >= tier.minReferrals) {
      return tier;
    }
  }
  return COMMISSION_TIERS[COMMISSION_TIERS.length - 1];
}

function getNextTier(currentTier: string): { name: string; minReferrals: number; rate: number } | null {
  const idx = COMMISSION_TIERS.findIndex(t => t.name === currentTier);
  if (idx <= 0) return null;
  return COMMISSION_TIERS[idx - 1];
}

router.get("/api/affiliate/dashboard", async (req: Request, res: Response) => {
  const userId = req.query.userId as string;
  if (!userId) {
    return res.status(400).json({ error: "userId is required" });
  }

  const uid = parseInt(userId, 10);
  if (isNaN(uid)) {
    return res.status(400).json({ error: "Invalid userId" });
  }

  const [user] = await db.select().from(whitelistedUsers).where(eq(whitelistedUsers.id, uid));
  if (!user || !user.uniqueHash) {
    return res.status(404).json({ error: "User not found or no affiliate hash" });
  }

  const allReferrals = await db.select().from(affiliateReferrals)
    .where(eq(affiliateReferrals.referrerId, uid));

  const convertedCount = allReferrals.filter(r => r.status === "converted").length;
  const pendingCount = allReferrals.filter(r => r.status === "pending").length;
  const tier = computeTier(convertedCount);
  const nextTier = getNextTier(tier.name);

  const allCommissions = await db.select().from(affiliateCommissions)
    .where(eq(affiliateCommissions.referrerId, uid));

  const pendingEarnings = allCommissions
    .filter(c => c.status === "pending")
    .reduce((sum, c) => sum + parseFloat(c.amount), 0);

  const paidEarnings = allCommissions
    .filter(c => c.status === "paid")
    .reduce((sum, c) => sum + parseFloat(c.amount), 0);

  res.json({
    uniqueHash: user.uniqueHash,
    referralLink: `https://thevoid.tlid.io/ref/${user.uniqueHash}`,
    crossPlatformLinks: {
      thevoid: `https://thevoid.tlid.io/ref/${user.uniqueHash}`,
      trusthub: `https://trusthub.tlid.io/ref/${user.uniqueHash}`,
      trustvault: `https://trustvault.tlid.io/ref/${user.uniqueHash}`,
      signal: `https://signalchat.tlid.io/ref/${user.uniqueHash}`,
    },
    tier: tier.name,
    commissionRate: tier.rate,
    nextTier: nextTier ? {
      name: nextTier.name,
      referralsNeeded: nextTier.minReferrals - convertedCount,
      rate: nextTier.rate,
    } : null,
    stats: {
      totalReferrals: allReferrals.length,
      converted: convertedCount,
      pending: pendingCount,
      pendingEarnings: pendingEarnings.toFixed(2),
      paidEarnings: paidEarnings.toFixed(2),
      totalEarnings: (pendingEarnings + paidEarnings).toFixed(2),
    },
    recentReferrals: allReferrals.slice(-10).reverse(),
    recentCommissions: allCommissions.slice(-10).reverse(),
    tiers: COMMISSION_TIERS.map(t => ({
      name: t.name,
      minReferrals: t.minReferrals,
      rate: `${(t.rate * 100).toFixed(1)}%`,
      current: t.name === tier.name,
    })),
  });
});

router.get("/api/affiliate/link", async (req: Request, res: Response) => {
  const userId = req.query.userId as string;
  if (!userId) {
    return res.status(400).json({ error: "userId is required" });
  }

  const uid = parseInt(userId, 10);
  const [user] = await db.select().from(whitelistedUsers).where(eq(whitelistedUsers.id, uid));
  if (!user || !user.uniqueHash) {
    return res.status(404).json({ error: "User not found or no affiliate hash" });
  }

  res.json({
    uniqueHash: user.uniqueHash,
    referralLink: `https://thevoid.tlid.io/ref/${user.uniqueHash}`,
    crossPlatformLinks: {
      thevoid: `https://thevoid.tlid.io/ref/${user.uniqueHash}`,
      trusthub: `https://trusthub.tlid.io/ref/${user.uniqueHash}`,
      trustvault: `https://trustvault.tlid.io/ref/${user.uniqueHash}`,
      signal: `https://signalchat.tlid.io/ref/${user.uniqueHash}`,
    },
    shareText: `Join me on THE VOID — part of the Trust Layer ecosystem!\nhttps://thevoid.tlid.io/ref/${user.uniqueHash}`,
  });
});

router.post("/api/affiliate/track", async (req: Request, res: Response) => {
  const { referralHash, platform } = req.body;
  if (!referralHash) {
    return res.status(400).json({ error: "referralHash is required" });
  }

  const [referrer] = await db.select().from(whitelistedUsers)
    .where(eq(whitelistedUsers.uniqueHash, referralHash));

  if (!referrer) {
    return res.status(404).json({ error: "Referral hash not found" });
  }

  const [referral] = await db.insert(affiliateReferrals).values({
    referrerId: referrer.id,
    referralHash,
    platform: platform || "thevoid",
    status: "pending",
  }).returning();

  res.json({ success: true, referralId: referral.id });
});

router.post("/api/affiliate/request-payout", async (req: Request, res: Response) => {
  const { userId } = req.body;
  if (!userId) {
    return res.status(400).json({ error: "userId is required" });
  }

  const uid = parseInt(userId, 10);

  const pendingCommissions = await db.select().from(affiliateCommissions)
    .where(and(
      eq(affiliateCommissions.referrerId, uid),
      eq(affiliateCommissions.status, "pending")
    ));

  const totalPending = pendingCommissions.reduce((sum, c) => sum + parseFloat(c.amount), 0);

  if (totalPending < 10) {
    return res.status(400).json({
      error: "Minimum payout is 10 SIG",
      currentBalance: totalPending.toFixed(2),
    });
  }

  for (const commission of pendingCommissions) {
    await db.update(affiliateCommissions)
      .set({ status: "processing" })
      .where(eq(affiliateCommissions.id, commission.id));
  }

  await createTrustStamp({
    userId: uid,
    category: "affiliate-payout-request",
    data: {
      amount: totalPending.toFixed(2),
      currency: "SIG",
      commissionsCount: pendingCommissions.length,
    },
  });

  res.json({
    success: true,
    amount: totalPending.toFixed(2),
    currency: "SIG",
    commissionsCount: pendingCommissions.length,
    status: "processing",
  });
});

export default router;
