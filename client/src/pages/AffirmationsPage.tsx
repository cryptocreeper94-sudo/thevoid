import { useState } from "react";
import { Layout } from "@/components/ui/Layout";
import { GlassCard } from "@/components/ui/GlassCard";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { useMeta } from "@/hooks/use-meta";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Sparkles, ChevronLeft, ChevronRight, Loader2, Quote } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";
import affirmImg from "@/assets/images/affirmations-sunrise.webp";

interface Affirmation {
  id: number;
  userId: number;
  content: string;
  context: string;
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

export default function AffirmationsPage() {
  useDocumentTitle("Daily Affirmations — The Void");
  useMeta({
    description: "Personalized daily affirmations drawn from your journey. Generate words of power to uplift and inspire.",
    ogTitle: "Daily Affirmations — The Void",
    ogDescription: "Personalized words of power drawn from your journey.",
    canonicalPath: "/affirmations",
  });

  const userId = parseInt(localStorage.getItem("void-user-id") || "0");

  const { data: affirmations = [], isLoading } = useQuery<Affirmation[]>({
    queryKey: ["/api/affirmations", `?userId=${userId}`],
    enabled: userId > 0,
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/affirmations/generate", { userId });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/affirmations"] });
    },
  });

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <Layout>
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        className="max-w-4xl mx-auto px-4 py-8 space-y-6"
      >
        <motion.div variants={fadeUp}>
          <GlassCard className="overflow-hidden">
            <div className="relative h-40 sm:h-48 overflow-hidden">
              <img src={affirmImg} alt="" className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/50 to-black/90" />
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 mb-3">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  <span className="text-xs font-medium text-white/70 tracking-wide uppercase">Daily Practice</span>
                </div>
                <h1
                  className="text-2xl sm:text-3xl md:text-4xl font-bold text-white font-display"
                  data-testid="text-affirmations-title"
                >
                  Daily Affirmations
                </h1>
                <p className="text-sm text-white/60 mt-1 max-w-md">
                  Personalized words of power drawn from your journey
                </p>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        <motion.div variants={fadeUp} className="flex justify-center">
          <Button
            onClick={() => generateMutation.mutate()}
            disabled={generateMutation.isPending || userId === 0}
            className="bg-gradient-to-r from-purple-500 to-pink-500 border-purple-500/30 text-white"
            data-testid="button-generate-affirmations"
          >
            {generateMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate New Affirmations
              </>
            )}
          </Button>
        </motion.div>

        {generateMutation.isPending && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center gap-3 py-8"
          >
            <div className="animate-pulse space-y-4 w-full max-w-md">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-white/[0.03] rounded-xl border border-white/5" />
              ))}
            </div>
          </motion.div>
        )}

        {isLoading && (
          <div className="animate-pulse space-y-4">
            <div className="h-48 bg-white/[0.03] rounded-xl border border-white/5" />
          </div>
        )}

        {!isLoading && affirmations.length > 0 && !generateMutation.isPending && (
          <motion.div variants={fadeUp}>
            <div className="px-10">
              <Carousel
                opts={{ align: "start", containScroll: "trimSnaps" }}
              >
                <CarouselContent className="-ml-4">
                  {affirmations.map((affirmation) => (
                    <CarouselItem
                      key={affirmation.id}
                      className="pl-4 basis-full sm:basis-[85%] md:basis-[70%]"
                    >
                      <GlassCard
                        className="p-8 sm:p-10 md:p-12 min-h-[220px] flex flex-col items-center justify-center text-center"
                        hoverEffect
                        data-testid={`card-affirmation-${affirmation.id}`}
                      >
                        <Quote className="w-6 h-6 text-purple-400/40 mb-4 rotate-180" />
                        <p
                          className="text-lg sm:text-xl text-white italic leading-relaxed max-w-lg"
                          data-testid={`text-affirmation-content-${affirmation.id}`}
                        >
                          {affirmation.content}
                        </p>
                        <Quote className="w-6 h-6 text-purple-400/40 mt-4" />
                        {affirmation.context && (
                          <p className="text-xs text-white/40 mt-4">{affirmation.context}</p>
                        )}
                        <p
                          className="text-[10px] sm:text-xs text-white/30 mt-3 tracking-wide uppercase"
                          data-testid={`text-affirmation-date-${affirmation.id}`}
                        >
                          {formatDate(affirmation.createdAt)}
                        </p>
                      </GlassCard>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious
                  className="bg-white/5 border-white/10 text-white"
                  data-testid="button-carousel-prev"
                />
                <CarouselNext
                  className="bg-white/5 border-white/10 text-white"
                  data-testid="button-carousel-next"
                />
              </Carousel>
            </div>
          </motion.div>
        )}

        {!isLoading && affirmations.length === 0 && !generateMutation.isPending && (
          <motion.div variants={fadeUp}>
            <GlassCard className="p-8 sm:p-10 text-center">
              <Sparkles className="w-8 h-8 text-purple-400/30 mx-auto mb-4" />
              <p className="text-sm text-white/50" data-testid="text-affirmations-empty">
                No affirmations yet. Generate your first set of personalized affirmations above.
              </p>
            </GlassCard>
          </motion.div>
        )}
      </motion.div>
    </Layout>
  );
}
