import { useState, useRef, useEffect } from "react";
import { Layout } from "@/components/ui/Layout";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Phone, MessageCircle, Heart, AlertTriangle, ExternalLink, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import type { SignalChat } from "@shared/schema";

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

function getSessionId(): string {
  let id = sessionStorage.getItem("signal-chat-session");
  if (!id) {
    id = `sig-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
    sessionStorage.setItem("signal-chat-session", id);
  }
  return id;
}

export default function SignalChatPage() {
  const [messages, setMessages] = useState<SignalChat[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [showResources, setShowResources] = useState(false);
  const [sessionId] = useState(getSessionId);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadMessages() {
      try {
        const res = await fetch(`/api/signal-chat/${sessionId}`);
        if (res.ok) {
          const data = await res.json();
          setMessages(data);
        }
      } catch {}
    }
    loadMessages();
  }, [sessionId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const msg = input.trim();
    if (!msg || sending) return;

    setInput("");
    setSending(true);

    const tempUserMsg: SignalChat = {
      id: Date.now(),
      sessionId,
      role: "user",
      content: msg,
      createdAt: new Date(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const res = await apiRequest("POST", "/api/signal-chat", { sessionId, message: msg });
      const aiMsg: SignalChat = await res.json();
      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sessionId,
          role: "assistant",
          content: "I'm having trouble connecting right now. If you're in crisis, please call or text 988 for immediate support.",
          createdAt: new Date(),
        },
      ]);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const startNewSession = () => {
    const newId = `sig-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
    sessionStorage.setItem("signal-chat-session", newId);
    setMessages([]);
    window.location.reload();
  };

  return (
    <Layout>
      <div className="flex flex-col h-[calc(100vh-120px)] max-w-3xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button size="icon" variant="ghost" data-testid="button-signal-back">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-lg font-bold font-display text-foreground flex items-center gap-2" data-testid="text-signal-title">
                <Heart className="w-5 h-5 text-red-400" />
                Signal Chat
              </h1>
              <p className="text-xs text-muted-foreground">Crisis support — you are not alone</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowResources(!showResources)}
              data-testid="button-toggle-resources"
            >
              <Phone className="w-3.5 h-3.5 mr-1.5" />
              Crisis Lines
            </Button>
          </div>
        </div>

        <AnimatePresence>
          {showResources && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 overflow-hidden"
            >
              <GlassCard className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <h2 className="text-sm font-semibold text-foreground">Crisis Resources</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {CRISIS_RESOURCES.map((r) => (
                    <a
                      key={r.name}
                      href={r.href}
                      target={r.href.startsWith("http") ? "_blank" : undefined}
                      rel={r.href.startsWith("http") ? "noopener noreferrer" : undefined}
                      className="flex items-center justify-between gap-2 p-2.5 rounded-md bg-white/5 hover-elevate transition-colors group"
                      data-testid={`link-crisis-${r.name.replace(/\s+/g, "-").toLowerCase()}`}
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-foreground truncate">{r.name}</p>
                        <p className="text-[10px] text-muted-foreground">{r.detail}</p>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <span className="text-[9px] text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded-full">{r.available}</span>
                        <ExternalLink className="w-3 h-3 text-muted-foreground/50 group-hover:text-primary transition-colors" />
                      </div>
                    </a>
                  ))}
                </div>
                <p className="text-[10px] text-muted-foreground/60 mt-3 text-center">
                  If you are in immediate danger, call 911
                </p>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>

        <GlassCard className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 space-y-3" data-testid="signal-messages-container">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center px-4">
                <div className="inline-flex p-4 rounded-full bg-red-400/10 mb-4">
                  <Heart className="w-10 h-10 text-red-400" />
                </div>
                <h2 className="text-lg font-bold text-foreground font-display mb-2">Welcome to Signal Chat</h2>
                <p className="text-sm text-muted-foreground max-w-md mb-4">
                  This is a safe space. Signal is here to listen, support, and connect you with professional crisis resources. Whatever you're going through, you don't have to face it alone.
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setInput("I need someone to talk to");
                      inputRef.current?.focus();
                    }}
                    data-testid="button-prompt-talk"
                  >
                    <MessageCircle className="w-3.5 h-3.5 mr-1.5" />
                    I need someone to talk to
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setInput("I'm feeling overwhelmed");
                      inputRef.current?.focus();
                    }}
                    data-testid="button-prompt-overwhelmed"
                  >
                    <Heart className="w-3.5 h-3.5 mr-1.5" />
                    I'm feeling overwhelmed
                  </Button>
                </div>
                <div className="mt-6 p-3 rounded-md bg-amber-400/5 border border-amber-400/10 max-w-sm">
                  <p className="text-[10px] text-amber-400/80">
                    Signal Chat is an AI support tool — not a substitute for professional help. If you are in crisis, please contact 988 (call/text) or 911 for emergencies.
                  </p>
                </div>
              </div>
            )}

            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-primary/20 text-foreground rounded-br-md"
                      : "bg-white/5 text-foreground rounded-bl-md border border-white/5"
                  }`}
                  data-testid={`signal-message-${msg.role}-${msg.id}`}
                >
                  {msg.role === "assistant" && (
                    <span className="text-[10px] text-red-400 font-medium block mb-1">Signal</span>
                  )}
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
              </motion.div>
            ))}

            {sending && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-start"
              >
                <div className="bg-white/5 rounded-2xl rounded-bl-md px-4 py-3 border border-white/5">
                  <span className="text-[10px] text-red-400 font-medium block mb-1">Signal</span>
                  <div className="flex gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:0ms]" />
                    <div className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:150ms]" />
                    <div className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:300ms]" />
                  </div>
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div className="border-t border-white/5 p-3">
            <form onSubmit={sendMessage} className="flex items-center gap-2">
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 bg-white/5 border-white/10"
                disabled={sending}
                autoFocus
                data-testid="input-signal-message"
              />
              <Button
                type="submit"
                size="icon"
                disabled={!input.trim() || sending}
                data-testid="button-signal-send"
              >
                <Send className="w-4 h-4" />
              </Button>
            </form>
            <div className="flex items-center justify-between mt-2">
              <p className="text-[9px] text-muted-foreground/40">
                Signal Chat is AI-powered — not a licensed counselor
              </p>
              <button
                onClick={startNewSession}
                className="text-[9px] text-muted-foreground/40 hover:text-muted-foreground transition-colors"
                data-testid="button-new-session"
              >
                New session
              </button>
            </div>
          </div>
        </GlassCard>
      </div>
    </Layout>
  );
}
