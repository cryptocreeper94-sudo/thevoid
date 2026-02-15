import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Square, Sparkles, AlertCircle, Play, Pause } from "lucide-react";
import { useLocation } from "wouter";
import { PersonalitySelector, type PersonalityId } from "@/components/PersonalitySelector";
import { AudioVisualizer } from "@/components/AudioVisualizer";
import { useCreateVent, type VentResponse } from "@/hooks/use-vents";
import { useVoiceRecorder } from "@/replit_integrations/audio/useVoiceRecorder";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/Header";
import { useAudioPlayback } from "@/replit_integrations/audio/useAudioPlayback";
import { decodePCM16ToFloat32 } from "@/replit_integrations/audio/audio-utils";

type AppState = 'idle' | 'recording' | 'processing' | 'result';

export default function RecordPage() {
  const [state, setState] = useState<AppState>('idle');
  const [personality, setPersonality] = useState<PersonalityId>('smart-ass');
  const [result, setResult] = useState<VentResponse | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [location, setLocation] = useLocation();
  
  const { startRecording, stopRecording, state: recorderState } = useVoiceRecorder();
  const createVent = useCreateVent();
  const { toast } = useToast();
  const playback = useAudioPlayback();

  // Initialize audio playback context on mount
  useEffect(() => {
    playback.init();
  }, []);

  const handleStartRecording = async () => {
    try {
      await startRecording();
      setState('recording');
    } catch (err) {
      toast({
        title: "Microphone Error",
        description: "Please allow microphone access to vent.",
        variant: "destructive",
      });
    }
  };

  const handleStopRecording = async () => {
    try {
      const audioBlob = await stopRecording();
      setState('processing');

      // Convert Blob to Base64
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = () => {
        const base64Audio = (reader.result as string).split(',')[1];
        
        createVent.mutate({
          audio: base64Audio,
          personality: personality,
        }, {
          onSuccess: (data) => {
            setResult(data);
            setState('result');
            // Auto-play response if available
            if (data.audioResponse) {
              handlePlayAudio(data.audioResponse);
            }
          },
          onError: (error) => {
            toast({
              title: "Error Processing",
              description: error.message,
              variant: "destructive",
            });
            setState('idle');
          }
        });
      };
    } catch (err) {
      console.error(err);
      setState('idle');
    }
  };

  const handlePlayAudio = (base64Audio: string) => {
    try {
      if (isPlaying) {
        playback.clear();
        setIsPlaying(false);
        return;
      }
      
      setIsPlaying(true);
      playback.pushAudio(base64Audio);
      
      // Simple timeout to reset play state since we don't have precise duration
      // Real implementation would use audio events
      setTimeout(() => setIsPlaying(false), 5000); 
    } catch (e) {
      console.error("Playback failed", e);
    }
  };

  const reset = () => {
    setState('idle');
    setResult(null);
    setIsPlaying(false);
    playback.clear();
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-body selection:bg-primary/30">
      <Header />

      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 pt-24 max-w-5xl mx-auto w-full">
        
        <AnimatePresence mode="wait">
          {state === 'idle' && (
            <motion.div 
              key="idle"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full flex flex-col items-center gap-12"
            >
              <div className="text-center space-y-4 max-w-2xl mx-auto">
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold tracking-tight">
                  Who do you want to <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-orange-500 animate-pulse-slow">
                    scream at?
                  </span>
                </h2>
                <p className="text-lg text-muted-foreground font-light">
                  Select a personality, hit record, and let it all out. We can take it.
                </p>
              </div>

              <PersonalitySelector 
                selected={personality} 
                onSelect={setPersonality} 
              />

              <div className="fixed bottom-8 left-0 right-0 flex justify-center px-4 z-40">
                <button
                  onClick={handleStartRecording}
                  className="group relative flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-primary shadow-lg shadow-primary/20 transition-transform hover:scale-110 active:scale-95"
                >
                  <div className="absolute inset-0 rounded-full border-2 border-white/20 animate-ping opacity-20" />
                  <Mic className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                  <span className="sr-only">Start Recording</span>
                </button>
              </div>
            </motion.div>
          )}

          {state === 'recording' && (
            <motion.div
              key="recording"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center w-full h-full gap-8"
            >
              <div className="text-center space-y-2">
                <h3 className="text-2xl font-bold font-display text-destructive animate-pulse">RECORDING</h3>
                <p className="text-muted-foreground">Let it all out...</p>
              </div>

              <div className="w-full max-w-md h-48 flex items-center justify-center bg-secondary/20 rounded-3xl backdrop-blur-sm border border-white/5">
                <AudioVisualizer isRecording={true} volume={0.8} />
              </div>

              <button
                onClick={handleStopRecording}
                className="w-24 h-24 rounded-full bg-destructive flex items-center justify-center shadow-glow-lg hover:scale-105 active:scale-95 transition-all"
              >
                <Square className="w-8 h-8 text-white fill-current" />
              </button>
            </motion.div>
          )}

          {state === 'processing' && (
            <motion.div
              key="processing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center gap-8 text-center"
            >
              <div className="relative w-32 h-32">
                <div className="absolute inset-0 rounded-full border-4 border-muted opacity-20" />
                <div className="absolute inset-0 rounded-full border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Sparkles className="w-10 h-10 text-primary animate-pulse" />
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold font-display">Processing Rage...</h3>
                <p className="text-muted-foreground">Analyzing tone, volume, and expletives.</p>
              </div>
            </motion.div>
          )}

          {state === 'result' && result && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-2xl mx-auto space-y-8 pb-24"
            >
              {/* User Transcript Card */}
              <div className="bg-secondary/30 backdrop-blur-md rounded-2xl p-6 border border-white/10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-secondary rounded-lg">
                    <Mic className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <span className="text-sm font-bold text-muted-foreground tracking-wide uppercase">You Said</span>
                </div>
                <p className="text-lg leading-relaxed opacity-80 font-hand text-2xl">
                  "{result.transcript}"
                </p>
              </div>

              {/* AI Response Card */}
              <div className="bg-gradient-to-br from-primary/10 to-transparent backdrop-blur-xl rounded-3xl p-8 border border-primary/20 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-32 bg-primary/20 blur-[100px] rounded-full pointer-events-none" />
                
                <div className="flex items-center justify-between mb-6 relative z-10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-lg">
                      <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-xl font-display">The Response</h3>
                      <span className="text-xs font-mono text-primary uppercase tracking-wider">
                        {personality.replace('-', ' ')} Mode
                      </span>
                    </div>
                  </div>

                  {result.audioResponse && (
                    <button
                      onClick={() => result.audioResponse && handlePlayAudio(result.audioResponse)}
                      className="p-3 rounded-full bg-primary/20 hover:bg-primary/30 text-primary transition-colors"
                      title={isPlaying ? "Stop" : "Play"}
                    >
                      {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current" />}
                    </button>
                  )}
                </div>

                <p className="text-xl md:text-2xl font-medium leading-relaxed relative z-10 font-display">
                  {result.response}
                </p>
              </div>

              <div className="flex justify-center gap-4 pt-4">
                <button
                  onClick={reset}
                  className="px-8 py-4 bg-secondary hover:bg-secondary/80 rounded-xl font-bold transition-colors"
                >
                  Vent Again
                </button>
                <button
                  onClick={() => setLocation('/history')}
                  className="px-8 py-4 bg-transparent border border-white/10 hover:bg-white/5 rounded-xl font-bold transition-colors"
                >
                  View History
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
