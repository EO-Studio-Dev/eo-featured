import { NextRequest, NextResponse } from "next/server";
import { getPeople } from "@/lib/queries";
import type { CompanyStatus, PeopleFilters } from "@/types/supabase";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const filters: PeopleFilters = {
    status: (searchParams.get("status") as CompanyStatus) || undefined,
    search: searchParams.get("search") || undefined,
    sort: (searchParams.get("sort") as PeopleFilters["sort"]) || "recent",
    cursor: searchParams.get("cursor") || undefined,
    limit: Number(searchParams.get("limit")) || 24,
  };

  try {
    const { people, nextCursor } = await getPeople(filters);
    return NextResponse.json({ people, nextCursor }, {
      headers: { "Access-Control-Allow-Origin": "*" },
    });
  } catch (error) {
    console.error("People API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
