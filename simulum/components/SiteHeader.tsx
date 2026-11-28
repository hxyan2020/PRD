import Link from "next/link";

const links = [
  { href: "/", label: "Home" },
  { href: "/evidence", label: "Evidence" },
  { href: "/categories", label: "Categories" },
];

export function SiteHeader() {
  return (
    <header className="safe-top relative z-20 border-b border-line/60 bg-paper/70 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="group flex items-baseline gap-2">
          <span className="font-display text-xl tracking-tight text-ink sm:text-2xl">
            SIMULUM
          </span>
          <span className="hidden font-mono text-[10px] uppercase tracking-[0.2em] text-mist sm:inline">
            evidence index
          </span>
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="touch-target inline-flex items-center rounded-md px-3 py-2 text-sm text-ink-soft transition hover:bg-signal-soft/60 hover:text-ink"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
