import { motion, AnimatePresence } from "framer-motion";
import { Mic, Square, Loader2 } from "lucide-react";

interface RecordButtonProps {
  isRecording: boolean;
  isProcessing: boolean;
  onToggleRecording: () => void;
}

export function RecordButton({ isRecording, isProcessing, onToggleRecording }: RecordButtonProps) {
  return (
    <div className="relative flex items-center justify-center w-64 h-64">
      {/* Pulsing Rings (Only visible when recording) */}
      <AnimatePresence>
        {isRecording && (
          <>
            {[1, 2, 3].map((i) => (
              <motion.div
                key={i}
                className="absolute inset-0 rounded-full border border-primary/30"
                initial={{ opacity: 0, scale: 1 }}
                animate={{ opacity: [0, 0.5, 0], scale: [1, 1.5 + i * 0.2] }}
                transition={{ repeat: Infinity, duration: 2, delay: i * 0.4 }}
              />
            ))}
          </>
        )}
      </AnimatePresence>

      {/* Main Button */}
      <motion.button
        onClick={onToggleRecording}
        disabled={isProcessing}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`
          relative z-10 w-32 h-32 rounded-full flex items-center justify-center
          shadow-[0_0_40px_-10px_rgba(var(--primary),0.5)]
          transition-all duration-300
          ${isRecording 
            ? "bg-red-500 shadow-red-500/50" 
            : isProcessing 
              ? "bg-secondary cursor-wait" 
              : "bg-gradient-to-br from-primary to-purple-600 hover:shadow-primary/50"
          }
        `}
      >
        <AnimatePresence mode="wait">
          {isProcessing ? (
            <motion.div
              key="processing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Loader2 className="w-10 h-10 text-white animate-spin" />
            </motion.div>
          ) : isRecording ? (
            <motion.div
              key="stop"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
            >
              <Square className="w-10 h-10 text-white fill-current" />
            </motion.div>
          ) : (
            <motion.div
              key="mic"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
            >
              <Mic className="w-12 h-12 text-white" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
      
      {/* Label */}
      <div className="absolute -bottom-12 text-center">
        <p className="text-sm font-medium tracking-widest uppercase text-white/50">
          {isProcessing ? "ANALYZING RAGE..." : isRecording ? "LISTENING..." : "TAP TO VENT"}
        </p>
      </div>
    </div>
  );
}
