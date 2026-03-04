import { Router, Request, Response } from "express";
import { db } from "./db";
import { affiliateReferrals, affiliateCommissions, whitelistedUsers } from "@shared/schema";
import { eq, and, sql, count, sum } from "drizzle-orm";
import { createTrustStamp } from "./hallmark";

const router = Router();

const ECOSYSTEM_APPS = [
  { slug: "trusthub", name: "Trust Layer Hub", domain: "trusthub.tlid.io" },
  { slug: "trustlayer", name: "Trust Layer (L1)", domain: "dwtl.io" },
  { slug: "trusthome", name: "TrustHome", domain: "trusthome.tlid.io" },
  { slug: "trustvault", name: "TrustVault", domain: "trustvault.tlid.io" },
  { slug: "tlid", name: "TLID.io", domain: "tlid.io" },
  { slug: "thevoid", name: "THE VOID", domain: "thevoid.tlid.io" },
  { slug: "signalchat", name: "Signal Chat", domain: "signalchat.tlid.io" },
  { slug: "darkwavestudio", name: "DarkWave Studio", domain: "darkwavestudio.tlid.io" },
  { slug: "guardianshield", name: "Guardian Shield", domain: "guardianshield.tlid.io" },
  { slug: "guardianscanner", name: "Guardian Scanner", domain: "guardianscanner.tlid.io" },
  { slug: "guardianscreener", name: "Guardian Screener", domain: "guardianscreener.tlid.io" },
  { slug: "tradeworks", name: "TradeWorks AI", domain: "tradeworks.tlid.io" },
  { slug: "strikeagent", name: "StrikeAgent", domain: "strikeagent.tlid.io" },
  { slug: "pulse", name: "Pulse", domain: "pulse.tlid.io" },
  { slug: "chronicles", name: "Chronicles", domain: "chronicles.tlid.io" },
  { slug: "thearcade", name: "The Arcade", domain: "thearcade.tlid.io" },
  { slug: "bomber", name: "Bomber", domain: "bomber.tlid.io" },
  { slug: "trustgolf", name: "Trust Golf", domain: "trustgolf.tlid.io" },
  { slug: "orbit", name: "ORBIT Staffing OS", domain: "orbit.tlid.io" },
  { slug: "orby", name: "Orby Commander", domain: "orby.tlid.io" },
  { slug: "garagebot", name: "GarageBot", domain: "garagebot.tlid.io" },
  { slug: "lotops", name: "Lot Ops Pro", domain: "lotops.tlid.io" },
  { slug: "torque", name: "TORQUE", domain: "torque.tlid.io" },
  { slug: "driverconnect", name: "TL Driver Connect", domain: "driverconnect.tlid.io" },
  { slug: "vedasolus", name: "VedaSolus", domain: "vedasolus.tlid.io" },
  { slug: "verdara", name: "Verdara", domain: "verdara.tlid.io" },
  { slug: "arbora", name: "Arbora", domain: "arbora.tlid.io" },
  { slug: "paintpros", name: "PaintPros", domain: "paintpros.tlid.io" },
  { slug: "nashvillepainting", name: "Nashville Painting Professionals", domain: "nashvillepainting.tlid.io" },
  { slug: "trustbook", name: "Trust Book", domain: "trustbook.tlid.io" },
  { slug: "darkwaveacademy", name: "DarkWave Academy", domain: "darkwaveacademy.tlid.io" },
  { slug: "happyeats", name: "Happy Eats", domain: "happyeats.tlid.io" },
  { slug: "brewandboard", name: "Brew & Board Coffee", domain: "brewandboard.tlid.io" },
];

function buildCrossPlatformLinks(uniqueHash: string): Record<string, string> {
  const links: Record<string, string> = {};
  for (const app of ECOSYSTEM_APPS) {
    links[app.slug] = `https://${app.domain}/ref/${uniqueHash}`;
  }
  return links;
}

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
    crossPlatformLinks: buildCrossPlatformLinks(user.uniqueHash),
    ecosystemApps: ECOSYSTEM_APPS,
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
    crossPlatformLinks: buildCrossPlatformLinks(user.uniqueHash),
    ecosystemApps: ECOSYSTEM_APPS,
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
