import { useState, createContext, useContext } from "react";
import { Layout } from "@/components/ui/Layout";
import { GlassCard } from "@/components/ui/GlassCard";
import { Lock, Shield, KeyRound, Check } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiRequest } from "@/lib/queryClient";

interface PinContextType {
  userName: string | null;
  visitorId: number | null;
  logout: () => void;
}

const PinContext = createContext<PinContextType>({ userName: null, visitorId: null, logout: () => {} });

export function usePinAuth() {
  return useContext(PinContext);
}

export function PinGate({ children }: { children: React.ReactNode }) {
  const [authenticated, setAuthenticated] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const [needsPinChange, setNeedsPinChange] = useState(false);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [loading, setLoading] = useState(false);

  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [changePinError, setChangePinError] = useState("");
  const [changePinLoading, setChangePinLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length !== 4 || attempts >= 5) return;

    setLoading(true);
    setError("");

    try {
      const res = await apiRequest("POST", "/api/auth/pin", { pin });
      const data = await res.json();
      if (data.success) {
        if (!data.pinChanged && data.userId) {
          setUserName(data.name);
          setUserId(data.userId);
          setNeedsPinChange(true);
        } else {
          setAuthenticated(true);
          setUserName(data.name);
          if (data.userId) setUserId(data.userId);
        }
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

  const handleChangePin = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangePinError("");

    if (newPin.length !== 4) {
      setChangePinError("PIN must be 4 digits.");
      return;
    }
    if (newPin !== confirmPin) {
      setChangePinError("PINs don't match. Try again.");
      setConfirmPin("");
      return;
    }
    if (newPin === pin) {
      setChangePinError("New PIN must be different from your current one.");
      return;
    }

    setChangePinLoading(true);
    try {
      const res = await apiRequest("POST", "/api/auth/change-pin", { userId, currentPin: pin, newPin });
      const data = await res.json();
      if (data.success) {
        setAuthenticated(true);
        setNeedsPinChange(false);
      }
    } catch {
      setChangePinError("Something went wrong. Please try again.");
    } finally {
      setChangePinLoading(false);
    }
  };

  const logout = () => {
    setAuthenticated(false);
    setUserName(null);
    setUserId(null);
    setNeedsPinChange(false);
    setPin("");
    setNewPin("");
    setConfirmPin("");
    setError("");
    setChangePinError("");
    setAttempts(0);
  };

  if (authenticated) {
    return (
      <PinContext.Provider value={{ userName, visitorId: userId, logout }}>
        {children}
      </PinContext.Provider>
    );
  }

  if (needsPinChange) {
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
                  <KeyRound className="w-10 h-10 text-primary" />
                </div>
                <h1 className="text-2xl font-bold text-foreground font-display mb-1">
                  Welcome, {userName}
                </h1>
                <p className="text-xs text-muted-foreground">
                  Set your own personal PIN to continue
                </p>
              </div>

              <form onSubmit={handleChangePin} className="space-y-4">
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">New 4-digit PIN</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                    <Input
                      type="password"
                      inputMode="numeric"
                      maxLength={4}
                      placeholder="Enter new PIN"
                      value={newPin}
                      onChange={(e) => {
                        setNewPin(e.target.value.replace(/\D/g, ""));
                        setChangePinError("");
                      }}
                      className="text-center text-2xl tracking-[0.5em] font-mono bg-white/5 border-white/10 pl-10"
                      autoFocus
                      data-testid="input-new-pin"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Confirm PIN</label>
                  <div className="relative">
                    <Check className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                    <Input
                      type="password"
                      inputMode="numeric"
                      maxLength={4}
                      placeholder="Confirm new PIN"
                      value={confirmPin}
                      onChange={(e) => {
                        setConfirmPin(e.target.value.replace(/\D/g, ""));
                        setChangePinError("");
                      }}
                      className="text-center text-2xl tracking-[0.5em] font-mono bg-white/5 border-white/10 pl-10"
                      data-testid="input-confirm-pin"
                    />
                  </div>
                </div>

                {changePinError && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xs text-red-400 text-center"
                    data-testid="text-change-pin-error"
                  >
                    {changePinError}
                  </motion.p>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  disabled={newPin.length < 4 || confirmPin.length < 4 || changePinLoading}
                  data-testid="button-set-new-pin"
                >
                  {changePinLoading ? "Saving..." : "Set My PIN"}
                </Button>
              </form>

              <div className="mt-6 pt-4 border-t border-white/5">
                <p className="text-[10px] text-muted-foreground/40 text-center">
                  You'll use this PIN to log in from now on
                </p>
              </div>
            </GlassCard>
          </motion.div>
        </div>
      </Layout>
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
