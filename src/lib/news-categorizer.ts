import type { NewsCategory } from "@/types/supabase";

const CATEGORY_KEYWORDS: Record<NewsCategory, string[]> = {
  acquisition: ["acquir", "acquisition", "merge", "merger", "buys", "bought", "takeover", "deal to buy", "purchase"],
  funding: ["raised", "funding", "series a", "series b", "series c", "series d", "series e", "seed round", "investment", "venture", "capital", "fundrais", "fundraise", "pre-seed", "valuation", "billion-dollar", "unicorn", "round led", "secures", "closes round"],
  ipo: ["ipo", "public offering", "nasdaq", "nyse", "listed", "goes public", "stock exchange", "spac", "direct listing"],
  launch: ["launch", "released", "introduces", "unveils", "debuts", "announces", "new product", "rolls out", "open source"],
  award: ["award", "winner", "recognized", "named to", "forbes", "30 under", "top 50", "honor", "best of"],
  hire: ["joins", "appointed", "named ceo", "named cto", "named coo", "hires", "new hire", "steps down", "resigns", "new role"],
  other: [],
};

const REPUTABLE_DOMAINS = [
  "techcrunch.com", "bloomberg.com", "reuters.com", "wsj.com",
  "ft.com", "cnbc.com", "forbes.com", "crunchbase.com",
  "venturebeat.com", "theinformation.com", "axios.com",
  "businessinsider.com", "wired.com", "theverge.com",
];

export function categorize(headline: string): NewsCategory {
  const lower = headline.toLowerCase();
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (category === "other") continue;
    if (keywords.some((kw) => lower.includes(kw))) {
      return category as NewsCategory;
    }
  }
  return "other";
}

export function computeConfidence(
  headline: string,
  personName: string,
  companyName: string | null,
  sourceDomain: string | null,
  publishedAt: string | null
): number {
  let score = 0.5;

  if (headline.toLowerCase().includes(personName.toLowerCase())) score += 0.1;
  if (companyName && headline.toLowerCase().includes(companyName.toLowerCase())) score += 0.1;
  if (sourceDomain && REPUTABLE_DOMAINS.some((d) => sourceDomain.includes(d))) score += 0.1;

  if (publishedAt) {
    const daysAgo = (Date.now() - new Date(publishedAt).getTime()) / (1000 * 60 * 60 * 24);
    if (daysAgo <= 90) score += 0.1;
  }

  return Math.min(score, 1.0);
}

export function extractDomain(url: string): string | null {
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return null;
  }
}
