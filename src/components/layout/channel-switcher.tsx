"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

const CHANNELS = [
  { value: "en", label: "EN", flag: "🌐" },
  { value: "kr", label: "KR", flag: "🇰🇷" },
  { value: "vn", label: "VN", flag: "🇻🇳" },
];

export function ChannelSwitcher() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const active = searchParams.get("channel") || "en";
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const current = CHANNELS.find(c => c.value === active) || CHANNELS[0];

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleChange = (channel: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (channel === "en") {
      params.delete("channel");
    } else {
      params.set("channel", channel);
    }
    router.push(`/?${params.toString()}`);
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 border-[1.5px] border-border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.05em] text-foreground transition-colors hover:border-foreground"
      >
        {current.flag} {current.label}
        <ChevronDown className="h-3 w-3 text-text-tertiary" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 border-[1.5px] border-border bg-background">
          {CHANNELS.map((ch) => (
            <button
              key={ch.value}
              onClick={() => handleChange(ch.value)}
              className={`flex w-full items-center gap-2 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.05em] transition-colors hover:bg-elevated ${
                active === ch.value ? "text-accent" : "text-text-secondary"
              }`}
            >
              {ch.flag} {ch.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
