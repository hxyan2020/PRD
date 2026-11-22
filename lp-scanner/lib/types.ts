export type Locale = "en" | "zh-CN";

export type LpCategory = "traditional" | "crypto" | "hybrid" | "technology";

export type AssetClass =
  | "fx"
  | "metals"
  | "indices"
  | "commodities"
  | "energies"
  | "equities"
  | "crypto"
  | "etf"
  | "bonds";

export type LpRecord = {
  id: string;
  slug: string;
  name: string;
  aliases: string[];
  category: LpCategory;
  usedByVantage: boolean;
  regions: string[];
  hours: "24/5" | "24/7" | "market-hours" | "mixed";
  assetClasses: AssetClass[];
  products: string[];
  costTier: "low" | "medium" | "high" | "negotiated";
  pricingQuality: 1 | 2 | 3 | 4 | 5;
  latencyProfile: "ultra-low" | "low" | "medium";
  regulation: string[];
  strengths: string[];
  weaknesses: string[];
  bestFor: string[];
  website?: string;
  /** Optional override; defaults to `/logos/{slug}.png`. */
  logoUrl?: string;
  notes: string;
  kbBodyEn: string;
  kbBodyZh: string;
  scoreHints: {
    gold: number;
    fxMajors: number;
    indices: number;
    oil: number;
    crypto: number;
    asia: number;
  };
  updatedAt: string;
};

export type RankedLp = {
  lp: LpRecord;
  rank: number;
  score: number;
  offersProduct: boolean;
  reasons: string[];
  liveNotes: string[];
  columns: {
    name: string;
    usedByVantage: boolean;
    category: string;
    hours: string;
    costTier: string;
    pricingQuality: number;
    regions: string;
    latency: string;
    score: number;
  };
};

export type LpResearchResult = {
  query: string;
  matched?: LpRecord;
  isNew: boolean;
  summary: string;
  goodFor: string[];
  recommendedProducts: string[];
  competitorComparison: { name: string; relation: string; edge: string }[];
  liveFindings: string[];
  sources: { title: string; url: string }[];
  researchedAt: string;
};

export type ChatMessage = {
  role: "user" | "assistant";
  text: string;
};
