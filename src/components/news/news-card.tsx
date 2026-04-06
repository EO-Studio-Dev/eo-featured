"use client";

import Link from "next/link";
import Image from "next/image";
import { CategoryBadge } from "@/components/ui/category-badge";
import type { NewsItem } from "@/types/supabase";

function stripSource(headline: string): string {
  // Remove trailing " - Source Name" or " – Source" or " — Source"
  return headline.replace(/\s[-–—]\s[^-–—]+$/, "");
}

function relativeTime(dateStr: string | null): string {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

const SOURCE_DOMAIN_MAP: Record<string, string> = {
  techcrunch: "techcrunch.com",
  "business insider": "businessinsider.com",
  bloomberg: "bloomberg.com",
  "bloomberg.com": "bloomberg.com",
  forbes: "forbes.com",
  fortune: "fortune.com",
  cnbc: "cnbc.com",
  reuters: "reuters.com",
  venturebeat: "venturebeat.com",
  "the verge": "theverge.com",
  wired: "wired.com",
  axios: "axios.com",
  "the information": "theinformation.com",
  "business wire": "businesswire.com",
  "pr newswire": "prnewswire.com",
  "the next web": "thenextweb.com",
  "the business journals": "bizjournals.com",
  "analytics insight": "analyticsinsight.net",
  "yahoo finance": "finance.yahoo.com",
  "nbc bay area": "nbcbayarea.com",
  saastr: "saastr.com",
  "tom's guide": "tomsguide.com",
  "ars technica": "arstechnica.com",
  "the rundown ai": "therundown.ai",
  "pcmag": "pcmag.com",
  "inkl.com": "inkl.com",
};

function guessDomain(sourceName: string | null): string | null {
  if (!sourceName) return null;
  const lower = sourceName.toLowerCase();

  // Check mapping
  if (SOURCE_DOMAIN_MAP[lower]) return SOURCE_DOMAIN_MAP[lower];

  // If already looks like a domain
  if (lower.includes(".")) return lower;

  // Guess: remove spaces + .com
  return lower.replace(/\s+/g, "") + ".com";
}

function getFaviconUrl(sourceName: string | null): string | null {
  const domain = guessDomain(sourceName);
  if (!domain) return null;
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
}

export function NewsCard({ item }: { item: NewsItem }) {
  const thumbnail = item.appearance_thumbnail;
  const faviconUrl = getFaviconUrl(item.source_domain);

  return (
    <div className="border-[1.5px] border-border p-6 transition-colors hover:border-foreground">
      {/* Source + Category + Time */}
      <div className="flex items-center gap-3">
        {faviconUrl && (
          <Image
            src={faviconUrl}
            alt={item.source_domain || ""}
            width={20}
            height={20}
            className="shrink-0"
            unoptimized
          />
        )}
        {item.source_domain && (
          <span className="text-[13px] font-bold text-text-secondary">
            {item.source_domain}
          </span>
        )}
        <CategoryBadge category={item.category} />
        <span className="text-[11px] font-bold uppercase tracking-[0.05em] text-text-tertiary">
          {relativeTime(item.published_at)}
        </span>
      </div>

      <a
        href={item.source_url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 block"
      >
        <h3 className="font-serif text-[36px] leading-[1.15] tracking-[0] text-foreground hover:text-accent">
          {stripSource(item.headline)}
        </h3>
      </a>

      {/* Person + EO Thumbnail */}
      <div className="mt-5 flex items-center gap-4">
        {thumbnail && (
          <Link href={item.person_slug ? `/people/${item.person_slug}` : "#"} className="shrink-0">
            <div className="relative h-20 w-36 overflow-hidden border-[1.5px] border-border">
              <Image
                src={thumbnail}
                alt={item.person_name || ""}
                fill
                className="object-cover"
                sizes="144px"
              />
            </div>
          </Link>
        )}
        <div className="min-w-0 flex-1">
          <div className="text-[17px] text-text-secondary">
            {item.person_slug ? (
              <Link href={`/people/${item.person_slug}`} className="hover:text-foreground">
                {item.person_name}
              </Link>
            ) : (
              item.person_name
            )}
            {item.company_name && (
              <> · {item.company_name}</>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
