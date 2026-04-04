export function Footer() {
  return (
    <footer className="border-t border-border py-8">
      <div className="mx-auto max-w-[1200px] px-4 text-center text-xs text-text-tertiary">
        <p>
          EO Featured — EO가 발견한 사람들의 성장 기록
        </p>
        <p className="mt-1">
          데이터는 AI가 공개 소스를 기반으로 자동 수집합니다. 정보에 오류가 있을 수 있습니다.
        </p>
        <p className="mt-2">
          <a
            href="https://youtube.com/@eo"
            target="_blank"
            rel="noopener noreferrer"
            className="text-text-secondary transition-colors hover:text-foreground"
          >
            EO YouTube
          </a>
        </p>
      </div>
    </footer>
  );
}
