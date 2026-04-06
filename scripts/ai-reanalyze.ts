import { config } from "dotenv";
config({ path: ".env.local" });
import { sql } from "@vercel/postgres";
import { analyzeHeadlines } from "../src/lib/news-ai";

const BATCH_SIZE = 20;

async function main() {
  const { rows } = await sql`
    SELECT n.id, n.headline, n.category, p.name as person_name, c.name as company_name
    FROM news_items n
    JOIN people p ON n.person_id = p.id
    LEFT JOIN companies c ON n.company_id = c.id
    WHERE n.story_id IS NULL
    ORDER BY n.published_at DESC NULLS LAST
  `;

  console.log(`Analyzing ${rows.length} articles with Haiku...`);
  let removed = 0;
  let recategorized = 0;
  let grouped = 0;

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const input = batch.map(r => ({
      id: r.id,
      headline: r.headline,
      personName: r.person_name,
      companyName: r.company_name,
    }));

    const results = await analyzeHeadlines(input);

    for (const row of batch) {
      const ai = results.get(row.id);
      if (!ai) continue;

      if (!ai.relevant) {
        await sql`DELETE FROM news_items WHERE id = ${row.id}`;
        removed++;
        continue;
      }

      // Update category + story_id
      const newCategory = ai.category || row.category;
      await sql`
        UPDATE news_items SET category = ${newCategory}, story_id = ${ai.story_id}
        WHERE id = ${row.id}
      `;

      if (newCategory !== row.category) recategorized++;
      if (ai.story_id) grouped++;
    }

    console.log(`  ${Math.min(i + BATCH_SIZE, rows.length)}/${rows.length} — removed: ${removed}, recategorized: ${recategorized}`);

    // Rate limit
    await new Promise(r => setTimeout(r, 500));
  }

  console.log(`\nDone!`);
  console.log(`  Removed: ${removed}`);
  console.log(`  Recategorized: ${recategorized}`);
  console.log(`  Grouped: ${grouped}`);

  const { rows: stats } = await sql`
    SELECT category, COUNT(*)::int as c FROM news_items GROUP BY category ORDER BY c DESC
  `;
  console.log("\nFinal distribution:");
  for (const s of stats) console.log(`  ${s.category}: ${s.c}`);

  // Show story groups
  const { rows: stories } = await sql`
    SELECT story_id, COUNT(*)::int as c FROM news_items WHERE story_id IS NOT NULL GROUP BY story_id HAVING COUNT(*) > 1 ORDER BY c DESC LIMIT 15
  `;
  console.log("\nTop story groups:");
  for (const s of stories) console.log(`  ${s.story_id}: ${s.c} articles`);
}

main().catch(console.error);
