import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ExternalLink, AlertTriangle, Video } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/ui/badge";
import { Timeline } from "@/components/timeline/timeline";
import type { Milestone, CompanyStatus, MilestoneEventType } from "@/types/supabase";

// Mock data for development
const mockPerson = {
  id: "1",
  name: "이승건",
  slug: "lee-seunggun-a1b2",
  photo_url: null,
  current_role: "대표이사",
  current_company_id: "1",
  created_at: "2024-01-01",
  updated_at: "2026-04-01",
  company: {
    id: "1",
    name: "비바리퍼블리카 (토스)",
    slug: "toss",
    industry: "핀테크",
    status: "active" as CompanyStatus,
    founded_year: 2013,
  },
  appearances: [
    {
      id: "a1",
      person_id: "1",
      video_id: "abc123",
      title: "토스 이승건 대표, 10조 기업의 시작",
      published_at: "2023-03-15",
      thumbnail_url: null,
    },
    {
      id: "a2",
      person_id: "1",
      video_id: "def456",
      title: "이승건이 말하는 성장의 비밀",
      published_at: "2024-01-20",
      thumbnail_url: null,
    },
  ],
  milestones: [
    {
      id: "m1",
      person_id: "1",
      company_id: "1",
      event_type: "eo_appearance" as MilestoneEventType,
      description: "EO 첫 출연 — '토스 이승건 대표, 10조 기업의 시작'",
      date: "2023-03-15",
      source_url: "https://youtube.com/watch?v=abc123",
      confidence: 1.0,
    },
    {
      id: "m2",
      person_id: "1",
      company_id: "1",
      event_type: "funding" as MilestoneEventType,
      description: "시리즈F $400M 유치",
      date: "2023-06-01",
      source_url: "https://example.com/news/1",
      confidence: 0.9,
    },
    {
      id: "m3",
      person_id: "1",
      company_id: "1",
      event_type: "eo_appearance" as MilestoneEventType,
      description: "EO 재출연 — '이승건이 말하는 성장의 비밀'",
      date: "2024-01-20",
      source_url: "https://youtube.com/watch?v=def456",
      confidence: 1.0,
    },
    {
      id: "m4",
      person_id: "1",
      company_id: "1",
      event_type: "ipo" as MilestoneEventType,
      description: "IPO 준비 공식 발표",
      date: "2024-09-15",
      source_url: null,
      confidence: 0.65,
    },
  ] as Milestone[],
};

const mockRelated = [
  {
    id: "2",
    name: "김슬아",
    slug: "kim-seula-c3d4",
    photo_url: null,
    current_role: "대표이사",
    company: { name: "컬리", status: "ipo" as CompanyStatus },
  },
  {
    id: "5",
    name: "정세영",
    slug: "jung-seyoung-i9j0",
    photo_url: null,
    current_role: "CTO",
    company: { name: "당근", status: "active" as CompanyStatus },
  },
];

export default function PersonDetailPage() {
  const person = mockPerson;

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
              {person.appearances?.map((appearance) => (
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
                      <Video className="h-5 w-5 text-blue-400" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1 pt-1">
                    <p className="line-clamp-2 text-sm text-foreground group-hover:text-white">
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
          {mockRelated.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-text-tertiary">
                관련 인물
              </h2>
              <div className="space-y-3">
                {mockRelated.map((related) => (
                  <Link
                    key={related.id}
                    href={`/people/${related.slug}`}
                    className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-elevated"
                  >
                    <Avatar
                      src={related.photo_url}
                      name={related.name}
                      size="sm"
                    />
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {related.name}
                      </p>
                      <p className="text-xs text-text-secondary">
                        {related.company.name} · {related.current_role}
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
              2024년 하반기 IPO를 준비 중이며, 토스뱅크와 토스증권 등 자회사
              성과가 두드러지고 있습니다. 최근 인터뷰에서 글로벌 진출 계획도
              언급했습니다.
            </p>
            <p className="mt-3 text-xs text-text-tertiary">
              AI가 공개 소스를 기반으로 생성한 요약입니다. 정확하지 않을 수
              있습니다.
            </p>
            <p className="mt-1 font-mono text-xs text-text-tertiary">
              마지막 업데이트: 2026.04.01
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
