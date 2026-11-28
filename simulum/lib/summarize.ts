import type { EvidenceBody, EvidenceCandidate } from "@/lib/types";

/** Build an informative caption — never paste the raw article title alone. */
export function buildCaption(candidate: EvidenceCandidate): string {
  if (candidate.caption?.trim()) return trimSentence(candidate.caption, 180);

  const claim = firstSentence(candidate.summary) || firstSentence(candidate.detail || "");
  const topic = cleanTitle(candidate.title);

  // Prefer the summary sentence when it already states the claim clearly.
  if (claim && claim.length >= 40) {
    return trimSentence(claim, 180);
  }
  if (claim && topic) {
    if (claim.toLowerCase().includes(topic.toLowerCase().slice(0, 24))) {
      return trimSentence(claim, 180);
    }
    // Avoid "Title: title…" doubling when the title is already a full clause.
    if (topic.includes(":") || topic.length > 48) {
      return trimSentence(topic, 180);
    }
    return trimSentence(
      `${topic}: ${claim.charAt(0).toLowerCase()}${claim.slice(1)}`,
      180,
    );
  }
  if (claim) return trimSentence(claim, 180);
  return trimSentence(topic || "Untitled simulation claim", 180);
}

export function buildBody(candidate: EvidenceCandidate): EvidenceBody {
  const existing = candidate.body ?? {};
  const summary = candidate.summary.trim();
  const detail = (candidate.detail || "").trim();
  const publisher = candidate.source.publisher || hostOf(candidate.source.url);
  const topic = cleanTitle(candidate.title);

  return {
    what:
      existing.what?.trim() ||
      trimSentence(
        summary ||
          `${topic} is catalogued as a distinct claim in the simulated-reality debate.`,
        320,
      ),
    where:
      existing.where?.trim() ||
      trimSentence(`Sourced from ${publisher || "the open web"}.`, 220),
    when:
      existing.when?.trim() ||
      "Timing follows the source publication; catalogue timestamps track when SIMULUM first and last indexed it.",
    how:
      existing.how?.trim() ||
      trimSentence(
        detail ||
          summary ||
          `${topic} is argued through theory, analogy, experiment proposal, or cultural narrative.`,
        360,
      ),
    why:
      existing.why?.trim() ||
      `${topic} is included because people posted it as evidence or argument that the universe behaves like, or could be, a simulation.`,
  };
}

/**
 * English-facing pack for a non-English source.
 * Visible caption/body stay English-only — never paste the source-language title
 * or label the claim as "Japanese/French/…" (language belongs in list metadata).
 */
export function englishFacingPack(candidate: EvidenceCandidate): {
  caption: string;
  body: EvidenceBody;
} {
  const topic = cleanTitle(candidate.title);
  const lang = candidate.language || candidate.source.language || "und";
  const publisher = candidate.source.publisher || hostOf(candidate.source.url) || "the open web";
  const nativeSummary = firstSentence(candidate.summary);
  const pathHint = uniquePathHint(candidate.source.url);

  let caption: string;
  if (lang === "en") {
    caption = trimSentence(topic, 180);
  } else {
    // Never keep foreign titles/summaries in English UI copy (even Latin-script).
    caption = trimSentence(
      pathHint
        ? `Simulation-hypothesis claim via ${publisher} (${pathHint})`
        : `Simulation-hypothesis claim via ${publisher}`,
      180,
    );
  }

  const what =
    lang === "en" && nativeSummary
      ? trimSentence(nativeSummary, 320)
      : trimSentence(
          `${caption}. Open the original links for the full source text.`,
          320,
        );

  return {
    caption: stripLanguageLabel(caption),
    body: {
      what: stripLanguageLabel(what),
      where: trimSentence(`Sourced from ${publisher}.`, 220),
      when:
        "Timing follows the source publication; catalogue timestamps track when SIMULUM first and last indexed it.",
      how: "The claim is argued through theory, analogy, experiment proposal, or cultural narrative.",
      why: "Catalogued as a distinct claim people have posted in the simulated-reality discussion.",
    },
  };
}

/** Short unique token from a URL path so English captions stay distinct. */
function uniquePathHint(url: string): string {
  try {
    const path = decodeURIComponent(new URL(url).pathname)
      .replace(/\/+/g, "/")
      .replace(/^\/|\/$/g, "");
    const last = path.split("/").filter(Boolean).pop() || "";
    const cleaned = last
      .replace(/\.[a-z0-9]+$/i, "")
      .replace(/[_-]+/g, " ")
      .trim();
    if (!cleaned || cleaned.length < 3) return "";
    // Skip non-ASCII path tokens so we do not leak CJK into English captions.
    if (!/^[\x00-\x7F]+$/.test(cleaned)) return "";
    return trimSentence(cleaned, 40);
  } catch {
    return "";
  }
}

export function isMostlyLatin(text: string): boolean {
  if (!text.trim()) return false;
  return /^[\x00-\x7F\u00C0-\u024F\s.,;:'"!?()[\]/-]+$/.test(text.slice(0, 120));
}

const LANGUAGE_NAME =
  "Japanese|Chinese|French|Spanish|German|Russian|Korean|Arabic|Hindi|Portuguese|Italian|Dutch|Polish|Turkish|Vietnamese|Thai|Ukrainian|Indonesian|Bengali";

/** Remove "Japanese intro:", "French-language", "(zh)", etc. from visible UI copy. */
export function stripLanguageLabel(text: string): string {
  let out = text.replace(/\s+/g, " ").trim();
  out = out.replace(
    new RegExp(
      `^(${LANGUAGE_NAME})\\s+(intro|discussion|discourse|framing|retelling|version|sources?|treatments?)\\s*[:\\-–—]?\\s*`,
      "i",
    ),
    "",
  );
  out = out.replace(
    new RegExp(
      `\\b(${LANGUAGE_NAME})(?:-language)?\\s+(?:introductions?|discussions?|discourse|framing|retelling|sources?|treatments?|formulations?|presentation|entry(?:\\s+point)?|version)\\b`,
      "gi",
    ),
    "the discussion",
  );
  out = out.replace(/\(\s*[a-z]{2}(?:-[a-z]+)?\s*\)/gi, "");
  out = out.replace(/\boriginally (?:written|discussed|published) in [a-z]{2}\b/gi, "");
  out = out.replace(/\s{2,}/g, " ").replace(/\s+([.,;:])/g, "$1").trim();
  // Capitalize if we stripped a leading language label.
  if (out && /^[a-z]/.test(out)) {
    out = out.charAt(0).toUpperCase() + out.slice(1);
  }
  return out;
}

export function cleanTitle(title: string): string {
  return title
    .replace(/\s+[—–|-]\s+Wikipedia.*$/i, "")
    .replace(/\s+[—–|-]\s+Wikipédia.*$/i, "")
    .replace(/\s+[—–|-]\s+Википедия.*$/i, "")
    .replace(/\s+[—–|-]\s+维基百科.*$/i, "")
    .replace(/\s*\(DE\)\s*$/i, "")
    .trim();
}

export function firstSentence(text: string): string {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (!cleaned) return "";
  const match = cleaned.match(/^(.+?[.!?。！？])(\s|$)/);
  return (match?.[1] || cleaned).trim();
}

export function trimSentence(text: string, max: number): string {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (cleaned.length <= max) return cleaned;
  const cut = cleaned.slice(0, max - 1);
  const sp = cut.lastIndexOf(" ");
  return `${(sp > 40 ? cut.slice(0, sp) : cut).trim()}…`;
}

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}
