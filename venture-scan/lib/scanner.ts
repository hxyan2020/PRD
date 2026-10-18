import { randomUUID } from "node:crypto";
import { clearIdeas, countIdeas, getIdeaBySlug, recordScanRun, upsertIdea } from "./db";
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
export function runScan(options: { source?: string; replace?: boolean } = {}): ScanResult {
  const source = options.source ?? "worldwide-curated-feed";
  const startedAt = new Date().toISOString();
  const signals = fetchSignals();
  const replace = options.replace ?? false;

  if (replace) {
    clearIdeas();
  }

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

/**
 * Ensure SQLite holds the full sourced catalog.
 * Re-runs ingest when the DB is empty, behind, or mismatched with SEED_IDEAS.
 */
export function ensureSeeded(): void {
  const expected = SEED_IDEAS.length;
  const current = countIdeas();
  if (current === 0 || current !== expected) {
    runScan({ source: current === 0 ? "bootstrap-seed" : "catalog-sync", replace: true });
    return;
  }
  const sample = SEED_IDEAS[0];
  const row = getIdeaBySlug(sample.slug);
  if (!row || row.website !== sample.website) {
    runScan({ source: "catalog-resync", replace: true });
  }
}

/** Placeholder for live fundraising/news crawlers. */
function fetchSignals(): StartupIdea[] {
  return SEED_IDEAS.map((idea) => ({ ...idea }));
}
