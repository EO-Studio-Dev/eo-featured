import { config } from "dotenv";
config({ path: ".env.local" });
import { sql } from "@vercel/postgres";
import { isHeadlineRelevant } from "../src/lib/news-filter";

async function main() {
  const { rows } = await sql`
    SELECT n.id, n.headline, n.source_domain, p.name as person_name, c.name as company_name
    FROM news_items n
    JOIN people p ON n.person_id = p.id
    LEFT JOIN companies c ON n.company_id = c.id
  `;

  console.log(`Checking ${rows.length} news items for relevance...`);
  let removed = 0;

  for (const row of rows) {
    if (!isHeadlineRelevant(row.headline, row.person_name, row.company_name, row.source_domain)) {
      await sql`DELETE FROM news_items WHERE id = ${row.id}`;
      removed++;
    }
  }

  console.log(`Removed ${removed} irrelevant items`);

  const { rows: stats } = await sql`
    SELECT category, COUNT(*)::int as c FROM news_items GROUP BY category ORDER BY c DESC
  `;
  console.log("\nRemaining distribution:");
  for (const s of stats) console.log(`  ${s.category}: ${s.c}`);

  const { rows: total } = await sql`SELECT COUNT(*)::int as c FROM news_items`;
  console.log(`\nTotal: ${total[0].c}`);
}

main().catch(console.error);
