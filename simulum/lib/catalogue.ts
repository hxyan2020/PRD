import {
  MERGE_THRESHOLD,
  fingerprintOf,
  similarityScore,
} from "@/lib/fingerprint";
import {
  categoryIdsBySlugs,
  countUniqueEvidence,
  ensureCategories,
  insertEvidence,
  listPublishedLite,
  mergeIntoEvidence,
  recordScanRun,
} from "@/lib/db";
import type { EvidenceCandidate, ScanResult } from "@/lib/types";
import { randomUUID } from "node:crypto";

export type IngestOutcome =
  | { action: "inserted"; evidenceId: string; slug: string }
  | { action: "merged"; evidenceId: string; slug: string; score: number }
  | { action: "skipped"; reason: string };

function findBestMatch(
  candidate: EvidenceCandidate,
  catalogue: Array<{
    id: string;
    title: string;
    summary: string;
    fingerprint: string;
    slug: string;
  }>,
): { id: string; slug: string; score: number } | null {
  const fp = fingerprintOf(candidate.title, candidate.summary);
  let best: { id: string; slug: string; score: number } | null = null;

  for (const item of catalogue) {
    let score = 0;
    if (item.fingerprint === fp) {
      score = 1;
    } else {
      score = similarityScore(
        candidate.title,
        candidate.summary,
        item.title,
        item.summary,
      );
    }
    if (!best || score > best.score) {
      best = { id: item.id, slug: item.slug, score };
    }
  }

  if (!best || best.score < MERGE_THRESHOLD) return null;
  return best;
}

/** Compare a candidate against the catalogue; merge if similar, else insert as new unique evidence. */
export async function ingestCandidate(
  candidate: EvidenceCandidate,
  catalogue?: Array<{
    id: string;
    title: string;
    summary: string;
    fingerprint: string;
    slug: string;
  }>,
): Promise<IngestOutcome> {
  await ensureCategories();
  const live = catalogue ?? (await listPublishedLite());
  const match = findBestMatch(candidate, live);
  const categoryIds = await categoryIdsBySlugs(candidate.categorySlugs);
  const language = candidate.language ?? candidate.source.language ?? "en";
  const source = {
    url: candidate.source.url,
    title: candidate.source.title ?? candidate.title,
    snippet: candidate.source.snippet ?? candidate.summary.slice(0, 280),
    language: candidate.source.language ?? language,
    publisher: candidate.source.publisher ?? "",
  };

  if (!candidate.source.url?.startsWith("http")) {
    return { action: "skipped", reason: "invalid-source-url" };
  }

  if (match) {
    const merged = await mergeIntoEvidence({
      evidenceId: match.id,
      language,
      categoryIds,
      source,
      detailAppend: candidate.detail,
    });
    if (!merged) return { action: "skipped", reason: "merge-failed" };
    return {
      action: "merged",
      evidenceId: merged.id,
      slug: merged.slug,
      score: match.score,
    };
  }

  const created = await insertEvidence({
    title: candidate.title,
    summary: candidate.summary,
    detail: candidate.detail ?? "",
    fingerprint: fingerprintOf(candidate.title, candidate.summary),
    language,
    languages: [language],
    categoryIds,
    source,
  });

  // Keep in-memory catalogue warm for batch ingest
  live.push({
    id: created.id,
    title: created.title,
    summary: created.summary,
    fingerprint: created.fingerprint,
    slug: created.slug,
  });

  return { action: "inserted", evidenceId: created.id, slug: created.slug };
}

export async function ingestCandidates(
  candidates: EvidenceCandidate[],
  source = "batch-ingest",
): Promise<ScanResult> {
  const startedAt = new Date().toISOString();
  const catalogue = await listPublishedLite();
  let merged = 0;
  let inserted = 0;
  const notes: string[] = [];

  for (const candidate of candidates) {
    const outcome = await ingestCandidate(candidate, catalogue);
    if (outcome.action === "inserted") inserted += 1;
    else if (outcome.action === "merged") merged += 1;
    else notes.push(outcome.reason);
  }

  const finishedAt = new Date().toISOString();
  const runId = randomUUID();
  const uniqueTotal = await countUniqueEvidence();
  const result: ScanResult = {
    runId,
    startedAt,
    finishedAt,
    candidates: candidates.length,
    merged,
    inserted,
    uniqueTotal,
    source,
    notes: notes.slice(0, 12).join("; "),
  };
  await recordScanRun(result);
  return result;
}
