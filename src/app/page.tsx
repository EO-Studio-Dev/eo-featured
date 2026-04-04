import { Suspense } from "react";
import { StatsBar } from "@/components/stats/stats-bar";
import { FilterBar } from "@/components/filters/filter-bar";
import { PersonGridSkeleton } from "@/components/ui/skeleton";
import { PeopleSection } from "@/components/people/people-section";
import type { CompanyStatus } from "@/types/supabase";

// Mock data for initial development
const mockStats = {
  people_count: 324,
  company_count: 287,
  total_funding: 2_400_000_000,
  ipo_count: 12,
};

interface HomePageProps {
  searchParams: Promise<{
    status?: string;
    search?: string;
    sort?: string;
    cursor?: string;
  }>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const status = params.status as CompanyStatus | undefined;
  const search = params.search;
  const sort = (params.sort as "recent" | "name") || "recent";

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-8 md:py-12">
      {/* Hero */}
      <div className="mb-8 md:mb-12">
        <h1 className="font-serif text-3xl font-bold md:text-5xl">
          EO Featured
        </h1>
        <p className="mt-2 text-sm text-text-secondary md:text-base">
          EO가 발견한 사람들의 성장 기록
        </p>
      </div>

      {/* Stats */}
      <div className="mb-8 md:mb-10">
        <StatsBar stats={mockStats} />
      </div>

      {/* Filters */}
      <div className="mb-6 md:mb-8">
        <Suspense>
          <FilterBar />
        </Suspense>
      </div>

      {/* People Grid */}
      <Suspense fallback={<PersonGridSkeleton />}>
        <PeopleSection status={status} search={search} sort={sort} />
      </Suspense>
    </div>
  );
}
