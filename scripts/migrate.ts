import { config } from "dotenv";
config({ path: ".env.local" });
import { sql } from "@vercel/postgres";

async function migrate() {
  console.log("Running migrations...");

  await sql`
    CREATE TABLE IF NOT EXISTS companies (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL UNIQUE,
      slug TEXT NOT NULL UNIQUE,
      industry TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      founded_year INTEGER,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  console.log("✓ companies");

  await sql`
    CREATE TABLE IF NOT EXISTS people (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      photo_url TEXT,
      role TEXT,
      company_id UUID REFERENCES companies(id),
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  console.log("✓ people");

  await sql`
    CREATE TABLE IF NOT EXISTS appearances (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      person_id UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
      video_id TEXT NOT NULL,
      title TEXT NOT NULL,
      published_at TIMESTAMPTZ NOT NULL,
      thumbnail_url TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE(person_id, video_id)
    )
  `;
  console.log("✓ appearances");

  await sql`
    CREATE TABLE IF NOT EXISTS milestones (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      person_id UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
      company_id UUID REFERENCES companies(id),
      event_type TEXT NOT NULL DEFAULT 'other',
      description TEXT NOT NULL,
      date DATE NOT NULL,
      source_url TEXT,
      confidence REAL NOT NULL DEFAULT 0.5,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  console.log("✓ milestones");

  // Indexes
  await sql`CREATE INDEX IF NOT EXISTS idx_people_slug ON people(slug)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_people_updated ON people(updated_at DESC)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_people_company ON people(company_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_appearances_person ON appearances(person_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_appearances_video ON appearances(video_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_milestones_person ON milestones(person_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_companies_slug ON companies(slug)`;
  console.log("✓ indexes");

  console.log("Migration complete!");
}

migrate().catch(console.error);
