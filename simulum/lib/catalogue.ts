import { randomUUID } from "node:crypto";
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
import { filterHdRelevantImages } from "@/lib/images";
import { rateEvidence } from "@/lib/ratings";
import { buildBody, buildCaption, englishFacingPack } from "@/lib/summarize";
import type {
  EvidenceCandidate,
  EvidenceLocalePack,
  ScanResult,
} from "@/lib/types";

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

function localePack(
  candidate: EvidenceCandidate,
  caption: string,
  body: ReturnType<typeof buildBody>,
  language: string,
): Record<string, EvidenceLocalePack> {
  const pack: EvidenceLocalePack = { caption, body };
  const translations: Record<string, EvidenceLocalePack> = {
    ...(candidate.translations ?? {}),
    [language]: candidate.translations?.[language] ?? pack,
  };
  if (!translations.en) {
    translations.en = language === "en" ? pack : englishFacingPack(candidate);
  }
  return translations;
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
  const caption = buildCaption(candidate);
  const body = buildBody(candidate);
  const images = filterHdRelevantImages(candidate.images ?? [], {
    topicHint: candidate.title,
  });
  // Never copy an unfiltered source.imageUrl — ads/logos must not leak in.
  const source = {
    url: candidate.source.url,
    title: candidate.source.title ?? candidate.title,
    snippet: candidate.source.snippet ?? candidate.summary.slice(0, 280),
    language: candidate.source.language ?? language,
    publisher: candidate.source.publisher ?? "",
    imageUrl: images[0]?.url ?? "",
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
      images,
      translation: {
        locale: language,
        pack: { caption, body },
      },
    });
    if (!merged) return { action: "skipped", reason: "merge-failed" };
    return {
      action: "merged",
      evidenceId: merged.id,
      slug: merged.slug,
      score: match.score,
    };
  }

  const ratings = rateEvidence({
    sourceCount: 1,
    languages: [language],
    sources: [
      {
        publisher: source.publisher,
        url: source.url,
        language: source.language,
      },
    ],
    categorySlugs: candidate.categorySlugs,
    lastSeenAt: new Date().toISOString(),
    firstSeenAt: new Date().toISOString(),
    hasArxiv: source.url.includes("arxiv.org"),
    hasWikipedia: source.url.includes("wikipedia.org"),
    imageCount: images.length,
  });

  const created = await insertEvidence({
    title: candidate.title,
    summary: candidate.summary,
    detail: candidate.detail ?? "",
    caption,
    body,
    images,
    ratings,
    translations: localePack(candidate, caption, body, language),
    fingerprint: fingerprintOf(candidate.title, candidate.summary),
    language,
    languages: [language],
    categoryIds,
    source,
  });

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
  options?: { sourcesScanned?: number; scheduleLabel?: string },
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
  const sourcesScanned = options?.sourcesScanned ?? candidates.length;
  const relevantSourced = inserted + merged;
  const result: ScanResult = {
    runId,
    startedAt,
    finishedAt,
    candidates: candidates.length,
    merged,
    inserted,
    uniqueTotal,
    sourcesScanned,
    relevantSourced,
    source,
    notes: notes.slice(0, 12).join("; "),
    scheduleLabel: options?.scheduleLabel ?? "",
  };
  await recordScanRun(result);
  return result;
}
