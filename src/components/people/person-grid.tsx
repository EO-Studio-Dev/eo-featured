"use client";

import { useRouter } from "next/navigation";
import { PersonCard, type PersonCardData } from "./person-card";
import { PersonGridSkeleton } from "@/components/ui/skeleton";
import { SearchX } from "lucide-react";

interface PersonGridProps {
  people: PersonCardData[];
  isLoading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
}

export function PersonGrid({
  people,
  isLoading,
  hasMore,
  onLoadMore,
}: PersonGridProps) {
  const router = useRouter();

  if (isLoading) {
    return <PersonGridSkeleton />;
  }

  if (people.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center border-[1.5px] border-border py-20 text-center">
        <SearchX className="mb-4 h-10 w-10 text-text-tertiary" />
        <p className="text-[13px] font-bold uppercase tracking-[0.05em] text-text-secondary">
          No results found
        </p>
        <p className="mt-1 text-[11px] text-text-tertiary">
          Try a different search term or filter
        </p>
        <button
          onClick={() => router.push("/")}
          className="mt-6 border-[1.5px] border-border px-5 py-2 text-[10px] font-bold uppercase tracking-[0.05em] text-text-secondary transition-colors hover:border-foreground hover:bg-foreground hover:text-background"
        >
          Reset Filters
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {people.map((person, i) => (
          <PersonCard key={person.id} person={person} index={i} />
        ))}
      </div>
      {hasMore && (
        <div className="mt-8 flex justify-center">
          <button
            onClick={onLoadMore}
            aria-label="Load more people"
            className="border-[1.5px] border-border px-6 py-2.5 text-[10px] font-bold uppercase tracking-[0.05em] text-text-secondary transition-colors hover:border-foreground hover:bg-foreground hover:text-background"
          >
            Load More
          </button>
        </div>
      )}
    </div>
  );
}
