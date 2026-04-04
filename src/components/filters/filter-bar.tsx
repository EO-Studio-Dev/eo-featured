"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState, useTransition } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
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
      const timeout = setTimeout(() => updateParams("search", value), 300);
      return () => clearTimeout(timeout);
    },
    [updateParams]
  );

  return (
    <div className="space-y-4">
      {/* Status tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => updateParams("status", tab.value)}
            className={cn(
              "whitespace-nowrap rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
              activeStatus === tab.value
                ? "border-[#F0F0F0] bg-[#F0F0F0] text-[#0A0A0A]"
                : "border-[#333] text-[#A0A0A0] hover:border-[#555] hover:text-[#F0F0F0]"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search + Sort */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#666]" />
          <input
            type="text"
            value={searchValue}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="인물 또는 기업 검색..."
            className="w-full rounded-lg border border-[#333] bg-[#111] py-2 pl-10 pr-4 text-sm text-[#F0F0F0] placeholder-[#666] transition-colors focus:border-blue-500/50 focus:outline-none"
          />
        </div>
        <select
          value={activeSort}
          onChange={(e) => updateParams("sort", e.target.value)}
          className="rounded-lg border border-[#333] bg-[#111] px-3 py-2 text-sm text-[#A0A0A0] focus:border-blue-500/50 focus:outline-none"
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
