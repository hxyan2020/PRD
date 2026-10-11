export type RegionId = "na" | "sea" | "eu";

export type GapStatus = "whitespace" | "thin" | "competitive" | "saturated";

export type FactoryPlatform = "1688" | "pinduoduo" | "alibaba" | "taobao";

export type SocialPlatform =
  | "tiktok"
  | "xiaohongshu"
  | "instagram"
  | "x"
  | "youtube";

export interface FactorySource {
  platform: FactoryPlatform;
  listingCount: number;
  supplierCount: number;
  verifiedFactories: number;
  unitPriceUsd: number;
  unitPriceCny: number;
  moq: number;
  cluster: string;
  orders30d: number;
  velocityWoW: number;
  searchUrl: string;
}

export interface SocialPost {
  author: string;
  text: string;
  likes: number;
  time: string;
  url?: string;
}

export interface SocialSignal {
  platform: SocialPlatform;
  mentions7d: number;
  views7d: number;
  engagementRate: number;
  hashtags: string[];
  trend: "rising" | "peak" | "fading";
  samplePosts: SocialPost[];
}

export interface SearchHeat {
  keyword: string;
  related: string[];
  globalIndex: number;
  risingPct: number;
  sparkline: number[];
  byCountry: Record<string, number>;
}

export interface MarketPlatform {
  name: string;
  listings: number;
  avgPrice: number;
}

export interface RegionalMarket {
  region: RegionId;
  exists: boolean;
  status: GapStatus;
  listings: number;
  sellerCount: number;
  avgRetailUsd: number;
  lowRetailUsd: number;
  projectedRetailUsd: number;
  platforms: MarketPlatform[];
  landedCostUsd: number;
  marginPct: number | null;
  notes: string;
}

export interface ProductInput {
  slug: string;
  name: string;
  nameZh: string;
  category: string;
  summary: string;
  whyNow: string;
  image: string;
  imageAlt: string;
  tags: string[];
  factory: FactorySource[];
  social: SocialSignal[];
  search: SearchHeat;
  markets: RegionalMarket[];
}

export interface ScoreBreakdown {
  factoryTrend: number;
  socialHeat: number;
  searchDemand: number;
  marketGap: number;
  supplyEase: number;
  total: number;
}

export interface PriceZone {
  region: RegionId;
  factoryUsd: number;
  landedUsd: number;
  floorUsd: number;
  recommendedUsd: number;
  ceilingUsd: number;
  grossMarginPct: number;
  tight: boolean;
  rationale: string;
}

export interface ScoredProduct extends ProductInput {
  score: ScoreBreakdown;
  bestRegion: RegionId;
  whitespaceRegions: RegionId[];
  maxMarginPct: number | null;
  priceZones: PriceZone[];
}

export const REGION_LABEL: Record<RegionId, string> = {
  na: "North America",
  sea: "Southeast Asia",
  eu: "Europe",
};

export const REGION_MARKETS: Record<RegionId, string[]> = {
  na: ["United States", "Canada", "Mexico"],
  sea: ["Singapore", "Malaysia", "Thailand", "Indonesia", "Philippines", "Vietnam"],
  eu: ["United Kingdom", "Germany", "France", "Italy", "Spain", "Netherlands", "Poland"],
};

export const COUNTRY_TO_REGION: Record<string, RegionId> = {
  US: "na",
  CA: "na",
  MX: "na",
  SG: "sea",
  MY: "sea",
  TH: "sea",
  ID: "sea",
  PH: "sea",
  VN: "sea",
  GB: "eu",
  DE: "eu",
  FR: "eu",
  IT: "eu",
  ES: "eu",
  NL: "eu",
  PL: "eu",
  SE: "eu",
};

export const COUNTRY_LABEL: Record<string, string> = {
  US: "United States",
  CA: "Canada",
  MX: "Mexico",
  SG: "Singapore",
  MY: "Malaysia",
  TH: "Thailand",
  ID: "Indonesia",
  PH: "Philippines",
  VN: "Vietnam",
  GB: "United Kingdom",
  DE: "Germany",
  FR: "France",
  IT: "Italy",
  ES: "Spain",
  NL: "Netherlands",
  PL: "Poland",
  SE: "Sweden",
};
