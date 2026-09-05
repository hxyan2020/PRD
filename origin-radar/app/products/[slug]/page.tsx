import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProduct, getProducts } from "@/lib/catalog";
import { compact, cny, pct, searchHref, usd } from "@/lib/format";
import { HeatmapGrid } from "@/components/HeatmapGrid";
import { MarketTable } from "@/components/MarketTable";
import { ScoreRing } from "@/components/ScoreRing";
import { Sparkline } from "@/components/Sparkline";
import { GenerateButton } from "@/components/GenerateButton";
import { FulfillmentChips } from "@/components/FulfillmentChips";
import { PriceZoneBar } from "@/components/PriceZoneBar";
import { logisticsFor } from "@/lib/factory-packs";

export function generateStaticParams() {
  return getProducts().map((p) => ({ slug: p.slug }));
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) notFound();
  const factory = product.factory[0];
  const logistics = logisticsFor(product.slug);

  return (
    <article className="space-y-10">
      <Link href="/" className="font-mono text-[11px] uppercase tracking-[0.18em] text-mist hover:text-paper">
        ← All signals
      </Link>

      <header className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="relative min-h-[280px] overflow-hidden rounded-3xl border border-white/10">
          <Image src={product.image} alt={product.imageAlt} fill className="object-cover" priority />
        </div>
        <div className="flex flex-col">
          <p className="kicker">{product.category}</p>
          <h1 className="mt-2 font-serif text-5xl leading-tight">{product.name}</h1>
          <p className="mt-2 font-mono text-sm text-mist">{product.nameZh}</p>
          <p className="mt-4 text-base leading-relaxed text-paper/80">{product.summary}</p>
          <p className="mt-4 rounded-2xl border border-rust/30 bg-rust/10 p-4 text-sm leading-relaxed">
            {product.whyNow}
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-6">
            <ScoreRing score={product.score.total} size={88} />
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 font-mono text-[11px] uppercase tracking-wider text-mist">
              <div>
                Factory trend <span className="text-paper">{product.score.factoryTrend}</span>
              </div>
              <div>
                Social heat <span className="text-paper">{product.score.socialHeat}</span>
              </div>
              <div>
                Search demand <span className="text-paper">{product.score.searchDemand}</span>
              </div>
              <div>
                Market gap <span className="text-paper">{product.score.marketGap}</span>
              </div>
              <div>
                Supply ease <span className="text-paper">{product.score.supplyEase}</span>
              </div>
            </div>
          </div>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <GenerateButton slug={product.slug} />
            <a
              href={searchHref(product)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex rounded-full border border-white/15 px-5 py-2.5 font-mono text-[11px] uppercase tracking-[0.16em] text-mist hover:text-paper"
            >
              Open factory listings
            </a>
          </div>
          <div className="mt-6">
            <FulfillmentChips logistics={logistics} />
            <p className="mt-3 text-sm leading-relaxed text-mist">{logistics.customNotes}</p>
            <p className="mt-1 text-sm leading-relaxed text-mist">{logistics.overseasNotes}</p>
          </div>
        </div>
      </header>

      <section>
        <h2 className="mb-4 font-serif text-3xl">Recommended price zone</h2>
        <p className="mb-4 max-w-2xl text-sm text-paper/75">
          Floor covers landed cost at a 38% gross. Recommended sits in the target market: whitespace
          uses category comps, competitive markets shade the average, saturated markets hug the low
          end. Generate uses the best-region recommended as storefront retail.
        </p>
        <PriceZoneBar zones={product.priceZones} highlight={product.bestRegion} />
        <ul className="mt-4 space-y-2 text-sm text-paper/80">
          {product.priceZones.map((z) => (
            <li key={z.region}>{z.rationale}</li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-4 font-serif text-3xl">Factory-direct sources</h2>
        <div className="overflow-x-auto rounded-2xl border border-white/10">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-ink-3 font-mono text-[11px] uppercase tracking-widest text-mist">
              <tr>
                <th className="px-4 py-3">Platform</th>
                <th>Cluster</th>
                <th>Unit</th>
                <th>MOQ</th>
                <th>Suppliers</th>
                <th>Verified</th>
                <th>30d orders</th>
                <th>WoW</th>
              </tr>
            </thead>
            <tbody>
              {product.factory.map((f) => (
                <tr key={f.platform} className="border-t border-white/10">
                  <td className="px-4 py-3 font-medium">{f.platform}</td>
                  <td>{f.cluster}</td>
                  <td>
                    {usd(f.unitPriceUsd)}{" "}
                    <span className="text-mist">({cny(f.unitPriceCny)})</span>
                  </td>
                  <td>{f.moq}</td>
                  <td>{compact(f.supplierCount)}</td>
                  <td>{compact(f.verifiedFactories)}</td>
                  <td>{compact(f.orders30d)}</td>
                  <td className={f.velocityWoW >= 0 ? "text-signal" : "text-rose-400"}>
                    {f.velocityWoW > 0 ? "+" : ""}
                    {f.velocityWoW}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-sm text-mist">
          Primary 1688 price {usd(factory.unitPriceUsd)} from {compact(factory.supplierCount)}{" "}
          suppliers ({compact(factory.verifiedFactories)} verified factories).
        </p>
      </section>

      <section>
        <h2 className="mb-4 font-serif text-3xl">Does it already exist in the target markets?</h2>
        <MarketTable product={product} />
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div>
          <h2 className="mb-4 font-serif text-3xl">Search demand</h2>
          <div className="panel p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-mono text-xs text-mist">{product.search.keyword}</p>
                <p className="font-serif text-4xl">{product.search.globalIndex}</p>
                <p className="text-sm text-mist">
                  Global index · {product.search.risingPct > 0 ? "+" : ""}
                  {product.search.risingPct}% related-query lift
                </p>
              </div>
              <Sparkline values={product.search.sparkline} className="w-40" />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {product.search.related.map((k) => (
                <span key={k} className="chip">
                  {k}
                </span>
              ))}
            </div>
          </div>
        </div>
        <div>
          <h2 className="mb-4 font-serif text-3xl">Social 7d</h2>
          <div className="space-y-3">
            {product.social.map((s) => (
              <div key={s.platform} className="panel flex items-center justify-between p-4">
                <div>
                  <p className="font-mono text-[11px] uppercase tracking-widest text-mist">
                    {s.platform} · {s.trend}
                  </p>
                  <p className="mt-1 text-sm">
                    {compact(s.mentions7d)} mentions · {compact(s.views7d)} views
                  </p>
                </div>
                <span className="chip">{s.engagementRate}% eng</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section>
        <HeatmapGrid products={getProducts()} initialSlug={product.slug} />
      </section>

      <section>
        <h2 className="mb-4 font-serif text-3xl">What people are saying</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {product.social.flatMap((s) =>
            s.samplePosts.map((post) => (
              <blockquote key={post.author + post.time} className="panel p-5">
                <p className="font-mono text-[11px] uppercase tracking-widest text-mist">
                  {s.platform} · {post.time} · {post.author}
                </p>
                <p className="mt-3 font-serif text-xl leading-snug">“{post.text}”</p>
                <p className="mt-3 text-sm text-mist">{compact(post.likes)} likes</p>
              </blockquote>
            )),
          )}
        </div>
      </section>
    </article>
  );
}
