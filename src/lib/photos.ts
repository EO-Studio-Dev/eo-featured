import { sql } from "@vercel/postgres";

export async function assignYouTubeThumbnails() {
  // Find people without photos who have appearances
  const { rows } = await sql`
    SELECT DISTINCT ON (p.id)
      p.id as person_id,
      a.thumbnail_url
    FROM people p
    JOIN appearances a ON a.person_id = p.id
    WHERE p.photo_url IS NULL
      AND a.thumbnail_url IS NOT NULL
      AND a.thumbnail_url != ''
    ORDER BY p.id, a.published_at DESC
  `;

  let updated = 0;
  for (const row of rows) {
    await sql`
      UPDATE people
      SET photo_url = ${row.thumbnail_url}, photo_source = 'youtube'
      WHERE id = ${row.person_id} AND photo_url IS NULL
    `;
    updated++;
  }

  return { updated, total: rows.length };
}
