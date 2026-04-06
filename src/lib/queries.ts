import { sql } from "@vercel/postgres";
import type { Person, Company, Appearance, Milestone, PeopleFilters, CompanyStatus, NewsItem, NewsCategory } from "@/types/supabase";

const PAGE_SIZE = 24;

export async function getPeople(filters: PeopleFilters = {}) {
  const limit = Math.min(filters.limit || PAGE_SIZE, 100);
  const conditions: string[] = [];
  const values: (string | number)[] = [];
  let paramIdx = 1;

  if (filters.status) {
    conditions.push(`c.status = $${paramIdx}`);
    values.push(filters.status);
    paramIdx++;
  }

  if (filters.search) {
    conditions.push(`(p.name ILIKE $${paramIdx} OR c.name ILIKE $${paramIdx})`);
    values.push(`%${filters.search}%`);
    paramIdx++;
  }

  if (filters.cursor) {
    conditions.push(`p.updated_at < $${paramIdx}`);
    values.push(filters.cursor);
    paramIdx++;
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const orderBy = filters.sort === "name" ? "p.name ASC" : "p.updated_at DESC";

  // Using tagged template won't work with dynamic WHERE, so use raw query
  const { rows } = await sql.query(
    `SELECT
      p.id, p.name, p.slug, p.photo_url, p.role,
      p.company_id, p.created_at, p.updated_at,
      c.id as company_id, c.name as company_name, c.slug as company_slug,
      c.industry, c.status as company_status, c.founded_year,
      (SELECT COUNT(*) FROM appearances a WHERE a.person_id = p.id)::int as appearance_count
    FROM people p
    LEFT JOIN companies c ON p.company_id = c.id
    ${where}
    ORDER BY ${orderBy}
    LIMIT $${paramIdx}`,
    [...values, limit]
  );

  const people = rows.map(mapPersonRow);

  return {
    people,
    nextCursor: rows.length === limit ? rows[rows.length - 1].updated_at : null,
  };
}

export async function getPersonBySlug(slug: string) {
  const { rows } = await sql`
    SELECT
      p.id, p.name, p.slug, p.photo_url, p.role,
      p.company_id, p.created_at, p.updated_at,
      c.id as company_id, c.name as company_name, c.slug as company_slug,
      c.industry, c.status as company_status, c.founded_year
    FROM people p
    LEFT JOIN companies c ON p.company_id = c.id
    WHERE p.slug = ${slug}
    LIMIT 1
  `;

  if (rows.length === 0) return null;

  const person = mapPersonRow(rows[0]);

  // Get appearances
  const { rows: appRows } = await sql`
    SELECT id, person_id, video_id, title, published_at, thumbnail_url
    FROM appearances
    WHERE person_id = ${person.id}
    ORDER BY published_at DESC
  `;
  person.appearances = appRows as Appearance[];

  // Get milestones
  const { rows: msRows } = await sql`
    SELECT id, person_id, company_id, event_type, description, date, source_url, confidence
    FROM milestones
    WHERE person_id = ${person.id}
    ORDER BY date ASC
  `;
  person.milestones = msRows as Milestone[];

  return person;
}

export async function getRelatedPeople(personId: string, companyId: string | null, limit = 4) {
  if (companyId) {
    const { rows } = await sql`
      SELECT
        p.id, p.name, p.slug, p.photo_url, p.role,
        p.company_id, p.created_at, p.updated_at,
        c.id as company_id, c.name as company_name, c.slug as company_slug,
        c.industry, c.status as company_status, c.founded_year
      FROM people p
      LEFT JOIN companies c ON p.company_id = c.id
      WHERE p.id != ${personId} AND p.company_id = ${companyId}
      LIMIT ${limit}
    `;
    return rows.map(mapPersonRow);
  }

  const { rows } = await sql`
    SELECT
      p.id, p.name, p.slug, p.photo_url, p.role,
      p.company_id, p.created_at, p.updated_at,
      c.id as company_id, c.name as company_name, c.slug as company_slug,
      c.industry, c.status as company_status, c.founded_year
    FROM people p
    LEFT JOIN companies c ON p.company_id = c.id
    WHERE p.id != ${personId}
    ORDER BY p.updated_at DESC
    LIMIT ${limit}
  `;
  return rows.map(mapPersonRow);
}

export async function getStats(channel: string = "en") {
  const { rows } = await sql`
    SELECT
      (SELECT COUNT(*) FROM people WHERE channel = ${channel})::int as people_count,
      (SELECT COUNT(DISTINCT p.company_id) FROM people p WHERE p.channel = ${channel} AND p.company_id IS NOT NULL)::int as company_count,
      (SELECT COUNT(*) FROM news_items n JOIN people p ON n.person_id = p.id WHERE p.channel = ${channel} AND n.category = 'funding')::int as funding_count,
      (SELECT COUNT(*) FROM news_items n JOIN people p ON n.person_id = p.id WHERE p.channel = ${channel} AND n.category = 'acquisition')::int as acquisition_count
  `;
  return {
    people_count: rows[0]?.people_count || 0,
    company_count: rows[0]?.company_count || 0,
    funding_count: rows[0]?.funding_count || 0,
    acquisition_count: rows[0]?.acquisition_count || 0,
  };
}

// -- news queries --

export async function getRecentNews(filters?: { category?: NewsCategory; limit?: number; offset?: number; excludeOther?: boolean; channel?: string }): Promise<NewsItem[]> {
  const limit = Math.min(filters?.limit || 12, 50);
  const offset = Math.max(filters?.offset || 0, 0);
  const channel = filters?.channel || "en";

  const conditions: string[] = [];
  const values: (string | number)[] = [];
  let idx = 1;

  conditions.push(`p.channel = $${idx}`); values.push(channel); idx++;
  if (filters?.category) { conditions.push(`n.category = $${idx}`); values.push(filters.category); idx++; }
  if (filters?.excludeOther) { conditions.push(`n.category != 'other'`); }

  const where = `WHERE ${conditions.join(" AND ")}`;

  const { rows } = await sql.query(`
    SELECT
      n.id, n.person_id, n.company_id, n.category, n.headline, n.summary,
      n.source_url, n.source_domain, n.published_at, n.discovered_at, n.confidence, n.og_image_url, n.story_id,
      p.name as person_name, p.slug as person_slug, p.photo_url as person_photo,
      c.name as company_name,
      (SELECT a.thumbnail_url FROM appearances a WHERE a.person_id = n.person_id ORDER BY a.published_at DESC LIMIT 1) as appearance_thumbnail
    FROM news_items n
    LEFT JOIN people p ON n.person_id = p.id
    LEFT JOIN companies c ON n.company_id = c.id
    ${where}
    ORDER BY COALESCE(n.published_at, n.discovered_at) DESC
    LIMIT $${idx} OFFSET $${idx + 1}
  `, [...values, limit, offset]);
  return rows as NewsItem[];
}

export async function getNewsForPerson(personId: string): Promise<NewsItem[]> {
  const { rows } = await sql`
    SELECT
      n.id, n.person_id, n.company_id, n.category, n.headline, n.summary,
      n.source_url, n.source_domain, n.published_at, n.discovered_at, n.confidence, n.og_image_url, n.story_id,
      c.name as company_name
    FROM news_items n
    LEFT JOIN companies c ON n.company_id = c.id
    WHERE n.person_id = ${personId}
    ORDER BY COALESCE(n.published_at, n.discovered_at) DESC
    LIMIT 20
  `;
  return rows as NewsItem[];
}

// -- helpers --

function mapPersonRow(row: Record<string, unknown>): Person {
  const company: Company | undefined = row.company_id
    ? {
        id: row.company_id as string,
        name: row.company_name as string,
        slug: row.company_slug as string,
        industry: row.industry as string | null,
        status: (row.company_status || "active") as CompanyStatus,
        founded_year: row.founded_year as number | null,
      }
    : undefined;

  return {
    id: row.id as string,
    name: row.name as string,
    slug: row.slug as string,
    photo_url: row.photo_url as string | null,
    role: row.role as string | null,
    company_id: row.company_id as string | null,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
    company,
    appearances: row.appearance_count !== undefined
      ? [{ count: row.appearance_count as number }] as unknown as Appearance[]
      : undefined,
  };
}
