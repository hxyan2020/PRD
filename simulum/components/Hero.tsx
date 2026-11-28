import Link from "next/link";
import { EvidenceCounter } from "@/components/EvidenceCounter";

export function Hero({
  uniqueEvidence,
  languageCount,
  lastScanAt,
}: {
  uniqueEvidence: number;
  languageCount: number;
  lastScanAt: string | null;
}) {
  const scanned =
    lastScanAt &&
    new Date(lastScanAt).toLocaleString("en-SG", {
      timeZone: "Asia/Singapore",
      dateStyle: "medium",
      timeStyle: "short",
    });

  return (
    <section className="relative overflow-hidden pb-10 pt-6 sm:pb-14 sm:pt-10">
      <div
        className="pointer-events-none absolute -right-16 top-0 h-72 w-72 animate-drift rounded-full bg-signal/15 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -left-10 bottom-0 h-56 w-56 rounded-full bg-ink/5 blur-3xl"
        aria-hidden
      />

      <p className="animate-rise font-mono text-[11px] uppercase tracking-[0.28em] text-signal">
        Worldwide · multilingual · deduplicated
      </p>

      <h1 className="animate-rise mt-4 font-display text-[clamp(2.6rem,8vw,5rem)] leading-[0.95] tracking-tight text-ink [animation-delay:80ms]">
        SIMULUM
      </h1>

      <p className="animate-rise mt-5 max-w-xl text-lg text-ink-soft sm:text-xl [animation-delay:140ms]">
        Unique evidence people have posted that our universe is simulated —
        scanned across languages, merged when it is the same claim, counted when it is new.
      </p>

      <div className="animate-rise relative mt-10 [animation-delay:200ms]">
        <div className="absolute inset-x-0 -top-2 h-px overflow-hidden">
          <div className="h-full w-1/3 animate-scan-line bg-gradient-to-b from-transparent via-signal to-transparent opacity-40" />
        </div>
        <EvidenceCounter value={uniqueEvidence} />
        <p className="mt-3 font-mono text-sm uppercase tracking-[0.18em] text-mist">
          unique evidence · and counting
        </p>
        <p className="mt-2 text-sm text-mist">
          {languageCount} languages indexed
          {scanned ? ` · last scan ${scanned} (Asia/Singapore)` : ""}
        </p>
      </div>

      <div className="animate-rise mt-8 flex flex-wrap gap-3 [animation-delay:280ms]">
        <Link
          href="/evidence"
          className="touch-target inline-flex items-center bg-ink px-5 py-3 text-sm font-medium text-paper transition hover:bg-ink-soft"
        >
          Browse evidence
        </Link>
        <Link
          href="/categories"
          className="touch-target inline-flex items-center border border-ink/20 bg-transparent px-5 py-3 text-sm font-medium text-ink transition hover:border-signal hover:text-signal"
        >
          Explore categories
        </Link>
      </div>
    </section>
  );
}
