"use client";

import Link from "next/link";
import Image from "next/image";
import { CategoryBadge } from "@/components/ui/category-badge";
import type { DeduplicatedNewsItem } from "@/lib/news-dedup";

function formatTime(dateStr: string | null): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  // After 7 days: show date like Instagram (e.g., "March 28")
  return date.toLocaleDateString("en-US", { month: "long", day: "numeric" });
}

function stripSource(headline: string): string {
  return headline.replace(/\s[-–—]\s[^-–—]+$/, "");
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
  saastr: "saastr.com",
  "tom's guide": "tomsguide.com",
  "ars technica": "arstechnica.com",
  "the rundown ai": "therundown.ai",
  pcmag: "pcmag.com",
  "yahoo finance": "finance.yahoo.com",
  "fast company": "fastcompany.com",
  "fox business": "foxbusiness.com",
};

function guessDomain(sourceName: string | null): string | null {
  if (!sourceName) return null;
  const lower = sourceName.toLowerCase();
  if (SOURCE_DOMAIN_MAP[lower]) return SOURCE_DOMAIN_MAP[lower];
  if (lower.includes(".")) return lower;
  return lower.replace(/\s+/g, "") + ".com";
}

function getFaviconUrl(sourceName: string | null): string | null {
  const domain = guessDomain(sourceName);
  if (!domain) return null;
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
}

export function NewsCard({ item }: { item: DeduplicatedNewsItem }) {
  const thumbnail = item.appearance_thumbnail;
  const faviconUrl = getFaviconUrl(item.source_domain);
  const hasRelated = item.relatedSources && item.relatedSources.length > 0;

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
          {formatTime(item.published_at)}
        </span>
      </div>

      {/* Headline */}
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

      {/* Related sources */}
      {hasRelated && (
        <div className="mt-4 border-t-[1.5px] border-border pt-3">
          <span className="text-[9px] font-bold uppercase tracking-[0.1em] text-text-tertiary">
            Also covered by
          </span>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {item.relatedSources.map((src, i) => {
              const favicon = getFaviconUrl(src.domain);
              return (
                <a
                  key={i}
                  href={src.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 border-[1.5px] border-border px-2 py-1 text-[11px] text-text-tertiary transition-colors hover:border-foreground hover:text-foreground"
                >
                  {favicon && (
                    <Image
                      src={favicon}
                      alt=""
                      width={14}
                      height={14}
                      className="shrink-0"
                      unoptimized
                    />
                  )}
                  {src.domain}
                </a>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
