import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { Mic, Brain, Shield, Flame, Moon, PenLine, BarChart3, Sparkles, ChevronDown, ArrowRight, Zap, Lock, Volume2, Fingerprint, Palette, Timer, Code } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/GlassCard";
import flyoverVideo1 from "@/assets/videos/flyover-1.mp4";
import flyoverVideo2 from "@/assets/videos/flyover-2.mp4";
import flyoverVideo3 from "@/assets/videos/flyover-3.mp4";
import flyoverVideo4 from "@/assets/videos/flyover-4.mp4";

const HERO_VIDEOS = [
  { src: flyoverVideo1, label: "Cosmic Void" },
  { src: flyoverVideo2, label: "Neural AI" },
  { src: flyoverVideo3, label: "Deep Ocean" },
  { src: flyoverVideo4, label: "Glass World" },
];

const features = [
  { icon: Mic, title: "Voice Venting", desc: "The core. Scream, rant, or whisper — AI listens and responds.", color: "text-cyan-400", bg: "bg-cyan-500/10" },
  { icon: Brain, title: "5 AI Personalities", desc: "Smart-Ass, Calming, Therapist, Hype Man, Roast Master.", color: "text-purple-400", bg: "bg-purple-500/10" },
  { icon: Fingerprint, title: "Voice Fingerprint", desc: "AI reads emotional biomarkers from your vent sessions.", color: "text-violet-400", bg: "bg-violet-500/10" },
  { icon: Volume2, title: "Voice Responses", desc: "Hear your AI talk back with personality-matched voices.", color: "text-blue-400", bg: "bg-blue-500/10" },
  { icon: Palette, title: "Mood Portrait", desc: "Your vents become evolving abstract artwork.", color: "text-fuchsia-400", bg: "bg-fuchsia-500/10" },
  { icon: PenLine, title: "Voice & Written Journal", desc: "Speak or type. Tag moods. Get AI insights.", color: "text-indigo-400", bg: "bg-indigo-500/10" },
  { icon: BarChart3, title: "Mood Analytics", desc: "Track emotional trends with visual charts over time.", color: "text-teal-400", bg: "bg-teal-500/10" },
  { icon: Timer, title: "Void Echo", desc: "Time capsule messages to your future self.", color: "text-amber-400", bg: "bg-amber-500/10" },
  { icon: Flame, title: "Rage Room", desc: "Smash virtual objects. Feel better. No cleanup.", color: "text-red-400", bg: "bg-red-500/10" },
  { icon: Moon, title: "Sleep Sounds", desc: "Ambient soundscapes to drift off. Timer included.", color: "text-sky-400", bg: "bg-sky-500/10" },
  { icon: Sparkles, title: "Daily Affirmations", desc: "AI-generated words of power tailored to your journey.", color: "text-pink-400", bg: "bg-pink-500/10" },
  { icon: Shield, title: "Crisis Toolkit", desc: "Breathing, grounding, hotlines. Always there for you.", color: "text-emerald-400", bg: "bg-emerald-500/10" },
];

const stats = [
  { value: "5", label: "AI Personalities" },
  { value: "20+", label: "Wellness Tools" },
  { value: "$9.99", label: "Founders Rate" },
  { value: "24/7", label: "Always Available" },
];

export default function LandingPage() {
  const [, navigate] = useLocation();
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [nextVideoIndex, setNextVideoIndex] = useState(1);
  const [isVideoTransitioning, setIsVideoTransitioning] = useState(false);
  const [videoMuted] = useState(true);
  const currentVideoRef = useRef<HTMLVideoElement>(null);
  const nextVideoRef = useRef<HTMLVideoElement>(null);
  const [featureIdx, setFeatureIdx] = useState(0);
  const featureTouchRef = useRef<{ startX: number; startY: number } | null>(null);
  const [compareIdx, setCompareIdx] = useState(0);
  const compareTouchRef = useRef<{ startX: number; startY: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({ target: containerRef });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.25], [1, 0]);
  const titleY = useTransform(scrollYProgress, [0, 0.2], [0, -60]);

  useEffect(() => {
    const handleVideoEnd = () => {
      setIsVideoTransitioning(true);
      setTimeout(() => {
        setCurrentVideoIndex(nextVideoIndex);
        setNextVideoIndex((nextVideoIndex + 1) % HERO_VIDEOS.length);
        setIsVideoTransitioning(false);
      }, 400);
    };
    const video = currentVideoRef.current;
    if (video) {
      video.addEventListener('ended', handleVideoEnd);
      return () => video.removeEventListener('ended', handleVideoEnd);
    }
  }, [nextVideoIndex, videoMuted]);

  useEffect(() => {
    if (nextVideoRef.current) {
      nextVideoRef.current.load();
    }
  }, [nextVideoIndex]);

  useEffect(() => {
    if (currentVideoRef.current && !isVideoTransitioning) {
      const video = currentVideoRef.current;
      video.volume = 0;
      video.play().catch(() => {});
    }
  }, [currentVideoIndex, isVideoTransitioning, videoMuted]);

  useEffect(() => {
    const timer = setInterval(() => {
      setFeatureIdx((p) => (p + 1) % features.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const handleEnter = useCallback(() => {
    navigate("/home");
  }, [navigate]);

  return (
    <div ref={containerRef} className="relative bg-black text-white overflow-x-hidden">
      <section className="relative h-screen overflow-hidden">
        <div className="absolute inset-0 bg-black">
          <video
            ref={currentVideoRef}
            key={`current-${currentVideoIndex}`}
            autoPlay
            muted={videoMuted}
            playsInline
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700
              ${isVideoTransitioning ? 'opacity-0' : 'opacity-100'}`}
          >
            <source src={HERO_VIDEOS[currentVideoIndex].src} type="video/mp4" />
          </video>
          <video
            ref={nextVideoRef}
            key={`next-${nextVideoIndex}`}
            muted={videoMuted}
            playsInline
            preload="auto"
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700
              ${isVideoTransitioning ? 'opacity-100' : 'opacity-0'}`}
          >
            <source src={HERO_VIDEOS[nextVideoIndex].src} type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/40 to-black" />
        </div>

        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.1, 0.2, 0.1],
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full"
            style={{ background: "radial-gradient(circle, rgba(6,182,212,0.2) 0%, transparent 70%)" }}
          />
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.08, 0.15, 0.08],
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full"
            style={{ background: "radial-gradient(circle, rgba(147,51,234,0.2) 0%, transparent 70%)" }}
          />
        </div>

        <div className="absolute bottom-28 left-1/2 -translate-x-1/2 z-30 flex gap-2">
          {HERO_VIDEOS.map((v, idx) => (
            <button key={idx} onClick={() => {
              if (idx !== currentVideoIndex) {
                setNextVideoIndex(idx);
                setIsVideoTransitioning(true);
                setTimeout(() => {
                  setCurrentVideoIndex(idx);
                  setNextVideoIndex((idx + 1) % HERO_VIDEOS.length);
                  setIsVideoTransitioning(false);
                }, 700);
              }
            }}
              className={`rounded-full transition-all duration-300 ${currentVideoIndex === idx
                ? 'w-8 h-2 bg-white'
                : 'w-2 h-2 bg-white/40 hover:bg-white/60'}`}
              data-testid={`button-video-dot-${idx}`}
            />
          ))}
        </div>

        <motion.div
          style={{ y: titleY, opacity: heroOpacity }}
          className="relative z-10 h-full flex flex-col items-center justify-center text-center px-6 max-w-4xl mx-auto"
        >
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="mb-6"
          >
            <img
              src="/icon-192.webp"
              alt="THE VOID"
              className="w-20 h-20 rounded-2xl shadow-2xl shadow-cyan-500/30 mx-auto mb-6"
              data-testid="img-landing-logo"
            />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.4 }}
            className="text-5xl sm:text-7xl md:text-8xl font-black tracking-[0.15em] font-display mb-4 drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)]"
            data-testid="text-landing-title"
          >
            THE VOID
          </motion.h1>

          <motion.div
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="w-24 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent mb-6"
          />

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1 }}
            className="text-lg sm:text-xl text-white font-medium max-w-xl leading-relaxed mb-3 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]"
            data-testid="text-landing-tagline"
          >
            Scream into the abyss. The abyss talks back.
          </motion.p>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1.3 }}
            className="text-sm text-white/80 font-medium max-w-md leading-relaxed mb-2 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]"
          >
            The first app built for venting, ranting, and letting it all out.
            AI listens, responds, and helps you process — on your terms.
          </motion.p>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1.5 }}
            className="text-[10px] text-white/50 tracking-[0.3em] uppercase mb-10 drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]"
          >
            Voice-powered emotional release + 20 wellness tools
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.5 }}
            className="flex flex-col sm:flex-row items-center gap-4"
          >
            <Button
              onClick={handleEnter}
              className="bg-gradient-to-r from-cyan-500 to-purple-600 border-0 text-white px-8 min-h-12 text-base font-semibold shadow-lg shadow-cyan-500/20"
              data-testid="button-enter-void"
            >
              Into the Void
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button
              variant="ghost"
              onClick={() => navigate("/onboarding")}
              className="text-sm text-white/80 font-medium drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]"
              data-testid="button-how-it-works"
            >
              How it Works
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
            <a
              href="#features"
              className="text-sm text-white/80 font-medium flex items-center gap-1.5 transition-colors drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]"
              data-testid="link-learn-more"
            >
              Learn more
              <ChevronDown className="w-4 h-4" />
            </a>
          </motion.div>
        </motion.div>
      </section>

      <section className="relative py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.6 }}
                className="text-center"
              >
                <p className="text-3xl sm:text-4xl font-black text-white font-display mb-1" data-testid={`text-stat-value-${i}`}>
                  {stat.value}
                </p>
                <p className="text-xs text-white/40 uppercase tracking-wider">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="relative py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <p className="text-xs text-cyan-400 tracking-[0.3em] uppercase mb-3">Built around venting</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white font-display mb-4" data-testid="text-features-title">
              Let it out. Then level up.
            </h2>
            <p className="text-sm text-white/40 max-w-lg mx-auto">
              Start by venting — that's the core. Then explore 20+ tools designed to help you
              process, reflect, and recover. All in one place.
            </p>
          </motion.div>

          <div
            className="relative overflow-hidden"
            onTouchStart={(e) => {
              featureTouchRef.current = { startX: e.touches[0].clientX, startY: e.touches[0].clientY };
            }}
            onTouchEnd={(e) => {
              if (!featureTouchRef.current) return;
              const dx = e.changedTouches[0].clientX - featureTouchRef.current.startX;
              const dy = e.changedTouches[0].clientY - featureTouchRef.current.startY;
              if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40) {
                if (dx < 0) setFeatureIdx((p) => (p + 1) % features.length);
                else setFeatureIdx((p) => (p - 1 + features.length) % features.length);
              }
              featureTouchRef.current = null;
            }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={featureIdx}
                initial={{ opacity: 0, x: 80 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -80 }}
                transition={{ duration: 0.35, ease: "easeInOut" }}
                className="w-full"
              >
                {(() => {
                  const f = features[featureIdx];
                  const gradients = [
                    "from-cyan-500/20 via-cyan-600/10 to-transparent",
                    "from-purple-500/20 via-purple-600/10 to-transparent",
                    "from-violet-500/20 via-violet-600/10 to-transparent",
                    "from-blue-500/20 via-blue-600/10 to-transparent",
                    "from-fuchsia-500/20 via-fuchsia-600/10 to-transparent",
                    "from-indigo-500/20 via-indigo-600/10 to-transparent",
                    "from-teal-500/20 via-teal-600/10 to-transparent",
                    "from-amber-500/20 via-amber-600/10 to-transparent",
                    "from-red-500/20 via-red-600/10 to-transparent",
                    "from-sky-500/20 via-sky-600/10 to-transparent",
                    "from-pink-500/20 via-pink-600/10 to-transparent",
                    "from-emerald-500/20 via-emerald-600/10 to-transparent",
                  ];
                  return (
                    <div
                      className={`relative rounded-2xl border border-white/10 bg-gradient-to-br ${gradients[featureIdx % gradients.length]} backdrop-blur-xl p-8 sm:p-10 min-h-[200px] flex flex-col items-center justify-center text-center`}
                      data-testid={`card-feature-${featureIdx}`}
                    >
                      <div className={`p-4 rounded-2xl ${f.bg} mb-5`}>
                        <f.icon className={`w-8 h-8 ${f.color}`} />
                      </div>
                      <h3 className="text-xl sm:text-2xl font-bold text-white mb-3 font-display" data-testid={`text-feature-title-${featureIdx}`}>
                        {f.title}
                      </h3>
                      <p className="text-sm text-white/60 leading-relaxed max-w-sm">{f.desc}</p>
                      <p className="text-[10px] text-white/20 mt-4 tracking-wider uppercase">
                        {featureIdx + 1} / {features.length}
                      </p>
                    </div>
                  );
                })()}
              </motion.div>
            </AnimatePresence>

            <div className="flex justify-center gap-1.5 mt-6">
              {features.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setFeatureIdx(idx)}
                  className={`rounded-full transition-all duration-300 ${featureIdx === idx
                    ? 'w-6 h-1.5 bg-cyan-400'
                    : 'w-1.5 h-1.5 bg-white/20 hover:bg-white/40'}`}
                  data-testid={`button-feature-dot-${idx}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="relative py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <p className="text-xs text-purple-400 tracking-[0.3em] uppercase mb-3">Why THE VOID</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white font-display mb-4">
              Vent first. Everything else follows.
            </h2>
            <p className="text-sm text-white/40 max-w-md mx-auto mb-2">
              No other app starts with what you actually need — to let it out. Then it wraps
              meditation, therapy, and tracking around that release.
            </p>
          </motion.div>

          {(() => {
            const comparisons = [
              { title: "Nothing like it", items: ["Voice Venting", "Voice Fingerprint", "Mood Portraits", "Void Echo"], icon: Mic, highlight: true, gradient: "from-cyan-500/20 via-cyan-600/10 to-transparent" },
              { title: "Calm / Headspace", items: ["Guided Breathing", "Sleep Sounds", "Zen Zone", "Meditation Timer"], icon: Moon, highlight: false, gradient: "from-purple-500/20 via-purple-600/10 to-transparent" },
              { title: "Woebot / Therapy", items: ["5 AI Personalities", "Voice Conversations", "Safety Plans", "Crisis Toolkit"], icon: Brain, highlight: false, gradient: "from-indigo-500/20 via-indigo-600/10 to-transparent" },
              { title: "Daylio / Tracking", items: ["Mood Analytics", "Journal", "Streaks & Badges", "Daily Affirmations"], icon: BarChart3, highlight: false, gradient: "from-teal-500/20 via-teal-600/10 to-transparent" },
            ];
            const col = comparisons[compareIdx];
            return (
              <div
                className="relative overflow-hidden"
                onTouchStart={(e) => {
                  compareTouchRef.current = { startX: e.touches[0].clientX, startY: e.touches[0].clientY };
                }}
                onTouchEnd={(e) => {
                  if (!compareTouchRef.current) return;
                  const dx = e.changedTouches[0].clientX - compareTouchRef.current.startX;
                  const dy = e.changedTouches[0].clientY - compareTouchRef.current.startY;
                  if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40) {
                    if (dx < 0) setCompareIdx((p) => (p + 1) % comparisons.length);
                    else setCompareIdx((p) => (p - 1 + comparisons.length) % comparisons.length);
                  }
                  compareTouchRef.current = null;
                }}
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={compareIdx}
                    initial={{ opacity: 0, x: 80 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -80 }}
                    transition={{ duration: 0.35, ease: "easeInOut" }}
                  >
                    <div className={`relative rounded-2xl border ${col.highlight ? "border-cyan-500/30" : "border-white/10"} bg-gradient-to-br ${col.gradient} backdrop-blur-xl p-8 sm:p-10 min-h-[240px] flex flex-col items-center justify-center text-center`}>
                      <div className={`p-4 rounded-2xl mb-4 ${col.highlight ? "bg-cyan-500/10" : "bg-white/5"}`}>
                        <col.icon className={`w-8 h-8 ${col.highlight ? "text-cyan-400" : "text-purple-400"}`} />
                      </div>
                      <p className="text-xs text-white/40 uppercase tracking-wider mb-1">{col.highlight ? "Only in THE VOID" : "Replaces"}</p>
                      <h3 className="text-xl font-bold text-white mb-5 font-display" data-testid={`text-replaces-${compareIdx}`}>{col.title}</h3>
                      <ul className="space-y-3">
                        {col.items.map((item) => (
                          <li key={item} className="flex items-center gap-2 text-sm text-white/70">
                            <Zap className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                            {item}
                          </li>
                        ))}
                      </ul>
                      <p className="text-[10px] text-white/20 mt-5 tracking-wider uppercase">
                        {compareIdx + 1} / {comparisons.length}
                      </p>
                    </div>
                  </motion.div>
                </AnimatePresence>

                <div className="flex justify-center gap-2 mt-6">
                  {comparisons.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCompareIdx(idx)}
                      className={`rounded-full transition-all duration-300 ${compareIdx === idx
                        ? 'w-6 h-1.5 bg-purple-400'
                        : 'w-1.5 h-1.5 bg-white/20 hover:bg-white/40'}`}
                      data-testid={`button-compare-dot-${idx}`}
                    />
                  ))}
                </div>
              </div>
            );
          })()}
        </div>
      </section>

      <section className="relative py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-10"
          >
            <p className="text-xs text-cyan-400 tracking-[0.3em] uppercase mb-3">Founders Pricing</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white font-display mb-3">
              Lock in your rate. Forever.
            </h2>
            <p className="text-sm text-white/40 max-w-md mx-auto">
              First 1,000 members get the Founders Rate. Once it's gone, it's gone.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <GlassCard className="p-8 sm:p-10 text-center relative overflow-visible">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="px-4 py-1 rounded-full bg-gradient-to-r from-cyan-500 to-purple-600 text-xs font-bold text-white tracking-wider uppercase">
                  Founders Only
                </span>
              </div>
              <div className="flex items-baseline justify-center gap-1 mb-2 mt-4">
                <span className="text-5xl sm:text-6xl font-black text-white font-display" data-testid="text-price">$9.99</span>
                <span className="text-lg text-white/40">/mo</span>
              </div>
              <p className="text-sm text-white/40 mb-1">Locked forever. Never increases.</p>
              <p className="text-xs text-white/30 mb-8">Regular price: <span className="line-through">$14.99/mo</span></p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
                {[
                  "Unlimited Venting",
                  "All 5 AI Personalities",
                  "Voice Fingerprint",
                  "Journal & Analytics",
                  "Mood Portraits",
                  "Founders Badge",
                ].map((perk) => (
                  <div key={perk} className="flex items-center gap-2 text-xs text-white/60">
                    <Zap className="w-3 h-3 text-cyan-400 flex-shrink-0" />
                    {perk}
                  </div>
                ))}
              </div>
              <Button
                onClick={handleEnter}
                className="bg-gradient-to-r from-cyan-500 to-purple-600 border-0 text-white px-10 min-h-12 text-base font-semibold shadow-lg shadow-purple-500/20"
                data-testid="button-claim-spot"
              >
                <Lock className="w-4 h-4 mr-2" />
                Claim Your Spot
              </Button>
            </GlassCard>
          </motion.div>
        </div>
      </section>

      <section className="relative py-24 px-6">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-20"
            style={{ background: "radial-gradient(circle, rgba(6,182,212,0.4) 0%, rgba(147,51,234,0.2) 40%, transparent 70%)" }}
          />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative z-10 max-w-2xl mx-auto text-center"
        >
          <h2 className="text-3xl sm:text-5xl font-black text-white font-display mb-4 tracking-wide" data-testid="text-cta-title">
            Ready to let it out?
          </h2>
          <p className="text-base text-white/50 mb-8 max-w-md mx-auto">
            The void is waiting. Say what you need to say. Your AI companions are standing by.
          </p>
          <Button
            onClick={handleEnter}
            className="bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 border-0 text-white px-10 min-h-14 text-lg font-bold shadow-2xl shadow-purple-500/30"
            data-testid="button-enter-final"
          >
            Into the Void
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
          <p className="text-[10px] text-white/20 mt-6 tracking-[0.3em] uppercase">DarkWave Studios</p>
          <button
            onClick={() => navigate("/developer")}
            className="mt-4 flex items-center gap-1.5 mx-auto text-[10px] text-white/15 hover:text-white/40 transition-colors tracking-[0.2em] uppercase"
            data-testid="link-developer-landing"
          >
            <Code className="w-3 h-3" />
            Developer
          </button>
        </motion.div>
      </section>
    </div>
  );
}
