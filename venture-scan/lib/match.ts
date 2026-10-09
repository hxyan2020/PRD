import { strategyLabel } from "./format";
import type {
  GapPoint,
  IdeaMatch,
  MatchBreakdown,
  MatchPoint,
  StartupIdea,
  UserProfile,
} from "./types";

const WEIGHTS = {
  skills: 0.3,
  major: 0.15,
  currentBusiness: 0.2,
  interestedDomains: 0.25,
  preferredMarkets: 0.1,
} as const;

const MATCH_THRESHOLD = 0.55;

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

  const matched: MatchPoint[] = [];
  const gaps: GapPoint[] = [];

  pushDim({
    matched,
    gaps,
    dimension: "Skills",
    score: skills,
    matchDetail: profile.skills.length
      ? `Your skills (${profile.skills.join(", ")}) align with how ${idea.name} operates.`
      : "No skills on your profile yet.",
    gapDetail: profile.skills.length
      ? `Skill overlap with ${idea.industry} / ${idea.sector} is still thin.`
      : "Skills are missing from your profile.",
    closeGap: profile.skills.length
      ? `Practice one concrete skill used in ${idea.sector} this week (e.g. a mini project, customer interview, or tool tutorial), then add it to your profile.`
      : "Open the match chatbot and list 3–5 skills so we can score this dimension.",
  });

  pushDim({
    matched,
    gaps,
    dimension: "Major / background",
    score: major,
    matchDetail: profile.major
      ? `Your background (${profile.major}) fits ${idea.industry}.`
      : "No major / background on your profile yet.",
    gapDetail: profile.major
      ? `Your background (${profile.major}) does not yet map cleanly onto ${idea.industry}.`
      : "Academic / professional background is missing.",
    closeGap: profile.major
      ? `Ship a 1-week bridge project that applies ${profile.major} to ${idea.sector}, then note the outcome in your profile notes.`
      : "Tell the chatbot your major or professional background.",
  });

  pushDim({
    matched,
    gaps,
    dimension: "Current business",
    score: currentBusiness,
    matchDetail: profile.currentBusiness
      ? `Your current work (${profile.currentBusiness}) overlaps this business model.`
      : "No current business on your profile yet.",
    gapDetail: profile.currentBusiness
      ? `Your current work (${profile.currentBusiness}) is adjacent, not core, to ${idea.name}'s model.`
      : "Current business / focus is missing.",
    closeGap: profile.currentBusiness
      ? `Pilot the go-forward play “${strategyLabel(idea.goForward.strategy)}” inside your existing operation for 2 weeks: ${idea.goForward.summary}`
      : "Describe your current job or venture in the chatbot so we can map operational fit.",
  });

  pushDim({
    matched,
    gaps,
    dimension: "Interested domains",
    score: interestedDomains,
    matchDetail: profile.interestedDomains.length
      ? `Your interests (${profile.interestedDomains.join(", ")}) hit ${idea.sector}.`
      : "No interested domains on your profile yet.",
    gapDetail: profile.interestedDomains.length
      ? `Stated interests (${profile.interestedDomains.join(", ")}) only weakly cover ${idea.industry} / ${idea.sector}.`
      : "Interested domains are missing.",
    closeGap: profile.interestedDomains.length
      ? `Spend 3 hours this week in ${idea.sector} (read 2 primary sources, talk to 1 operator), then add “${idea.industry}” to your interested domains if it sticks.`
      : "List the domains you care about in the match chatbot.",
  });

  const markets = profile.preferredMarkets ?? [];
  pushDim({
    matched,
    gaps,
    dimension: "Preferred markets",
    score: preferredMarkets,
    matchDetail: markets.length
      ? `Your markets (${markets.join(", ")}) overlap ${idea.teamCountry} or the localization play.`
      : "No preferred markets on your profile yet (optional).",
    gapDetail: markets.length
      ? `Your markets (${markets.join(", ")}) do not yet overlap ${idea.teamCountry} or its go-forward geography.`
      : "Preferred markets are unset, so geo fit is weak.",
    closeGap: markets.length
      ? `Map a local entry for ${markets[0]}: customer, partner, and regulation checklist based on “${strategyLabel(idea.goForward.strategy)}”.`
      : "Add preferred countries/markets in the chatbot to unlock geo scoring.",
  });

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

/** Most-matched idea for a calendar day (stable when top scores tie). */
export function selectDailyMatch(
  ideas: StartupIdea[],
  matches: IdeaMatch[],
  day = dayKey(),
): { idea: StartupIdea; match: IdeaMatch } | null {
  if (!ideas.length || !matches.length) return null;
  const bySlug = new Map(ideas.map((i) => [i.slug, i]));
  const topScore = matches[0].score;
  const topTier = matches.filter((m) => m.score === topScore && bySlug.has(m.slug));
  if (!topTier.length) return null;
  const match = topTier[dayIndex(day, topTier.length)];
  const idea = bySlug.get(match.slug);
  if (!idea) return null;
  return { idea, match };
}

export function buildDailyRecommendation(
  ideas: StartupIdea[],
  profile: UserProfile,
  day = dayKey(),
): { day: string; idea: StartupIdea; match: IdeaMatch } | null {
  const matches = rankIdeasForProfile(ideas, profile);
  const picked = selectDailyMatch(ideas, matches, day);
  if (!picked) return null;
  return { day, idea: picked.idea, match: picked.match };
}

export function dayKey(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

function dayIndex(day: string, modulo: number): number {
  if (modulo <= 1) return 0;
  let hash = 0;
  for (let i = 0; i < day.length; i += 1) hash = (hash * 31 + day.charCodeAt(i)) >>> 0;
  return hash % modulo;
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
    else if (
      n.includes("europe") &&
      /europe|germany|netherlands|uk|united kingdom|france|sweden/.test(hay)
    )
      hits += 0.8;
  }
  return clamp01(hits / markets.length);
}

function tokenWordsHit(token: string, hay: string): boolean {
  const words = token.split(/\s+/).filter((w) => w.length > 2);
  if (words.length <= 1) return false;
  return words.filter((w) => hay.includes(w)).length >= Math.ceil(words.length * 0.6);
}

function pushDim(input: {
  matched: MatchPoint[];
  gaps: GapPoint[];
  dimension: string;
  score: number;
  matchDetail: string;
  gapDetail: string;
  closeGap: string;
}): void {
  if (input.score >= MATCH_THRESHOLD) {
    input.matched.push({ dimension: input.dimension, detail: input.matchDetail });
  } else {
    input.gaps.push({
      dimension: input.dimension,
      detail: input.gapDetail,
      closeGap: input.closeGap,
    });
  }
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
