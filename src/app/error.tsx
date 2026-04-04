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
      <h2 className="font-mono text-lg text-foreground">오류가 발생했습니다</h2>
      <p className="text-sm text-text-tertiary">
        {error.message || "알 수 없는 오류가 발생했습니다."}
      </p>
      <button
        onClick={reset}
        className="rounded-lg border border-border-active px-4 py-2 text-sm text-text-secondary transition-colors hover:border-border-hover hover:text-foreground"
      >
        다시 시도
      </button>
    </div>
  );
}
