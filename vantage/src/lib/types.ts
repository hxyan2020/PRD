export type Sector = "banks" | "brokers" | "crypto";

export type NewsCategory =
  | "listing"
  | "product"
  | "regulation"
  | "risk_tools";

export type SourceKind =
  | "regulator"
  | "official_entity"
  | "industry_news"
  | "vendor"
  | "aggregator";

export type SourceHealth = "healthy" | "degraded" | "down";

export type WindowKind = "daily" | "weekend";

export interface Entity {
  id: string;
  rank: number;
  name: string;
  aliases: string[];
  sector: Sector;
  hq: string;
  country: string;
  website: string;
  notes?: string;
}

export interface RiskTool {
  id: string;
  name: string;
  vendor: string;
  aliases: string[];
  use: "internal" | "external" | "both";
  category: string;
  sectors: Sector[];
  website: string;
  summary: string;
}

export interface DataSource {
  id: string;
  name: string;
  kind: SourceKind;
  url: string;
  homepage: string;
  jurisdictions: string[];
  sectors: Array<Sector | "cross">;
  categories: NewsCategory[];
  notes?: string;
}

export interface SourceStatus {
  id: string;
  name: string;
  kind: SourceKind;
  url: string;
  homepage: string;
  jurisdictions: string[];
  lastSourced: string | null;
  status: SourceHealth;
  httpStatus: number | null;
  latencyMs: number | null;
  itemsInWindow: number;
  itemsFetched: number;
  error: string | null;
}

export interface Impact {
  sectors: Sector[];
  assets: string[];
  summary: string;
}

export interface NewsItem {
  id: string;
  caption: string;
  category: NewsCategory;
  sectors: Sector[];
  keyPoints: string[];
  sources: Array<{ name: string; url: string; sourceId: string }>;
  publishedAt: string;
  entities: string[];
  jurisdictions: string[];
  impact: Impact | null;
  riskTools: string[];
}

export interface BriefingMeta {
  generatedAt: string;
  windowKind: WindowKind;
  windowLabel: string;
  windowStart: string;
  windowEnd: string;
  itemCount: number;
  sourceStats: {
    total: number;
    healthy: number;
    degraded: number;
    down: number;
  };
}

export interface Briefing {
  meta: BriefingMeta;
  items: NewsItem[];
  sources: SourceStatus[];
}

export interface CatalogMeta {
  banks: { ranking: string; asOf: string };
  brokers: { ranking: string; asOf: string };
  exchanges: { ranking: string; asOf: string };
}
