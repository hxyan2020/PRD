import Link from "next/link";
import { listSourced } from "@/lib/db";
import { usd } from "@/lib/format";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default function StorefrontPage() {
  const products = listSourced();
  return (
    <div>
      <p className="kicker">Storefront prep</p>
      <h1 className="mt-2 font-serif text-5xl">Sourced listings, ready to load a store</h1>
      <p className="mt-4 max-w-2xl text-paper/75">
        Review a radar recommendation, click Generate, and we pull a 1688-shaped pack: gallery,
        description, specifications, factory terms, and price tiers — then save it in SQLite. Export
        Shopify CSV when you are ready to stand up the storefront.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <a
          href="/api/storefront/export?format=shopify"
          className="rounded-full bg-rust px-4 py-2 font-mono text-[11px] uppercase tracking-[0.16em] text-ink"
        >
          Export Shopify CSV
        </a>
        <a
          href="/api/storefront/export?format=json"
          className="rounded-full border border-white/15 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.16em] text-mist"
        >
          Export JSON
        </a>
        <Link href="/" className="rounded-full border border-white/15 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.16em] text-mist">
          Back to radar
        </Link>
      </div>
      {products.length === 0 ? (
        <p className="panel mt-10 p-8 text-mist">
          Nothing sourced yet. Open a recommendation and click Generate listing.
        </p>
      ) : (
        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {products.map((p) => (
            <Link key={p.id} href={`/storefront/${p.id}`} className="panel overflow-hidden hover:border-rust/40">
              <div className="relative h-40 bg-ink-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.images[0]?.path ?? p.images[0]?.sourceUrl}
                  alt={p.title}
                  className="h-40 w-full object-cover"
                />
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
          ))}
        </div>
      )}
    </div>
  );
}
