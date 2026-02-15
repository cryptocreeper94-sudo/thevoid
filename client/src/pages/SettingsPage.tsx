import { useState } from "react";
import { Layout } from "@/components/ui/Layout";
import { GlassCard } from "@/components/ui/GlassCard";
import { Settings, Sparkles, Brain, Zap, Heart, Volume2, Type } from "lucide-react";
import { motion } from "framer-motion";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import smartassImg from "@/assets/images/personality-smartass.png";
import calmingImg from "@/assets/images/personality-calming.png";
import therapistImg from "@/assets/images/personality-therapist.png";
import hypemanImg from "@/assets/images/personality-hypeman.png";

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const personalities = [
  { id: "smart-ass", label: "Smart-ass", icon: Sparkles, color: "from-orange-500 to-red-500", desc: "Sarcastic & Witty", img: smartassImg },
  { id: "calming", label: "Calming", icon: Heart, color: "from-cyan-400 to-blue-500", desc: "Soothing & Gentle", img: calmingImg },
  { id: "therapist", label: "Therapist", icon: Brain, color: "from-emerald-400 to-green-600", desc: "Analytical & Deep", img: therapistImg },
  { id: "hype-man", label: "Hype Man", icon: Zap, color: "from-yellow-400 to-orange-500", desc: "High Energy!", img: hypemanImg },
];

function loadSettings() {
  try {
    const saved = localStorage.getItem("void-settings");
    if (saved) return JSON.parse(saved);
  } catch {}
  return {
    defaultPersonality: "smart-ass",
    responseLength: "medium",
    autoPlayResponse: false,
    hapticFeedback: true,
    showTranscript: true,
    fontSize: 16,
  };
}

export default function SettingsPage() {
  const [settings, setSettings] = useState(loadSettings);
  const { toast } = useToast();

  const update = (key: string, value: any) => {
    setSettings((prev: any) => ({ ...prev, [key]: value }));
  };

  const save = () => {
    localStorage.setItem("void-settings", JSON.stringify(settings));
    toast({ title: "Settings Saved", description: "Your preferences have been updated." });
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">

          <motion.div variants={fadeUp} className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium mb-4">
              <Settings className="w-3 h-3" />
              Preferences
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground font-display mb-2">Settings</h1>
            <p className="text-sm text-muted-foreground">Customize your experience in The Void</p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

            <div className="lg:col-span-5 space-y-6">
              <motion.div variants={fadeUp}>
                <GlassCard className="p-6" hoverEffect>
                  <div className="flex items-center gap-3 mb-5">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Sparkles className="w-5 h-5 text-primary" />
                    </div>
                    <h2 className="text-lg font-semibold text-foreground">Default Personality</h2>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {personalities.map((p) => {
                      const isSelected = settings.defaultPersonality === p.id;
                      const Icon = p.icon;
                      return (
                        <motion.button
                          key={p.id}
                          onClick={() => update("defaultPersonality", p.id)}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className={`relative rounded-2xl border text-left transition-all duration-300 overflow-hidden aspect-[3/4] ${
                            isSelected
                              ? "border-transparent shadow-lg ring-2 ring-primary/40"
                              : "border-white/5 hover:border-white/10"
                          }`}
                          data-testid={`button-personality-${p.id}`}
                        >
                          <img src={p.img} alt={p.label} className="absolute inset-0 w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                          {isSelected && (
                            <div className={`absolute inset-0 opacity-30 bg-gradient-to-br ${p.color}`} />
                          )}
                          <div className="absolute bottom-0 left-0 right-0 p-3 z-10">
                            <div className={`p-1.5 rounded-lg w-fit mb-2 transition-colors ${isSelected ? "bg-white/20 text-white" : "bg-white/10 text-white/70"}`}>
                              <Icon className="w-4 h-4" />
                            </div>
                            <h3 className={`text-sm font-semibold ${isSelected ? "text-white" : "text-white/90"}`}>{p.label}</h3>
                            <p className="text-[10px] text-white/50 mt-0.5">{p.desc}</p>
                          </div>
                          {isSelected && (
                            <motion.div
                              layoutId="settings-personality-indicator"
                              className="absolute top-2.5 right-2.5 w-2.5 h-2.5 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.9)]"
                            />
                          )}
                        </motion.button>
                      );
                    })}
                  </div>
                </GlassCard>
              </motion.div>
            </div>

            <div className="lg:col-span-7 space-y-6">
              <motion.div variants={fadeUp}>
                <GlassCard className="p-6" hoverEffect>
                  <div className="flex items-center gap-3 mb-5">
                    <div className="p-2 rounded-lg bg-white/5">
                      <Volume2 className="w-5 h-5 text-white/70" />
                    </div>
                    <h2 className="text-lg font-semibold text-foreground">Audio & Response</h2>
                  </div>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <Label className="text-sm text-foreground">Auto-play AI Response</Label>
                        <p className="text-xs text-muted-foreground mt-0.5">Speak the response aloud when ready</p>
                      </div>
                      <Switch
                        checked={settings.autoPlayResponse}
                        onCheckedChange={(v) => update("autoPlayResponse", v)}
                        data-testid="switch-autoplay"
                      />
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <Label className="text-sm text-foreground">Show Transcript</Label>
                        <p className="text-xs text-muted-foreground mt-0.5">Display what you said alongside the AI response</p>
                      </div>
                      <Switch
                        checked={settings.showTranscript}
                        onCheckedChange={(v) => update("showTranscript", v)}
                        data-testid="switch-transcript"
                      />
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <Label className="text-sm text-foreground">Haptic Feedback</Label>
                        <p className="text-xs text-muted-foreground mt-0.5">Vibrate on record start/stop (mobile)</p>
                      </div>
                      <Switch
                        checked={settings.hapticFeedback}
                        onCheckedChange={(v) => update("hapticFeedback", v)}
                        data-testid="switch-haptic"
                      />
                    </div>
                    <div>
                      <Label className="text-sm text-foreground mb-2 block">Response Length</Label>
                      <Select value={settings.responseLength} onValueChange={(v) => update("responseLength", v)}>
                        <SelectTrigger data-testid="select-response-length">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="short">Short &ndash; Quick & punchy</SelectItem>
                          <SelectItem value="medium">Medium &ndash; Balanced</SelectItem>
                          <SelectItem value="long">Long &ndash; Detailed response</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>

              <motion.div variants={fadeUp}>
                <GlassCard className="p-6" hoverEffect>
                  <div className="flex items-center gap-3 mb-5">
                    <div className="p-2 rounded-lg bg-white/5">
                      <Type className="w-5 h-5 text-white/70" />
                    </div>
                    <h2 className="text-lg font-semibold text-foreground">Display</h2>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label className="text-sm text-foreground">Response Font Size</Label>
                        <span className="text-xs text-muted-foreground">{settings.fontSize}px</span>
                      </div>
                      <Slider
                        value={[settings.fontSize]}
                        onValueChange={([v]) => update("fontSize", v)}
                        min={12}
                        max={24}
                        step={1}
                        data-testid="slider-font-size"
                      />
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            </div>
          </div>

          <motion.div variants={fadeUp} className="flex justify-center pt-4">
            <Button onClick={save} data-testid="button-save-settings">
              Save Preferences
            </Button>
          </motion.div>

        </motion.div>
      </div>
    </Layout>
  );
}
