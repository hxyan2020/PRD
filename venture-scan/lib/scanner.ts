import { randomUUID } from "node:crypto";
import { catalogIdeas, catalogActiveIdeas } from "./catalog";
import { clearIdeas, countIdeas, getIdeaBySlug, listIdeas, recordScanRun, upsertIdea } from "./db";
import { isActiveIdea } from "./archived-ideas";
import type { StartupIdea } from "./types";

export type ScanResult = {
  runId: string;
  inserted: number;
  updated: number;
  total: number;
  active: number;
  archived: number;
  source: string;
  startedAt: string;
  finishedAt: string;
};

/**
 * Scans curated worldwide startup + fundraising signals into SQLite.
 * Designed as a pluggable ingest: swap `fetchSignals()` for live APIs later.
 * Active + archived historical ideas are always upserted together so search
 * can find retired catalog entries.
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
      scannedAt: idea.status === "archived" ? idea.scannedAt : startedAt,
      source: idea.status === "archived" ? idea.source : source,
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

  const all = listIdeas();
  return {
    runId,
    inserted,
    updated,
    total: all.length,
    active: all.filter(isActiveIdea).length,
    archived: all.filter((i) => !isActiveIdea(i)).length,
    source,
    startedAt,
    finishedAt,
  };
}

/**
 * Ensure SQLite holds the full sourced catalog (active + archived).
 * Re-runs ingest when the DB is empty, behind, or mismatched with the live seed.
 */
export function ensureSeeded(): void {
  const expected = catalogIdeas().length;
  const current = countIdeas();
  if (current === 0 || current !== expected) {
    runScan({ source: current === 0 ? "bootstrap-seed" : "catalog-sync", replace: true });
    return;
  }
  const sample = catalogActiveIdeas()[0];
  const row = getIdeaBySlug(sample.slug);
  if (!row || row.website !== sample.website || (row.status ?? "active") !== "active") {
    runScan({ source: "catalog-resync", replace: true });
  }
}

/** Placeholder for live fundraising/news crawlers — plus retained archive. */
function fetchSignals(): StartupIdea[] {
  return catalogIdeas().map((idea) => ({ ...idea }));
}
