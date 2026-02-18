import { useState, useEffect, useRef, useCallback } from "react";
import { Layout } from "@/components/ui/Layout";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { GlassCard } from "@/components/ui/GlassCard";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Trash2,
  ArrowLeft,
  Send,
  Mic,
  MicOff,
  Play,
  Volume2,
  Sparkles,
  Heart,
  Brain,
  Zap,
  Flame,
  MessageSquare,
  Loader2,
  Square,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { usePinAuth } from "@/components/PinGate";
import { useIsMobile } from "@/hooks/use-mobile";
import { useVoiceRecorder } from "../../replit_integrations/audio/useVoiceRecorder";

const personalities = [
  { id: "smart-ass", label: "Smart-ass", icon: Sparkles, gradient: "from-orange-500 to-red-500", bg: "bg-orange-500/20", text: "text-orange-400" },
  { id: "calming", label: "Calming", icon: Heart, gradient: "from-cyan-400 to-blue-500", bg: "bg-cyan-500/20", text: "text-cyan-400" },
  { id: "therapist", label: "Therapist", icon: Brain, gradient: "from-emerald-400 to-green-600", bg: "bg-emerald-500/20", text: "text-emerald-400" },
  { id: "hype-man", label: "Hype Man", icon: Zap, gradient: "from-yellow-400 to-orange-500", bg: "bg-yellow-500/20", text: "text-yellow-400" },
  { id: "roast-master", label: "Roast Master", icon: Flame, gradient: "from-red-600 to-amber-500", bg: "bg-red-500/20", text: "text-red-400" },
];

function getPersonality(id: string) {
  return personalities.find((p) => p.id === id) || personalities[0];
}

function timeAgo(dateStr: string) {
  const now = new Date();
  const date = new Date(dateStr);
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return date.toLocaleDateString();
}

function getVoicePreference(): string {
  try {
    const saved = JSON.parse(localStorage.getItem("void-settings") || "{}");
    return saved.voicePreference || "default";
  } catch {
    return "default";
  }
}

interface Thread {
  id: number;
  userId: number;
  title: string;
  personality: string;
  createdAt: string;
  updatedAt: string;
  lastMessage?: string;
}

interface Message {
  id: number;
  threadId: number;
  role: string;
  content: string;
  audioResponse?: string;
  createdAt: string;
}

interface ThreadWithMessages {
  thread: Thread;
  messages: Message[];
}

export default function ConversationsPage() {
  useDocumentTitle("Conversations");
  const { visitorId } = usePinAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const [activeThreadId, setActiveThreadId] = useState<number | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newPersonality, setNewPersonality] = useState("smart-ass");
  const [messageInput, setMessageInput] = useState("");
  const [playingAudioId, setPlayingAudioId] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const recorder = useVoiceRecorder();

  const { data: threads, isLoading: threadsLoading } = useQuery<Thread[]>({
    queryKey: ["/api/threads", visitorId],
    queryFn: async () => {
      if (!visitorId) return [];
      const res = await fetch(`/api/threads?userId=${visitorId}`);
      if (!res.ok) throw new Error("Failed to fetch threads");
      return res.json();
    },
    enabled: !!visitorId,
  });

  const { data: activeThread, isLoading: messagesLoading } = useQuery<ThreadWithMessages>({
    queryKey: ["/api/threads", activeThreadId, "messages"],
    queryFn: async () => {
      const res = await fetch(`/api/threads/${activeThreadId}/messages`);
      if (!res.ok) throw new Error("Failed to fetch messages");
      return res.json();
    },
    enabled: !!activeThreadId,
  });

  const createThreadMutation = useMutation({
    mutationFn: async (data: { userId: number; title: string; personality: string }) => {
      const res = await apiRequest("POST", "/api/threads", data);
      return res.json();
    },
    onSuccess: (data: Thread) => {
      queryClient.invalidateQueries({ queryKey: ["/api/threads", visitorId] });
      setActiveThreadId(data.id);
      setShowNewForm(false);
      setNewTitle("");
      setNewPersonality("smart-ass");
      toast({ title: "Thread Created", description: `"${data.title}" is ready.` });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err?.message || "Failed to create thread.", variant: "destructive" });
    },
  });

  const deleteThreadMutation = useMutation({
    mutationFn: async (threadId: number) => {
      await apiRequest("DELETE", `/api/threads/${threadId}`);
    },
    onSuccess: (_: unknown, threadId: number) => {
      queryClient.invalidateQueries({ queryKey: ["/api/threads", visitorId] });
      if (activeThreadId === threadId) {
        setActiveThreadId(null);
      }
      toast({ title: "Thread Deleted", description: "Conversation removed." });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err?.message || "Failed to delete thread.", variant: "destructive" });
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (data: { content?: string; audio?: string; mimeType?: string; extension?: string; userId: number; voicePreference: string }) => {
      const res = await apiRequest("POST", `/api/threads/${activeThreadId}/messages`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/threads", activeThreadId, "messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/threads", visitorId] });
      setMessageInput("");
    },
    onError: (err: any) => {
      toast({ title: "Send Failed", description: err?.message || "Could not send message.", variant: "destructive" });
    },
  });

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [activeThread?.messages]);

  useEffect(() => {
    if (activeThreadId && inputRef.current && !isMobile) {
      inputRef.current.focus();
    }
  }, [activeThreadId, isMobile]);

  useEffect(() => {
    if (recorder.error) {
      toast({ title: "Microphone Error", description: recorder.error, variant: "destructive" });
      recorder.clearError();
    }
  }, [recorder.error]);

  const handleSendText = useCallback(() => {
    if (!messageInput.trim() || !visitorId || !activeThreadId) return;
    sendMessageMutation.mutate({
      content: messageInput.trim(),
      userId: visitorId,
      voicePreference: getVoicePreference(),
    });
  }, [messageInput, visitorId, activeThreadId, sendMessageMutation]);

  const handleToggleRecording = useCallback(async () => {
    if (recorder.state === "recording") {
      try {
        const { blob, mimeType, extension } = await recorder.stopRecording();
        if (blob.size === 0) {
          toast({ title: "No Audio", description: "Recording was empty. Try again.", variant: "destructive" });
          return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(",")[1];
          if (visitorId && activeThreadId) {
            sendMessageMutation.mutate({
              audio: base64,
              mimeType,
              extension,
              userId: visitorId,
              voicePreference: getVoicePreference(),
            });
          }
        };
        reader.readAsDataURL(blob);
      } catch {
        toast({ title: "Recording Error", description: "Failed to process recording.", variant: "destructive" });
      }
    } else {
      await recorder.startRecording();
    }
  }, [recorder, visitorId, activeThreadId, sendMessageMutation, toast]);

  const playAudio = useCallback((messageId: number, base64Audio: string) => {
    try {
      const audioData = `data:audio/mp3;base64,${base64Audio}`;
      const audio = new Audio(audioData);
      setPlayingAudioId(messageId);
      audio.onended = () => setPlayingAudioId(null);
      audio.onerror = () => setPlayingAudioId(null);
      audio.play().catch(() => setPlayingAudioId(null));
    } catch {
      setPlayingAudioId(null);
    }
  }, []);

  const handleCreateThread = useCallback(() => {
    if (!newTitle.trim() || !visitorId) return;
    createThreadMutation.mutate({
      userId: visitorId,
      title: newTitle.trim(),
      personality: newPersonality,
    });
  }, [newTitle, newPersonality, visitorId, createThreadMutation]);

  const handleSelectThread = useCallback((id: number) => {
    setActiveThreadId(id);
  }, []);

  const handleBack = useCallback(() => {
    setActiveThreadId(null);
  }, []);

  const showThreadList = !isMobile || !activeThreadId;
  const showActiveThread = !isMobile || !!activeThreadId;

  return (
    <Layout fullHeight>
      <div className="flex-1 container mx-auto p-4 md:p-6 lg:p-8 flex gap-4 overflow-hidden h-full max-h-[calc(100vh-8rem)]">

        {showThreadList && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className={`flex flex-col ${isMobile ? "w-full" : "w-80 shrink-0"}`}
          >
            <GlassCard className="flex-1 flex flex-col h-full overflow-hidden">
              <div className="flex items-center justify-between gap-2 mb-4">
                <div>
                  <h2 className="text-lg font-bold text-white font-display tracking-tight">Threads</h2>
                  <p className="text-[10px] text-white/30 uppercase tracking-widest">Conversations</p>
                </div>
                <Button
                  size="sm"
                  onClick={() => setShowNewForm(!showNewForm)}
                  data-testid="button-new-chat"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  New Chat
                </Button>
              </div>

              <AnimatePresence>
                {showNewForm && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden mb-4"
                  >
                    <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-3">
                      <Input
                        placeholder="Thread title..."
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                        onKeyDown={(e) => e.key === "Enter" && handleCreateThread()}
                        data-testid="input-new-thread-title"
                      />
                      <div className="flex flex-wrap gap-1.5">
                        {personalities.map((p) => {
                          const Icon = p.icon;
                          const isSelected = newPersonality === p.id;
                          return (
                            <button
                              key={p.id}
                              onClick={() => setNewPersonality(p.id)}
                              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-all ${
                                isSelected
                                  ? `bg-gradient-to-r ${p.gradient} text-white`
                                  : "bg-white/5 text-white/50 hover:bg-white/10"
                              }`}
                              data-testid={`button-new-personality-${p.id}`}
                            >
                              <Icon className="w-3 h-3" />
                              {p.label}
                            </button>
                          );
                        })}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={handleCreateThread}
                          disabled={!newTitle.trim() || createThreadMutation.isPending}
                          className="flex-1"
                          data-testid="button-create-thread"
                        >
                          {createThreadMutation.isPending ? (
                            <Loader2 className="w-3 h-3 animate-spin mr-1" />
                          ) : (
                            <Plus className="w-3 h-3 mr-1" />
                          )}
                          Create
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => { setShowNewForm(false); setNewTitle(""); }}
                          data-testid="button-cancel-new-thread"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex-1 overflow-y-auto space-y-1.5 min-h-0">
                {threadsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-5 h-5 text-white/30 animate-spin" />
                  </div>
                ) : !threads || threads.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                    <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
                      <MessageSquare className="w-7 h-7 text-white/20" />
                    </div>
                    <p className="text-sm text-white/40 mb-1">No conversations yet</p>
                    <p className="text-xs text-white/20">Start a new chat to begin</p>
                  </div>
                ) : (
                  threads.map((thread) => {
                    const p = getPersonality(thread.personality);
                    const Icon = p.icon;
                    const isActive = activeThreadId === thread.id;
                    return (
                      <motion.div
                        key={thread.id}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`group relative flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                          isActive
                            ? "bg-white/10 border border-white/15"
                            : "bg-white/[0.02] hover:bg-white/5 border border-transparent"
                        }`}
                        onClick={() => handleSelectThread(thread.id)}
                        data-testid={`thread-item-${thread.id}`}
                      >
                        <div className={`shrink-0 w-9 h-9 rounded-lg ${p.bg} flex items-center justify-center`}>
                          <Icon className={`w-4 h-4 ${p.text}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <h3 className="text-sm font-medium text-white truncate">{thread.title}</h3>
                            <span className="text-[10px] text-white/25 shrink-0">
                              {timeAgo(thread.updatedAt || thread.createdAt)}
                            </span>
                          </div>
                          <p className="text-xs text-white/30 mt-0.5 truncate">
                            {thread.lastMessage || p.label}
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteThreadMutation.mutate(thread.id);
                          }}
                          className="shrink-0 p-1.5 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          data-testid={`button-delete-thread-${thread.id}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </motion.div>
                    );
                  })
                )}
              </div>
            </GlassCard>
          </motion.div>
        )}

        {showActiveThread && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex-1 flex flex-col min-w-0"
          >
            {!activeThreadId ? (
              <GlassCard className="flex-1 flex flex-col items-center justify-center h-full">
                <div className="text-center px-4">
                  <div className="w-20 h-20 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-6">
                    <MessageSquare className="w-9 h-9 text-white/15" />
                  </div>
                  <h3 className="text-lg font-semibold text-white/60 font-display mb-2">
                    Select a conversation
                  </h3>
                  <p className="text-sm text-white/25 max-w-xs">
                    Choose a thread from the left or start a new chat
                  </p>
                </div>
              </GlassCard>
            ) : (
              <GlassCard className="flex-1 flex flex-col h-full overflow-hidden !p-0">
                <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5">
                  {isMobile && (
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={handleBack}
                      data-testid="button-back-threads"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </Button>
                  )}
                  {activeThread?.thread && (() => {
                    const p = getPersonality(activeThread.thread.personality);
                    const Icon = p.icon;
                    return (
                      <>
                        <div className={`shrink-0 w-8 h-8 rounded-lg ${p.bg} flex items-center justify-center`}>
                          <Icon className={`w-4 h-4 ${p.text}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold text-white truncate" data-testid="text-thread-title">
                            {activeThread.thread.title}
                          </h3>
                          <span className={`text-[10px] ${p.text} uppercase tracking-widest`}>
                            {p.label}
                          </span>
                        </div>
                      </>
                    );
                  })()}
                  {messagesLoading && (
                    <Loader2 className="w-4 h-4 text-white/30 animate-spin shrink-0" />
                  )}
                </div>

                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 min-h-0">
                  {messagesLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-5 h-5 text-white/30 animate-spin" />
                    </div>
                  ) : !activeThread?.messages || activeThread.messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <p className="text-sm text-white/30 mb-1">No messages yet</p>
                      <p className="text-xs text-white/15">Send a message or record your voice</p>
                    </div>
                  ) : (
                    activeThread.messages.map((msg) => {
                      const isUser = msg.role === "user";
                      return (
                        <motion.div
                          key={msg.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                          data-testid={`message-${msg.id}`}
                        >
                          <div
                            className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                              isUser
                                ? "bg-white/10 border border-white/10 text-white"
                                : "bg-white/5 border border-white/5 text-white/80"
                            }`}
                          >
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                            <div className="flex items-center justify-between gap-3 mt-1.5">
                              <span className="text-[10px] text-white/20">
                                {timeAgo(msg.createdAt)}
                              </span>
                              {!isUser && msg.audioResponse && (
                                <button
                                  onClick={() => playAudio(msg.id, msg.audioResponse!)}
                                  disabled={playingAudioId === msg.id}
                                  className="flex items-center gap-1 text-[10px] text-white/40 hover:text-white/70 transition-colors"
                                  data-testid={`button-play-audio-${msg.id}`}
                                >
                                  {playingAudioId === msg.id ? (
                                    <Volume2 className="w-3 h-3 animate-pulse" />
                                  ) : (
                                    <Play className="w-3 h-3" />
                                  )}
                                  {playingAudioId === msg.id ? "Playing..." : "Listen"}
                                </button>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })
                  )}
                  {sendMessageMutation.isPending && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex justify-start"
                    >
                      <div className="bg-white/5 border border-white/5 rounded-2xl px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-3.5 h-3.5 text-white/30 animate-spin" />
                          <span className="text-xs text-white/30">Thinking...</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <div className="px-4 py-3 border-t border-white/5">
                  <div className="flex items-center gap-2">
                    <Input
                      ref={inputRef}
                      placeholder="Type a message..."
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSendText();
                        }
                      }}
                      disabled={sendMessageMutation.isPending || recorder.state === "recording"}
                      className="flex-1 bg-white/5 border-white/10 text-white placeholder:text-white/25"
                      data-testid="input-chat-message"
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={handleToggleRecording}
                      disabled={sendMessageMutation.isPending}
                      className={recorder.state === "recording" ? "text-red-400 bg-red-500/10" : ""}
                      data-testid="button-voice-record"
                    >
                      {recorder.state === "recording" ? (
                        <Square className="w-4 h-4 fill-current" />
                      ) : (
                        <Mic className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      size="icon"
                      onClick={handleSendText}
                      disabled={!messageInput.trim() || sendMessageMutation.isPending}
                      data-testid="button-send-message"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                  {recorder.state === "recording" && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-2 flex items-center gap-2"
                    >
                      <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                      <span className="text-xs text-red-400">Recording... tap stop to send</span>
                    </motion.div>
                  )}
                </div>
              </GlassCard>
            )}
          </motion.div>
        )}
      </div>
    </Layout>
  );
}
