import { useState, useEffect } from "react";
import { Layout } from "@/components/ui/Layout";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { useMeta } from "@/hooks/use-meta";
import { GlassCard } from "@/components/ui/GlassCard";
import { Settings, Sparkles, Brain, Zap, Heart, Flame, Volume2, Type, Crown, CreditCard, Mic, Sliders, Lock, Copy, Check, Link2, Shield, Hash, Users, Gift, Star } from "lucide-react";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { usePinAuth } from "@/components/PinGate";
import { useSubscription, createCheckoutSession, createPortalSession } from "@/hooks/use-subscription";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import smartassImg from "@/assets/images/personality-smartass.webp";
import calmingImg from "@/assets/images/personality-calming.webp";
import therapistImg from "@/assets/images/personality-therapist.webp";
import hypemanImg from "@/assets/images/personality-hypeman.webp";
import roastmasterImg from "@/assets/images/personality-roastmaster.webp";
import audioImg from "@/assets/images/settings-audio.webp";
import displayImg from "@/assets/images/settings-display.webp";

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const personalities = [
  { id: "smart-ass", label: "Smart-ass", icon: Sparkles, color: "from-orange-500 to-red-500", desc: "Sarcastic & Witty", img: smartassImg },
  { id: "calming", label: "Calming", icon: Heart, color: "from-cyan-400 to-blue-500", desc: "Soothing & Gentle", img: calmingImg },
  { id: "therapist", label: "Therapist", icon: Brain, color: "from-emerald-400 to-green-600", desc: "Analytical & Deep", img: therapistImg },
  { id: "hype-man", label: "Hype Man", icon: Zap, color: "from-yellow-400 to-orange-500", desc: "High Energy!", img: hypemanImg },
  { id: "roast-master", label: "Roast Master", icon: Flame, color: "from-red-600 to-amber-500", desc: "Savage Comedy", img: roastmasterImg },
];

function loadSettings() {
  try {
    const saved = localStorage.getItem("void-settings");
    if (saved) return JSON.parse(saved);
  } catch {}
  return {
    defaultPersonality: "smart-ass",
    responseLength: "medium",
    autoPlayResponse: true,
    autoSubmitOnSilence: true,
    voicePreference: "default",
    hapticFeedback: true,
    showTranscript: true,
    fontSize: 16,
  };
}

function AffiliateCard({ voidId, userId }: { voidId: string; userId: number | null }) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const { data: stats } = useQuery({
    queryKey: ["/api/referral/stats", userId],
    queryFn: async () => {
      const res = await fetch(`/api/referral/stats/${userId}`);
      return res.json();
    },
    enabled: !!userId,
  });

  const copyReferralCode = () => {
    navigator.clipboard.writeText(voidId);
    setCopied(true);
    toast({ title: "Copied!", description: "Your referral code has been copied to clipboard." });
    setTimeout(() => setCopied(false), 2000);
  };

  const copyReferralLink = () => {
    const domain = window.location.origin;
    navigator.clipboard.writeText(`${domain}?ref=${voidId}`);
    setCopied(true);
    toast({ title: "Link Copied!", description: "Your referral link has been copied." });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <GlassCard className="overflow-hidden" hoverEffect>
      <div className="p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-emerald-500/10">
            <Users className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground">Affiliate Program</h2>
            <p className="text-[10px] text-muted-foreground">Share your Void ID, earn rewards</p>
          </div>
        </div>
        <div className="space-y-4">
          <div className="p-3 rounded-xl bg-white/5 border border-white/10">
            <p className="text-[10px] uppercase tracking-widest text-emerald-400/60 mb-1">Your Referral Code</p>
            <div className="flex items-center gap-2">
              <p className="font-mono text-lg font-bold text-emerald-400 tracking-wider flex-1" data-testid="text-referral-code">{voidId}</p>
              <Button size="icon" variant="ghost" onClick={copyReferralCode} data-testid="button-copy-referral">
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>
          <Button variant="outline" className="w-full" onClick={copyReferralLink} data-testid="button-copy-referral-link">
            <Link2 className="w-4 h-4 mr-2" />
            Copy Referral Link
          </Button>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-2 rounded-lg bg-white/5">
              <p className="text-lg font-bold text-foreground">{stats?.referralCount || 0}</p>
              <p className="text-[10px] text-muted-foreground">Referred</p>
            </div>
            <div className="p-2 rounded-lg bg-white/5">
              <p className="text-lg font-bold text-emerald-400">{stats?.convertedCount || 0}</p>
              <p className="text-[10px] text-muted-foreground">Converted</p>
            </div>
            <div className="p-2 rounded-lg bg-white/5">
              <p className="text-lg font-bold text-amber-400">{stats?.rewardsEarned || 0}</p>
              <p className="text-[10px] text-muted-foreground">Rewards</p>
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground text-center">
            Earn 5 bonus credits for each referral that converts to Premium
          </p>
        </div>
      </div>
    </GlassCard>
  );
}

function HallmarkCard({ voidId, userId }: { voidId: string; userId: number | null }) {
  const { data: stampData } = useQuery({
    queryKey: ["/api/stamp", userId],
    queryFn: async () => {
      const res = await fetch(`/api/stamp/${userId}`);
      return res.json();
    },
    enabled: !!userId,
  });

  const { data: verification } = useQuery({
    queryKey: ["/api/stamp/verify", voidId],
    queryFn: async () => {
      const res = await fetch(`/api/stamp/verify/${voidId}`);
      return res.json();
    },
    enabled: !!voidId,
  });

  const stamp = stampData?.stamp;

  return (
    <GlassCard className="overflow-hidden" hoverEffect>
      <div className="p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-purple-500/10">
            <Shield className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground">Blockchain Hallmark</h2>
            <p className="text-[10px] text-muted-foreground">Digital certificate of authenticity</p>
          </div>
          {verification?.valid && (
            <div className="ml-auto px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30">
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Verified</span>
            </div>
          )}
        </div>
        {stamp ? (
          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-white/5 border border-white/10">
              <p className="text-[10px] uppercase tracking-widest text-purple-400/60 mb-1">Stamp Hash</p>
              <p className="font-mono text-[11px] text-purple-300 break-all leading-relaxed" data-testid="text-stamp-hash">
                {stamp.stampHash}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-2 rounded-lg bg-white/5 text-center">
                <Hash className="w-4 h-4 text-purple-400 mx-auto mb-1" />
                <p className="text-sm font-bold text-foreground">#{stamp.blockNumber}</p>
                <p className="text-[10px] text-muted-foreground">Block</p>
              </div>
              <div className="p-2 rounded-lg bg-white/5 text-center">
                <Shield className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
                <p className="text-sm font-bold text-foreground">{verification?.valid ? "Valid" : "Pending"}</p>
                <p className="text-[10px] text-muted-foreground">Status</p>
              </div>
            </div>
            <div className="p-2 rounded-lg bg-white/5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground">Network</span>
                <span className="text-[10px] text-purple-400">Trust Layer v1</span>
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-[10px] text-muted-foreground">Standard</span>
                <span className="text-[10px] text-purple-400">DW-STAMP-1.0</span>
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-[10px] text-muted-foreground">Issuer</span>
                <span className="text-[10px] text-purple-400">DarkWave Studios</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-6">
            <Hash className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Hallmark pending...</p>
            <p className="text-[10px] text-muted-foreground/50 mt-1">Your stamp will be minted automatically</p>
          </div>
        )}
      </div>
    </GlassCard>
  );
}

export default function SettingsPage() {
  useDocumentTitle("Settings");
  useMeta({ description: "Customize your experience in THE VOID — personality, audio, display preferences, and subscription management.", ogTitle: "Settings — THE VOID", ogDescription: "Manage your VOID preferences and subscription.", canonicalPath: "/settings" });
  const [settings, setSettings] = useState(loadSettings);
  const { toast } = useToast();
  const { visitorId, userName } = usePinAuth();
  const { data: subStatus } = useSubscription(visitorId);
  const [subLoading, setSubLoading] = useState(false);

  const isPremium = subStatus?.tier === "premium";

  const { data: pricingInfo } = useQuery<any>({
    queryKey: ["/api/pricing/info"],
  });

  const { data: tuningData } = useQuery({
    queryKey: ["/api/user-settings", visitorId],
    queryFn: async () => {
      const res = await fetch(`/api/user-settings?userId=${visitorId}`);
      return res.json();
    },
    enabled: !!visitorId && isPremium,
  });

  const [sarcasmLevel, setSarcasmLevel] = useState(50);
  const [empathyLevel, setEmpathyLevel] = useState(50);

  useEffect(() => {
    if (tuningData) {
      setSarcasmLevel(tuningData.sarcasmLevel ?? 50);
      setEmpathyLevel(tuningData.empathyLevel ?? 50);
    }
  }, [tuningData]);

  const saveTuningMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/user-settings", {
        userId: visitorId,
        sarcasmLevel,
        empathyLevel,
        responseLength: settings.responseLength,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user-settings", visitorId] });
      toast({ title: "Tuning Saved", description: "Your personality tuning has been saved." });
    },
  });

  const { data: creditData } = useQuery({
    queryKey: ["/api/credits", visitorId],
    queryFn: async () => {
      const res = await fetch(`/api/credits?userId=${visitorId}`);
      return res.json();
    },
    enabled: !!visitorId,
  });

  const handleSubscriptionAction = async () => {
    if (!visitorId) return;
    setSubLoading(true);
    try {
      if (subStatus?.tier === "premium") {
        const url = await createPortalSession(visitorId);
        window.location.href = url;
      } else {
        const url = await createCheckoutSession(visitorId, userName || undefined);
        window.location.href = url;
      }
    } catch {
      toast({ title: "Error", description: "Could not connect to billing. Please try again.", variant: "destructive" });
    } finally {
      setSubLoading(false);
    }
  };

  const update = (key: string, value: any) => {
    setSettings((prev: any) => ({ ...prev, [key]: value }));
  };

  const save = () => {
    localStorage.setItem("void-settings", JSON.stringify(settings));
    toast({ title: "Settings Saved", description: "Your preferences have been updated." });
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">

          <motion.div variants={fadeUp} className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium mb-4">
              <Settings className="w-3 h-3" />
              Preferences
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground font-display mb-2">Settings</h1>
            <p className="text-sm text-muted-foreground">Customize your experience in The Void</p>
          </motion.div>

          <motion.div variants={fadeUp}>
            <GlassCard className="overflow-hidden" hoverEffect>
              <div className="p-5">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl ${subStatus?.tier === "premium" ? "bg-gradient-to-br from-amber-500/20 to-primary/20" : "bg-white/5"}`}>
                      {subStatus?.tier === "premium" ? (
                        <Crown className="w-6 h-6 text-amber-400" />
                      ) : (
                        <CreditCard className="w-6 h-6 text-white/50" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-base font-semibold text-foreground">
                          {subStatus?.tier === "premium" ? "Premium Plan" : "Free Plan"}
                        </h2>
                        {subStatus?.isFounder && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-[10px] font-bold text-amber-400 uppercase tracking-wider" data-testid="badge-founder">
                            <Star className="w-3 h-3" /> Founder
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {subStatus?.tier === "premium"
                          ? `Unlimited venting — $${subStatus?.isFounder ? "9.99" : "14.99"}/month${subStatus?.isFounder ? " (Founders Rate)" : ""}`
                          : `${subStatus?.ventsRemaining ?? 1} vent${(subStatus?.ventsRemaining ?? 1) !== 1 ? "s" : ""} remaining today`}
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={handleSubscriptionAction}
                    disabled={subLoading}
                    variant={subStatus?.tier === "premium" ? "outline" : "default"}
                    data-testid="button-subscription-action"
                  >
                    {subLoading ? "Loading..." : subStatus?.tier === "premium" ? "Manage Subscription" : "Upgrade to Premium"}
                  </Button>
                </div>
                {subStatus?.tier === "premium" && subStatus?.voidId && (
                  <div className="mt-4 pt-4 border-t border-white/5">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-blue-400/60 mb-1">Your Void ID</p>
                        <p className="font-mono text-lg font-bold text-blue-400 tracking-wider" data-testid="text-void-id">{subStatus.voidId}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-muted-foreground">Verified by Trust Layer</p>
                        <a href="https://dwtl.io" target="_blank" rel="noopener noreferrer" className="text-[10px] text-purple-400/70 hover:text-purple-400" data-testid="link-trust-layer">dwtl.io</a>
                      </div>
                    </div>
                  </div>
                )}
                {subStatus?.tier !== "premium" && (
                  <div className="mt-4 pt-4 border-t border-white/5 space-y-4">
                    <div className="grid grid-cols-4 gap-3 text-center">
                      <div>
                        <p className="text-lg font-bold text-foreground">1</p>
                        <p className="text-[10px] text-muted-foreground">Free vent/day</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-purple-400">{creditData?.balance || 0}</p>
                        <p className="text-[10px] text-muted-foreground">Credits</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-amber-400">&#8734;</p>
                        <p className="text-[10px] text-muted-foreground">Premium vents</p>
                      </div>
                      <div>
                        {pricingInfo?.isFoundersPricing ? (
                          <>
                            <p className="text-lg font-bold text-amber-400">$9.99</p>
                            <p className="text-[10px] text-amber-400/70 line-through">$14.99</p>
                          </>
                        ) : (
                          <>
                            <p className="text-lg font-bold text-foreground">$14.99</p>
                            <p className="text-[10px] text-muted-foreground">per month</p>
                          </>
                        )}
                      </div>
                    </div>
                    {pricingInfo?.isFoundersPricing && (
                      <div className="p-3 rounded-xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-red-500/10 border border-amber-500/20" data-testid="card-founders-pricing">
                        <div className="flex items-center justify-between gap-4 flex-wrap">
                          <div className="flex items-center gap-2">
                            <Star className="w-4 h-4 text-amber-400" />
                            <span className="text-sm font-semibold text-amber-400">Founders Rate</span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {pricingInfo.foundersRemaining} of {pricingInfo.foundersLimit} spots left
                          </span>
                        </div>
                        <div className="mt-2">
                          <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-500"
                              style={{ width: `${((pricingInfo.foundersLimit - pricingInfo.foundersRemaining) / pricingInfo.foundersLimit) * 100}%` }}
                            />
                          </div>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-2">
                          Lock in $9.99/mo forever. Price goes to $14.99/mo after {pricingInfo.foundersLimit} founders.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </GlassCard>
          </motion.div>

          {isPremium && subStatus?.voidId && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <motion.div variants={fadeUp}>
                <AffiliateCard voidId={subStatus.voidId} userId={visitorId} />
              </motion.div>
              <motion.div variants={fadeUp}>
                <HallmarkCard voidId={subStatus.voidId} userId={visitorId} />
              </motion.div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

            <div className="lg:col-span-5 space-y-6">
              <motion.div variants={fadeUp}>
                <GlassCard className="overflow-hidden" hoverEffect>
                  <div className="p-5 pb-3">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Sparkles className="w-5 h-5 text-primary" />
                      </div>
                      <h2 className="text-lg font-semibold text-foreground">Default Personality</h2>
                    </div>
                  </div>
                  <div className="px-5 pb-5 grid grid-cols-2 gap-3">
                    {personalities.map((p, index) => {
                      const isSelected = settings.defaultPersonality === p.id;
                      const Icon = p.icon;
                      const isLastOdd = personalities.length % 2 !== 0 && index === personalities.length - 1;
                      return (
                        <motion.button
                          key={p.id}
                          onClick={() => update("defaultPersonality", p.id)}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className={`relative rounded-2xl border text-left transition-all duration-300 overflow-hidden ${
                            isLastOdd ? "col-span-2 aspect-[8/3]" : "aspect-[3/4]"
                          } ${
                            isSelected
                              ? "border-transparent shadow-lg ring-2 ring-primary/40"
                              : "border-white/5 hover:border-white/10"
                          }`}
                          data-testid={`button-personality-${p.id}`}
                        >
                          <img src={p.img} alt={p.label} className={`absolute inset-0 w-full h-full object-cover ${isLastOdd ? "object-center" : ""}`} />
                          <div className={`absolute inset-0 ${isLastOdd ? "bg-gradient-to-r from-black/90 via-black/60 to-transparent" : "bg-gradient-to-t from-black/90 via-black/40 to-transparent"}`} />
                          {isSelected && (
                            <div className={`absolute inset-0 opacity-30 bg-gradient-to-br ${p.color}`} />
                          )}
                          <div className={`absolute p-3 z-10 ${isLastOdd ? "bottom-0 left-0 top-0 flex flex-col justify-center" : "bottom-0 left-0 right-0"}`}>
                            <div className={`p-1.5 rounded-lg w-fit mb-2 transition-colors ${isSelected ? "bg-white/20 text-white" : "bg-white/10 text-white/70"}`}>
                              <Icon className="w-4 h-4" />
                            </div>
                            <h3 className={`text-sm font-semibold ${isSelected ? "text-white" : "text-white/90"}`}>{p.label}</h3>
                            <p className="text-[10px] text-white/50 mt-0.5">{p.desc}</p>
                          </div>
                          {isSelected && (
                            <motion.div
                              layoutId="settings-personality-indicator"
                              className="absolute top-2.5 right-2.5 w-2.5 h-2.5 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.9)]"
                            />
                          )}
                        </motion.button>
                      );
                    })}
                  </div>
                </GlassCard>
              </motion.div>
            </div>

            <div className="lg:col-span-7 space-y-6">
              <motion.div variants={fadeUp}>
                <GlassCard className="overflow-hidden" hoverEffect>
                  <div className="relative h-24 overflow-hidden">
                    <img src={audioImg} alt="" className="absolute inset-0 w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-black/90" />
                    <div className="absolute bottom-0 left-0 right-0 p-4 flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-white/10 backdrop-blur-sm">
                        <Volume2 className="w-5 h-5 text-white" />
                      </div>
                      <h2 className="text-lg font-semibold text-white font-display">Audio & Response</h2>
                    </div>
                  </div>
                  <div className="p-5 space-y-6">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <Label className="text-sm text-foreground">Auto-play AI Response</Label>
                        <p className="text-xs text-muted-foreground mt-0.5">Speak the response aloud when ready</p>
                      </div>
                      <Switch
                        checked={settings.autoPlayResponse}
                        onCheckedChange={(v) => update("autoPlayResponse", v)}
                        data-testid="switch-autoplay"
                      />
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <Label className="text-sm text-foreground">Auto-Submit on Silence</Label>
                        <p className="text-xs text-muted-foreground mt-0.5">Automatically analyze your vent when you stop speaking</p>
                      </div>
                      <Switch
                        checked={settings.autoSubmitOnSilence}
                        onCheckedChange={(v) => update("autoSubmitOnSilence", v)}
                        data-testid="switch-auto-submit"
                      />
                    </div>
                    <div>
                      <Label className="text-sm text-foreground mb-2 block">Voice Preference</Label>
                      <p className="text-xs text-muted-foreground mb-2">Choose the voice gender for AI responses</p>
                      <Select value={settings.voicePreference || "default"} onValueChange={(v) => update("voicePreference", v)}>
                        <SelectTrigger data-testid="select-voice-preference">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="default">Default &ndash; Matches personality</SelectItem>
                          <SelectItem value="male">Male Voice</SelectItem>
                          <SelectItem value="female">Female Voice</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <Label className="text-sm text-foreground">Show Transcript</Label>
                        <p className="text-xs text-muted-foreground mt-0.5">Display what you said alongside the AI response</p>
                      </div>
                      <Switch
                        checked={settings.showTranscript}
                        onCheckedChange={(v) => update("showTranscript", v)}
                        data-testid="switch-transcript"
                      />
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <Label className="text-sm text-foreground">Haptic Feedback</Label>
                        <p className="text-xs text-muted-foreground mt-0.5">Vibrate on record start/stop (mobile)</p>
                      </div>
                      <Switch
                        checked={settings.hapticFeedback}
                        onCheckedChange={(v) => update("hapticFeedback", v)}
                        data-testid="switch-haptic"
                      />
                    </div>
                    <div>
                      <Label className="text-sm text-foreground mb-2 block">Response Length</Label>
                      <Select value={settings.responseLength} onValueChange={(v) => update("responseLength", v)}>
                        <SelectTrigger data-testid="select-response-length">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="short">Short &ndash; Quick & punchy</SelectItem>
                          <SelectItem value="medium">Medium &ndash; Balanced</SelectItem>
                          <SelectItem value="long">Long &ndash; Detailed response</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>

              <motion.div variants={fadeUp}>
                <GlassCard className="overflow-hidden" hoverEffect>
                  <div className="p-5">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 rounded-lg bg-purple-500/10">
                        <Sliders className="w-5 h-5 text-purple-400" />
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold text-foreground">Personality Tuning</h2>
                        <p className="text-[10px] text-muted-foreground">
                          {isPremium ? "Fine-tune how AI personalities respond" : "Premium feature"}
                        </p>
                      </div>
                      {!isPremium && <Lock className="w-4 h-4 text-muted-foreground ml-auto" />}
                    </div>
                    <div className={`space-y-5 ${!isPremium ? "opacity-40 pointer-events-none" : ""}`}>
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <Label className="text-sm text-foreground">Sarcasm Level</Label>
                          <span className="text-xs text-muted-foreground">{sarcasmLevel}%</span>
                        </div>
                        <Slider
                          value={[sarcasmLevel]}
                          onValueChange={([v]) => setSarcasmLevel(v)}
                          min={0}
                          max={100}
                          step={5}
                          data-testid="slider-sarcasm"
                        />
                        <div className="flex justify-between mt-1">
                          <span className="text-[10px] text-muted-foreground/50">Gentle</span>
                          <span className="text-[10px] text-muted-foreground/50">Savage</span>
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <Label className="text-sm text-foreground">Empathy Dial</Label>
                          <span className="text-xs text-muted-foreground">{empathyLevel}%</span>
                        </div>
                        <Slider
                          value={[empathyLevel]}
                          onValueChange={([v]) => setEmpathyLevel(v)}
                          min={0}
                          max={100}
                          step={5}
                          data-testid="slider-empathy"
                        />
                        <div className="flex justify-between mt-1">
                          <span className="text-[10px] text-muted-foreground/50">Blunt</span>
                          <span className="text-[10px] text-muted-foreground/50">Warm</span>
                        </div>
                      </div>
                      {isPremium && (
                        <div className="flex justify-end pt-2">
                          <Button
                            size="sm"
                            onClick={() => saveTuningMutation.mutate()}
                            disabled={saveTuningMutation.isPending}
                            data-testid="button-save-tuning"
                          >
                            {saveTuningMutation.isPending ? "Saving..." : "Save Tuning"}
                          </Button>
                        </div>
                      )}
                    </div>
                    {!isPremium && (
                      <p className="text-[10px] text-center text-muted-foreground mt-3">
                        Upgrade to Premium to unlock personality tuning
                      </p>
                    )}
                  </div>
                </GlassCard>
              </motion.div>

              <motion.div variants={fadeUp}>
                <GlassCard className="overflow-hidden" hoverEffect>
                  <div className="relative h-24 overflow-hidden">
                    <img src={displayImg} alt="" className="absolute inset-0 w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-black/90" />
                    <div className="absolute bottom-0 left-0 right-0 p-4 flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-white/10 backdrop-blur-sm">
                        <Type className="w-5 h-5 text-white" />
                      </div>
                      <h2 className="text-lg font-semibold text-white font-display">Display</h2>
                    </div>
                  </div>
                  <div className="p-5 space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label className="text-sm text-foreground">Response Font Size</Label>
                        <span className="text-xs text-muted-foreground">{settings.fontSize}px</span>
                      </div>
                      <Slider
                        value={[settings.fontSize]}
                        onValueChange={([v]) => update("fontSize", v)}
                        min={12}
                        max={24}
                        step={1}
                        data-testid="slider-font-size"
                      />
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            </div>
          </div>

          <motion.div variants={fadeUp} className="flex justify-center pt-4">
            <Button onClick={save} data-testid="button-save-settings">
              Save Preferences
            </Button>
          </motion.div>

        </motion.div>
      </div>
    </Layout>
  );
}
