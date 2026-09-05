import type { ScoredProduct } from "@/lib/types";
import { compact, pct, regionName, statusLabel, usd } from "@/lib/format";
import { statusClass } from "./RegionPills";

export function MarketTable({ product }: { product: ScoredProduct }) {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {product.markets.map((m) => {
        const gap = !m.exists || m.status === "whitespace";
        const zone = product.priceZones.find((z) => z.region === m.region);
        return (
          <article key={m.region} className={`panel p-5 ${gap ? "ring-1 ring-gold/40" : ""}`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="kicker">{regionName(m.region)}</p>
                <h3 className="mt-1 font-serif text-2xl">
                  {gap ? "Does not exist yet" : "Already selling"}
                </h3>
              </div>
              <span className={`chip ${statusClass(m.status, m.exists)}`}>
                {statusLabel(m.status, m.exists)}
              </span>
            </div>
            <dl className="mt-5 grid grid-cols-2 gap-4 font-mono text-xs uppercase tracking-wider text-mist">
              <div>
                <dt>Listings</dt>
                <dd className="mt-1 text-lg text-paper">{compact(m.listings)}</dd>
              </div>
              <div>
                <dt>Sellers</dt>
                <dd className="mt-1 text-lg text-paper">{compact(m.sellerCount)}</dd>
              </div>
              <div>
                <dt>{gap ? "Projected retail" : "Avg retail"}</dt>
                <dd className="mt-1 text-lg text-paper">
                  {usd(gap ? m.projectedRetailUsd : m.avgRetailUsd)}
                </dd>
              </div>
              <div>
                <dt>Landed cost</dt>
                <dd className="mt-1 text-lg text-paper">{usd(m.landedCostUsd)}</dd>
              </div>
              <div>
                <dt>Price zone</dt>
                <dd className="mt-1 text-lg text-signal">{zone ? usd(zone.recommendedUsd) : "—"}</dd>
              </div>
              <div>
                <dt>Zone band</dt>
                <dd className="mt-1 text-lg text-paper">
                  {zone ? `${usd(zone.floorUsd)}–${usd(zone.ceilingUsd)}` : "—"}
                </dd>
              </div>
              <div className="col-span-2">
                <dt>Price gap (margin)</dt>
                <dd className={`mt-1 font-serif text-3xl ${gap ? "text-gold" : "text-signal"}`}>
                  {gap
                    ? pct(((m.projectedRetailUsd - m.landedCostUsd) / m.projectedRetailUsd) * 100)
                    : pct(m.marginPct)}
                </dd>
              </div>
            </dl>
            {zone ? <p className="mt-3 text-sm leading-relaxed text-mist">{zone.rationale}</p> : null}
            <ul className="mt-4 space-y-1.5 text-sm text-paper/80">
              {m.platforms.map((p) => (
                <li key={p.name} className="flex justify-between gap-3">
                  <span>{p.name}</span>
                  <span className="font-mono text-mist">
                    {p.listings} · {p.avgPrice ? usd(p.avgPrice) : "—"}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-sm leading-relaxed text-mist">{m.notes}</p>
          </article>
        );
      })}
    </div>
  );
}
