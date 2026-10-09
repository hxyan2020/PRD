import type { IdeaMatch, MatchBreakdown, StartupIdea, UserProfile } from "./types";

const WEIGHTS = {
  skills: 0.3,
  major: 0.15,
  currentBusiness: 0.2,
  interestedDomains: 0.25,
  preferredMarkets: 0.1,
} as const;

export function scoreIdeaAgainstProfile(
  idea: StartupIdea,
  profile: UserProfile,
): IdeaMatch {
  const ideaText = normalize(
    [
      idea.name,
      idea.description,
      idea.businessModel,
      idea.industry,
      idea.sector,
      idea.goForward.summary,
      idea.goForward.strategy.replaceAll("_", " "),
      ...idea.tags,
    ].join(" "),
  );

  const skills = scoreTokenOverlap(profile.skills, ideaText, [
    idea.industry,
    idea.sector,
    ...idea.tags,
  ]);
  const major = scorePhrase(profile.major, ideaText, [idea.industry, idea.sector]);
  const currentBusiness = scorePhrase(profile.currentBusiness, ideaText, [
    idea.industry,
    idea.sector,
    idea.businessModel,
  ]);
  const interestedDomains = scoreTokenOverlap(profile.interestedDomains, ideaText, [
    idea.industry,
    idea.sector,
    ...idea.tags,
  ]);
  const preferredMarkets = scoreMarkets(profile.preferredMarkets ?? [], idea);

  const breakdown: MatchBreakdown = {
    skills,
    major,
    currentBusiness,
    interestedDomains,
    preferredMarkets,
  };

  const score = Math.round(
    clamp01(skills) * WEIGHTS.skills * 100 +
      clamp01(major) * WEIGHTS.major * 100 +
      clamp01(currentBusiness) * WEIGHTS.currentBusiness * 100 +
      clamp01(interestedDomains) * WEIGHTS.interestedDomains * 100 +
      clamp01(preferredMarkets) * WEIGHTS.preferredMarkets * 100,
  );

  const matched: string[] = [];
  const gaps: string[] = [];

  pushDim(
    matched,
    gaps,
    "Skills",
    skills,
    profile.skills.length
      ? `Your skills (${profile.skills.join(", ")}) align with this idea's work.`
      : "Add skills to improve this signal.",
    profile.skills.length
      ? `Build skills closer to ${idea.industry} / ${idea.sector}.`
      : "Tell the chatbot your skills so we can weight this dimension.",
  );
  pushDim(
    matched,
    gaps,
    "Major / background",
    major,
    profile.major
      ? `Your background (${profile.major}) fits the domain.`
      : "Add your major or academic background.",
    profile.major
      ? `Bridge from ${profile.major} into ${idea.industry} with a short project or course.`
      : "Share your major so we can match academic fit.",
  );
  pushDim(
    matched,
    gaps,
    "Current business",
    currentBusiness,
    profile.currentBusiness
      ? `Your current work (${profile.currentBusiness}) overlaps this model.`
      : "Add what you currently do or run.",
    profile.currentBusiness
      ? `Adapt ${idea.goForward.strategy.replaceAll("_", " ")} using your existing operation.`
      : "Describe your current business to unlock this score.",
  );
  pushDim(
    matched,
    gaps,
    "Interested domains",
    interestedDomains,
    profile.interestedDomains.length
      ? `Your interests (${profile.interestedDomains.join(", ")}) hit this sector.`
      : "Add domains you care about.",
    profile.interestedDomains.length
      ? `Spend time in ${idea.sector} communities or customers to close the interest gap.`
      : "List interested domains in the chatbot.",
  );
  pushDim(
    matched,
    gaps,
    "Preferred markets",
    preferredMarkets,
    (profile.preferredMarkets ?? []).length
      ? `Market preference overlaps ${idea.teamCountry} or the go-forward play.`
      : "Add preferred markets (optional).",
    (profile.preferredMarkets ?? []).length
      ? `Explore localizing or franchising this idea into ${(profile.preferredMarkets ?? []).join(", ")}.`
      : "Tell us preferred countries/markets for a stronger geo match.",
  );

  return {
    ideaId: idea.id,
    slug: idea.slug,
    score,
    breakdown,
    matched,
    gaps,
  };
}

export function rankIdeasForProfile(
  ideas: StartupIdea[],
  profile: UserProfile,
): IdeaMatch[] {
  return ideas
    .map((idea) => scoreIdeaAgainstProfile(idea, profile))
    .sort((a, b) => b.score - a.score || a.slug.localeCompare(b.slug));
}

function scoreTokenOverlap(
  tokens: string[],
  ideaText: string,
  boostFields: string[],
): number {
  if (!tokens.length) return 0;
  const boost = normalize(boostFields.join(" "));
  let hits = 0;
  for (const token of tokens) {
    const t = normalize(token);
    if (!t) continue;
    if (ideaText.includes(t) || tokenWordsHit(t, ideaText)) hits += 1;
    else if (boost.includes(t) || tokenWordsHit(t, boost)) hits += 0.6;
  }
  return clamp01(hits / tokens.length);
}

function scorePhrase(phrase: string, ideaText: string, boostFields: string[]): number {
  const p = normalize(phrase);
  if (!p) return 0;
  if (ideaText.includes(p)) return 1;
  const words = p.split(/\s+/).filter((w) => w.length > 2);
  if (!words.length) return 0;
  const boost = normalize(boostFields.join(" "));
  let hits = 0;
  for (const w of words) {
    if (ideaText.includes(w)) hits += 1;
    else if (boost.includes(w)) hits += 0.5;
  }
  return clamp01(hits / words.length);
}

function scoreMarkets(markets: string[], idea: StartupIdea): number {
  if (!markets.length) return 0;
  const hay = normalize(
    [idea.teamCountry, idea.teamCity ?? "", idea.goForward.summary, ...idea.tags].join(" "),
  );
  let hits = 0;
  for (const m of markets) {
    const n = normalize(m);
    if (!n) continue;
    if (hay.includes(n)) hits += 1;
    else if (n.includes("asia") && /asia|singapore|japan|india|indonesia|china|korea/.test(hay))
      hits += 0.8;
    else if (n.includes("africa") && /africa|kenya|nigeria/.test(hay)) hits += 0.8;
    else if (n.includes("europe") && /europe|germany|netherlands|uk|united kingdom|france|sweden/.test(hay))
      hits += 0.8;
  }
  return clamp01(hits / markets.length);
}

function tokenWordsHit(token: string, hay: string): boolean {
  const words = token.split(/\s+/).filter((w) => w.length > 2);
  if (words.length <= 1) return false;
  return words.filter((w) => hay.includes(w)).length >= Math.ceil(words.length * 0.6);
}

function pushDim(
  matched: string[],
  gaps: string[],
  label: string,
  score: number,
  matchText: string,
  gapText: string,
): void {
  if (score >= 0.55) matched.push(`${label}: ${matchText}`);
  else gaps.push(`${label}: ${gapText}`);
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s+/.-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function clamp01(n: number): number {
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(1, n));
}
