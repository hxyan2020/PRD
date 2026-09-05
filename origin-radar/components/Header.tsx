import Link from "next/link";

const links = [
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
          <span className="relative grid h-9 w-9 place-items-center overflow-hidden rounded-full border border-rust/50">
            <span className="radar-sweep absolute inset-0" />
            <span className="relative h-1.5 w-1.5 rounded-full bg-paper" />
          </span>
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
          href="/storefront"
          className="rounded-full bg-rust px-4 py-2 font-mono text-[11px] uppercase tracking-[0.16em] text-ink transition hover:bg-rust-dim"
        >
          Storefront
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
