import { sql } from "@vercel/postgres";
import Anthropic from "@anthropic-ai/sdk";

interface MilestoneCandidate {
  index: number;
  worthy: boolean;
  event_type: string;
  summary: string;
}

/**
 * Analyze recent news items and create milestones for significant events.
 * Called after news collection in the cron job.
 */
export async function convertNewsToMilestones(personId: string): Promise<number> {
  if (!process.env.ANTHROPIC_API_KEY) return 0;

  // Get uncategorized news for this person
  const { rows } = await sql`
    SELECT n.id, n.headline, n.category, n.published_at,
           p.name as person_name, c.name as company_name
    FROM news_items n
    JOIN people p ON n.person_id = p.id
    LEFT JOIN companies c ON n.company_id = c.id
    WHERE n.person_id = ${personId}
      AND n.category != 'other'
      AND n.confidence >= 0.5
      AND NOT EXISTS (
        SELECT 1 FROM milestones m
        WHERE m.person_id = n.person_id
          AND m.event_type != 'eo_appearance'
          AND ABS(EXTRACT(EPOCH FROM (m.date - n.published_at::date))) < 86400 * 3
          AND m.event_type = n.category
      )
    ORDER BY n.published_at DESC
    LIMIT 10
  `;

  const items = rows as { id: string; headline: string; category: string; published_at: string; person_name: string; company_name: string | null }[];
  if (items.length === 0) return 0;

  const client = new Anthropic();
  const list = items.map((item, i) =>
    `[${i}] "${item.headline}" — ${item.category}, ${item.published_at}`
  ).join("\n");

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1000,
    messages: [{
      role: "user",
      content: `Which of these headlines represent MAJOR milestones for ${items[0].person_name} (${items[0].company_name || ""})?

Milestones: significant funding ($10M+), acquisition, IPO, major product launch, key award.
NOT milestones: interviews, opinion pieces, minor updates, conference appearances.

For each worthy item, write a SHORT summary (max 15 words, no source name).

${list}

JSON array (only worthy items): [{"index": 0, "worthy": true, "event_type": "funding", "summary": "Raised $50M Series B"}]`
    }],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) return 0;

  let created = 0;
  try {
    const candidates = JSON.parse(jsonMatch[0]) as MilestoneCandidate[];

    for (const c of candidates) {
      if (!c.worthy || c.index < 0 || c.index >= items.length) continue;
      const item = items[c.index];

      try {
        await sql`
          INSERT INTO milestones (person_id, company_id, event_type, description, date, confidence)
          SELECT ${personId}, ${item.company_name ? null : null}::uuid, ${c.event_type}, ${c.summary}, ${item.published_at}::date, 0.8
          WHERE NOT EXISTS (
            SELECT 1 FROM milestones
            WHERE person_id = ${personId}
              AND description = ${c.summary}
          )
        `;
        created++;
      } catch {
        // skip
      }
    }
  } catch {
    // parse error
  }

  return created;
}
