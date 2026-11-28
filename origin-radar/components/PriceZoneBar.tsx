"use client";

import type { PriceZone } from "@/lib/types";
import { regionShort, usd } from "@/lib/format";

export function PriceZoneBar({
  zones,
  highlight,
}: {
  zones: PriceZone[];
  highlight?: string;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-3">
      {zones.map((z) => {
        const on = z.region === highlight;
        return (
          <div
            key={z.region}
            className={`rounded-xl border px-3 py-2 ${
              on ? "border-rust/50 bg-rust/10" : "border-white/10 bg-white/5"
            } ${z.tight ? "opacity-80" : ""}`}
          >
            <p className="font-mono text-[10px] uppercase tracking-widest text-mist">
              {regionShort(z.region)} zone {z.tight ? "· tight" : ""}
            </p>
            <p className="mt-1 font-serif text-xl text-signal">{usd(z.recommendedUsd)}</p>
            <p className="font-mono text-[10px] uppercase tracking-wider text-mist">
              {usd(z.floorUsd)}–{usd(z.ceilingUsd)} · {Math.round(z.grossMarginPct)}% after landed
            </p>
          </div>
        );
      })}
    </div>
  );
}
