import { NextRequest, NextResponse } from "next/server";
import { sql } from "@vercel/postgres";
import { searchGoogleNews } from "@/lib/news";
import { categorize, computeConfidence, extractDomain } from "@/lib/news-categorizer";

const BATCH_SIZE = 20;

export async function POST(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });
  }
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get people to update (oldest updated_at first)
    const { rows: people } = await sql`
      SELECT p.id, p.name, c.name as company_name, c.id as company_id
      FROM people p
      LEFT JOIN companies c ON p.company_id = c.id
      ORDER BY p.updated_at ASC
      LIMIT ${BATCH_SIZE}
    `;

    let totalNews = 0;
    let processed = 0;

    for (const person of people) {
      const query = person.company_name
        ? `"${person.name}" "${person.company_name}"`
        : `"${person.name}"`;

      const results = await searchGoogleNews(query);

      for (const result of results) {
        const domain = extractDomain(result.link);
        const category = categorize(result.title);
        const confidence = computeConfidence(
          result.title,
          person.name,
          person.company_name,
          domain,
          result.pubDate
        );

        try {
          const { rowCount } = await sql`
            INSERT INTO news_items (person_id, company_id, category, headline, source_url, source_domain, published_at, confidence)
            VALUES (${person.id}, ${person.company_id}, ${category}, ${result.title}, ${result.link}, ${domain}, ${result.pubDate}, ${confidence})
            ON CONFLICT (person_id, source_url) DO NOTHING
          `;
          if (rowCount && rowCount > 0) totalNews++;
        } catch (e) {
          // Skip duplicates or constraint violations
          console.error(`News insert error for ${person.name}:`, e);
        }
      }

      // Mark person as updated
      await sql`UPDATE people SET updated_at = now() WHERE id = ${person.id}`;
      processed++;
    }

    return NextResponse.json({
      success: true,
      processed,
      new_news: totalNews,
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
