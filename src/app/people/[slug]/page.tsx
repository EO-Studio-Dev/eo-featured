import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft, AlertTriangle, Video } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/ui/badge";
import { Timeline } from "@/components/timeline/timeline";
import { getPersonBySlug, getRelatedPeople } from "@/lib/supabase/queries";
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
    return {
      title: `${person.name} — EO Featured`,
      description: person.current_role
        ? `${person.name} · ${person.company?.name ?? ""} ${person.current_role}`
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
    person.current_company_id
  ).catch(() => []);

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-8">
      {/* Back */}
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-1 text-sm text-text-secondary transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        돌아가기
      </Link>

      <div className="grid gap-8 lg:grid-cols-[1fr_1.5fr]">
        {/* Left: Profile */}
        <div className="space-y-6">
          {/* Profile header */}
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-start gap-4">
              <Avatar src={person.photo_url} name={person.name} size="lg" />
              <div>
                <h1 className="text-2xl font-bold">{person.name}</h1>
                <p className="mt-1 text-text-secondary">
                  {person.company?.name} · {person.current_role}
                </p>
                <div className="mt-2">
                  <StatusBadge status={person.company?.status || "active"} />
                </div>
              </div>
            </div>
          </div>

          {/* Company Info */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-text-tertiary">
              회사 정보
            </h2>
            <div className="space-y-2 text-sm">
              <p className="text-foreground">{person.company?.name}</p>
              <p className="text-text-secondary">
                {person.company?.industry} · {person.company?.founded_year}년 설립
              </p>
            </div>
          </div>

          {/* EO Appearances */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-text-tertiary">
              EO 출연
            </h2>
            <div className="space-y-3">
              {(person.appearances ?? []).map((appearance) => (
                <a
                  key={appearance.id}
                  href={`https://youtube.com/watch?v=${appearance.video_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex gap-3 rounded-lg p-2 transition-colors hover:bg-elevated"
                >
                  {appearance.thumbnail_url ? (
                    <div className="relative h-16 w-28 shrink-0 overflow-hidden rounded-md">
                      <Image
                        src={appearance.thumbnail_url}
                        alt={appearance.title}
                        fill
                        className="object-cover"
                        sizes="112px"
                      />
                    </div>
                  ) : (
                    <div className="flex h-16 w-28 shrink-0 items-center justify-center rounded-md bg-elevated">
                      <Video className="h-5 w-5 text-accent" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1 pt-1">
                    <p className="line-clamp-2 text-sm text-foreground group-hover:text-foreground">
                      {appearance.title}
                    </p>
                    <p className="mt-1 font-mono text-xs text-text-tertiary">
                      {new Date(appearance.published_at).toLocaleDateString(
                        "ko-KR"
                      )}
                    </p>
                  </div>
                </a>
              ))}
            </div>
          </div>

          {/* Related People */}
          {related.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-text-tertiary">
                관련 인물
              </h2>
              <div className="space-y-3">
                {related.map((rel) => (
                  <Link
                    key={rel.id}
                    href={`/people/${rel.slug}`}
                    className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-elevated"
                  >
                    <Avatar
                      src={rel.photo_url}
                      name={rel.name}
                      size="sm"
                    />
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {rel.name}
                      </p>
                      <p className="text-xs text-text-secondary">
                        {rel.company?.name} · {rel.current_role}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Timeline + AI Summary */}
        <div className="space-y-6">
          {/* Timeline */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-text-tertiary">
              타임라인
            </h2>
            <Timeline milestones={person.milestones || []} />
          </div>

          {/* AI Summary */}
          <div className="rounded-xl border border-dashed border-border-active bg-card p-6">
            <div className="mb-3 flex items-center gap-2">
              <h2 className="text-sm font-medium uppercase tracking-wider text-text-tertiary">
                최신 근황
              </h2>
              <span className="rounded bg-elevated px-1.5 py-0.5 text-xs text-text-secondary">
                AI 생성
              </span>
            </div>
            <p className="text-sm leading-relaxed text-text-secondary">
              공개된 정보를 바탕으로 AI가 생성한 요약입니다.
            </p>
            <p className="mt-3 text-xs text-text-tertiary">
              AI가 공개 소스를 기반으로 생성한 요약입니다. 정확하지 않을 수
              있습니다.
            </p>
          </div>

          {/* Report Error */}
          <div className="text-center">
            <a
              href="mailto:info@eo.studio?subject=정보 오류 신고"
              className="inline-flex items-center gap-1 text-xs text-text-tertiary transition-colors hover:text-text-secondary"
            >
              <AlertTriangle className="h-3 w-3" />
              정보에 오류가 있나요? 신고하기
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
