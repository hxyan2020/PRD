import type { DataSource } from "./data-sources";
import { formatMoney, strategyMessageKey } from "./format";
import { articleCitationsForIdea } from "./idea-articles";
import { relatedSourcesForIdea } from "./idea-sources";
import { translate, type MessageKey } from "./i18n/messages";
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

export type IdeaQaTranslate = (
  key: MessageKey,
  vars?: Record<string, string | number>,
) => string;

const INTENT_PATTERNS: { intent: IdeaQaIntent; patterns: RegExp[] }[] = [
  {
    intent: "funding",
    patterns: [
      /\b(fund|funding|raised|raise|round|series|seed|pre-?seed|investor|valuation|capital)\b/i,
      /融资|募资|轮次|投资|籌資|募資|資金/,
    ],
  },
  {
    intent: "location",
    patterns: [
      /\b(where|location|based|hq|headquarters|based in)\b/i,
      /\b(country|city)\b.*\b(team|based|hq)?/i,
      /哪里|地点|城市|总部|哪裡|地點|總部|团队在哪|團隊在哪/,
    ],
  },
  {
    intent: "team",
    patterns: [
      /\b(team size|how many (people|employees)|headcount|staff|founders?)\b/i,
      /团队|人数|创始|團隊|人數|創始/,
    ],
  },
  {
    intent: "model",
    patterns: [
      /\b(business model|moneti[sz]e|revenue|make money|pricing|saas|take[- ]rate)\b/i,
      /商业模式|怎么赚钱|营收|商業模式|怎麼賺錢|營收/,
    ],
  },
  {
    intent: "industry",
    patterns: [/\b(industry|sector|vertical|category|space)\b/i, /行业|赛道|领域|行業|賽道|領域/],
  },
  {
    intent: "go_forward",
    patterns: [
      /\b(go[- ]?forward|next step|how (do|can) i|join|franchise|partner|localize|play|opportunity)\b/i,
      /怎么参与|前进|合作|加盟|本地化|怎麼參與|前進|如何推进|如何推進|前进路径|前進路徑/,
    ],
  },
  {
    intent: "links",
    patterns: [
      /\b(website|site|url|social|twitter|linkedin|instagram|contact)\b/i,
      /官网|网站|社交|官網|網站/,
    ],
  },
  {
    intent: "sources",
    patterns: [
      /\b(source|sourced|data source|where (did|do) you get|citation|cite)\b/i,
      /来源|数据源|引用|來源|資料源|数据来自|資料來自/,
    ],
  },
  {
    intent: "overview",
    patterns: [
      /\b(what (is|does)|about|overview|summar(y|ise|ize)|tell me|explain|describe)\b/i,
      /是什么|介绍|概述|讲讲|是什麼|介紹|講講|做什么|做什麼/,
    ],
  },
];

const OFF_TRACK =
  /^(hi|hello|hey|thanks|thank you|lol|ok|okay|cool|你好|谢谢|謝謝)\b|\b(who are you|what can you do|weather|joke)\b/i;

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
    if (row.intent === "sources" && /\b(source|data|cite|citation|come from)|来源|來源|数据源|資料源/i.test(q)) {
      score += 3;
    }
    if (row.intent === "location" && /\b(based|hq|headquarters|city|country)|总部|總部|城市/i.test(q)) {
      score += 2;
    }
    if (row.intent === "funding" && /\b(fund|raised|round|series|investor)|融资|募资|募資|融資/i.test(q)) {
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

function placeLabel(idea: StartupIdea): string {
  return idea.teamCity ? `${idea.teamCity}, ${idea.teamCountry}` : idea.teamCountry;
}

function scannedDate(idea: StartupIdea): string {
  return new Date(idea.scannedAt).toISOString().replace(".000Z", "Z");
}

function primaryCitations(idea: StartupIdea, t: IdeaQaTranslate): IdeaQaCitation[] {
  const citations: IdeaQaCitation[] = [
    {
      id: `official-${idea.id}`,
      label: t("ideaChat.cite.website", { name: idea.name }),
      url: idea.website,
      detail: t("ideaChat.cite.officialSite"),
      kind: "official",
    },
    {
      id: `ingest-${idea.id}`,
      label: t("ideaChat.cite.ingest", { source: idea.source }),
      url: "/sources",
      detail: t("ideaChat.cite.lastScanned", { date: scannedDate(idea) }),
      kind: "primary",
    },
  ];
  for (const social of idea.social.slice(0, 2)) {
    citations.push({
      id: `social-${social.platform}`,
      label: `${social.platform} · ${social.handle}`,
      url: social.url,
      detail: t("ideaChat.cite.officialSocial"),
      kind: "official",
    });
  }
  return citations;
}

function wireCitations(sources: DataSource[], t: IdeaQaTranslate): IdeaQaCitation[] {
  return sources.map((s) => {
    const kindKey = `sourceKind.${s.kind}` as MessageKey;
    return {
      id: s.id,
      label: s.name,
      url: s.url,
      detail: t("ideaChat.cite.wireDetail", {
        kind: t(kindKey),
        region: s.region,
        date: new Date(s.lastSourcedAt).toISOString().replace(".000Z", "Z"),
      }),
      kind: "wire" as const,
    };
  });
}

function fundingAnswer(idea: StartupIdea, t: IdeaQaTranslate): string {
  if (idea.fundraisingSecured) {
    const stage = idea.fundingStage
      ? t("ideaChat.answer.fundingAt", { stage: idea.fundingStage })
      : "";
    const amount =
      idea.fundingAmountUsd != null
        ? t("ideaChat.answer.fundingAmount", { amount: formatMoney(idea.fundingAmountUsd) })
        : "";
    const note = idea.fundingRoundNote
      ? t("ideaChat.answer.fundingNote", { note: idea.fundingRoundNote })
      : "";
    return t("ideaChat.answer.fundingYes", {
      name: idea.name,
      stage,
      amount,
      note,
    });
  }
  const note = idea.fundingRoundNote
    ? t("ideaChat.answer.fundingNote", { note: idea.fundingRoundNote })
    : "";
  return t("ideaChat.answer.fundingNo", {
    name: idea.name,
    note,
    stage: idea.fundingStage ?? t("ideaChat.na"),
  });
}

function answerForIntent(
  idea: StartupIdea,
  intent: IdeaQaIntent,
  t: IdeaQaTranslate,
): string {
  switch (intent) {
    case "overview":
      return t("ideaChat.answer.overview", {
        name: idea.name,
        industry: idea.industry,
        sector: idea.sector,
        description: idea.description,
      });
    case "funding":
      return fundingAnswer(idea, t);
    case "team":
      return t("ideaChat.answer.team", {
        name: idea.name,
        size: idea.teamSize,
        place: placeLabel(idea),
      });
    case "model":
      return t("ideaChat.answer.model", { model: idea.businessModel });
    case "industry":
      return t("ideaChat.answer.industry", {
        name: idea.name,
        industry: idea.industry,
        sector: idea.sector,
        tags: idea.tags.join(", ") || "—",
      });
    case "go_forward":
      return t("ideaChat.answer.goForward", {
        strategy: t(strategyMessageKey(idea.goForward.strategy)),
        summary: idea.goForward.summary,
      });
    case "links":
      return t("ideaChat.answer.links", {
        website: idea.website,
        socials: idea.social.map((s) => `${s.platform} (${s.handle})`).join("; "),
      });
    case "location":
      return t("ideaChat.answer.location", {
        name: idea.name,
        place: placeLabel(idea),
      });
    case "sources":
      return t("ideaChat.answer.sources", {
        source: idea.source,
        date: scannedDate(idea),
        country: idea.teamCountry,
      });
    case "off_track":
      return t("ideaChat.answer.offTrack", { name: idea.name });
    default:
      return t("ideaChat.answer.unknown", { name: idea.name });
  }
}

/** Answer a free-text question about one startup idea and attach data-source citations. */
export function answerIdeaQuestion(
  idea: StartupIdea,
  question: string,
  t: IdeaQaTranslate = (key, vars) => translate("en", key, vars),
): IdeaQaReply {
  const intent = detectIdeaIntent(question);
  const answer = answerForIntent(idea, intent, t);
  const wires = pickWireSources(
    idea,
    intent === "off_track" || intent === "unknown" ? "overview" : intent,
    intent === "sources" ? 4 : 3,
  );

  const articleWires = articleCitationsForIdea(
    idea.slug,
    intent === "sources" ? 4 : 3,
    t,
  );
  const citations: IdeaQaCitation[] = [
    ...primaryCitations(idea, t),
    ...(articleWires.length ? articleWires : wireCitations(wires, t)),
  ];

  const seen = new Set<string>();
  const unique = citations.filter((c) => {
    if (seen.has(c.url)) return false;
    seen.add(c.url);
    return true;
  });

  return { intent, answer, citations: unique };
}

export const IDEA_QA_SUGGESTION_KEYS = [
  "ideaChat.suggest.overview",
  "ideaChat.suggest.funding",
  "ideaChat.suggest.location",
  "ideaChat.suggest.model",
  "ideaChat.suggest.goForward",
  "ideaChat.suggest.sources",
] as const satisfies readonly MessageKey[];

/** @deprecated Use IDEA_QA_SUGGESTION_KEYS + t() */
export const IDEA_QA_SUGGESTIONS = [
  "What does this startup do?",
  "Have they raised funding?",
  "Where is the team based?",
  "What's the business model?",
  "How could I go forward with this?",
  "Where did this data come from?",
] as const;
