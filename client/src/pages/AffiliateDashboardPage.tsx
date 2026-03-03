import { useState } from "react";
import { Layout } from "@/components/ui/Layout";
import { GlassCard } from "@/components/ui/GlassCard";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { usePinAuth } from "@/components/PinGate";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Copy, Check, Share2, TrendingUp, Users, DollarSign, Award, ChevronRight, Shield, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const tierColors: Record<string, string> = {
  base: "text-zinc-400",
  silver: "text-zinc-300",
  gold: "text-yellow-400",
  platinum: "text-cyan-300",
  diamond: "text-purple-400",
};

const tierBg: Record<string, string> = {
  base: "from-zinc-600/20 to-zinc-500/10",
  silver: "from-zinc-400/20 to-zinc-300/10",
  gold: "from-yellow-500/20 to-amber-400/10",
  platinum: "from-cyan-400/20 to-cyan-300/10",
  diamond: "from-purple-500/20 to-violet-400/10",
};

export default function AffiliateDashboardPage() {
  useDocumentTitle("Affiliate Program - THE VOID");
  const { visitorId } = usePinAuth();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const { data, isLoading } = useQuery<any>({
    queryKey: ["/api/affiliate/dashboard", visitorId],
    queryFn: () => fetch(`/api/affiliate/dashboard?userId=${visitorId}`).then(r => r.json()),
    enabled: !!visitorId,
  });

  const payoutMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/affiliate/request-payout", { userId: visitorId }),
    onSuccess: () => {
      toast({ title: "Payout requested", description: "Your payout is being processed." });
      queryClient.invalidateQueries({ queryKey: ["/api/affiliate/dashboard"] });
    },
    onError: (err: any) => {
      toast({ title: "Payout failed", description: err.message || "Minimum 10 SIG required", variant: "destructive" });
    },
  });

  const copyLink = () => {
    if (data?.referralLink) {
      navigator.clipboard.writeText(data.referralLink);
      setCopied(true);
      toast({ title: "Link copied!" });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shareLink = () => {
    if (data?.referralLink && navigator.share) {
      navigator.share({
        title: "Join me on THE VOID",
        text: `Join me on THE VOID — part of the Trust Layer ecosystem!`,
        url: data.referralLink,
      }).catch(() => {});
    } else {
      copyLink();
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  const stats = data?.stats || {};
  const tier = data?.tier || "base";
  const nextTier = data?.nextTier;
  const tiers = data?.tiers || [];

  return (
    <Layout>
      <div className="min-h-screen py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">

            <motion.div variants={fadeUp} className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/20 mb-4">
                <Award className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">Share & Earn</span>
              </div>
              <h1 className="text-3xl font-black tracking-tight font-display" data-testid="text-affiliate-title">
                Affiliate Program
              </h1>
              <p className="text-sm text-muted-foreground mt-2">
                Earn up to 20% commission on referrals across all 32 Trust Layer apps
              </p>
            </motion.div>

            <motion.div variants={fadeUp}>
              <GlassCard className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground">Your Referral Link</h2>
                  <div className={`px-2 py-0.5 rounded-full bg-gradient-to-r ${tierBg[tier]} text-xs font-bold uppercase ${tierColors[tier]}`}>
                    {tier}
                  </div>
                </div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex-1 px-3 py-2 bg-white/[0.03] border border-white/10 rounded-lg text-xs font-mono text-muted-foreground truncate" data-testid="text-referral-link">
                    {data?.referralLink || "Loading..."}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={copyLink}
                    className="shrink-0"
                    data-testid="button-copy-link"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={shareLink}
                    className="shrink-0"
                    data-testid="button-share-link"
                  >
                    <Share2 className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Your link works across all Trust Layer apps — one link, every platform.
                </p>
              </GlassCard>
            </motion.div>

            <motion.div variants={fadeUp}>
              <div className="grid grid-cols-2 gap-3">
                <GlassCard className="p-4 text-center">
                  <Users className="w-5 h-5 text-cyan-400 mx-auto mb-2" />
                  <div className="text-2xl font-black font-display" data-testid="stat-total-referrals">{stats.totalReferrals || 0}</div>
                  <div className="text-xs text-muted-foreground">Total Referrals</div>
                </GlassCard>
                <GlassCard className="p-4 text-center">
                  <TrendingUp className="w-5 h-5 text-emerald-400 mx-auto mb-2" />
                  <div className="text-2xl font-black font-display" data-testid="stat-converted">{stats.converted || 0}</div>
                  <div className="text-xs text-muted-foreground">Converted</div>
                </GlassCard>
                <GlassCard className="p-4 text-center">
                  <DollarSign className="w-5 h-5 text-yellow-400 mx-auto mb-2" />
                  <div className="text-2xl font-black font-display" data-testid="stat-pending-earnings">{stats.pendingEarnings || "0.00"}</div>
                  <div className="text-xs text-muted-foreground">Pending (SIG)</div>
                </GlassCard>
                <GlassCard className="p-4 text-center">
                  <Zap className="w-5 h-5 text-purple-400 mx-auto mb-2" />
                  <div className="text-2xl font-black font-display" data-testid="stat-paid-earnings">{stats.paidEarnings || "0.00"}</div>
                  <div className="text-xs text-muted-foreground">Paid (SIG)</div>
                </GlassCard>
              </div>
            </motion.div>

            {nextTier && (
              <motion.div variants={fadeUp}>
                <GlassCard className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-muted-foreground">Progress to <span className={`font-semibold capitalize ${tierColors[nextTier.name]}`}>{nextTier.name}</span></span>
                    <span className="text-xs text-muted-foreground">{nextTier.referralsNeeded} more needed</span>
                  </div>
                  <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full transition-all"
                      style={{
                        width: `${Math.max(5, ((stats.converted || 0) / ((stats.converted || 0) + nextTier.referralsNeeded)) * 100)}%`,
                      }}
                      data-testid="progress-tier"
                    />
                  </div>
                </GlassCard>
              </motion.div>
            )}

            <motion.div variants={fadeUp}>
              <GlassCard className="p-5">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground mb-4">Commission Tiers</h3>
                <div className="space-y-2">
                  {tiers.map((t: any) => (
                    <div
                      key={t.name}
                      className={`flex items-center justify-between px-3 py-2 rounded-lg ${t.current ? "bg-white/[0.06] border border-cyan-500/20" : "bg-white/[0.02]"}`}
                      data-testid={`tier-row-${t.name}`}
                    >
                      <div className="flex items-center gap-2">
                        {t.current && <ChevronRight className="w-3 h-3 text-cyan-400" />}
                        <span className={`text-sm font-semibold capitalize ${tierColors[t.name]}`}>{t.name}</span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>{t.minReferrals}+ referrals</span>
                        <span className="font-mono font-semibold text-foreground">{t.rate}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCard>
            </motion.div>

            <motion.div variants={fadeUp}>
              <GlassCard className="p-5">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground mb-3">Cross-Platform Links</h3>
                <div className="space-y-2">
                  {data?.crossPlatformLinks && Object.entries(data.crossPlatformLinks).map(([app, link]) => (
                    <div key={app} className="flex items-center justify-between text-xs">
                      <span className="capitalize text-muted-foreground">{app}</span>
                      <span className="font-mono text-foreground/60 truncate ml-4 max-w-[200px]">{link as string}</span>
                    </div>
                  ))}
                </div>
              </GlassCard>
            </motion.div>

            <motion.div variants={fadeUp} className="flex justify-center">
              <Button
                onClick={() => payoutMutation.mutate()}
                disabled={payoutMutation.isPending || parseFloat(stats.pendingEarnings || "0") < 10}
                data-testid="button-request-payout"
              >
                <DollarSign className="w-4 h-4 mr-2" />
                {payoutMutation.isPending ? "Processing..." : "Request Payout"}
              </Button>
              {parseFloat(stats.pendingEarnings || "0") < 10 && (
                <p className="text-xs text-muted-foreground ml-3 self-center">Min 10 SIG</p>
              )}
            </motion.div>

          </motion.div>
        </div>
      </div>
    </Layout>
  );
}
