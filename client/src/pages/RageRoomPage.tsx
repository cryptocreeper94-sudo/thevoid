import { useState, useCallback, useRef, useEffect } from "react";
import { Layout } from "@/components/ui/Layout";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { useMeta } from "@/hooks/use-meta";
import { GlassCard } from "@/components/ui/GlassCard";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Plus, RotateCcw, Zap, Target, Flame, Trophy } from "lucide-react";
import rageImg from "@/assets/images/rage-smash.png";

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const OBJECT_COLORS = [
  "bg-red-500/10 border-red-500/20",
  "bg-blue-500/10 border-blue-500/20",
  "bg-purple-500/10 border-purple-500/20",
  "bg-amber-500/10 border-amber-500/20",
  "bg-cyan-500/10 border-cyan-500/20",
  "bg-pink-500/10 border-pink-500/20",
];

const OBJECT_SHAPES = [
  { label: "Glass Panel", borderRadius: "rounded-xl" },
  { label: "Plate", borderRadius: "rounded-full" },
  { label: "Vase", borderRadius: "rounded-2xl" },
  { label: "Lightbulb", borderRadius: "rounded-3xl" },
];

const SIZES = [
  { w: 64, h: 64, cls: "w-16 h-16" },
  { w: 72, h: 72, cls: "w-[72px] h-[72px]" },
  { w: 80, h: 80, cls: "w-20 h-20" },
  { w: 96, h: 96, cls: "w-24 h-24" },
];

interface SmashObject {
  id: string;
  x: number;
  y: number;
  sizeIdx: number;
  colorIdx: number;
  shapeIdx: number;
  smashed: boolean;
}

interface Fragment {
  id: string;
  parentId: string;
  x: number;
  y: number;
  dx: number;
  dy: number;
  colorIdx: number;
}

let objectIdCounter = 0;

function createObject(containerW: number, containerH: number): SmashObject {
  const sizeIdx = Math.floor(Math.random() * SIZES.length);
  const size = SIZES[sizeIdx];
  return {
    id: `obj-${++objectIdCounter}`,
    x: Math.random() * Math.max(0, containerW - size.w),
    y: Math.random() * Math.max(0, containerH - size.h),
    sizeIdx,
    colorIdx: Math.floor(Math.random() * OBJECT_COLORS.length),
    shapeIdx: Math.floor(Math.random() * OBJECT_SHAPES.length),
    smashed: false,
  };
}

function createFragments(obj: SmashObject): Fragment[] {
  const count = 3 + Math.floor(Math.random() * 3);
  const size = SIZES[obj.sizeIdx];
  const cx = obj.x + size.w / 2;
  const cy = obj.y + size.h / 2;
  return Array.from({ length: count }, (_, i) => {
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
    const dist = 40 + Math.random() * 60;
    return {
      id: `frag-${obj.id}-${i}`,
      parentId: obj.id,
      x: cx,
      y: cy,
      dx: Math.cos(angle) * dist,
      dy: Math.sin(angle) * dist,
      colorIdx: obj.colorIdx,
    };
  });
}

const BEST_SESSION_KEY = "rage-room-best-session";

export default function RageRoomPage() {
  useDocumentTitle("Rage Room — Smash & Release");
  useMeta({
    description: "Virtual rage room. Smash glass objects, release stress, no cleanup required. Pure cathartic destruction.",
    ogTitle: "Rage Room — Break Things, Feel Better",
    ogDescription: "Click to smash virtual objects and release your stress.",
    canonicalPath: "/rage-room",
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const [objects, setObjects] = useState<SmashObject[]>([]);
  const [fragments, setFragments] = useState<Fragment[]>([]);
  const [sessionSmashes, setSessionSmashes] = useState(0);
  const [bestSession, setBestSession] = useState(() => {
    try {
      return parseInt(localStorage.getItem(BEST_SESSION_KEY) || "0", 10);
    } catch {
      return 0;
    }
  });
  const [streak, setStreak] = useState(0);
  const [spawnCount, setSpawnCount] = useState(5);
  const lastSmashTime = useRef(0);
  const streakTimer = useRef<NodeJS.Timeout | null>(null);

  const spawnObjects = useCallback((count: number) => {
    const el = containerRef.current;
    const w = el ? el.clientWidth : 600;
    const h = el ? el.clientHeight : 400;
    const newObjs = Array.from({ length: count }, () => createObject(w, h));
    setObjects((prev) => [...prev, ...newObjs]);
  }, []);

  useEffect(() => {
    if (objects.length === 0) {
      spawnObjects(spawnCount);
    }
  }, []);

  const handleSmash = useCallback((obj: SmashObject) => {
    const now = Date.now();
    const timeSinceLast = now - lastSmashTime.current;
    lastSmashTime.current = now;

    if (timeSinceLast < 1200) {
      setStreak((s) => s + 1);
    } else {
      setStreak(1);
    }

    if (streakTimer.current) clearTimeout(streakTimer.current);
    streakTimer.current = setTimeout(() => setStreak(0), 2000);

    setObjects((prev) => prev.map((o) => (o.id === obj.id ? { ...o, smashed: true } : o)));
    setFragments((prev) => [...prev, ...createFragments(obj)]);
    setSessionSmashes((prev) => {
      const next = prev + 1;
      setBestSession((best) => {
        const newBest = Math.max(best, next);
        try {
          localStorage.setItem(BEST_SESSION_KEY, String(newBest));
        } catch {}
        return newBest;
      });
      return next;
    });

    setTimeout(() => {
      setObjects((prev) => prev.filter((o) => o.id !== obj.id));
      setFragments((prev) => prev.filter((f) => f.parentId !== obj.id));
      const el = containerRef.current;
      const w = el ? el.clientWidth : 600;
      const h = el ? el.clientHeight : 400;
      setObjects((prev) => [...prev, createObject(w, h)]);
    }, 700);
  }, []);

  const handleReset = useCallback(() => {
    setObjects([]);
    setFragments([]);
    setSessionSmashes(0);
    setStreak(0);
    objectIdCounter = 0;
    setTimeout(() => {
      const el = containerRef.current;
      const w = el ? el.clientWidth : 600;
      const h = el ? el.clientHeight : 400;
      const newObjs = Array.from({ length: spawnCount }, () => createObject(w, h));
      setObjects(newObjs);
    }, 100);
  }, [spawnCount]);

  const handleSpawnMore = useCallback(() => {
    spawnObjects(spawnCount);
  }, [spawnObjects, spawnCount]);

  const spawnOptions = [3, 5, 10, 15];

  return (
    <Layout>
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        className="max-w-4xl mx-auto px-4 py-8 space-y-6"
      >
        <motion.div variants={fadeUp}>
          <GlassCard className="overflow-hidden">
            <div className="relative h-32 sm:h-40 overflow-hidden">
              <img src={rageImg} alt="" className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-black/90" />
              <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/20 border border-red-500/30 mb-2">
                  <Flame className="w-3.5 h-3.5 text-red-400" />
                  <span className="text-xs font-medium text-red-300 tracking-wide uppercase">Rage Room</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white font-display" data-testid="text-rage-title">
                  Rage Room
                </h1>
                <p className="text-sm text-white/60 mt-1">
                  Break things. Feel better. No cleanup required.
                </p>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        <motion.div variants={fadeUp}>
          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={handleSpawnMore} data-testid="button-spawn-more">
              <Plus className="w-4 h-4 mr-2" />
              Spawn More
            </Button>
            <Button variant="ghost" onClick={handleReset} data-testid="button-reset">
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
            <div className="flex items-center gap-1 ml-auto">
              <span className="text-xs text-muted-foreground mr-1">Spawn:</span>
              {spawnOptions.map((n) => (
                <Button
                  key={n}
                  variant={spawnCount === n ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setSpawnCount(n)}
                  data-testid={`button-spawn-count-${n}`}
                >
                  {n}
                </Button>
              ))}
            </div>
          </div>
        </motion.div>

        <motion.div variants={fadeUp}>
          <GlassCard className="overflow-visible p-0">
            <div
              ref={containerRef}
              className="relative w-full overflow-hidden rounded-3xl"
              style={{ minHeight: 400 }}
              data-testid="container-smash-area"
            >
              <div className="absolute inset-0 bg-white/[0.02]" />

              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-1/4 left-1/4 w-px h-full bg-white/20" />
                <div className="absolute top-1/4 left-2/4 w-px h-full bg-white/20" />
                <div className="absolute top-1/4 left-3/4 w-px h-full bg-white/20" />
                <div className="absolute top-1/3 left-0 w-full h-px bg-white/20" />
                <div className="absolute top-2/3 left-0 w-full h-px bg-white/20" />
              </div>

              <AnimatePresence>
                {objects.filter((o) => !o.smashed).map((obj) => {
                  const size = SIZES[obj.sizeIdx];
                  const color = OBJECT_COLORS[obj.colorIdx];
                  const shape = OBJECT_SHAPES[obj.shapeIdx];
                  return (
                    <motion.div
                      key={obj.id}
                      className={`absolute cursor-pointer backdrop-blur-sm border ${color} ${shape.borderRadius} flex items-center justify-center select-none`}
                      style={{
                        left: obj.x,
                        top: obj.y,
                        width: size.w,
                        height: size.h,
                      }}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, rotate: 45, opacity: 0 }}
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 20,
                      }}
                      whileHover={{ scale: 1.08, borderColor: "rgba(255,255,255,0.3)" }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleSmash(obj)}
                      data-testid={`smashable-object-${obj.id}`}
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-inherit pointer-events-none" />
                      <Target className="w-5 h-5 text-white/30" />
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              <AnimatePresence>
                {fragments.map((frag) => (
                  <motion.div
                    key={frag.id}
                    className={`absolute w-2 h-2 ${OBJECT_COLORS[frag.colorIdx].split(" ")[0]} rounded-sm pointer-events-none`}
                    style={{ left: frag.x, top: frag.y }}
                    initial={{ scale: 1, opacity: 1 }}
                    animate={{
                      x: frag.dx,
                      y: frag.dy,
                      scale: 0,
                      opacity: 0,
                      rotate: Math.random() * 360,
                    }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                  />
                ))}
              </AnimatePresence>

              {objects.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="text-sm text-muted-foreground">Click "Spawn More" to add objects</p>
                </div>
              )}
            </div>
          </GlassCard>
        </motion.div>

        <motion.div variants={fadeUp}>
          <div className="grid grid-cols-3 gap-3">
            <GlassCard className="text-center">
              <div className="p-2 rounded-lg bg-red-500/20 w-fit mx-auto mb-2">
                <Zap className="w-4 h-4 text-red-400" />
              </div>
              <p className="text-2xl font-bold text-foreground font-display" data-testid="text-session-smashes">
                {sessionSmashes}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Session Smashes</p>
            </GlassCard>

            <GlassCard className="text-center">
              <div className="p-2 rounded-lg bg-amber-500/20 w-fit mx-auto mb-2">
                <Trophy className="w-4 h-4 text-amber-400" />
              </div>
              <p className="text-2xl font-bold text-foreground font-display" data-testid="text-best-session">
                {bestSession}
              </p>
              <p className="text-xs text-muted-foreground mt-1">All-Time Best</p>
            </GlassCard>

            <GlassCard className="text-center">
              <div className="p-2 rounded-lg bg-purple-500/20 w-fit mx-auto mb-2">
                <Flame className="w-4 h-4 text-purple-400" />
              </div>
              <p className={`text-2xl font-bold font-display ${streak >= 5 ? "text-red-400" : streak >= 3 ? "text-amber-400" : "text-foreground"}`} data-testid="text-streak">
                {streak}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {streak >= 5 ? "ON FIRE" : streak >= 3 ? "Heating Up" : "Streak"}
              </p>
            </GlassCard>
          </div>
        </motion.div>
      </motion.div>
    </Layout>
  );
}
