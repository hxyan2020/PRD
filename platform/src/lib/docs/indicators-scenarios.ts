import { getDb } from "@/lib/db";
import { DOMAIN_SCENARIOS } from "@/lib/ai/risk-domain-scenarios";
import { SKILL_SCENARIOS, LINKED_SCENARIOS } from "@/lib/ai/risk-scenarios-catalog";
import { FOREX_INCIDENT_1028, forexIncidentDeskLinks } from "@/lib/demo/forex-incident-1028";
import { getIndicatorMeta } from "@/lib/monitor-indicator-meta";

export type IndicatorCatalogRow = {
  monitor_id: string;
  name: string;
  description: string;
  domain_code: string;
  product: string;
  status: string;
  threshold_warn: number | null;
  threshold_breach: number | null;
  unit: string | null;
  last_value: number | null;
  frequency_en: string;
  frequency_zh: string;
  owner_bu: "admin" | "pricing" | "dealing" | "shared";
  in_forex_demo: boolean;
};

export type ScenarioCatalogRow = {
  code: string;
  name_en: string;
  name_zh: string;
  domain_code: string;
  priority: number;
  product: string;
  primary_indicators: string[];
  related_indicators: string[];
  how_en: string;
  how_zh: string;
  audience: Array<"admin" | "pricing" | "dealing">;
};

function ownerForDomain(domain: string): IndicatorCatalogRow["owner_bu"] {
  if (domain === "MARKET_PRICING" || domain === "PRODUCT_CONFIG") return "pricing";
  if (domain === "LP_HEDGE" || domain === "CREDIT_CLIENT") return "dealing";
  if (domain === "FRAUD_CONDUCT" || domain === "TECH_INFRA") return "shared";
  return "admin";
}

function audienceForDomain(domain: string): ScenarioCatalogRow["audience"] {
  if (domain === "MARKET_PRICING" || domain === "PRODUCT_CONFIG") return ["pricing", "admin"];
  if (domain === "LP_HEDGE" || domain === "CREDIT_CLIENT") return ["dealing", "admin"];
  return ["admin", "pricing", "dealing"];
}

export function listIndicatorCatalog(): IndicatorCatalogRow[] {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT monitor_id, name, domain_code, product, status, threshold_warn, threshold_breach, unit, last_value
       FROM monitor_indicators
       ORDER BY domain_code, monitor_id`
    )
    .all() as Array<{
    monitor_id: string;
    name: string;
    domain_code: string;
    product: string;
    status: string;
    threshold_warn: number | null;
    threshold_breach: number | null;
    unit: string | null;
    last_value: number | null;
  }>;

  const demo = new Set<string>(FOREX_INCIDENT_1028.monitors);
  return rows.map((r) => {
    const meta = getIndicatorMeta(r.monitor_id, { name: r.name, unit: r.unit });
    return {
      ...r,
      description: meta.description,
      frequency_en: meta.frequency,
      frequency_zh: meta.frequency_zh,
      owner_bu: ownerForDomain(r.domain_code),
      in_forex_demo: demo.has(r.monitor_id),
    };
  });
}

export function listScenarioCatalog(): ScenarioCatalogRow[] {
  return DOMAIN_SCENARIOS.map((s) => ({
    code: s.code,
    name_en: s.name.en,
    name_zh: s.name.zh,
    domain_code: s.domain_code,
    priority: s.priority,
    product: s.product,
    primary_indicators: s.primary_indicators,
    related_indicators: s.related_indicators,
    how_en: s.how_it_works.en,
    how_zh: s.how_it_works.zh,
    audience: audienceForDomain(s.domain_code),
  }));
}

export function listSkillScenarioSummary() {
  return SKILL_SCENARIOS.map((s) => ({
    code: s.code,
    name: s.name,
    monitor_id: s.indicator.monitor_id,
    related: s.related_indicators,
    owner_department: s.owner_department,
  }));
}

export function listLinkedScenarioSummary() {
  return LINKED_SCENARIOS.map((s) => ({
    code: s.code,
    name: s.name,
    monitors: (s.sequence || []).map((t) => t.monitor_id),
  }));
}

export function forexDemoPack() {
  return {
    ...FOREX_INCIDENT_1028,
    links: forexIncidentDeskLinks(),
  };
}
