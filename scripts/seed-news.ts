import { config } from "dotenv";
config({ path: ".env.local" });
import { sql } from "@vercel/postgres";
import { searchGoogleNews } from "../src/lib/news";
import { categorize, computeConfidence, extractDomain } from "../src/lib/news-categorizer";
import { buildSearchQueries, shouldSkipCompany, isHeadlineRelevant } from "../src/lib/news-filter";

async function seed() {
  const { rows: people } = await sql`
    SELECT p.id, p.name, c.name as company_name, c.id as company_id
    FROM people p
    LEFT JOIN companies c ON p.company_id = c.id
    ORDER BY p.updated_at ASC
  `;

  console.log(`Searching news for ${people.length} people...`);
  let totalNews = 0;
  let processed = 0;

  for (const person of people) {
    // Don't skip — even for generic/non-companies, search by person name

    const queries = buildSearchQueries(person.name, person.company_name);
    const allResults = [];
    for (const q of queries) {
      const r = await searchGoogleNews(q);
      allResults.push(...r);
    }
    const seen = new Set<string>();
    const results = allResults.filter(r => { if (seen.has(r.link)) return false; seen.add(r.link); return true; });

    let personNews = 0;
    for (const result of results) {
      if (!isHeadlineRelevant(result.title, person.name, person.company_name)) {
        continue;
      }
      const domain = extractDomain(result.link);
      const category = categorize(result.title);
      const confidence = computeConfidence(
        result.title, person.name, person.company_name, domain, result.pubDate
      );

      try {
        const { rowCount } = await sql`
          INSERT INTO news_items (person_id, company_id, category, headline, source_url, source_domain, published_at, confidence)
          VALUES (${person.id}, ${person.company_id}, ${category}, ${result.title}, ${result.link}, ${domain}, ${result.pubDate}, ${confidence})
          ON CONFLICT (person_id, source_url) DO NOTHING
        `;
        if (rowCount && rowCount > 0) personNews++;
      } catch {
        // skip
      }
    }

    if (personNews > 0) {
      console.log(`  ${person.name}: +${personNews} news items`);
    }
    totalNews += personNews;
    processed++;

    // Rate limit: 500ms between requests
    await new Promise((r) => setTimeout(r, 500));
  }

  console.log(`\nDone! Processed: ${processed}, New news items: ${totalNews}`);

  const { rows } = await sql`
    SELECT category, COUNT(*)::int as count FROM news_items GROUP BY category ORDER BY count DESC
  `;
  console.log("\nNews by category:");
  for (const row of rows) {
    console.log(`  ${row.category}: ${row.count}`);
  }
}

seed().catch(console.error);
