import { getRecentNews } from "@/lib/queries";
import { deduplicateNews } from "@/lib/news-dedup";
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
      getRecentNews({ limit: 30 }),
      getRecentNews({ category: "funding", limit: 20 }),
      getRecentNews({ category: "acquisition", limit: 20 }),
      getRecentNews({ category: "ipo", limit: 20 }),
      getRecentNews({ category: "launch", limit: 20 }),
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
        allItems={deduplicateNews(allNews)}
        fundingItems={deduplicateNews(fundingNews)}
        acquisitionItems={deduplicateNews(acquisitionNews)}
        ipoItems={deduplicateNews(ipoNews)}
        launchItems={deduplicateNews(launchNews)}
      />
    </div>
  );
}
