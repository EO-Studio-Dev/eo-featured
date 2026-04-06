"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

const CHANNELS = [
  { value: "en", label: "EN" },
  { value: "kr", label: "KR" },
  { value: "vn", label: "VN" },
];

export function ChannelSwitcher() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const active = searchParams.get("channel") || "en";

  const handleChange = (channel: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (channel === "en") {
      params.delete("channel");
    } else {
      params.set("channel", channel);
    }
    router.push(`/?${params.toString()}`);
  };

  return (
    <div className="flex gap-0">
      {CHANNELS.map((ch) => (
        <button
          key={ch.value}
          onClick={() => handleChange(ch.value)}
          className={cn(
            "border-[1.5px] border-border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.05em] transition-colors -ml-[1.5px] first:ml-0",
            active === ch.value
              ? "border-foreground bg-foreground text-background"
              : "text-text-tertiary hover:border-foreground hover:text-foreground"
          )}
        >
          {ch.label}
        </button>
      ))}
    </div>
  );
}
