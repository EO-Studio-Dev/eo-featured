import type { NewsCategory } from "@/types/supabase";

const categoryConfig: Record<NewsCategory, { label: string; cssVar: string }> = {
  funding: { label: "FUNDING", cssVar: "var(--color-category-funding)" },
  acquisition: { label: "M&A", cssVar: "var(--color-category-acquisition)" },
  ipo: { label: "IPO", cssVar: "var(--color-category-ipo)" },
  launch: { label: "LAUNCH", cssVar: "var(--color-category-launch)" },
  award: { label: "AWARD", cssVar: "var(--color-category-award)" },
  hire: { label: "HIRE", cssVar: "var(--color-category-hire)" },
  other: { label: "NEWS", cssVar: "var(--color-category-other)" },
};

export function CategoryBadge({ category }: { category: NewsCategory }) {
  const config = categoryConfig[category];
  return (
    <span
      className="inline-flex items-center border-[1.5px] px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em]"
      style={{ color: config.cssVar, borderColor: config.cssVar }}
    >
      {config.label}
    </span>
  );
}
