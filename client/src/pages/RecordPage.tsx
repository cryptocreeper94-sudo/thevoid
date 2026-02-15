import { useState } from "react";
import { Layout } from "@/components/ui/Layout";
import { GlassCard } from "@/components/ui/GlassCard";
import { RecordButton } from "@/components/venting/RecordButton";
import { PersonalitySelector } from "@/components/venting/PersonalitySelector";
import { VentHistory } from "@/components/venting/VentHistory";
import { useCreateVent } from "@/hooks/use-vents";
import { useVoiceRecorder } from "../../replit_integrations/audio/useVoiceRecorder";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, Phone, ArrowRight, Play, RefreshCw, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
        
        // Optimistic UI update or wait for mutation
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
      setLastResponse(null); // Clear previous response when starting new
    }
  };

  return (
    <Layout>
      {/* LEFT COLUMN: History & Context */}
      <GlassCard className="hidden lg:flex flex-col col-span-3 h-full max-h-[calc(100vh-4rem)]">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-white mb-1">Vent Log</h2>
          <p className="text-sm text-white/40">Your history of frustration.</p>
        </div>
        <VentHistory />
        
        <div className="mt-auto pt-6 border-t border-white/5">
           <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
             <div className="flex items-center gap-3 mb-2">
               <AlertCircle className="w-5 h-5 text-red-400" />
               <h3 className="font-medium text-red-200">Need real help?</h3>
             </div>
             <p className="text-xs text-red-200/60 mb-3">
               This app is for fun. If you're in crisis, please reach out to a professional.
             </p>
             <a 
               href="tel:988" 
               className="flex items-center justify-center w-full py-2 bg-red-500/20 hover:bg-red-500/30 text-red-200 rounded-lg text-sm font-medium transition-colors"
             >
               <Phone className="w-3 h-3 mr-2" />
               Call 988 (Crisis Line)
             </a>
           </div>
        </div>
      </GlassCard>

      {/* CENTER COLUMN: The Stage */}
      <div className="col-span-1 lg:col-span-6 flex flex-col h-full max-h-[calc(100vh-4rem)]">
        <GlassCard className="flex-1 flex flex-col items-center justify-center relative overflow-hidden" hoverEffect>
          {/* Animated Background Gradient specific to state */}
          <div className={`absolute inset-0 bg-gradient-to-b opacity-20 transition-colors duration-700
            ${recorder.state === 'recording' ? 'from-red-900/40 to-transparent' : 'from-blue-900/20 to-transparent'}
          `} />

          <div className="relative z-10 w-full max-w-md flex flex-col items-center">
            
            <AnimatePresence mode="wait">
              {lastResponse ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="w-full space-y-6 text-center"
                >
                  <div className="space-y-2">
                    <p className="text-sm text-white/40 uppercase tracking-widest">You Said</p>
                    <p className="text-lg text-white/60 italic">"{lastResponse.transcript}"</p>
                  </div>
                  
                  <div className="py-8 relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent" />
                    <p className="text-2xl md:text-3xl font-bold text-white leading-relaxed">
                      {lastResponse.response}
                    </p>
                  </div>

                  <div className="flex gap-4 justify-center">
                    <button 
                      onClick={() => setLastResponse(null)}
                      className="px-6 py-3 rounded-full bg-white/5 hover:bg-white/10 text-white border border-white/10 flex items-center gap-2 transition-all"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Vent Again
                    </button>
                    {/* TTS Button Placeholder - future feature */}
                    <button className="px-6 py-3 rounded-full bg-primary hover:bg-primary/80 text-white shadow-lg shadow-primary/20 flex items-center gap-2 transition-all">
                      <Play className="w-4 h-4 fill-current" />
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
                       className="mt-8 text-center text-white/40 max-w-xs"
                     >
                       Press and hold to record. Scream, rant, or whisper. We don't judge.
                     </motion.p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
            
          </div>
        </GlassCard>
      </div>

      {/* RIGHT COLUMN: Settings / Personality */}
      <GlassCard className="col-span-1 lg:col-span-3 flex flex-col h-full max-h-[calc(100vh-4rem)]">
         <div className="mb-6">
          <h2 className="text-xl font-bold text-white mb-1">Personality</h2>
          <p className="text-sm text-white/40">Choose your AI's vibe.</p>
        </div>
        
        <div className="flex-1">
          <PersonalitySelector 
            selected={personality} 
            onSelect={setPersonality} 
          />
        </div>

        {/* Mobile-only History Link/Section could go here if needed, but for Bento layout we keep it clean */}
        <div className="mt-auto pt-6 border-t border-white/5 lg:hidden">
          <h3 className="text-sm font-medium text-white/60 mb-2">Recent History</h3>
          <div className="h-48 overflow-y-auto">
             <VentHistory />
          </div>
        </div>
      </GlassCard>
    </Layout>
  );
}
