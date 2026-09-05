import Image from "next/image";
import Link from "next/link";
import type { ScoredProduct } from "@/lib/types";
import { compact, pct, usd } from "@/lib/format";
import { RegionPills } from "./RegionPills";
import { ScoreRing } from "./ScoreRing";

export function OpportunityCard({ product }: { product: ScoredProduct }) {
  const factory = product.factory[0];
  const tiktok = product.social.find((s) => s.platform === "tiktok");
  const xhs = product.social.find((s) => s.platform === "xiaohongshu");
  const gap = product.whitespaceRegions.length > 0;

  return (
    <Link
      href={`/products/${product.slug}`}
      className="panel group flex flex-col overflow-hidden transition hover:-translate-y-0.5 hover:border-rust/40"
    >
      <div className="relative h-44 overflow-hidden">
        <Image
          src={product.image}
          alt={product.imageAlt}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover transition duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/20 to-transparent" />
        <div className="absolute left-3 top-3 flex gap-2">
          {gap ? <span className="chip chip-gold">Whitespace</span> : null}
          {product.maxMarginPct != null ? (
            <span className="chip chip-signal">Max gap {pct(product.maxMarginPct)}</span>
          ) : (
            <span className="chip chip-gold">No retail comps</span>
          )}
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="kicker">{product.category}</p>
            <h2 className="mt-1 font-serif text-2xl leading-tight">{product.name}</h2>
            <p className="mt-1 font-mono text-xs text-mist">{product.nameZh}</p>
          </div>
          <ScoreRing score={product.score.total} />
        </div>
        <p className="line-clamp-2 text-sm leading-relaxed text-paper/80">{product.summary}</p>
        <RegionPills markets={product.markets} />
        <div className="mt-auto grid grid-cols-3 gap-2 border-t border-white/10 pt-4 font-mono text-[11px] uppercase tracking-wider text-mist">
          <div>
            <div>Factory</div>
            <div className="mt-1 text-paper">{usd(factory.unitPriceUsd)}</div>
          </div>
          <div>
            <div>Suppliers</div>
            <div className="mt-1 text-paper">{compact(factory.supplierCount)}</div>
          </div>
          <div>
            <div>Social 7d</div>
            <div className="mt-1 text-paper">
              {compact((tiktok?.views7d ?? 0) + (xhs?.views7d ?? 0))}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
