"use client";

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
  if (isLoading) {
    return <PersonGridSkeleton />;
  }

  if (people.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <SearchX className="mb-4 h-12 w-12 text-text-tertiary" />
        <p className="text-lg font-medium text-text-secondary">
          검색 결과가 없습니다
        </p>
        <p className="mt-1 text-sm text-text-tertiary">
          다른 검색어나 필터를 시도해보세요
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 md:gap-5">
        {people.map((person, i) => (
          <PersonCard key={person.id} person={person} index={i} />
        ))}
      </div>
      {hasMore && (
        <div className="mt-8 flex justify-center">
          <button
            onClick={onLoadMore}
            aria-label="더 많은 인물 보기"
            className="rounded-lg border border-border-active bg-elevated px-6 py-2.5 text-sm font-medium text-text-secondary transition-colors hover:border-border-hover hover:text-foreground"
          >
            더 보기
          </button>
        </div>
      )}
    </div>
  );
}
