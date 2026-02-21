import { useState, useRef } from "react";
import { useVents } from "@/hooks/use-vents";
import { usePinAuth } from "@/components/PinGate";
import { Layout } from "@/components/ui/Layout";
import { GlassCard } from "@/components/ui/GlassCard";
import { Calendar, Mic, Sparkles, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { Button } from "@/components/ui/button";
import { SkeletonCard } from "@/components/ui/SkeletonCard";
import archiveImg from "@/assets/images/history-archive.png";

interface Vent {
  id: number;
  transcript: string;
  response: string;
  personality: string;
  createdAt: string;
}

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function HistoryPage() {
  useDocumentTitle("Vent History");
  const { visitorId } = usePinAuth();
  const { data: vents, isLoading, error } = useVents(visitorId);
  const [carouselIdx, setCarouselIdx] = useState(0);
  const touchRef = useRef<{ x: number; y: number } | null>(null);
  const pageSize = 3;

  const ventList = (vents as Vent[]) || [];
  const totalPages = Math.max(1, Math.ceil(ventList.length / pageSize));
  const currentVents = ventList.slice(carouselIdx * pageSize, (carouselIdx + 1) * pageSize);

  const prev = () => setCarouselIdx((i) => Math.max(0, i - 1));
  const next = () => setCarouselIdx((i) => Math.min(totalPages - 1, i + 1));

  const onTouchStart = (e: React.TouchEvent) => {
    touchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touchRef.current) return;
    const dx = e.changedTouches[0].clientX - touchRef.current.x;
    if (Math.abs(dx) > 40) {
      if (dx < 0) next();
      else prev();
    }
    touchRef.current = null;
  };

  return (
    <Layout>
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        className="max-w-4xl mx-auto px-4 py-8 space-y-6"
      >
        <motion.div variants={fadeUp} className="text-center mb-2">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 mb-4">
            <Mic className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-medium text-muted-foreground tracking-wide uppercase">Vent History</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground font-display mb-2">Your Vent Log</h1>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            A chronicle of your rage and our wisdom.
          </p>
        </motion.div>

        <motion.div variants={fadeUp}>
          <GlassCard className="overflow-hidden">
            <div className="relative h-32 overflow-hidden">
              <img src={archiveImg} alt="" className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-black/90" />
              <div className="absolute bottom-0 left-0 right-0 p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/20 backdrop-blur-sm">
                  <Mic className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Your Archive</h3>
                  <p className="text-[10px] text-white/60">{ventList.length} vents recorded</p>
                </div>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {isLoading ? (
          <motion.div variants={fadeUp} className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonCard key={i} hasImage={false} lines={4} />
            ))}
          </motion.div>
        ) : error ? (
          <motion.div variants={fadeUp}>
            <GlassCard className="p-12 text-center">
              <p className="text-destructive">Error loading history. Please try again.</p>
            </GlassCard>
          </motion.div>
        ) : ventList.length === 0 ? (
          <motion.div variants={fadeUp}>
            <GlassCard className="p-12 text-center">
              <p className="text-muted-foreground">No vents recorded yet. Go scream at something.</p>
            </GlassCard>
          </motion.div>
        ) : (
          <motion.div variants={fadeUp}>
            <div
              onTouchStart={onTouchStart}
              onTouchEnd={onTouchEnd}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={carouselIdx}
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  {currentVents.map((vent) => (
                    <GlassCard key={vent.id} className="overflow-hidden" hoverEffect>
                      <div className="p-4 sm:p-5">
                        <div className="flex items-center justify-between gap-2 mb-3 pb-3 border-b border-white/5 flex-wrap">
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary">
                            {vent.personality}
                          </span>
                          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                            <Calendar className="w-3 h-3" />
                            {format(new Date(vent.createdAt), "MMM d, yyyy")}
                            <span className="hidden sm:inline"> {format(new Date(vent.createdAt), "h:mm a")}</span>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
                              <Mic className="w-3 h-3" /> You Said
                            </div>
                            <p className="text-sm text-muted-foreground italic leading-relaxed">
                              "{vent.transcript}"
                            </p>
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-primary uppercase tracking-wider mb-2">
                              <Sparkles className="w-3 h-3" /> Response
                            </div>
                            <p className="text-sm text-foreground leading-relaxed">
                              {vent.response}
                            </p>
                          </div>
                        </div>
                      </div>
                    </GlassCard>
                  ))}
                </motion.div>
              </AnimatePresence>

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-3 mt-4">
                  <Button size="icon" variant="ghost" onClick={prev} disabled={carouselIdx === 0} data-testid="button-history-prev">
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <div className="flex items-center gap-1.5">
                    {Array.from({ length: totalPages }).map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCarouselIdx(i)}
                        className={`w-2 h-2 rounded-full transition-all duration-300 ${i === carouselIdx ? "bg-primary w-6" : "bg-white/20 hover:bg-white/40"}`}
                        data-testid={`button-history-dot-${i}`}
                      />
                    ))}
                  </div>
                  <Button size="icon" variant="ghost" onClick={next} disabled={carouselIdx >= totalPages - 1} data-testid="button-history-next">
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </motion.div>
    </Layout>
  );
}
