"use client";

import Link from "next/link";
import { Video } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/ui/badge";
import type { CompanyStatus } from "@/types/supabase";

export interface PersonCardData {
  id: string;
  name: string;
  slug: string;
  photo_url: string | null;
  current_role: string | null;
  company?: { name: string; status: CompanyStatus };
  appearances: { count: number }[];
}

interface PersonCardProps {
  person: PersonCardData;
  index: number;
}

export function PersonCard({ person, index }: PersonCardProps) {
  const status = (person.company?.status || "active") as CompanyStatus;
  const appearanceCount = person.appearances?.[0]?.count || 0;

  const delay = Math.min(index * 0.05, 0.5);

  return (
    <div
      style={{
        animation: `fadeSlideUp 0.3s ease-out ${delay}s both`,
      }}
    >
      <Link
        href={`/people/${person.slug}`}
        aria-label={`${person.name}${person.company?.name ? ` — ${person.company.name}` : ""} 프로필 보기`}
        className="group block rounded-xl border border-border bg-card p-5 transition-all will-change-transform md:hover:border-accent/30 md:hover:shadow-[0_0_20px_var(--color-accent-glow,rgba(96,165,250,0.1))] md:hover:scale-[1.02]"
      >
        <div className="flex items-center gap-4">
          <Avatar
            src={person.photo_url}
            name={person.name}
            size="md"
          />
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-lg font-semibold text-foreground">
              {person.name}
            </h3>
            <p className="truncate text-sm text-text-secondary">
              {person.company?.name && (
                <>
                  {person.company.name}
                  {person.current_role && ` · ${person.current_role}`}
                </>
              )}
            </p>
            <div className="mt-2 flex items-center gap-2">
              <StatusBadge status={status} />
              {appearanceCount > 0 && (
                <span
                  className="inline-flex items-center gap-1 text-xs text-text-tertiary"
                  aria-label={`EO 출연 ${appearanceCount}회`}
                >
                  <Video className="h-3 w-3" aria-hidden="true" />
                  {appearanceCount}회
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
