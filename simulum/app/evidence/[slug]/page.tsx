import { notFound } from "next/navigation";
import { EvidenceDetail } from "@/components/EvidenceDetail";
import { getEvidenceBySlug, listEvidence } from "@/lib/db";
import { findRelatedEvidence } from "@/lib/related";
import { ensureSeeded } from "@/lib/scanner";

export const dynamic = "force-dynamic";

export default async function EvidenceDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await ensureSeeded();
  const { slug } = await params;
  const item = await getEvidenceBySlug(slug);
  if (!item || item.status !== "published") notFound();

  const catalogue = await listEvidence({ limit: 200 });
  const related = findRelatedEvidence(item, catalogue, 8);

  return <EvidenceDetail item={item} related={related} />;
}
