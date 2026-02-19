import { Layout } from "@/components/ui/Layout";
import { GlassCard } from "@/components/ui/GlassCard";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { useMeta } from "@/hooks/use-meta";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Activity, Gauge, Zap, Heart, Shield } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

interface VocalBiomarkers {
  energy: number;
  tension: number;
  pace: number;
  warmth: number;
  stability: number;
}

interface VoiceFingerprint {
  id: number;
  userId: number;
  biomarkers: VocalBiomarkers;
  dominantEmotion: string;
  confidence: number;
  summary: string;
  createdAt: string;
}

const BIOMARKER_CONFIG = [
  { key: "energy" as const, label: "Energy", color: "#06b6d4", icon: Zap, bgClass: "bg-cyan-500/20", textClass: "text-cyan-400" },
  { key: "tension" as const, label: "Tension", color: "#ef4444", icon: Activity, bgClass: "bg-red-500/20", textClass: "text-red-400" },
  { key: "pace" as const, label: "Pace", color: "#a855f7", icon: Gauge, bgClass: "bg-purple-500/20", textClass: "text-purple-400" },
  { key: "warmth" as const, label: "Warmth", color: "#f59e0b", icon: Heart, bgClass: "bg-amber-500/20", textClass: "text-amber-400" },
  { key: "stability" as const, label: "Stability", color: "#10b981", icon: Shield, bgClass: "bg-emerald-500/20", textClass: "text-emerald-400" },
];

function CircularMeter({
  value,
  color,
  label,
  icon: Icon,
  size = 120,
  strokeWidth = 8,
}: {
  value: number;
  color: string;
  label: string;
  icon: typeof Activity;
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (value / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={strokeWidth}
          />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference - progress }}
            transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <Icon className="w-4 h-4 mb-0.5" style={{ color }} />
          <motion.span
            className="text-lg font-bold text-white"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            data-testid={`meter-value-${label.toLowerCase()}`}
          >
            {value}
          </motion.span>
        </div>
      </div>
      <span className="text-[10px] uppercase tracking-wider text-white/50 font-medium">
        {label}
      </span>
    </div>
  );
}

function MiniBarChart({ biomarkers }: { biomarkers: VocalBiomarkers }) {
  return (
    <div className="flex items-end gap-1 h-8">
      {BIOMARKER_CONFIG.map((cfg) => {
        const val = biomarkers[cfg.key];
        return (
          <div
            key={cfg.key}
            className="w-2 rounded-sm"
            style={{
              height: `${Math.max(val * 0.8, 4)}%`,
              backgroundColor: cfg.color,
              opacity: 0.7,
              minHeight: "3px",
            }}
            title={`${cfg.label}: ${val}`}
          />
        );
      })}
    </div>
  );
}

function SkeletonLoader() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-48 bg-white/[0.03] rounded-3xl border border-white/5" />
      <div className="grid grid-cols-5 gap-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="h-36 bg-white/[0.03] rounded-3xl border border-white/5"
          />
        ))}
      </div>
      <div className="h-32 bg-white/[0.03] rounded-3xl border border-white/5" />
    </div>
  );
}

export default function VoiceFingerprintPage() {
  useDocumentTitle("Voice Fingerprint - THE VOID");
  useMeta({
    description:
      "Discover how your voice reveals your emotional state with vocal biomarker analysis and emotional fingerprinting.",
    ogTitle: "Voice Fingerprint - THE VOID",
    ogDescription:
      "Emotional voice analysis dashboard showing vocal biomarkers and dominant emotions.",
    canonicalPath: "/voice-fingerprint",
  });

  const userId = parseInt(localStorage.getItem("void-user-id") || "0");

  const { data, isLoading } = useQuery<VoiceFingerprint[]>({
    queryKey: ["/api/voice-fingerprint", `?userId=${userId}`],
    enabled: userId > 0,
  });

  const fingerprints = data || [];
  const latest = fingerprints.length > 0 ? fingerprints[0] : null;
  const history = fingerprints.slice(1);

  return (
    <Layout>
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6"
      >
        <motion.div variants={fadeUp}>
          <GlassCard className="p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2 rounded-lg bg-cyan-500/20">
                <Activity className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10">
                  <span className="text-[10px] font-medium text-white/60 tracking-wide uppercase">
                    Emotional Analysis
                  </span>
                </div>
              </div>
            </div>
            <h1
              className="text-2xl sm:text-3xl md:text-4xl font-bold text-white font-display mt-3"
              data-testid="text-voice-fingerprint-title"
            >
              Voice Fingerprint
            </h1>
            <p className="text-sm text-white/50 mt-1 max-w-lg">
              See how your voice reveals your emotional state through vocal biomarker analysis.
            </p>
          </GlassCard>
        </motion.div>

        {isLoading ? (
          <SkeletonLoader />
        ) : !latest || userId === 0 ? (
          <motion.div variants={fadeUp}>
            <GlassCard className="p-8 text-center">
              <Activity className="w-10 h-10 text-white/20 mx-auto mb-3" />
              <p className="text-white/50 text-sm" data-testid="text-no-data">
                {userId === 0
                  ? "Sign in to view your voice fingerprint."
                  : "No voice fingerprint data yet. Record a session to see your emotional analysis."}
              </p>
            </GlassCard>
          </motion.div>
        ) : (
          <>
            <motion.div variants={fadeUp}>
              <GlassCard className="p-6 sm:p-8" data-testid="card-latest-fingerprint">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-lg bg-purple-500/20">
                    <Gauge className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-white">
                      Latest Analysis
                    </h2>
                    <p className="text-[10px] text-white/40">
                      {new Date(latest.createdAt).toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8 mb-8">
                  {BIOMARKER_CONFIG.map((cfg) => (
                    <CircularMeter
                      key={cfg.key}
                      value={latest.biomarkers[cfg.key]}
                      color={cfg.color}
                      label={cfg.label}
                      icon={cfg.icon}
                    />
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5">
                    <p className="text-[10px] uppercase tracking-wider text-white/40 mb-2">
                      Dominant Emotion
                    </p>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span
                        className="text-xl font-bold text-white capitalize"
                        data-testid="text-dominant-emotion"
                      >
                        {latest.dominantEmotion}
                      </span>
                      <span
                        className="text-sm px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 font-medium"
                        data-testid="text-confidence"
                      >
                        {latest.confidence}% confidence
                      </span>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5">
                    <p className="text-[10px] uppercase tracking-wider text-white/40 mb-2">
                      AI Summary
                    </p>
                    <p
                      className="text-sm text-white/70 leading-relaxed"
                      data-testid="text-ai-summary"
                    >
                      {latest.summary}
                    </p>
                  </div>
                </div>
              </GlassCard>
            </motion.div>

            {history.length > 0 && (
              <motion.div variants={fadeUp}>
                <GlassCard className="p-6 sm:p-8" data-testid="card-history-section">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 rounded-lg bg-emerald-500/20">
                      <Shield className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <h2 className="text-sm font-semibold text-white">
                        Fingerprint History
                      </h2>
                      <p className="text-[10px] text-white/40">
                        Browse your past voice analyses
                      </p>
                    </div>
                  </div>

                  <Carousel
                    opts={{
                      align: "start",
                      dragFree: true,
                      containScroll: "trimSnaps",
                    }}
                    className="w-full"
                  >
                    <CarouselContent className="-ml-3">
                      {history.map((fp, idx) => {
                        const date = new Date(fp.createdAt);
                        return (
                          <CarouselItem
                            key={fp.id || idx}
                            className="pl-3 basis-[260px] sm:basis-[280px] md:basis-[300px]"
                          >
                            <div
                              className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-3 h-full"
                              data-testid={`card-fingerprint-${fp.id || idx}`}
                            >
                              <div className="flex items-center justify-between gap-2 flex-wrap">
                                <span className="text-[10px] text-white/40">
                                  {date.toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  })}
                                </span>
                                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400">
                                  {fp.confidence}%
                                </span>
                              </div>

                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-semibold text-white capitalize">
                                  {fp.dominantEmotion}
                                </span>
                              </div>

                              <div className="flex items-end gap-1.5 h-10">
                                {BIOMARKER_CONFIG.map((cfg) => {
                                  const val = fp.biomarkers[cfg.key];
                                  return (
                                    <div key={cfg.key} className="flex flex-col items-center gap-0.5 flex-1">
                                      <div
                                        className="w-full max-w-[12px] rounded-sm mx-auto"
                                        style={{
                                          height: `${Math.max(val * 0.4, 2)}px`,
                                          backgroundColor: cfg.color,
                                          opacity: 0.8,
                                        }}
                                      />
                                      <span className="text-[7px] text-white/30 uppercase">
                                        {cfg.label.slice(0, 3)}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>

                              <p className="text-[10px] text-white/40 line-clamp-2 leading-relaxed">
                                {fp.summary}
                              </p>
                            </div>
                          </CarouselItem>
                        );
                      })}
                    </CarouselContent>
                    {history.length > 2 && (
                      <>
                        <CarouselPrevious
                          className="bg-white/5 border-white/10 text-white"
                          data-testid="button-history-prev"
                        />
                        <CarouselNext
                          className="bg-white/5 border-white/10 text-white"
                          data-testid="button-history-next"
                        />
                      </>
                    )}
                  </Carousel>
                </GlassCard>
              </motion.div>
            )}
          </>
        )}
      </motion.div>
    </Layout>
  );
}
