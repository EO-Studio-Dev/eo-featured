"use client";

import { useEffect, useRef, useState } from "react";
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
  const [inView, setInView] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!inView) return;
    const duration = 800;
    const startTime = performance.now();
    let rafId: number;

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) {
        rafId = requestAnimationFrame(tick);
      } else {
        setCount(target);
      }
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [inView, target]);

  return (
    <span ref={ref} className="font-mono text-3xl font-bold tabular-nums text-foreground md:text-4xl">
      {format ? format(count) : count.toLocaleString()}
    </span>
  );
}

function StatCard({ icon, value, label, tooltip, format }: StatCardProps) {
  return (
    <div className="group relative rounded-xl border border-border bg-card p-5" title={tooltip}>
      <div className="mb-2 text-text-tertiary">{icon}</div>
      <CountUp target={value} format={format} />
      <p className="mt-1 text-sm text-text-tertiary">{label}</p>
    </div>
  );
}

interface StatsBarProps {
  stats: Record<string, number>;
}

export function StatsBar({ stats }: StatsBarProps) {
  return (
    <div
      className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4"
      style={{ animation: "fadeSlideUp 0.5s ease-out both" }}
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
    </div>
  );
}
