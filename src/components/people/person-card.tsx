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
  role: string | null;
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

  const delay = Math.min(index * 0.04, 0.4);

  return (
    <div
      style={{
        animation: `fadeSlideUp 0.25s ease-out ${delay}s both`,
      }}
    >
      <Link
        href={`/people/${person.slug}`}
        aria-label={`View ${person.name}${person.company?.name ? ` — ${person.company.name}` : ""} profile`}
        className="group block border-[1.5px] border-border bg-card p-5 transition-colors hover:border-foreground"
      >
        <div className="flex items-start gap-4">
          <Avatar
            src={person.photo_url}
            name={person.name}
            size="md"
          />
          <div className="min-w-0 flex-1">
            <h3 className="font-title text-[28px] font-semibold tracking-[-0.03em] text-foreground">
              {person.name}
            </h3>
            <p className="mt-0.5 text-[11px] uppercase tracking-[0.05em] text-text-tertiary">
              {person.company?.name && (
                <>
                  {person.company.name}
                  {person.role && ` · ${person.role}`}
                </>
              )}
            </p>
            <div className="mt-3 flex items-center gap-3">
              <StatusBadge status={status} />
              {appearanceCount > 0 && (
                <span
                  className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.05em] text-text-tertiary"
                  aria-label={`${appearanceCount} EO appearances`}
                >
                  <Video className="h-3 w-3" aria-hidden="true" />
                  {appearanceCount}x
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
