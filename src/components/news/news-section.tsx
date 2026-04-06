import { getRecentNews } from "@/lib/queries";
import { deduplicateNewsByStoryId } from "@/lib/news-dedup";
import { NewsGrid } from "./news-grid";
import type { NewsItem } from "@/types/supabase";

export async function NewsSection({ channel = "en" }: { channel?: string }) {
  let allNews: NewsItem[] = [];

  try {
    allNews = await getRecentNews({ limit: 80, excludeOther: true, channel });
  } catch {
    // DB not connected
  }

  // Dedup first, then split by category
  const deduped = deduplicateNewsByStoryId(allNews);

  const fundingItems = deduped.filter(n => n.category === "funding");
  const acquisitionItems = deduped.filter(n => n.category === "acquisition");
  const ipoItems = deduped.filter(n => n.category === "ipo");
  const launchItems = deduped.filter(n => n.category === "launch");

  return (
    <div>
      <h2 className="mb-6 text-[10px] font-bold uppercase tracking-[0.1em] text-text-tertiary">
        Latest Updates
      </h2>
      <NewsGrid
        allItems={deduped}
        fundingItems={fundingItems}
        acquisitionItems={acquisitionItems}
        ipoItems={ipoItems}
        launchItems={launchItems}
        channel={channel}
      />
    </div>
  );
}
