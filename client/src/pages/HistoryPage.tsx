import { useVents } from "@/hooks/use-vents";
import { usePinAuth } from "@/components/PinGate";
import { Header } from "@/components/Header";
import { Loader2, Calendar, Mic, Sparkles } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";

export default function HistoryPage() {
  const { visitorId } = usePinAuth();
  const { data: vents, isLoading, error } = useVents(visitorId);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-destructive">
        Error loading history.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-body">
      <Header />
      
      <main className="max-w-4xl mx-auto p-6 pt-24 space-y-8">
        <div className="space-y-2 mb-8">
          <h1 className="text-3xl font-display font-bold">Vent History</h1>
          <p className="text-muted-foreground">A chronicle of your rage and our wisdom.</p>
        </div>

        {!vents || vents.length === 0 ? (
          <div className="text-center py-20 bg-secondary/20 rounded-3xl border border-dashed border-white/10">
            <p className="text-muted-foreground">No vents recorded yet. Go scream at something.</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {vents.map((vent, index) => (
              <motion.div
                key={vent.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-card border border-border/50 rounded-2xl p-6 hover:border-primary/30 transition-all duration-300 shadow-lg hover:shadow-primary/5 group"
              >
                <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/5">
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-secondary text-foreground/80">
                      {vent.personality}
                    </span>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(vent.createdAt), "MMM d, yyyy • h:mm a")}
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                      <Mic className="w-3 h-3" /> You
                    </div>
                    <p className="text-muted-foreground italic font-hand text-lg leading-relaxed">
                      "{vent.transcript}"
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-wider mb-2">
                      <Sparkles className="w-3 h-3" /> Response
                    </div>
                    <p className="text-foreground font-medium">
                      {vent.response}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
