import { config } from "dotenv";
config({ path: ".env.local" });
import { sql } from "@vercel/postgres";
import Anthropic from "@anthropic-ai/sdk";

const BATCH_SIZE = 20;

interface MilestoneCandidate {
  index: number;
  worthy: boolean;
  event_type: string;
  summary: string;
  date: string;
}

async function analyzeBatch(
  items: { id: string; headline: string; category: string; published_at: string; person_name: string; company_name: string | null }[]
): Promise<MilestoneCandidate[]> {
  const client = new Anthropic();

  const list = items.map((item, i) =>
    `[${i}] "${item.headline}" — Category: ${item.category}, Date: ${item.published_at}, Person: ${item.person_name}, Company: ${item.company_name || "N/A"}`
  ).join("\n");

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 2000,
    messages: [{
      role: "user",
      content: `Analyze these news headlines and determine which ones represent significant milestones worthy of appearing on a person/company timeline.

A milestone is a MAJOR event like:
- Raised significant funding (Series A+, $10M+)
- Company acquired or sold
- IPO or going public
- Major product launch
- Significant award or recognition
- Key leadership change (CEO appointment etc.)

NOT milestones: opinion pieces, interviews, minor updates, conference talks, general industry news.

For each worthy headline, generate a SHORT timeline summary (max 15 words, no source name).

Headlines:
${list}

Respond as JSON array:
[{"index": 0, "worthy": true, "event_type": "funding", "summary": "Raised $50M Series B led by Sequoia", "date": "2026-04-01"}]

Only include items where worthy=true. event_type must be one of: funding, ipo, acquisition, launch, award, hire, other.`
    }],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) return [];

  try {
    return JSON.parse(jsonMatch[0]) as MilestoneCandidate[];
  } catch {
    return [];
  }
}

async function main() {
  // Get news items that haven't been converted to milestones yet
  // Only consider categorized (non-other) news with high confidence
  const { rows } = await sql`
    SELECT n.id, n.headline, n.category, n.published_at, n.person_id, n.company_id,
           p.name as person_name, c.name as company_name
    FROM news_items n
    JOIN people p ON n.person_id = p.id
    LEFT JOIN companies c ON n.company_id = c.id
    WHERE n.category != 'other'
      AND n.confidence >= 0.5
      AND NOT EXISTS (
        SELECT 1 FROM milestones m
        WHERE m.person_id = n.person_id
          AND m.description ILIKE '%' || LEFT(n.headline, 30) || '%'
      )
    ORDER BY n.published_at DESC
  `;

  console.log(`Analyzing ${rows.length} news items for milestone candidates...`);
  let created = 0;

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const candidates = await analyzeBatch(batch);

    for (const c of candidates) {
      if (!c.worthy || c.index < 0 || c.index >= batch.length) continue;

      const item = batch[c.index];
      const date = c.date || item.published_at;

      try {
        await sql`
          INSERT INTO milestones (person_id, company_id, event_type, description, date, source_url, confidence)
          VALUES (${item.person_id}, ${item.company_id}, ${c.event_type}, ${c.summary}, ${date}::date, ${null}, 0.8)
        `;
        created++;
        console.log(`  + [${c.event_type}] ${item.person_name}: ${c.summary}`);
      } catch (e) {
        // skip duplicates
      }
    }

    console.log(`  ${Math.min(i + BATCH_SIZE, rows.length)}/${rows.length} processed, ${created} milestones created`);
    await new Promise(r => setTimeout(r, 500));
  }

  console.log(`\nDone! Created ${created} new milestones`);

  const { rows: stats } = await sql`
    SELECT event_type, COUNT(*)::int as c FROM milestones WHERE event_type != 'eo_appearance' GROUP BY event_type ORDER BY c DESC
  `;
  console.log("\nMilestone distribution (excl. EO appearances):");
  for (const s of stats) console.log(`  ${s.event_type}: ${s.c}`);
}

main().catch(console.error);
