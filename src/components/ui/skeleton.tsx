import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={cn("animate-pulse bg-elevated", className)}
    />
  );
}

export function PersonCardSkeleton() {
  return (
    <div className="border-[1.5px] border-border p-5">
      <div className="flex items-start gap-4">
        <Skeleton className="h-16 w-16" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-3 w-36" />
          <Skeleton className="h-4 w-16" />
        </div>
      </div>
    </div>
  );
}

export function NewsCardSkeleton() {
  return (
    <div className="border-[1.5px] border-border p-6">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="mt-4 h-6 w-full" />
      <Skeleton className="mt-2 h-6 w-3/4" />
      <div className="mt-5 flex items-center gap-4">
        <Skeleton className="h-20 w-36" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
    </div>
  );
}

export function NewsGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div role="status" aria-label="Loading news" className="grid grid-cols-1 gap-5 md:grid-cols-2">
      {Array.from({ length: count }).map((_, i) => (
        <NewsCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function PersonGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div
      role="status"
      aria-label="Loading people"
      className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3"
    >
      {Array.from({ length: count }).map((_, i) => (
        <PersonCardSkeleton key={i} />
      ))}
    </div>
  );
}
