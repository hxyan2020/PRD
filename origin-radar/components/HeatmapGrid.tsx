"use client";

import { useMemo, useState } from "react";
import { COUNTRY_LABEL, COUNTRY_TO_REGION, REGION_LABEL } from "@/lib/types";
import type { RegionId, ScoredProduct } from "@/lib/types";

const COLS: { region: RegionId; codes: string[] }[] = [
  { region: "na", codes: ["US", "CA", "MX"] },
  { region: "sea", codes: ["SG", "MY", "TH", "ID", "PH", "VN"] },
  { region: "eu", codes: ["GB", "DE", "FR", "IT", "ES", "NL", "PL", "SE"] },
];

function heatColor(v: number): string {
  const t = Math.max(0, Math.min(1, v / 100));
  const r = Math.round(40 + t * 200);
  const g = Math.round(30 + (1 - t) * 40 + t * 70);
  const b = Math.round(20 + (1 - t) * 30);
  return `rgb(${r},${g},${b})`;
}

export function HeatmapGrid({
  products,
  initialSlug,
}: {
  products: ScoredProduct[];
  initialSlug?: string;
}) {
  const [slug, setSlug] = useState(initialSlug ?? products[0]?.slug);
  const product = useMemo(
    () => products.find((p) => p.slug === slug) ?? products[0],
    [products, slug],
  );
  if (!product) return null;
  const heat = product.search.byCountry;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="kicker">Google search heatmap</p>
          <h1 className="mt-2 font-serif text-4xl">Where people are already looking</h1>
          <p className="mt-2 max-w-2xl text-sm text-mist">
            Relative search interest (0–100) for “{product.search.keyword}” across the three target
            theaters. Darker rust = hotter demand.
          </p>
        </div>
        <label className="flex flex-col gap-1 font-mono text-[11px] uppercase tracking-widest text-mist">
          Product
          <select
            value={product.slug}
            onChange={(e) => setSlug(e.target.value)}
            className="rounded-lg border border-white/15 bg-ink-3 px-3 py-2 text-sm normal-case tracking-normal text-paper"
          >
            {products.map((p) => (
              <option key={p.slug} value={p.slug}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {COLS.map((col) => (
          <section key={col.region} className="panel p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-serif text-2xl">{REGION_LABEL[col.region]}</h2>
              <span className="chip">
                avg{" "}
                {Math.round(
                  col.codes.reduce((s, c) => s + (heat[c] ?? 0), 0) / col.codes.length,
                )}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {col.codes.map((code) => {
                const v = heat[code] ?? 0;
                return (
                  <div
                    key={code}
                    className="rounded-xl p-3 text-ink"
                    style={{ background: heatColor(v) }}
                    title={`${COUNTRY_LABEL[code]} · ${COUNTRY_TO_REGION[code]}`}
                  >
                    <div className="font-mono text-[10px] uppercase tracking-widest opacity-80">
                      {code}
                    </div>
                    <div className="font-serif text-2xl leading-none">{v}</div>
                    <div className="mt-1 text-[11px] opacity-80">{COUNTRY_LABEL[code]}</div>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
