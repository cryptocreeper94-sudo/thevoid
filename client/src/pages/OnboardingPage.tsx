import { useState, useCallback, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, Mic, Brain, PenLine, BarChart3, Moon, Flame, Shield, Fingerprint, Palette, Timer, Sparkles, Volume2, Gamepad2, Crosshair, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Slide {
  id: string;
  category: string;
  title: string;
  subtitle: string;
  description: string;
  icon: any;
  color: string;
  gradient: string;
  features: string[];
}

const slides: Slide[] = [
  {
    id: "welcome",
    category: "Welcome",
    title: "THE VOID",
    subtitle: "Your voice. Your space. Your rules.",
    description: "The world's first voice-first AI wellness platform. Scream, whisper, rant, reflect — the void listens, responds, and evolves with you.",
    icon: Sparkles,
    color: "text-cyan-400",
    gradient: "from-cyan-500/20 via-purple-500/10 to-transparent",
    features: ["Voice-first interaction", "5 AI personalities", "15+ wellness tools", "One subscription"],
  },
  {
    id: "venting",
    category: "Vent",
    title: "Voice Venting",
    subtitle: "Talk it out. AI talks back.",
    description: "Record your frustrations and receive instant AI responses tailored by personality. Choose Smart-Ass, Calming, Therapist, Hype Man, or Roast Master.",
    icon: Mic,
    color: "text-cyan-400",
    gradient: "from-cyan-500/20 via-cyan-500/5 to-transparent",
    features: ["Real-time transcription", "5 unique AI voices", "TTS audio responses", "Conversation threads"],
  },
  {
    id: "fingerprint",
    category: "Vent",
    title: "Voice Fingerprint",
    subtitle: "Your voice reveals what words can't.",
    description: "Advanced AI analyzes the emotional biomarkers in your voice — energy, tension, pace, warmth, and stability. Track your emotional patterns over time.",
    icon: Fingerprint,
    color: "text-purple-400",
    gradient: "from-purple-500/20 via-purple-500/5 to-transparent",
    features: ["5 vocal biomarkers", "Emotion detection", "Personal baseline", "Trend tracking"],
  },
  {
    id: "journal",
    category: "Reflect",
    title: "Voice & Written Journal",
    subtitle: "Capture every thought. Your way.",
    description: "Two journaling modes: type your thoughts with mood tags and AI responses, or speak freely and let AI transcribe and clean up your entries.",
    icon: PenLine,
    color: "text-indigo-400",
    gradient: "from-indigo-500/20 via-indigo-500/5 to-transparent",
    features: ["Voice-to-text journal", "AI cleanup mode", "8 mood tags", "AI personality responses"],
  },
  {
    id: "portrait",
    category: "Reflect",
    title: "Living Mood Portrait",
    subtitle: "Your inner world, visualized.",
    description: "AI generates unique abstract artwork from your emotional data. Each portrait evolves as you interact — a living painting of your emotional landscape.",
    icon: Palette,
    color: "text-pink-400",
    gradient: "from-pink-500/20 via-pink-500/5 to-transparent",
    features: ["AI-generated art", "Emotion-driven colors", "Evolving gallery", "Shareable portraits"],
  },
  {
    id: "analytics",
    category: "Reflect",
    title: "Mood Analytics",
    subtitle: "See the patterns. Understand yourself.",
    description: "Visual dashboards tracking your emotional trends over time. Before/after mood comparisons, streak tracking, achievement badges, and daily affirmations.",
    icon: BarChart3,
    color: "text-teal-400",
    gradient: "from-teal-500/20 via-teal-500/5 to-transparent",
    features: ["Mood trend charts", "Before/after tracking", "Streak system", "10 achievement badges"],
  },
  {
    id: "relax",
    category: "Relax",
    title: "Zen Zone & Sleep Sounds",
    subtitle: "Breathe. Listen. Drift off.",
    description: "Guided breathing exercises, ambient soundscape mixer with 6 sound layers, customizable meditation timer, and a sleep timer that fades you to silence.",
    icon: Moon,
    color: "text-sky-400",
    gradient: "from-sky-500/20 via-sky-500/5 to-transparent",
    features: ["3 breathing techniques", "6 ambient sounds", "Meditation timer", "Sleep timer with fade"],
  },
  {
    id: "rage",
    category: "Relax",
    title: "Virtual Rage Room",
    subtitle: "Smash things. Feel better.",
    description: "Click to destroy virtual glass objects with satisfying Framer Motion smash animations. Track your destruction stats and blow off steam safely.",
    icon: Flame,
    color: "text-red-400",
    gradient: "from-red-500/20 via-red-500/5 to-transparent",
    features: ["Destructible objects", "Smash animations", "Session stats", "Streak tracking"],
  },
  {
    id: "echo",
    category: "Connect",
    title: "Void Echo",
    subtitle: "A message to future you.",
    description: "Record time capsule messages to your future self. Set a delivery date and the void holds your words until the right moment arrives.",
    icon: Timer,
    color: "text-amber-400",
    gradient: "from-amber-500/20 via-amber-500/5 to-transparent",
    features: ["Time capsule messages", "Scheduled delivery", "AI companion notes", "Sealed until ready"],
  },
  {
    id: "safety",
    category: "Safety",
    title: "Crisis Toolkit",
    subtitle: "Always there when you need it.",
    description: "Quick-access breathing exercises, 5-4-3-2-1 grounding, crisis hotlines, and a personal safety plan you can customize and access anytime.",
    icon: Shield,
    color: "text-emerald-400",
    gradient: "from-emerald-500/20 via-emerald-500/5 to-transparent",
    features: ["Panic breathing", "Grounding exercise", "Crisis hotlines", "Personal safety plan"],
  },
  {
    id: "modes",
    category: "Smart",
    title: "Focus & Play Modes",
    subtitle: "Fun without the data pollution.",
    description: "Toggle between Focus Mode (everything tracked for your analytics) and Play Mode (mess around freely without affecting your metrics).",
    icon: Gamepad2,
    color: "text-amber-400",
    gradient: "from-amber-500/20 via-cyan-500/5 to-transparent",
    features: ["Focus = tracked", "Play = just for fun", "Share with friends", "Clean data always"],
  },
];

export default function OnboardingPage() {
  const [, navigate] = useLocation();
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(0);
  const touchStartX = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const slide = slides[current];
  const isFirst = current === 0;
  const isLast = current === slides.length - 1;

  const goTo = useCallback((idx: number) => {
    setDirection(idx > current ? 1 : -1);
    setCurrent(idx);
  }, [current]);

  const next = useCallback(() => {
    if (isLast) {
      navigate("/home");
    } else {
      setDirection(1);
      setCurrent((p) => p + 1);
    }
  }, [isLast, navigate]);

  const prev = useCallback(() => {
    if (!isFirst) {
      setDirection(-1);
      setCurrent((p) => p - 1);
    }
  }, [isFirst]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "Escape") navigate("/home");
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [next, prev, navigate]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) next();
      else prev();
    }
  };

  const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? 300 : -300, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -300 : 300, opacity: 0 }),
  };

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 bg-black z-[100] flex flex-col overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      data-testid="onboarding-container"
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${slide.gradient} transition-all duration-700 pointer-events-none`} />

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          key={current}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.08, scale: 1 }}
          transition={{ duration: 1 }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px]"
        >
          <slide.icon className="w-full h-full" />
        </motion.div>
      </div>

      <div className="relative z-10 flex items-center justify-between px-4 py-3">
        <Button
          size="icon"
          variant="ghost"
          onClick={() => navigate(-1 as any)}
          data-testid="button-onboarding-close"
        >
          <X className="w-4 h-4 text-white/60" />
        </Button>
        <div className="flex items-center gap-1">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`h-1 rounded-full transition-all duration-300 ${
                i === current ? "w-6 bg-white" : "w-1.5 bg-white/20"
              }`}
              data-testid={`button-dot-${i}`}
            />
          ))}
        </div>
        <Button
          variant="ghost"
          className="text-xs text-white/40"
          onClick={() => navigate("/home")}
          data-testid="button-skip"
        >
          Skip
        </Button>
      </div>

      <div className="relative z-10 flex-1 flex items-center justify-center px-6">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={current}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="w-full max-w-lg text-center"
          >
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              className="mb-6 inline-flex"
            >
              <div className={`p-4 rounded-2xl bg-white/5 border border-white/10`}>
                <slide.icon className={`w-10 h-10 ${slide.color}`} />
              </div>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15 }}
              className="text-[10px] text-white/30 uppercase tracking-[0.3em] mb-2"
            >
              {slide.category}
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-3xl sm:text-4xl font-black text-white font-display mb-2 tracking-wide"
              data-testid={`text-slide-title-${slide.id}`}
            >
              {slide.title}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="text-base text-white/60 mb-4 font-light"
              data-testid={`text-slide-subtitle-${slide.id}`}
            >
              {slide.subtitle}
            </motion.p>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-sm text-white/40 leading-relaxed mb-8 max-w-md mx-auto"
            >
              {slide.description}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="grid grid-cols-2 gap-2 max-w-xs mx-auto"
            >
              {slide.features.map((feat, i) => (
                <motion.div
                  key={feat}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.05 }}
                  className="flex items-center gap-2 text-xs text-white/50"
                >
                  <div className={`w-1 h-1 rounded-full ${slide.color.replace("text-", "bg-")}`} />
                  {feat}
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="relative z-10 flex items-center justify-between px-6 pb-8 pt-4">
        <Button
          variant="ghost"
          onClick={prev}
          disabled={isFirst}
          className={`text-white/60 ${isFirst ? "invisible" : ""}`}
          data-testid="button-prev"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <p className="text-xs text-white/20">
          {current + 1} / {slides.length}
        </p>

        <Button
          onClick={next}
          className="bg-gradient-to-r from-cyan-500 to-purple-600 border-0 text-white px-6 shadow-lg shadow-cyan-500/20"
          data-testid="button-next"
        >
          {isLast ? "Into the Void" : "Next"}
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
