import { EvidenceCatalogue } from "@/components/EvidenceCatalogue";
import { countUniqueEvidence, listEvidence } from "@/lib/db";
import { ensureSeeded } from "@/lib/scanner";

export const dynamic = "force-dynamic";

export default async function EvidencePage() {
  await ensureSeeded();
  const [evidence, total] = await Promise.all([
    listEvidence({ limit: 100 }),
    countUniqueEvidence(),
  ]);

  return <EvidenceCatalogue evidence={evidence} total={total} />;
}
