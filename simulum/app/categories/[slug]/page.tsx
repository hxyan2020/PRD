import Link from "next/link";
import { notFound } from "next/navigation";
import { EvidenceList } from "@/components/EvidenceList";
import { getCategoryBySlug, listEvidence } from "@/lib/db";
import { ensureSeeded } from "@/lib/scanner";

export const dynamic = "force-dynamic";

export default async function CategoryDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await ensureSeeded();
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();
  const evidence = await listEvidence({ categorySlug: slug, limit: 100 });

  return (
    <section className="pt-4 sm:pt-8">
      <Link
        href="/categories"
        className="font-mono text-[11px] uppercase tracking-wider text-mist hover:text-signal"
      >
        ← Categories
      </Link>
      <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
        {category.name}
      </h1>
      <p className="mt-3 max-w-2xl text-ink-soft">{category.description}</p>
      <p className="mt-2 font-mono text-xs uppercase tracking-wider text-mist">
        {category.evidenceCount ?? evidence.length} unique evidence
      </p>
      <div className="mech-rule mt-8" />
      <div className="mt-0">
        <EvidenceList
          evidence={evidence}
          emptyLabel="No evidence tagged in this category yet."
        />
      </div>
    </section>
  );
}
