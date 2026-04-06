export function Footer() {
  return (
    <footer className="border-t-[1.5px] border-border py-8">
      <div className="mx-auto max-w-[1400px] px-5 text-center text-[10px] uppercase tracking-[0.05em] text-text-tertiary">
        <p>
          EO Featured — Tracking the growth of people discovered by EO
        </p>
        <p className="mt-2">
          Data is automatically collected by AI from public sources
        </p>
        <p className="mt-3">
          <a
            href="https://youtube.com/@eoglobal"
            target="_blank"
            rel="noopener noreferrer"
            className="text-text-secondary transition-colors hover:text-foreground"
          >
            EO YouTube ↗
          </a>
        </p>
      </div>
    </footer>
  );
}
