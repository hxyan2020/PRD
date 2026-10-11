import Link from "next/link";
import { Logo } from "./Logo";

const links = [
  { href: "/queue", label: "Queue" },
  { href: "/", label: "Radar" },
  { href: "/heatmap", label: "Search heat" },
  { href: "/social", label: "Social" },
  { href: "/markets", label: "Markets" },
  { href: "/storefront", label: "Storefront" },
  { href: "/methodology", label: "Method" },
];

export function Header() {
  return (
    <header className="relative z-20 border-b border-white/10 bg-ink/70 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="group flex items-center gap-3">
          <Logo className="h-10 w-auto shrink-0" />
          <span>
            <span className="block font-serif text-xl leading-none tracking-tight">OriginRadar</span>
            <span className="mt-1 block font-mono text-[10px] uppercase tracking-[0.24em] text-mist">
              Factory · Demand · Gap
            </span>
          </span>
        </Link>
        <nav className="hidden items-center gap-6 md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="font-mono text-[11px] uppercase tracking-[0.18em] text-mist transition hover:text-paper"
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <Link
          href="/queue"
          className="rounded-full bg-rust px-4 py-2 font-mono text-[11px] uppercase tracking-[0.16em] text-ink transition hover:bg-rust-dim"
        >
          Today&apos;s queue
        </Link>
      </div>
      <nav className="flex gap-4 overflow-x-auto border-t border-white/5 px-4 py-3 md:hidden">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="whitespace-nowrap font-mono text-[11px] uppercase tracking-[0.18em] text-mist"
          >
            {l.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
