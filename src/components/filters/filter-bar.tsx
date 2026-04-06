"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { cn } from "@/lib/utils";
import type { CompanyStatus } from "@/types/supabase";

const STATUS_TABS: { value: CompanyStatus | "all"; label: string }[] = [
  { value: "all", label: "ALL" },
  { value: "active", label: "ACTIVE" },
  { value: "ipo", label: "IPO" },
  { value: "acquired", label: "ACQUIRED" },
  { value: "closed", label: "CLOSED" },
];

const SORT_OPTIONS = [
  { value: "recent", label: "Recent" },
  { value: "name", label: "Name" },
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
      {/* Status tabs + Sort */}
      <div className="flex items-center justify-between gap-4">
        <div
          role="tablist"
          aria-label="Company status filter"
          className="flex gap-0 overflow-x-auto scrollbar-hide"
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
                "whitespace-nowrap border-[1.5px] border-border px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.05em] transition-colors -ml-[1.5px] first:ml-0",
                activeStatus === tab.value
                  ? "border-foreground bg-foreground text-background"
                  : "text-text-tertiary hover:border-foreground hover:text-foreground"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <label htmlFor="sort-select" className="sr-only">
          Sort by
        </label>
        <select
          id="sort-select"
          value={activeSort}
          onChange={(e) => updateParams("sort", e.target.value)}
          aria-label="Sort by"
          className="border-[1.5px] border-border bg-background px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.05em] text-text-secondary focus:border-foreground focus:outline-none"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Search */}
      <div className="relative">
        <label htmlFor="people-search" className="sr-only">
          Search people or companies
        </label>
        <input
          id="people-search"
          type="text"
          value={searchValue}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search..."
          className="w-full border-[1.5px] border-border bg-background px-4 py-2.5 text-[13px] text-foreground placeholder-text-tertiary transition-colors focus:border-foreground focus:outline-none"
        />
      </div>
    </div>
  );
}
