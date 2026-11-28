import { EvidenceList } from "@/components/EvidenceList";
import { countUniqueEvidence, listEvidence } from "@/lib/db";
import { ensureSeeded } from "@/lib/scanner";

export const dynamic = "force-dynamic";

export default async function EvidencePage() {
  await ensureSeeded();
  const [evidence, total] = await Promise.all([
    listEvidence({ limit: 100 }),
    countUniqueEvidence(),
  ]);

  return (
    <section className="pt-4 sm:pt-8">
      <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-signal">Catalogue</p>
      <h1 className="mt-2 font-display text-4xl text-ink sm:text-5xl">Evidence</h1>
      <p className="mt-3 max-w-2xl text-ink-soft">
        {total.toLocaleString()} unique claims after worldwide deduplication. Multi-source
        entries show how often the same idea resurfaced in different languages or outlets.
      </p>
      <div className="mt-8">
        <EvidenceList evidence={evidence} />
      </div>
    </section>
  );
}
