"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/", label: "Daily briefing" },
  { href: "/entities", label: "Entities" },
  { href: "/regulation", label: "Regulation" },
  { href: "/risk-tools", label: "Risk tools" },
  { href: "/sources", label: "Sources & health" },
];

export function NavLinks() {
  const pathname = (usePathname().replace(/\/$/, "") || "/") as string;

  return (
    <nav className="flex flex-wrap gap-2">
      {NAV.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`rounded-full border px-3 py-1.5 text-sm transition ${
              active
                ? "border-gold bg-gold/10 text-gold"
                : "border-line text-muted hover:border-gold/40 hover:text-paper"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
