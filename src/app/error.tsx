"use client";

import { useEffect } from "react";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error("Global error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <h2 className="text-[13px] font-bold uppercase tracking-[0.05em] text-foreground">
        Something went wrong
      </h2>
      <p className="text-[11px] text-text-tertiary">
        {process.env.NODE_ENV === "development"
          ? error.message || "An unexpected error occurred."
          : "An unexpected error occurred."}
      </p>
      <button
        onClick={reset}
        className="border-[1.5px] border-border px-4 py-2 text-[10px] font-bold uppercase tracking-[0.05em] text-text-secondary transition-colors hover:border-foreground hover:bg-foreground hover:text-background"
      >
        Try Again
      </button>
    </div>
  );
}
