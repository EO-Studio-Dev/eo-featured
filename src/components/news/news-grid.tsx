"use client";

import { useState, useCallback } from "react";
import { NewsCard } from "./news-card";
import { cn } from "@/lib/utils";
import type { NewsCategory } from "@/types/supabase";
import type { DeduplicatedNewsItem } from "@/lib/news-dedup";

const PAGE_SIZE = 12;

const CATEGORY_TABS: { value: NewsCategory | "all"; label: string }[] = [
  { value: "all", label: "ALL" },
  { value: "funding", label: "FUNDING" },
  { value: "acquisition", label: "M&A" },
  { value: "ipo", label: "IPO" },
  { value: "launch", label: "LAUNCHES" },
];

interface NewsGridProps {
  allItems: DeduplicatedNewsItem[];
  fundingItems: DeduplicatedNewsItem[];
  acquisitionItems: DeduplicatedNewsItem[];
  ipoItems: DeduplicatedNewsItem[];
  launchItems: DeduplicatedNewsItem[];
}

export function NewsGrid({ allItems, fundingItems, acquisitionItems, ipoItems, launchItems }: NewsGridProps) {
  const [activeCategory, setActiveCategory] = useState<NewsCategory | "all">("all");
  const [extraItems, setExtraItems] = useState<DeduplicatedNewsItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const baseMap: Record<string, DeduplicatedNewsItem[]> = {
    all: allItems,
    funding: fundingItems,
    acquisition: acquisitionItems,
    ipo: ipoItems,
    launch: launchItems,
  };

  const items = [...(baseMap[activeCategory] || allItems), ...extraItems];

  const handleCategoryChange = (cat: NewsCategory | "all") => {
    setActiveCategory(cat);
    setExtraItems([]);
    setHasMore(true);
  };

  const loadMore = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: String(PAGE_SIZE), offset: String(items.length) });
      if (activeCategory !== "all") params.set("category", activeCategory);
      const res = await fetch(`/api/news?${params}`);
      const data = await res.json();
      if (data.news && data.news.length > 0) {
        setExtraItems((prev) => [...prev, ...data.news]);
        if (data.news.length < PAGE_SIZE) setHasMore(false);
      } else {
        setHasMore(false);
      }
    } catch {
      setHasMore(false);
    }
    setLoading(false);
  }, [activeCategory, items.length]);

  return (
    <div>
      {/* Category tabs */}
      <div className="mb-6 flex gap-0 overflow-x-auto scrollbar-hide">
        {CATEGORY_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => handleCategoryChange(tab.value)}
            className={cn(
              "whitespace-nowrap border-[1.5px] border-border px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.05em] transition-colors -ml-[1.5px] first:ml-0",
              activeCategory === tab.value
                ? "border-foreground bg-foreground text-background"
                : "text-text-tertiary hover:border-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* News cards */}
      {items.length === 0 ? (
        <div className="border-[1.5px] border-border py-12 text-center">
          <p className="text-[11px] uppercase tracking-[0.05em] text-text-tertiary">
            No news items yet
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {items.map((item) => (
              <NewsCard key={item.id} item={item} />
            ))}
          </div>
          {hasMore && (
            <div className="mt-8 flex justify-center">
              <button
                onClick={loadMore}
                disabled={loading}
                className="border-[1.5px] border-border px-6 py-2.5 text-[10px] font-bold uppercase tracking-[0.05em] text-text-secondary transition-colors hover:border-foreground hover:bg-foreground hover:text-background disabled:opacity-50"
              >
                {loading ? "Loading..." : "Load More"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
