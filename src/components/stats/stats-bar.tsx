"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { Users, Building2, TrendingUp, Landmark } from "lucide-react";
import { formatNumber } from "@/lib/utils";

interface StatCardProps {
  icon: React.ReactNode;
  value: number;
  label: string;
  tooltip: string;
  format?: (n: number) => string;
}

function CountUp({ target, format }: { target: number; format?: (n: number) => string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    const duration = 800;
    const steps = 30;
    const increment = target / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [inView, target]);

  return (
    <span ref={ref} className="font-mono text-3xl font-bold tabular-nums text-[#F0F0F0] md:text-4xl">
      {format ? format(count) : count.toLocaleString()}
    </span>
  );
}

function StatCard({ icon, value, label, tooltip, format }: StatCardProps) {
  return (
    <div className="group relative rounded-xl border border-[#222] bg-[#111] p-5" title={tooltip}>
      <div className="mb-2 text-[#666]">{icon}</div>
      <CountUp target={value} format={format} />
      <p className="mt-1 text-sm text-[#666]">{label}</p>
    </div>
  );
}

interface StatsBarProps {
  stats: Record<string, number>;
}

export function StatsBar({ stats }: StatsBarProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4"
    >
      <StatCard
        icon={<Users className="h-5 w-5" />}
        value={stats.people_count || 0}
        label="인물"
        tooltip="EO 채널에 출연한 총 인물 수"
      />
      <StatCard
        icon={<Building2 className="h-5 w-5" />}
        value={stats.company_count || 0}
        label="기업"
        tooltip="EO 출연 인물이 속한 기업 수"
      />
      <StatCard
        icon={<TrendingUp className="h-5 w-5" />}
        value={stats.total_funding || 0}
        label="투자유치"
        tooltip="EO 출연 인물 소속 기업 누적 투자유치"
        format={formatNumber}
      />
      <StatCard
        icon={<Landmark className="h-5 w-5" />}
        value={stats.ipo_count || 0}
        label="IPO"
        tooltip="IPO/상장 완료 기업 수"
      />
    </motion.div>
  );
}
