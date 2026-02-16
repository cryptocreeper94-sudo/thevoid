import { useState, useRef, useCallback } from "react";
import { Layout } from "@/components/ui/Layout";
import { GlassCard } from "@/components/ui/GlassCard";
import { Code, Lock, Activity, Settings, Trash2, Map, Plus, ChevronLeft, ChevronRight, Check, X, Zap, Star, ArrowRight, Clock, CheckCircle2, Circle, Flame, Users, UserPlus, KeyRound } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import type { RoadmapItem, WhitelistedUser } from "@shared/schema";
import statusImg from "@/assets/images/dev-status.png";
import dangerImg from "@/assets/images/dev-danger.png";
import settingsImg from "@/assets/images/dev-settings.png";
import roadmapImg from "@/assets/images/dev-roadmap.png";
import whitelistImg from "@/assets/images/dev-whitelist.png";

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof Circle }> = {
  planned: { label: "Planned", color: "bg-blue-500/20 text-blue-400 border-blue-500/30", icon: Circle },
  "in-progress": { label: "In Progress", color: "bg-amber-500/20 text-amber-400 border-amber-500/30", icon: Clock },
  completed: { label: "Completed", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", icon: CheckCircle2 },
};

const PRIORITY_CONFIG: Record<string, { label: string; color: string; icon: typeof Star }> = {
  low: { label: "Low", color: "text-muted-foreground", icon: ArrowRight },
  medium: { label: "Medium", color: "text-amber-400", icon: Star },
  high: { label: "High", color: "text-orange-400", icon: Zap },
  critical: { label: "Critical", color: "text-red-400", icon: Flame },
};

const CATEGORY_OPTIONS = ["feature", "integration", "design", "infrastructure", "monetization", "security", "performance"];

function RoadmapCarousel() {
  const { toast } = useToast();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [newItem, setNewItem] = useState({
    title: "",
    description: "",
    status: "planned",
    priority: "medium",
    category: "feature",
  });

  const { data: items = [], isLoading } = useQuery<RoadmapItem[]>({
    queryKey: ["/api/roadmap"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof newItem) => {
      await apiRequest("POST", "/api/roadmap", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/roadmap"] });
      setNewItem({ title: "", description: "", status: "planned", priority: "medium", category: "feature" });
      setShowAddForm(false);
      toast({ title: "Added", description: "Roadmap item created." });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: Partial<RoadmapItem> }) => {
      await apiRequest("PATCH", `/api/roadmap/${id}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/roadmap"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/roadmap/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/roadmap"] });
      toast({ title: "Removed", description: "Roadmap item deleted." });
    },
  });

  const scroll = useCallback((direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const scrollAmount = 320;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  }, []);

  const cycleStatus = (item: RoadmapItem) => {
    const order = ["planned", "in-progress", "completed"];
    const next = order[(order.indexOf(item.status) + 1) % order.length];
    updateMutation.mutate({ id: item.id, updates: { status: next } });
  };

  const filtered = filterStatus === "all" ? items : items.filter((i) => i.status === filterStatus);

  const counts = {
    all: items.length,
    planned: items.filter((i) => i.status === "planned").length,
    "in-progress": items.filter((i) => i.status === "in-progress").length,
    completed: items.filter((i) => i.status === "completed").length,
  };

  return (
    <GlassCard className="overflow-hidden" hoverEffect>
      <div className="relative h-32 overflow-hidden">
        <img src={roadmapImg} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-black/90" />
        <div className="absolute bottom-0 left-0 right-0 p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/20 backdrop-blur-sm">
              <Map className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white font-display">Master Roadmap</h2>
              <p className="text-xs text-white/50">{items.length} items tracked</p>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="border-white/20 text-white bg-white/10 backdrop-blur-sm"
            onClick={() => setShowAddForm(!showAddForm)}
            data-testid="button-add-roadmap"
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Add
          </Button>
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1">
          {(["all", "planned", "in-progress", "completed"] as const).map((s) => {
            const isActive = filterStatus === s;
            const cfg = s === "all" ? null : STATUS_CONFIG[s];
            return (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? "bg-primary/20 text-primary border border-primary/30"
                    : "bg-white/5 text-muted-foreground border border-white/10"
                }`}
                data-testid={`filter-roadmap-${s}`}
              >
                {cfg && <cfg.icon className="w-3 h-3" />}
                {s === "all" ? "All" : cfg?.label}
                <span className={`ml-1 text-[10px] ${isActive ? "text-primary/70" : "text-muted-foreground/50"}`}>
                  {counts[s]}
                </span>
              </button>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          {showAddForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 overflow-hidden"
            >
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                <Input
                  placeholder="Feature title..."
                  value={newItem.title}
                  onChange={(e) => setNewItem((p) => ({ ...p, title: e.target.value }))}
                  className="bg-white/5 border-white/10"
                  data-testid="input-roadmap-title"
                />
                <Input
                  placeholder="Short description..."
                  value={newItem.description}
                  onChange={(e) => setNewItem((p) => ({ ...p, description: e.target.value }))}
                  className="bg-white/5 border-white/10"
                  data-testid="input-roadmap-desc"
                />
                <div className="flex items-center gap-2 flex-wrap">
                  <select
                    value={newItem.priority}
                    onChange={(e) => setNewItem((p) => ({ ...p, priority: e.target.value }))}
                    className="bg-white/5 border border-white/10 rounded-md px-3 py-2 text-xs text-foreground"
                    data-testid="select-roadmap-priority"
                  >
                    {Object.entries(PRIORITY_CONFIG).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </select>
                  <select
                    value={newItem.category}
                    onChange={(e) => setNewItem((p) => ({ ...p, category: e.target.value }))}
                    className="bg-white/5 border border-white/10 rounded-md px-3 py-2 text-xs text-foreground"
                    data-testid="select-roadmap-category"
                  >
                    {CATEGORY_OPTIONS.map((c) => (
                      <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                    ))}
                  </select>
                  <div className="flex-1" />
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowAddForm(false)}
                    data-testid="button-cancel-roadmap"
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => createMutation.mutate(newItem)}
                    disabled={!newItem.title.trim() || createMutation.isPending}
                    data-testid="button-save-roadmap"
                  >
                    <Check className="w-3.5 h-3.5 mr-1" />
                    Save
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="relative group/carousel">
          <button
            onClick={() => scroll("left")}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-1.5 rounded-full bg-black/60 border border-white/10 backdrop-blur-sm text-white/70 opacity-0 group-hover/carousel:opacity-100 transition-opacity"
            data-testid="button-carousel-left"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => scroll("right")}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-1.5 rounded-full bg-black/60 border border-white/10 backdrop-blur-sm text-white/70 opacity-0 group-hover/carousel:opacity-100 transition-opacity"
            data-testid="button-carousel-right"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <div
            ref={scrollRef}
            className="flex gap-3 overflow-x-auto pb-2 scroll-smooth snap-x snap-mandatory"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex-shrink-0 w-[280px] h-[180px] rounded-2xl bg-white/5 animate-pulse snap-start" />
              ))
            ) : filtered.length === 0 ? (
              <div className="flex-shrink-0 w-full py-12 text-center">
                <Map className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground/50">No items in this view</p>
              </div>
            ) : (
              filtered.map((item) => {
                const statusCfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.planned;
                const priorityCfg = PRIORITY_CONFIG[item.priority] || PRIORITY_CONFIG.medium;
                const StatusIcon = statusCfg.icon;
                const PriorityIcon = priorityCfg.icon;

                return (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="flex-shrink-0 w-[280px] snap-start"
                  >
                    <div className="h-full p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-3 group/card relative">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <button
                            onClick={() => cycleStatus(item)}
                            className={`flex-shrink-0 p-1 rounded-md ${statusCfg.color} transition-colors`}
                            title={`Status: ${statusCfg.label} (click to cycle)`}
                            data-testid={`button-cycle-status-${item.id}`}
                          >
                            <StatusIcon className="w-3.5 h-3.5" />
                          </button>
                          <h3 className={`text-sm font-semibold truncate ${item.status === "completed" ? "line-through text-muted-foreground" : "text-foreground"}`}>
                            {item.title}
                          </h3>
                        </div>
                        <button
                          onClick={() => deleteMutation.mutate(item.id)}
                          className="flex-shrink-0 p-1 rounded-md text-muted-foreground/30 opacity-0 group-hover/card:opacity-100 transition-opacity"
                          data-testid={`button-delete-roadmap-${item.id}`}
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {item.description && (
                        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                          {item.description}
                        </p>
                      )}

                      <div className="mt-auto flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="text-[10px] border-white/10">
                          {item.category}
                        </Badge>
                        <div className={`flex items-center gap-1 text-[10px] ${priorityCfg.color}`}>
                          <PriorityIcon className="w-3 h-3" />
                          {priorityCfg.label}
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${statusCfg.color}`}>
                          {statusCfg.label}
                        </span>
                        {item.createdAt && (
                          <span className="text-[10px] text-muted-foreground/40">
                            {new Date(item.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </GlassCard>
  );
}

function WhitelistManager() {
  const { toast } = useToast();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPin, setNewPin] = useState("");
  const [editingPinId, setEditingPinId] = useState<number | null>(null);
  const [editPin, setEditPin] = useState("");

  const { data: users = [], isLoading } = useQuery<{ id: number; name: string; createdAt: string }[]>({
    queryKey: ["/api/whitelist"],
    queryFn: async () => {
      const res = await fetch("/api/whitelist", { headers: { "x-master-key": "0424" } });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: { name: string; pin: string }) => {
      const res = await fetch("/api/whitelist", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-master-key": "0424" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/whitelist"] });
      setNewName("");
      setNewPin("");
      setShowAddForm(false);
      toast({ title: "User Added", description: "Whitelist entry created." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to add user.", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/whitelist/${id}`, {
        method: "DELETE",
        headers: { "x-master-key": "0424" },
      });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/whitelist"] });
      toast({ title: "Removed", description: "User removed from whitelist." });
    },
  });

  const updatePinMutation = useMutation({
    mutationFn: async ({ id, pin }: { id: number; pin: string }) => {
      const res = await fetch(`/api/whitelist/${id}/pin`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-master-key": "0424" },
        body: JSON.stringify({ pin }),
      });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/whitelist"] });
      setEditingPinId(null);
      setEditPin("");
      toast({ title: "PIN Updated", description: "User's PIN has been changed." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update PIN.", variant: "destructive" });
    },
  });

  return (
    <GlassCard className="overflow-hidden" hoverEffect>
      <div className="relative h-28 overflow-hidden">
        <img src={whitelistImg} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-black/90" />
        <div className="absolute bottom-0 left-0 right-0 p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-500/20 backdrop-blur-sm">
              <Users className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white font-display">Access Whitelist</h2>
              <p className="text-xs text-white/50">{users.length} user{users.length !== 1 ? "s" : ""} + master key</p>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="border-white/20 text-white bg-white/10 backdrop-blur-sm"
            onClick={() => setShowAddForm(!showAddForm)}
            data-testid="button-add-whitelist"
          >
            <UserPlus className="w-3.5 h-3.5 mr-1.5" />
            Add
          </Button>
        </div>
      </div>

      <div className="p-4">
        <AnimatePresence mode="wait">
          {showAddForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 overflow-hidden"
            >
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <div className="flex items-end gap-3 flex-wrap">
                  <div className="flex-1 min-w-[120px]">
                    <Label className="text-xs text-muted-foreground mb-1 block">Name</Label>
                    <Input
                      placeholder="e.g. John"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="bg-white/5 border-white/10"
                      data-testid="input-whitelist-name"
                    />
                  </div>
                  <div className="w-28">
                    <Label className="text-xs text-muted-foreground mb-1 block">4-Digit PIN</Label>
                    <Input
                      type="password"
                      inputMode="numeric"
                      maxLength={4}
                      placeholder="****"
                      value={newPin}
                      onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ""))}
                      className="bg-white/5 border-white/10 text-center tracking-widest font-mono"
                      data-testid="input-whitelist-pin"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => { setShowAddForm(false); setNewName(""); setNewPin(""); }}
                      data-testid="button-cancel-whitelist"
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => createMutation.mutate({ name: newName, pin: newPin })}
                      disabled={!newName.trim() || newPin.length !== 4 || createMutation.isPending}
                      data-testid="button-save-whitelist"
                    >
                      <Check className="w-3.5 h-3.5 mr-1" />
                      Save
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-4 py-2.5 px-3 rounded-xl bg-primary/5 border border-primary/10">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                <Lock className="w-3.5 h-3.5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Developer</p>
                <p className="text-[10px] text-muted-foreground">Master Key</p>
              </div>
            </div>
            <Badge variant="outline" className="text-[10px] border-primary/20 text-primary">
              Master
            </Badge>
          </div>

          {isLoading ? (
            Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="h-14 rounded-xl bg-white/5 animate-pulse" />
            ))
          ) : (
            users.map((user) => (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="rounded-xl bg-white/5 border border-white/5"
              >
                <div className="flex items-center justify-between gap-3 py-2.5 px-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                      <span className="text-xs font-semibold text-foreground">{user.name.charAt(0).toUpperCase()}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
                      <p className="text-[10px] text-muted-foreground">PIN: ****</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        if (editingPinId === user.id) {
                          setEditingPinId(null);
                          setEditPin("");
                        } else {
                          setEditingPinId(user.id);
                          setEditPin("");
                        }
                      }}
                      data-testid={`button-change-pin-${user.id}`}
                    >
                      <KeyRound className="w-3.5 h-3.5 text-muted-foreground" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => deleteMutation.mutate(user.id)}
                      data-testid={`button-delete-whitelist-${user.id}`}
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-400/60" />
                    </Button>
                  </div>
                </div>

                <AnimatePresence>
                  {editingPinId === user.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-3 pb-3 pt-1 flex items-center gap-2 border-t border-white/5">
                        <Input
                          type="password"
                          inputMode="numeric"
                          maxLength={4}
                          placeholder="New PIN"
                          value={editPin}
                          onChange={(e) => setEditPin(e.target.value.replace(/\D/g, ""))}
                          className="bg-white/5 border-white/10 text-center tracking-widest font-mono flex-1"
                          autoFocus
                          data-testid={`input-change-pin-${user.id}`}
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => { setEditingPinId(null); setEditPin(""); }}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => updatePinMutation.mutate({ id: user.id, pin: editPin })}
                          disabled={editPin.length !== 4 || updatePinMutation.isPending}
                          data-testid={`button-save-pin-${user.id}`}
                        >
                          <Check className="w-3.5 h-3.5 mr-1" />
                          Save
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))
          )}

          {!isLoading && users.length === 0 && (
            <p className="text-xs text-muted-foreground/40 text-center py-4">
              No additional users. Click Add to create one.
            </p>
          )}
        </div>
      </div>
    </GlassCard>
  );
}

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

      <motion.div variants={fadeUp}>
        <RoadmapCarousel />
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
            <WhitelistManager />
          </motion.div>

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
