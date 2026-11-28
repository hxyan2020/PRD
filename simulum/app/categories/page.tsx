import { CategoryGrid } from "@/components/CategoryGrid";
import { listCategories } from "@/lib/db";
import { ensureSeeded } from "@/lib/scanner";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  await ensureSeeded();
  const categories = await listCategories();

  return (
    <section className="pt-4 sm:pt-8">
      <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-signal">Taxonomy</p>
      <h1 className="mt-2 font-display text-4xl text-ink sm:text-5xl">Categories</h1>
      <p className="mt-3 max-w-2xl text-ink-soft">
        Evidence can belong to multiple categories. Counts show how many unique claims currently
        sit in each lane.
      </p>
      <div className="mt-10">
        <CategoryGrid categories={categories} />
      </div>
    </section>
  );
}
