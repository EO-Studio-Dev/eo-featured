import { config } from "dotenv";
config({ path: ".env.local" });
import { sql } from "@vercel/postgres";
import { categorize } from "../src/lib/news-categorizer";

async function reclassify() {
  // Reclassify ALL items, not just 'other'
  const { rows } = await sql`SELECT id, headline, category FROM news_items`;
  console.log(`Reclassifying ${rows.length} news items...`);

  let changed = 0;
  for (const row of rows) {
    const newCategory = categorize(row.headline);
    if (newCategory !== row.category) {
      await sql`UPDATE news_items SET category = ${newCategory} WHERE id = ${row.id}`;
      changed++;
    }
  }

  console.log(`Changed ${changed} items`);

  const { rows: stats } = await sql`
    SELECT category, COUNT(*)::int as count FROM news_items GROUP BY category ORDER BY count DESC
  `;
  console.log("\nUpdated distribution:");
  for (const s of stats) console.log(`  ${s.category}: ${s.count}`);
}

reclassify().catch(console.error);
