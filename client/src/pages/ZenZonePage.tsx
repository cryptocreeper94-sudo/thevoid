import { useState, useEffect, useRef, useCallback } from "react";
import { Layout } from "@/components/ui/Layout";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { GlassCard } from "@/components/ui/GlassCard";
import { motion, AnimatePresence } from "framer-motion";
import { Wind, Play, Pause, RotateCcw, Waves, TreePine, CloudRain, Flame as FlameIcon, Timer, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

type BreathPhase = "inhale" | "hold" | "exhale" | "rest";
type BreathPattern = { name: string; desc: string; phases: { phase: BreathPhase; duration: number }[] };

const BREATH_PATTERNS: BreathPattern[] = [
  {
    name: "Box Breathing",
    desc: "4-4-4-4 — Used by Navy SEALs to stay calm under pressure",
    phases: [
      { phase: "inhale", duration: 4 },
      { phase: "hold", duration: 4 },
      { phase: "exhale", duration: 4 },
      { phase: "rest", duration: 4 },
    ],
  },
  {
    name: "4-7-8 Relaxation",
    desc: "The natural tranquilizer for the nervous system",
    phases: [
      { phase: "inhale", duration: 4 },
      { phase: "hold", duration: 7 },
      { phase: "exhale", duration: 8 },
    ],
  },
  {
    name: "Calming Breath",
    desc: "Simple 4-4 breathing for quick relief",
    phases: [
      { phase: "inhale", duration: 4 },
      { phase: "exhale", duration: 4 },
    ],
  },
];

const PHASE_COLORS: Record<BreathPhase, string> = {
  inhale: "#06b6d4",
  hold: "#8b5cf6",
  exhale: "#f97316",
  rest: "#a3a3a3",
};

const PHASE_LABELS: Record<BreathPhase, string> = {
  inhale: "Breathe In",
  hold: "Hold",
  exhale: "Breathe Out",
  rest: "Rest",
};

const PHASE_SCALES: Record<BreathPhase, number> = {
  inhale: 1.3,
  hold: 1.3,
  exhale: 0.8,
  rest: 0.8,
};

const AMBIENT_SOUNDS = [
  { key: "rain", icon: CloudRain, label: "Rain" },
  { key: "ocean", icon: Waves, label: "Ocean" },
  { key: "forest", icon: TreePine, label: "Forest" },
  { key: "fire", icon: FlameIcon, label: "Fire" },
];

type Tab = "breathe" | "ambient" | "timer";

export default function ZenZonePage() {
  useDocumentTitle("Zen Zone — Meditation & Calm");
  const [activeTab, setActiveTab] = useState<Tab>("breathe");
  const [selectedPattern, setSelectedPattern] = useState(0);
  const [isBreathing, setIsBreathing] = useState(false);
  const [currentPhaseIdx, setCurrentPhaseIdx] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [cycles, setCycles] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const [activeAmbient, setActiveAmbient] = useState<string | null>(null);

  const [timerMinutes, setTimerMinutes] = useState(5);
  const [timerActive, setTimerActive] = useState(false);
  const [timerSecondsLeft, setTimerSecondsLeft] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const pattern = BREATH_PATTERNS[selectedPattern];
  const currentPhase = pattern.phases[currentPhaseIdx];

  const stopBreathing = useCallback(() => {
    setIsBreathing(false);
    setCurrentPhaseIdx(0);
    setSecondsLeft(0);
    setCycles(0);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  const startBreathing = useCallback(() => {
    setIsBreathing(true);
    setCycles(0);
    setCurrentPhaseIdx(0);
    setSecondsLeft(pattern.phases[0].duration);
  }, [pattern]);

  useEffect(() => {
    if (!isBreathing) return;
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setCurrentPhaseIdx((pidx) => {
            const next = pidx + 1;
            if (next >= pattern.phases.length) {
              setCycles((c) => c + 1);
              setSecondsLeft(pattern.phases[0].duration);
              return 0;
            }
            setSecondsLeft(pattern.phases[next].duration);
            return next;
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isBreathing, pattern]);

  useEffect(() => {
    if (!timerActive) return;
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimerSecondsLeft((prev) => {
        if (prev <= 1) {
          setTimerActive(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [timerActive]);

  const tabs: { key: Tab; icon: typeof Wind; label: string }[] = [
    { key: "breathe", icon: Wind, label: "Breathe" },
    { key: "ambient", icon: Waves, label: "Ambient" },
    { key: "timer", icon: Timer, label: "Timer" },
  ];

  return (
    <Layout>
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        className="max-w-4xl mx-auto px-4 py-8 space-y-6"
      >
        <motion.div variants={fadeUp} className="text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 mb-4">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-medium text-muted-foreground tracking-wide uppercase">Zen Zone</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground font-display mb-2" data-testid="text-zen-title">
            Find Your Calm
          </h1>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Breathing exercises, ambient sounds, and guided meditation to center yourself.
          </p>
        </motion.div>

        <motion.div variants={fadeUp}>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {tabs.map((t) => (
              <Button
                key={t.key}
                variant={activeTab === t.key ? "default" : "ghost"}
                onClick={() => setActiveTab(t.key)}
                className="shrink-0"
                data-testid={`button-zen-tab-${t.key}`}
              >
                <t.icon className="w-4 h-4 mr-2" />
                {t.label}
              </Button>
            ))}
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          {activeTab === "breathe" && (
            <motion.div key="breathe" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }} className="space-y-4">
              <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                {BREATH_PATTERNS.map((bp, i) => (
                  <Button
                    key={bp.name}
                    variant={selectedPattern === i ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => { if (isBreathing) stopBreathing(); setSelectedPattern(i); }}
                    className="shrink-0 text-xs"
                    data-testid={`button-pattern-${i}`}
                  >
                    {bp.name}
                  </Button>
                ))}
              </div>

              <GlassCard className="overflow-hidden">
                <div className="p-6 md:p-8 flex flex-col items-center space-y-6">
                  <p className="text-xs text-muted-foreground">{pattern.desc}</p>

                  <div className="relative flex items-center justify-center" style={{ width: 200, height: 200 }}>
                    <motion.div
                      className="absolute rounded-full"
                      style={{
                        width: 160,
                        height: 160,
                        background: `radial-gradient(circle, ${PHASE_COLORS[currentPhase.phase]}30, transparent)`,
                        border: `2px solid ${PHASE_COLORS[currentPhase.phase]}40`,
                      }}
                      animate={{
                        scale: isBreathing ? PHASE_SCALES[currentPhase.phase] : 1,
                      }}
                      transition={{
                        duration: currentPhase.duration,
                        ease: "easeInOut",
                      }}
                    />
                    <div className="relative z-10 text-center space-y-1">
                      {isBreathing ? (
                        <>
                          <p className="text-lg font-bold font-display" style={{ color: PHASE_COLORS[currentPhase.phase] }} data-testid="text-breath-phase">
                            {PHASE_LABELS[currentPhase.phase]}
                          </p>
                          <p className="text-3xl font-bold text-foreground font-display" data-testid="text-breath-seconds">{secondsLeft}</p>
                        </>
                      ) : (
                        <p className="text-sm text-muted-foreground">Press play to begin</p>
                      )}
                    </div>
                  </div>

                  {isBreathing && (
                    <p className="text-xs text-muted-foreground">Cycles completed: <span className="text-foreground font-medium">{cycles}</span></p>
                  )}

                  <div className="flex items-center gap-3">
                    {isBreathing ? (
                      <>
                        <Button variant="ghost" onClick={stopBreathing} data-testid="button-breath-stop">
                          <Pause className="w-4 h-4 mr-2" /> Stop
                        </Button>
                        <Button variant="ghost" onClick={() => { stopBreathing(); startBreathing(); }} data-testid="button-breath-restart">
                          <RotateCcw className="w-4 h-4 mr-2" /> Restart
                        </Button>
                      </>
                    ) : (
                      <Button onClick={startBreathing} data-testid="button-breath-start">
                        <Play className="w-4 h-4 mr-2" /> Start
                      </Button>
                    )}
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          )}

          {activeTab === "ambient" && (
            <motion.div key="ambient" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {AMBIENT_SOUNDS.map((s) => {
                  const active = activeAmbient === s.key;
                  return (
                    <GlassCard key={s.key} className={`cursor-pointer overflow-hidden ${active ? "ring-1 ring-primary" : ""}`} hoverEffect>
                      <div
                        className="p-6 text-center space-y-3"
                        onClick={() => setActiveAmbient(active ? null : s.key)}
                        data-testid={`button-ambient-${s.key}`}
                      >
                        <s.icon className={`w-8 h-8 mx-auto ${active ? "text-primary" : "text-muted-foreground"}`} />
                        <p className={`text-sm font-medium ${active ? "text-foreground" : "text-muted-foreground"}`}>{s.label}</p>
                        {active && <span className="text-[10px] text-primary">Playing</span>}
                      </div>
                    </GlassCard>
                  );
                })}
              </div>
              <GlassCard className="mt-4 overflow-hidden">
                <div className="p-5 text-center space-y-2">
                  <p className="text-xs text-muted-foreground">
                    {activeAmbient
                      ? "Close your eyes and let the sounds wash over you. Combine with breathing exercises for maximum effect."
                      : "Select an ambient sound to create your calm space. Pair with the breathing exercises for deeper relaxation."}
                  </p>
                </div>
              </GlassCard>
            </motion.div>
          )}

          {activeTab === "timer" && (
            <motion.div key="timer" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
              <GlassCard className="overflow-hidden">
                <div className="p-6 md:p-8 flex flex-col items-center space-y-6">
                  <Timer className="w-8 h-8 text-primary" />
                  <p className="text-xs text-muted-foreground">Set a meditation timer and just be.</p>

                  {!timerActive && timerSecondsLeft === 0 && (
                    <div className="flex items-center gap-2">
                      {[2, 5, 10, 15, 20].map((m) => (
                        <Button
                          key={m}
                          variant={timerMinutes === m ? "secondary" : "ghost"}
                          size="sm"
                          onClick={() => setTimerMinutes(m)}
                          data-testid={`button-timer-${m}`}
                        >
                          {m}m
                        </Button>
                      ))}
                    </div>
                  )}

                  <div className="text-center">
                    <p className="text-5xl font-bold text-foreground font-display" data-testid="text-timer-display">
                      {timerActive || timerSecondsLeft > 0
                        ? `${Math.floor(timerSecondsLeft / 60)}:${String(timerSecondsLeft % 60).padStart(2, "0")}`
                        : `${timerMinutes}:00`}
                    </p>
                    {timerSecondsLeft === 0 && timerActive === false && timerMinutes > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">minutes</p>
                    )}
                    {timerSecondsLeft === 0 && !timerActive && timerRef.current === null && cycles > 0 && (
                      <p className="text-sm text-primary mt-2">Session complete. Well done.</p>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    {timerActive ? (
                      <Button variant="ghost" onClick={() => setTimerActive(false)} data-testid="button-timer-pause">
                        <Pause className="w-4 h-4 mr-2" /> Pause
                      </Button>
                    ) : timerSecondsLeft > 0 ? (
                      <>
                        <Button onClick={() => setTimerActive(true)} data-testid="button-timer-resume">
                          <Play className="w-4 h-4 mr-2" /> Resume
                        </Button>
                        <Button variant="ghost" onClick={() => setTimerSecondsLeft(0)} data-testid="button-timer-reset">
                          <RotateCcw className="w-4 h-4 mr-2" /> Reset
                        </Button>
                      </>
                    ) : (
                      <Button onClick={() => { setTimerSecondsLeft(timerMinutes * 60); setTimerActive(true); }} data-testid="button-timer-start">
                        <Play className="w-4 h-4 mr-2" /> Start
                      </Button>
                    )}
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </Layout>
  );
}
