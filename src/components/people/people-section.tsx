import { PersonGrid } from "./person-grid";
import { getPeople } from "@/lib/queries";
import type { CompanyStatus } from "@/types/supabase";

interface PeopleSectionProps {
  status?: CompanyStatus;
  search?: string;
  sort?: "recent" | "name";
}

export async function PeopleSection({ status, search, sort = "recent" }: PeopleSectionProps) {
  let people: Parameters<typeof PersonGrid>[0]["people"] = [];

  try {
    const result = await getPeople({ status, search, sort });
    people = result.people.map((p) => {
      // appearance_count comes back as a pseudo-field from the query
      const appCount = (p.appearances as unknown as { count: number }[] | undefined)?.[0]?.count ?? 0;
      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        photo_url: p.photo_url,
        role: p.role,
        company: p.company ? { name: p.company.name, status: p.company.status } : undefined,
        appearances: [{ count: appCount }],
      };
    });
  } catch {
    // DB not connected — show empty state
  }

  return <PersonGrid people={people} />;
}
