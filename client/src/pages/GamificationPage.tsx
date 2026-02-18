import { useState } from "react";
import { Layout } from "@/components/ui/Layout";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { useMeta } from "@/hooks/use-meta";
import { GlassCard } from "@/components/ui/GlassCard";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, Trophy, Target, BarChart3, ChevronLeft, ChevronRight, Lock, Star, Zap, Crown, Heart, MessageCircle, Calendar, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { usePinAuth } from "@/components/PinGate";
import streakImg from "@/assets/images/gamification-streak.png";
import moodImg from "@/assets/images/gamification-mood.png";
import promptImg from "@/assets/images/gamification-prompt.png";

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const ACHIEVEMENT_ICONS: Record<string, typeof Star> = {
  star: Star,
  zap: Zap,
  crown: Crown,
  heart: Heart,
  flame: Flame,
  trophy: Trophy,
  target: Target,
  message: MessageCircle,
  calendar: Calendar,
  sparkles: Sparkles,
};

const MOOD_LABELS = ["Awful", "Bad", "Meh", "Okay", "Good", "Great", "Amazing"];
const MOOD_COLORS = ["#ef4444", "#f97316", "#eab308", "#a3a3a3", "#22c55e", "#06b6d4", "#8b5cf6"];

type Tab = "streak" | "achievements" | "mood" | "prompt";

export default function GamificationPage() {
  useDocumentTitle("Your Progress");
  useMeta({ description: "Track your venting streak, unlock achievements, monitor mood trends, and get daily prompts.", ogTitle: "Your Progress — THE VOID", ogDescription: "Streaks, achievements, and mood tracking for your emotional journey.", canonicalPath: "/progress" });
  const { visitorId: userId } = usePinAuth();
  const [activeTab, setActiveTab] = useState<Tab>("streak");
  const [carouselIdx, setCarouselIdx] = useState(0);

  const { data: streak } = useQuery<{ currentStreak: number; longestStreak: number; lastVentDate: string | null }>({
    queryKey: ["/api/gamification/streak", userId],
    queryFn: async () => { const res = await fetch(`/api/gamification/streak/${userId}`); return res.json(); },
    enabled: !!userId,
  });

  const { data: achievements } = useQuery<{ all: any[]; unlocked: string[] }>({
    queryKey: ["/api/gamification/achievements", userId],
    queryFn: async () => { const res = await fetch(`/api/gamification/achievements/${userId}`); return res.json(); },
    enabled: !!userId,
  });

  const { data: moodData } = useQuery<{ recent: any[]; avgBefore: number; avgAfter: number }>({
    queryKey: ["/api/gamification/mood-stats", userId],
    queryFn: async () => { const res = await fetch(`/api/gamification/mood-stats/${userId}`); return res.json(); },
    enabled: !!userId,
  });

  const { data: prompt } = useQuery<{ prompt: string; category: string; activeDate: string } | null>({
    queryKey: ["/api/gamification/daily-prompt"],
  });

  const tabs: { key: Tab; icon: typeof Flame; label: string }[] = [
    { key: "streak", icon: Flame, label: "Streak" },
    { key: "achievements", icon: Trophy, label: "Trophies" },
    { key: "mood", icon: BarChart3, label: "Mood" },
    { key: "prompt", icon: Target, label: "Prompt" },
  ];

  const achievementList = achievements?.all || [];
  const unlockedSet = new Set(achievements?.unlocked || []);
  const achPageSize = 4;
  const achPages = Math.max(1, Math.ceil(achievementList.length / achPageSize));

  return (
    <Layout>
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        className="max-w-4xl mx-auto px-4 py-8 space-y-6"
      >
        <motion.div variants={fadeUp} className="text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 mb-4">
            <Trophy className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-medium text-muted-foreground tracking-wide uppercase">Your Progress</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground font-display mb-2" data-testid="text-gamification-title">
            Track Your Journey
          </h1>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Every vent counts. Build streaks, unlock achievements, and track your mood over time.
          </p>
        </motion.div>

        <motion.div variants={fadeUp}>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {tabs.map((t) => (
              <Button
                key={t.key}
                variant={activeTab === t.key ? "default" : "ghost"}
                onClick={() => { setActiveTab(t.key); setCarouselIdx(0); }}
                className="shrink-0"
                data-testid={`button-tab-${t.key}`}
              >
                <t.icon className="w-4 h-4 mr-2" />
                {t.label}
              </Button>
            ))}
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          {activeTab === "streak" && (
            <motion.div key="streak" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <GlassCard className="overflow-hidden" hoverEffect>
                  <div className="p-5 text-center space-y-2">
                    <Flame className="w-8 h-8 text-orange-400 mx-auto" />
                    <p className="text-3xl font-bold text-foreground font-display" data-testid="text-current-streak">{streak?.currentStreak ?? 0}</p>
                    <p className="text-xs text-muted-foreground">Current Streak</p>
                  </div>
                </GlassCard>
                <GlassCard className="overflow-hidden" hoverEffect>
                  <div className="p-5 text-center space-y-2">
                    <Trophy className="w-8 h-8 text-yellow-400 mx-auto" />
                    <p className="text-3xl font-bold text-foreground font-display" data-testid="text-longest-streak">{streak?.longestStreak ?? 0}</p>
                    <p className="text-xs text-muted-foreground">Longest Streak</p>
                  </div>
                </GlassCard>
                <GlassCard className="overflow-hidden" hoverEffect>
                  <div className="p-5 text-center space-y-2">
                    <Calendar className="w-8 h-8 text-cyan-400 mx-auto" />
                    <p className="text-sm font-medium text-foreground" data-testid="text-last-vent">{streak?.lastVentDate ?? "Never"}</p>
                    <p className="text-xs text-muted-foreground">Last Vent</p>
                  </div>
                </GlassCard>
              </div>
              <GlassCard className="mt-4 overflow-hidden" hoverEffect>
                <div className="relative h-28 overflow-hidden">
                  <img src={streakImg} alt="" className="absolute inset-0 w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-black/90" />
                  <div className="absolute bottom-0 left-0 right-0 p-4 flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-orange-500/20 backdrop-blur-sm">
                      <Flame className="w-5 h-5 text-orange-400" />
                    </div>
                    <h3 className="text-sm font-semibold text-white">How Streaks Work</h3>
                  </div>
                </div>
                <div className="p-5 space-y-3">
                  <ul className="space-y-2 text-xs text-muted-foreground">
                    <li className="flex items-start gap-2"><Flame className="w-3.5 h-3.5 text-orange-400 mt-0.5 shrink-0" /> Vent at least once per day to maintain your streak</li>
                    <li className="flex items-start gap-2"><Trophy className="w-3.5 h-3.5 text-yellow-400 mt-0.5 shrink-0" /> Reach 7-day streaks to unlock achievements</li>
                    <li className="flex items-start gap-2"><Star className="w-3.5 h-3.5 text-purple-400 mt-0.5 shrink-0" /> Longer streaks unlock rarer badges and bragging rights</li>
                  </ul>
                </div>
              </GlassCard>
            </motion.div>
          )}

          {activeTab === "achievements" && (
            <motion.div key="achievements" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {achievementList.slice(carouselIdx * achPageSize, (carouselIdx + 1) * achPageSize).map((ach: any) => {
                  const unlocked = unlockedSet.has(ach.key);
                  const IconComp = ACHIEVEMENT_ICONS[ach.icon] || Star;
                  return (
                    <GlassCard key={ach.key} className={`overflow-hidden ${!unlocked ? "opacity-50" : ""}`} hoverEffect>
                      <div className="p-5 flex items-start gap-4">
                        <div className={`p-2.5 rounded-lg ${unlocked ? "bg-primary/10" : "bg-white/5"}`}>
                          {unlocked ? <IconComp className="w-5 h-5 text-primary" /> : <Lock className="w-5 h-5 text-muted-foreground" />}
                        </div>
                        <div className="space-y-1 min-w-0">
                          <h3 className="text-sm font-semibold text-foreground truncate" data-testid={`text-achievement-${ach.key}`}>{ach.title}</h3>
                          <p className="text-xs text-muted-foreground">{ach.description}</p>
                          {unlocked && <span className="text-[10px] text-primary font-medium">Unlocked</span>}
                        </div>
                      </div>
                    </GlassCard>
                  );
                })}
              </div>
              {achPages > 1 && (
                <div className="flex items-center justify-center gap-3 mt-4">
                  <Button size="icon" variant="ghost" onClick={() => setCarouselIdx(Math.max(0, carouselIdx - 1))} disabled={carouselIdx === 0} data-testid="button-ach-prev">
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-xs text-muted-foreground">{carouselIdx + 1} / {achPages}</span>
                  <Button size="icon" variant="ghost" onClick={() => setCarouselIdx(Math.min(achPages - 1, carouselIdx + 1))} disabled={carouselIdx >= achPages - 1} data-testid="button-ach-next">
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "mood" && (
            <motion.div key="mood" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <GlassCard className="overflow-hidden" hoverEffect>
                  <div className="p-5 text-center space-y-2">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Avg Mood Before Venting</p>
                    <p className="text-3xl font-bold font-display" style={{ color: MOOD_COLORS[Math.round(moodData?.avgBefore ?? 3)] }} data-testid="text-mood-before">
                      {moodData?.avgBefore !== undefined ? MOOD_LABELS[Math.round(moodData.avgBefore)] : "---"}
                    </p>
                  </div>
                </GlassCard>
                <GlassCard className="overflow-hidden" hoverEffect>
                  <div className="p-5 text-center space-y-2">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Avg Mood After Venting</p>
                    <p className="text-3xl font-bold font-display" style={{ color: MOOD_COLORS[Math.round(moodData?.avgAfter ?? 3)] }} data-testid="text-mood-after">
                      {moodData?.avgAfter !== undefined ? MOOD_LABELS[Math.round(moodData.avgAfter)] : "---"}
                    </p>
                  </div>
                </GlassCard>
              </div>
              <GlassCard className="mt-4 overflow-hidden" hoverEffect>
                <div className="relative h-28 overflow-hidden">
                  <img src={moodImg} alt="" className="absolute inset-0 w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-black/90" />
                  <div className="absolute bottom-0 left-0 right-0 p-4 flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-cyan-500/20 backdrop-blur-sm">
                      <BarChart3 className="w-5 h-5 text-cyan-400" />
                    </div>
                    <h3 className="text-sm font-semibold text-white">Recent Mood Checks</h3>
                  </div>
                </div>
                <div className="p-5 space-y-3">
                  {(!moodData?.recent || moodData.recent.length === 0) ? (
                    <p className="text-xs text-muted-foreground">No mood data yet. Start venting to track your emotional journey.</p>
                  ) : (
                    <div className="space-y-2">
                      {moodData.recent.slice(0, 8).map((m: any, i: number) => (
                        <div key={i} className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">{new Date(m.createdAt).toLocaleDateString()}</span>
                          <div className="flex items-center gap-3">
                            <span style={{ color: MOOD_COLORS[m.moodBefore] }}>{MOOD_LABELS[m.moodBefore]}</span>
                            <span className="text-muted-foreground/40">-&gt;</span>
                            <span style={{ color: MOOD_COLORS[m.moodAfter ?? m.moodBefore] }}>{m.moodAfter !== null ? MOOD_LABELS[m.moodAfter] : "..."}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </GlassCard>
            </motion.div>
          )}

          {activeTab === "prompt" && (
            <motion.div key="prompt" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
              <GlassCard className="overflow-hidden" hoverEffect>
                <div className="relative h-28 overflow-hidden">
                  <img src={promptImg} alt="" className="absolute inset-0 w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-black/90" />
                  <div className="absolute bottom-0 left-0 right-0 p-4 flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-500/20 backdrop-blur-sm">
                      <Target className="w-5 h-5 text-purple-400" />
                    </div>
                    <h3 className="text-sm font-semibold text-white">Today's Prompt</h3>
                  </div>
                </div>
                <div className="p-6 md:p-8 text-center space-y-4">
                  <p className="text-lg md:text-xl font-medium text-foreground max-w-lg mx-auto leading-relaxed" data-testid="text-daily-prompt">
                    {prompt?.prompt ?? "No prompt for today. Come back tomorrow."}
                  </p>
                  {prompt?.category && (
                    <span className="inline-block text-[10px] text-primary bg-primary/10 px-2 py-0.5 rounded-full uppercase tracking-wide">
                      {prompt.category}
                    </span>
                  )}
                  <p className="text-[10px] text-muted-foreground pt-2">
                    Use this prompt to guide your next vent session. Let the words flow.
                  </p>
                </div>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </Layout>
  );
}
