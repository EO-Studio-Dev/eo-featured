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
  { label: string; vars: { bg: string; text: string; border: string }; icon: LucideIcon }
> = {
  active: {
    label: "운영중",
    vars: {
      bg: "var(--color-status-active-bg)",
      text: "var(--color-status-active-text)",
      border: "var(--color-status-active-border)",
    },
    icon: Rocket,
  },
  ipo: {
    label: "IPO",
    vars: {
      bg: "var(--color-status-ipo-bg)",
      text: "var(--color-status-ipo-text)",
      border: "var(--color-status-ipo-border)",
    },
    icon: TrendingUp,
  },
  acquired: {
    label: "인수됨",
    vars: {
      bg: "var(--color-status-acquired-bg)",
      text: "var(--color-status-acquired-text)",
      border: "var(--color-status-acquired-border)",
    },
    icon: Building2,
  },
  closed: {
    label: "폐업",
    vars: {
      bg: "var(--color-status-closed-bg)",
      text: "var(--color-status-closed-text)",
      border: "var(--color-status-closed-border)",
    },
    icon: XCircle,
  },
};

export function StatusBadge({ status }: { status: CompanyStatus }) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium"
      )}
      style={{
        backgroundColor: config.vars.bg,
        color: config.vars.text,
        borderColor: config.vars.border,
      }}
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </span>
  );
}
