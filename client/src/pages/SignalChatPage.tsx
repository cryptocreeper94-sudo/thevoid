import { useState, useRef, useEffect, useCallback } from "react";
import { Layout } from "@/components/ui/Layout";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send, Hash, Users, LogOut, ArrowLeft, Phone,
  ExternalLink, Heart, LogIn, UserPlus, Eye, EyeOff,
  ShieldCheck, Loader2, ChevronDown, ChevronUp
} from "lucide-react";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";

const CRISIS_RESOURCES = [
  { name: "988 Suicide & Crisis Lifeline", detail: "Call or text 988", href: "tel:988", available: "24/7" },
  { name: "Crisis Text Line", detail: "Text HOME to 741741", href: "sms:741741?body=HOME", available: "24/7" },
  { name: "SAMHSA Helpline", detail: "1-800-662-4357", href: "tel:18006624357", available: "24/7" },
  { name: "Veterans Crisis Line", detail: "Call 988, press 1", href: "tel:988", available: "24/7" },
  { name: "Trevor Project", detail: "1-866-488-7386", href: "tel:18664887386", available: "LGBTQ+ Youth" },
  { name: "Childhelp Abuse Hotline", detail: "1-800-422-4453", href: "tel:18004224453", available: "24/7" },
  { name: "NAMI Helpline", detail: "1-800-950-6264", href: "tel:18009506264", available: "M-F 10am-10pm ET" },
  { name: "IMAlive Online Chat", detail: "www.imalive.org", href: "https://www.imalive.org", available: "Online" },
];

interface ChatUser {
  id: string;
  username: string;
  displayName: string;
  email: string;
  avatarColor: string;
  role: string;
  trustLayerId: string | null;
}

interface ChatChannel {
  id: string;
  name: string;
  description: string | null;
  category: string;
  isDefault: boolean | null;
}

interface ChatMsg {
  id: string;
  channelId: string;
  userId: string;
  username: string;
  avatarColor: string;
  role: string;
  content: string;
  replyToId: string | null;
  createdAt: string;
}

interface AiMsg {
  role: "user" | "assistant";
  content: string;
}

function AuthScreen({ onAuth }: { onAuth: (user: ChatUser, token: string) => void }) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const endpoint = mode === "login" ? "/api/chat/auth/login" : "/api/chat/auth/register";
      const body = mode === "login"
        ? { username, password }
        : { username, email, password, displayName };

      const res = await apiRequest("POST", endpoint, body);
      const data = await res.json();

      if (data.success) {
        localStorage.setItem("tl-sso-token", data.token);
        onAuth(data.user, data.token);
      } else {
        setError(data.error || "Something went wrong.");
      }
    } catch (err: any) {
      try {
        const errData = await err?.json?.();
        setError(errData?.error || "Something went wrong.");
      } catch {
        setError("Connection error. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[60vh] px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm"
      >
        <GlassCard className="p-6" hoverEffect>
          <div className="text-center mb-5">
            <div className="inline-flex p-3 rounded-full bg-red-400/10 mb-3">
              <Heart className="w-8 h-8 text-red-400" />
            </div>
            <h2 className="text-xl font-bold font-display text-foreground">Signal Chat</h2>
            <p className="text-xs text-muted-foreground mt-1">
              {mode === "login" ? "Sign in to join the conversation" : "Create your Trust Layer account"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Username</label>
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                className="bg-white/5 border-white/10"
                autoFocus
                data-testid="input-chat-username"
              />
            </div>

            {mode === "register" && (
              <>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Display Name</label>
                  <Input
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Your display name"
                    className="bg-white/5 border-white/10"
                    data-testid="input-chat-display-name"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Email</label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="bg-white/5 border-white/10"
                    data-testid="input-chat-email"
                  />
                </div>
              </>
            )}

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Password</label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === "register" ? "Min 8 chars, 1 uppercase, 1 special" : "Enter password"}
                  className="bg-white/5 border-white/10 pr-10"
                  data-testid="input-chat-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                  data-testid="button-toggle-chat-password"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs text-red-400 text-center"
                data-testid="text-chat-auth-error"
              >
                {error}
              </motion.p>
            )}

            <Button type="submit" className="w-full" disabled={loading} data-testid="button-chat-auth-submit">
              {loading ? "Please wait..." : mode === "login" ? (
                <><LogIn className="w-4 h-4 mr-1.5" /> Sign In</>
              ) : (
                <><UserPlus className="w-4 h-4 mr-1.5" /> Create Account</>
              )}
            </Button>
          </form>

          <div className="mt-4 pt-3 border-t border-white/5 text-center">
            <button
              onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              data-testid="button-toggle-auth-mode"
            >
              {mode === "login" ? "Don't have an account? Register" : "Already have an account? Sign in"}
            </button>
          </div>

          <div className="mt-3 p-2.5 rounded-md bg-amber-400/5 border border-amber-400/10">
            <p className="text-[10px] text-amber-400/80 text-center">
              Your Trust Layer account works across the DarkWave ecosystem — GarageBot, Guardian AI, and more.
            </p>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
}

function CrisisSupportView() {
  const [aiMessages, setAiMessages] = useState<AiMsg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showResources, setShowResources] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [aiMessages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const msg = input.trim();
    if (!msg || loading) return;

    const userMsg: AiMsg = { role: "user", content: msg };
    const updated = [...aiMessages, userMsg];
    setAiMessages(updated);
    setInput("");
    setLoading(true);

    try {
      const res = await apiRequest("POST", "/api/signal-ai", { messages: updated });
      const data = await res.json();
      setAiMessages((prev) => [...prev, { role: "assistant", content: data.response }]);
    } catch {
      setAiMessages((prev) => [...prev, { role: "assistant", content: "I'm having trouble connecting right now. If you're in crisis, please call or text 988 immediately." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between gap-2 p-3 border-b border-white/5">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-red-400 flex-shrink-0" />
          <span className="text-sm font-medium text-foreground">Crisis Support</span>
        </div>
        <button
          onClick={() => setShowResources(!showResources)}
          className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
          data-testid="button-toggle-crisis-resources"
        >
          <Phone className="w-3 h-3" />
          <span className="hidden sm:inline">Hotlines</span>
          {showResources ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>

      <AnimatePresence>
        {showResources && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden border-b border-white/5"
          >
            <div className="p-2.5 space-y-1">
              {CRISIS_RESOURCES.map((r) => (
                <a
                  key={r.name}
                  href={r.href}
                  target={r.href.startsWith("http") ? "_blank" : undefined}
                  rel={r.href.startsWith("http") ? "noopener noreferrer" : undefined}
                  className="flex items-center justify-between gap-2 px-2 py-1 rounded-md bg-white/5 hover-elevate"
                  data-testid={`link-crisis-${r.name.replace(/\s+/g, "-").toLowerCase()}`}
                >
                  <div className="min-w-0">
                    <p className="text-[10px] font-medium text-foreground truncate">{r.name}</p>
                    <p className="text-[9px] text-muted-foreground">{r.detail} — {r.available}</p>
                  </div>
                  <ExternalLink className="w-3 h-3 text-muted-foreground/50 flex-shrink-0" />
                </a>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 overflow-y-auto p-3 space-y-3" data-testid="crisis-ai-messages">
        {aiMessages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center px-4 space-y-3">
            <div className="p-3 rounded-full bg-red-400/10">
              <ShieldCheck className="w-8 h-8 text-red-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground mb-1">Signal AI</p>
              <p className="text-xs text-muted-foreground max-w-xs">
                A compassionate AI trained to listen and connect you with professional crisis resources. Not a replacement for real help — a bridge until you get there.
              </p>
            </div>
            <div className="p-2 rounded-md bg-red-400/5 border border-red-400/10">
              <p className="text-[10px] text-red-400/80">
                If you are in immediate danger, call 911 or go to your nearest emergency room.
              </p>
            </div>
          </div>
        )}

        {aiMessages.map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-2"
          >
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 mt-0.5 ${
                msg.role === "assistant" ? "bg-red-400" : "bg-primary"
              }`}
            >
              {msg.role === "assistant" ? <ShieldCheck className="w-3.5 h-3.5" /> : "Y"}
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-xs font-semibold text-foreground">
                {msg.role === "assistant" ? "Signal" : "You"}
              </span>
              <p className="text-sm text-foreground/90 whitespace-pre-wrap break-words mt-0.5">{msg.content}</p>
            </div>
          </motion.div>
        ))}

        {loading && (
          <div className="flex items-start gap-2">
            <div className="w-7 h-7 rounded-full flex items-center justify-center bg-red-400 flex-shrink-0">
              <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
            </div>
            <div className="mt-1">
              <span className="text-xs text-muted-foreground">Signal is listening...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-white/5 p-3">
        <form onSubmit={sendMessage} className="flex items-center gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Talk to Signal..."
            className="flex-1 bg-white/5 border-white/10"
            maxLength={1000}
            disabled={loading}
            data-testid="input-crisis-message"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!input.trim() || loading}
            data-testid="button-crisis-send"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
        <p className="text-[9px] text-muted-foreground/40 mt-1.5">
          Signal AI is not a crisis counselor. For immediate help, expand Hotlines above.
        </p>
      </div>
    </div>
  );
}

function ChannelSidebar({
  channels, activeChannel, onSelect, onlineCount, channelUsers, crisisActive, onCrisis
}: {
  channels: ChatChannel[];
  activeChannel: string | null;
  onSelect: (id: string) => void;
  onlineCount: number;
  channelUsers: Record<string, string[]>;
  crisisActive: boolean;
  onCrisis: () => void;
}) {
  const grouped: Record<string, ChatChannel[]> = {};
  channels.forEach((ch) => {
    const cat = ch.category || "other";
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(ch);
  });

  const categoryLabels: Record<string, string> = {
    ecosystem: "Ecosystem",
    "app-support": "App Support",
    other: "Other",
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-white/5">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-primary" />
          <span className="text-xs text-muted-foreground">{onlineCount} online</span>
        </div>
      </div>

      <div className="p-2 border-b border-white/5">
        <button
          onClick={onCrisis}
          className={`w-full flex items-center gap-2 px-2 py-2 rounded-md text-sm transition-colors ${
            crisisActive
              ? "bg-red-400/15 text-red-400 font-medium"
              : "text-red-400/70 hover-elevate"
          }`}
          data-testid="button-crisis-support"
        >
          <ShieldCheck className="w-4 h-4 flex-shrink-0" />
          <span>Crisis Support</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-3">
        {Object.entries(grouped).map(([cat, chs]) => (
          <div key={cat}>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60 px-2 mb-1">
              {categoryLabels[cat] || cat}
            </p>
            {chs.map((ch) => {
              const userCount = channelUsers[ch.id]?.length || 0;
              return (
                <button
                  key={ch.id}
                  onClick={() => onSelect(ch.id)}
                  className={`w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded-md text-sm transition-colors ${
                    !crisisActive && activeChannel === ch.id
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover-elevate"
                  }`}
                  data-testid={`button-channel-${ch.name}`}
                >
                  <span className="flex items-center gap-1.5 truncate">
                    <Hash className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">{ch.name}</span>
                  </span>
                  {userCount > 0 && (
                    <span className="text-[10px] text-muted-foreground/50">{userCount}</span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SignalChatPage() {
  const [user, setUser] = useState<ChatUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [channels, setChannels] = useState<ChatChannel[]>([]);
  const [activeChannel, setActiveChannel] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [onlineCount, setOnlineCount] = useState(0);
  const [channelUsers, setChannelUsers] = useState<Record<string, string[]>>({});
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [showSidebar, setShowSidebar] = useState(true);
  const [viewMode, setViewMode] = useState<"chat" | "crisis">("chat");
  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const savedToken = localStorage.getItem("tl-sso-token");
    if (savedToken) {
      fetch("/api/chat/auth/me", {
        headers: { Authorization: `Bearer ${savedToken}` },
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.success) {
            setUser(data.user);
            setToken(savedToken);
          } else {
            localStorage.removeItem("tl-sso-token");
          }
        })
        .catch(() => localStorage.removeItem("tl-sso-token"));
    }
  }, []);

  useEffect(() => {
    fetch("/api/chat/channels")
      .then((r) => r.json())
      .then((data) => {
        setChannels(data);
        const defaultCh = data.find((c: ChatChannel) => c.isDefault) || data[0];
        if (defaultCh) setActiveChannel(defaultCh.id);
      })
      .catch(() => {});
  }, []);

  const connectWebSocket = useCallback(() => {
    if (!token || !activeChannel) return;
    if (wsRef.current) {
      wsRef.current.close();
    }

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws/chat`);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: "join", token, channelId: activeChannel }));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      switch (data.type) {
        case "history":
          setMessages(data.messages);
          break;
        case "message":
          setMessages((prev) => [...prev, data]);
          break;
        case "presence":
          setOnlineCount(data.onlineCount);
          setChannelUsers(data.channelUsers);
          break;
        case "typing":
          setTypingUsers((prev) => {
            if (!prev.includes(data.username)) return [...prev, data.username];
            return prev;
          });
          setTimeout(() => {
            setTypingUsers((prev) => prev.filter((u) => u !== data.username));
          }, 3000);
          break;
        case "user_joined":
        case "user_left":
          break;
        case "error":
          console.error("[Signal Chat]", data.message);
          break;
      }
    };

    ws.onclose = () => {
      setTimeout(() => {
        if (token && activeChannel) connectWebSocket();
      }, 3000);
    };
  }, [token, activeChannel]);

  useEffect(() => {
    if (token && activeChannel) {
      connectWebSocket();
    }
    return () => {
      wsRef.current?.close();
    };
  }, [token, activeChannel, connectWebSocket]);

  const switchChannel = (channelId: string) => {
    setActiveChannel(channelId);
    setViewMode("chat");
    if (window.innerWidth < 640) setShowSidebar(false);
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "switch_channel", channelId }));
    }
  };

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    const msg = input.trim();
    if (!msg || msg.length > 2000 || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({ type: "message", content: msg }));
    setInput("");
  };

  const handleTyping = () => {
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "typing" }));
    }
    typingTimeoutRef.current = setTimeout(() => {}, 3000);
  };

  const handleAuth = (authedUser: ChatUser, authToken: string) => {
    setUser(authedUser);
    setToken(authToken);
  };

  const handleLogout = () => {
    wsRef.current?.close();
    localStorage.removeItem("tl-sso-token");
    setUser(null);
    setToken(null);
    setMessages([]);
  };

  const activeChannelObj = channels.find((c) => c.id === activeChannel);

  return (
    <Layout>
      <div className="flex flex-col h-[calc(100vh-120px)] max-w-6xl mx-auto px-2 sm:px-4 py-2">
        <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
          <div className="flex items-center gap-2">
            <Link href="/">
              <Button size="icon" variant="ghost" data-testid="button-signal-back">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <h1 className="text-base font-bold font-display text-foreground flex items-center gap-2" data-testid="text-signal-title">
              <Heart className="w-4 h-4 text-red-400" />
              Signal Chat
            </h1>
          </div>
          {user && (
            <div className="flex items-center gap-2">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                style={{ backgroundColor: user.avatarColor }}
                data-testid="avatar-current-user"
              >
                {user.displayName[0]?.toUpperCase()}
              </div>
              <span className="text-xs text-muted-foreground hidden sm:inline">{user.displayName}</span>
              <Button size="icon" variant="ghost" onClick={handleLogout} data-testid="button-chat-logout">
                <LogOut className="w-3.5 h-3.5" />
              </Button>
            </div>
          )}
        </div>

        {!user ? (
          <AuthScreen onAuth={handleAuth} />
        ) : (
          <div className="flex flex-1 gap-2 min-h-0">
            <div className={`${showSidebar ? "w-56 flex-shrink-0" : "hidden"} sm:block sm:w-56`}>
              <GlassCard className="h-full overflow-hidden">
                <ChannelSidebar
                  channels={channels}
                  activeChannel={activeChannel}
                  onSelect={switchChannel}
                  onlineCount={onlineCount}
                  channelUsers={channelUsers}
                  crisisActive={viewMode === "crisis"}
                  onCrisis={() => { setViewMode("crisis"); if (window.innerWidth < 640) setShowSidebar(false); }}
                />
              </GlassCard>
            </div>

            <GlassCard className="flex-1 flex flex-col min-h-0 overflow-hidden">
              {viewMode === "crisis" ? (
                <CrisisSupportView />
              ) : (
                <>
                  <div className="flex items-center justify-between gap-2 p-3 border-b border-white/5">
                    <div className="flex items-center gap-2 min-w-0">
                      <button
                        className="sm:hidden"
                        onClick={() => setShowSidebar(!showSidebar)}
                        data-testid="button-toggle-sidebar"
                      >
                        <Hash className="w-4 h-4 text-muted-foreground" />
                      </button>
                      <Hash className="w-4 h-4 text-primary flex-shrink-0 hidden sm:block" />
                      <span className="text-sm font-medium text-foreground truncate">
                        {activeChannelObj?.name || "Select a channel"}
                      </span>
                    </div>
                    {activeChannelObj?.description && (
                      <span className="text-[10px] text-muted-foreground truncate hidden md:block max-w-[200px]">
                        {activeChannelObj.description}
                      </span>
                    )}
                  </div>

                  <div className="flex-1 overflow-y-auto p-3 space-y-2" data-testid="signal-messages-container">
                    {messages.length === 0 && (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-sm text-muted-foreground/50">No messages yet. Start the conversation.</p>
                      </div>
                    )}
                    {messages.map((msg) => {
                      const isMe = msg.userId === user.id;
                      return (
                        <motion.div
                          key={msg.id}
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-start gap-2 group"
                          data-testid={`signal-message-${msg.id}`}
                        >
                          <div
                            className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 mt-0.5"
                            style={{ backgroundColor: msg.avatarColor || "#06b6d4" }}
                          >
                            {msg.username?.[0]?.toUpperCase() || "?"}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-baseline gap-2 flex-wrap">
                              <span className={`text-xs font-semibold ${isMe ? "text-primary" : "text-foreground"}`}>
                                {msg.username}
                              </span>
                              {msg.role === "admin" && (
                                <span className="text-[9px] bg-primary/20 text-primary px-1 py-0.5 rounded">ADMIN</span>
                              )}
                              <span className="text-[9px] text-muted-foreground/40">
                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                              </span>
                            </div>
                            <p className="text-sm text-foreground/90 whitespace-pre-wrap break-words">{msg.content}</p>
                          </div>
                        </motion.div>
                      );
                    })}

                    {typingUsers.length > 0 && (
                      <div className="text-[10px] text-muted-foreground/60 pl-9">
                        {typingUsers.join(", ")} {typingUsers.length === 1 ? "is" : "are"} typing...
                      </div>
                    )}

                    <div ref={messagesEndRef} />
                  </div>

                  <div className="border-t border-white/5 p-3">
                    <form onSubmit={sendMessage} className="flex items-center gap-2">
                      <Input
                        value={input}
                        onChange={(e) => {
                          setInput(e.target.value);
                          handleTyping();
                        }}
                        placeholder={activeChannelObj ? `Message #${activeChannelObj.name}` : "Select a channel..."}
                        className="flex-1 bg-white/5 border-white/10"
                        maxLength={2000}
                        disabled={!activeChannel}
                        data-testid="input-signal-message"
                      />
                      <Button
                        type="submit"
                        size="icon"
                        disabled={!input.trim() || !activeChannel}
                        data-testid="button-signal-send"
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </form>
                    <p className="text-[9px] text-muted-foreground/40 mt-1.5">
                      Powered by Trust Layer SSO — your account works across the DarkWave ecosystem
                    </p>
                  </div>
                </>
              )}
            </GlassCard>
          </div>
        )}
      </div>
    </Layout>
  );
}
