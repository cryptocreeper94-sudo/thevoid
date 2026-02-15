import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface AudioVisualizerProps {
  isRecording: boolean;
  volume?: number; // 0 to 1
}

export function AudioVisualizer({ isRecording, volume = 0 }: AudioVisualizerProps) {
  // Simulate volume fluctuation if actual volume isn't provided (or for visual flair)
  const [bars, setBars] = useState<number[]>(Array(20).fill(10));

  useEffect(() => {
    if (!isRecording) {
      setBars(Array(20).fill(10));
      return;
    }

    const interval = setInterval(() => {
      setBars(prev => prev.map(() => Math.max(10, Math.random() * 100 * (volume + 0.5))));
    }, 100);

    return () => clearInterval(interval);
  }, [isRecording, volume]);

  return (
    <div className="flex items-center justify-center gap-1 h-32 w-full overflow-hidden">
      {bars.map((height, i) => (
        <motion.div
          key={i}
          className="w-2 bg-gradient-to-t from-primary/50 to-primary rounded-full"
          animate={{
            height: isRecording ? `${height}%` : "10%",
            opacity: isRecording ? 1 : 0.3
          }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 20
          }}
        />
      ))}
    </div>
  );
}
