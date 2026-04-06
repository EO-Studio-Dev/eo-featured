import { Suspense } from "react";
import { StatsBar } from "@/components/stats/stats-bar";
import { FilterBar } from "@/components/filters/filter-bar";
import { PersonGridSkeleton } from "@/components/ui/skeleton";
import { PeopleSection } from "@/components/people/people-section";
import { NewsSection } from "@/components/news/news-section";
import { getStats } from "@/lib/queries";
import type { CompanyStatus } from "@/types/supabase";

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

  let stats = { people_count: 0, company_count: 0, funding_count: 0, acquisition_count: 0 };
  try {
    stats = await getStats();
  } catch {
    // DB not connected
  }

  return (
    <div className="mx-auto max-w-[1400px] px-5 py-10">
      {/* Hero */}
      <div className="grid grid-cols-12 gap-5">
        <div className="col-span-12 lg:col-span-8">
          <h1 className="font-serif text-[64px] italic leading-[0.9] tracking-[-1.5px] text-foreground md:text-[96px] lg:text-[128px]">
            EO<br />
            <span className="text-accent">FEATURED</span>
          </h1>
          <p className="mt-6 max-w-[500px] text-[13px] leading-[1.4] text-text-secondary">
            Tracking the growth stories of people featured on the EO YouTube channel.
            Automatically collected and updated by AI from public sources.
          </p>
        </div>
        <div className="col-span-12 lg:col-span-4">
          <StatsBar stats={stats} />
        </div>
      </div>

      {/* News Feed */}
      <div className="mt-16 border-t-[1.5px] border-border pt-6">
        <Suspense fallback={<NewsSkeleton />}>
          <NewsSection />
        </Suspense>
      </div>

    </div>
  );
}

function NewsSkeleton() {
  return (
    <div>
      <div className="mb-6 h-3 w-32 animate-pulse bg-elevated" />
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="border-[1.5px] border-border p-5">
            <div className="h-3 w-20 animate-pulse bg-elevated" />
            <div className="mt-3 h-5 w-full animate-pulse bg-elevated" />
            <div className="mt-2 h-5 w-3/4 animate-pulse bg-elevated" />
            <div className="mt-3 h-3 w-40 animate-pulse bg-elevated" />
          </div>
        ))}
      </div>
    </div>
  );
}
