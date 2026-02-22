import { useState, useEffect, useCallback } from "react";
import { Layout } from "@/components/ui/Layout";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { useMeta } from "@/hooks/use-meta";
import { GlassCard } from "@/components/ui/GlassCard";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Eye,
  Hand,
  Ear,
  Wind,
  Droplet,
  Phone,
  MessageSquare,
  Shield,
  Heart,
  AlertTriangle,
  Users,
  Sparkles,
  Plus,
  Trash2,
  Save,
  ChevronRight,
} from "lucide-react";
import crisisImg from "@/assets/images/crisis-lighthouse.webp";

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const GROUNDING_STEPS = [
  { count: 5, label: "things you can SEE", icon: Eye, color: "#06b6d4" },
  { count: 4, label: "things you can TOUCH", icon: Hand, color: "#8b5cf6" },
  { count: 3, label: "things you can HEAR", icon: Ear, color: "#f97316" },
  { count: 2, label: "things you can SMELL", icon: Wind, color: "#ec4899" },
  { count: 1, label: "thing you can TASTE", icon: Droplet, color: "#22c55e" },
];

const HOTLINES = [
  { name: "988 Suicide & Crisis Lifeline", number: "988", desc: "Call or text 24/7", icon: Phone, color: "#06b6d4" },
  { name: "Crisis Text Line", number: "741741", desc: "Text HOME to 741741", icon: MessageSquare, color: "#8b5cf6", isText: true },
  { name: "SAMHSA Helpline", number: "1-800-662-4357", desc: "Free referral & support", icon: Shield, color: "#22c55e" },
  { name: "Emergency", number: "911", desc: "Immediate danger", icon: AlertTriangle, color: "#ef4444" },
];

interface SafetyPlanData {
  warningSignals: string[];
  copingStrategies: string[];
  supportContacts: { name: string; phone: string }[];
  reasonsToLive: string[];
}

const emptySafetyPlan: SafetyPlanData = {
  warningSignals: [],
  copingStrategies: [],
  supportContacts: [],
  reasonsToLive: [],
};

function getUserId() {
  return parseInt(localStorage.getItem("void-user-id") || "0");
}

function BreathingCircle() {
  const [phase, setPhase] = useState<"in" | "hold" | "out" | "rest">("in");
  const [seconds, setSeconds] = useState(4);

  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          setPhase((p) => {
            if (p === "in") return "hold";
            if (p === "hold") return "out";
            if (p === "out") return "rest";
            return "in";
          });
          return 4;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const phaseLabel = phase === "in" ? "Breathe In" : phase === "hold" ? "Hold" : phase === "out" ? "Breathe Out" : "Rest";
  const scale = phase === "in" || phase === "hold" ? 1.3 : 0.8;
  const glowColor = phase === "in" ? "#06b6d4" : phase === "hold" ? "#8b5cf6" : phase === "out" ? "#f97316" : "#a3a3a3";

  return (
    <div className="flex flex-col items-center space-y-4">
      <p className="text-xs text-muted-foreground uppercase tracking-wider">Breathe with me</p>
      <div className="relative flex items-center justify-center" style={{ width: 180, height: 180 }}>
        <motion.div
          className="absolute rounded-full"
          style={{
            width: 140,
            height: 140,
            background: `radial-gradient(circle, ${glowColor}30, transparent)`,
            border: `2px solid ${glowColor}40`,
          }}
          animate={{ scale }}
          transition={{ duration: 4, ease: "easeInOut" }}
        />
        <div className="relative z-10 text-center space-y-1">
          <p className="text-lg font-bold font-display" style={{ color: glowColor }} data-testid="text-breath-phase">
            {phaseLabel}
          </p>
          <p className="text-3xl font-bold text-foreground font-display" data-testid="text-breath-seconds">{seconds}</p>
        </div>
      </div>
    </div>
  );
}

function GroundingExercise() {
  const [step, setStep] = useState(0);
  const [completed, setCompleted] = useState(false);

  const current = GROUNDING_STEPS[step];
  const Icon = current?.icon;

  const handleGotIt = useCallback(() => {
    if (step < GROUNDING_STEPS.length - 1) {
      setStep((s) => s + 1);
    } else {
      setCompleted(true);
    }
  }, [step]);

  const handleReset = useCallback(() => {
    setStep(0);
    setCompleted(false);
  }, []);

  return (
    <div className="flex flex-col items-center space-y-4">
      <AnimatePresence mode="wait">
        {completed ? (
          <motion.div
            key="done"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="text-center space-y-3"
          >
            <p className="text-sm font-semibold text-foreground">You did it. You're grounded.</p>
            <p className="text-xs text-muted-foreground">Take a moment. You're here. You're safe.</p>
            <Button variant="ghost" size="sm" onClick={handleReset} data-testid="button-grounding-reset">
              Start Over
            </Button>
          </motion.div>
        ) : (
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="text-center space-y-4"
          >
            <div className="p-3 rounded-xl mx-auto w-fit" style={{ backgroundColor: `${current.color}20` }}>
              {Icon && <Icon className="w-6 h-6" style={{ color: current.color }} />}
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground font-display" data-testid="text-grounding-count">{current.count}</p>
              <p className="text-sm text-muted-foreground">{current.label}</p>
            </div>
            <Button onClick={handleGotIt} size="sm" data-testid={`button-grounding-gotit-${step}`}>
              <ChevronRight className="w-4 h-4 mr-1" /> Got it
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="flex items-center gap-1.5 mt-2">
        {GROUNDING_STEPS.map((_, i) => (
          <div
            key={i}
            className={`rounded-full transition-all ${
              i < step || completed
                ? "w-2.5 h-2.5 bg-primary shadow-[0_0_8px_rgba(34,211,238,0.5)]"
                : i === step && !completed
                  ? "w-3 h-3 bg-primary"
                  : "w-2 h-2 bg-white/20"
            }`}
            data-testid={`dot-grounding-${i}`}
          />
        ))}
      </div>
    </div>
  );
}

function SafetyPlanCard() {
  const userId = getUserId();
  const { toast } = useToast();
  const [plan, setPlan] = useState<SafetyPlanData>(emptySafetyPlan);
  const [newSignal, setNewSignal] = useState("");
  const [newStrategy, setNewStrategy] = useState("");
  const [newContactName, setNewContactName] = useState("");
  const [newContactPhone, setNewContactPhone] = useState("");
  const [newReason, setNewReason] = useState("");

  const { data, isLoading } = useQuery<{ warningSignals: string[]; copingStrategies: string[]; supportContacts: { name: string; phone: string }[]; reasonsToLive: string[] } | null>({
    queryKey: ["/api/safety-plan", `?userId=${userId}`],
    enabled: userId > 0,
  });

  useEffect(() => {
    if (data) {
      setPlan({
        warningSignals: (data.warningSignals as string[]) || [],
        copingStrategies: (data.copingStrategies as string[]) || [],
        supportContacts: (data.supportContacts as { name: string; phone: string }[]) || [],
        reasonsToLive: (data.reasonsToLive as string[]) || [],
      });
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: async (planData: SafetyPlanData) => {
      await apiRequest("POST", "/api/safety-plan", { userId, ...planData });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/safety-plan"] });
      toast({ title: "Safety plan saved", description: "Your safety plan has been updated." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save safety plan.", variant: "destructive" });
    },
  });

  const addItem = (key: keyof SafetyPlanData, value: string | { name: string; phone: string }) => {
    setPlan((prev) => ({
      ...prev,
      [key]: [...(prev[key] as any[]), value],
    }));
  };

  const removeItem = (key: keyof SafetyPlanData, index: number) => {
    setPlan((prev) => ({
      ...prev,
      [key]: (prev[key] as any[]).filter((_, i) => i !== index),
    }));
  };

  if (userId === 0) {
    return (
      <div className="p-6 text-center">
        <p className="text-sm text-muted-foreground">Sign in to create and save your safety plan.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4 p-6">
        <div className="h-6 w-40 bg-white/5 rounded" />
        <div className="h-4 w-full bg-white/5 rounded" />
        <div className="h-4 w-3/4 bg-white/5 rounded" />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Accordion type="multiple" className="space-y-2">
        <AccordionItem value="warnings" className="border border-white/10 rounded-xl overflow-visible bg-white/[0.03] backdrop-blur-xl">
          <AccordionTrigger className="px-4 sm:px-6 py-4 text-white font-semibold" data-testid="accordion-warnings">
            <span className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              Warning Signals
            </span>
          </AccordionTrigger>
          <AccordionContent className="px-4 sm:px-6 pb-4">
            <p className="text-xs text-muted-foreground mb-3">What triggers a crisis for you?</p>
            <div className="space-y-2">
              {plan.warningSignals.map((signal, i) => (
                <div key={i} className="flex items-center gap-2 justify-between">
                  <span className="text-sm text-white/80" data-testid={`text-signal-${i}`}>{signal}</span>
                  <Button variant="ghost" size="icon" onClick={() => removeItem("warningSignals", i)} data-testid={`button-remove-signal-${i}`}>
                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                  </Button>
                </div>
              ))}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newSignal}
                  onChange={(e) => setNewSignal(e.target.value)}
                  placeholder="Add a warning signal..."
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-primary/50"
                  data-testid="input-new-signal"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newSignal.trim()) {
                      addItem("warningSignals", newSignal.trim());
                      setNewSignal("");
                    }
                  }}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => { if (newSignal.trim()) { addItem("warningSignals", newSignal.trim()); setNewSignal(""); } }}
                  data-testid="button-add-signal"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="coping" className="border border-white/10 rounded-xl overflow-visible bg-white/[0.03] backdrop-blur-xl">
          <AccordionTrigger className="px-4 sm:px-6 py-4 text-white font-semibold" data-testid="accordion-coping">
            <span className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-pink-400" />
              Coping Strategies
            </span>
          </AccordionTrigger>
          <AccordionContent className="px-4 sm:px-6 pb-4">
            <p className="text-xs text-muted-foreground mb-3">What helps you feel better?</p>
            <div className="space-y-2">
              {plan.copingStrategies.map((strategy, i) => (
                <div key={i} className="flex items-center gap-2 justify-between">
                  <span className="text-sm text-white/80" data-testid={`text-strategy-${i}`}>{strategy}</span>
                  <Button variant="ghost" size="icon" onClick={() => removeItem("copingStrategies", i)} data-testid={`button-remove-strategy-${i}`}>
                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                  </Button>
                </div>
              ))}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newStrategy}
                  onChange={(e) => setNewStrategy(e.target.value)}
                  placeholder="Add a coping strategy..."
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-primary/50"
                  data-testid="input-new-strategy"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newStrategy.trim()) {
                      addItem("copingStrategies", newStrategy.trim());
                      setNewStrategy("");
                    }
                  }}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => { if (newStrategy.trim()) { addItem("copingStrategies", newStrategy.trim()); setNewStrategy(""); } }}
                  data-testid="button-add-strategy"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="contacts" className="border border-white/10 rounded-xl overflow-visible bg-white/[0.03] backdrop-blur-xl">
          <AccordionTrigger className="px-4 sm:px-6 py-4 text-white font-semibold" data-testid="accordion-contacts">
            <span className="flex items-center gap-2">
              <Users className="w-4 h-4 text-cyan-400" />
              Support Contacts
            </span>
          </AccordionTrigger>
          <AccordionContent className="px-4 sm:px-6 pb-4">
            <p className="text-xs text-muted-foreground mb-3">People you can reach out to.</p>
            <div className="space-y-2">
              {plan.supportContacts.map((contact, i) => (
                <div key={i} className="flex items-center gap-2 justify-between">
                  <div>
                    <span className="text-sm text-white/80" data-testid={`text-contact-name-${i}`}>{contact.name}</span>
                    <span className="text-xs text-muted-foreground ml-2" data-testid={`text-contact-phone-${i}`}>{contact.phone}</span>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => removeItem("supportContacts", i)} data-testid={`button-remove-contact-${i}`}>
                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                  </Button>
                </div>
              ))}
              <div className="flex items-center gap-2 flex-wrap">
                <input
                  type="text"
                  value={newContactName}
                  onChange={(e) => setNewContactName(e.target.value)}
                  placeholder="Name"
                  className="flex-1 min-w-[100px] bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-primary/50"
                  data-testid="input-contact-name"
                />
                <input
                  type="text"
                  value={newContactPhone}
                  onChange={(e) => setNewContactPhone(e.target.value)}
                  placeholder="Phone"
                  className="flex-1 min-w-[100px] bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-primary/50"
                  data-testid="input-contact-phone"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    if (newContactName.trim() && newContactPhone.trim()) {
                      addItem("supportContacts", { name: newContactName.trim(), phone: newContactPhone.trim() });
                      setNewContactName("");
                      setNewContactPhone("");
                    }
                  }}
                  data-testid="button-add-contact"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="reasons" className="border border-white/10 rounded-xl overflow-visible bg-white/[0.03] backdrop-blur-xl">
          <AccordionTrigger className="px-4 sm:px-6 py-4 text-white font-semibold" data-testid="accordion-reasons">
            <span className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              Reasons to Keep Going
            </span>
          </AccordionTrigger>
          <AccordionContent className="px-4 sm:px-6 pb-4">
            <p className="text-xs text-muted-foreground mb-3">What matters to you. What keeps you here.</p>
            <div className="space-y-2">
              {plan.reasonsToLive.map((reason, i) => (
                <div key={i} className="flex items-center gap-2 justify-between">
                  <span className="text-sm text-white/80" data-testid={`text-reason-${i}`}>{reason}</span>
                  <Button variant="ghost" size="icon" onClick={() => removeItem("reasonsToLive", i)} data-testid={`button-remove-reason-${i}`}>
                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                  </Button>
                </div>
              ))}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newReason}
                  onChange={(e) => setNewReason(e.target.value)}
                  placeholder="Add a reason..."
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-primary/50"
                  data-testid="input-new-reason"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newReason.trim()) {
                      addItem("reasonsToLive", newReason.trim());
                      setNewReason("");
                    }
                  }}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => { if (newReason.trim()) { addItem("reasonsToLive", newReason.trim()); setNewReason(""); } }}
                  data-testid="button-add-reason"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <div className="pt-4 flex justify-end">
        <Button
          onClick={() => saveMutation.mutate(plan)}
          disabled={saveMutation.isPending}
          data-testid="button-save-safety-plan"
        >
          <Save className="w-4 h-4 mr-2" />
          {saveMutation.isPending ? "Saving..." : "Save Safety Plan"}
        </Button>
      </div>
    </div>
  );
}

export default function CrisisToolkitPage() {
  useDocumentTitle("Crisis Toolkit — THE VOID");
  useMeta({
    description: "Crisis tools, grounding exercises, breathing techniques, hotlines, and your personal safety plan. You are not alone.",
    ogTitle: "Crisis Toolkit — THE VOID",
    ogDescription: "Tools to ground you when the world spins. Breathing, grounding, hotlines, and safety planning.",
    canonicalPath: "/crisis",
  });

  return (
    <Layout>
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6"
      >
        {/* Card 1: Hero */}
        <motion.div variants={fadeUp} className="col-span-full">
          <GlassCard className="overflow-hidden p-0">
            <div className="relative h-48 sm:h-56 overflow-hidden">
              <img src={crisisImg} alt="" className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/50 to-black/90" />
              <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 mb-3">
                  <Shield className="w-3.5 h-3.5 text-primary" />
                  <span className="text-xs font-medium text-muted-foreground tracking-wide uppercase">Crisis Support</span>
                </div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white font-display mb-2" data-testid="text-crisis-title">
                  Crisis Toolkit
                </h1>
                <p className="text-sm sm:text-base text-white/60 max-w-lg">
                  Tools to ground you when the world spins
                </p>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Cards 2-4: Bento row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 md:gap-6">
          {/* Card 2: Quick Panic Button */}
          <motion.div variants={fadeUp} className="lg:col-span-4">
            <GlassCard className="h-full" hoverEffect>
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-lg bg-cyan-500/20">
                  <Wind className="w-4 h-4 text-cyan-400" />
                </div>
                <h3 className="text-sm font-semibold text-white">Quick Calm</h3>
              </div>
              <BreathingCircle />
            </GlassCard>
          </motion.div>

          {/* Card 3: Grounding Exercise */}
          <motion.div variants={fadeUp} className="lg:col-span-4">
            <GlassCard className="h-full" hoverEffect>
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-lg bg-purple-500/20">
                  <Eye className="w-4 h-4 text-purple-400" />
                </div>
                <h3 className="text-sm font-semibold text-white">5-4-3-2-1 Grounding</h3>
              </div>
              <GroundingExercise />
            </GlassCard>
          </motion.div>

          {/* Card 4: Crisis Hotlines */}
          <motion.div variants={fadeUp} className="lg:col-span-4">
            <GlassCard className="h-full">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-lg bg-red-500/20">
                  <Phone className="w-4 h-4 text-red-400" />
                </div>
                <h3 className="text-sm font-semibold text-white">Crisis Hotlines</h3>
              </div>
              <div className="space-y-3">
                {HOTLINES.map((hotline, i) => {
                  const HIcon = hotline.icon;
                  const tel = hotline.isText ? undefined : `tel:${hotline.number.replace(/-/g, "")}`;
                  return (
                    <a
                      key={i}
                      href={tel || "#"}
                      className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5 transition-all hover:border-white/15"
                      data-testid={`link-hotline-${i}`}
                    >
                      <div className="p-2 rounded-lg shrink-0" style={{ backgroundColor: `${hotline.color}20` }}>
                        <HIcon className="w-4 h-4" style={{ color: hotline.color }} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white truncate">{hotline.name}</p>
                        <p className="text-xs text-muted-foreground">{hotline.desc}</p>
                      </div>
                      <span className="ml-auto text-sm font-bold text-foreground shrink-0" data-testid={`text-hotline-number-${i}`}>
                        {hotline.number}
                      </span>
                    </a>
                  );
                })}
              </div>
            </GlassCard>
          </motion.div>
        </div>

        {/* Card 5: Safety Plan */}
        <motion.div variants={fadeUp}>
          <GlassCard>
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-lg bg-green-500/20">
                <Shield className="w-4 h-4 text-green-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Safety Plan</h3>
                <p className="text-xs text-muted-foreground">Your personal crisis roadmap, saved securely.</p>
              </div>
            </div>
            <SafetyPlanCard />
          </GlassCard>
        </motion.div>
      </motion.div>
    </Layout>
  );
}
