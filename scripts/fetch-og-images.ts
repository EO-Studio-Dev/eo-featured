import { config } from "dotenv";
config({ path: ".env.local" });
import { sql } from "@vercel/postgres";
import { resolveRealUrl, fetchOGImage } from "../src/lib/news";
import { extractDomain } from "../src/lib/news-categorizer";

async function main() {
  // Clear old Google placeholder images
  await sql`UPDATE news_items SET og_image_url = NULL WHERE og_image_url LIKE '%google%' OR og_image_url LIKE '%gstatic%'`;

  const { rows } = await sql`
    SELECT id, source_url, headline
    FROM news_items
    WHERE og_image_url IS NULL
      AND category != 'other'
    ORDER BY confidence DESC, published_at DESC NULLS LAST
    LIMIT 100
  `;

  console.log(`Processing ${rows.length} news items...`);
  let resolved = 0;
  let images = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];

    // 1. Resolve Google News URL to real article URL
    const realUrl = await resolveRealUrl(row.source_url);

    if (realUrl) {
      resolved++;

      // Update source_url and source_domain to the real URL
      const domain = extractDomain(realUrl);
      await sql`
        UPDATE news_items
        SET source_url = ${realUrl}, source_domain = ${domain}
        WHERE id = ${row.id}
      `;

      // 2. Fetch OG image from real URL
      const ogImage = await fetchOGImage(realUrl);
      if (ogImage) {
        await sql`UPDATE news_items SET og_image_url = ${ogImage} WHERE id = ${row.id}`;
        images++;
      }
    }

    if ((i + 1) % 20 === 0) {
      console.log(`  ${i + 1}/${rows.length} — resolved: ${resolved}, images: ${images}`);
    }

    // Rate limit
    await new Promise((r) => setTimeout(r, 600));
  }

  console.log(`\nDone! Resolved: ${resolved}, OG images: ${images}, Total: ${rows.length}`);
}

main().catch(console.error);
