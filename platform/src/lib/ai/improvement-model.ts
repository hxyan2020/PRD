export type ImprovementKind =
  | "DATA_SOURCE"
  | "INDICATOR_HEALTH"
  | "REASONING_GAP"
  | "SKILL_PATTERN"
  | "THRESHOLD"
  | "RESPONSE_TIME";

export type ImprovementPriority = "HIGH" | "MEDIUM" | "LOW";
export type ImprovementItemStatus = "OPEN" | "CHALLENGED" | "ACCEPTED" | "DISMISSED";
export type ImprovementReviewStatus = "OPEN" | "SATISFIED" | "SUPERSEDED";

export type ImprovementItem = {
  id: string;
  kind: ImprovementKind;
  title: string;
  recommendation: string;
  rationale: string;
  priority: ImprovementPriority;
  from?: string;
  to?: string;
  status: ImprovementItemStatus;
};

export type ImprovementFact = {
  id: string;
  text: string;
  source: "human" | "pull";
  at: string;
};

export type ImprovementChatMessage = {
  role: "user" | "assistant";
  content: string;
  at: string;
};

export type PulledDatum = {
  label: string;
  value: string;
};

export type ImprovementReview = {
  id?: number;
  analysis_id: number;
  review_id: string;
  summary: string;
  status: ImprovementReviewStatus;
  items: ImprovementItem[];
  facts: ImprovementFact[];
  chat: ImprovementChatMessage[];
  pulled: PulledDatum[];
  created_at?: string;
  updated_at?: string;
};

export type ImprovementChatResult = {
  reply: string;
  review: ImprovementReview;
  suggestions: string[];
};

function nowIso() {
  return new Date().toISOString().replace("T", " ").slice(0, 19);
}

export function classifyImproveIntent(
  text: string
): "pull" | "fact" | "challenge" | "regenerate" | "accept" | "chat" {
  const q = text.toLowerCase();
  if (/(satisfactor|mark (this )?done|accept (this )?plan|方案已滿意|標記完成|可以結案)/.test(q)) return "accept";
  if (/(regenerat|re-?run|again|重產|重新產|再跑|重跑)/.test(q)) return "regenerate";
  if (/(pull (live )?data|live snapshot|拉(即時)?資料|拉數據)/.test(q)) return "pull";
  if (/(^add fact|^fact:|新增事實|加入事實|補充事實)/.test(q) || /add( in)? (a )?fact/.test(q)) return "fact";
  if (/(challenge|disagree|wrong|incorrect|挑戰|不同意|推理有誤)/.test(q)) return "challenge";
  return "chat";
}

function extractFactText(message: string) {
  return message.replace(/^(add fact:?|fact:?|新增事實[:：]?|加入事實[:：]?|補充事實[:：]?)\s*/i, "").trim() || message;
}

function applyChallenge(review: ImprovementReview, message: string) {
  const q = message.toLowerCase();
  const hit =
    review.items.find(
      (i) => q.includes(i.id.toLowerCase()) || q.includes(i.kind.toLowerCase().replace(/_/g, " "))
    ) ||
    review.items.find((i) => q.includes(i.title.toLowerCase().slice(0, 18))) ||
    review.items[0];
  if (hit) {
    hit.status = "CHALLENGED";
    hit.rationale = `${hit.rationale} Challenged: “${message.slice(0, 240)}”.`;
  }
  return hit;
}

export function suggestionsForImprovement(review: ImprovementReview, locale: "en" | "zh-Hant"): string[] {
  const zh = locale === "zh-Hant";
  const first = review.items[0];
  return [
    zh ? "拉即時資料" : "Pull live data",
    zh ? "新增事實：饋送已過期 9 分鐘" : "Add fact: the feed was stale for 9 minutes",
    first
      ? zh
        ? `挑戰「${first.title}」的推理`
        : `Challenge the reasoning on “${first.title}”`
      : zh
        ? "挑戰你的推理"
        : "Challenge your reasoning",
    zh ? "用新事實重產改進方案" : "Regenerate with the new facts",
    zh ? "方案已滿意，標記完成" : "This solution is satisfactory",
  ];
}

export function applyImprovementTurn(
  review: ImprovementReview,
  message: string,
  locale: "en" | "zh-Hant" = "en",
  live?: { pulled?: PulledDatum[]; regenerated?: ImprovementReview }
): ImprovementChatResult {
  const zh = locale === "zh-Hant";
  const intent = classifyImproveIntent(message);
  const next: ImprovementReview = {
    ...review,
    items: review.items.map((i) => ({ ...i })),
    facts: [...review.facts],
    chat: [...review.chat],
    pulled: [...review.pulled],
  };
  const at = nowIso();
  next.chat.push({ role: "user", content: message, at });

  let reply: string;
  if (intent === "pull") {
    if (live?.pulled?.length) next.pulled = live.pulled;
    const lines = (next.pulled.length ? next.pulled : review.pulled)
      .map((p) => `• ${p.label}: ${p.value}`)
      .join("\n");
    reply = zh
      ? `已拉即時資料：\n${lines || "（沒有快照）"}\n\n可用這些數字挑戰任一建議，或叫我重產方案。`
      : `Live data pulled:\n${lines || "(no snapshot)"}\n\nUse these numbers to challenge an item, add a fact, or ask me to regenerate.`;
  } else if (intent === "fact") {
    const text = extractFactText(message);
    next.facts.push({ id: `F${next.facts.length + 1}`, text, source: "human", at });
    reply = zh
      ? `已記下事實 F${next.facts.length}：「${text}」。下一句可以挑戰某項建議，或說「重產」讓我把事實編進方案。`
      : `Fact F${next.facts.length} stored: “${text}”. Challenge an item next, or say “regenerate” so I fold this into the plan.`;
  } else if (intent === "challenge") {
    const hit = applyChallenge(next, message);
    reply = hit
      ? zh
        ? `已挑戰 ${hit.id}（${hit.kind}）「${hit.title}」。說「重產」我會避開這條或改寫推理。`
        : `Challenged ${hit.id} (${hit.kind}) “${hit.title}”. Say “regenerate” and I will drop or rewrite that line.`
      : zh
        ? "已記下挑戰。指出編號（I1…）會更準。"
        : "Challenge noted. Name an item id (I1…) to be precise.";
  } else if (intent === "regenerate") {
    if (live?.regenerated) {
      const regenerated = live.regenerated;
      next.items = regenerated.items;
      next.summary = regenerated.summary;
      next.pulled = regenerated.pulled.length ? regenerated.pulled : next.pulled;
      next.status = "OPEN";
      reply = zh
        ? `已重產 ${next.items.length} 項改進（${next.review_id}）。請再挑一項挑戰，或標記滿意。`
        : `Regenerated ${next.items.length} improvement(s) as ${next.review_id}. Challenge another line or mark it satisfactory.`;
    } else {
      next.status = "OPEN";
      next.summary = `${next.summary} Regenerated after human challenge/facts.`;
      reply = zh
        ? "已依目前事實與挑戰重排建議。若要看新的資料來源／門檻數字，請在本機重產（Pages 快照只能改寫現有項）。"
        : "Re-ranked the current plan from your facts and challenges. On localhost I rebuild from live DB; on the Pages snapshot I can only rewrite these items.";
    }
  } else if (intent === "accept") {
    next.status = "SATISFIED";
    next.items = next.items.map((i) => (i.status === "OPEN" ? { ...i, status: "ACCEPTED" } : i));
    reply = zh
      ? `已將 ${next.review_id} 標為滿意。改進項會留在證據庫；若要再開，跟我說重產即可。`
      : `${next.review_id} marked satisfactory. The items stay in the evidence vault; say “regenerate” if you want another pass.`;
  } else {
    const open = next.items.filter((i) => i.status === "OPEN");
    reply = zh
      ? `目前 ${next.review_id} 狀態 ${next.status}，尚有 ${open.length} 項未決。你可以：拉資料、新增事實、挑戰推理、重產，或標記滿意。\n\n你說：「${message.slice(0, 200)}」——若這是事實請以「新增事實：」開頭；若要否定某項請點名 I1–I6。`
      : `${next.review_id} is ${next.status} with ${open.length} open item(s). You can pull data, add a fact, challenge reasoning, regenerate, or mark satisfactory.\n\nYou said: “${message.slice(0, 200)}”. Prefix “Add fact:” to store it, or name I1–I6 to challenge a line.`;
  }

  next.chat.push({ role: "assistant", content: reply, at: nowIso() });
  return { reply, review: next, suggestions: suggestionsForImprovement(next, locale) };
}
