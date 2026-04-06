import type { NewsItem } from "@/types/supabase";

// Source tier — lower number = higher authority
const SOURCE_TIER: Record<string, number> = {
  "bloomberg": 1, "bloomberg.com": 1, "reuters": 1, "reuters.com": 1,
  "wsj.com": 1, "ft.com": 1,
  "techcrunch": 2, "techcrunch.com": 2, "cnbc": 2, "cnbc.com": 2,
  "forbes": 2, "forbes.com": 2, "fortune": 2, "fortune.com": 2,
  "the information": 2, "theinformation.com": 2,
  "the verge": 3, "theverge.com": 3, "wired": 3, "wired.com": 3,
  "axios": 3, "axios.com": 3, "venturebeat": 3, "venturebeat.com": 3,
  "business insider": 3, "businessinsider.com": 3,
  "fast company": 3, "fastcompany.com": 3, "inc.com": 3,
  "sifted.eu": 3, "geekwire.com": 3, "ars technica": 3,
  "yahoo finance": 4, "finance.yahoo.com": 4,
  "business wire": 5, "businesswire.com": 5,
  "pr newswire": 5, "prnewswire.com": 5,
};

function getSourceTier(domain: string | null): number {
  if (!domain) return 10;
  return SOURCE_TIER[domain.toLowerCase()] || 6;
}

// Stop words to ignore when comparing headlines
const STOP_WORDS = new Set([
  "a", "an", "the", "is", "are", "was", "were", "be", "been",
  "to", "of", "in", "for", "on", "at", "by", "with", "from",
  "and", "or", "but", "not", "no", "its", "it", "this", "that",
  "as", "has", "have", "had", "will", "can", "may", "how", "why",
  "what", "who", "new", "says", "said", "about", "after", "over",
]);

function extractKeywords(headline: string): Set<string> {
  // Remove source suffix (" - TechCrunch")
  const clean = headline.replace(/\s[-–—]\s[^-–—]+$/, "");
  const words = clean.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/);
  return new Set(words.filter(w => w.length > 2 && !STOP_WORDS.has(w)));
}

function similarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let overlap = 0;
  for (const word of a) {
    if (b.has(word)) overlap++;
  }
  return overlap / Math.min(a.size, b.size);
}

export interface DeduplicatedNewsItem extends NewsItem {
  relatedSources: { domain: string; url: string }[];
}

/**
 * Deduplicate news items by headline similarity.
 * Groups similar articles, keeps the most authoritative one,
 * attaches the rest as related source links.
 */
export function deduplicateNews(items: NewsItem[]): DeduplicatedNewsItem[] {
  if (items.length === 0) return [];

  const SIMILARITY_THRESHOLD = 0.5;

  // Pre-compute keywords for each item
  const keywordsMap = items.map(item => ({
    item,
    keywords: extractKeywords(item.headline),
  }));

  const used = new Set<number>();
  const result: DeduplicatedNewsItem[] = [];

  for (let i = 0; i < keywordsMap.length; i++) {
    if (used.has(i)) continue;

    const group: typeof keywordsMap = [keywordsMap[i]];
    used.add(i);

    // Find similar articles
    for (let j = i + 1; j < keywordsMap.length; j++) {
      if (used.has(j)) continue;
      // Must be about the same person/company
      if (keywordsMap[i].item.person_id !== keywordsMap[j].item.person_id) continue;

      const sim = similarity(keywordsMap[i].keywords, keywordsMap[j].keywords);
      if (sim >= SIMILARITY_THRESHOLD) {
        group.push(keywordsMap[j]);
        used.add(j);
      }
    }

    // Sort group by source tier (best first)
    group.sort((a, b) => getSourceTier(a.item.source_domain) - getSourceTier(b.item.source_domain));

    // Best item is the main one
    const main = group[0].item;
    const relatedSources = group.slice(1).map(g => ({
      domain: g.item.source_domain || "source",
      url: g.item.source_url,
    }));

    result.push({ ...main, relatedSources });
  }

  return result;
}
