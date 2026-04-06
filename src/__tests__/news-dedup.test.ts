import { describe, it, expect } from "vitest";
import { deduplicateNews, deduplicateNewsByStoryId } from "../lib/news-dedup";
import type { NewsItem } from "../types/supabase";

function makeItem(overrides: Partial<NewsItem>): NewsItem {
  return {
    id: Math.random().toString(),
    person_id: "p1",
    company_id: "c1",
    category: "funding",
    headline: "Default headline",
    summary: null,
    source_url: `https://example.com/${Math.random()}`,
    source_domain: "example.com",
    published_at: new Date().toISOString(),
    discovered_at: new Date().toISOString(),
    confidence: 0.8,
    og_image_url: null,
    story_id: null,
    ...overrides,
  };
}

describe("deduplicateNews", () => {
  it("groups similar headlines from same person", () => {
    const items = [
      makeItem({ headline: "Perplexity AI Raises $500M at $9B Valuation", source_domain: "TechCrunch" }),
      makeItem({ headline: "Perplexity AI Raises $500M Series C Round", source_domain: "Bloomberg" }),
      makeItem({ headline: "Something completely different about another company", person_id: "p2" }),
    ];
    const result = deduplicateNews(items);
    expect(result.length).toBe(2); // Two groups
  });

  it("keeps different stories separate", () => {
    const items = [
      makeItem({ headline: "Company launches new product", category: "launch" }),
      makeItem({ headline: "Company raises $50M funding", category: "funding" }),
    ];
    const result = deduplicateNews(items);
    expect(result.length).toBe(2);
  });
});

describe("deduplicateNewsByStoryId", () => {
  it("groups items with same story_id", () => {
    const items = [
      makeItem({ headline: "Article A from TechCrunch", source_domain: "TechCrunch", story_id: "perplexity-500m" }),
      makeItem({ headline: "Article B from Bloomberg", source_domain: "Bloomberg", story_id: "perplexity-500m" }),
      makeItem({ headline: "Unrelated article", story_id: "other-story" }),
    ];
    const result = deduplicateNewsByStoryId(items);
    expect(result.length).toBe(2);
    // First group should have relatedSources
    const mainGroup = result.find(r => r.relatedSources.length > 0);
    expect(mainGroup).toBeDefined();
    expect(mainGroup!.relatedSources.length).toBe(1);
  });

  it("picks highest-tier source as main", () => {
    const items = [
      makeItem({ headline: "From small blog", source_domain: "smallblog.com", story_id: "test" }),
      makeItem({ headline: "From Bloomberg", source_domain: "Bloomberg", story_id: "test" }),
    ];
    const result = deduplicateNewsByStoryId(items);
    expect(result[0].source_domain).toBe("Bloomberg");
  });
});
