import { cn } from "@/lib/utils";
import type { CompanyStatus } from "@/types/supabase";

const statusConfig: Record<
  CompanyStatus,
  { label: string; vars: { text: string; border: string } }
> = {
  active: {
    label: "ACTIVE",
    vars: {
      text: "var(--color-status-active-text)",
      border: "var(--color-status-active-border)",
    },
  },
  ipo: {
    label: "IPO",
    vars: {
      text: "var(--color-status-ipo-text)",
      border: "var(--color-status-ipo-border)",
    },
  },
  acquired: {
    label: "ACQUIRED",
    vars: {
      text: "var(--color-status-acquired-text)",
      border: "var(--color-status-acquired-border)",
    },
  },
  closed: {
    label: "CLOSED",
    vars: {
      text: "var(--color-status-closed-text)",
      border: "var(--color-status-closed-border)",
    },
  },
};

export function StatusBadge({ status }: { status: CompanyStatus }) {
  const config = statusConfig[status];

  return (
    <span
      className={cn(
        "inline-flex items-center border-[1.5px] px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em]"
      )}
      style={{
        color: config.vars.text,
        borderColor: config.vars.border,
      }}
    >
      {config.label}
    </span>
  );
}
