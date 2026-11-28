import { Hero } from "@/components/Hero";
import { getCatalogueStats } from "@/lib/db";
import { ensureCatalogueFresh } from "@/lib/scanner";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  await ensureCatalogueFresh();
  const stats = await getCatalogueStats();

  return (
    <Hero
      uniqueEvidence={stats.uniqueEvidence}
      languageCount={stats.languageCount}
      lastScanAt={stats.lastScanAt}
    />
  );
}
