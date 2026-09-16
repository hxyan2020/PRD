"use client";

import { parseView, queryHref, useQueryParams } from "@/lib/queryNav";
import { QueryLink } from "./QueryLink";

const NAV = [
  { view: "briefing" as const, label: "Daily briefing" },
  { view: "entities" as const, label: "Entities" },
  { view: "regulation" as const, label: "Regulation" },
  { view: "risk-tools" as const, label: "Risk tools" },
  { view: "sources" as const, label: "Sources & health" },
];

export function NavLinks() {
  const params = useQueryParams();
  const active = parseView(params.get("view"));

  return (
    <nav className="flex flex-wrap gap-2">
      {NAV.map((item) => {
        const href = queryHref({ view: item.view });
        return (
          <QueryLink
            key={item.view}
            href={href}
            className={`rounded-full border px-3 py-1.5 text-sm transition ${
              active === item.view
                ? "border-gold bg-gold/10 text-gold"
                : "border-line text-muted hover:border-gold/40 hover:text-paper"
            }`}
          >
            {item.label}
          </QueryLink>
        );
      })}
    </nav>
  );
}
