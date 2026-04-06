import { NextRequest, NextResponse } from "next/server";
import { sql } from "@vercel/postgres";
import { searchGoogleNews } from "@/lib/news";
import { computeConfidence, extractDomain } from "@/lib/news-categorizer";
import { buildSearchQueries, isHeadlineRelevant } from "@/lib/news-filter";
import { analyzeHeadlinesBatched } from "@/lib/news-ai";
import { verifyCronAuth } from "@/lib/cron-auth";
import { convertNewsToMilestones } from "@/lib/news-to-milestones";

const BATCH_SIZE = 20;

export async function POST(request: NextRequest) {
  const authError = verifyCronAuth(request);
  if (authError) return authError;

  try {
    const { rows: people } = await sql`
      SELECT p.id, p.name, c.name as company_name, c.id as company_id
      FROM people p
      LEFT JOIN companies c ON p.company_id = c.id
      ORDER BY p.updated_at ASC
      LIMIT ${BATCH_SIZE}
    `;

    let totalNews = 0;
    let filtered = 0;
    let processed = 0;

    for (const person of people) {
      // Don't skip — buildSearchQueries handles generic names by searching person name only

      const queries = buildSearchQueries(person.name, person.company_name);
      const allResults = [];
      for (const q of queries) {
        const r = await searchGoogleNews(q);
        allResults.push(...r);
      }
      // Deduplicate by link
      const seen = new Set<string>();
      const results = allResults.filter(r => { if (seen.has(r.link)) return false; seen.add(r.link); return true; });

      // Pre-filter with regex
      const preFiltered = results.filter(r => {
        const domain = extractDomain(r.link);
        return isHeadlineRelevant(r.title, person.name, person.company_name, domain);
      });

      // AI analysis with Haiku
      const toAnalyze = preFiltered.map((r, i) => ({
        id: String(i),
        headline: r.title,
        personName: person.name,
        companyName: person.company_name,
      }));

      let aiResults: Map<string, { relevant: boolean; category: string; story_id: string }> = new Map();
      if (toAnalyze.length > 0 && process.env.ANTHROPIC_API_KEY) {
        try {
          aiResults = await analyzeHeadlinesBatched(toAnalyze);
        } catch {
          // Fallback: skip AI if it fails
        }
      }

      for (let idx = 0; idx < preFiltered.length; idx++) {
        const result = preFiltered[idx];
        const ai = aiResults.get(String(idx));

        // If AI says not relevant, skip
        if (ai && !ai.relevant) { filtered++; continue; }

        const domain = extractDomain(result.link);
        const category = ai?.category || "other";
        const confidence = computeConfidence(
          result.title, person.name, person.company_name, domain, result.pubDate
        );
        const storyId = ai?.story_id || null;

        try {
          const { rowCount } = await sql`
            INSERT INTO news_items (person_id, company_id, category, headline, source_url, source_domain, published_at, confidence, story_id)
            VALUES (${person.id}, ${person.company_id}, ${category}, ${result.title}, ${result.link}, ${domain}, ${result.pubDate}, ${confidence}, ${storyId})
            ON CONFLICT (person_id, source_url) DO NOTHING
          `;
          if (rowCount && rowCount > 0) totalNews++;
        } catch {
          // Skip duplicates
        }
      }

      // Convert significant news to timeline milestones
      let newMilestones = 0;
      try {
        newMilestones += await convertNewsToMilestones(person.id);
      } catch {
        // milestone conversion is best-effort
      }

      await sql`UPDATE people SET updated_at = now() WHERE id = ${person.id}`;
      processed++;
    }

    return NextResponse.json({
      success: true,
      processed,
      new_news: totalNews,
      filtered_out: filtered,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Updates cron error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}
