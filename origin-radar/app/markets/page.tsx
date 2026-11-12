import Link from "next/link";
import { getProducts } from "@/lib/catalog";
import { pct, regionShort, statusLabel, usd } from "@/lib/format";
import { statusClass } from "@/components/RegionPills";
import type { RegionId } from "@/lib/types";

const regions: RegionId[] = ["na", "sea", "eu"];

export default function MarketsPage() {
  const products = getProducts();
  return (
    <div>
      <p className="kicker">Regional ecommerce scan</p>
      <h1 className="mt-2 max-w-3xl font-serif text-5xl">
        Already in the market, or a gap you can walk into?
      </h1>
      <p className="mt-4 max-w-2xl text-paper/75">
        Gold cells are whitespace — few or no comparable listings in that theater. Teal/rust cells
        exist: we show seller density and the factory-to-retail margin.
      </p>
      <div className="mt-8 overflow-x-auto rounded-2xl border border-white/10">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className="bg-ink-3 font-mono text-[11px] uppercase tracking-widest text-mist">
            <tr>
              <th className="px-4 py-3">Product</th>
              <th>Score</th>
              {regions.map((r) => (
                <th key={r}>{regionShort(r)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.slug} className="border-t border-white/10 align-top">
                <td className="px-4 py-4">
                  <Link href={`/products/${p.slug}`} className="font-medium hover:text-rust">
                    {p.name}
                  </Link>
                  <div className="font-mono text-[11px] text-mist">{p.nameZh}</div>
                </td>
                <td className="py-4 font-serif text-xl">{Math.round(p.score.total)}</td>
                {regions.map((r) => {
                  const m = p.markets.find((x) => x.region === r);
                  if (!m) return <td key={r} />;
                  const gap = !m.exists || m.status === "whitespace";
                  const implied = gap
                    ? Math.round(((m.projectedRetailUsd - m.landedCostUsd) / m.projectedRetailUsd) * 100)
                    : m.marginPct;
                  return (
                    <td key={r} className="py-4 pr-4">
                      <span className={`chip ${statusClass(m.status, m.exists)}`}>
                        {statusLabel(m.status, m.exists)}
                      </span>
                      <div className="mt-2 font-mono text-[11px] text-mist">
                        {m.listings} listings · {m.sellerCount} sellers
                      </div>
                      <div className="text-sm">
                        {gap ? "Projected " : "Retail "}
                        {usd(gap ? m.projectedRetailUsd : m.avgRetailUsd)} → factory landed{" "}
                        {usd(m.landedCostUsd)}
                      </div>
                      <div className={`font-serif text-2xl ${gap ? "text-gold" : "text-signal"}`}>
                        {pct(implied)} gap
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
