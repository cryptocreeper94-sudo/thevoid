import { cn } from "@/lib/utils";

interface SkeletonCardProps {
  className?: string;
  lines?: number;
  hasImage?: boolean;
}

export function SkeletonCard({ className, lines = 3, hasImage = true }: SkeletonCardProps) {
  return (
    <div className={cn("glass-panel rounded-3xl overflow-hidden", className)}>
      {hasImage && (
        <div className="h-32 bg-white/5 animate-pulse" />
      )}
      <div className="p-6 space-y-3">
        <div className="h-5 w-2/3 rounded-lg bg-white/5 animate-pulse" />
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className="h-3 rounded-lg bg-white/5 animate-pulse"
            style={{ width: `${85 - i * 15}%`, animationDelay: `${i * 150}ms` }}
          />
        ))}
      </div>
    </div>
  );
}

export function SkeletonGrid({ count = 3, className }: { count?: number; className?: string }) {
  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-3 gap-4", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export function SkeletonCarousel({ className }: { className?: string }) {
  return (
    <div className={cn("glass-panel rounded-3xl p-6", className)}>
      <div className="space-y-4">
        <div className="h-6 w-1/3 rounded-lg bg-white/5 animate-pulse" />
        <div className="h-40 rounded-2xl bg-white/5 animate-pulse" />
        <div className="flex justify-center gap-2 pt-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="w-2 h-2 rounded-full bg-white/10 animate-pulse" style={{ animationDelay: `${i * 200}ms` }} />
          ))}
        </div>
      </div>
    </div>
  );
}
