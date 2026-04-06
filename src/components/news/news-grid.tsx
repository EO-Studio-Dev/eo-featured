"use client";

import { useState, useCallback, useEffect, useRef } from "react";
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
  channel?: string;
}

export function NewsGrid({ allItems, fundingItems, acquisitionItems, ipoItems, launchItems, channel = "en" }: NewsGridProps) {
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

  const baseItems = baseMap[activeCategory] || allItems;
  const filteredExtra = activeCategory === "all"
    ? extraItems
    : extraItems.filter(n => n.category === activeCategory);
  const items = [...baseItems, ...filteredExtra];

  const handleCategoryChange = (cat: NewsCategory | "all") => {
    setActiveCategory(cat);
    setExtraItems([]);
    setHasMore(true);
  };

  const loadMore = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: String(PAGE_SIZE), offset: String(items.length), channel });
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
  }, [activeCategory, items.length, channel]);

  return (
    <div>
      {/* Category tabs */}
      <div
        role="tablist"
        aria-label="News category filter"
        className="mb-6 flex gap-0 overflow-x-auto scrollbar-hide"
        onKeyDown={(e) => {
          const tabs = CATEGORY_TABS;
          const idx = tabs.findIndex(t => t.value === activeCategory);
          let next = idx;
          if (e.key === "ArrowRight") next = (idx + 1) % tabs.length;
          else if (e.key === "ArrowLeft") next = (idx - 1 + tabs.length) % tabs.length;
          else if (e.key === "Home") next = 0;
          else if (e.key === "End") next = tabs.length - 1;
          else return;
          e.preventDefault();
          handleCategoryChange(tabs[next].value);
          (e.currentTarget.querySelectorAll<HTMLElement>('[role="tab"]')[next])?.focus();
        }}
      >
        {CATEGORY_TABS.map((tab) => (
          <button
            key={tab.value}
            role="tab"
            aria-selected={activeCategory === tab.value}
            tabIndex={activeCategory === tab.value ? 0 : -1}
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
          {hasMore ? (
            <LoadTrigger onVisible={loadMore} loading={loading} />
          ) : items.length > 0 ? (
            <div className="mt-8 py-4 text-center text-[11px] font-bold uppercase tracking-[0.05em] text-text-tertiary">
              End of results
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}

function LoadTrigger({ onVisible, loading }: { onVisible: () => void; loading: boolean }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading) {
          onVisible();
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [onVisible, loading]);

  return (
    <div ref={ref} className="mt-8 flex justify-center py-4">
      {loading && (
        <span className="text-[11px] font-bold uppercase tracking-[0.05em] text-text-tertiary">
          Loading...
        </span>
      )}
    </div>
  );
}
