import { NextRequest, NextResponse } from "next/server";
import { sql } from "@vercel/postgres";
import { fetchAllVideos, parseVideoTitle, makeSlug, CHANNELS, type Channel } from "@/lib/youtube";
import { verifyCronAuth } from "@/lib/cron-auth";

export async function POST(request: NextRequest) {
  const authError = verifyCronAuth(request);
  if (authError) return authError;

  try {
    let newPeople = 0;
    let newAppearances = 0;
    let skipped = 0;
    const channelKeys = Object.keys(CHANNELS) as Channel[];

    for (const channel of channelKeys) {
    const videos = await fetchAllVideos(channel);

    for (const video of videos) {
      try {
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
          .replace(/[^a-z0-9가-힣\s-]/g, "")
          .replace(/\s+/g, "-") || `company-${Date.now()}`;

        const { rows: existingCompany } = await sql`
          SELECT id FROM companies WHERE name = ${parsed.companyName} LIMIT 1
        `;

        if (existingCompany.length > 0) {
          companyId = existingCompany[0].id;
        } else {
          const { rows: newCompany } = await sql`
            INSERT INTO companies (name, slug)
            VALUES (${parsed.companyName}, ${companySlug})
            ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
            RETURNING id
          `;
          companyId = newCompany[0].id;
        }
      }

      // Upsert person
      const { rows: existingPerson } = await sql`
        SELECT id FROM people WHERE name = ${parsed.personName} LIMIT 1
      `;

      let personId: string;
      if (existingPerson.length > 0) {
        personId = existingPerson[0].id;
        // Update company/role if we have new info
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
        const { rows: newPerson } = await sql`
          INSERT INTO people (name, slug, role, company_id, channel)
          VALUES (${parsed.personName}, ${slug}, ${parsed.role}, ${companyId}, ${channel})
          RETURNING id
        `;
        personId = newPerson[0].id;
        newPeople++;
      }

      // Upsert appearance
      const { rowCount } = await sql`
        INSERT INTO appearances (person_id, video_id, title, published_at, thumbnail_url)
        VALUES (${personId}, ${video.videoId}, ${video.title}, ${video.publishedAt}, ${video.thumbnailUrl})
        ON CONFLICT (person_id, video_id) DO NOTHING
      `;
      if (rowCount && rowCount > 0) newAppearances++;

      // Add EO appearance milestone
      await sql`
        INSERT INTO milestones (person_id, company_id, event_type, description, date, confidence)
        SELECT ${personId}, ${companyId}, 'eo_appearance', ${'EO appearance: ' + video.title}, ${video.publishedAt}::date, 1.0
        WHERE NOT EXISTS (
          SELECT 1 FROM milestones
          WHERE person_id = ${personId}
            AND event_type = 'eo_appearance'
            AND description = ${'EO appearance: ' + video.title}
        )
      `;
      } catch (e) {
        console.error(`Error processing video "${video.title}":`, e);
        skipped++;
      }
    }
    } // end channel loop

    return NextResponse.json({
      success: true,
      channels: channelKeys,
      new_people: newPeople,
      new_appearances: newAppearances,
      skipped,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("YouTube cron error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}
