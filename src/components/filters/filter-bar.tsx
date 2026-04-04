"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CompanyStatus } from "@/types/supabase";

const STATUS_TABS: { value: CompanyStatus | "all"; label: string }[] = [
  { value: "all", label: "전체" },
  { value: "active", label: "운영중" },
  { value: "ipo", label: "IPO" },
  { value: "acquired", label: "인수됨" },
  { value: "closed", label: "폐업" },
];

const SORT_OPTIONS = [
  { value: "recent", label: "최근 출연순" },
  { value: "name", label: "이름순" },
];

export function FilterBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [searchValue, setSearchValue] = useState(
    searchParams.get("search") || ""
  );
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleTabKeyDown = (e: React.KeyboardEvent) => {
    const tabs = e.currentTarget.querySelectorAll<HTMLElement>('[role="tab"]');
    const currentIdx = STATUS_TABS.findIndex(t => t.value === activeStatus);
    let nextIdx = currentIdx;
    if (e.key === 'ArrowRight') nextIdx = (currentIdx + 1) % tabs.length;
    else if (e.key === 'ArrowLeft') nextIdx = (currentIdx - 1 + tabs.length) % tabs.length;
    else if (e.key === 'Home') nextIdx = 0;
    else if (e.key === 'End') nextIdx = tabs.length - 1;
    else return;
    e.preventDefault();
    tabs[nextIdx]?.focus();
  };

  const activeStatus = searchParams.get("status") || "all";
  const activeSort = searchParams.get("sort") || "recent";

  const updateParams = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value === "all" || value === "") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
      params.delete("cursor");
      startTransition(() => {
        router.push(`?${params.toString()}`);
      });
    },
    [router, searchParams]
  );

  const handleSearch = useCallback(
    (value: string) => {
      setSearchValue(value);
      if (searchTimerRef.current !== null) {
        clearTimeout(searchTimerRef.current);
      }
      searchTimerRef.current = setTimeout(() => {
        updateParams("search", value);
        searchTimerRef.current = null;
      }, 300);
    },
    [updateParams]
  );

  useEffect(() => {
    return () => {
      if (searchTimerRef.current !== null) {
        clearTimeout(searchTimerRef.current);
      }
    };
  }, []);

  return (
    <div className={cn("space-y-4 transition-opacity", isPending && "opacity-50 pointer-events-none")}>
      {/* Status tabs */}
      <div
        role="tablist"
        aria-label="회사 상태 필터"
        className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide"
        onKeyDown={handleTabKeyDown}
      >
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            role="tab"
            aria-selected={activeStatus === tab.value}
            tabIndex={activeStatus === tab.value ? 0 : -1}
            onClick={() => updateParams("status", tab.value)}
            className={cn(
              "whitespace-nowrap rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
              activeStatus === tab.value
                ? "border-foreground bg-foreground text-background"
                : "border-border-active text-text-secondary hover:border-border-hover hover:text-foreground"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search + Sort */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" aria-hidden="true" />
          <label htmlFor="people-search" className="sr-only">
            인물 또는 기업 검색
          </label>
          <input
            id="people-search"
            type="text"
            value={searchValue}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="인물 또는 기업 검색..."
            className="w-full rounded-lg border border-border-active bg-input-bg py-2 pl-10 pr-4 text-sm text-foreground placeholder-text-tertiary transition-colors focus:border-accent/50 focus:outline-none"
          />
        </div>
        <label htmlFor="sort-select" className="sr-only">
          정렬 기준
        </label>
        <select
          id="sort-select"
          value={activeSort}
          onChange={(e) => updateParams("sort", e.target.value)}
          aria-label="정렬 기준"
          className="rounded-lg border border-border-active bg-input-bg px-3 py-2 text-sm text-text-secondary focus:border-accent/50 focus:outline-none"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
