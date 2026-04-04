import { cn } from "@/lib/utils";
import {
  Rocket,
  TrendingUp,
  Building2,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import type { CompanyStatus } from "@/types/supabase";

const statusConfig: Record<
  CompanyStatus,
  { label: string; color: string; icon: LucideIcon }
> = {
  active: {
    label: "운영중",
    color: "bg-green-500/15 text-green-400 border-green-500/30",
    icon: Rocket,
  },
  ipo: {
    label: "IPO",
    color: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    icon: TrendingUp,
  },
  acquired: {
    label: "인수됨",
    color: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    icon: Building2,
  },
  closed: {
    label: "폐업",
    color: "bg-neutral-500/15 text-neutral-400 border-neutral-500/30",
    icon: XCircle,
  },
};

export function StatusBadge({ status }: { status: CompanyStatus }) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
        config.color
      )}
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </span>
  );
}
