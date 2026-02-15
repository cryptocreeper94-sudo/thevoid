import { motion } from "framer-motion";
import { Sparkles, Brain, Flame, Coffee } from "lucide-react";
import { cn } from "@/lib/utils";

export type PersonalityId = 'smart-ass' | 'calming' | 'therapist' | 'hype-man';

interface PersonalityOption {
  id: PersonalityId;
  label: string;
  description: string;
  icon: React.ElementType;
  color: string;
  textColor: string;
}

const personalities: PersonalityOption[] = [
  {
    id: 'smart-ass',
    label: "Smart-ass",
    description: "Sarcastic, witty, and takes no prisoners.",
    icon: Flame,
    color: "from-orange-500 to-red-600",
    textColor: "text-orange-500"
  },
  {
    id: 'calming',
    label: "Calming",
    description: "Soothing vibes to bring your blood pressure down.",
    icon: Coffee,
    color: "from-teal-400 to-emerald-600",
    textColor: "text-teal-400"
  },
  {
    id: 'therapist',
    label: "Therapist",
    description: "Professional analysis of your chaotic life.",
    icon: Brain,
    color: "from-purple-400 to-indigo-600",
    textColor: "text-purple-400"
  },
  {
    id: 'hype-man',
    label: "Hype Man",
    description: "Aggressive validation. YOU GOT THIS!",
    icon: Sparkles,
    color: "from-yellow-400 to-orange-500",
    textColor: "text-yellow-400"
  }
];

interface PersonalitySelectorProps {
  selected: PersonalityId;
  onSelect: (id: PersonalityId) => void;
  disabled?: boolean;
}

export function PersonalitySelector({ selected, onSelect, disabled }: PersonalitySelectorProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl mx-auto">
      {personalities.map((p) => {
        const isSelected = selected === p.id;
        const Icon = p.icon;

        return (
          <motion.button
            key={p.id}
            onClick={() => !disabled && onSelect(p.id)}
            disabled={disabled}
            whileHover={!disabled ? { scale: 1.02, y: -2 } : {}}
            whileTap={!disabled ? { scale: 0.98 } : {}}
            className={cn(
              "relative overflow-hidden p-4 rounded-xl text-left transition-all duration-300 border-2",
              "group flex flex-col gap-2 h-full",
              isSelected 
                ? "border-transparent bg-secondary/50 shadow-lg"
                : "border-border/50 bg-background hover:border-border hover:bg-secondary/20",
              disabled && "opacity-50 cursor-not-allowed grayscale"
            )}
          >
            {/* Background Gradient for selected state */}
            {isSelected && (
              <div className={cn(
                "absolute inset-0 opacity-10 bg-gradient-to-br transition-opacity",
                p.color
              )} />
            )}

            {/* Selection Ring */}
            {isSelected && (
              <motion.div
                layoutId="outline"
                className={cn(
                  "absolute inset-0 rounded-xl border-2 z-10",
                  p.textColor.replace("text-", "border-")
                )}
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}

            <div className="flex items-center justify-between relative z-10">
              <span className={cn(
                "text-lg font-bold font-display tracking-tight transition-colors",
                isSelected ? p.textColor : "text-muted-foreground group-hover:text-foreground"
              )}>
                {p.label}
              </span>
              <div className={cn(
                "p-2 rounded-lg transition-colors",
                isSelected ? "bg-background/20" : "bg-secondary"
              )}>
                <Icon className={cn(
                  "w-5 h-5",
                  isSelected ? p.textColor : "text-muted-foreground"
                )} />
              </div>
            </div>
            
            <p className="text-sm text-muted-foreground relative z-10 leading-relaxed font-body">
              {p.description}
            </p>
          </motion.button>
        );
      })}
    </div>
  );
}
