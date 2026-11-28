import type { EvidenceBody, EvidenceCandidate } from "@/lib/types";

/** Build an informative caption — never paste the raw article title alone. */
export function buildCaption(candidate: EvidenceCandidate): string {
  if (candidate.caption?.trim()) return trimSentence(candidate.caption, 180);

  const claim = firstSentence(candidate.summary) || firstSentence(candidate.detail || "");
  const topic = cleanTitle(candidate.title);
  if (claim && topic) {
    // Prefer a distinctive claim sentence; avoid "Topic: topic…" echo.
    if (claim.toLowerCase().includes(topic.toLowerCase().slice(0, 24))) {
      return trimSentence(claim, 180);
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
  const lang = candidate.language || candidate.source.language || "en";
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
      trimSentence(
        `Sourced from ${publisher || "the open web"} (${lang}).`,
        220,
      ),
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

/** English-facing pack for a non-English source — unique per title, no shared boilerplate prefix. */
export function englishFacingPack(candidate: EvidenceCandidate): {
  caption: string;
  body: EvidenceBody;
} {
  const topic = cleanTitle(candidate.title);
  const lang = candidate.language || candidate.source.language || "und";
  const publisher = candidate.source.publisher || hostOf(candidate.source.url) || "the open web";
  const nativeSummary = firstSentence(candidate.summary);

  // Caption is the distinctive title itself (language lives in list metadata).
  const caption = trimSentence(topic, 180);

  // Prefer a short English gloss when the source summary is already Latin-script English-ish;
  // otherwise describe the entry by its unique title without repeating a global template.
  const summaryIsMostlyLatin = /^[\x00-\x7F\u00C0-\u024F\s.,;:'"!?()/-]+$/.test(
    nativeSummary.slice(0, 80),
  );
  const what =
    lang === "en" && nativeSummary
      ? trimSentence(nativeSummary, 320)
      : summaryIsMostlyLatin && nativeSummary
        ? trimSentence(nativeSummary, 320)
        : trimSentence(
            `${topic} — indexed from a ${lang.toUpperCase()} source; open the original links for the full source-language text.`,
            320,
          );

  return {
    caption,
    body: {
      what,
      where: trimSentence(`Sourced from ${publisher} (${lang}).`, 220),
      when:
        "Timing follows the source publication; catalogue timestamps track when SIMULUM first and last indexed it.",
      how: trimSentence(
        nativeSummary && summaryIsMostlyLatin
          ? nativeSummary
          : `${topic} is presented via theory, analogy, experiment proposal, or cultural narrative in its source language.`,
        360,
      ),
      why: trimSentence(
        `${topic} is catalogued as a distinct claim people have posted in the simulated-reality discussion.`,
        280,
      ),
    },
  };
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
