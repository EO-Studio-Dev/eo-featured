import Link from "next/link";

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-[1200px] items-center justify-between px-4">
        <Link href="/" className="font-serif text-xl font-bold text-foreground">
          EO Featured
        </Link>
        <nav className="flex items-center gap-4 text-sm text-text-secondary">
          <Link
            href="/"
            className="transition-colors hover:text-foreground"
          >
            인물
          </Link>
        </nav>
      </div>
    </header>
  );
}
