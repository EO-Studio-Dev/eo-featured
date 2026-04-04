"use client";

import { useEffect } from "react";
import Link from "next/link";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function PersonError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error("Person page error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <h2 className="font-mono text-lg text-foreground">페이지를 불러올 수 없습니다</h2>
      <p className="text-sm text-text-tertiary">
        {error.message || "인물 정보를 가져오는 중 오류가 발생했습니다."}
      </p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="rounded-lg border border-border-active px-4 py-2 text-sm text-text-secondary transition-colors hover:border-border-hover hover:text-foreground"
        >
          다시 시도
        </button>
        <Link
          href="/"
          className="rounded-lg border border-border-active px-4 py-2 text-sm text-text-secondary transition-colors hover:border-border-hover hover:text-foreground"
        >
          홈으로
        </Link>
      </div>
    </div>
  );
}
