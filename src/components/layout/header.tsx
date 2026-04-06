import Link from "next/link";
import { ChannelSwitcher } from "./channel-switcher";

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b-[1.5px] border-border bg-background">
      <div className="mx-auto flex h-12 max-w-[1400px] items-center justify-between px-5">
        <Link
          href="/"
          className="text-[10px] font-bold uppercase tracking-[0.1em] text-foreground"
        >
          EO FEATURED
        </Link>
        <div className="flex items-center gap-6">
          <ChannelSwitcher />
          <nav className="flex items-center gap-6 text-[10px] uppercase tracking-[0.05em] text-text-tertiary">
            <Link href="/" className="transition-colors hover:text-foreground">
              People
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
