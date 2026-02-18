import { Layout } from "@/components/ui/Layout";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { useMeta } from "@/hooks/use-meta";
import { GlassCard } from "@/components/ui/GlassCard";
import { motion } from "framer-motion";
import { Zap, Shield, Heart, Users, Globe, Sparkles } from "lucide-react";
import originImg from "@/assets/images/mission-origin.png";
import promiseImg from "@/assets/images/mission-promise.png";

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const values = [
  { icon: Shield, title: "Safe Space", desc: "Your words stay yours. We built THE VOID as a judgment-free sanctuary where raw emotion is welcomed, not silenced." },
  { icon: Heart, title: "Human First", desc: "Technology should amplify humanity, not replace it. Our AI listens so you feel heard, then gently guides you forward." },
  { icon: Zap, title: "Catharsis on Demand", desc: "Sometimes you just need to scream into the void. We made that literal — and made sure the void talks back." },
  { icon: Users, title: "Community", desc: "From Signal Chat to the Trust Layer ecosystem, you're never alone. Connection is the antidote to isolation." },
  { icon: Globe, title: "Accessible", desc: "Mental wellness shouldn't be gated. Our free tier ensures everyone can access the relief they need, when they need it." },
  { icon: Sparkles, title: "Evolving", desc: "We ship fast, listen harder, and iterate relentlessly. THE VOID grows with its community." },
];

export default function MissionPage() {
  useDocumentTitle("From the Void — Our Mission");
  useMeta({ description: "THE VOID by DarkWave Studios — a voice-first venting platform built for catharsis, connection, and emotional wellness.", ogTitle: "From the Void — Our Mission", ogDescription: "We built a place to scream. Learn about the mission behind THE VOID.", canonicalPath: "/mission" });

  return (
    <Layout>
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        className="max-w-5xl mx-auto px-4 py-8 space-y-8"
      >
        <motion.div variants={fadeUp} className="text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 mb-4">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-medium text-muted-foreground tracking-wide uppercase">From the Void</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-foreground font-display mb-3" data-testid="text-mission-title">
            We Built a Place to Scream
          </h1>
          <p className="text-sm md:text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            THE VOID was born from a simple truth: sometimes you need to let it all out before you can move forward.
          </p>
        </motion.div>

        <motion.div variants={fadeUp}>
          <GlassCard className="overflow-hidden" hoverEffect>
            <div className="relative h-32 overflow-hidden">
              <img src={originImg} alt="" className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-black/90" />
              <div className="absolute bottom-0 left-0 right-0 p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/20 backdrop-blur-sm">
                  <Zap className="w-5 h-5 text-purple-400" />
                </div>
                <h3 className="text-sm font-semibold text-white">The Origin Story</h3>
              </div>
            </div>
            <div className="p-6 md:p-8 space-y-4">
              <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
                <p>
                  DarkWave Studios started with a question: <span className="text-foreground font-medium">What if there was a place where you could say anything — no filter, no judgment, no consequences?</span>
                </p>
                <p>
                  We've all been there. The frustration that builds until it boils over. The rant you type out in Notes but never send. The scream you hold in because the world expects composure. We decided to build the antidote.
                </p>
                <p>
                  THE VOID is voice-first because emotions live in tone, not text. Our five AI personalities don't just listen — they respond in the way you need. Need someone to match your energy? Hype Man. Need perspective? Therapist. Need to laugh at the absurdity? Roast Master has you covered.
                </p>
                <p>
                  But this isn't just an app. It's the first node in the <span className="text-foreground font-medium">DarkWave ecosystem</span> — a network of tools built on the Trust Layer, designed to make the digital world feel a little more human.
                </p>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        <motion.div variants={fadeUp}>
          <h2 className="text-lg font-bold text-foreground font-display mb-4 text-center">What We Stand For</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {values.map((v, i) => (
              <motion.div key={v.title} variants={fadeUp} custom={i}>
                <GlassCard className="h-full overflow-hidden" hoverEffect>
                  <div className="p-5 space-y-3">
                    <div className="p-2 rounded-lg bg-primary/10 w-fit">
                      <v.icon className="w-4 h-4 text-primary" />
                    </div>
                    <h3 className="text-sm font-semibold text-foreground">{v.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{v.desc}</p>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div variants={fadeUp}>
          <GlassCard className="overflow-hidden">
            <div className="relative h-32 overflow-hidden">
              <img src={promiseImg} alt="" className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-black/90" />
              <div className="absolute bottom-0 left-0 right-0 p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-cyan-500/20 backdrop-blur-sm">
                  <Shield className="w-5 h-5 text-cyan-400" />
                </div>
                <h3 className="text-sm font-semibold text-white">The DarkWave Promise</h3>
              </div>
            </div>
            <div className="p-6 md:p-8 text-center space-y-4">
              <p className="text-sm text-muted-foreground max-w-xl mx-auto leading-relaxed">
                We will never sell your data. We will never weaponize your emotions. We will never stop building tools that put people first. THE VOID is just the beginning.
              </p>
              <div className="flex items-center justify-center gap-3 pt-2">
                <div className="h-px w-12 bg-white/10" />
                <span className="text-xs text-muted-foreground font-display tracking-widest uppercase">DarkWave Studios</span>
                <div className="h-px w-12 bg-white/10" />
              </div>
              <p className="text-[10px] text-muted-foreground/60">
                Est. 2026 &middot; Built for humans, powered by AI
              </p>
            </div>
          </GlassCard>
        </motion.div>
      </motion.div>
    </Layout>
  );
}
