import { config } from "dotenv";
config({ path: ".env.local" });
import { sql } from "@vercel/postgres";
import { fetchAllVideos, parseVideoTitle, makeSlug, type Channel } from "../src/lib/youtube";

const channel = (process.argv[2] || "kr") as Channel;

async function seed() {
  console.log(`Seeding channel: ${channel}`);
  const videos = await fetchAllVideos(channel);
  console.log(`Found ${videos.length} videos`);

  let newPeople = 0;
  let newAppearances = 0;

  for (const video of videos) {
    const parsed = parseVideoTitle(video.title);
    if (!parsed.personName) continue;

    let companyId: string | null = null;
    if (parsed.companyName) {
      const companySlug = parsed.companyName.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-") || `company-${Date.now()}`;
      const { rows: existing } = await sql`SELECT id FROM companies WHERE name = ${parsed.companyName} LIMIT 1`;
      if (existing.length > 0) {
        companyId = existing[0].id;
      } else {
        const { rows: created } = await sql`
          INSERT INTO companies (name, slug) VALUES (${parsed.companyName}, ${companySlug})
          ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id
        `;
        companyId = created[0].id;
      }
    }

    const { rows: existingPerson } = await sql`SELECT id FROM people WHERE name = ${parsed.personName} AND channel = ${channel} LIMIT 1`;
    let personId: string;
    if (existingPerson.length > 0) {
      personId = existingPerson[0].id;
      if (companyId) {
        await sql`UPDATE people SET company_id = COALESCE(${companyId}, company_id), updated_at = now() WHERE id = ${personId}`;
      }
    } else {
      const slug = makeSlug(parsed.personName);
      const { rows: created } = await sql`
        INSERT INTO people (name, slug, role, company_id, channel) VALUES (${parsed.personName}, ${slug}, ${parsed.role}, ${companyId}, ${channel}) RETURNING id
      `;
      personId = created[0].id;
      newPeople++;
      console.log(`  + ${parsed.personName} (${parsed.companyName || "no company"})`);
    }

    const { rowCount } = await sql`
      INSERT INTO appearances (person_id, video_id, title, published_at, thumbnail_url)
      VALUES (${personId}, ${video.videoId}, ${video.title}, ${video.publishedAt}, ${video.thumbnailUrl})
      ON CONFLICT (person_id, video_id) DO NOTHING
    `;
    if (rowCount && rowCount > 0) newAppearances++;
  }

  console.log(`\nDone! New people: ${newPeople}, New appearances: ${newAppearances}`);

  // Assign photos
  const { rows: noPhoto } = await sql`
    SELECT DISTINCT ON (p.id) p.id, a.thumbnail_url
    FROM people p JOIN appearances a ON a.person_id = p.id
    WHERE p.photo_url IS NULL AND p.channel = ${channel} AND a.thumbnail_url IS NOT NULL
    ORDER BY p.id, a.published_at DESC
  `;
  for (const row of noPhoto) {
    await sql`UPDATE people SET photo_url = ${row.thumbnail_url}, photo_source = 'youtube' WHERE id = ${row.id}`;
  }
  console.log(`Photos assigned: ${noPhoto.length}`);
}

seed().catch(console.error);
