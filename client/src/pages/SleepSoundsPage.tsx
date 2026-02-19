import { useState, useEffect, useRef, useCallback } from "react";
import { Layout } from "@/components/ui/Layout";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { useMeta } from "@/hooks/use-meta";
import { GlassCard } from "@/components/ui/GlassCard";
import { motion, AnimatePresence } from "framer-motion";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import {
  CloudRain,
  Waves,
  Bug,
  CloudLightning,
  Wind,
  Flame,
  Volume2,
  Moon,
  Timer,
  Play,
  Pause,
} from "lucide-react";
import sleepImg from "@/assets/images/sleep-moonlight.png";

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

interface SoundChannel {
  key: string;
  label: string;
  icon: typeof CloudRain;
  color: string;
  filterType: BiquadFilterType;
  filterFreq: number;
  defaultGain: number;
  modulation?: "slow" | "rapid" | "thunder";
}

const SOUND_CHANNELS: SoundChannel[] = [
  { key: "rain", label: "Rain", icon: CloudRain, color: "#22d3ee", filterType: "highpass", filterFreq: 4000, defaultGain: 0.3 },
  { key: "ocean", label: "Ocean Waves", icon: Waves, color: "#3b82f6", filterType: "lowpass", filterFreq: 400, defaultGain: 0.4, modulation: "slow" },
  { key: "crickets", label: "Crickets", icon: Bug, color: "#a3e635", filterType: "bandpass", filterFreq: 6000, defaultGain: 0.08 },
  { key: "thunder", label: "Thunder", icon: CloudLightning, color: "#a78bfa", filterType: "lowpass", filterFreq: 100, defaultGain: 0.5, modulation: "thunder" },
  { key: "wind", label: "Wind", icon: Wind, color: "#94a3b8", filterType: "bandpass", filterFreq: 800, defaultGain: 0.25, modulation: "slow" },
  { key: "fire", label: "Fireplace", icon: Flame, color: "#f97316", filterType: "bandpass", filterFreq: 1500, defaultGain: 0.2, modulation: "rapid" },
];

const TIMER_PRESETS = [
  { label: "15m", minutes: 15 },
  { label: "30m", minutes: 30 },
  { label: "45m", minutes: 45 },
  { label: "1hr", minutes: 60 },
  { label: "2hr", minutes: 120 },
];

type BreathPhase = "inhale" | "hold" | "exhale";

const SLEEP_BREATH: { phase: BreathPhase; duration: number }[] = [
  { phase: "inhale", duration: 4 },
  { phase: "hold", duration: 7 },
  { phase: "exhale", duration: 8 },
];

const PHASE_COLORS: Record<BreathPhase, string> = {
  inhale: "#06b6d4",
  hold: "#8b5cf6",
  exhale: "#f97316",
};

const PHASE_LABELS: Record<BreathPhase, string> = {
  inhale: "Breathe In",
  hold: "Hold",
  exhale: "Breathe Out",
};

const PHASE_SCALES: Record<BreathPhase, number> = {
  inhale: 1.3,
  hold: 1.3,
  exhale: 0.8,
};

interface AudioNodes {
  source: AudioBufferSourceNode;
  filter: BiquadFilterNode;
  gain: GainNode;
  modGain?: GainNode;
  modInterval?: NodeJS.Timeout;
}

export default function SleepSoundsPage() {
  useDocumentTitle("Sleep Sounds — Ambient Soundscapes");
  useMeta({
    description: "Drift into restful sleep with ambient soundscapes. Mix rain, ocean, wind, and more with the Web Audio API powered mixer.",
    ogTitle: "Sleep Sounds — THE VOID",
    ogDescription: "Ambient soundscapes for deep sleep and relaxation.",
    canonicalPath: "/sleep-sounds",
  });

  const audioCtxRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const nodesRef = useRef<Record<string, AudioNodes>>({});
  const noiseBufferRef = useRef<AudioBuffer | null>(null);

  const [channelStates, setChannelStates] = useState<Record<string, { active: boolean; volume: number }>>(
    Object.fromEntries(SOUND_CHANNELS.map((c) => [c.key, { active: false, volume: 50 }]))
  );
  const [masterVolume, setMasterVolume] = useState(70);

  const [timerMinutes, setTimerMinutes] = useState<number | null>(null);
  const [timerSecondsLeft, setTimerSecondsLeft] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const [breathActive, setBreathActive] = useState(false);
  const [breathPhaseIdx, setBreathPhaseIdx] = useState(0);
  const [breathSecondsLeft, setBreathSecondsLeft] = useState(0);
  const [breathCycles, setBreathCycles] = useState(0);
  const breathRef = useRef<NodeJS.Timeout | null>(null);

  const getAudioContext = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext();
      masterGainRef.current = audioCtxRef.current.createGain();
      masterGainRef.current.gain.value = masterVolume / 100;
      masterGainRef.current.connect(audioCtxRef.current.destination);
    }
    if (audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }, []);

  const getNoiseBuffer = useCallback(() => {
    if (noiseBufferRef.current) return noiseBufferRef.current;
    const ctx = getAudioContext();
    const bufferSize = ctx.sampleRate * 4;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    noiseBufferRef.current = buffer;
    return buffer;
  }, [getAudioContext]);

  const startSound = useCallback((channel: SoundChannel, volume: number) => {
    const ctx = getAudioContext();
    const noiseBuffer = getNoiseBuffer();

    const source = ctx.createBufferSource();
    source.buffer = noiseBuffer;
    source.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = channel.filterType;
    filter.frequency.value = channel.filterFreq;
    if (channel.filterType === "bandpass") {
      filter.Q.value = 1;
    }

    const gain = ctx.createGain();
    const effectiveGain = (volume / 100) * channel.defaultGain;
    gain.gain.value = effectiveGain;

    source.connect(filter);
    filter.connect(gain);
    gain.connect(masterGainRef.current!);
    source.start();

    const nodes: AudioNodes = { source, filter, gain };

    if (channel.modulation === "slow") {
      let phase = 0;
      nodes.modInterval = setInterval(() => {
        phase += 0.05;
        const mod = 0.5 + 0.5 * Math.sin(phase);
        gain.gain.setTargetAtTime(effectiveGain * mod, ctx.currentTime, 0.1);
      }, 100);
    } else if (channel.modulation === "rapid") {
      nodes.modInterval = setInterval(() => {
        const mod = 0.3 + Math.random() * 0.7;
        gain.gain.setTargetAtTime(effectiveGain * mod, ctx.currentTime, 0.02);
      }, 50);
    } else if (channel.modulation === "thunder") {
      gain.gain.value = 0;
      const triggerRumble = () => {
        gain.gain.setTargetAtTime(effectiveGain, ctx.currentTime, 0.1);
        setTimeout(() => {
          gain.gain.setTargetAtTime(0, ctx.currentTime, 0.8);
        }, 500 + Math.random() * 1000);
        nodes.modInterval = setTimeout(triggerRumble, 5000 + Math.random() * 15000) as unknown as NodeJS.Timeout;
      };
      triggerRumble();
    }

    nodesRef.current[channel.key] = nodes;
  }, [getAudioContext, getNoiseBuffer]);

  const stopSound = useCallback((key: string) => {
    const nodes = nodesRef.current[key];
    if (nodes) {
      try { nodes.source.stop(); } catch {}
      if (nodes.modInterval) clearInterval(nodes.modInterval);
      delete nodesRef.current[key];
    }
  }, []);

  const toggleChannel = useCallback((key: string) => {
    setChannelStates((prev) => {
      const next = { ...prev, [key]: { ...prev[key], active: !prev[key].active } };
      const channel = SOUND_CHANNELS.find((c) => c.key === key)!;
      if (next[key].active) {
        startSound(channel, next[key].volume);
      } else {
        stopSound(key);
      }
      return next;
    });
  }, [startSound, stopSound]);

  const setChannelVolume = useCallback((key: string, volume: number) => {
    setChannelStates((prev) => {
      const next = { ...prev, [key]: { ...prev[key], volume } };
      const nodes = nodesRef.current[key];
      const channel = SOUND_CHANNELS.find((c) => c.key === key)!;
      if (nodes) {
        const effectiveGain = (volume / 100) * channel.defaultGain;
        const ctx = audioCtxRef.current;
        if (ctx) {
          nodes.gain.gain.setTargetAtTime(effectiveGain, ctx.currentTime, 0.05);
        }
      }
      return next;
    });
  }, []);

  useEffect(() => {
    if (masterGainRef.current && audioCtxRef.current) {
      masterGainRef.current.gain.setTargetAtTime(masterVolume / 100, audioCtxRef.current.currentTime, 0.05);
    }
  }, [masterVolume]);

  const stopAllSounds = useCallback(() => {
    Object.keys(nodesRef.current).forEach(stopSound);
    setChannelStates((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((k) => { next[k] = { ...next[k], active: false }; });
      return next;
    });
  }, [stopSound]);

  useEffect(() => {
    if (!timerActive) return;
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimerSecondsLeft((prev) => {
        if (prev <= 1) {
          setTimerActive(false);
          stopAllSounds();
          return 0;
        }
        if (prev <= 60 && masterGainRef.current && audioCtxRef.current) {
          const fadeFraction = (prev - 1) / 60;
          masterGainRef.current.gain.setTargetAtTime(
            (masterVolume / 100) * fadeFraction,
            audioCtxRef.current.currentTime,
            0.1
          );
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [timerActive, masterVolume, stopAllSounds]);

  const selectTimer = useCallback((minutes: number) => {
    setTimerMinutes(minutes);
    setTimerSecondsLeft(minutes * 60);
    setTimerActive(true);
  }, []);

  useEffect(() => {
    if (!breathActive) return;
    if (breathRef.current) clearInterval(breathRef.current);
    breathRef.current = setInterval(() => {
      setBreathSecondsLeft((prev) => {
        if (prev <= 1) {
          setBreathPhaseIdx((pidx) => {
            const next = pidx + 1;
            if (next >= SLEEP_BREATH.length) {
              setBreathCycles((c) => c + 1);
              setBreathSecondsLeft(SLEEP_BREATH[0].duration);
              return 0;
            }
            setBreathSecondsLeft(SLEEP_BREATH[next].duration);
            return next;
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (breathRef.current) clearInterval(breathRef.current); };
  }, [breathActive]);

  const startBreathing = useCallback(() => {
    setBreathActive(true);
    setBreathCycles(0);
    setBreathPhaseIdx(0);
    setBreathSecondsLeft(SLEEP_BREATH[0].duration);
  }, []);

  const stopBreathing = useCallback(() => {
    setBreathActive(false);
    setBreathPhaseIdx(0);
    setBreathSecondsLeft(0);
    setBreathCycles(0);
    if (breathRef.current) clearInterval(breathRef.current);
  }, []);

  useEffect(() => {
    return () => {
      Object.keys(nodesRef.current).forEach(stopSound);
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
      }
    };
  }, [stopSound]);

  const currentBreathPhase = SLEEP_BREATH[breathPhaseIdx];
  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  const anyActive = Object.values(channelStates).some((c) => c.active);

  return (
    <Layout>
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6"
      >
        <motion.div variants={fadeUp}>
          <GlassCard className="overflow-hidden lg:col-span-12">
            <div className="relative h-36 sm:h-44 overflow-hidden">
              <img src={sleepImg} alt="" className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/50 to-black/90" />
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-indigo-500/20 backdrop-blur-sm">
                    <Moon className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                    <span className="text-[10px] text-indigo-400 font-semibold uppercase tracking-wider">Sleep Mode</span>
                  </div>
                </div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white font-display" data-testid="text-sleep-title">
                  Sleep Sounds
                </h1>
                <p className="text-sm text-white/60 mt-1">
                  Drift into the void with ambient soundscapes
                </p>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">
          <motion.div variants={fadeUp} className="lg:col-span-8">
            <GlassCard className="p-4 sm:p-6">
              <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-cyan-500/20 backdrop-blur-sm">
                    <Volume2 className="w-5 h-5 text-cyan-400" />
                  </div>
                  <h2 className="text-lg font-semibold text-white font-display">Soundscape Mixer</h2>
                </div>
                <div className="flex items-center gap-3 min-w-[180px]">
                  <span className="text-xs text-white/50 shrink-0">Master</span>
                  <Slider
                    value={[masterVolume]}
                    onValueChange={([v]) => setMasterVolume(v)}
                    min={0}
                    max={100}
                    step={1}
                    className="flex-1"
                    data-testid="slider-master-volume"
                  />
                  <span className="text-xs text-white/70 w-8 text-right" data-testid="text-master-volume">{masterVolume}</span>
                </div>
              </div>

              <div className="space-y-3">
                {SOUND_CHANNELS.map((channel) => {
                  const state = channelStates[channel.key];
                  const Icon = channel.icon;
                  return (
                    <div
                      key={channel.key}
                      className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5"
                      data-testid={`channel-${channel.key}`}
                    >
                      <div
                        className="p-2 rounded-lg shrink-0"
                        style={{ backgroundColor: `${channel.color}20` }}
                      >
                        <Icon className="w-4 h-4" style={{ color: channel.color }} />
                      </div>
                      <span className="text-sm text-white font-medium w-24 shrink-0">{channel.label}</span>
                      <Switch
                        checked={state.active}
                        onCheckedChange={() => toggleChannel(channel.key)}
                        data-testid={`toggle-${channel.key}`}
                      />
                      <Slider
                        value={[state.volume]}
                        onValueChange={([v]) => setChannelVolume(channel.key, v)}
                        min={0}
                        max={100}
                        step={1}
                        disabled={!state.active}
                        className="flex-1 min-w-[80px]"
                        data-testid={`slider-${channel.key}`}
                      />
                      <span className="text-xs text-white/50 w-8 text-right">{state.volume}</span>
                    </div>
                  );
                })}
              </div>

              {anyActive && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 flex justify-center"
                >
                  <Button variant="ghost" onClick={stopAllSounds} data-testid="button-stop-all">
                    <Pause className="w-4 h-4 mr-2" /> Stop All
                  </Button>
                </motion.div>
              )}
            </GlassCard>
          </motion.div>

          <motion.div variants={fadeUp} className="lg:col-span-4">
            <GlassCard className="p-4 sm:p-6 h-full">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-purple-500/20 backdrop-blur-sm">
                  <Timer className="w-5 h-5 text-purple-400" />
                </div>
                <h2 className="text-lg font-semibold text-white font-display">Sleep Timer</h2>
              </div>

              <div className="flex flex-col items-center space-y-6">
                <div className="text-center">
                  <p className="text-4xl font-bold text-white font-display" data-testid="text-timer-display">
                    {timerActive || timerSecondsLeft > 0
                      ? formatTime(timerSecondsLeft)
                      : "--:--"}
                  </p>
                  {timerActive && timerSecondsLeft <= 60 && (
                    <p className="text-[10px] text-amber-400 mt-1">Fading out...</p>
                  )}
                </div>

                {!timerActive && timerSecondsLeft === 0 && (
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    {TIMER_PRESETS.map((preset) => (
                      <Button
                        key={preset.minutes}
                        variant={timerMinutes === preset.minutes ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => selectTimer(preset.minutes)}
                        data-testid={`button-timer-${preset.minutes}`}
                      >
                        {preset.label}
                      </Button>
                    ))}
                  </div>
                )}

                {timerActive && (
                  <Button
                    variant="ghost"
                    onClick={() => { setTimerActive(false); setTimerSecondsLeft(0); setTimerMinutes(null); }}
                    data-testid="button-timer-cancel"
                  >
                    Cancel Timer
                  </Button>
                )}

                <p className="text-xs text-white/40 text-center">
                  {timerActive
                    ? "Sounds will gradually fade in the last 60 seconds"
                    : "Select a duration to auto-stop sounds"}
                </p>
              </div>
            </GlassCard>
          </motion.div>
        </div>

        <motion.div variants={fadeUp}>
          <GlassCard className="overflow-hidden lg:col-span-12">
            <div className="p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-orange-500/20 backdrop-blur-sm">
                  <Wind className="w-5 h-5 text-orange-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white font-display">Wind-Down Breathing</h2>
                  <p className="text-xs text-white/40">The Sleep Breath — 4-7-8 Pattern</p>
                </div>
              </div>

              <div className="flex flex-col items-center space-y-6">
                <div className="relative flex items-center justify-center" style={{ width: 200, height: 200 }}>
                  <motion.div
                    className="absolute rounded-full"
                    style={{
                      width: 160,
                      height: 160,
                      background: breathActive
                        ? `radial-gradient(circle, ${PHASE_COLORS[currentBreathPhase.phase]}30, transparent)`
                        : "radial-gradient(circle, rgba(139,92,246,0.1), transparent)",
                      border: breathActive
                        ? `2px solid ${PHASE_COLORS[currentBreathPhase.phase]}40`
                        : "2px solid rgba(139,92,246,0.15)",
                    }}
                    animate={{
                      scale: breathActive ? PHASE_SCALES[currentBreathPhase.phase] : 1,
                    }}
                    transition={{
                      duration: breathActive ? currentBreathPhase.duration : 0.5,
                      ease: "easeInOut",
                    }}
                  />
                  <div className="relative z-10 text-center space-y-1">
                    {breathActive ? (
                      <>
                        <p
                          className="text-lg font-bold font-display"
                          style={{ color: PHASE_COLORS[currentBreathPhase.phase] }}
                          data-testid="text-breath-phase"
                        >
                          {PHASE_LABELS[currentBreathPhase.phase]}
                        </p>
                        <p className="text-3xl font-bold text-white font-display" data-testid="text-breath-seconds">
                          {breathSecondsLeft}
                        </p>
                      </>
                    ) : (
                      <p className="text-sm text-white/50">4 — 7 — 8</p>
                    )}
                  </div>
                </div>

                {breathActive && (
                  <p className="text-xs text-white/40">
                    Cycles: <span className="text-white font-medium">{breathCycles}</span>
                  </p>
                )}

                <div className="flex items-center gap-3">
                  {breathActive ? (
                    <Button variant="ghost" onClick={stopBreathing} data-testid="button-breath-stop">
                      <Pause className="w-4 h-4 mr-2" /> Stop
                    </Button>
                  ) : (
                    <Button onClick={startBreathing} data-testid="button-breath-start">
                      <Play className="w-4 h-4 mr-2" /> Start
                    </Button>
                  )}
                </div>

                <p className="text-xs text-white/30 text-center max-w-sm">
                  Inhale for 4 seconds, hold for 7 seconds, exhale for 8 seconds. A proven technique to calm the nervous system and prepare for sleep.
                </p>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      </motion.div>
    </Layout>
  );
}
