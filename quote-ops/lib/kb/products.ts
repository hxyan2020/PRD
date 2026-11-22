/** Two clearly separated knowledge products. */
export type ProductId = "cfd-broker" | "v-exchange-perp";

export type ProductDef = {
  id: ProductId;
  /** Primary UI title (header / hero). */
  titleZh: string;
  titleEn: string;
  brandZh: string;
  brandEn: string;
  taglineZh: string;
  taglineEn: string;
  shortZh: string;
  shortEn: string;
  /** Compact switcher label */
  switchZh: string;
  switchEn: string;
  /** Input scope badge */
  scopeZh: string;
  scopeEn: string;
};

export const PRODUCTS: Record<ProductId, ProductDef> = {
  "cfd-broker": {
    id: "cfd-broker",
    titleZh: "定价",
    titleEn: "Pricing",
    brandZh: "Pricing · CFD Broker",
    brandEn: "Pricing · CFD Broker",
    taglineZh: "定价小队知识库：LP→PE→MT、86 风险场景、CFD 定价 RCA",
    taglineEn: "Pricing squad KB: LP→PE→MT, 86 risk scenarios, CFD pricing RCA",
    shortZh: "CFD 定价",
    shortEn: "CFD Pricing",
    switchZh: "CFD 定价",
    switchEn: "Pricing",
    scopeZh: "检索范围：CFD Broker 定价知识库",
    scopeEn: "Scope: CFD Broker pricing KB",
  },
  "v-exchange-perp": {
    id: "v-exchange-perp",
    titleZh: "V Exchange 知识库",
    titleEn: "V Exchange Knowledge Base",
    brandZh: "V Exchange 知识库 · 永续合约",
    brandEn: "V Exchange Knowledge Base · Perpetual",
    taglineZh: "永续合约风控 Skill + RAG：Funding / Mark / Index / 强平 / DB 做市",
    taglineEn: "Perp exchange risk Skill + RAG: Funding / Mark / Index / liq / DB MM",
    shortZh: "永续知识库",
    shortEn: "Perp KB",
    switchZh: "V Exchange 永续",
    switchEn: "V Exchange",
    scopeZh: "检索范围：V Exchange 永续合约知识库",
    scopeEn: "Scope: V Exchange perpetual KB",
  },
};

export const DEFAULT_PRODUCT: ProductId = "cfd-broker";

/** App-level document title. */
export const APP_TITLE_EN = "V Exchange Knowledge Base";
export const APP_TITLE_ZH = "V Exchange 知识库";

export function isProductId(v: unknown): v is ProductId {
  return v === "cfd-broker" || v === "v-exchange-perp";
}

export function productOfNode(
  payload: Record<string, unknown> | undefined,
  tags: string[] = [],
): ProductId {
  const fromPayload = payload?.product;
  if (isProductId(fromPayload)) return fromPayload;
  if (
    tags.includes("v-exchange") ||
    tags.includes("v-exchange-perp") ||
    tags.includes("永续") ||
    tags.includes("perpetual")
  ) {
    return "v-exchange-perp";
  }
  return "cfd-broker";
}

/** Strong exclusive signals — prefer these over shared words like 强平/index. */
const VE_STRONG: RegExp[] = [
  /v\s*exchange/i,
  /vexchange/i,
  /永续合约/,
  /永续交易所/,
  /永续/,
  /\bperp(?:etual)?\b/i,
  /资金费率/,
  /\bfunding\b/i,
  /标记价格/,
  /\bmark\s*price\b/i,
  /premium\s*index/i,
  /溢价指数/,
  /\badl\b/i,
  /接仓/,
  /做市账户/,
  /db\s*接仓/i,
  /xauusd\s*永续/i,
  /ve-inc/i,
  /index\s*fallback/i,
  /指数源/,
  /价格源/,
];

const CFD_STRONG: RegExp[] = [
  /\bcfd\b/i,
  /经纪商/,
  /quoteops/i,
  /\bpricing\b/i,
  /\blp\s*[→\->]+\s*pe\b/i,
  /\blp\b.*\bpe\b.*\bmt\b/i,
  /报价小队/,
  /定价小队/,
  /报价链路/,
  /定价链路/,
  /旧价/,
  /stale\s*quote/i,
  /quote\s*age/i,
  /markout/i,
  /剥头皮/,
  /scalp/i,
  /b-?book/i,
  /latency\s*arb/i,
  /时延套利/,
  /quote\s*tick/i,
  /healthy\s*vs\s*abusive/i,
  /86\s*风险/,
];

/** Weaker hints — only count if no strong signal on the other side, and not alone for flip. */
const VE_WEAK: RegExp[] = [
  /\bmark\b/i,
  /\bindex\b/i,
  /指数/,
  /盘口/,
  /深度监控/,
];

const CFD_WEAK: RegExp[] = [
  /\blp\b/i,
  /\bpe\b/i,
  /\bmt5\b/i,
  /报价/,
  /定价/,
  /定价引擎/,
];

function scorePatterns(q: string, patterns: RegExp[]): number {
  let n = 0;
  for (const re of patterns) {
    if (re.test(q)) n += 1;
  }
  return n;
}

/**
 * Infer product from free-text while typing / asking.
 * Returns null when ambiguous (e.g. shared word 强平 alone).
 */
export function inferProductFromQuery(q: string): ProductId | null {
  const text = q.trim();
  if (text.length < 2) return null;

  const veStrong = scorePatterns(text, VE_STRONG);
  const cfdStrong = scorePatterns(text, CFD_STRONG);

  if (veStrong > 0 && cfdStrong === 0) return "v-exchange-perp";
  if (cfdStrong > 0 && veStrong === 0) return "cfd-broker";
  if (veStrong > cfdStrong) return "v-exchange-perp";
  if (cfdStrong > veStrong) return "cfd-broker";

  // Both strong or neither — try weak only when one side clearly wins
  const veWeak = scorePatterns(text, VE_WEAK);
  const cfdWeak = scorePatterns(text, CFD_WEAK);
  if (veStrong === 0 && cfdStrong === 0) {
    if (veWeak >= 2 && cfdWeak === 0) return "v-exchange-perp";
    if (cfdWeak >= 2 && veWeak === 0) return "cfd-broker";
    return null;
  }
  // Conflicting strong signals → ambiguous
  return null;
}

/** True when query clearly belongs to the other product line. */
export function queryConflictsWithProduct(q: string, current: ProductId): ProductId | null {
  const inferred = inferProductFromQuery(q);
  if (inferred && inferred !== current) return inferred;
  return null;
}
