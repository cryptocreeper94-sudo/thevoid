import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Layout } from "@/components/ui/Layout";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { GlassCard } from "@/components/ui/GlassCard";
import { RecordButton } from "@/components/venting/RecordButton";
import { PersonalitySelector } from "@/components/venting/PersonalitySelector";
import { VentHistory } from "@/components/venting/VentHistory";
import { useCreateVent } from "@/hooks/use-vents";
import { useVoiceRecorder } from "../../replit_integrations/audio/useVoiceRecorder";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, Phone, Play, RefreshCw, MessageCircle, Info, X, ShieldCheck, Mic, MicOff, Volume2, Sparkles, Crown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getSessionHeroImage } from "@/lib/heroImages";
import { usePinAuth } from "@/components/PinGate";
import { useSubscription, createCheckoutSession } from "@/hooks/use-subscription";
import { queryClient } from "@/lib/queryClient";

type MicPermission = "prompt" | "granted" | "denied" | "unsupported" | "unknown";

function isEmbeddedIframe(): boolean {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}

function useMicPermission() {
  const [permission, setPermission] = useState<MicPermission>("unknown");
  const [isEmbedded] = useState(() => isEmbeddedIframe());

  useEffect(() => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setPermission("unsupported");
      return;
    }
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: "microphone" as PermissionName }).then((result) => {
        setPermission(result.state as MicPermission);
        result.onchange = () => setPermission(result.state as MicPermission);
      }).catch(() => {
        setPermission("prompt");
      });
    } else {
      setPermission("prompt");
    }
  }, []);

  const requestPermission = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(t => t.stop());
      setPermission("granted");
      return true;
    } catch {
      setPermission("denied");
      return false;
    }
  }, []);

  return { permission, requestPermission, isEmbedded };
}

export default function RecordPage() {
  useDocumentTitle("Vent Now");
  const [personality, setPersonality] = useState('smart-ass');
  const [lastResponse, setLastResponse] = useState<{ transcript: string; response: string; audioResponse?: string } | null>(null);
  const [showCrisisInfo, setShowCrisisInfo] = useState(false);
  const recorder = useVoiceRecorder();
  const createVent = useCreateVent();
  const { toast } = useToast();
  const { permission: micPermission, requestPermission, isEmbedded } = useMicPermission();
  const { visitorId, userName } = usePinAuth();
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const { data: subStatus } = useSubscription(visitorId);
  const [upgradeLoading, setUpgradeLoading] = useState(false);

  const isLimitReached = subStatus?.tier === "free" && subStatus?.ventsRemaining === 0;

  const handleUpgrade = async () => {
    if (!visitorId) return;
    setUpgradeLoading(true);
    try {
      const url = await createCheckoutSession(visitorId, userName || undefined);
      window.location.href = url;
    } catch {
      toast({ title: "Error", description: "Could not start checkout. Please try again.", variant: "destructive" });
    } finally {
      setUpgradeLoading(false);
    }
  };

  const playAudioResponse = useCallback((base64Audio: string) => {
    try {
      const audioData = `data:audio/mp3;base64,${base64Audio}`;
      const audio = new Audio(audioData);
      setIsPlayingAudio(true);
      audio.onended = () => setIsPlayingAudio(false);
      audio.onerror = () => setIsPlayingAudio(false);
      audio.play().catch(() => setIsPlayingAudio(false));
    } catch {
      setIsPlayingAudio(false);
    }
  }, []);

  useEffect(() => {
    if (recorder.error) {
      if (recorder.error.toLowerCase().includes("denied") || 
          recorder.error.toLowerCase().includes("access") ||
          recorder.error.toLowerCase().includes("permission")) {
        requestPermission().catch(() => {});
      }
      toast({
        title: "Microphone Error",
        description: recorder.error,
        variant: "destructive",
      });
      recorder.clearError();
    }
  }, [recorder.error]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("subscription") === "success") {
      toast({ title: "Welcome to Premium!", description: "You now have unlimited venting. Let it all out." });
      queryClient.invalidateQueries({ queryKey: ["/api/subscription/status"] });
      window.history.replaceState({}, "", "/");
    }
  }, []);

  const handleToggleRecording = async () => {
    if (recorder.state === "recording") {
      try {
        const { blob, mimeType, extension } = await recorder.stopRecording();
        if (blob.size === 0) {
          toast({
            title: "No Audio Captured",
            description: "The recording was empty. Please try speaking louder or check your microphone.",
            variant: "destructive",
          });
          return;
        }
        createVent.mutate(
          { audioBlob: blob, personality, mimeType, extension, userId: visitorId ? String(visitorId) : undefined },
          {
            onSuccess: (data) => {
              setLastResponse(data);
              queryClient.invalidateQueries({ queryKey: ["/api/subscription/status"] });
              toast({
                title: "Vent Processed",
                description: "The AI has analyzed your rage.",
              });
              if (data.audioResponse) {
                const settings = JSON.parse(localStorage.getItem("void-settings") || "{}");
                if (settings.autoPlayResponse !== false) {
                  playAudioResponse(data.audioResponse);
                }
              }
            },
            onError: (err: any) => {
              if (err?.message?.includes("Upgrade to Premium")) {
                queryClient.invalidateQueries({ queryKey: ["/api/subscription/status"] });
              }
              toast({
                title: "Couldn't Process",
                description: err?.message || "Failed to process your vent. Please try again.",
                variant: "destructive",
              });
            }
          }
        );
      } catch (err) {
        console.error("Failed to stop recording:", err);
      }
    } else {
      await recorder.startRecording();
      setLastResponse(null);
    }
  };

  return (
    <Layout fullHeight>
      <div className="flex-1 container mx-auto p-4 md:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-auto lg:overflow-hidden">

        <GlassCard className="hidden lg:flex flex-col col-span-3 h-full max-h-[calc(100vh-8rem)]">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-white mb-1 font-display tracking-tight">Vent Log</h2>
            <p className="text-xs text-white/40 uppercase tracking-widest">Your history of frustration</p>
          </div>
          <div className="flex-1 overflow-y-auto">
            <VentHistory userId={visitorId} />
          </div>

          <div className="mt-auto pt-6 border-t border-white/5">
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
              <div className="flex items-center gap-3 mb-2">
                <AlertCircle className="w-5 h-5 text-red-400" />
                <h3 className="font-medium text-red-200 text-sm">Need real help?</h3>
              </div>
              <p className="text-xs text-red-200/60 mb-3">
                This app is for entertainment only. If you're in crisis, please reach out.
              </p>
              <div className="space-y-2">
                <a
                  href="tel:988"
                  className="flex items-center justify-center w-full py-2 bg-red-500/20 hover:bg-red-500/30 text-red-200 rounded-lg text-sm font-medium transition-colors"
                  data-testid="link-crisis-988"
                >
                  <Phone className="w-3 h-3 mr-2" />
                  Call or Text 988
                </a>
                <a
                  href="sms:741741&body=HELLO"
                  className="flex items-center justify-center w-full py-2 bg-red-500/10 hover:bg-red-500/20 text-red-200/80 rounded-lg text-xs transition-colors"
                  data-testid="link-crisis-text"
                >
                  <MessageCircle className="w-3 h-3 mr-2" />
                  Text HELLO to 741741
                </a>
              </div>
            </div>
          </div>
        </GlassCard>

        <div className="col-span-1 lg:col-span-6 flex flex-col h-full lg:max-h-[calc(100vh-8rem)]">
          <GlassCard className="flex-1 flex flex-col items-center justify-center relative overflow-hidden min-h-[420px]" hoverEffect>
            <div className={`absolute inset-0 transition-all duration-700 ${
              recorder.state === 'recording' 
                ? 'bg-gradient-to-b from-red-900/30 via-black/20 to-transparent' 
                : 'bg-gradient-to-b from-primary/10 via-black/10 to-transparent'
            }`} />

            <img 
              src={getSessionHeroImage()} 
              alt="" 
              className={`absolute inset-0 w-full h-full object-cover transition-all duration-1000 ${
                recorder.state === 'recording' 
                  ? 'opacity-15 scale-110' 
                  : 'opacity-5 scale-100'
              }`} 
            />

            <div className="relative z-10 w-full max-w-md flex flex-col items-center px-4">
              <AnimatePresence mode="wait">
                {lastResponse ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="w-full space-y-6 text-center"
                  >
                    <div className="space-y-2">
                      <p className="text-xs text-white/30 uppercase tracking-[0.3em] font-display">You Said</p>
                      <p className="text-base text-white/50 italic leading-relaxed">"{lastResponse.transcript}"</p>
                    </div>

                    <div className="py-6 relative">
                      <div className="absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                      <div className="absolute left-0 right-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                      <p className="text-xl md:text-2xl font-bold text-white leading-relaxed font-display" data-testid="text-ai-response">
                        {lastResponse.response}
                      </p>
                    </div>

                    <div className="flex gap-3 justify-center flex-wrap">
                      <button
                        onClick={() => setLastResponse(null)}
                        className="px-5 py-2.5 rounded-full bg-white/5 hover:bg-white/10 text-white border border-white/10 flex items-center gap-2 transition-all text-sm"
                        data-testid="button-vent-again"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Vent Again
                      </button>
                      {lastResponse.audioResponse && (
                        <button
                          onClick={() => playAudioResponse(lastResponse.audioResponse!)}
                          disabled={isPlayingAudio}
                          className="px-5 py-2.5 rounded-full bg-primary hover:bg-primary/80 text-white shadow-lg shadow-primary/20 flex items-center gap-2 transition-all text-sm disabled:opacity-50"
                          data-testid="button-listen"
                        >
                          {isPlayingAudio ? (
                            <Volume2 className="w-3.5 h-3.5 animate-pulse" />
                          ) : (
                            <Play className="w-3.5 h-3.5 fill-current" />
                          )}
                          {isPlayingAudio ? "Playing..." : "Listen"}
                        </button>
                      )}
                    </div>
                  </motion.div>
                ) : isLimitReached ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="flex flex-col items-center text-center px-4"
                  >
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-500/20 to-primary/20 border border-amber-500/30 flex items-center justify-center mb-6">
                      <Crown className="w-10 h-10 text-amber-400" />
                    </div>
                    <h3 className="text-lg font-bold text-white font-display mb-2">
                      Daily Vent Used
                    </h3>
                    <p className="text-sm text-white/40 max-w-xs leading-relaxed mb-6">
                      You've used your free vent for today. Upgrade to Premium for <span className="text-white/70 font-semibold">unlimited venting</span> — just $9.99/month.
                    </p>
                    <button
                      onClick={handleUpgrade}
                      disabled={upgradeLoading}
                      className="px-8 py-3 rounded-full bg-gradient-to-r from-amber-500 to-primary text-white font-semibold shadow-lg shadow-primary/30 flex items-center gap-2 transition-all hover:shadow-xl hover:shadow-primary/40 disabled:opacity-50 text-sm"
                      data-testid="button-upgrade-premium"
                    >
                      <Sparkles className="w-4 h-4" />
                      {upgradeLoading ? "Loading..." : "Upgrade to Premium"}
                    </button>
                    <p className="text-[10px] text-white/20 mt-4">Come back tomorrow for another free vent</p>
                  </motion.div>
                ) : micPermission === "denied" || micPermission === "unsupported" ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center text-center px-4"
                  >
                    <div className="w-24 h-24 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6">
                      <MicOff className="w-10 h-10 text-red-400" />
                    </div>
                    <h3 className="text-lg font-bold text-white font-display mb-2">
                      {micPermission === "unsupported" ? "Microphone Not Available" : "Microphone Blocked"}
                    </h3>
                    <p className="text-sm text-white/40 max-w-xs leading-relaxed mb-4">
                      {micPermission === "unsupported"
                        ? "Your browser doesn't support microphone access. Try opening this app in Chrome or Safari."
                        : isEmbedded
                          ? "Embedded previews can't access your microphone. Open this app in a full browser tab to record."
                          : "Microphone access was denied. Tap the lock icon in your browser's address bar, allow microphone access, then reload."}
                    </p>
                    <div className="flex gap-3 flex-wrap justify-center">
                      {isEmbedded && (
                        <a
                          href={window.location.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-5 py-2.5 rounded-full bg-primary hover:bg-primary/80 text-white shadow-lg shadow-primary/20 flex items-center gap-2 transition-all text-sm"
                          data-testid="link-open-new-tab"
                        >
                          Open in New Tab
                        </a>
                      )}
                      {micPermission === "denied" && !isEmbedded && (
                        <button
                          onClick={() => window.location.reload()}
                          className="px-5 py-2.5 rounded-full bg-white/5 hover:bg-white/10 text-white border border-white/10 flex items-center gap-2 transition-all text-sm"
                          data-testid="button-reload-mic"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          Reload Page
                        </button>
                      )}
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center"
                  >
                    <RecordButton
                      isRecording={recorder.state === 'recording'}
                      isProcessing={createVent.isPending}
                      onToggleRecording={handleToggleRecording}
                    />

                    {recorder.state !== 'recording' && !createVent.isPending && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-6 text-center max-w-xs space-y-3"
                      >
                        <p className="text-white/30 text-sm leading-relaxed">
                          Scream, rant, or whisper. <span className="text-white/50">We don't judge.</span>
                        </p>
                        {isEmbedded && (
                          <a
                            href={window.location.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 text-white/60 border border-white/10 text-xs transition-all"
                            data-testid="link-open-new-tab-hint"
                          >
                            <Mic className="w-3 h-3" />
                            Having mic issues? Open in new tab
                          </a>
                        )}
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="absolute bottom-4 right-4 z-20">
              <button
                onClick={() => setShowCrisisInfo(!showCrisisInfo)}
                className={`p-2.5 rounded-full backdrop-blur-sm border transition-all ${
                  showCrisisInfo
                    ? 'bg-white/15 border-white/20 text-white'
                    : 'bg-white/5 border-white/10 text-white/40 hover:text-white/60 hover:bg-white/10'
                }`}
                data-testid="button-crisis-info"
              >
                <Info className="w-4 h-4" />
              </button>
            </div>

            {createPortal(
              <AnimatePresence>
                {showCrisisInfo && (
                  <>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="fixed inset-0 z-[9990] bg-black/60 backdrop-blur-sm"
                      onClick={() => setShowCrisisInfo(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, y: 20 }}
                      transition={{ type: "spring", damping: 20, stiffness: 300 }}
                      className="fixed z-[9991] inset-0 flex items-center justify-center p-4"
                      style={{ pointerEvents: "none" }}
                    >
                    <div
                      className="w-full max-w-sm max-h-[85vh] overflow-y-auto p-5 rounded-2xl bg-black/90 backdrop-blur-xl border border-white/10 shadow-2xl"
                      style={{ pointerEvents: "auto" }}
                      data-testid="panel-crisis-info"
                    >
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                          <h3 className="text-sm font-bold text-white font-display">Safe Space</h3>
                        </div>
                        <button
                          onClick={() => setShowCrisisInfo(false)}
                          className="p-1 rounded-lg hover:bg-white/10 transition-colors"
                          data-testid="button-close-crisis-info"
                        >
                          <X className="w-3.5 h-3.5 text-white/40" />
                        </button>
                      </div>

                      <p className="text-xs text-white/50 leading-relaxed mb-3">
                        THE VOID is a safe place to blow off steam without hurting or offending anyone or anything.
                        Our AI will never encourage harm to yourself, others, or any living being. Vent it out, feel better, move on.
                      </p>

                      <div className="border-t border-white/10 pt-3 space-y-2">
                        <p className="text-[10px] text-white/30 uppercase tracking-widest font-display">Emergency Contacts</p>
                        <a
                          href="tel:988"
                          className="flex items-center gap-2.5 p-2 rounded-xl bg-red-500/10 border border-red-500/15 hover:bg-red-500/20 transition-colors"
                          data-testid="link-info-988"
                        >
                          <Phone className="w-3.5 h-3.5 text-red-400 shrink-0" />
                          <div>
                            <p className="text-xs font-medium text-red-200">988 Suicide & Crisis Lifeline</p>
                            <p className="text-[10px] text-red-300/50">Call or text 988 — 24/7</p>
                          </div>
                        </a>
                        <a
                          href="sms:741741&body=HELLO"
                          className="flex items-center gap-2.5 p-2 rounded-xl bg-red-500/10 border border-red-500/15 hover:bg-red-500/20 transition-colors"
                          data-testid="link-info-741741"
                        >
                          <MessageCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                          <div>
                            <p className="text-xs font-medium text-red-200">Crisis Text Line</p>
                            <p className="text-[10px] text-red-300/50">Text HELLO to 741741</p>
                          </div>
                        </a>
                        <a
                          href="tel:18006624357"
                          className="flex items-center gap-2.5 p-2 rounded-xl bg-red-500/10 border border-red-500/15 hover:bg-red-500/20 transition-colors"
                          data-testid="link-info-samhsa"
                        >
                          <Phone className="w-3.5 h-3.5 text-red-400 shrink-0" />
                          <div>
                            <p className="text-xs font-medium text-red-200">SAMHSA Helpline</p>
                            <p className="text-[10px] text-red-300/50">1-800-662-4357 — Free, 24/7</p>
                          </div>
                        </a>
                        <div className="flex items-center gap-2.5 p-2 rounded-xl bg-red-500/10 border border-red-500/15">
                          <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                          <p className="text-xs font-medium text-red-200">Emergency: Call 911</p>
                        </div>
                      </div>
                    </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>,
              document.body
            )}
          </GlassCard>
        </div>

        <div className="col-span-1 lg:col-span-3 flex flex-col h-full lg:max-h-[calc(100vh-8rem)]">
          <GlassCard className="flex flex-col h-full">
            <div className="mb-4">
              <h2 className="text-lg font-bold text-white font-display tracking-tight">Personality</h2>
              <p className="text-xs text-white/30 uppercase tracking-[0.2em] mt-1">Choose your AI's vibe</p>
            </div>

            <div className="flex-1">
              <PersonalitySelector
                selected={personality}
                onSelect={setPersonality}
              />
            </div>

            <div className="mt-4 pt-4 border-t border-white/5 lg:hidden">
              <h3 className="text-xs font-medium text-white/40 uppercase tracking-widest mb-2">Recent History</h3>
              <div className="h-40 overflow-y-auto">
                <VentHistory userId={visitorId} />
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </Layout>
  );
}
