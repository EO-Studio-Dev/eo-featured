import { Suspense } from "react";
import { StatsBar } from "@/components/stats/stats-bar";
import { NewsGridSkeleton } from "@/components/ui/skeleton";
import { NewsSection } from "@/components/news/news-section";
import { getStats } from "@/lib/queries";

interface HomePageProps {
  searchParams: Promise<{
    channel?: string;
  }>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const channel = params.channel || "en";

  let stats = { people_count: 0, company_count: 0, funding_count: 0, acquisition_count: 0 };
  try {
    stats = await getStats(channel);
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
        <Suspense fallback={<NewsGridSkeleton />}>
          <NewsSection channel={channel} />
        </Suspense>
      </div>
    </div>
  );
}
