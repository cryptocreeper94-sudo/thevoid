import { motion, AnimatePresence } from "framer-motion";
import { Mic, Square, Loader2 } from "lucide-react";
import { getSessionHeroImage } from "@/lib/heroImages";

interface RecordButtonProps {
  isRecording: boolean;
  isProcessing: boolean;
  onToggleRecording: () => void;
}

export function RecordButton({ isRecording, isProcessing, onToggleRecording }: RecordButtonProps) {
  return (
    <div className="relative flex flex-col items-center justify-center">
      <div className="relative flex items-center justify-center w-64 h-64">
        <AnimatePresence>
          {isRecording && (
            <>
              {[1, 2, 3].map((i) => (
                <motion.div
                  key={i}
                  className="absolute inset-0 rounded-full border border-red-500/30"
                  initial={{ opacity: 0, scale: 1 }}
                  animate={{ opacity: [0, 0.5, 0], scale: [1, 1.5 + i * 0.2] }}
                  transition={{ repeat: Infinity, duration: 2, delay: i * 0.4 }}
                />
              ))}
            </>
          )}
        </AnimatePresence>

        <motion.button
          onClick={onToggleRecording}
          disabled={isProcessing}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="relative z-10 w-36 h-36 rounded-full flex items-center justify-center overflow-hidden transition-all duration-300"
          data-testid="button-record"
        >
          <img
            src={getSessionHeroImage()}
            alt="Scream into the void"
            className={`absolute inset-0 w-full h-full object-cover transition-all duration-500 ${
              isRecording ? "scale-110 brightness-125" : isProcessing ? "brightness-50 grayscale" : "brightness-75"
            }`}
          />
          <div className={`absolute inset-0 transition-all duration-500 ${
            isRecording
              ? "bg-red-500/30 shadow-[inset_0_0_40px_rgba(239,68,68,0.4)]"
              : isProcessing
                ? "bg-black/60"
                : "bg-gradient-to-br from-primary/40 to-purple-900/60"
          }`} />
          <div className="absolute inset-0 rounded-full border-2 border-white/10" />

          <AnimatePresence mode="wait">
            {isProcessing ? (
              <motion.div
                key="processing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="relative z-10"
              >
                <Loader2 className="w-10 h-10 text-white animate-spin" />
              </motion.div>
            ) : isRecording ? (
              <motion.div
                key="stop"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className="relative z-10"
              >
                <Square className="w-10 h-10 text-white fill-current drop-shadow-lg" />
              </motion.div>
            ) : (
              <motion.div
                key="mic"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className="relative z-10"
              >
                <Mic className="w-12 h-12 text-white drop-shadow-lg" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </div>

      <div className="mt-4 text-center">
        <p className="text-sm font-semibold tracking-[0.25em] uppercase text-white/50 font-display">
          {isProcessing ? "ANALYZING RAGE..." : isRecording ? "LISTENING..." : "TAP TO VENT"}
        </p>
      </div>
    </div>
  );
}
