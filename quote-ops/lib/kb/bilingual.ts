/**
 * Fill missing ZH↔EN fields on publish.
 * Uses a domain glossary + structured mirror so both locales exist;
 * marks payload for human review (not a substitute for professional translation).
 */

const GLOSSARY: Array<[RegExp, string]> = [
  [/剥头皮|短线剥头皮/g, "scalping"],
  [/报价小队/g, "pricing squad"],
  [/知识库/g, "knowledge base"],
  [/风险场景/g, "risk scenario"],
  [/报价全流程/g, "pricing pipeline"],
  [/定价引擎/g, "pricing engine"],
  [/聚合器/g, "aggregator"],
  [/参考价/g, "reference price"],
  [/开盘保护/g, "open protection"],
  [/强平/g, "liquidation"],
  [/资金费率/g, "funding rate"],
  [/标记价格/g, "mark price"],
  [/指数价格/g, "index price"],
  [/做市/g, "market making"],
  [/接仓/g, "takeover / risk absorption"],
  [/对冲/g, "hedging"],
  [/保证金/g, "margin"],
  [/持仓/g, "position"],
  [/订单簿|盘口/g, "order book"],
  [/深度/g, "depth"],
  [/告警/g, "alert"],
  [/排查/g, "investigation"],
  [/根因/g, "root cause"],
  [/验收/g, "acceptance / verification"],
  [/待确认/g, "[TBC]"],
  [/创建时间/g, "created at"],
  [/最近更改/g, "last updated"],
  [/操作人/g, "operator"],
  [/自定义知识/g, "custom knowledge"],
  [/原则与框架/g, "principles & framework"],
  [/数据库架构/g, "database architecture"],
];

const GLOSSARY_EN_TO_ZH: Array<[RegExp, string]> = [
  [/\bscalping\b/gi, "剥头皮"],
  [/\bpricing engine\b/gi, "定价引擎"],
  [/\bfunding rate\b/gi, "资金费率"],
  [/\bmark price\b/gi, "标记价格"],
  [/\bindex price\b/gi, "指数价格"],
  [/\bliquidation\b/gi, "强平"],
  [/\bhedging\b/gi, "对冲"],
  [/\bmargin\b/gi, "保证金"],
  [/\border book\b/gi, "订单簿"],
  [/\broot cause\b/gi, "根因"],
  [/\bknowledge base\b/gi, "知识库"],
];

export type BilingualFields = {
  titleZh: string;
  titleEn: string;
  summaryZh: string;
  summaryEn: string;
  bodyZh: string;
  bodyEn: string;
};

export type BilingualResult = BilingualFields & {
  mirrored: boolean;
  source: "zh" | "en" | "both" | "empty";
  needsReview: boolean;
};

function applyGlossary(text: string, pairs: Array<[RegExp, string]>): string {
  let out = text;
  for (const [re, rep] of pairs) out = out.replace(re, rep);
  return out;
}

function draftEnFromZh(zh: string, kind: "title" | "summary" | "body"): string {
  const glossed = applyGlossary(zh, GLOSSARY);
  if (kind === "title") {
    return glossed === zh ? `[EN draft] ${zh}` : glossed;
  }
  if (kind === "summary") {
    return [
      "[Auto-generated from Chinese on publish — please review]",
      "",
      glossed,
    ].join("\n");
  }
  return [
    "> Auto-generated English from Chinese on publish. Please review before treating as final.",
    "",
    glossed,
  ].join("\n");
}

function draftZhFromEn(en: string, kind: "title" | "summary" | "body"): string {
  const glossed = applyGlossary(en, GLOSSARY_EN_TO_ZH);
  if (kind === "title") {
    return glossed === en ? `[中文草案] ${en}` : glossed;
  }
  if (kind === "summary") {
    return ["【发布时由英文自动生成 — 待审阅】", "", glossed].join("\n");
  }
  return ["> 发布时由英文自动生成中文，请审阅后再视为正式译文。", "", glossed].join("\n");
}

/** Fill any empty locale fields from the populated side. */
export function mirrorMissingLocale(fields: BilingualFields): BilingualResult {
  const hasZh = !!(fields.titleZh.trim() || fields.bodyZh.trim() || fields.summaryZh.trim());
  const hasEn = !!(fields.titleEn.trim() || fields.bodyEn.trim() || fields.summaryEn.trim());
  let source: BilingualResult["source"] = "empty";
  if (hasZh && hasEn) source = "both";
  else if (hasZh) source = "zh";
  else if (hasEn) source = "en";

  let titleZh = fields.titleZh;
  let titleEn = fields.titleEn;
  let summaryZh = fields.summaryZh;
  let summaryEn = fields.summaryEn;
  let bodyZh = fields.bodyZh;
  let bodyEn = fields.bodyEn;
  let mirrored = false;

  if (!titleEn.trim() && titleZh.trim()) {
    titleEn = draftEnFromZh(titleZh, "title");
    mirrored = true;
  }
  if (!titleZh.trim() && titleEn.trim()) {
    titleZh = draftZhFromEn(titleEn, "title");
    mirrored = true;
  }
  if (!summaryEn.trim() && summaryZh.trim()) {
    summaryEn = draftEnFromZh(summaryZh, "summary");
    mirrored = true;
  }
  if (!summaryZh.trim() && summaryEn.trim()) {
    summaryZh = draftZhFromEn(summaryEn, "summary");
    mirrored = true;
  }
  if (!bodyEn.trim() && bodyZh.trim()) {
    bodyEn = draftEnFromZh(bodyZh, "body");
    mirrored = true;
  }
  if (!bodyZh.trim() && bodyEn.trim()) {
    bodyZh = draftZhFromEn(bodyEn, "body");
    mirrored = true;
  }

  return {
    titleZh,
    titleEn,
    summaryZh,
    summaryEn,
    bodyZh,
    bodyEn,
    mirrored,
    source,
    needsReview: mirrored || source === "both",
  };
}
