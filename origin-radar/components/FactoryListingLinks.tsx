import { factoryOutboundLinks } from "@/lib/factory-links";
import type { ScoredProduct } from "@/lib/types";

export function FactoryListingLinks({ product }: { product: ScoredProduct }) {
  const links = factoryOutboundLinks(product);
  const sku = links.find((l) => l.kind === "sku");
  const mill = links.find((l) => l.kind === "mill");
  const extra = links.filter((l) => l.kind === "alibaba-sku" || l.kind === "alibaba-mill");

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        {sku ? (
          <a
            href={sku.href}
            target="_blank"
            rel="noreferrer"
            className="inline-flex rounded-full border border-white/15 px-5 py-2.5 font-mono text-[11px] uppercase tracking-[0.16em] text-mist hover:text-paper"
          >
            Open factory listings
          </a>
        ) : null}
        {mill ? (
          <a
            href={mill.href}
            target="_blank"
            rel="noreferrer"
            className="inline-flex rounded-full border border-white/15 px-5 py-2.5 font-mono text-[11px] uppercase tracking-[0.16em] text-mist hover:text-paper"
          >
            Open mill page
          </a>
        ) : null}
      </div>
      {extra.length ? (
        <p className="flex flex-wrap gap-x-4 gap-y-1 font-mono text-[11px] uppercase tracking-wider text-mist">
          {extra.map((l) => (
            <a key={l.kind} href={l.href} target="_blank" rel="noreferrer" className="hover:text-paper">
              {l.label} →
            </a>
          ))}
        </p>
      ) : null}
    </div>
  );
}
