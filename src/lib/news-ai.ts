import Anthropic from "@anthropic-ai/sdk";
import type { NewsCategory } from "@/types/supabase";

function getClient() {
  return new Anthropic();
}

interface AnalysisResult {
  relevant: boolean;
  category: NewsCategory;
  story_id: string; // short identifier for grouping same stories
  reason: string;
}

/**
 * Use Claude Haiku to analyze a batch of headlines.
 * Returns relevance, category, and a story_id for grouping duplicates.
 */
export async function analyzeHeadlines(
  headlines: { id: string; headline: string; personName: string; companyName: string | null }[]
): Promise<Map<string, AnalysisResult>> {
  if (headlines.length === 0) return new Map();

  const items = headlines.map((h, i) =>
    `[${i}] "${h.headline}" — Person: ${h.personName}, Company: ${h.companyName || "N/A"}`
  ).join("\n");

  const response = await getClient().messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 2000,
    messages: [{
      role: "user",
      content: `Analyze these news headlines. For each one, determine:
1. **relevant**: Is this article actually about the specified person or their company? (true/false)
2. **category**: One of: funding, acquisition, ipo, launch, award, hire, other
3. **story_id**: A short slug identifying the core story (same story from different sources should get the SAME story_id). Format: "company-event" e.g. "allbirds-sale", "perplexity-series-b"

Rules:
- "relevant" = false if the person/company name appears coincidentally (e.g., "speak" as a verb, not the company Speak)
- For category: look at the PRIMARY action, not just mentions. "Selling for $39M" = acquisition even if "IPO" is mentioned as past context
- For story_id: articles about the same event/news should have identical story_ids

Headlines:
${items}

Respond as JSON array:
[{"index": 0, "relevant": true, "category": "funding", "story_id": "perplexity-series-b", "reason": "..."}]`
    }],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";

  // Parse JSON from response
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) return new Map();

  const results = new Map<string, AnalysisResult>();
  try {
    const parsed = JSON.parse(jsonMatch[0]) as {
      index: number;
      relevant: boolean;
      category: NewsCategory;
      story_id: string;
      reason: string;
    }[];

    for (const item of parsed) {
      if (item.index >= 0 && item.index < headlines.length) {
        results.set(headlines[item.index].id, {
          relevant: item.relevant,
          category: item.category || "other",
          story_id: item.story_id || `story-${item.index}`,
          reason: item.reason || "",
        });
      }
    }
  } catch {
    // Parse error — return empty
  }

  return results;
}

/**
 * Analyze headlines in batches of 20 to stay within token limits.
 */
export async function analyzeHeadlinesBatched(
  headlines: { id: string; headline: string; personName: string; companyName: string | null }[]
): Promise<Map<string, AnalysisResult>> {
  const BATCH_SIZE = 20;
  const allResults = new Map<string, AnalysisResult>();

  for (let i = 0; i < headlines.length; i += BATCH_SIZE) {
    const batch = headlines.slice(i, i + BATCH_SIZE);
    const batchResults = await analyzeHeadlines(batch);
    for (const [k, v] of batchResults) {
      allResults.set(k, v);
    }
  }

  return allResults;
}
