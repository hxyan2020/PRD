import { notFound } from "next/navigation";
import { CategoryDetailView } from "@/components/CategoryDetailView";
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

  return <CategoryDetailView category={category} evidence={evidence} />;
}
