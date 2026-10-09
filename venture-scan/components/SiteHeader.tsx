import Link from "next/link";
import { AuthNav } from "@/components/AuthNav";

export function SiteHeader() {
  return (
    <header className="relative z-20 border-b border-white/8">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Link href="/" className="group flex shrink-0 items-baseline gap-2">
          <span className="font-display text-2xl tracking-tight text-foam transition group-hover:text-white">
            VentureScan
          </span>
          <span className="hidden font-mono text-[10px] uppercase tracking-[0.2em] text-celadon sm:inline">
            live ledger
          </span>
        </Link>
        <nav className="flex flex-wrap items-center justify-end gap-3 text-sm text-mist">
          <Link href="/today" className="hover:text-foam">
            Today
          </Link>
          <Link href="/#ideas" className="hover:text-foam">
            Ideas
          </Link>
          <Link href="/match" className="hover:text-foam">
            Match
          </Link>
          <Link href="/methodology" className="hover:text-foam">
            Method
          </Link>
          <AuthNav />
        </nav>
      </div>
    </header>
  );
}
