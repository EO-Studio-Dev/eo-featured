import { config } from "dotenv";
config({ path: ".env.local" });
import { sql } from "@vercel/postgres";

/**
 * Fix cases where person name and company name got swapped.
 * Pattern: person.name looks like a company, company.name looks like a person
 *
 * Detection: if company name matches "FirstName LastName" pattern
 * and person name doesn't, they're likely swapped.
 */
async function main() {
  // Find people where company name looks like a person name
  const { rows } = await sql`
    SELECT p.id as person_id, p.name as person_name, p.slug,
           c.id as company_id, c.name as company_name, c.slug as company_slug
    FROM people p
    JOIN companies c ON p.company_id = c.id
  `;

  const personNamePattern = /^[A-Z][a-z]+ [A-Z][a-z]+$/;
  let fixed = 0;

  for (const row of rows) {
    const companyLooksLikePerson = personNamePattern.test(row.company_name);
    const personLooksLikeCompany = !personNamePattern.test(row.person_name) && row.person_name.length < 30;

    if (companyLooksLikePerson && personLooksLikeCompany) {
      console.log(`SWAP: "${row.person_name}" (person) ↔ "${row.company_name}" (company)`);

      // The current "person name" is actually the company
      // The current "company name" is actually the person
      const realPersonName = row.company_name;
      const realCompanyName = row.person_name;

      // Check if a company with the real name already exists
      const { rows: existingCompany } = await sql`
        SELECT id FROM companies WHERE name = ${realCompanyName} LIMIT 1
      `;

      let realCompanyId: string;
      if (existingCompany.length > 0) {
        realCompanyId = existingCompany[0].id;
      } else {
        // Create the company
        const slug = realCompanyName.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-");
        const { rows: created } = await sql`
          INSERT INTO companies (name, slug) VALUES (${realCompanyName}, ${slug})
          ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
          RETURNING id
        `;
        realCompanyId = created[0].id;
      }

      // Update the person
      const personSlug = realPersonName.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-") + "-" + Math.random().toString(36).substring(2, 6);
      await sql`
        UPDATE people SET name = ${realPersonName}, slug = ${personSlug}, company_id = ${realCompanyId}
        WHERE id = ${row.person_id}
      `;

      fixed++;
    }
  }

  console.log(`\nFixed ${fixed} swapped names`);

  // Clean up orphaned companies (no people reference them)
  const { rowCount } = await sql`
    DELETE FROM companies WHERE id NOT IN (SELECT DISTINCT company_id FROM people WHERE company_id IS NOT NULL)
  `;
  console.log(`Cleaned up ${rowCount} orphaned companies`);
}

main().catch(console.error);
