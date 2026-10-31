"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { readListings, subscribeStore } from "@/lib/client-store";
import { usd } from "@/lib/format";
import { toShopifyCsv, toStorefrontJson } from "@/lib/shopify-export";
import type { SourcedProduct } from "@/lib/storefront-types";
import { tryApiJson } from "@/lib/try-api";

function downloadBlob(filename: string, mime: string, body: string) {
  const blob = new Blob([body], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function StorefrontCatalog() {
  const [products, setProducts] = useState<SourcedProduct[]>([]);

  const hydrate = useCallback(async () => {
    const api = await tryApiJson<{ products?: SourcedProduct[] }>("/api/storefront");
    const local = readListings();
    if (api.ok && api.data.products) {
      const bySlug = new Map(local.map((p) => [p.signalSlug, p]));
      for (const p of api.data.products) bySlug.set(p.signalSlug, p);
      setProducts([...bySlug.values()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)));
      return;
    }
    setProducts(local);
  }, []);

  useEffect(() => {
    void hydrate();
    return subscribeStore(() => {
      void hydrate();
    });
  }, [hydrate]);

  function exportShopify() {
    const list = products.length ? products : readListings();
    downloadBlob("origin-radar-shopify.csv", "text/csv;charset=utf-8", toShopifyCsv(list));
  }

  function exportJson() {
    const list = products.length ? products : readListings();
    downloadBlob(
      "origin-radar-storefront.json",
      "application/json",
      JSON.stringify(toStorefrontJson(list), null, 2),
    );
  }

  return (
    <div>
      <p className="kicker">Storefront prep</p>
      <h1 className="mt-2 font-serif text-5xl">Sourced listings, ready to load a store</h1>
      <p className="mt-4 max-w-2xl text-paper/75">
        Review a radar recommendation, click Generate, and we pull a 1688-shaped pack: gallery,
        description, specifications, factory terms, and price tiers. On this public static desk the
        listing is saved in your browser. A Node host (DigitalOcean) also writes SQLite.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={exportShopify}
          className="rounded-full bg-rust px-4 py-2 font-mono text-[11px] uppercase tracking-[0.16em] text-ink"
        >
          Export Shopify CSV
        </button>
        <button
          type="button"
          onClick={exportJson}
          className="rounded-full border border-white/15 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.16em] text-mist"
        >
          Export JSON
        </button>
        <Link
          href="/"
          className="rounded-full border border-white/15 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.16em] text-mist"
        >
          Back to radar
        </Link>
      </div>
      {products.length === 0 ? (
        <p className="panel mt-10 p-8 text-mist">
          Nothing sourced yet. Open a recommendation and click Generate listing.
        </p>
      ) : (
        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {products.map((p) => {
            const thumb = p.images[0]?.path ?? p.images[0]?.sourceUrl;
            return (
              <Link key={p.id} href={`/storefront/${p.id}`} className="panel overflow-hidden hover:border-rust/40">
                <div className="relative h-40 bg-ink-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={thumb} alt={p.title} className="h-40 w-full object-cover" />
                </div>
                <div className="p-5">
                  <p className="kicker">{p.vendor}</p>
                  <h2 className="mt-1 font-serif text-2xl">{p.title}</h2>
                  <p className="mt-1 font-mono text-xs text-mist">
                    1688 {p.sourceOfferId} · {p.liveFetch ? "live API" : "factory pack"}
                  </p>
                  <div className="mt-4 flex justify-between font-mono text-xs uppercase tracking-wider text-mist">
                    <span>Retail {usd(p.retailPriceUsd)}</span>
                    <span>Factory {usd(p.factoryPriceUsd)}</span>
                    <span>{p.images.length} images</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
