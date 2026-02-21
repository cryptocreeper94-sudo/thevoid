import { useState, useRef, useCallback } from "react";
import { Layout } from "@/components/ui/Layout";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { useMeta } from "@/hooks/use-meta";
import { GlassCard } from "@/components/ui/GlassCard";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import {
  Shield,
  Play,
  Pause,
  Mic,
  FileAudio,
  Palette,
  Lock,
  Calendar,
  Eye,
  X,
  Cloud,
  Loader2,
  Clock,
} from "lucide-react";

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

type SourceFilter = "all" | "vent" | "voice-journal" | "void-echo" | "mood-portrait";

const SOURCES: { key: SourceFilter; label: string; icon: typeof Mic }[] = [
  { key: "all", label: "All Media", icon: Cloud },
  { key: "vent", label: "Vents", icon: Mic },
  { key: "voice-journal", label: "Journals", icon: FileAudio },
  { key: "void-echo", label: "Echoes", icon: Clock },
  { key: "mood-portrait", label: "Portraits", icon: Palette },
];

const SOURCE_COLORS: Record<string, { text: string; bg: string; border: string; gradient: string }> = {
  vent: { text: "text-cyan-400", bg: "bg-cyan-500/15", border: "border-cyan-500/25", gradient: "from-cyan-500/20 via-cyan-600/10" },
  "voice-journal": { text: "text-purple-400", bg: "bg-purple-500/15", border: "border-purple-500/25", gradient: "from-purple-500/20 via-purple-600/10" },
  "void-echo": { text: "text-amber-400", bg: "bg-amber-500/15", border: "border-amber-500/25", gradient: "from-amber-500/20 via-amber-600/10" },
  "mood-portrait": { text: "text-pink-400", bg: "bg-pink-500/15", border: "border-pink-500/25", gradient: "from-pink-500/20 via-pink-600/10" },
};

function getSourceStyle(source: string) {
  return SOURCE_COLORS[source] || { text: "text-white/70", bg: "bg-white/10", border: "border-white/20", gradient: "from-white/10 via-white/5" };
}

function getSourceIcon(source: string) {
  switch (source) {
    case "vent": return Mic;
    case "voice-journal": return FileAudio;
    case "void-echo": return Clock;
    case "mood-portrait": return Palette;
    default: return Cloud;
  }
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

interface MediaItem {
  mediaId: string;
  mediaType: string;
  source: string;
  title: string;
  format: string;
  url?: string;
  cdnUrl?: string;
  tags?: string[];
  metadata?: Record<string, any>;
  createdAt: string;
}

interface LibraryResponse {
  items: MediaItem[];
  total: number;
  hasMore: boolean;
}

function AudioPlayer({ url, mediaId }: { url?: string; mediaId: string }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);

  const toggle = useCallback(async () => {
    if (loading) return;

    if (!audioRef.current) {
      setLoading(true);
      try {
        let audioUrl = url;
        if (!audioUrl) {
          const res = await fetch(`/api/trustvault/media/${mediaId}`);
          const data = await res.json();
          audioUrl = data?.cdnUrl || data?.url;
        }
        if (audioUrl) {
          audioRef.current = new Audio(audioUrl);
          audioRef.current.addEventListener("ended", () => setPlaying(false));
        }
      } catch {
        setLoading(false);
        return;
      }
      setLoading(false);
    }

    if (audioRef.current) {
      if (playing) {
        audioRef.current.pause();
        setPlaying(false);
      } else {
        audioRef.current.play().catch(() => {});
        setPlaying(true);
      }
    }
  }, [url, mediaId, playing, loading]);

  return (
    <Button
      size="icon"
      variant="ghost"
      onClick={(e) => { e.stopPropagation(); toggle(); }}
      data-testid={`button-play-${mediaId}`}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
      ) : playing ? (
        <Pause className="w-4 h-4 text-cyan-400" />
      ) : (
        <Play className="w-4 h-4 text-white/60" />
      )}
    </Button>
  );
}

function getUserId(): number {
  return parseInt(localStorage.getItem("void-user-id") || "0");
}

export default function TrustVaultLibraryPage() {
  useDocumentTitle("TrustVault — Encrypted Media Library");
  useMeta({
    description: "Browse your encrypted media archive stored in TrustVault. Access your vents, voice journals, void echoes, and mood portraits.",
    ogTitle: "TrustVault Library — THE VOID",
    ogDescription: "Your encrypted media archive powered by TrustVault.",
    canonicalPath: "/vault",
  });

  const [source, setSource] = useState<SourceFilter>("all");
  const [expandedItem, setExpandedItem] = useState<MediaItem | null>(null);
  const [statIndex, setStatIndex] = useState(0);
  const userId = getUserId();

  const { data: library, isLoading, isError } = useQuery<LibraryResponse>({
    queryKey: ["/api/trustvault/library", userId, source],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: "50", sort: "newest" });
      if (source !== "all") params.set("source", source);
      const res = await fetch(`/api/trustvault/library/${userId}?${params.toString()}`);
      if (res.status === 403) {
        const data = await res.json();
        throw new Error(data.requiresPremium ? "premium_required" : "forbidden");
      }
      if (!res.ok) throw new Error("Failed to fetch library");
      return res.json();
    },
    enabled: userId > 0,
    retry: false,
  });

  const { data: health } = useQuery<{ connected: boolean }>({
    queryKey: ["/api/trustvault/health"],
  });

  const items = library?.items || [];
  const isPremiumRequired = isError;

  const statCards = [
    { label: "Encrypted Items", value: library?.total || 0, icon: Lock, color: "text-cyan-400" },
    { label: "Vent Recordings", value: items.filter(i => i.source === "vent").length, icon: Mic, color: "text-purple-400" },
    { label: "Voice Journals", value: items.filter(i => i.source === "voice-journal").length, icon: FileAudio, color: "text-amber-400" },
    { label: "Mood Portraits", value: items.filter(i => i.source === "mood-portrait").length, icon: Palette, color: "text-pink-400" },
  ];

  const statTouchStart = useRef<number>(0);
  const handleStatSwipeStart = (e: React.TouchEvent) => { statTouchStart.current = e.touches[0].clientX; };
  const handleStatSwipeEnd = (e: React.TouchEvent) => {
    const diff = statTouchStart.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) {
      setStatIndex(prev => diff > 0 ? Math.min(prev + 1, statCards.length - 1) : Math.max(prev - 1, 0));
    }
  };

  return (
    <Layout>
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        className="max-w-6xl mx-auto px-4 py-8 space-y-6"
      >
        <motion.div variants={fadeUp}>
          <GlassCard className="relative overflow-hidden p-0">
            <div className="relative h-40 sm:h-48">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-600/30 via-purple-600/20 to-pink-600/10" />
              <motion.div
                animate={{ scale: [1, 1.3, 1], opacity: [0.15, 0.25, 0.15] }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-0 right-0 w-[300px] h-[300px] rounded-full"
                style={{ background: "radial-gradient(circle, rgba(6,182,212,0.3) 0%, transparent 70%)" }}
              />
              <motion.div
                animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
                transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                className="absolute bottom-0 left-0 w-[250px] h-[250px] rounded-full"
                style={{ background: "radial-gradient(circle, rgba(168,85,247,0.3) 0%, transparent 70%)" }}
              />
              <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-2xl bg-cyan-500/20 backdrop-blur-sm border border-cyan-500/20">
                    <Shield className="w-7 h-7 text-cyan-400" />
                  </div>
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-black text-white font-display tracking-wide" data-testid="text-vault-title">
                      TrustVault
                    </h1>
                    <p className="text-xs sm:text-sm text-white/50 mt-1 flex items-center gap-2">
                      <Lock className="w-3 h-3" />
                      Encrypted Media Archive
                      {health?.connected && (
                        <span className="flex items-center gap-1 text-emerald-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          Connected
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {isPremiumRequired && (
          <motion.div variants={fadeUp}>
            <GlassCard className="p-8 text-center">
              <div className="p-4 rounded-2xl bg-purple-500/10 inline-block mb-4">
                <Lock className="w-10 h-10 text-purple-400" />
              </div>
              <h2 className="text-xl font-bold text-white font-display mb-2" data-testid="text-premium-gate">
                Premium Feature
              </h2>
              <p className="text-sm text-white/50 max-w-md mx-auto mb-6">
                TrustVault encrypted media storage is included with your Premium subscription.
                All your vents, journals, echoes, and portraits are automatically archived and encrypted.
              </p>
              <Button
                onClick={() => window.location.href = "/settings"}
                className="bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-semibold px-8"
                data-testid="button-upgrade-premium"
              >
                Upgrade to Premium
              </Button>
            </GlassCard>
          </motion.div>
        )}

        {!isPremiumRequired && (
          <motion.div variants={fadeUp}>
            <div
              className="relative overflow-hidden"
              onTouchStart={handleStatSwipeStart}
              onTouchEnd={handleStatSwipeEnd}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={statIndex}
                  initial={{ opacity: 0, x: 80 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -80 }}
                  transition={{ duration: 0.35, ease: "easeInOut" }}
                >
                  <GlassCard className="p-8 text-center">
                    {(() => {
                      const stat = statCards[statIndex];
                      return (
                        <>
                          <stat.icon className={`w-8 h-8 ${stat.color} mx-auto mb-3`} />
                          <p className="text-4xl font-black text-white font-display" data-testid={`text-stat-${stat.label.toLowerCase().replace(/\s+/g, "-")}`}>
                            {isLoading ? "—" : stat.value}
                          </p>
                          <p className="text-xs tracking-[0.3em] uppercase text-white/40 mt-2">{stat.label}</p>
                        </>
                      );
                    })()}
                  </GlassCard>
                </motion.div>
              </AnimatePresence>
              <div className="flex justify-center gap-1.5 mt-3" data-testid="dots-stat-carousel">
                {statCards.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setStatIndex(i)}
                    className={`rounded-full transition-all duration-300 ${i === statIndex ? "w-6 h-1.5 bg-cyan-400" : "w-1.5 h-1.5 bg-white/20"}`}
                    data-testid={`dot-stat-${i}`}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {!isPremiumRequired && (
          <motion.div variants={fadeUp}>
            <GlassCard className="p-4">
              <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                {SOURCES.map((s) => (
                  <Button
                    key={s.key}
                    variant={source === s.key ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setSource(s.key)}
                    className="shrink-0 text-xs gap-1.5"
                    data-testid={`button-filter-${s.key}`}
                  >
                    <s.icon className="w-3.5 h-3.5" />
                    {s.label}
                  </Button>
                ))}
              </div>
            </GlassCard>
          </motion.div>
        )}

        {!isPremiumRequired && (
          <motion.div variants={fadeUp}>
            {isLoading ? (
              <div className="px-8 sm:px-12">
                <Carousel opts={{ align: "start" }}>
                  <CarouselContent className="-ml-4">
                    {[1, 2, 3, 4].map((i) => (
                      <CarouselItem key={i} className="pl-4 basis-full sm:basis-[280px] md:basis-[320px]">
                        <div className="animate-pulse rounded-2xl border border-white/5 bg-white/[0.03] overflow-hidden">
                          <div className="h-24 bg-white/5" />
                          <div className="p-4 space-y-3">
                            <div className="h-4 bg-white/5 rounded-lg w-2/3" />
                            <div className="h-3 bg-white/5 rounded-lg w-1/2" />
                            <div className="h-3 bg-white/5 rounded-lg w-1/3" />
                          </div>
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                </Carousel>
              </div>
            ) : items.length === 0 ? (
              <GlassCard className="p-10 text-center">
                <div className="p-4 rounded-2xl bg-white/5 inline-block mb-4">
                  <Cloud className="w-10 h-10 text-white/20" />
                </div>
                <p className="text-sm text-white/40 max-w-sm mx-auto" data-testid="text-empty-vault">
                  {source === "all"
                    ? "Your vault is empty. Start venting, journaling, or creating to build your encrypted archive."
                    : `No ${source.replace("-", " ")} media found. Create some to see them here.`}
                </p>
              </GlassCard>
            ) : (
              <div className="px-8 sm:px-12">
                <Carousel opts={{ align: "start", dragFree: true, containScroll: "trimSnaps" }}>
                  <CarouselContent className="-ml-4">
                    {items.map((item) => {
                      const style = getSourceStyle(item.source);
                      const SourceIcon = getSourceIcon(item.source);
                      const isAudio = item.mediaType === "audio";
                      return (
                        <CarouselItem
                          key={item.mediaId}
                          className="pl-4 basis-full sm:basis-[280px] md:basis-[320px]"
                        >
                          <GlassCard hoverEffect className="cursor-pointer p-0 overflow-hidden h-full">
                            <div
                              onClick={() => setExpandedItem(item)}
                              className="flex flex-col h-full"
                              data-testid={`card-media-${item.mediaId}`}
                            >
                              <div className={`h-24 bg-gradient-to-br ${style.gradient} to-transparent relative`}>
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <div className={`p-3 rounded-xl ${style.bg} backdrop-blur-sm border ${style.border}`}>
                                    <SourceIcon className={`w-6 h-6 ${style.text}`} />
                                  </div>
                                </div>
                                <div className="absolute top-3 right-3">
                                  <Lock className="w-3 h-3 text-white/20" />
                                </div>
                                {isAudio && (
                                  <div className="absolute bottom-3 right-3">
                                    <AudioPlayer url={item.cdnUrl || item.url} mediaId={item.mediaId} />
                                  </div>
                                )}
                              </div>

                              <div className="p-4 flex-1 flex flex-col gap-2">
                                <div className="flex items-center justify-between gap-2">
                                  <span
                                    className={`px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-full border ${style.text} ${style.bg} ${style.border}`}
                                  >
                                    {item.source.replace("-", " ")}
                                  </span>
                                  <span className="text-[10px] text-white/30 flex items-center gap-1">
                                    <Calendar className="w-2.5 h-2.5" />
                                    {formatDate(item.createdAt)}
                                  </span>
                                </div>

                                <p className="text-sm text-white/80 font-medium line-clamp-2 flex-1">
                                  {item.title}
                                </p>

                                <div className="flex items-center justify-between pt-2 border-t border-white/5">
                                  <span className="text-[10px] text-white/25 uppercase tracking-wider">
                                    {item.format} · {isAudio ? "encrypted audio" : "encrypted"}
                                  </span>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-[10px] text-white/40"
                                    onClick={(e) => { e.stopPropagation(); setExpandedItem(item); }}
                                    data-testid={`button-view-${item.mediaId}`}
                                  >
                                    <Eye className="w-3 h-3 mr-1" />
                                    View
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </GlassCard>
                        </CarouselItem>
                      );
                    })}
                  </CarouselContent>
                  <CarouselPrevious
                    className="bg-white/5 border-white/10 text-white"
                    data-testid="button-carousel-prev"
                  />
                  <CarouselNext
                    className="bg-white/5 border-white/10 text-white"
                    data-testid="button-carousel-next"
                  />
                </Carousel>
              </div>
            )}
          </motion.div>
        )}

        {!isPremiumRequired && (
          <motion.div variants={fadeUp}>
            <GlassCard className="p-4 flex items-center gap-3">
              <Shield className="w-5 h-5 text-emerald-400 shrink-0" />
              <p className="text-[11px] text-white/40 leading-relaxed">
                All media is encrypted at rest via TrustVault's end-to-end encryption protocol.
                Your data never leaves the DarkWave ecosystem unencrypted.
              </p>
            </GlassCard>
          </motion.div>
        )}
      </motion.div>

      <AnimatePresence>
        {expandedItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={() => setExpandedItem(null)}
            data-testid="overlay-media-detail"
          >
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-3xl bg-[rgba(12,18,36,0.85)] backdrop-blur-2xl border border-white/10 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 z-10 flex items-center justify-between p-4 sm:p-5 border-b border-white/5 bg-[rgba(12,18,36,0.9)] backdrop-blur-xl rounded-t-3xl">
                <div className="flex items-center gap-3">
                  {(() => {
                    const s = getSourceStyle(expandedItem.source);
                    return (
                      <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full border ${s.text} ${s.bg} ${s.border}`}>
                        {expandedItem.source.replace("-", " ")}
                      </span>
                    );
                  })()}
                  <span className="text-xs text-white/40">{formatDate(expandedItem.createdAt)}</span>
                </div>
                <div className="flex items-center gap-2">
                  {expandedItem.mediaType === "audio" && (
                    <AudioPlayer url={expandedItem.cdnUrl || expandedItem.url} mediaId={expandedItem.mediaId} />
                  )}
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setExpandedItem(null)}
                    data-testid="button-close-detail"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="p-5 sm:p-6 space-y-5">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-white/30 mb-2">Title</p>
                  <p className="text-lg text-white/90 font-semibold font-display" data-testid="text-detail-title">
                    {expandedItem.title}
                  </p>
                </div>

                <Carousel opts={{ align: "start" }}>
                  <CarouselContent className="-ml-3">
                    {[
                      { label: "Format", value: expandedItem.format },
                      { label: "Type", value: expandedItem.mediaType },
                      { label: "Created", value: formatTime(expandedItem.createdAt) },
                      { label: "Status", value: "Encrypted", isEncrypted: true },
                    ].map((detail, idx) => (
                      <CarouselItem key={idx} className="pl-3 basis-1/2">
                        <div className="rounded-xl bg-white/5 border border-white/5 p-3">
                          <p className="text-[10px] uppercase tracking-wider text-white/30 mb-1">{detail.label}</p>
                          {"isEncrypted" in detail ? (
                            <p className="text-sm text-emerald-400 flex items-center gap-1 capitalize">
                              <Lock className="w-3 h-3" /> Encrypted
                            </p>
                          ) : (
                            <p className="text-sm text-white/70 capitalize">{detail.value}</p>
                          )}
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                </Carousel>

                {expandedItem.tags && expandedItem.tags.length > 0 && (
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-white/30 mb-2">Tags</p>
                    <div className="flex flex-wrap gap-1.5">
                      {expandedItem.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 text-[10px] text-white/50 bg-white/5 border border-white/10 rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {expandedItem.metadata && Object.keys(expandedItem.metadata).length > 0 && (
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-white/30 mb-2">Metadata</p>
                    <GlassCard className="p-3 space-y-1.5">
                      {Object.entries(expandedItem.metadata).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between text-xs">
                          <span className="text-white/40 capitalize">{key.replace(/([A-Z])/g, " $1").trim()}</span>
                          <span className="text-white/60">{String(value)}</span>
                        </div>
                      ))}
                    </GlassCard>
                  </div>
                )}

                <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                  <Shield className="w-4 h-4 text-emerald-400/50" />
                  <p className="text-[10px] text-white/30">
                    ID: {expandedItem.mediaId}
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Layout>
  );
}
