import Link from "next/link";
import { compact } from "@/lib/format";
import { CATALOG_AS_OF, stats } from "@/lib/catalog";

export function RadarHero() {
  const s = stats();
  return (
    <section className="mb-12 grid items-center gap-10 lg:grid-cols-[1.2fr_0.8fr]">
      <div>
        <p className="kicker">Dropshipping intelligence · {CATALOG_AS_OF}</p>
        <h1 className="mt-4 max-w-3xl font-serif text-4xl leading-[1.05] sm:text-6xl">
          What factories are shipping this week — and whether your market already sells it.
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-paper/75">
          OriginRadar watches recently popular items on 1688, Pinduoduo, and Alibaba, then overlays
          Google keyword heat plus TikTok and Xiaohongshu chatter. For North America, Southeast Asia,
          and Europe we flag whitespace, or — if the product already exists — the price gap, seller
          count, and supplier depth.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/queue"
            className="rounded-full bg-rust px-5 py-2.5 font-mono text-[11px] uppercase tracking-[0.16em] text-ink hover:bg-rust-dim"
          >
            Open today&apos;s queue
          </Link>
          <Link
            href="/storefront"
            className="rounded-full border border-white/15 px-5 py-2.5 font-mono text-[11px] uppercase tracking-[0.16em] text-mist hover:text-paper"
          >
            Sourced storefront
          </Link>
        </div>
      </div>
      <div className="relative mx-auto h-64 w-64">
        <div className="absolute inset-0 rounded-full border border-white/10" />
        <div className="absolute inset-6 rounded-full border border-white/10" />
        <div className="absolute inset-12 rounded-full border border-rust/40" />
        <div className="radar-sweep absolute inset-0 rounded-full" />
        <div className="absolute inset-0 grid place-items-center">
          <div className="text-center">
            <div className="font-serif text-5xl">{s.whitespace}</div>
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-mist">
              whitespace SKUs
            </div>
          </div>
        </div>
      </div>
      <dl className="col-span-full grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ["Signals", String(s.products)],
          ["Hot (≥70)", String(s.hot)],
          ["Avg listed margin", `${s.avgMargin}%`],
          ["Factory suppliers", compact(s.suppliers)],
        ].map(([k, v]) => (
          <div key={k} className="panel px-4 py-3">
            <dt className="font-mono text-[10px] uppercase tracking-[0.18em] text-mist">{k}</dt>
            <dd className="font-serif text-3xl">{v}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
