import { config } from "dotenv";
config({ path: ".env.local" });

import { sql } from "@vercel/postgres";
import { fetchAllVideos, parseVideoTitle, makeSlug } from "../src/lib/youtube";

async function seed() {
  console.log("Fetching all videos from EO Global...");
  const videos = await fetchAllVideos();
  console.log(`Found ${videos.length} videos`);

  let newPeople = 0;
  let newAppearances = 0;
  let skipped = 0;

  for (const video of videos) {
    const parsed = parseVideoTitle(video.title);
    if (!parsed.personName) {
      skipped++;
      continue;
    }

    // Upsert company
    let companyId: string | null = null;
    if (parsed.companyName) {
      const companySlug = parsed.companyName
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-") || `company-${Date.now()}`;

      const { rows: existing } = await sql`
        SELECT id FROM companies WHERE name = ${parsed.companyName} LIMIT 1
      `;

      if (existing.length > 0) {
        companyId = existing[0].id;
      } else {
        const { rows: created } = await sql`
          INSERT INTO companies (name, slug)
          VALUES (${parsed.companyName}, ${companySlug})
          ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
          RETURNING id
        `;
        companyId = created[0].id;
      }
    }

    // Upsert person
    const { rows: existingPerson } = await sql`
      SELECT id FROM people WHERE name = ${parsed.personName} LIMIT 1
    `;

    let personId: string;
    if (existingPerson.length > 0) {
      personId = existingPerson[0].id;
      if (companyId || parsed.role) {
        await sql`
          UPDATE people SET
            company_id = COALESCE(${companyId}, company_id),
            role = COALESCE(${parsed.role}, role),
            updated_at = now()
          WHERE id = ${personId}
        `;
      }
    } else {
      const slug = makeSlug(parsed.personName);
      const { rows: created } = await sql`
        INSERT INTO people (name, slug, role, company_id)
        VALUES (${parsed.personName}, ${slug}, ${parsed.role}, ${companyId})
        RETURNING id
      `;
      personId = created[0].id;
      newPeople++;
      console.log(`  + ${parsed.personName} (${parsed.companyName || "no company"})`);
    }

    // Upsert appearance
    const { rowCount } = await sql`
      INSERT INTO appearances (person_id, video_id, title, published_at, thumbnail_url)
      VALUES (${personId}, ${video.videoId}, ${video.title}, ${video.publishedAt}, ${video.thumbnailUrl})
      ON CONFLICT (person_id, video_id) DO NOTHING
    `;
    if (rowCount && rowCount > 0) newAppearances++;

    // Add milestone
    const desc = "EO appearance: " + video.title;
    await sql`
      INSERT INTO milestones (person_id, company_id, event_type, description, date, confidence)
      SELECT ${personId}, ${companyId}, 'eo_appearance', ${desc}, ${video.publishedAt}::date, 1.0
      WHERE NOT EXISTS (
        SELECT 1 FROM milestones
        WHERE person_id = ${personId}
          AND event_type = 'eo_appearance'
          AND description = ${desc}
      )
    `;
  }

  console.log(`\nDone!`);
  console.log(`  Videos processed: ${videos.length}`);
  console.log(`  New people: ${newPeople}`);
  console.log(`  New appearances: ${newAppearances}`);
  console.log(`  Skipped (no name parsed): ${skipped}`);

  // Show stats
  const { rows } = await sql`
    SELECT
      (SELECT COUNT(*) FROM people)::int as people,
      (SELECT COUNT(*) FROM companies)::int as companies,
      (SELECT COUNT(*) FROM appearances)::int as appearances
  `;
  console.log(`\nDB stats: ${rows[0].people} people, ${rows[0].companies} companies, ${rows[0].appearances} appearances`);
}

seed().catch(console.error);
