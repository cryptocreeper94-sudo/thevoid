import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Sparkles, Brain, Zap, Heart } from "lucide-react";

interface PersonalitySelectorProps {
  selected: string;
  onSelect: (id: string) => void;
}

const personalities = [
  { id: 'smart-ass', label: 'Smart-ass', icon: Sparkles, color: 'from-orange-500 to-red-500', desc: "Sarcastic & Witty" },
  { id: 'calming', label: 'Calming', icon: Heart, color: 'from-cyan-400 to-blue-500', desc: "Soothing & Gentle" },
  { id: 'therapist', label: 'Therapist', icon: Brain, color: 'from-emerald-400 to-green-600', desc: "Analytical & Deep" },
  { id: 'hype-man', label: 'Hype Man', icon: Zap, color: 'from-yellow-400 to-orange-500', desc: "High Energy!" },
];

export function PersonalitySelector({ selected, onSelect }: PersonalitySelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-3 w-full">
      {personalities.map((p) => {
        const isSelected = selected === p.id;
        const Icon = p.icon;
        
        return (
          <motion.button
            key={p.id}
            onClick={() => onSelect(p.id)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={cn(
              "relative p-4 rounded-2xl border text-left transition-all duration-300 overflow-hidden",
              isSelected 
                ? "border-transparent bg-white/10 shadow-lg" 
                : "border-white/5 bg-black/20 hover:bg-black/40 hover:border-white/10"
            )}
          >
            {/* Background Gradient for Selected State */}
            {isSelected && (
              <div className={cn("absolute inset-0 opacity-20 bg-gradient-to-br", p.color)} />
            )}
            
            <div className="relative z-10 flex flex-col gap-2">
              <div className={cn(
                "p-2 rounded-lg w-fit transition-colors",
                isSelected ? "bg-white/20 text-white" : "bg-white/5 text-white/60"
              )}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <h3 className={cn("font-medium", isSelected ? "text-white" : "text-white/80")}>
                  {p.label}
                </h3>
                <p className="text-xs text-white/40 mt-0.5">{p.desc}</p>
              </div>
            </div>
            
            {/* Selection Indicator */}
            {isSelected && (
              <motion.div 
                layoutId="active-indicator"
                className="absolute top-3 right-3 w-2 h-2 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]"
              />
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
