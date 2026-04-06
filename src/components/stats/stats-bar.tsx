"use client";

import { useEffect, useRef, useState } from "react";

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
    <span ref={ref} className="font-serif text-[40px] tabular-nums text-foreground">
      {format ? format(count) : count.toLocaleString()}
    </span>
  );
}

interface Stats {
  people_count: number;
  company_count: number;
  funding_count: number;
  acquisition_count: number;
}

interface StatsBarProps {
  stats: Stats;
}

export function StatsBar({ stats }: StatsBarProps) {
  return (
    <div className="grid grid-cols-2 gap-0">
      {[
        { value: stats.people_count || 0, label: "FEATURED", format: undefined },
        { value: stats.company_count || 0, label: "COMPANIES", format: undefined },
        { value: stats.funding_count || 0, label: "FUNDING NEWS", format: undefined },
        { value: stats.acquisition_count || 0, label: "M&A NEWS", format: undefined },
      ].map((stat, i) => (
        <div
          key={stat.label}
          className={`border-[1.5px] border-border p-5 ${i % 2 === 0 ? "border-r-0" : ""} ${i < 2 ? "border-b-0" : ""}`}
        >
          <CountUp target={stat.value} format={stat.format} />
          <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.1em] text-text-tertiary">
            {stat.label}
          </p>
        </div>
      ))}
    </div>
  );
}
