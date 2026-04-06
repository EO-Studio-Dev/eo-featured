import { config } from "dotenv";
config({ path: ".env.local" });
import { sql } from "@vercel/postgres";
import { searchGoogleNews, fetchOGImage } from "../src/lib/news";
import { extractDomain } from "../src/lib/news-categorizer";

async function main() {
  // Get people with news that still point to news.google.com
  const { rows: people } = await sql`
    SELECT DISTINCT p.id, p.name, c.name as company_name
    FROM news_items n
    JOIN people p ON n.person_id = p.id
    LEFT JOIN companies c ON n.company_id = c.id
    WHERE n.source_domain = 'news.google.com' OR n.source_domain IS NULL
    ORDER BY p.name
    LIMIT 50
  `;

  console.log(`Re-fetching news for ${people.length} people with real URLs...`);
  let updated = 0;
  let ogImages = 0;

  for (const person of people) {
    const query = person.company_name
      ? `"${person.name}" "${person.company_name}"`
      : `"${person.name}"`;

    const results = await searchGoogleNews(query);

    for (const result of results) {
      // result.link is now the real source URL (from <source url="...">)
      if (result.link.includes("news.google.com")) continue;

      const domain = extractDomain(result.link);

      // Match by headline
      const { rows: existing } = await sql`
        SELECT id FROM news_items
        WHERE person_id = ${person.id} AND headline = ${result.title}
        LIMIT 1
      `;

      if (existing.length > 0) {
        // Update existing item with real URL (skip if conflict)
        try {
          await sql`
            UPDATE news_items
            SET source_url = ${result.link}, source_domain = ${domain}
            WHERE id = ${existing[0].id}
          `;
        } catch {
          continue; // skip unique constraint violations
        }
        updated++;

        // Try to fetch OG image
        const ogImage = await fetchOGImage(result.link);
        if (ogImage) {
          await sql`UPDATE news_items SET og_image_url = ${ogImage} WHERE id = ${existing[0].id}`;
          ogImages++;
        }
      }
    }

    if (updated % 20 === 0 && updated > 0) {
      console.log(`  ${updated} URLs updated, ${ogImages} OG images found`);
    }

    await new Promise((r) => setTimeout(r, 500));
  }

  console.log(`\nDone! Updated: ${updated} URLs, ${ogImages} OG images`);

  const { rows: stats } = await sql`
    SELECT source_domain, COUNT(*)::int as c FROM news_items WHERE source_domain != 'news.google.com' AND source_domain IS NOT NULL GROUP BY source_domain ORDER BY c DESC LIMIT 10
  `;
  console.log("\nTop real domains:");
  for (const s of stats) console.log(`  ${s.source_domain}: ${s.c}`);
}

main().catch(console.error);
