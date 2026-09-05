"use client";

import Image from "next/image";
import Link from "next/link";
import type { ScoredProduct } from "@/lib/types";
import { pct, usd } from "@/lib/format";
import { logisticsFor } from "@/lib/factory-packs";
import { DeskButtons } from "./DeskButtons";
import { FulfillmentChips } from "./FulfillmentChips";
import { GenerateButton } from "./GenerateButton";
import { PriceZoneBar } from "./PriceZoneBar";
import { ScoreRing } from "./ScoreRing";

export function QueueDesk({
  day,
  review,
  collected,
  discarded,
  sourced,
}: {
  day: string;
  review: ScoredProduct[];
  collected: ScoredProduct[];
  discarded: ScoredProduct[];
  sourced: Record<string, string>;
}) {
  const collectedSet = new Set(collected.map((p) => p.slug));
  const discardedSet = new Set(discarded.map((p) => p.slug));

  return (
    <div className="space-y-10">
      <header>
        <p className="kicker">Daily review · {day}</p>
        <h1 className="mt-2 font-serif text-5xl">Eight to review today</h1>
        <p className="mt-4 max-w-2xl text-paper/75">
          Generate pulls the 1688 pack into SQLite. Collect keeps a shortlist. Discard hides a SKU
          from today&apos;s deck — it can come back tomorrow.
        </p>
        <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.18em] text-mist">
          {review.length} in queue · {collected.length} collected · {Object.keys(sourced).length} sourced
        </p>
      </header>

      {review.length === 0 ? (
        <p className="panel p-8 text-mist">Queue clear for today. Restore a discard or check back tomorrow.</p>
      ) : (
        <div className="space-y-5">
          {review.map((p, i) => (
            <QueueRow
              key={p.slug}
              index={i + 1}
              product={p}
              collected={collectedSet.has(p.slug)}
              discarded={false}
            />
          ))}
        </div>
      )}

      {collected.length > 0 ? (
        <section>
          <h2 className="font-serif text-3xl">Collected</h2>
          <div className="mt-4 space-y-4">
            {collected.map((p) => (
              <QueueRow key={p.slug} product={p} collected discarded={false} />
            ))}
          </div>
        </section>
      ) : null}

      {discarded.length > 0 ? (
        <section>
          <h2 className="font-serif text-3xl">Discarded today</h2>
          <div className="mt-4 space-y-4">
            {discarded.map((p) => (
              <QueueRow key={p.slug} product={p} collected={collectedSet.has(p.slug)} discarded />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function QueueRow({
  product,
  collected,
  discarded,
  index,
}: {
  product: ScoredProduct;
  collected: boolean;
  discarded: boolean;
  index?: number;
}) {
  const zone = product.priceZones.find((z) => z.region === product.bestRegion) ?? product.priceZones[0];
  const log = logisticsFor(product.slug);
  return (
    <article className="panel grid gap-4 p-4 md:grid-cols-[140px_1fr] md:p-5">
      <Link href={`/products/${product.slug}`} className="relative h-28 overflow-hidden rounded-xl md:h-full">
        <Image src={product.image} alt={product.imageAlt} fill className="object-cover" sizes="140px" />
      </Link>
      <div className="min-w-0">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="kicker">
              {index != null ? `#${index} · ` : ""}
              {product.category}
            </p>
            <Link href={`/products/${product.slug}`}>
              <h2 className="font-serif text-2xl leading-tight">{product.name}</h2>
            </Link>
            <p className="font-mono text-xs text-mist">{product.nameZh}</p>
          </div>
          <ScoreRing score={product.score.total} />
        </div>
        <p className="mt-2 line-clamp-2 text-sm text-paper/80">{product.summary}</p>
        <div className="mt-3">
          <FulfillmentChips logistics={log} />
        </div>
        <div className="mt-3">
          <PriceZoneBar zones={product.priceZones} highlight={product.bestRegion} />
        </div>
        {zone ? (
          <p className="mt-2 text-xs leading-relaxed text-mist">{zone.rationale}</p>
        ) : null}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <GenerateButton slug={product.slug} variant="compact" />
          <DeskButtons slug={product.slug} collected={collected} discarded={discarded} />
          {zone ? (
            <span className="font-mono text-[11px] uppercase tracking-widest text-mist">
              Rec {usd(zone.recommendedUsd)} · max gap {pct(product.maxMarginPct)}
            </span>
          ) : null}
        </div>
      </div>
    </article>
  );
}
