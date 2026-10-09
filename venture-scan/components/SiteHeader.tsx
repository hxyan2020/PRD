import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="relative z-20 border-b border-white/8">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="group flex items-baseline gap-2">
          <span className="font-display text-2xl tracking-tight text-foam transition group-hover:text-white">
            VentureScan
          </span>
          <span className="hidden font-mono text-[10px] uppercase tracking-[0.2em] text-celadon sm:inline">
            live ledger
          </span>
        </Link>
        <nav className="flex items-center gap-3 text-sm text-mist">
          <Link href="/#ideas" className="hover:text-foam">
            Ideas
          </Link>
          <Link href="/match" className="hover:text-foam">
            Match
          </Link>
          <Link href="/methodology" className="hover:text-foam">
            Method
          </Link>
        </nav>
      </div>
    </header>
  );
}
