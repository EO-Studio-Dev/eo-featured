"use client";

import { motion } from "framer-motion";
import { Video, Rocket, TrendingUp, Building2, Award, Zap, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Milestone, MilestoneEventType } from "@/types/supabase";

const eventConfig: Record<MilestoneEventType, { icon: React.ElementType; color: string }> = {
  eo_appearance: { icon: Video, color: "text-blue-400 bg-blue-500/20" },
  funding: { icon: TrendingUp, color: "text-green-400 bg-green-500/20" },
  ipo: { icon: Rocket, color: "text-purple-400 bg-purple-500/20" },
  acquisition: { icon: Building2, color: "text-amber-400 bg-amber-500/20" },
  launch: { icon: Zap, color: "text-cyan-400 bg-cyan-500/20" },
  award: { icon: Award, color: "text-yellow-400 bg-yellow-500/20" },
  expansion: { icon: TrendingUp, color: "text-emerald-400 bg-emerald-500/20" },
  other: { icon: Circle, color: "text-neutral-400 bg-neutral-500/20" },
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
      <div className="absolute left-5 top-0 h-full w-px bg-[#222]" />

      {sorted.map((milestone, i) => {
        const config = eventConfig[milestone.event_type];
        const Icon = config.icon;
        const isEO = milestone.event_type === "eo_appearance";
        const isUnverified = milestone.confidence < 0.7;

        return (
          <motion.div
            key={milestone.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05, duration: 0.3 }}
            className={cn(
              "relative flex gap-4 py-3",
              isUnverified && "border-l-2 border-dashed border-[#333]"
            )}
          >
            {/* Icon */}
            <div
              className={cn(
                "relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                config.color,
                isEO && "ring-2 ring-blue-500/50"
              )}
            >
              <Icon className="h-4 w-4" />
            </div>

            {/* Content */}
            <div className="min-w-0 flex-1 pt-1">
              <p className="font-mono text-xs text-[#666]">
                {new Date(milestone.date).toLocaleDateString("ko-KR", {
                  year: "numeric",
                  month: "long",
                })}
              </p>
              <p className={cn(
                "mt-0.5 text-sm",
                isEO ? "font-semibold text-blue-400" : "text-[#A0A0A0]"
              )}>
                {milestone.description}
                {isUnverified && (
                  <span className="ml-2 text-xs text-[#666]">(미확인)</span>
                )}
              </p>
              {milestone.source_url && (
                <a
                  href={milestone.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-block text-xs text-[#666] hover:text-[#A0A0A0]"
                >
                  출처
                </a>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
