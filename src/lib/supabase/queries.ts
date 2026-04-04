import "server-only";
import { createServerClient } from "./server";
import type { Person, PeopleFilters, StatsCache } from "@/types/supabase";

const PAGE_SIZE = 24;

export async function getPeople(filters: PeopleFilters = {}) {
  const supabase = createServerClient();
  const limit = filters.limit || PAGE_SIZE;

  let query = supabase
    .from("people")
    .select(
      `
      *,
      company:companies(*),
      appearances(count)
    `
    )
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (filters.status) {
    query = query.eq("company.status", filters.status);
  }

  if (filters.search) {
    query = query.or(
      `name.ilike.%${filters.search}%,company.name.ilike.%${filters.search}%`
    );
  }

  if (filters.cursor) {
    query = query.lt("updated_at", filters.cursor);
  }

  const { data, error } = await query;

  if (error) throw error;

  return {
    people: (data || []) as (Person & {
      appearances: [{ count: number }];
    })[],
    nextCursor:
      data && data.length === limit
        ? data[data.length - 1].updated_at
        : null,
  };
}

export async function getPersonBySlug(slug: string) {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("people")
    .select(
      `
      *,
      company:companies(*),
      appearances(*),
      milestones(*)
    `
    )
    .eq("slug", slug)
    .single();

  if (error) throw error;
  return data as Person;
}

export async function getRelatedPeople(
  personId: string,
  companyId: string | null,
  limit = 4
) {
  const supabase = createServerClient();

  let query = supabase
    .from("people")
    .select("*, company:companies(*)")
    .neq("id", personId)
    .limit(limit);

  if (companyId) {
    query = query.eq("current_company_id", companyId);
  }

  const { data } = await query;
  return (data || []) as Person[];
}

export async function getStats(): Promise<Record<string, number>> {
  const supabase = createServerClient();

  const { data } = await supabase.from("stats_cache").select("key, value");

  const stats: Record<string, number> = {};
  for (const row of data || []) {
    stats[row.key] = row.value;
  }
  return stats;
}
