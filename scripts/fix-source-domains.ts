import { config } from "dotenv";
config({ path: ".env.local" });
import { sql } from "@vercel/postgres";

async function main() {
  const { rows } = await sql`
    SELECT id, headline FROM news_items
    WHERE source_domain = 'news.google.com' OR source_domain IS NULL
  `;

  console.log(`Fixing source domains for ${rows.length} items...`);
  let updated = 0;

  for (const row of rows) {
    // Pattern: "Headline text - SourceName"
    const match = row.headline.match(/\s[-–—]\s([^-–—]+)$/);
    if (match) {
      const source = match[1].trim();
      if (source.length >= 2 && source.length < 60) {
        await sql`UPDATE news_items SET source_domain = ${source} WHERE id = ${row.id}`;
        updated++;
      }
    }
  }

  console.log(`Updated ${updated} source domains`);

  const { rows: stats } = await sql`
    SELECT source_domain, COUNT(*)::int as c
    FROM news_items
    WHERE source_domain != 'news.google.com' AND source_domain IS NOT NULL
    GROUP BY source_domain ORDER BY c DESC LIMIT 20
  `;
  console.log("\nTop sources:");
  for (const s of stats) console.log(`  ${s.source_domain}: ${s.c}`);
}

main().catch(console.error);
