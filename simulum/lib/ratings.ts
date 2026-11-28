import type {
  Evidence,
  EvidenceRatings,
  RatingDimension,
} from "@/lib/types";

function dim(
  label: string,
  score: number,
  rationale: string,
  evidence: string[],
  max = 5,
): RatingDimension {
  const uniqueEvidence = [...new Set(evidence.filter(Boolean))];
  return {
    score: Math.max(0, Math.min(max, Math.round(score * 10) / 10)),
    max,
    label,
    rationale,
    evidence: uniqueEvidence,
  };
}

function host(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

/**
 * Rate from observable catalogue facts only — never invent citations.
 * Every score is explained by `rationale` + concrete `evidence` strings
 * (URLs, hosts, category slugs, timestamps) taken from the sourced record.
 */
export function rateEvidence(input: {
  sourceCount: number;
  languages: string[];
  sources: Array<{ publisher: string; url: string; language: string }>;
  categorySlugs: string[];
  lastSeenAt: string;
  firstSeenAt: string;
  hasArxiv: boolean;
  hasWikipedia: boolean;
  imageCount: number;
}): EvidenceRatings {
  const publishers = [
    ...new Set(
      input.sources.map((s) => s.publisher || host(s.url)).filter(Boolean),
    ),
  ];
  const hosts = [
    ...new Set(input.sources.map((s) => host(s.url)).filter(Boolean)),
  ];
  const langs = [...new Set(input.languages.filter(Boolean))];
  const sourceUrls = input.sources.map((s) => s.url).filter(Boolean);

  const multiSources = dim(
    "Multiple sources",
    Math.min(5, Math.max(0, input.sourceCount)),
    `Counted ${input.sourceCount} linked source URL(s) on this catalogue entry.`,
    sourceUrls.slice(0, 8),
  );

  const crossReferenced = dim(
    "Cross-referenced",
    Math.min(
      5,
      publishers.length + Math.max(0, hosts.length - 1) * 0.5 + Math.max(0, langs.length - 1) * 0.5,
    ),
    `Independent publishers: ${publishers.join(", ") || "none"}; hosts: ${hosts.join(", ") || "none"}; languages: ${langs.join(", ") || "n/a"}.`,
    [
      ...publishers.map((p) => `publisher:${p}`),
      ...hosts.map((h) => `host:${h}`),
      ...langs.map((l) => `language:${l}`),
    ],
  );

  const multiWitness = dim(
    "Multiple witnesses / retellings",
    Math.min(5, langs.length + Math.max(0, input.sourceCount - 1) * 0.5),
    `Observed in ${langs.length} language(s) across ${input.sourceCount} linked report(s).`,
    [
      ...langs.map((l) => `language:${l}`),
      ...sourceUrls.slice(0, 6),
    ],
  );

  const lastMs = new Date(input.lastSeenAt).getTime();
  const firstMs = new Date(input.firstSeenAt).getTime();
  const days = Number.isFinite(lastMs)
    ? (Date.now() - lastMs) / (1000 * 60 * 60 * 24)
    : 9999;
  const recencyScore = !Number.isFinite(lastMs)
    ? 0
    : days <= 7
      ? 5
      : days <= 30
        ? 4
        : days <= 180
          ? 3
          : days <= 365
            ? 2
            : 1;
  const recency = dim(
    "Recency",
    recencyScore,
    Number.isFinite(lastMs)
      ? `Last indexed ${new Date(lastMs).toISOString().slice(0, 10)}; first seen ${Number.isFinite(firstMs) ? new Date(firstMs).toISOString().slice(0, 10) : "unknown"}.`
      : "No valid last-seen timestamp on this entry — recency kept at 0.",
    [
      `lastSeenAt:${input.lastSeenAt}`,
      `firstSeenAt:${input.firstSeenAt}`,
      `daysSinceLastSeen:${Number.isFinite(days) ? Math.round(days) : "unknown"}`,
    ],
  );

  const scienceCats = input.categorySlugs.filter((s) =>
    [
      "experimental-claims",
      "physics-cosmology",
      "mathematical-structure",
      "computation-information",
    ].includes(s),
  );
  const scienceEvidence: string[] = [];
  let scienceScore = 0;
  if (input.hasArxiv) {
    scienceScore += 2.5;
    scienceEvidence.push(
      ...sourceUrls.filter((u) => u.includes("arxiv.org")).slice(0, 3),
    );
    scienceEvidence.push("host:arxiv.org");
  }
  if (scienceCats.includes("experimental-claims")) {
    scienceScore += 1.5;
    scienceEvidence.push("category:experimental-claims");
  }
  for (const cat of scienceCats.filter((c) => c !== "experimental-claims")) {
    scienceScore += 0.5;
    scienceEvidence.push(`category:${cat}`);
  }
  if (input.hasWikipedia && scienceScore === 0) {
    // Encyclopedia discussion alone is not experimental proof — keep score low but cite it.
    scienceEvidence.push("host:wikipedia.org (discussion only — not experimental proof)");
  }
  const scientificallySupported = dim(
    "Scientifically partially proved",
    Math.min(5, scienceScore),
    scienceScore > 0
      ? "Score uses only linked arXiv URLs and science-tagged categories already on this entry — not an independent lab verdict."
      : "No arXiv link or science/experimental category on this entry — score stays at 0.",
    scienceEvidence,
  );

  const credEvidence: string[] = [];
  let cred = 0;
  if (input.hasArxiv) {
    cred += 2;
    credEvidence.push("host:arxiv.org");
  }
  if (input.hasWikipedia) {
    cred += 1;
    credEvidence.push("host:wikipedia.org");
  }
  if (input.sourceCount >= 2) {
    cred += 1;
    credEvidence.push(`sourceCount:${input.sourceCount}`);
  }
  if (input.sourceCount >= 4) {
    cred += 0.5;
    credEvidence.push(`sourceCount:${input.sourceCount}`);
  }
  if (langs.length >= 2) {
    cred += 0.5;
    credEvidence.push(`languages:${langs.length}`);
  }
  if (hosts.length >= 2) {
    cred += 0.5;
    credEvidence.push(`hosts:${hosts.length}`);
  }
  if (input.imageCount > 0) {
    credEvidence.push(`hdSourceImages:${input.imageCount}`);
  }
  credEvidence.push(...sourceUrls.slice(0, 4));
  const credibility = dim(
    "Credibility",
    Math.min(5, cred),
    cred > 0
      ? "Built only from linked hosts, source count, and language/host diversity on this entry — not a claim that the hypothesis is true."
      : "No credibility anchors linked yet.",
    credEvidence,
  );

  const parts = [
    credibility.score,
    recency.score,
    multiSources.score,
    crossReferenced.score,
    multiWitness.score,
    scientificallySupported.score,
  ];
  const overall =
    Math.round((parts.reduce((a, b) => a + b, 0) / parts.length) * 10) / 10;

  return {
    overall,
    credibility,
    recency,
    multiSources,
    crossReferenced,
    multiWitness,
    scientificallySupported,
  };
}

/** Always derive ratings from the live evidence record — never trust a stale stored blob alone. */
export function rateFromEvidence(evidence: Evidence): EvidenceRatings {
  return rateEvidence({
    sourceCount: evidence.sourceCount,
    languages: evidence.languages,
    sources: evidence.sources.map((s) => ({
      publisher: s.publisher,
      url: s.url,
      language: s.language,
    })),
    categorySlugs: evidence.categories.map((c) => c.slug),
    lastSeenAt: evidence.lastSeenAt,
    firstSeenAt: evidence.firstSeenAt,
    hasArxiv: evidence.sources.some((s) => s.url.includes("arxiv.org")),
    hasWikipedia: evidence.sources.some((s) => s.url.includes("wikipedia.org")),
    imageCount: evidence.images.length,
  });
}
