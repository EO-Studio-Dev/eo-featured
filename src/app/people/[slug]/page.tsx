import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft, AlertTriangle, Video } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/ui/badge";
import { Timeline } from "@/components/timeline/timeline";
import { NewsCard } from "@/components/news/news-card";
import { getPersonBySlug, getRelatedPeople, getNewsForPerson } from "@/lib/queries";
import type { Metadata } from "next";

interface PersonDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: PersonDetailPageProps): Promise<Metadata> {
  const { slug } = await params;

  try {
    const person = await getPersonBySlug(slug);
    if (!person) return { title: "EO Featured" };
    return {
      title: `${person.name} — EO Featured`,
      description: person.role
        ? `${person.name} · ${person.company?.name ?? ""} ${person.role}`
        : `${person.name} — EO Featured`,
    };
  } catch {
    return { title: "EO Featured" };
  }
}

export default async function PersonDetailPage({
  params,
}: PersonDetailPageProps) {
  const { slug } = await params;

  let person;
  try {
    person = await getPersonBySlug(slug);
  } catch {
    notFound();
  }

  if (!person) {
    notFound();
  }

  const related = await getRelatedPeople(
    person.id,
    person.company_id
  ).catch(() => []);

  const news = await getNewsForPerson(person.id).catch(() => []);

  return (
    <div className="mx-auto max-w-[1400px] px-5 py-10">
      {/* Back */}
      <Link
        href="/"
        className="mb-8 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.1em] text-text-tertiary transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3 w-3" />
        BACK
      </Link>

      <div className="grid grid-cols-12 gap-5">
        {/* Left: Profile */}
        <div className="col-span-12 space-y-5 lg:col-span-5">
          {/* Profile header */}
          <div className="border-[1.5px] border-border p-6">
            <div className="flex items-start gap-4">
              <Avatar src={person.photo_url} name={person.name} size="lg" />
              <div>
                <h1 className="font-title text-[36px] font-semibold leading-[0.95] tracking-[-0.03em] text-foreground">
                  {person.name}
                </h1>
                <p className="mt-2 text-[11px] uppercase tracking-[0.05em] text-text-tertiary">
                  {[person.company?.name, person.role].filter(Boolean).join(" · ")}
                </p>
                <div className="mt-3">
                  <StatusBadge status={person.company?.status || "active"} />
                </div>
              </div>
            </div>
          </div>

          {/* Company Info */}
          <div className="border-[1.5px] border-border p-6">
            <h2 className="mb-3 text-[10px] font-bold uppercase tracking-[0.1em] text-text-tertiary">
              Company
            </h2>
            <div className="space-y-1 text-[13px]">
              <p className="text-foreground">{person.company?.name}</p>
              <p className="text-text-secondary">
                {person.company?.industry} · Founded {person.company?.founded_year}
              </p>
            </div>
          </div>

          {/* EO Appearances */}
          <div className="border-[1.5px] border-border p-6">
            <h2 className="mb-4 text-[10px] font-bold uppercase tracking-[0.1em] text-text-tertiary">
              EO Appearances
            </h2>
            <div className="space-y-0">
              {(person.appearances ?? []).map((appearance) => (
                <a
                  key={appearance.id}
                  href={`https://youtube.com/watch?v=${appearance.video_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex gap-3 border-t-[1.5px] border-border p-3 transition-colors first:border-t-0 hover:bg-elevated"
                >
                  {appearance.thumbnail_url ? (
                    <div className="relative h-16 w-28 shrink-0 overflow-hidden">
                      <Image
                        src={appearance.thumbnail_url}
                        alt={appearance.title}
                        fill
                        className="object-cover"
                        sizes="112px"
                        style={{ filter: "grayscale(0.5)" }}
                      />
                    </div>
                  ) : (
                    <div className="flex h-16 w-28 shrink-0 items-center justify-center border-[1.5px] border-border">
                      <Video className="h-5 w-5 text-accent" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1 pt-0.5">
                    <p className="line-clamp-2 text-[12px] text-text-secondary group-hover:text-foreground">
                      {appearance.title}
                    </p>
                    <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.1em] text-text-tertiary">
                      {new Date(appearance.published_at).toLocaleDateString("en-US")}
                    </p>
                  </div>
                </a>
              ))}
            </div>
          </div>

          {/* Related People */}
          {related.length > 0 && (
            <div className="border-[1.5px] border-border p-6">
              <h2 className="mb-4 text-[10px] font-bold uppercase tracking-[0.1em] text-text-tertiary">
                Related
              </h2>
              <div className="space-y-0">
                {related.map((rel) => (
                  <Link
                    key={rel.id}
                    href={`/people/${rel.slug}`}
                    className="flex items-center gap-3 border-t-[1.5px] border-border p-3 transition-colors first:border-t-0 hover:bg-elevated"
                  >
                    <Avatar
                      src={rel.photo_url}
                      name={rel.name}
                      size="sm"
                    />
                    <div>
                      <p className="font-title text-[14px] font-semibold tracking-[-0.03em] text-foreground">
                        {rel.name}
                      </p>
                      <p className="text-[10px] uppercase tracking-[0.05em] text-text-tertiary">
                        {rel.company?.name} · {rel.role}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Timeline + AI Summary */}
        <div className="col-span-12 space-y-5 lg:col-span-7">
          {/* Timeline */}
          <div className="border-[1.5px] border-border p-6">
            <h2 className="mb-4 text-[10px] font-bold uppercase tracking-[0.1em] text-text-tertiary">
              Timeline
            </h2>
            <Timeline milestones={person.milestones || []} />
          </div>

          {/* News */}
          {news.length > 0 && (
            <div className="border-[1.5px] border-border p-6">
              <h2 className="mb-4 text-[10px] font-bold uppercase tracking-[0.1em] text-text-tertiary">
                Recent News
              </h2>
              <div className="space-y-4">
                {news.map((item) => (
                  <NewsCard key={item.id} item={{ ...item, relatedSources: [] }} />
                ))}
              </div>
            </div>
          )}

          {/* Report Error */}
          <div className="text-center">
            <a
              href="mailto:info@eo.studio?subject=Report incorrect information"
              className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.05em] text-text-tertiary transition-colors hover:text-foreground"
            >
              <AlertTriangle className="h-3 w-3" />
              Report an error
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
