"use client";

import { AnimatePresence } from "framer-motion";
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
        <SearchX className="mb-4 h-12 w-12 text-[#666]" />
        <p className="text-lg font-medium text-[#A0A0A0]">
          검색 결과가 없습니다
        </p>
        <p className="mt-1 text-sm text-[#666]">
          다른 검색어나 필터를 시도해보세요
        </p>
      </div>
    );
  }

  return (
    <div>
      <AnimatePresence mode="popLayout">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 md:gap-5">
          {people.map((person, i) => (
            <PersonCard key={person.id} person={person} index={i} />
          ))}
        </div>
      </AnimatePresence>
      {hasMore && (
        <div className="mt-8 flex justify-center">
          <button
            onClick={onLoadMore}
            className="rounded-lg border border-[#333] bg-[#1A1A1A] px-6 py-2.5 text-sm font-medium text-[#A0A0A0] transition-colors hover:border-[#444] hover:text-[#F0F0F0]"
          >
            더 보기
          </button>
        </div>
      )}
    </div>
  );
}
