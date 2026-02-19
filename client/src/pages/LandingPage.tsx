import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { Mic, Brain, Shield, Flame, Moon, PenLine, BarChart3, Sparkles, ChevronDown, ArrowRight, Zap, Lock, Volume2, Fingerprint, Palette, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/GlassCard";
import landingPortal from "@/assets/images/landing-void-portal.png";
import heroAsianFemale from "@/assets/images/hero-asian-female.png";
import heroBlackMale from "@/assets/images/hero-black-male.png";
import heroHispanicFemale from "@/assets/images/hero-hispanic-female.png";
import heroWhiteMale from "@/assets/images/hero-white-male.png";

const heroImages = [heroAsianFemale, heroBlackMale, heroHispanicFemale, heroWhiteMale];

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
  const [heroIdx, setHeroIdx] = useState(0);
  const [visibleFeatures, setVisibleFeatures] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({ target: containerRef });
  const heroScale = useTransform(scrollYProgress, [0, 0.3], [1, 1.15]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.25], [1, 0]);
  const titleY = useTransform(scrollYProgress, [0, 0.2], [0, -60]);

  useEffect(() => {
    const interval = setInterval(() => {
      setHeroIdx((p) => (p + 1) % heroImages.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = parseInt(entry.target.getAttribute("data-feature-idx") || "0");
            setVisibleFeatures((p) => Math.max(p, idx + 1));
          }
        });
      },
      { threshold: 0.2 }
    );

    const items = featuresRef.current?.querySelectorAll("[data-feature-idx]");
    items?.forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, []);

  const handleEnter = useCallback(() => {
    navigate("/home");
  }, [navigate]);

  return (
    <div ref={containerRef} className="relative bg-black text-white overflow-x-hidden">
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <motion.div className="absolute inset-0" style={{ scale: heroScale }}>
          <img
            src={landingPortal}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/50 to-black" />
        </motion.div>

        <AnimatePresence mode="wait">
          <motion.div
            key={heroIdx}
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 0.15, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 1.5 }}
            className="absolute inset-0"
          >
            <img
              src={heroImages[heroIdx]}
              alt=""
              className="absolute inset-0 w-full h-full object-cover object-top"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/70 to-black" />
          </motion.div>
        </AnimatePresence>

        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.15, 0.25, 0.15],
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full"
            style={{ background: "radial-gradient(circle, rgba(6,182,212,0.3) 0%, transparent 70%)" }}
          />
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.1, 0.2, 0.1],
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full"
            style={{ background: "radial-gradient(circle, rgba(147,51,234,0.3) 0%, transparent 70%)" }}
          />
        </div>

        <motion.div
          style={{ y: titleY, opacity: heroOpacity }}
          className="relative z-10 flex flex-col items-center text-center px-6 max-w-4xl"
        >
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="mb-6"
          >
            <img
              src="/icon-192.png"
              alt="THE VOID"
              className="w-20 h-20 rounded-2xl shadow-2xl shadow-cyan-500/30 mx-auto mb-6"
              data-testid="img-landing-logo"
            />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.4 }}
            className="text-5xl sm:text-7xl md:text-8xl font-black tracking-[0.15em] font-display mb-4"
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
            className="text-lg sm:text-xl text-white/70 font-light max-w-xl leading-relaxed mb-3"
            data-testid="text-landing-tagline"
          >
            Scream into the abyss. The abyss talks back.
          </motion.p>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1.3 }}
            className="text-sm text-white/40 max-w-md leading-relaxed mb-2"
          >
            The first app built for venting, ranting, and letting it all out.
            AI listens, responds, and helps you process — on your terms.
          </motion.p>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1.5 }}
            className="text-[10px] text-white/25 tracking-[0.3em] uppercase mb-10"
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
              className="text-sm text-white/50"
              data-testid="button-how-it-works"
            >
              How it Works
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
            <a
              href="#features"
              className="text-sm text-white/50 flex items-center gap-1.5 transition-colors"
              data-testid="link-learn-more"
            >
              Learn more
              <ChevronDown className="w-4 h-4" />
            </a>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2, duration: 1 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <ChevronDown className="w-6 h-6 text-white/30" />
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

      <section id="features" className="relative py-20 px-6" ref={featuresRef}>
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                data-feature-idx={i}
                initial={{ opacity: 0, y: 30 }}
                animate={visibleFeatures > i ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: (i % 4) * 0.08, duration: 0.5 }}
              >
                <GlassCard className="p-5 h-full" hoverEffect>
                  <div className="flex items-start gap-4">
                    <div className={`flex-shrink-0 p-2.5 rounded-xl ${f.bg}`}>
                      <f.icon className={`w-5 h-5 ${f.color}`} />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white mb-1" data-testid={`text-feature-title-${i}`}>{f.title}</h3>
                      <p className="text-xs text-white/50 leading-relaxed">{f.desc}</p>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { title: "Nothing like it", items: ["Voice Venting", "Voice Fingerprint", "Mood Portraits", "Void Echo"], icon: Mic, highlight: true },
              { title: "Calm / Headspace", items: ["Guided Breathing", "Sleep Sounds", "Zen Zone", "Meditation Timer"], icon: Moon },
              { title: "Woebot / Therapy", items: ["5 AI Personalities", "Voice Conversations", "Safety Plans", "Crisis Toolkit"], icon: Brain },
              { title: "Daylio / Tracking", items: ["Mood Analytics", "Journal", "Streaks & Badges", "Daily Affirmations"], icon: BarChart3 },
            ].map((col, i) => (
              <motion.div
                key={col.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.5 }}
              >
                <GlassCard className={`p-6 h-full text-center ${(col as any).highlight ? "border-cyan-500/30" : ""}`}>
                  <div className={`inline-flex p-3 rounded-xl mb-4 ${(col as any).highlight ? "bg-cyan-500/10" : "bg-white/5"}`}>
                    <col.icon className={`w-6 h-6 ${(col as any).highlight ? "text-cyan-400" : "text-purple-400"}`} />
                  </div>
                  <p className="text-xs text-white/40 uppercase tracking-wider mb-1">{(col as any).highlight ? "Only in THE VOID" : "Replaces"}</p>
                  <h3 className="text-base font-bold text-white mb-4 font-display" data-testid={`text-replaces-${i}`}>{col.title}</h3>
                  <ul className="space-y-2">
                    {col.items.map((item) => (
                      <li key={item} className="flex items-center gap-2 text-xs text-white/60">
                        <Zap className="w-3 h-3 text-cyan-400 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </GlassCard>
              </motion.div>
            ))}
          </div>
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
        </motion.div>
      </section>
    </div>
  );
}
