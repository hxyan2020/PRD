/** Two clearly separated knowledge products in QuoteOps. */
export type ProductId = "cfd-broker" | "v-exchange-perp";

export type ProductDef = {
  id: ProductId;
  brandZh: string;
  brandEn: string;
  taglineZh: string;
  taglineEn: string;
  shortZh: string;
  shortEn: string;
  /** Query tokens that strongly imply this product */
  hintTokens: string[];
};

export const PRODUCTS: Record<ProductId, ProductDef> = {
  "cfd-broker": {
    id: "cfd-broker",
    brandZh: "QuoteOps · CFD Broker",
    brandEn: "QuoteOps · CFD Broker",
    taglineZh: "报价小队知识库：LP→PE→MT、86 风险场景、CFD 报价 RCA",
    taglineEn: "Pricing squad KB: LP→PE→MT, 86 risk scenarios, CFD quote RCA",
    shortZh: "CFD Broker",
    shortEn: "CFD Broker",
    hintTokens: [
      "cfd",
      "broker",
      "lp",
      "pe",
      "mt",
      "quoteops",
      "报价",
      "经纪",
      "剥头皮",
      "markout",
      "b-book",
    ],
  },
  "v-exchange-perp": {
    id: "v-exchange-perp",
    brandZh: "V Exchange · 永续合约",
    brandEn: "V Exchange · Perpetual",
    taglineZh: "永续合约风控 Skill + RAG：Funding / Mark / Index / 强平 / DB 做市",
    taglineEn: "Perp risk Skill + RAG: Funding / Mark / Index / liquidation / DB MM",
    shortZh: "永续合约",
    shortEn: "Perpetual",
    hintTokens: [
      "v exchange",
      "vexchange",
      "永续",
      "perp",
      "perpetual",
      "funding",
      "资金费率",
      "mark price",
      "标记价格",
      "index",
      "指数",
      "adl",
      "强平",
      "做市",
      "接仓",
      "xauusd 永续",
    ],
  },
};

export const DEFAULT_PRODUCT: ProductId = "cfd-broker";

export function isProductId(v: unknown): v is ProductId {
  return v === "cfd-broker" || v === "v-exchange-perp";
}

export function productOfNode(payload: Record<string, unknown> | undefined, tags: string[] = []): ProductId {
  const fromPayload = payload?.product;
  if (isProductId(fromPayload)) return fromPayload;
  if (tags.includes("v-exchange") || tags.includes("v-exchange-perp") || tags.includes("永续")) {
    return "v-exchange-perp";
  }
  return "cfd-broker";
}

/** Infer product from free-text question when user did not pick one. */
export function inferProductFromQuery(q: string): ProductId | null {
  const lower = q.toLowerCase();
  let ve = 0;
  let cfd = 0;
  for (const t of PRODUCTS["v-exchange-perp"].hintTokens) {
    if (lower.includes(t.toLowerCase())) ve += 1;
  }
  for (const t of PRODUCTS["cfd-broker"].hintTokens) {
    if (lower.includes(t.toLowerCase())) cfd += 1;
  }
  if (ve === 0 && cfd === 0) return null;
  return ve >= cfd ? "v-exchange-perp" : "cfd-broker";
}
