import Image from "next/image";
import Link from "next/link";
import { FACTORY_EXTRAS } from "@/lib/factory-packs";
import { productHref } from "@/lib/format";
import type { ScoredProduct } from "@/lib/types";

export function RelatedSignals({
  category,
  products,
}: {
  category: string;
  products: ScoredProduct[];
}) {
  if (products.length === 0) return null;

  return (
    <section>
      <h2 className="mb-2 font-serif text-3xl">Other shortlisted SKUs in {category}</h2>
      <p className="mb-4 max-w-2xl text-sm text-paper/75">
        Same category, separate mill SKUs — each has its own factory pack, gallery, and 1688 mill /
        product search.
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((p) => {
          const mill = FACTORY_EXTRAS[p.slug];
          return (
            <Link
              key={p.slug}
              href={productHref(p.slug)}
              className="panel flex gap-3 overflow-hidden p-3 transition hover:border-rust/40"
            >
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl">
                <Image src={p.image} alt={p.imageAlt} fill sizes="80px" className="object-cover" />
              </div>
              <div className="min-w-0">
                <p className="kicker truncate">{mill?.vendor ?? p.category}</p>
                <h3 className="mt-1 font-serif text-lg leading-tight">{p.name}</h3>
                <p className="mt-1 truncate font-mono text-[11px] text-mist">
                  {p.nameZh}
                  {mill?.vendorZh ? ` · ${mill.vendorZh}` : ""}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
