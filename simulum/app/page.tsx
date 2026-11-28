import Link from "next/link";
import { CategoryGrid } from "@/components/CategoryGrid";
import { EvidenceList } from "@/components/EvidenceList";
import { Hero } from "@/components/Hero";
import { getCatalogueStats, listCategories, listEvidence } from "@/lib/db";
import { ensureCatalogueFresh } from "@/lib/scanner";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  await ensureCatalogueFresh();
  const [stats, categories, recent] = await Promise.all([
    getCatalogueStats(),
    listCategories(),
    listEvidence({ limit: 8 }),
  ]);

  return (
    <>
      <Hero
        uniqueEvidence={stats.uniqueEvidence}
        languageCount={stats.languageCount}
        lastScanAt={stats.lastScanAt}
      />

      <section className="mt-4 border-t border-line/80 pt-10">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-3xl text-ink">Latest unique evidence</h2>
            <p className="mt-2 max-w-2xl text-ink-soft">
              New candidates are compared to the catalogue. Matches merge into existing entries;
              only distinct claims raise the count.
            </p>
          </div>
          <Link
            href="/evidence"
            className="font-mono text-xs uppercase tracking-wider text-signal hover:underline"
          >
            View all →
          </Link>
        </div>
        <div className="mt-6">
          <EvidenceList evidence={recent} />
        </div>
      </section>

      <section className="mt-14 border-t border-line/80 pt-10">
        <h2 className="font-display text-3xl text-ink">Categories</h2>
        <p className="mt-2 max-w-2xl text-ink-soft">
          One piece of evidence can sit in several categories at once.
        </p>
        <div className="mt-8">
          <CategoryGrid categories={categories} />
        </div>
      </section>
    </>
  );
}
