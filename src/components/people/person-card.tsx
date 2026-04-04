"use client";

import Link from "next/link";
import { motion } from "framer-motion";
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3, ease: "easeOut" }}
    >
      <Link
        href={`/people/${person.slug}`}
        className="group block rounded-xl border border-[#222] bg-[#111] p-5 transition-all hover:border-blue-500/30 hover:shadow-[0_0_20px_rgba(96,165,250,0.1)] hover:scale-[1.02]"
      >
        <div className="flex items-center gap-4">
          <Avatar
            src={person.photo_url}
            name={person.name}
            size="md"
          />
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-lg font-semibold text-[#F0F0F0]">
              {person.name}
            </h3>
            <p className="truncate text-sm text-[#A0A0A0]">
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
                <span className="inline-flex items-center gap-1 text-xs text-[#666]">
                  <Video className="h-3 w-3" />
                  {appearanceCount}회
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
