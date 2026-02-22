import { useState, useRef, useCallback } from "react";
import { Layout } from "@/components/ui/Layout";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { useMeta } from "@/hooks/use-meta";
import { GlassCard } from "@/components/ui/GlassCard";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Library, Search, Play, Pause, X, MessageSquare, Mic, Calendar } from "lucide-react";
import libraryImg from "@/assets/images/vent-library.webp";

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

interface Vent {
  id: number;
  userId: string;
  audioUrl: string | null;
  transcript: string;
  response: string;
  personality: string;
  createdAt: string;
}

type PersonalityFilter = "all" | "smart-ass" | "calming" | "therapist" | "hype-man" | "roast-master";

const PERSONALITIES: { key: PersonalityFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "smart-ass", label: "Smart-Ass" },
  { key: "calming", label: "Calming" },
  { key: "therapist", label: "Therapist" },
  { key: "hype-man", label: "Hype Man" },
  { key: "roast-master", label: "Roast Master" },
];

const PERSONALITY_COLORS: Record<string, { text: string; bg: string; border: string }> = {
  "smart-ass": { text: "text-cyan-400", bg: "bg-cyan-500/15", border: "border-cyan-500/25" },
  calming: { text: "text-green-400", bg: "bg-green-500/15", border: "border-green-500/25" },
  therapist: { text: "text-blue-400", bg: "bg-blue-500/15", border: "border-blue-500/25" },
  "hype-man": { text: "text-amber-400", bg: "bg-amber-500/15", border: "border-amber-500/25" },
  "roast-master": { text: "text-red-400", bg: "bg-red-500/15", border: "border-red-500/25" },
};

function getPersonalityStyle(personality: string) {
  return PERSONALITY_COLORS[personality] || { text: "text-white/70", bg: "bg-white/10", border: "border-white/20" };
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function AudioPlayButton({ url }: { url: string }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);

  const toggle = useCallback(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio(url);
      audioRef.current.addEventListener("ended", () => setPlaying(false));
    }
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      audioRef.current.play();
      setPlaying(true);
    }
  }, [url, playing]);

  return (
    <Button
      size="icon"
      variant="ghost"
      onClick={(e) => { e.stopPropagation(); toggle(); }}
      data-testid="button-audio-play"
    >
      {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
    </Button>
  );
}

export default function VentLibraryPage() {
  useDocumentTitle("Vent Library — Your Saved Vents");
  useMeta({
    description: "Browse and revisit your saved venting sessions. Filter by personality, search transcripts, and replay audio.",
    ogTitle: "Vent Library — THE VOID",
    ogDescription: "Your personal collection of venting sessions with AI responses.",
    canonicalPath: "/vent-library",
  });

  const [personality, setPersonality] = useState<PersonalityFilter>("all");
  const [search, setSearch] = useState("");
  const [expandedVent, setExpandedVent] = useState<Vent | null>(null);

  const userId = localStorage.getItem("void-user-id") || "0";

  const queryParams = new URLSearchParams({ userId, personality, search });

  const { data: vents = [], isLoading } = useQuery<Vent[]>({
    queryKey: [`/api/vent-library?${queryParams.toString()}`],
  });

  const ventCount = vents.length;

  return (
    <Layout>
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        className="max-w-5xl mx-auto px-4 py-8 space-y-6"
      >
        <motion.div variants={fadeUp}>
          <GlassCard className="overflow-hidden p-0">
            <div className="relative h-36 sm:h-44 overflow-hidden">
              <img src={libraryImg} alt="" className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/50 to-black/90" />
              <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-purple-500/20 backdrop-blur-sm">
                    <Library className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-white font-display" data-testid="text-library-title">
                      Vent Library
                    </h1>
                    <p className="text-xs sm:text-sm text-white/60 mt-0.5" data-testid="text-library-count">
                      {isLoading ? "Loading..." : `${ventCount} saved vent${ventCount !== 1 ? "s" : ""}`}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        <motion.div variants={fadeUp}>
          <GlassCard className="p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar w-full sm:w-auto">
                {PERSONALITIES.map((p) => (
                  <Button
                    key={p.key}
                    variant={personality === p.key ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setPersonality(p.key)}
                    className="shrink-0 text-xs"
                    data-testid={`button-filter-${p.key}`}
                  >
                    {p.label}
                  </Button>
                ))}
              </div>
              <div className="relative w-full sm:w-56 shrink-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search vents..."
                  className="pl-9 bg-white/5 border-white/10 text-sm"
                  data-testid="input-search-vents"
                />
              </div>
            </div>
          </GlassCard>
        </motion.div>

        <motion.div variants={fadeUp}>
          {isLoading ? (
            <div className="animate-pulse space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-52 bg-white/[0.03] rounded-xl border border-white/5" />
                ))}
              </div>
            </div>
          ) : ventCount === 0 ? (
            <GlassCard className="p-8 text-center">
              <Mic className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
              <p className="text-sm text-muted-foreground" data-testid="text-empty-state">
                No vents found. Start venting to build your library.
              </p>
            </GlassCard>
          ) : (
            <div className="px-8 sm:px-12">
              <Carousel opts={{ align: "start", dragFree: true, containScroll: "trimSnaps" }}>
                <CarouselContent className="-ml-4">
                  {vents.map((vent) => {
                    const style = getPersonalityStyle(vent.personality);
                    return (
                      <CarouselItem
                        key={vent.id}
                        className="pl-4 basis-full sm:basis-[300px] md:basis-[340px]"
                      >
                        <GlassCard
                          hoverEffect
                          className="cursor-pointer p-4 sm:p-5 flex flex-col gap-3 h-full"
                        >
                          <div
                            onClick={() => setExpandedVent(vent)}
                            className="flex flex-col gap-3 flex-1"
                            data-testid={`card-vent-${vent.id}`}
                          >
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <span
                                className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full border ${style.text} ${style.bg} ${style.border}`}
                                data-testid={`badge-personality-${vent.id}`}
                              >
                                {vent.personality.replace("-", " ")}
                              </span>
                              <span className="flex items-center gap-1 text-[10px] text-white/40">
                                <Calendar className="w-3 h-3" />
                                {formatDate(vent.createdAt)}
                              </span>
                            </div>

                            <div className="space-y-2 flex-1">
                              <div>
                                <p className="text-[10px] uppercase tracking-wider text-white/30 mb-1">You said</p>
                                <p className="text-sm text-white/80 leading-relaxed line-clamp-3" data-testid={`text-transcript-${vent.id}`}>
                                  {vent.transcript.length > 100
                                    ? vent.transcript.slice(0, 100) + "..."
                                    : vent.transcript}
                                </p>
                              </div>
                              <div>
                                <p className="text-[10px] uppercase tracking-wider text-white/30 mb-1">AI Response</p>
                                <p className="text-xs text-white/50 leading-relaxed line-clamp-2" data-testid={`text-response-${vent.id}`}>
                                  {vent.response.length > 80
                                    ? vent.response.slice(0, 80) + "..."
                                    : vent.response}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/5">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setExpandedVent(vent)}
                              className="text-xs text-white/50"
                              data-testid={`button-expand-${vent.id}`}
                            >
                              <MessageSquare className="w-3.5 h-3.5 mr-1.5" />
                              View Full
                            </Button>
                            {vent.audioUrl && <AudioPlayButton url={vent.audioUrl} />}
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
      </motion.div>

      <AnimatePresence>
        {expandedVent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={() => setExpandedVent(null)}
            data-testid="overlay-expanded-vent"
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
                    const s = getPersonalityStyle(expandedVent.personality);
                    return (
                      <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full border ${s.text} ${s.bg} ${s.border}`}>
                        {expandedVent.personality.replace("-", " ")}
                      </span>
                    );
                  })()}
                  <span className="text-xs text-white/40">{formatDate(expandedVent.createdAt)}</span>
                </div>
                <div className="flex items-center gap-2">
                  {expandedVent.audioUrl && <AudioPlayButton url={expandedVent.audioUrl} />}
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setExpandedVent(null)}
                    data-testid="button-close-expanded"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="p-5 sm:p-6 space-y-5">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-white/30 mb-2">Your Vent</p>
                  <p className="text-sm text-white/80 leading-relaxed whitespace-pre-wrap" data-testid="text-expanded-transcript">
                    {expandedVent.transcript}
                  </p>
                </div>
                <div className="border-t border-white/5 pt-5">
                  <p className="text-[10px] uppercase tracking-wider text-white/30 mb-2">AI Response</p>
                  <p className="text-sm text-white/60 leading-relaxed whitespace-pre-wrap" data-testid="text-expanded-response">
                    {expandedVent.response}
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
