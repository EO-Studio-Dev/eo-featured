import { config } from "dotenv";
config({ path: ".env.local" });
import { sql } from "@vercel/postgres";

async function migrateNews() {
  console.log("Running news migration...");

  await sql`
    CREATE TABLE IF NOT EXISTS news_items (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      person_id UUID REFERENCES people(id) ON DELETE CASCADE,
      company_id UUID REFERENCES companies(id),
      category TEXT NOT NULL DEFAULT 'other',
      headline TEXT NOT NULL,
      summary TEXT,
      source_url TEXT NOT NULL,
      source_domain TEXT,
      published_at TIMESTAMPTZ,
      discovered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      confidence REAL NOT NULL DEFAULT 0.5,
      UNIQUE(person_id, source_url)
    )
  `;
  console.log("✓ news_items table");

  await sql`CREATE INDEX IF NOT EXISTS idx_news_person ON news_items(person_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_news_published ON news_items(published_at DESC)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_news_category ON news_items(category)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_news_discovered ON news_items(discovered_at DESC)`;
  console.log("✓ news indexes");

  await sql`ALTER TABLE people ADD COLUMN IF NOT EXISTS photo_source TEXT`;
  console.log("✓ people.photo_source column");

  console.log("News migration complete!");
}

migrateNews().catch(console.error);
