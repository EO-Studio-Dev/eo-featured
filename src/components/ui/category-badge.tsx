import type { NewsCategory } from "@/types/supabase";

const categoryConfig: Record<NewsCategory, { label: string; color: string; border: string }> = {
  funding: { label: "FUNDING", color: "#00F7AD", border: "#00F7AD" },
  acquisition: { label: "M&A", color: "#FDE047", border: "#FDE047" },
  ipo: { label: "IPO", color: "#2D43FF", border: "#2D43FF" },
  launch: { label: "LAUNCH", color: "#E8E8E8", border: "#E8E8E8" },
  award: { label: "AWARD", color: "#FDE047", border: "#FDE047" },
  hire: { label: "HIRE", color: "#999999", border: "#999999" },
  other: { label: "NEWS", color: "#666666", border: "#666666" },
};

export function CategoryBadge({ category }: { category: NewsCategory }) {
  const config = categoryConfig[category];
  return (
    <span
      className="inline-flex items-center border-[1.5px] px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em]"
      style={{ color: config.color, borderColor: config.border }}
    >
      {config.label}
    </span>
  );
}
