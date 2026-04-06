import { getRecentNews } from "@/lib/queries";
import { deduplicateNewsByStoryId } from "@/lib/news-dedup";
import { NewsGrid } from "./news-grid";
import type { NewsItem } from "@/types/supabase";

export async function NewsSection({ channel = "en" }: { channel?: string }) {
  let allNews: NewsItem[] = [];
  let fundingNews: NewsItem[] = [];
  let acquisitionNews: NewsItem[] = [];
  let ipoNews: NewsItem[] = [];
  let launchNews: NewsItem[] = [];

  try {
    [allNews, fundingNews, acquisitionNews, ipoNews, launchNews] = await Promise.all([
      getRecentNews({ limit: 30, excludeOther: true, channel }),
      getRecentNews({ category: "funding", limit: 20, channel }),
      getRecentNews({ category: "acquisition", limit: 20, channel }),
      getRecentNews({ category: "ipo", limit: 20, channel }),
      getRecentNews({ category: "launch", limit: 20, channel }),
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
        allItems={deduplicateNewsByStoryId(allNews)}
        fundingItems={deduplicateNewsByStoryId(fundingNews)}
        acquisitionItems={deduplicateNewsByStoryId(acquisitionNews)}
        ipoItems={deduplicateNewsByStoryId(ipoNews)}
        launchItems={deduplicateNewsByStoryId(launchNews)}
        channel={channel}
      />
    </div>
  );
}
