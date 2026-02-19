import { useState, useRef, useCallback, useEffect } from "react";
import { Layout } from "@/components/ui/Layout";
import { GlassCard } from "@/components/ui/GlassCard";
import { useAppMode } from "@/hooks/use-app-mode";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic,
  Square,
  Loader2,
  Trash2,
  Sparkles,
  Clock,
  Eye,
  EyeOff,
  BookOpen,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";

interface VoiceJournalEntry {
  id: number;
  userId: number;
  rawTranscript: string;
  cleanedTranscript: string | null;
  createdAt: string;
}

function getUserId(): number {
  return parseInt(localStorage.getItem("void-user-id") || "1");
}

function groupByDate(entries: VoiceJournalEntry[]): Record<string, VoiceJournalEntry[]> {
  const groups: Record<string, VoiceJournalEntry[]> = {};
  for (const entry of entries) {
    const date = new Date(entry.createdAt).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
    if (!groups[date]) groups[date] = [];
    groups[date].push(entry);
  }
  return groups;
}

type RecordingState = "idle" | "recording" | "stopped";

const PREFERRED_MIME_TYPES = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/ogg;codecs=opus",
  "audio/ogg",
  "audio/mp4",
  "audio/mpeg",
];

function getSupportedMimeType(): string {
  for (const mt of PREFERRED_MIME_TYPES) {
    if (MediaRecorder.isTypeSupported(mt)) return mt;
  }
  return "";
}

function getFileExtension(mimeType: string): string {
  if (mimeType.includes("webm")) return "webm";
  if (mimeType.includes("ogg")) return "ogg";
  if (mimeType.includes("mp4")) return "mp4";
  if (mimeType.includes("mpeg")) return "mp3";
  return "webm";
}

export default function VoiceJournalPage() {
  const { isPlayMode } = useAppMode();
  const { toast } = useToast();
  const userId = getUserId();

  const [recordingState, setRecordingState] = useState<RecordingState>("idle");
  const [cleanUp, setCleanUp] = useState(true);
  const [lastResult, setLastResult] = useState<{ raw: string; cleaned: string | null } | null>(null);
  const [viewRawMap, setViewRawMap] = useState<Record<number, boolean>>({});

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const mimeTypeRef = useRef("");
  const streamRef = useRef<MediaStream | null>(null);

  const { data: entries, isLoading } = useQuery<VoiceJournalEntry[]>({
    queryKey: ["/api/voice-journal", `?userId=${userId}`],
    enabled: userId > 0,
  });

  const submitMutation = useMutation({
    mutationFn: async (blob: Blob) => {
      const ext = getFileExtension(mimeTypeRef.current);
      const formData = new FormData();
      formData.append("audio", blob, `recording.${ext}`);
      formData.append("cleanUp", String(cleanUp));
      formData.append("isPlayMode", String(isPlayMode));
      formData.append("userId", String(userId));

      const res = await fetch("/api/voice-journal", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || res.statusText);
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/voice-journal"] });
      setLastResult({ raw: data.rawTranscript, cleaned: data.cleanedTranscript });
      toast({ title: "Entry Saved", description: "Your voice journal entry has been transcribed." });
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description: err?.message || "Failed to process recording.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/voice-journal/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/voice-journal"] });
    },
  });

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mimeType = getSupportedMimeType();
      mimeTypeRef.current = mimeType;
      chunksRef.current = [];

      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType || "audio/webm" });
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        if (blob.size > 0) {
          submitMutation.mutate(blob);
        } else {
          toast({
            title: "No Audio",
            description: "Recording was empty. Try speaking louder.",
            variant: "destructive",
          });
        }
        setRecordingState("idle");
      };

      recorder.start();
      setRecordingState("recording");
    } catch {
      toast({
        title: "Microphone Error",
        description: "Could not access microphone. Check browser permissions.",
        variant: "destructive",
      });
    }
  }, [submitMutation, toast]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  }, []);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const handleToggleRecording = () => {
    if (recordingState === "recording") {
      stopRecording();
    } else {
      setLastResult(null);
      startRecording();
    }
  };

  const toggleViewRaw = (id: number) => {
    setViewRawMap((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const grouped = entries ? groupByDate(entries) : {};

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 mb-4">
            <BookOpen className="w-3.5 h-3.5 text-purple-400" />
            <span className="text-xs font-medium text-white/60 tracking-wide uppercase">
              Voice Journal
            </span>
          </div>
          <h1
            className="text-3xl md:text-4xl font-bold text-white font-display mb-2"
            data-testid="text-voice-journal-title"
          >
            Speak Your Mind
          </h1>
          <p className="text-sm text-white/40 max-w-md mx-auto">
            Record your thoughts. We'll transcribe them and optionally clean up the text.
          </p>
        </div>

        <div className="flex flex-col items-center gap-6">
          <GlassCard className="w-full max-w-lg flex flex-col items-center gap-6 py-10">
            <div className="relative flex items-center justify-center w-40 h-40">
              <AnimatePresence>
                {recordingState === "recording" && (
                  <>
                    {[1, 2, 3].map((i) => (
                      <motion.div
                        key={i}
                        className="absolute inset-0 rounded-full border border-red-500/30"
                        initial={{ opacity: 0, scale: 1 }}
                        animate={{ opacity: [0, 0.5, 0], scale: [1, 1.4 + i * 0.2] }}
                        transition={{ repeat: Infinity, duration: 2, delay: i * 0.4 }}
                      />
                    ))}
                  </>
                )}
              </AnimatePresence>

              <motion.button
                onClick={handleToggleRecording}
                disabled={submitMutation.isPending}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`relative z-10 w-28 h-28 rounded-full flex items-center justify-center transition-all duration-300 ${
                  recordingState === "recording"
                    ? "bg-red-500/30 shadow-[0_0_40px_rgba(239,68,68,0.3)]"
                    : "bg-gradient-to-br from-purple-600/40 to-indigo-600/40"
                } border-2 border-white/10`}
                data-testid="button-record"
              >
                <AnimatePresence mode="wait">
                  {submitMutation.isPending ? (
                    <motion.div
                      key="processing"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <Loader2 className="w-10 h-10 text-white animate-spin" />
                    </motion.div>
                  ) : recordingState === "recording" ? (
                    <motion.div
                      key="stop"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                    >
                      <Square className="w-8 h-8 text-white fill-current" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="mic"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                    >
                      <Mic className="w-10 h-10 text-white" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            </div>

            <p className="text-sm font-semibold tracking-[0.2em] uppercase text-white/40 font-display">
              {submitMutation.isPending
                ? "TRANSCRIBING..."
                : recordingState === "recording"
                  ? "LISTENING..."
                  : "TAP TO RECORD"}
            </p>

            <div className="flex items-center gap-3">
              <label
                htmlFor="cleanup-toggle"
                className="text-xs text-white/60 flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                AI Clean Up
              </label>
              <Switch
                id="cleanup-toggle"
                checked={cleanUp}
                onCheckedChange={setCleanUp}
                data-testid="toggle-cleanup"
              />
            </div>
          </GlassCard>

          <AnimatePresence>
            {lastResult && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="w-full max-w-lg"
              >
                <GlassCard>
                  <div className="space-y-3">
                    <h3 className="text-xs text-white/40 uppercase tracking-wider font-semibold">
                      Transcription Result
                    </h3>
                    {lastResult.cleaned ? (
                      <div className="space-y-2">
                        <p
                          className="text-white/80 text-sm leading-relaxed"
                          data-testid="text-transcription-cleaned"
                        >
                          {lastResult.cleaned}
                        </p>
                        <details className="group">
                          <summary
                            className="text-[10px] text-white/30 cursor-pointer hover:text-white/50 transition-colors"
                            data-testid="button-show-raw"
                          >
                            Show raw transcript
                          </summary>
                          <p
                            className="text-white/40 text-xs mt-1 italic leading-relaxed"
                            data-testid="text-transcription-raw"
                          >
                            {lastResult.raw}
                          </p>
                        </details>
                      </div>
                    ) : (
                      <p
                        className="text-white/80 text-sm leading-relaxed"
                        data-testid="text-transcription-raw"
                      >
                        {lastResult.raw}
                      </p>
                    )}
                  </div>
                </GlassCard>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4 text-purple-400" />
            <h2 className="text-sm font-semibold text-white">Past Entries</h2>
          </div>

          {isLoading ? (
            <div className="animate-pulse flex gap-4 overflow-hidden">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="flex-shrink-0 w-72 h-40 bg-white/[0.03] rounded-xl border border-white/5"
                />
              ))}
            </div>
          ) : !entries || entries.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="w-10 h-10 text-white/10 mx-auto mb-3" />
              <p className="text-sm text-white/40">
                No entries yet. Record something to get started.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(grouped).map(([date, dateEntries]) => (
                <div key={date}>
                  <p
                    className="text-xs text-white/30 uppercase tracking-wider mb-3 font-semibold"
                    data-testid={`text-date-group-${date}`}
                  >
                    {date}
                  </p>
                  <div
                    className="flex flex-nowrap gap-4 overflow-x-auto snap-x snap-mandatory pb-4 scrollbar-thin scrollbar-thumb-white/10"
                    data-testid={`carousel-${date}`}
                  >
                    {dateEntries.map((entry) => {
                      const showRaw = viewRawMap[entry.id];
                      const displayText =
                        showRaw || !entry.cleanedTranscript
                          ? entry.rawTranscript
                          : entry.cleanedTranscript;
                      return (
                        <div
                          key={entry.id}
                          className="flex-shrink-0 w-72 sm:w-80 snap-start bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-xl p-4 space-y-3"
                          data-testid={`card-entry-${entry.id}`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] text-white/40">
                              {new Date(entry.createdAt).toLocaleTimeString("en-US", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                            <div className="flex items-center gap-1">
                              {entry.cleanedTranscript && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => toggleViewRaw(entry.id)}
                                  data-testid={`button-toggle-view-${entry.id}`}
                                >
                                  {showRaw ? (
                                    <EyeOff className="w-3.5 h-3.5 text-white/40" />
                                  ) : (
                                    <Eye className="w-3.5 h-3.5 text-white/40" />
                                  )}
                                </Button>
                              )}
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

                          <p
                            className="text-sm text-white/70 leading-relaxed line-clamp-5"
                            data-testid={`text-entry-content-${entry.id}`}
                          >
                            {displayText}
                          </p>

                          {entry.cleanedTranscript && (
                            <span className="inline-block px-2 py-0.5 text-[10px] font-medium text-purple-400 bg-purple-500/10 border border-purple-500/20 rounded-full">
                              {showRaw ? "Raw" : "Cleaned"}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
