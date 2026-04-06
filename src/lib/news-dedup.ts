import type { NewsItem } from "@/types/supabase";

// Source tier — lower = more authoritative
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
  "sifted.eu": 3, "geekwire.com": 3,
  "yahoo finance": 4, "finance.yahoo.com": 4,
  "the rundown ai": 4,
  "business wire": 5, "businesswire.com": 5,
  "pr newswire": 5, "prnewswire.com": 5,
};

function getSourceTier(domain: string | null): number {
  if (!domain) return 10;
  return SOURCE_TIER[domain.toLowerCase()] || 6;
}

const STOP_WORDS = new Set([
  "a", "an", "the", "is", "are", "was", "were", "be", "been", "being",
  "to", "of", "in", "for", "on", "at", "by", "with", "from", "into",
  "and", "or", "but", "not", "no", "its", "it", "this", "that", "than",
  "as", "has", "have", "had", "will", "can", "may", "how", "why",
  "what", "who", "new", "says", "said", "about", "after", "over",
  "more", "just", "also", "could", "would", "should", "much", "very",
  "here", "there", "when", "where", "which", "these", "those",
]);

function extractKeywords(headline: string): Set<string> {
  const clean = headline.replace(/\s[-–—]\s[^-–—]+$/, ""); // Remove source suffix
  const words = clean.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/);
  return new Set(words.filter(w => w.length > 2 && !STOP_WORDS.has(w)));
}

/**
 * Extract key entities — names, companies, dollar amounts.
 * These are the strongest signals for same-story detection.
 */
function extractEntities(headline: string): Set<string> {
  const entities = new Set<string>();
  const lower = headline.toLowerCase();

  // Dollar amounts
  const dollars = lower.match(/\$[\d.]+[bmk]?/g);
  if (dollars) dollars.forEach(d => entities.add(d));

  // Capitalized proper nouns (likely names/companies)
  const properNouns = headline.match(/\b[A-Z][a-z]+(?:\s[A-Z][a-z]+)*/g);
  if (properNouns) properNouns.forEach(n => entities.add(n.toLowerCase()));

  return entities;
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
 * Deduplicate news items using multi-signal similarity:
 * 1. Same person/company → lower threshold for grouping
 * 2. Same category → lower threshold
 * 3. Entity overlap (names, dollar amounts) → strong grouping signal
 * 4. Keyword overlap → supplementary signal
 */
export function deduplicateNews(items: NewsItem[]): DeduplicatedNewsItem[] {
  if (items.length === 0) return [];

  const enriched = items.map(item => ({
    item,
    keywords: extractKeywords(item.headline),
    entities: extractEntities(item.headline),
  }));

  const used = new Set<number>();
  const result: DeduplicatedNewsItem[] = [];

  for (let i = 0; i < enriched.length; i++) {
    if (used.has(i)) continue;

    const group: typeof enriched = [enriched[i]];
    used.add(i);

    for (let j = i + 1; j < enriched.length; j++) {
      if (used.has(j)) continue;

      const a = enriched[i];
      const b = enriched[j];

      if (areSameStory(a, b)) {
        group.push(b);
        used.add(j);
      }
    }

    // Sort: best source first
    group.sort((a, b) => getSourceTier(a.item.source_domain) - getSourceTier(b.item.source_domain));

    const main = group[0].item;
    const relatedSources = group.slice(1).map(g => ({
      domain: g.item.source_domain || "source",
      url: g.item.source_url,
    }));

    result.push({ ...main, relatedSources });
  }

  return result;
}

/**
 * Group by AI-assigned story_id first, then fall back to similarity.
 */
export function deduplicateNewsByStoryId(items: NewsItem[]): DeduplicatedNewsItem[] {
  if (items.length === 0) return [];

  // Group by story_id (AI-assigned)
  const storyGroups = new Map<string, NewsItem[]>();
  const ungrouped: NewsItem[] = [];

  for (const item of items) {
    const sid = (item as unknown as { story_id?: string }).story_id || null;
    if (sid) {
      const group = storyGroups.get(sid) || [];
      group.push(item);
      storyGroups.set(sid, group);
    } else {
      ungrouped.push(item);
    }
  }

  const result: DeduplicatedNewsItem[] = [];

  // Process story_id groups
  for (const group of storyGroups.values()) {
    group.sort((a, b) => getSourceTier(a.source_domain) - getSourceTier(b.source_domain));
    const main = group[0];
    // Use the most recent date from the group as the representative date
    const latestDate = group.reduce((latest, item) => {
      const d = new Date(item.published_at || item.discovered_at).getTime();
      return d > latest ? d : latest;
    }, 0);
    const related = group.slice(1).map(g => ({
      domain: g.source_domain || "source",
      url: g.source_url,
    }));
    result.push({
      ...main,
      published_at: new Date(latestDate).toISOString(),
      relatedSources: related,
    });
  }

  // Process ungrouped with similarity-based dedup
  const dedupedUngrouped = deduplicateNews(ungrouped);
  result.push(...dedupedUngrouped);

  // Sort by date
  result.sort((a, b) => {
    const da = new Date(a.published_at || a.discovered_at).getTime();
    const db = new Date(b.published_at || b.discovered_at).getTime();
    return db - da;
  });

  return result;
}

function areSameStory(
  a: { item: NewsItem; keywords: Set<string>; entities: Set<string> },
  b: { item: NewsItem; keywords: Set<string>; entities: Set<string> },
): boolean {
  // Different people → never group (unless same company)
  const samePerson = a.item.person_id === b.item.person_id;
  const sameCompany = a.item.company_id && a.item.company_id === b.item.company_id;

  if (!samePerson && !sameCompany) return false;

  // Same category → strong signal they're about the same event
  const sameCategory = a.item.category === b.item.category && a.item.category !== "other";

  // Entity overlap (names, dollar amounts) → very strong signal
  const entitySim = similarity(a.entities, b.entities);

  // Keyword overlap
  const keywordSim = similarity(a.keywords, b.keywords);

  // Decision matrix:
  // Same person + same category + any entity overlap → group
  if (samePerson && sameCategory && entitySim > 0.2) return true;

  // Same person + high keyword similarity → group
  if (samePerson && keywordSim >= 0.4) return true;

  // Same company + same category + high entity overlap → group
  if (sameCompany && sameCategory && entitySim >= 0.3) return true;

  // Very high keyword similarity for same person/company → group
  if ((samePerson || sameCompany) && keywordSim >= 0.5) return true;

  return false;
}
