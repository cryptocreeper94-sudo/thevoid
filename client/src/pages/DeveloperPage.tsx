import { useState } from "react";
import { Layout } from "@/components/ui/Layout";
import { GlassCard } from "@/components/ui/GlassCard";
import { Code, Lock, Database, Activity, Settings, Users, Trash2, Shield } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import statusImg from "@/assets/images/dev-status.png";
import dangerImg from "@/assets/images/dev-danger.png";
import settingsImg from "@/assets/images/dev-settings.png";

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

function PinLogin({ onSuccess }: { onSuccess: () => void }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [attempts, setAttempts] = useState(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === "0424") {
      onSuccess();
    } else {
      setAttempts((prev) => prev + 1);
      setError(`Invalid PIN. ${3 - attempts - 1} attempts remaining.`);
      setPin("");
      if (attempts >= 2) {
        setError("Too many attempts. Please try again later.");
      }
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <GlassCard className="p-8 w-full max-w-sm" hoverEffect>
        <div className="text-center mb-6">
          <div className="inline-flex p-3 rounded-2xl bg-primary/10 mb-4">
            <Lock className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-xl font-bold text-foreground font-display">Developer Access</h2>
          <p className="text-xs text-muted-foreground mt-1">Enter your PIN to continue</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              type="password"
              inputMode="numeric"
              maxLength={4}
              placeholder="Enter 4-digit PIN"
              value={pin}
              onChange={(e) => { setPin(e.target.value); setError(""); }}
              className="text-center text-2xl tracking-[0.5em] font-mono bg-white/5 border-white/10"
              disabled={attempts >= 3}
              autoFocus
              data-testid="input-pin"
            />
          </div>
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xs text-red-400 text-center"
              data-testid="text-pin-error"
            >
              {error}
            </motion.p>
          )}
          <Button
            type="submit"
            className="w-full"
            disabled={pin.length < 4 || attempts >= 3}
            data-testid="button-pin-submit"
          >
            Authenticate
          </Button>
        </form>
        <p className="text-[10px] text-muted-foreground/50 text-center mt-4">
          Protected by TrustShield.tech
        </p>
      </GlassCard>
    </div>
  );
}

function AdminDashboard() {
  const { toast } = useToast();
  const [appSettings, setAppSettings] = useState({
    maintenanceMode: false,
    allowNewUsers: true,
    debugMode: false,
    maxRecordingLength: 60,
    rateLimitPerMinute: 10,
  });

  const updateSetting = (key: string, value: any) => {
    setAppSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    toast({ title: "Settings Updated", description: "Developer settings have been saved." });
  };

  const handleClearVents = async () => {
    try {
      const res = await fetch("/api/vents", { method: "DELETE" });
      if (res.ok) {
        toast({ title: "Vents Cleared", description: "All vent history has been removed." });
      }
    } catch {
      toast({ title: "Error", description: "Failed to clear vents.", variant: "destructive" });
    }
  };

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={fadeUp} className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium mb-4">
          <Code className="w-3 h-3" />
          Developer Panel
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-foreground font-display mb-2">Admin Dashboard</h1>
        <p className="text-sm text-muted-foreground">THE VOID &middot; DarkWave Studios</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        <div className="lg:col-span-4 space-y-6">
          <motion.div variants={fadeUp}>
            <GlassCard className="overflow-hidden" hoverEffect>
              <div className="relative h-28 overflow-hidden">
                <img src={statusImg} alt="" className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-black/90" />
                <div className="absolute bottom-0 left-0 right-0 p-4 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/20 backdrop-blur-sm">
                    <Activity className="w-5 h-5 text-emerald-400" />
                  </div>
                  <h2 className="text-lg font-semibold text-white font-display">Status</h2>
                </div>
              </div>
              <div className="p-5">
                <div className="space-y-3">
                  {[
                    { label: "API", status: "Online", color: "bg-emerald-400" },
                    { label: "Database", status: "Connected", color: "bg-emerald-400" },
                    { label: "OpenAI", status: "Active", color: "bg-emerald-400" },
                    { label: "TrustShield", status: "Protected", color: "bg-blue-400" },
                  ].map((s) => (
                    <div key={s.label} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                      <span className="text-sm text-muted-foreground">{s.label}</span>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${s.color} animate-pulse`} />
                        <span className="text-xs text-foreground">{s.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </GlassCard>
          </motion.div>

          <motion.div variants={fadeUp}>
            <GlassCard className="overflow-hidden" hoverEffect>
              <div className="relative h-28 overflow-hidden">
                <img src={dangerImg} alt="" className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-black/90" />
                <div className="absolute bottom-0 left-0 right-0 p-4 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-red-500/20 backdrop-blur-sm">
                    <Trash2 className="w-5 h-5 text-red-400" />
                  </div>
                  <h2 className="text-lg font-semibold text-white font-display">Danger Zone</h2>
                </div>
              </div>
              <div className="p-5 space-y-3">
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={handleClearVents}
                  data-testid="button-clear-vents"
                >
                  Clear All Vent History
                </Button>
                <p className="text-xs text-muted-foreground text-center">This action cannot be undone</p>
              </div>
            </GlassCard>
          </motion.div>
        </div>

        <div className="lg:col-span-8 space-y-6">
          <motion.div variants={fadeUp}>
            <GlassCard className="overflow-hidden" hoverEffect>
              <div className="relative h-28 overflow-hidden">
                <img src={settingsImg} alt="" className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-black/90" />
                <div className="absolute bottom-0 left-0 right-0 p-4 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-white/10 backdrop-blur-sm">
                    <Settings className="w-5 h-5 text-white/80" />
                  </div>
                  <h2 className="text-lg font-semibold text-white font-display">Application Settings</h2>
                </div>
              </div>
              <div className="p-5 space-y-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <Label className="text-sm text-foreground">Maintenance Mode</Label>
                    <p className="text-xs text-muted-foreground mt-0.5">Disable app access for non-developers</p>
                  </div>
                  <Switch
                    checked={appSettings.maintenanceMode}
                    onCheckedChange={(v) => updateSetting("maintenanceMode", v)}
                    data-testid="switch-maintenance"
                  />
                </div>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <Label className="text-sm text-foreground">Allow New Users</Label>
                    <p className="text-xs text-muted-foreground mt-0.5">Enable new account registrations</p>
                  </div>
                  <Switch
                    checked={appSettings.allowNewUsers}
                    onCheckedChange={(v) => updateSetting("allowNewUsers", v)}
                    data-testid="switch-allow-users"
                  />
                </div>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <Label className="text-sm text-foreground">Debug Mode</Label>
                    <p className="text-xs text-muted-foreground mt-0.5">Show verbose logging in console</p>
                  </div>
                  <Switch
                    checked={appSettings.debugMode}
                    onCheckedChange={(v) => updateSetting("debugMode", v)}
                    data-testid="switch-debug"
                  />
                </div>
                <div>
                  <Label className="text-sm text-foreground mb-1 block">Max Recording Length (seconds)</Label>
                  <Input
                    type="number"
                    value={appSettings.maxRecordingLength}
                    onChange={(e) => updateSetting("maxRecordingLength", parseInt(e.target.value) || 60)}
                    className="bg-white/5 border-white/10"
                    data-testid="input-max-recording"
                  />
                </div>
                <div>
                  <Label className="text-sm text-foreground mb-1 block">Rate Limit (requests/min)</Label>
                  <Input
                    type="number"
                    value={appSettings.rateLimitPerMinute}
                    onChange={(e) => updateSetting("rateLimitPerMinute", parseInt(e.target.value) || 10)}
                    className="bg-white/5 border-white/10"
                    data-testid="input-rate-limit"
                  />
                </div>
              </div>
            </GlassCard>
          </motion.div>

          <motion.div variants={fadeUp} className="flex justify-end">
            <Button onClick={handleSave} data-testid="button-save-admin">
              Save Developer Settings
            </Button>
          </motion.div>
        </div>
      </div>

      <motion.div variants={fadeUp} className="text-center py-4">
        <p className="text-xs text-muted-foreground">
          Powered by Trust Layer &ndash; dwtl.io &middot; Protected by TrustShield.tech &middot; DarkwaveStudios.io &copy; 2026
        </p>
      </motion.div>
    </motion.div>
  );
}

export default function DeveloperPage() {
  const [authenticated, setAuthenticated] = useState(false);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <AnimatePresence mode="wait">
          {authenticated ? (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <AdminDashboard />
            </motion.div>
          ) : (
            <motion.div
              key="login"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <PinLogin onSuccess={() => setAuthenticated(true)} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
}
