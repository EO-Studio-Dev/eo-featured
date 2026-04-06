import { getRecentNews } from "@/lib/queries";
import { NewsGrid } from "./news-grid";
import type { NewsItem } from "@/types/supabase";

export async function NewsSection() {
  let allNews: NewsItem[] = [];
  let fundingNews: NewsItem[] = [];
  let acquisitionNews: NewsItem[] = [];
  let ipoNews: NewsItem[] = [];
  let launchNews: NewsItem[] = [];

  try {
    [allNews, fundingNews, acquisitionNews, ipoNews, launchNews] = await Promise.all([
      getRecentNews({ limit: 18 }),
      getRecentNews({ category: "funding", limit: 12 }),
      getRecentNews({ category: "acquisition", limit: 12 }),
      getRecentNews({ category: "ipo", limit: 12 }),
      getRecentNews({ category: "launch", limit: 12 }),
    ]);
  } catch {
    // DB not connected
  }

  return (
    <div>
      <h2 className="mb-6 text-[10px] font-bold uppercase tracking-[0.1em] text-text-tertiary">
        Latest Updates
      </h2>
      <NewsGrid
        allItems={allNews}
        fundingItems={fundingNews}
        acquisitionItems={acquisitionNews}
        ipoItems={ipoNews}
        launchItems={launchNews}
      />
    </div>
  );
}
