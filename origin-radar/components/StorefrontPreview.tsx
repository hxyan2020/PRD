"use client";

import { useState } from "react";
import type { SourcedProduct } from "@/lib/storefront-types";
import { cny, usd } from "@/lib/format";
import { FulfillmentChips } from "./FulfillmentChips";
import { PriceZoneBar } from "./PriceZoneBar";

export function StorefrontPreview({ product }: { product: SourcedProduct }) {
  const [tab, setTab] = useState<"customer" | "merchant">("customer");
  const [shot, setShot] = useState(0);
  const img = product.images[shot] ?? product.images[0];

  return (
    <div className="space-y-8">
      <div className="flex gap-2">
        {(["customer", "merchant"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`rounded-full px-4 py-2 font-mono text-[11px] uppercase tracking-[0.16em] ${
              tab === t ? "bg-rust text-ink" : "border border-white/15 text-mist"
            }`}
          >
            {t === "customer" ? "Store preview" : "Merchant file"}
          </button>
        ))}
      </div>

      {tab === "customer" ? (
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <div className="overflow-hidden rounded-3xl border border-white/10 bg-ink-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img?.path ?? img?.sourceUrl} alt={img?.alt} className="aspect-[4/3] w-full object-cover" />
            </div>
            <div className="mt-3 flex gap-2 overflow-x-auto">
              {product.images.map((im, i) => (
                <button
                  key={im.path + i}
                  type="button"
                  onClick={() => setShot(i)}
                  className={`h-16 w-16 shrink-0 overflow-hidden rounded-lg border ${
                    i === shot ? "border-rust" : "border-white/10"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={im.path} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="kicker">{product.productType}</p>
            <h1 className="mt-2 font-serif text-4xl">{product.title}</h1>
            <p className="mt-2 text-mist">{product.titleZh}</p>
            <p className="mt-6 font-serif text-4xl text-signal">{usd(product.retailPriceUsd)}</p>
            <p className="font-mono text-xs uppercase tracking-widest text-mist">
              Compare {usd(product.compareAtUsd)} · {product.variants.length} SKUs
            </p>
            <div className="mt-6 space-y-3">
              {product.optionNames.map((name) => (
                <div key={name}>
                  <p className="font-mono text-[11px] uppercase tracking-widest text-mist">{name}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {[...new Set(product.variants.map((v) => v.options[name]).filter(Boolean))].map((val) => (
                      <span key={val} className="chip">
                        {val}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <button
              type="button"
              disabled
              className="mt-8 w-full rounded-full bg-white/10 py-3 font-mono text-[11px] uppercase tracking-[0.18em] text-mist"
            >
              Add to cart — preview only
            </button>
            <div
              className="prose-invert mt-8 max-w-none text-sm leading-relaxed text-paper/80"
              dangerouslySetInnerHTML={{ __html: product.descriptionHtml }}
            />
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <section className="panel p-5">
            <h2 className="font-serif text-2xl">Factory price &amp; source</h2>
            <p className="mt-2 font-mono text-xs text-mist">
              {product.sourcePlatform} offer {product.sourceOfferId} ·{" "}
              {product.liveFetch ? "live API" : "listing pack (add 1688 API keys for live overwrite)"}
            </p>
            <a href={product.sourceUrl} className="mt-2 inline-block text-sm text-rust" target="_blank" rel="noreferrer">
              {product.sourceUrl}
            </a>
            <dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div>
                <dt className="kicker">Factory unit</dt>
                <dd className="font-serif text-2xl">{usd(product.factoryPriceUsd)}</dd>
              </div>
              <div>
                <dt className="kicker">Store retail</dt>
                <dd className="font-serif text-2xl">{usd(product.retailPriceUsd)}</dd>
              </div>
              <div>
                <dt className="kicker">Vendor</dt>
                <dd className="mt-1 text-sm">{product.vendor}</dd>
              </div>
              <div>
                <dt className="kicker">Images on disk</dt>
                <dd className="font-serif text-2xl">{product.images.length}</dd>
              </div>
            </dl>
            <table className="mt-6 w-full text-left text-sm">
              <thead className="font-mono text-[11px] uppercase tracking-widest text-mist">
                <tr>
                  <th className="py-2">MOQ</th>
                  <th>USD</th>
                  <th>CNY</th>
                </tr>
              </thead>
              <tbody>
                {product.priceTiers.map((t) => (
                  <tr key={t.minQty} className="border-t border-white/10">
                    <td className="py-2">≥ {t.minQty}</td>
                    <td>{usd(t.priceUsd)}</td>
                    <td>{cny(t.priceCny)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
          {product.priceZones?.length ? (
            <section className="panel p-5">
              <h2 className="font-serif text-2xl">Recommended retail zone</h2>
              <p className="mt-2 text-sm text-mist">
                Store retail {usd(product.retailPriceUsd)} is the best-region recommended price.
              </p>
              <div className="mt-4">
                <PriceZoneBar
                  zones={product.priceZones}
                  highlight={product.priceZones.find((z) => z.recommendedUsd === product.retailPriceUsd)?.region}
                />
              </div>
              <ul className="mt-4 space-y-2 text-sm text-paper/80">
                {product.priceZones.map((z) => (
                  <li key={z.region}>{z.rationale}</li>
                ))}
              </ul>
            </section>
          ) : null}
          {product.logistics ? (
            <section className="panel p-5">
              <h2 className="font-serif text-2xl">Factory customization &amp; overseas</h2>
              <div className="mt-4">
                <FulfillmentChips logistics={product.logistics} />
              </div>
              <p className="mt-3 text-sm text-paper/80">{product.logistics.customNotes}</p>
              <p className="mt-2 text-sm text-paper/80">{product.logistics.overseasNotes}</p>
            </section>
          ) : null}
          <section className="panel p-5">
            <h2 className="font-serif text-2xl">Specifications</h2>
            <dl className="mt-4 divide-y divide-white/10">
              {product.specifications.map((s) => (
                <div key={s.name} className="flex justify-between gap-4 py-2 text-sm">
                  <dt className="text-mist">{s.name}</dt>
                  <dd>{s.value}</dd>
                </div>
              ))}
            </dl>
          </section>
          <section className="panel p-5">
            <h2 className="font-serif text-2xl">Terms of use / factory terms</h2>
            <dl className="mt-4 space-y-3 text-sm">
              {Object.entries(product.terms).map(([k, v]) => (
                <div key={k}>
                  <dt className="font-mono text-[11px] uppercase tracking-widest text-mist">{k}</dt>
                  <dd className="mt-1 text-paper/80">{v}</dd>
                </div>
              ))}
            </dl>
          </section>
        </div>
      )}
    </div>
  );
}
