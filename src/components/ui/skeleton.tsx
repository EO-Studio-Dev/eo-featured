import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn("animate-pulse rounded-lg bg-elevated", className)}
    />
  );
}

export function PersonCardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center gap-4">
        <Skeleton className="h-16 w-16 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-5 w-16" />
        </div>
      </div>
    </div>
  );
}

export function PersonGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 md:gap-5">
      {Array.from({ length: count }).map((_, i) => (
        <PersonCardSkeleton key={i} />
      ))}
    </div>
  );
}
