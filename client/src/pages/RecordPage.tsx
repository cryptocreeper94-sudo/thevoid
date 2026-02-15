import { useState } from "react";
import { Layout } from "@/components/ui/Layout";
import { GlassCard } from "@/components/ui/GlassCard";
import { RecordButton } from "@/components/venting/RecordButton";
import { PersonalitySelector } from "@/components/venting/PersonalitySelector";
import { VentHistory } from "@/components/venting/VentHistory";
import { useCreateVent } from "@/hooks/use-vents";
import { useVoiceRecorder } from "../../replit_integrations/audio/useVoiceRecorder";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, Phone, Play, RefreshCw, MessageCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import screamImg from "@/assets/images/scream-hero.png";

export default function RecordPage() {
  const [personality, setPersonality] = useState('smart-ass');
  const [lastResponse, setLastResponse] = useState<{ transcript: string; response: string } | null>(null);
  const recorder = useVoiceRecorder();
  const createVent = useCreateVent();
  const { toast } = useToast();

  const handleToggleRecording = async () => {
    if (recorder.state === "recording") {
      try {
        const blob = await recorder.stopRecording();
        createVent.mutate(
          { audioBlob: blob, personality },
          {
            onSuccess: (data) => {
              setLastResponse(data);
              toast({
                title: "Vent Processed",
                description: "The AI has analyzed your rage.",
              });
            },
            onError: () => {
              toast({
                title: "Error",
                description: "Failed to process your vent. Please try again.",
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
            <VentHistory />
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
              src={screamImg} 
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
                      <button
                        className="px-5 py-2.5 rounded-full bg-primary hover:bg-primary/80 text-white shadow-lg shadow-primary/20 flex items-center gap-2 transition-all text-sm"
                        data-testid="button-listen"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        Listen
                      </button>
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
                      <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-6 text-center text-white/30 max-w-xs text-sm leading-relaxed"
                      >
                        Scream, rant, or whisper. <span className="text-white/50">We don't judge.</span>
                      </motion.p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
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
                <VentHistory />
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </Layout>
  );
}
