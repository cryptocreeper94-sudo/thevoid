import { useState } from "react";
import { Layout } from "@/components/ui/Layout";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { useMeta } from "@/hooks/use-meta";
import { GlassCard } from "@/components/ui/GlassCard";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, ArrowLeft, ChevronLeft, ChevronRight, Tag, Calendar as CalendarIcon, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

function readTime(content: string): string {
  const words = content.split(/\s+/).length;
  const mins = Math.max(1, Math.round(words / 200));
  return `${mins} min read`;
}

export default function BlogPage() {
  useDocumentTitle("Blog — Mental Wellness Insights");
  useMeta({ description: "AI-curated articles on emotional health, stress management, breathing techniques, and mental wellness from THE VOID.", ogTitle: "Void Blog — Mental Wellness Insights", ogDescription: "Expert insights on venting, stress relief, and emotional intelligence.", ogType: "blog" });
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const pageSize = 6;

  const { data: posts, isLoading } = useQuery<any[]>({ queryKey: ["/api/blog"] });
  const allPosts = posts || [];
  const totalPages = Math.max(1, Math.ceil(allPosts.length / pageSize));
  const currentPosts = allPosts.slice(page * pageSize, (page + 1) * pageSize);

  const { data: selectedPost } = useQuery<any>({
    queryKey: ["/api/blog", selectedSlug],
    queryFn: async () => { const res = await fetch(`/api/blog/${selectedSlug}`); if (!res.ok) return null; return res.json(); },
    enabled: !!selectedSlug,
  });

  if (selectedSlug && selectedPost) {
    return (
      <Layout>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl mx-auto px-4 py-8 space-y-6"
        >
          <Button variant="ghost" onClick={() => setSelectedSlug(null)} data-testid="button-blog-back">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Blog
          </Button>

          <GlassCard className="overflow-hidden">
            <div className="p-6 md:p-8 space-y-4">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="secondary" className="text-[10px]" data-testid="badge-blog-category">{selectedPost.category}</Badge>
                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {readTime(selectedPost.content)}
                </span>
                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <CalendarIcon className="w-3 h-3" /> {new Date(selectedPost.createdAt).toLocaleDateString()}
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground font-display" data-testid="text-blog-post-title">
                {selectedPost.title}
              </h1>
              <div className="prose prose-sm prose-invert max-w-none text-muted-foreground leading-relaxed space-y-3">
                {selectedPost.content.split("\n\n").map((para: string, i: number) => {
                  if (para.startsWith("## ")) return <h2 key={i} className="text-lg font-semibold text-foreground mt-6 mb-2">{para.slice(3)}</h2>;
                  if (para.startsWith("### ")) return <h3 key={i} className="text-base font-semibold text-foreground mt-4 mb-1">{para.slice(4)}</h3>;
                  if (para.startsWith("- ")) return <ul key={i} className="list-disc list-inside space-y-1">{para.split("\n").map((li, j) => <li key={j} className="text-sm">{li.replace(/^- /, "")}</li>)}</ul>;
                  return <p key={i} className="text-sm">{para}</p>;
                })}
              </div>
              {selectedPost.tags && selectedPost.tags.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap pt-4 border-t border-white/5">
                  <Tag className="w-3 h-3 text-muted-foreground" />
                  {selectedPost.tags.map((tag: string) => (
                    <Badge key={tag} variant="outline" className="text-[10px]">{tag}</Badge>
                  ))}
                </div>
              )}
            </div>
          </GlassCard>
        </motion.div>
      </Layout>
    );
  }

  return (
    <Layout>
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        className="max-w-5xl mx-auto px-4 py-8 space-y-6"
      >
        <motion.div variants={fadeUp} className="text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 mb-4">
            <BookOpen className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-medium text-muted-foreground tracking-wide uppercase">Void Blog</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground font-display mb-2" data-testid="text-blog-title">
            Mental Wellness Insights
          </h1>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            AI-curated articles on emotional health, stress management, and finding your calm.
          </p>
        </motion.div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <GlassCard key={i} className="overflow-hidden">
                <div className="p-5 space-y-3 animate-pulse">
                  <div className="h-4 bg-white/5 rounded w-1/3" />
                  <div className="h-5 bg-white/5 rounded w-3/4" />
                  <div className="h-3 bg-white/5 rounded w-full" />
                  <div className="h-3 bg-white/5 rounded w-2/3" />
                </div>
              </GlassCard>
            ))}
          </div>
        ) : allPosts.length === 0 ? (
          <motion.div variants={fadeUp}>
            <GlassCard className="overflow-hidden">
              <div className="p-8 text-center space-y-3">
                <BookOpen className="w-8 h-8 text-muted-foreground mx-auto" />
                <p className="text-sm text-muted-foreground">No blog posts yet. Check back soon for fresh insights.</p>
              </div>
            </GlassCard>
          </motion.div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence mode="wait">
                {currentPosts.map((post: any) => (
                  <motion.div
                    key={post.slug}
                    variants={fadeUp}
                    layout
                    className="cursor-pointer"
                    onClick={() => setSelectedSlug(post.slug)}
                  >
                    <GlassCard className="h-full overflow-hidden" hoverEffect>
                      <div className="p-5 space-y-3">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-[10px]">{post.category}</Badge>
                          <span className="text-[10px] text-muted-foreground">{readTime(post.content)}</span>
                        </div>
                        <h3 className="text-sm font-semibold text-foreground line-clamp-2" data-testid={`text-blog-card-${post.slug}`}>
                          {post.title}
                        </h3>
                        <p className="text-xs text-muted-foreground line-clamp-3">{post.excerpt}</p>
                        <p className="text-[10px] text-muted-foreground">{new Date(post.createdAt).toLocaleDateString()}</p>
                      </div>
                    </GlassCard>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3">
                <Button size="icon" variant="ghost" onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0} data-testid="button-blog-prev">
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-xs text-muted-foreground">{page + 1} / {totalPages}</span>
                <Button size="icon" variant="ghost" onClick={() => setPage(Math.min(totalPages - 1, page + 1))} disabled={page >= totalPages - 1} data-testid="button-blog-next">
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </motion.div>
    </Layout>
  );
}
