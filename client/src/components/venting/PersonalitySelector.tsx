import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Sparkles, Brain, Zap, Heart, Flame } from "lucide-react";
import smartassImg from "@/assets/images/personality-smartass.png";
import calmingImg from "@/assets/images/personality-calming.png";
import therapistImg from "@/assets/images/personality-therapist.png";
import hypemanImg from "@/assets/images/personality-hypeman.png";
import roastmasterImg from "@/assets/images/personality-roastmaster.png";

interface PersonalitySelectorProps {
  selected: string;
  onSelect: (id: string) => void;
}

const personalities = [
  { id: 'smart-ass', label: 'Smart-ass', icon: Sparkles, color: 'from-orange-500 to-red-500', desc: "Sarcastic & Witty", img: smartassImg },
  { id: 'calming', label: 'Calming', icon: Heart, color: 'from-cyan-400 to-blue-500', desc: "Soothing & Gentle", img: calmingImg },
  { id: 'therapist', label: 'Therapist', icon: Brain, color: 'from-emerald-400 to-green-600', desc: "Analytical & Deep", img: therapistImg },
  { id: 'hype-man', label: 'Hype Man', icon: Zap, color: 'from-yellow-400 to-orange-500', desc: "High Energy!", img: hypemanImg },
  { id: 'roast-master', label: 'Roast Master', icon: Flame, color: 'from-red-600 to-amber-500', desc: "Savage Comedy", img: roastmasterImg },
];

export function PersonalitySelector({ selected, onSelect }: PersonalitySelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-3 w-full">
      {personalities.map((p, index) => {
        const isSelected = selected === p.id;
        const Icon = p.icon;
        const isLastOdd = personalities.length % 2 !== 0 && index === personalities.length - 1;
        
        return (
          <motion.button
            key={p.id}
            onClick={() => onSelect(p.id)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={cn(
              "relative rounded-2xl border text-left transition-all duration-300 overflow-hidden",
              isLastOdd ? "col-span-2 aspect-[8/3]" : "aspect-[3/4]",
              isSelected 
                ? "border-transparent shadow-lg shadow-primary/20 ring-2 ring-primary/40" 
                : "border-white/5 hover:border-white/10"
            )}
            data-testid={`button-personality-${p.id}`}
          >
            <img
              src={p.img}
              alt={p.label}
              className={cn(
                "absolute inset-0 w-full h-full object-cover",
                isLastOdd && "object-center"
              )}
            />
            <div className={cn(
              "absolute inset-0",
              isLastOdd 
                ? "bg-gradient-to-r from-black/90 via-black/60 to-transparent"
                : "bg-gradient-to-t from-black/90 via-black/40 to-transparent"
            )} />
            
            {isSelected && (
              <div className={cn("absolute inset-0 opacity-30 bg-gradient-to-br", p.color)} />
            )}
            
            <div className={cn(
              "absolute p-3 z-10",
              isLastOdd 
                ? "bottom-0 left-0 top-0 flex flex-col justify-center"
                : "bottom-0 left-0 right-0"
            )}>
              <div className={cn(
                "p-1.5 rounded-lg w-fit mb-2 transition-colors",
                isSelected ? "bg-white/20 text-white" : "bg-white/10 text-white/70"
              )}>
                <Icon className="w-4 h-4" />
              </div>
              <h3 className={cn("font-semibold text-sm", isSelected ? "text-white" : "text-white/90")}>
                {p.label}
              </h3>
              <p className="text-[10px] text-white/50 mt-0.5">{p.desc}</p>
            </div>
            
            {isSelected && (
              <motion.div 
                layoutId="active-indicator"
                className="absolute top-2.5 right-2.5 w-2.5 h-2.5 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.9)]"
              />
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
