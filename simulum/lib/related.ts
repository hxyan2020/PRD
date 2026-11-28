import { similarityScore } from "@/lib/fingerprint";
import type { Evidence, RelatedEvidence } from "@/lib/types";

const RELATED_THRESHOLD = 0.28;

export function findRelatedEvidence(
  current: Evidence,
  catalogue: Evidence[],
  limit = 8,
): RelatedEvidence[] {
  const currentCats = new Set(current.categories.map((c) => c.id));
  const scored: RelatedEvidence[] = [];

  for (const other of catalogue) {
    if (other.id === current.id) continue;
    const shared = other.categories.some((c) => currentCats.has(c.id));
    const similarity = similarityScore(
      current.caption || current.title,
      `${current.body.what} ${current.summary}`,
      other.caption || other.title,
      `${other.body.what} ${other.summary}`,
    );
    if (!shared && similarity < RELATED_THRESHOLD) continue;
    scored.push({
      evidence: other,
      similarity: Math.round(similarity * 1000) / 1000,
      reason: shared && similarity >= RELATED_THRESHOLD ? "both" : shared ? "same-category" : "content-similar",
    });
  }

  scored.sort((a, b) => {
    if (b.similarity !== a.similarity) return b.similarity - a.similarity;
    return b.evidence.sourceCount - a.evidence.sourceCount;
  });
  return scored.slice(0, limit);
}

export function similarityPercent(score: number): string {
  return `${Math.round(score * 100)}%`;
}
