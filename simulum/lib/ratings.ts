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
  return {
    score: Math.max(0, Math.min(max, Math.round(score * 10) / 10)),
    max,
    label,
    rationale,
    evidence,
  };
}

/** Rate from observable catalogue facts only — never invent citations. */
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
  const langs = [...new Set(input.languages.filter(Boolean))];

  const multiSources = dim(
    "Multiple sources",
    Math.min(5, input.sourceCount),
    `Catalogue currently links ${input.sourceCount} source URL(s).`,
    input.sources.slice(0, 6).map((s) => s.url),
  );

  const crossReferenced = dim(
    "Cross-referenced",
    Math.min(5, publishers.length + Math.max(0, langs.length - 1) * 0.5),
    `Independent publishers/hosts: ${publishers.join(", ") || "none yet"}; languages: ${langs.join(", ") || "n/a"}.`,
    publishers.map((p) => `publisher:${p}`),
  );

  const multiWitness = dim(
    "Multiple witnesses / retellings",
    Math.min(5, langs.length + Math.max(0, input.sourceCount - 1) * 0.4),
    `Appears across ${langs.length} language(s) and ${input.sourceCount} linked report(s).`,
    langs.map((l) => `language:${l}`),
  );

  const days =
    (Date.now() - new Date(input.lastSeenAt).getTime()) / (1000 * 60 * 60 * 24);
  const recencyScore =
    days <= 7 ? 5 : days <= 30 ? 4 : days <= 180 ? 3 : days <= 365 ? 2 : 1;
  const recency = dim(
    "Recency",
    recencyScore,
    `Last indexed ${new Date(input.lastSeenAt).toISOString().slice(0, 10)} (first seen ${new Date(input.firstSeenAt).toISOString().slice(0, 10)}).`,
    [`lastSeenAt:${input.lastSeenAt}`, `firstSeenAt:${input.firstSeenAt}`],
  );

  const scienceCats = input.categorySlugs.filter((s) =>
    [
      "experimental-claims",
      "physics-cosmology",
      "mathematical-structure",
      "computation-information",
    ].includes(s),
  );
  let scienceScore = 1;
  const scienceEvidence: string[] = [];
  if (input.hasArxiv) {
    scienceScore += 2;
    scienceEvidence.push("source-host:arxiv.org");
  }
  if (scienceCats.length) {
    scienceScore += Math.min(2, scienceCats.length);
    scienceEvidence.push(...scienceCats.map((c) => `category:${c}`));
  }
  if (input.hasWikipedia) scienceEvidence.push("source-host:wikipedia");
  const scientificallySupported = dim(
    "Scientifically discussed / partially tested",
    Math.min(5, scienceScore),
    scienceEvidence.length
      ? "Score follows linked scholarly hosts and science-tagged categories only."
      : "No arXiv/science-category anchors linked yet — kept low.",
    scienceEvidence,
  );

  let cred = 1;
  const credEvidence: string[] = [];
  if (input.hasWikipedia) {
    cred += 1;
    credEvidence.push("wikipedia-linked");
  }
  if (input.hasArxiv) {
    cred += 1.5;
    credEvidence.push("arxiv-linked");
  }
  if (input.sourceCount >= 2) {
    cred += 1;
    credEvidence.push(`sourceCount:${input.sourceCount}`);
  }
  if (langs.length >= 2) {
    cred += 0.5;
    credEvidence.push(`languages:${langs.length}`);
  }
  if (input.imageCount > 0) credEvidence.push(`hdImages:${input.imageCount}`);
  const credibility = dim(
    "Credibility anchors",
    Math.min(5, cred),
    "Derived from linked hosts, source count, and language spread — not an assertion of truth.",
    credEvidence,
  );

  const overall =
    Math.round(
      ((credibility.score +
        recency.score +
        multiSources.score +
        crossReferenced.score +
        multiWitness.score +
        scientificallySupported.score) /
        6) *
        10,
    ) / 10;

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

function host(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}
