import { randomUUID } from "node:crypto";
import { countIdeas, recordScanRun, upsertIdea } from "./db";
import { SEED_IDEAS } from "./seed-ideas";
import type { StartupIdea } from "./types";

export type ScanResult = {
  runId: string;
  inserted: number;
  updated: number;
  total: number;
  source: string;
  startedAt: string;
  finishedAt: string;
};

/**
 * Scans curated worldwide startup + fundraising signals into SQLite.
 * Designed as a pluggable ingest: swap `fetchSignals()` for live APIs later.
 */
export function runScan(options: { source?: string } = {}): ScanResult {
  const source = options.source ?? "worldwide-curated-feed";
  const startedAt = new Date().toISOString();
  const signals = fetchSignals();

  let inserted = 0;
  let updated = 0;

  for (const idea of signals) {
    const stamped: StartupIdea = {
      ...idea,
      scannedAt: startedAt,
      source,
    };
    const result = upsertIdea(stamped);
    if (result.inserted) inserted += 1;
    else updated += 1;
  }

  const finishedAt = new Date().toISOString();
  const runId = randomUUID();
  recordScanRun({
    id: runId,
    startedAt,
    finishedAt,
    inserted,
    updated,
    source,
  });

  return {
    runId,
    inserted,
    updated,
    total: countIdeas(),
    source,
    startedAt,
    finishedAt,
  };
}

export function ensureSeeded(): void {
  if (countIdeas() === 0) {
    runScan({ source: "bootstrap-seed" });
  }
}

/** Placeholder for live fundraising/news crawlers. */
function fetchSignals(): StartupIdea[] {
  return SEED_IDEAS.map((idea) => ({ ...idea }));
}
