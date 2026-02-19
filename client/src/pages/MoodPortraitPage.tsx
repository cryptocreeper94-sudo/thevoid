import { Layout } from "@/components/ui/Layout";
import { GlassCard } from "@/components/ui/GlassCard";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { useMeta } from "@/hooks/use-meta";
import { motion } from "framer-motion";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Palette, Loader2, Layers, Calendar, Hash } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MoodPortrait {
  id: number;
  userId: number;
  svgContent: string;
  dominantMood: string;
  dataPointsUsed: number;
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

export default function MoodPortraitPage() {
  useDocumentTitle("Mood Portrait — The Void");
  useMeta({
    description: "Generative art gallery where AI creates abstract SVG artwork from your emotional data.",
    ogTitle: "Mood Portrait — The Void",
    ogDescription: "Abstract artwork generated from your emotional landscape.",
    canonicalPath: "/mood-portrait",
  });

  const { data: portraits = [], isLoading } = useQuery<MoodPortrait[]>({
    queryKey: ["/api/mood-portraits", "?userId=1"],
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/mood-portraits/generate", { userId: 1 });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mood-portraits"] });
    },
  });

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const featured = portraits.length > 0 ? portraits[0] : null;

  return (
    <Layout>
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        className="max-w-5xl mx-auto px-4 py-8 space-y-6"
      >
        <motion.div variants={fadeUp}>
          <GlassCard className="p-6 sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 mb-3">
                  <Palette className="w-3.5 h-3.5 text-purple-400" />
                  <span className="text-xs font-medium text-white/70 tracking-wide uppercase">Generative Art</span>
                </div>
                <h1
                  className="text-2xl sm:text-3xl md:text-4xl font-bold text-white font-display"
                  data-testid="text-mood-portrait-title"
                >
                  Mood Portrait
                </h1>
                <p className="text-sm text-white/60 mt-1 max-w-md">
                  Abstract artwork generated from your emotional landscape
                </p>
              </div>
              <Button
                onClick={() => generateMutation.mutate()}
                disabled={generateMutation.isPending}
                className="bg-gradient-to-r from-purple-500 to-pink-500 border-purple-500/30 text-white"
                data-testid="button-generate-portrait"
              >
                {generateMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Palette className="w-4 h-4 mr-2" />
                    Generate Portrait
                  </>
                )}
              </Button>
            </div>
          </GlassCard>
        </motion.div>

        {generateMutation.isPending && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            <GlassCard className="p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-64 sm:h-80 bg-white/[0.03] rounded-xl border border-white/5" />
                <div className="h-4 w-1/3 bg-white/[0.03] rounded-md" />
                <div className="h-3 w-1/4 bg-white/[0.03] rounded-md" />
              </div>
            </GlassCard>
          </motion.div>
        )}

        {isLoading && (
          <div className="animate-pulse space-y-4">
            <div className="h-80 bg-white/[0.03] rounded-xl border border-white/5" />
          </div>
        )}

        {!isLoading && !generateMutation.isPending && featured && (
          <motion.div variants={fadeUp}>
            <GlassCard className="p-6 sm:p-8" data-testid={`card-portrait-featured-${featured.id}`}>
              <div className="flex items-center gap-2 mb-4">
                <Layers className="w-4 h-4 text-purple-400/60" />
                <span className="text-xs font-medium text-white/50 tracking-wide uppercase">Latest Portrait</span>
              </div>
              <div
                className="w-full max-h-[400px] overflow-hidden rounded-xl bg-black/20 flex items-center justify-center"
                data-testid={`svg-portrait-featured-${featured.id}`}
                dangerouslySetInnerHTML={{ __html: featured.svgContent }}
              />
              <div className="flex flex-wrap items-center gap-4 mt-4">
                <span
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-sm text-purple-300"
                  data-testid={`text-portrait-mood-${featured.id}`}
                >
                  {featured.dominantMood}
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs text-white/40" data-testid={`text-portrait-datapoints-${featured.id}`}>
                  <Hash className="w-3 h-3" />
                  {featured.dataPointsUsed} data points
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs text-white/40" data-testid={`text-portrait-date-${featured.id}`}>
                  <Calendar className="w-3 h-3" />
                  {formatDate(featured.createdAt)}
                </span>
              </div>
            </GlassCard>
          </motion.div>
        )}

        {!isLoading && !generateMutation.isPending && portraits.length > 1 && (
          <motion.div variants={fadeUp}>
            <div className="flex items-center gap-2 mb-3 px-1">
              <Layers className="w-4 h-4 text-white/30" />
              <span className="text-sm font-medium text-white/50">Gallery</span>
            </div>
            <div className="overflow-x-auto flex flex-nowrap gap-4 pb-4 -mx-1 px-1" data-testid="carousel-portraits">
              {portraits.map((portrait) => (
                <motion.div
                  key={portrait.id}
                  className="flex-none w-64 sm:w-72"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <GlassCard
                    className="p-4 h-full"
                    hoverEffect
                    data-testid={`card-portrait-${portrait.id}`}
                  >
                    <div
                      className="w-full h-40 overflow-hidden rounded-lg bg-black/20 flex items-center justify-center mb-3"
                      data-testid={`svg-portrait-${portrait.id}`}
                      dangerouslySetInnerHTML={{ __html: portrait.svgContent }}
                    />
                    <p
                      className="text-sm font-medium text-white/80 truncate"
                      data-testid={`text-portrait-mood-gallery-${portrait.id}`}
                    >
                      {portrait.dominantMood}
                    </p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-[10px] text-white/40" data-testid={`text-portrait-datapoints-gallery-${portrait.id}`}>
                        {portrait.dataPointsUsed} points
                      </span>
                      <span className="text-[10px] text-white/30" data-testid={`text-portrait-date-gallery-${portrait.id}`}>
                        {formatDate(portrait.createdAt)}
                      </span>
                    </div>
                  </GlassCard>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {!isLoading && portraits.length === 0 && !generateMutation.isPending && (
          <motion.div variants={fadeUp}>
            <GlassCard className="p-8 sm:p-10 text-center">
              <Palette className="w-8 h-8 text-purple-400/30 mx-auto mb-4" />
              <p className="text-sm text-white/50" data-testid="text-portraits-empty">
                Your portrait evolves with each vent and mood check. Start interacting to build your emotional landscape.
              </p>
            </GlassCard>
          </motion.div>
        )}
      </motion.div>
    </Layout>
  );
}
