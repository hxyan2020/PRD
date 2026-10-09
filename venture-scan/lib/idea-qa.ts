import type { DataSource } from "./data-sources";
import { formatMoney, strategyLabel } from "./format";
import { relatedSourcesForIdea } from "./idea-sources";
import type { StartupIdea } from "./types";

export type IdeaQaIntent =
  | "overview"
  | "funding"
  | "team"
  | "model"
  | "industry"
  | "go_forward"
  | "links"
  | "location"
  | "sources"
  | "off_track"
  | "unknown";

export type IdeaQaCitation = {
  id: string;
  label: string;
  url: string;
  detail?: string;
  kind: "primary" | "wire" | "official";
};

export type IdeaQaReply = {
  intent: IdeaQaIntent;
  answer: string;
  citations: IdeaQaCitation[];
};

const INTENT_PATTERNS: { intent: IdeaQaIntent; patterns: RegExp[] }[] = [
  {
    intent: "funding",
    patterns: [
      /\b(fund|funding|raised|raise|round|series|seed|pre-?seed|investor|valuation|capital)\b/i,
      /融资|募资|轮次|投资/,
    ],
  },
  {
    intent: "location",
    patterns: [
      /\b(where|location|based|hq|headquarters|based in)\b/i,
      /\b(country|city)\b.*\b(team|based|hq)?/i,
      /哪里|地点|城市|总部/,
    ],
  },
  {
    intent: "team",
    patterns: [/\b(team size|how many (people|employees)|headcount|staff|founders?)\b/i, /团队|人数|创始/],
  },
  {
    intent: "model",
    patterns: [
      /\b(business model|moneti[sz]e|revenue|make money|pricing|saas|take[- ]rate)\b/i,
      /商业模式|怎么赚钱|营收/,
    ],
  },
  {
    intent: "industry",
    patterns: [/\b(industry|sector|vertical|category|space)\b/i, /行业|赛道|领域/],
  },
  {
    intent: "go_forward",
    patterns: [
      /\b(go[- ]?forward|next step|how (do|can) i|join|franchise|partner|localize|play|opportunity)\b/i,
      /怎么参与|前进|合作|加盟|本地化/,
    ],
  },
  {
    intent: "links",
    patterns: [/\b(website|site|url|social|twitter|linkedin|instagram|contact)\b/i, /官网|网站|社交/],
  },
  {
    intent: "sources",
    patterns: [/\b(source|sourced|data source|where (did|do) you get|citation|cite)\b/i, /来源|数据源|引用/],
  },
  {
    intent: "overview",
    patterns: [
      /\b(what (is|does)|about|overview|summar(y|ise|ize)|tell me|explain|describe)\b/i,
      /是什么|介绍|概述|讲讲/,
    ],
  },
];

const OFF_TRACK =
  /^(hi|hello|hey|thanks|thank you|lol|ok|okay|cool)\b|\b(who are you|what can you do|weather|joke)\b/i;

export function detectIdeaIntent(question: string): IdeaQaIntent {
  const q = question.trim();
  if (!q) return "unknown";
  if (OFF_TRACK.test(q) && q.length < 40) return "off_track";

  let best: { intent: IdeaQaIntent; score: number } | null = null;
  for (const row of INTENT_PATTERNS) {
    let score = 0;
    for (const pattern of row.patterns) {
      if (pattern.test(q)) score += 1;
    }
    // Prefer more specific intents when "where" alone would match location
    if (row.intent === "sources" && /\b(source|data|cite|citation|come from)\b/i.test(q)) {
      score += 3;
    }
    if (row.intent === "location" && /\b(based|hq|headquarters|city|country)\b/i.test(q)) {
      score += 2;
    }
    if (row.intent === "funding" && /\b(fund|raised|round|series|investor)\b/i.test(q)) {
      score += 2;
    }
    if (!best || score > best.score) best = { intent: row.intent, score };
  }
  if (best && best.score > 0) return best.intent;
  if (q.split(/\s+/).length <= 6) return "overview";
  return "unknown";
}

function pickWireSources(idea: StartupIdea, intent: IdeaQaIntent, limit = 3): DataSource[] {
  const mapped =
    intent === "off_track" || intent === "unknown"
      ? "overview"
      : (intent as
          | "funding"
          | "team"
          | "location"
          | "sources"
          | "overview"
          | "model"
          | "industry"
          | "go_forward"
          | "links");
  return relatedSourcesForIdea(idea, mapped, limit);
}

function primaryCitations(idea: StartupIdea): IdeaQaCitation[] {
  const citations: IdeaQaCitation[] = [
    {
      id: `official-${idea.id}`,
      label: `${idea.name} website`,
      url: idea.website,
      detail: "Official company site",
      kind: "official",
    },
    {
      id: `ingest-${idea.id}`,
      label: `VentureScan ingest · ${idea.source}`,
      url: "/sources",
      detail: `Last scanned ${new Date(idea.scannedAt).toISOString().replace(".000Z", "Z")}`,
      kind: "primary",
    },
  ];
  for (const social of idea.social.slice(0, 2)) {
    citations.push({
      id: `social-${social.platform}`,
      label: `${social.platform} · ${social.handle}`,
      url: social.url,
      detail: "Official social account",
      kind: "official",
    });
  }
  return citations;
}

function wireCitations(sources: DataSource[]): IdeaQaCitation[] {
  return sources.map((s) => ({
    id: s.id,
    label: s.name,
    url: s.url,
    detail: `${s.kind} · ${s.region} · last sourced ${new Date(s.lastSourcedAt)
      .toISOString()
      .replace(".000Z", "Z")}`,
    kind: "wire" as const,
  }));
}

function fundingAnswer(idea: StartupIdea): string {
  if (idea.fundraisingSecured) {
    const amount = idea.fundingAmountUsd != null ? ` (${formatMoney(idea.fundingAmountUsd)})` : "";
    const stage = idea.fundingStage ? ` at ${idea.fundingStage}` : "";
    const note = idea.fundingRoundNote ? ` Note: ${idea.fundingRoundNote}.` : "";
    return `${idea.name} has secured fundraising${stage}${amount}.${note}`;
  }
  const note = idea.fundingRoundNote ? ` ${idea.fundingRoundNote}.` : "";
  return `${idea.name} has not secured a closed round yet.${note} Stage on file: ${idea.fundingStage ?? "n/a"}.`;
}

function answerForIntent(idea: StartupIdea, intent: IdeaQaIntent): string {
  switch (intent) {
    case "overview":
      return `${idea.name} is a ${idea.industry} / ${idea.sector} startup. ${idea.description}`;
    case "funding":
      return fundingAnswer(idea);
    case "team":
      return `${idea.name}'s team is about ${idea.teamSize} people, based in ${idea.teamCity ? `${idea.teamCity}, ` : ""}${idea.teamCountry}.`;
    case "model":
      return `Business model: ${idea.businessModel}`;
    case "industry":
      return `${idea.name} sits in ${idea.industry}, specifically ${idea.sector}. Tags on file: ${idea.tags.join(", ") || "—"}.`;
    case "go_forward":
      return `Suggested go-forward play — ${strategyLabel(idea.goForward.strategy)}: ${idea.goForward.summary}`;
    case "links":
      return `Official website: ${idea.website}. Socials: ${idea.social
        .map((s) => `${s.platform} (${s.handle})`)
        .join("; ")}.`;
    case "location":
      return `${idea.name} is based in ${idea.teamCity ? `${idea.teamCity}, ` : ""}${idea.teamCountry}.`;
    case "sources":
      return `This dossier was ingested as “${idea.source}” (scanned ${new Date(
        idea.scannedAt,
      ).toISOString().replace(".000Z", "Z")}). Related wire desks for ${idea.teamCountry} are listed in the citations below.`;
    case "off_track":
      return `Happy to chat — ask something about ${idea.name} (funding, team, business model, go-forward play, or sources) and I'll answer with citations.`;
    default:
      return `I can help unpack ${idea.name}. Try asking about funding, the team, business model, industry, go-forward play, website/socials, or where this data came from.`;
  }
}

/** Answer a free-text question about one startup idea and attach data-source citations. */
export function answerIdeaQuestion(idea: StartupIdea, question: string): IdeaQaReply {
  const intent = detectIdeaIntent(question);
  const answer = answerForIntent(idea, intent);
  const wires = pickWireSources(
    idea,
    intent === "off_track" || intent === "unknown" ? "overview" : intent,
    intent === "sources" ? 4 : 3,
  );

  const citations: IdeaQaCitation[] = [
    ...primaryCitations(idea),
    ...wireCitations(wires),
  ];

  // Deduplicate by url
  const seen = new Set<string>();
  const unique = citations.filter((c) => {
    if (seen.has(c.url)) return false;
    seen.add(c.url);
    return true;
  });

  return { intent, answer, citations: unique };
}

export const IDEA_QA_SUGGESTIONS = [
  "What does this startup do?",
  "Have they raised funding?",
  "Where is the team based?",
  "What's the business model?",
  "How could I go forward with this?",
  "Where did this data come from?",
] as const;
