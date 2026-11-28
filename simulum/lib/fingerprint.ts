/** Normalize text for fingerprinting across languages and noise. */
export function normalizeText(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/[^\p{L}\p{N}\s]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const STOP = new Set([
  "a",
  "an",
  "the",
  "and",
  "or",
  "of",
  "to",
  "in",
  "on",
  "for",
  "is",
  "are",
  "that",
  "this",
  "with",
  "as",
  "by",
  "from",
  "be",
  "it",
  "we",
  "our",
  "de",
  "la",
  "le",
  "les",
  "des",
  "el",
  "los",
  "las",
  "un",
  "une",
  "der",
  "die",
  "das",
  "und",
  "und",
  "的",
  "是",
  "在",
  "和",
  "与",
  "了",
  "一个",
]);

export function tokenize(input: string): string[] {
  const norm = normalizeText(input);
  if (!norm) return [];
  return norm
    .split(" ")
    .map((t) => t.trim())
    .filter((t) => t.length > 1 && !STOP.has(t));
}

/** Stable fingerprint from title + summary tokens (sorted unique). */
export function fingerprintOf(title: string, summary: string): string {
  const tokens = [...new Set(tokenize(`${title} ${summary}`))].sort();
  const head = tokens.slice(0, 24).join("-");
  return head || normalizeText(title).slice(0, 64) || "unknown";
}

export function jaccard(a: string[], b: string[]): number {
  if (a.length === 0 && b.length === 0) return 1;
  if (a.length === 0 || b.length === 0) return 0;
  const setA = new Set(a);
  const setB = new Set(b);
  let inter = 0;
  for (const t of setA) if (setB.has(t)) inter += 1;
  const union = setA.size + setB.size - inter;
  return union === 0 ? 0 : inter / union;
}

export function similarityScore(
  leftTitle: string,
  leftSummary: string,
  rightTitle: string,
  rightSummary: string,
): number {
  const titleScore = jaccard(tokenize(leftTitle), tokenize(rightTitle));
  const bodyScore = jaccard(
    tokenize(`${leftTitle} ${leftSummary}`),
    tokenize(`${rightTitle} ${rightSummary}`),
  );
  return titleScore * 0.55 + bodyScore * 0.45;
}

/** Threshold above which a candidate merges into an existing evidence item. */
export const MERGE_THRESHOLD = 0.58;

export function slugify(input: string): string {
  const base = normalizeText(input)
    .replace(/[^a-z0-9\u4e00-\u9fff]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);
  return base || `evidence-${Date.now().toString(36)}`;
}
