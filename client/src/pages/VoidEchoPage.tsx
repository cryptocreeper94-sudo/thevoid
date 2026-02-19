import { useState } from "react";
import { Layout } from "@/components/ui/Layout";
import { GlassCard } from "@/components/ui/GlassCard";
import { motion } from "framer-motion";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Timer, Lock, Unlock, Send, Clock, Mail } from "lucide-react";

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

interface VoidEcho {
  id: number;
  userId: number;
  transcript: string;
  deliverAt: string;
  deliveredAt: string | null;
  aiNote: string | null;
  createdAt: string;
}

function getUserId(): number {
  return parseInt(localStorage.getItem("void-user-id") || "1");
}

function getMinDate(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split("T")[0];
}

export default function VoidEchoPage() {
  const [transcript, setTranscript] = useState("");
  const [deliverAt, setDeliverAt] = useState("");
  const [lastAiNote, setLastAiNote] = useState<string | null>(null);

  const userId = getUserId();

  const { data: echoes, isLoading } = useQuery<VoidEcho[]>({
    queryKey: ["/api/void-echoes", `?userId=${userId}`],
    enabled: userId > 0,
  });

  useQuery({
    queryKey: ["/api/void-echoes/pending", `?userId=${userId}`],
    enabled: userId > 0,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/void-echoes", {
        userId,
        transcript,
        deliverAt,
      });
      return res.json();
    },
    onSuccess: (data: VoidEcho) => {
      queryClient.invalidateQueries({ queryKey: ["/api/void-echoes"] });
      setTranscript("");
      setDeliverAt("");
      setLastAiNote(data.aiNote || null);
    },
  });

  const canSubmit = transcript.trim().length > 0 && deliverAt.length > 0;

  const pending = echoes?.filter((e) => !e.deliveredAt) || [];
  const delivered = echoes?.filter((e) => !!e.deliveredAt) || [];

  return (
    <Layout>
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8"
      >
        <motion.div variants={fadeUp} className="text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 mb-4">
            <Timer className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-xs font-medium text-muted-foreground tracking-wide uppercase">
              Time Capsule
            </span>
          </div>
          <h1
            className="text-3xl md:text-4xl font-bold text-foreground font-display mb-2"
            data-testid="text-void-echo-title"
          >
            Void Echo
          </h1>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Seal a message to your future self. It will wait in the void until the time is right.
          </p>
        </motion.div>

        <motion.div variants={fadeUp}>
          <GlassCard className="overflow-hidden">
            <div className="p-4 sm:p-6 space-y-5">
              <div className="flex items-center gap-2 mb-2">
                <Mail className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-semibold text-foreground">Create Echo</h3>
              </div>

              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">
                  Message to Future You
                </label>
                <Textarea
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  placeholder="Dear future me..."
                  className="resize-none border-white/10 bg-white/5 text-foreground min-h-[120px] focus-visible:ring-cyan-500/50"
                  data-testid="input-echo-transcript"
                />
              </div>

              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Clock className="w-3 h-3" />
                  Delivery Date
                </label>
                <input
                  type="date"
                  value={deliverAt}
                  min={getMinDate()}
                  onChange={(e) => setDeliverAt(e.target.value)}
                  className="w-full rounded-md border border-white/10 bg-white/5 text-foreground px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 [color-scheme:dark]"
                  data-testid="input-echo-date"
                />
              </div>

              <Button
                onClick={() => createMutation.mutate()}
                disabled={!canSubmit || createMutation.isPending}
                className="w-full bg-gradient-to-r from-cyan-600 to-blue-600"
                data-testid="button-seal-echo"
              >
                {createMutation.isPending ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Sealing...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    Seal Echo
                  </span>
                )}
              </Button>

              {lastAiNote && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/20"
                  data-testid="text-ai-companion-note"
                >
                  <p className="text-[10px] text-cyan-400 uppercase tracking-wider font-semibold mb-1">
                    Companion Note
                  </p>
                  <p className="text-sm text-foreground/80 leading-relaxed">{lastAiNote}</p>
                </motion.div>
              )}
            </div>
          </GlassCard>
        </motion.div>

        <motion.div variants={fadeUp}>
          <GlassCard className="overflow-hidden">
            <div className="p-4 sm:p-6">
              <div className="flex items-center gap-2 mb-4">
                <Timer className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-semibold text-foreground">Your Echoes</h3>
              </div>

              {isLoading ? (
                <div className="animate-pulse space-y-4">
                  <div className="h-40 bg-white/[0.03] rounded-xl border border-white/5" />
                </div>
              ) : !echoes || echoes.length === 0 ? (
                <div className="text-center py-12">
                  <Mail className="w-10 h-10 text-white/10 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">
                    No echoes yet. Seal a message to see it here.
                  </p>
                </div>
              ) : (
                <div
                  className="flex flex-nowrap gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-thin scrollbar-thumb-white/10"
                  data-testid="carousel-echoes"
                >
                  {pending.map((echo) => (
                    <div
                      key={echo.id}
                      className="snap-start shrink-0 w-[280px] sm:w-[320px] bg-white/[0.02] backdrop-blur-xl border border-white/[0.06] rounded-xl p-4 space-y-3"
                      data-testid={`card-echo-pending-${echo.id}`}
                    >
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full border bg-slate-500/20 text-slate-400 border-slate-500/30">
                          <Lock className="w-3 h-3" />
                          Sealed
                        </span>
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(echo.deliverAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                      </div>

                      <div className="flex items-center justify-center py-6">
                        <div className="p-4 rounded-full bg-white/[0.03] border border-white/[0.06]">
                          <Lock className="w-8 h-8 text-slate-500/60" />
                        </div>
                      </div>

                      <p className="text-xs text-muted-foreground text-center italic">
                        This echo is sealed until delivery
                      </p>
                    </div>
                  ))}

                  {delivered.map((echo) => (
                    <div
                      key={echo.id}
                      className="snap-start shrink-0 w-[280px] sm:w-[320px] bg-white/[0.04] backdrop-blur-xl border border-cyan-500/20 rounded-xl p-4 space-y-3"
                      data-testid={`card-echo-delivered-${echo.id}`}
                    >
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full border bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
                          <Unlock className="w-3 h-3" />
                          Delivered
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(echo.deliveredAt!).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                      </div>

                      <p
                        className="text-sm text-foreground/90 leading-relaxed"
                        data-testid={`text-echo-transcript-${echo.id}`}
                      >
                        {echo.transcript}
                      </p>

                      {echo.aiNote && (
                        <div className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                          <p className="text-[10px] text-cyan-400 uppercase tracking-wider font-semibold mb-1">
                            Companion Note
                          </p>
                          <p
                            className="text-xs text-foreground/70 leading-relaxed"
                            data-testid={`text-echo-ai-note-${echo.id}`}
                          >
                            {echo.aiNote}
                          </p>
                        </div>
                      )}

                      <span className="text-[10px] text-muted-foreground block">
                        Sealed on{" "}
                        {new Date(echo.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </GlassCard>
        </motion.div>
      </motion.div>
    </Layout>
  );
}
