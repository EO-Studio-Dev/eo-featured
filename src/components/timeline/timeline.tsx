"use client";

import { Video, Rocket, TrendingUp, Building2, Award, Zap, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Milestone, MilestoneEventType } from "@/types/supabase";

const eventConfig: Record<MilestoneEventType, { icon: React.ElementType; color: string }> = {
  eo_appearance: { icon: Video, color: "text-accent" },
  funding: { icon: TrendingUp, color: "text-[#00F7AD]" },
  ipo: { icon: Rocket, color: "text-[#2D43FF]" },
  acquisition: { icon: Building2, color: "text-[#FDE047]" },
  launch: { icon: Zap, color: "text-foreground" },
  award: { icon: Award, color: "text-[#FDE047]" },
  expansion: { icon: TrendingUp, color: "text-foreground" },
  other: { icon: Circle, color: "text-text-tertiary" },
};

interface TimelineProps {
  milestones: Milestone[];
}

export function Timeline({ milestones }: TimelineProps) {
  const sorted = [...milestones].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  return (
    <div className="relative space-y-0">
      {/* Vertical line */}
      <div className="absolute left-[18px] top-0 h-full w-[2px] bg-border" />

      {sorted.map((milestone, i) => {
        const config = eventConfig[milestone.event_type];
        const Icon = config.icon;
        const isEO = milestone.event_type === "eo_appearance";
        const isUnverified = milestone.confidence < 0.7;

        return (
          <div
            key={milestone.id}
            className={cn(
              "relative flex gap-4 py-3",
              isUnverified && "border-l-[1.5px] border-dashed border-[#FDE047]/40 pl-2"
            )}
            style={{ animation: `fadeSlideLeft 0.3s ease-out ${i * 0.05}s both` }}
          >
            {/* Dot */}
            <div
              className={cn(
                "relative z-10 flex h-9 w-9 shrink-0 items-center justify-center border-[1.5px] border-border bg-background",
                config.color,
                isEO && "border-accent"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
            </div>

            {/* Content */}
            <div className="min-w-0 flex-1 pt-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-text-tertiary">
                {new Date(milestone.date).toLocaleDateString("ko-KR", {
                  year: "numeric",
                  month: "long",
                })}
              </p>
              <p className={cn(
                "mt-0.5 text-[13px]",
                isEO ? "font-bold text-accent" : "text-text-secondary"
              )}>
                {milestone.description}
                {isUnverified && (
                  <span className="ml-2 border-[1.5px] border-[#FDE047]/40 px-1.5 py-0.5 text-[9px] font-bold uppercase text-[#FDE047]/80">(미확인)</span>
                )}
              </p>
              {milestone.source_url && /^https?:\/\//.test(milestone.source_url) && (
                <a
                  href={milestone.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`출처: ${milestone.description}`}
                  className="mt-1 inline-block text-[10px] uppercase tracking-[0.05em] text-text-tertiary hover:text-foreground"
                >
                  출처 ↗
                </a>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
