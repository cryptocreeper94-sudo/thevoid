import { useState } from "react";
import { Layout } from "@/components/ui/Layout";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { useMeta } from "@/hooks/use-meta";
import { GlassCard } from "@/components/ui/GlassCard";
import { motion } from "framer-motion";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { BookOpen, Send, Trash2, Sparkles, Brain } from "lucide-react";
import journalImg from "@/assets/images/journal-write.webp";

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const MOOD_TAGS = [
  { key: "Angry", color: "bg-red-500/20 text-red-400 border-red-500/30" },
  { key: "Sad", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  { key: "Anxious", color: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
  { key: "Happy", color: "bg-green-500/20 text-green-400 border-green-500/30" },
  { key: "Frustrated", color: "bg-orange-500/20 text-orange-400 border-orange-500/30" },
  { key: "Hopeful", color: "bg-teal-500/20 text-teal-400 border-teal-500/30" },
  { key: "Exhausted", color: "bg-slate-500/20 text-slate-400 border-slate-500/30" },
  { key: "Grateful", color: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
] as const;

const MOOD_COLOR_MAP: Record<string, string> = {
  Angry: "bg-red-500/20 text-red-400 border-red-500/30",
  Sad: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  Anxious: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  Happy: "bg-green-500/20 text-green-400 border-green-500/30",
  Frustrated: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  Hopeful: "bg-teal-500/20 text-teal-400 border-teal-500/30",
  Exhausted: "bg-slate-500/20 text-slate-400 border-slate-500/30",
  Grateful: "bg-purple-500/20 text-purple-400 border-purple-500/30",
};

const PERSONALITIES = [
  { key: "smart-ass", label: "Smart-Ass" },
  { key: "calming", label: "Calming" },
  { key: "therapist", label: "Therapist" },
  { key: "hype-man", label: "Hype-Man" },
  { key: "roast-master", label: "Roast-Master" },
] as const;

interface JournalEntry {
  id: number;
  userId: number;
  content: string;
  moodTag: string;
  personality: string | null;
  aiResponse: string | null;
  createdAt: string;
}

function getUserId(): number {
  return parseInt(localStorage.getItem("void-user-id") || "0");
}

export default function JournalPage() {
  useDocumentTitle("Journal — Write It Out");
  useMeta({
    description: "Private journal for venting, reflecting, and processing emotions. Write freely with optional AI feedback from different personalities.",
    ogTitle: "Journal — THE VOID",
    ogDescription: "Write it out. Process your emotions with optional AI feedback.",
    canonicalPath: "/journal",
  });

  const [content, setContent] = useState("");
  const [moodTag, setMoodTag] = useState("");
  const [personality, setPersonality] = useState("");

  const userId = getUserId();

  const { data: entries, isLoading } = useQuery<JournalEntry[]>({
    queryKey: ["/api/journal", `?userId=${userId}`],
    enabled: userId > 0,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/journal", {
        userId,
        content,
        moodTag,
        personality: personality || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/journal"] });
      setContent("");
      setMoodTag("");
      setPersonality("");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/journal/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/journal"] });
    },
  });

  const canSubmit = content.trim().length > 0 && moodTag.length > 0;

  return (
    <Layout>
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6"
      >
        <motion.div variants={fadeUp} className="text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 mb-4">
            <BookOpen className="w-3.5 h-3.5 text-purple-400" />
            <span className="text-xs font-medium text-muted-foreground tracking-wide uppercase">Journal</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground font-display mb-2" data-testid="text-journal-title">
            Write It Out
          </h1>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Let it flow. No filter, no judgment. Just you and the page.
          </p>
        </motion.div>

        <motion.div variants={fadeUp}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5">
              <GlassCard className="overflow-hidden">
                <div className="relative h-32 overflow-hidden">
                  <img src={journalImg} alt="" className="absolute inset-0 w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-black/90" />
                  <div className="absolute bottom-0 left-0 right-0 p-4 flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-500/20 backdrop-blur-sm">
                      <BookOpen className="w-5 h-5 text-purple-400" />
                    </div>
                    <h3 className="text-sm font-semibold text-white">New Entry</h3>
                  </div>
                </div>

                <div className="p-4 sm:p-6 space-y-5">
                  <div>
                    <label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">
                      What's on your mind?
                    </label>
                    <Textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="Let it all out..."
                      className="resize-none border-white/10 bg-white/5 text-foreground min-h-[120px] focus-visible:ring-purple-500/50"
                      data-testid="input-journal-content"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">
                      How are you feeling?
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {MOOD_TAGS.map((mood) => (
                        <button
                          key={mood.key}
                          onClick={() => setMoodTag(moodTag === mood.key ? "" : mood.key)}
                          className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all duration-200 ${
                            moodTag === mood.key
                              ? `${mood.color} ring-1 ring-white/20`
                              : "bg-white/5 text-muted-foreground border-white/10"
                          }`}
                          data-testid={`button-mood-${mood.key.toLowerCase()}`}
                        >
                          {mood.key}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Brain className="w-3 h-3" />
                      AI Response (optional)
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {PERSONALITIES.map((p) => (
                        <button
                          key={p.key}
                          onClick={() => setPersonality(personality === p.key ? "" : p.key)}
                          className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all duration-200 ${
                            personality === p.key
                              ? "bg-indigo-500/20 text-indigo-400 border-indigo-500/30 ring-1 ring-white/20"
                              : "bg-white/5 text-muted-foreground border-white/10"
                          }`}
                          data-testid={`button-personality-${p.key}`}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <Button
                    onClick={() => createMutation.mutate()}
                    disabled={!canSubmit || createMutation.isPending}
                    className="w-full bg-gradient-to-r from-purple-600 to-indigo-600"
                    data-testid="button-journal-submit"
                  >
                    {createMutation.isPending ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Submitting...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Send className="w-4 h-4" />
                        Submit Entry
                      </span>
                    )}
                  </Button>
                </div>
              </GlassCard>
            </div>

            <div className="lg:col-span-7">
              <GlassCard className="overflow-hidden">
                <div className="p-4 sm:p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <h3 className="text-sm font-semibold text-foreground">Past Entries</h3>
                  </div>

                  {isLoading ? (
                    <div className="animate-pulse space-y-4">
                      <div className="h-40 bg-white/[0.03] rounded-xl border border-white/5" />
                      <div className="h-4 w-3/4 bg-white/5 rounded" />
                      <div className="h-4 w-1/2 bg-white/5 rounded" />
                    </div>
                  ) : !entries || entries.length === 0 ? (
                    <div className="text-center py-12">
                      <BookOpen className="w-10 h-10 text-white/10 mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground">No entries yet. Start writing to see them here.</p>
                    </div>
                  ) : (
                    <Carousel opts={{ align: "start", dragFree: true, containScroll: "trimSnaps" }}>
                      <CarouselContent className="-ml-4">
                        {entries.map((entry) => (
                          <CarouselItem key={entry.id} className="pl-4 basis-full sm:basis-[320px]">
                            <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-xl p-4 space-y-3 h-full">
                              <div className="flex items-center justify-between gap-2 flex-wrap">
                                <span
                                  className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full border ${
                                    MOOD_COLOR_MAP[entry.moodTag] || "bg-white/5 text-muted-foreground border-white/10"
                                  }`}
                                  data-testid={`badge-mood-${entry.id}`}
                                >
                                  {entry.moodTag}
                                </span>
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] text-muted-foreground">
                                    {new Date(entry.createdAt).toLocaleDateString("en-US", {
                                      month: "short",
                                      day: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </span>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => deleteMutation.mutate(entry.id)}
                                    disabled={deleteMutation.isPending}
                                    data-testid={`button-delete-entry-${entry.id}`}
                                  >
                                    <Trash2 className="w-3.5 h-3.5 text-red-400/60" />
                                  </Button>
                                </div>
                              </div>

                              <p className="text-sm text-foreground/80 line-clamp-4 leading-relaxed" data-testid={`text-entry-content-${entry.id}`}>
                                {entry.content}
                              </p>

                              {entry.personality && (
                                <span className="inline-block px-2 py-0.5 text-[10px] font-medium text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 rounded-full">
                                  {entry.personality}
                                </span>
                              )}

                              {entry.aiResponse && (
                                <div className="mt-2 p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                                  <p className="text-[10px] text-purple-400 uppercase tracking-wider font-semibold mb-1">AI Response</p>
                                  <p className="text-xs text-foreground/70 leading-relaxed" data-testid={`text-ai-response-${entry.id}`}>
                                    {entry.aiResponse}
                                  </p>
                                </div>
                              )}
                            </div>
                          </CarouselItem>
                        ))}
                      </CarouselContent>
                      <CarouselPrevious className="bg-white/5 border-white/10 text-white -left-3 sm:-left-5" data-testid="button-carousel-prev" />
                      <CarouselNext className="bg-white/5 border-white/10 text-white -right-3 sm:-right-5" data-testid="button-carousel-next" />
                    </Carousel>
                  )}
                </div>
              </GlassCard>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </Layout>
  );
}
