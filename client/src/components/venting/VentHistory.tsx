import { useVents } from "@/hooks/use-vents";
import { formatDistanceToNow } from "date-fns";
import { Loader2, MessageSquare, Calendar } from "lucide-react";
import { motion } from "framer-motion";

export function VentHistory() {
  const { data: vents, isLoading } = useVents();

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 w-full bg-white/5 rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (!vents || vents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-white/30 text-center">
        <MessageSquare className="w-8 h-8 mb-3 opacity-50" />
        <p>No vents recorded yet.</p>
        <p className="text-xs mt-1">Go ahead, let it all out.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 overflow-y-auto max-h-[calc(100vh-250px)] pr-2">
      {vents.map((vent: any, idx: number) => (
        <motion.div
          key={vent.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.05 }}
          className="group relative p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 transition-colors cursor-pointer"
        >
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-medium px-2 py-1 rounded-full bg-white/10 text-white/70 border border-white/5 uppercase tracking-wide">
              {vent.personality}
            </span>
            <div className="flex items-center text-xs text-white/30">
              <Calendar className="w-3 h-3 mr-1" />
              {formatDistanceToNow(new Date(vent.createdAt), { addSuffix: true })}
            </div>
          </div>
          
          <div className="space-y-2">
            <p className="text-sm text-white/60 line-clamp-1 italic">"{vent.transcript}"</p>
            <div className="h-px w-full bg-white/5" />
            <p className="text-sm text-white/90 font-medium line-clamp-2">{vent.response}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
