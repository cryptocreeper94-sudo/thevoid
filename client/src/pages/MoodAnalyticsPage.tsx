import { useMemo } from "react";
import { Layout } from "@/components/ui/Layout";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { useMeta } from "@/hooks/use-meta";
import { GlassCard } from "@/components/ui/GlassCard";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, TrendingUp, TrendingDown, Activity, Clock } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import analyticsImg from "@/assets/images/mood-analytics.webp";

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

interface ChartPoint {
  date: string;
  avgBefore: number;
  avgAfter: number;
}

interface MoodCheck {
  id: number;
  moodBefore: number;
  moodAfter: number;
  createdAt: string;
  note?: string;
}

interface MoodAnalyticsData {
  moods: MoodCheck[];
  summary: {
    totalChecks: number;
    avgBefore: number;
    avgAfter: number;
    avgImprovement: number;
  };
  chartData: ChartPoint[];
}

function MoodLineChart({ data }: { data: ChartPoint[] }) {
  const width = 600;
  const height = 250;
  const padding = { top: 20, right: 20, bottom: 40, left: 40 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const points = useMemo(() => {
    if (!data.length) return { before: "", after: "", labels: [] as string[] };
    const maxVal = 5;
    const minVal = 0;
    const range = maxVal - minVal || 1;
    const stepX = data.length > 1 ? chartW / (data.length - 1) : 0;

    const toY = (val: number) =>
      padding.top + chartH - ((val - minVal) / range) * chartH;

    const beforePts = data.map(
      (d, i) => `${padding.left + i * stepX},${toY(d.avgBefore)}`
    );
    const afterPts = data.map(
      (d, i) => `${padding.left + i * stepX},${toY(d.avgAfter)}`
    );

    const labels = data.map((d) => {
      const date = new Date(d.date);
      return `${date.getMonth() + 1}/${date.getDate()}`;
    });

    return {
      before: beforePts.join(" "),
      after: afterPts.join(" "),
      labels,
    };
  }, [data, chartW, chartH]);

  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-48 text-white/30 text-sm">
        No chart data available yet
      </div>
    );
  }

  const gridLines = [0, 1, 2, 3, 4, 5];

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full min-w-[400px]"
        preserveAspectRatio="xMidYMid meet"
      >
        {gridLines.map((val) => {
          const y =
            padding.top +
            chartH -
            (val / 5) * chartH;
          return (
            <g key={val}>
              <line
                x1={padding.left}
                y1={y}
                x2={padding.left + chartW}
                y2={y}
                stroke="rgba(255,255,255,0.06)"
                strokeDasharray="4 4"
              />
              <text
                x={padding.left - 8}
                y={y + 4}
                textAnchor="end"
                fill="rgba(255,255,255,0.3)"
                fontSize="10"
              >
                {val}
              </text>
            </g>
          );
        })}

        {points.labels.map((label, i) => {
          const stepX =
            data.length > 1 ? chartW / (data.length - 1) : 0;
          const x = padding.left + i * stepX;
          const showLabel =
            data.length <= 10 || i % Math.ceil(data.length / 8) === 0;
          if (!showLabel) return null;
          return (
            <text
              key={i}
              x={x}
              y={height - 8}
              textAnchor="middle"
              fill="rgba(255,255,255,0.3)"
              fontSize="10"
            >
              {label}
            </text>
          );
        })}

        <defs>
          <linearGradient id="beforeGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="afterGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#a855f7" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
          </linearGradient>
        </defs>

        <polyline
          points={points.before}
          fill="none"
          stroke="#06b6d4"
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <polyline
          points={points.after}
          fill="none"
          stroke="#a855f7"
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {data.map((d, i) => {
          const stepX =
            data.length > 1 ? chartW / (data.length - 1) : 0;
          const x = padding.left + i * stepX;
          const yBefore =
            padding.top +
            chartH -
            (d.avgBefore / 5) * chartH;
          const yAfter =
            padding.top +
            chartH -
            (d.avgAfter / 5) * chartH;
          return (
            <g key={i}>
              <circle cx={x} cy={yBefore} r="3" fill="#06b6d4" />
              <circle cx={x} cy={yAfter} r="3" fill="#a855f7" />
            </g>
          );
        })}
      </svg>

      <div className="flex items-center justify-center gap-6 mt-3">
        <div className="flex items-center gap-2">
          <div className="w-3 h-0.5 bg-cyan-400 rounded-full" />
          <span className="text-[10px] text-white/40 uppercase tracking-wider">
            Before
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-0.5 bg-purple-400 rounded-full" />
          <span className="text-[10px] text-white/40 uppercase tracking-wider">
            After
          </span>
        </div>
      </div>
    </div>
  );
}

function SkeletonLoader() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-48 bg-white/[0.03] rounded-3xl border border-white/5" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-24 bg-white/[0.03] rounded-3xl border border-white/5"
          />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-8 h-80 bg-white/[0.03] rounded-3xl border border-white/5" />
        <div className="lg:col-span-4 h-80 bg-white/[0.03] rounded-3xl border border-white/5" />
      </div>
    </div>
  );
}

export default function MoodAnalyticsPage() {
  useDocumentTitle("Mood Analytics - THE VOID");
  useMeta({
    description:
      "Track your mood patterns over time. See how venting impacts your emotional state with detailed analytics and charts.",
    ogTitle: "Mood Analytics - THE VOID",
    ogDescription:
      "Visualize your mood journey with before and after comparisons.",
    canonicalPath: "/mood-analytics",
  });

  const userId = parseInt(localStorage.getItem("void-user-id") || "0");

  const { data, isLoading } = useQuery<MoodAnalyticsData>({
    queryKey: ["/api/mood/analytics", userId],
    queryFn: async () => {
      const res = await fetch(`/api/mood/analytics?userId=${userId}`);
      if (!res.ok) throw new Error("Failed to fetch mood analytics");
      return res.json();
    },
    enabled: userId > 0,
  });

  const summary = data?.summary;
  const chartData = data?.chartData || [];
  const recentMoods = data?.moods?.slice(0, 10) || [];

  return (
    <Layout>
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6"
      >
        <motion.div variants={fadeUp}>
          <GlassCard className="p-0 overflow-hidden lg:col-span-12">
            <div className="relative h-44 sm:h-52 overflow-hidden">
              <img
                src={analyticsImg}
                alt=""
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/50 to-black/90" />
              <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 mb-3">
                  <BarChart3 className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="text-[10px] font-medium text-white/60 tracking-wide uppercase">
                    Analytics
                  </span>
                </div>
                <h1
                  className="text-2xl sm:text-3xl md:text-4xl font-bold text-white font-display"
                  data-testid="text-mood-analytics-title"
                >
                  Mood Analytics
                </h1>
                <p className="text-sm text-white/50 mt-1 max-w-lg">
                  Track how your mood shifts before and after each session.
                </p>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {isLoading ? (
          <SkeletonLoader />
        ) : !summary || userId === 0 ? (
          <motion.div variants={fadeUp}>
            <GlassCard className="p-8 text-center">
              <Activity className="w-10 h-10 text-white/20 mx-auto mb-3" />
              <p className="text-white/50 text-sm" data-testid="text-no-data">
                {userId === 0
                  ? "Sign in to view your mood analytics."
                  : "No mood data recorded yet. Complete a mood check-in to see your analytics."}
              </p>
            </GlassCard>
          </motion.div>
        ) : (
          <>
            <motion.div
              variants={fadeUp}
              className="grid grid-cols-2 lg:grid-cols-4 gap-4"
            >
              <GlassCard className="p-4 sm:p-6" data-testid="stat-total-checks">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-cyan-500/20">
                    <Activity className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-white/40">
                      Total Check-ins
                    </p>
                    <p className="text-2xl font-bold text-white">
                      {summary.totalChecks}
                    </p>
                  </div>
                </div>
              </GlassCard>

              <GlassCard className="p-4 sm:p-6" data-testid="stat-avg-before">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-cyan-500/20">
                    <TrendingDown className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-white/40">
                      Avg Before
                    </p>
                    <p className="text-2xl font-bold text-white">
                      {summary.avgBefore.toFixed(1)}
                      <span className="text-sm text-white/30 ml-1">/5</span>
                    </p>
                  </div>
                </div>
              </GlassCard>

              <GlassCard className="p-4 sm:p-6" data-testid="stat-avg-after">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-500/20">
                    <TrendingUp className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-white/40">
                      Avg After
                    </p>
                    <p className="text-2xl font-bold text-white">
                      {summary.avgAfter.toFixed(1)}
                      <span className="text-sm text-white/30 ml-1">/5</span>
                    </p>
                  </div>
                </div>
              </GlassCard>

              <GlassCard
                className="p-4 sm:p-6"
                data-testid="stat-avg-improvement"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-500/20">
                    <TrendingUp className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-white/40">
                      Avg Improvement
                    </p>
                    <p className="text-2xl font-bold text-white">
                      {summary.avgImprovement > 0 ? "+" : ""}
                      {summary.avgImprovement.toFixed(1)}
                    </p>
                  </div>
                </div>
              </GlassCard>
            </motion.div>

            <motion.div
              variants={fadeUp}
              className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6"
            >
              <div className="lg:col-span-8">
                <GlassCard className="p-4 sm:p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-cyan-500/20">
                      <BarChart3 className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div>
                      <h2 className="text-sm font-semibold text-white">
                        Mood Over Time
                      </h2>
                      <p className="text-[10px] text-white/40">
                        Before vs After each session
                      </p>
                    </div>
                  </div>
                  <MoodLineChart data={chartData} />
                </GlassCard>
              </div>

              <div className="lg:col-span-4">
                <GlassCard className="p-4 sm:p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-purple-500/20">
                      <Clock className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                      <h2 className="text-sm font-semibold text-white">
                        Recent Check-ins
                      </h2>
                      <p className="text-[10px] text-white/40">
                        Your latest mood entries
                      </p>
                    </div>
                  </div>

                  {recentMoods.length === 0 ? (
                    <p className="text-white/30 text-xs text-center py-6">
                      No check-ins yet
                    </p>
                  ) : (
                    <Carousel
                      opts={{
                        align: "start",
                        dragFree: true,
                        containScroll: "trimSnaps",
                      }}
                      orientation="vertical"
                      className="w-full"
                    >
                      <CarouselContent className="-mt-2 max-h-[320px]">
                        {recentMoods.map((mood, idx) => {
                          const date = new Date(mood.createdAt);
                          const diff = mood.moodAfter - mood.moodBefore;
                          return (
                            <CarouselItem
                              key={mood.id || idx}
                              className="pt-2 basis-auto"
                            >
                              <div
                                className="p-3 rounded-xl bg-white/[0.03] border border-white/5 space-y-1"
                                data-testid={`mood-checkin-${mood.id || idx}`}
                              >
                                <div className="flex items-center justify-between gap-2 flex-wrap">
                                  <span className="text-[10px] text-white/40">
                                    {date.toLocaleDateString("en-US", {
                                      month: "short",
                                      day: "numeric",
                                    })}
                                  </span>
                                  <span
                                    className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                                      diff > 0
                                        ? "bg-green-500/10 text-green-400"
                                        : diff < 0
                                          ? "bg-red-500/10 text-red-400"
                                          : "bg-white/5 text-white/40"
                                    }`}
                                  >
                                    {diff > 0 ? "+" : ""}
                                    {diff.toFixed(1)}
                                  </span>
                                </div>
                                <div className="flex items-center gap-4 text-xs">
                                  <span className="text-cyan-400">
                                    Before: {mood.moodBefore}
                                  </span>
                                  <span className="text-purple-400">
                                    After: {mood.moodAfter}
                                  </span>
                                </div>
                                {mood.note && (
                                  <p className="text-[10px] text-white/30 truncate">
                                    {mood.note}
                                  </p>
                                )}
                              </div>
                            </CarouselItem>
                          );
                        })}
                      </CarouselContent>
                      {recentMoods.length > 3 && (
                        <>
                          <CarouselPrevious className="bg-white/5 border-white/10 text-white" />
                          <CarouselNext className="bg-white/5 border-white/10 text-white" />
                        </>
                      )}
                    </Carousel>
                  )}
                </GlassCard>
              </div>
            </motion.div>
          </>
        )}
      </motion.div>
    </Layout>
  );
}
