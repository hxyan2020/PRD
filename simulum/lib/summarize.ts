import type { EvidenceBody, EvidenceCandidate } from "@/lib/types";

/** Build an informative caption — never paste the raw article title alone. */
export function buildCaption(candidate: EvidenceCandidate): string {
  if (candidate.caption?.trim()) return trimSentence(candidate.caption, 180);

  const claim = firstSentence(candidate.summary) || firstSentence(candidate.detail || "");
  const topic = cleanTitle(candidate.title);
  if (claim && topic) {
    return trimSentence(
      `${topic}: ${claim.charAt(0).toLowerCase()}${claim.slice(1)}`,
      180,
    );
  }
  if (claim) return trimSentence(claim, 180);
  return trimSentence(
    `Documented claim linked to simulated-reality discussion: ${topic}`,
    180,
  );
}

export function buildBody(candidate: EvidenceCandidate): EvidenceBody {
  const existing = candidate.body ?? {};
  const summary = candidate.summary.trim();
  const detail = (candidate.detail || "").trim();
  const publisher = candidate.source.publisher || hostOf(candidate.source.url);
  const lang = candidate.language || candidate.source.language || "en";

  return {
    what:
      existing.what?.trim() ||
      trimSentence(
        summary ||
          `A publicly discussed claim that reality may be computational or simulated (${cleanTitle(candidate.title)}).`,
        320,
      ),
    where:
      existing.where?.trim() ||
      trimSentence(
        `Sourced from ${publisher || "the open web"} (${lang}), originally published at the linked page.`,
        220,
      ),
    when:
      existing.when?.trim() ||
      "Timing follows the source publication and subsequent public discussion; catalogue first-seen and last-seen timestamps track when SIMULUM indexed it.",
    how:
      existing.how?.trim() ||
      trimSentence(
        detail ||
          summary ||
          "The claim is argued through theory, analogy, experiment proposal, or cultural narrative rather than a single laboratory measurement.",
        360,
      ),
    why:
      existing.why?.trim() ||
      "It is catalogued because people posted it as evidence or argument that the universe behaves like, or could be, a simulation.",
  };
}

function cleanTitle(title: string): string {
  return title
    .replace(/\s+[—–|-]\s+Wikipedia.*$/i, "")
    .replace(/\s+[—–|-]\s+Wikipédia.*$/i, "")
    .replace(/\s+[—–|-]\s+Википедия.*$/i, "")
    .replace(/\s+[—–|-]\s+维基百科.*$/i, "")
    .trim();
}

function firstSentence(text: string): string {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (!cleaned) return "";
  const match = cleaned.match(/^(.+?[.!?。！？])(\s|$)/);
  return (match?.[1] || cleaned).trim();
}

function trimSentence(text: string, max: number): string {
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
