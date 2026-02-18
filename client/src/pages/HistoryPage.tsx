import { useVents } from "@/hooks/use-vents";
import { usePinAuth } from "@/components/PinGate";
import { Layout } from "@/components/ui/Layout";
import { GlassCard } from "@/components/ui/GlassCard";
import { Loader2, Calendar, Mic, Sparkles } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { useDocumentTitle } from "@/hooks/use-document-title";

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

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh] text-destructive">
          Error loading history.
        </div>
      </Layout>
    );
  }

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

        {!vents || vents.length === 0 ? (
          <motion.div variants={fadeUp}>
            <GlassCard className="p-12 text-center">
              <p className="text-muted-foreground">No vents recorded yet. Go scream at something.</p>
            </GlassCard>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {(vents as Vent[]).map((vent: Vent, index: number) => (
              <motion.div
                key={vent.id}
                variants={fadeUp}
              >
                <GlassCard className="overflow-hidden" hoverEffect>
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
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </Layout>
  );
}
