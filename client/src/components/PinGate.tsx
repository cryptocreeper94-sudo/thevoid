import { useState, createContext, useContext } from "react";
import { Layout } from "@/components/ui/Layout";
import { GlassCard } from "@/components/ui/GlassCard";
import { Lock, Shield } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiRequest } from "@/lib/queryClient";

interface PinContextType {
  userName: string | null;
  logout: () => void;
}

const PinContext = createContext<PinContextType>({ userName: null, logout: () => {} });

export function usePinAuth() {
  return useContext(PinContext);
}

export function PinGate({ children }: { children: React.ReactNode }) {
  const [authenticated, setAuthenticated] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length !== 4 || attempts >= 5) return;

    setLoading(true);
    setError("");

    try {
      const res = await apiRequest("POST", "/api/auth/pin", { pin });
      const data = await res.json();
      if (data.success) {
        setAuthenticated(true);
        setUserName(data.name);
      }
    } catch {
      setAttempts((prev) => prev + 1);
      const remaining = 5 - attempts - 1;
      if (remaining <= 0) {
        setError("Too many attempts. Please try again later.");
      } else {
        setError(`Invalid PIN. ${remaining} attempt${remaining !== 1 ? "s" : ""} remaining.`);
      }
      setPin("");
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setAuthenticated(false);
    setUserName(null);
    setPin("");
    setError("");
    setAttempts(0);
  };

  if (authenticated) {
    return (
      <PinContext.Provider value={{ userName, logout }}>
        {children}
      </PinContext.Provider>
    );
  }

  return (
    <Layout>
      <div className="flex items-center justify-center min-h-[70vh] px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-sm"
        >
          <GlassCard className="p-8" hoverEffect>
            <div className="text-center mb-6">
              <div className="inline-flex p-4 rounded-2xl bg-primary/10 mb-4">
                <Shield className="w-10 h-10 text-primary" />
              </div>
              <h1 className="text-2xl font-bold text-foreground font-display mb-1">THE VOID</h1>
              <p className="text-xs text-muted-foreground">Enter your PIN to access</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                <Input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  placeholder="4-digit PIN"
                  value={pin}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "");
                    setPin(val);
                    setError("");
                  }}
                  className="text-center text-2xl tracking-[0.5em] font-mono bg-white/5 border-white/10 pl-10"
                  disabled={attempts >= 5 || loading}
                  autoFocus
                  data-testid="input-app-pin"
                />
              </div>

              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xs text-red-400 text-center"
                  data-testid="text-app-pin-error"
                >
                  {error}
                </motion.p>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={pin.length < 4 || attempts >= 5 || loading}
                data-testid="button-app-pin-submit"
              >
                {loading ? "Verifying..." : "Enter THE VOID"}
              </Button>
            </form>

            <div className="mt-6 pt-4 border-t border-white/5">
              <p className="text-[10px] text-muted-foreground/40 text-center">
                Protected by TrustShield.tech
              </p>
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </Layout>
  );
}
