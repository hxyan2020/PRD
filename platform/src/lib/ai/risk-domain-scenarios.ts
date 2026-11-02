/**
 * Detailed risk scenarios for the Risk Domains catalogue.
 * Canonical content is the desk-12 pack (3 admin · 3 pricing · 3 dealing · 3 perp).
 * Each scenario maps to Monitor 2.0 indicators under /admin/monitor-2.
 */

import { desk12AsDomainScenarios } from "@/lib/demo/desk-12-pack";

export type LocaleText = { en: string; zh: string };

export type DomainScenario = {
  code: string;
  name: LocaleText;
  domain_code: string;
  /** 0 = firm-critical, 1 = primary desk, 2 = secondary, 3 = watch / supporting */
  priority: 0 | 1 | 2 | 3;
  product: string;
  how_it_works: LocaleText;
  participants: LocaleText[];
  impacts: LocaleText;
  /** Primary Monitor 2.0 indicator(s) that must be watched for this scenario */
  primary_indicators: string[];
  related_indicators: string[];
};

/** Extra domains beyond the original 10 — upserted on boot. */
export const EXTRA_RISK_DOMAINS = [
  {
    code: "SYSTEMIC_FIRM",
    name: "Firm-wide Systemic & Contagion",
    description: "Cross-book equity, VaR, kill-switches and news-window contagion that can hit CFD and exchange together.",
    owner_department: "RISK_CONTROL",
    supporting_departments_json: '["AI","SYSTEM","OPERATIONS"]',
    product_coverage: "CFD + Crypto",
    priority: 0,
  },
  {
    code: "THIRD_PARTY_VENDOR",
    name: "Third-party & Vendor Dependency",
    description: "LP, bridge, data vendor, payment and IB rails that fail outside Vantage-owned stack.",
    owner_department: "SYSTEM",
    supporting_departments_json: '["RISK_CONTROL","OPERATIONS"]',
    product_coverage: "CFD + Crypto",
    priority: 3,
  },
  {
    code: "REPUTATION_COMMS",
    name: "Reputation & Client Communications",
    description: "Complaint velocity, chargeback optics and trust damage during incidents.",
    owner_department: "OPERATIONS",
    supporting_departments_json: '["RISK_CONTROL","OPERATIONS"]',
    product_coverage: "CFD + Crypto",
    priority: 3,
  },
] as const;

/** Extra monitors required so new domains / scenarios are fully covered. */
export const EXTRA_MONITOR_SEED_ROWS = [
  {
    monitor_id: "M2-CROSS-BOOK",
    name: "Cross-book Contagion Score",
    domain_code: "SYSTEMIC_FIRM",
    product: "CFD+Crypto",
    warn: 0.55,
    breach: 0.75,
    unit: "score",
    status: "HEALTHY",
    last_value: 0.18,
    tickets: 0,
  },
  {
    monitor_id: "M2-VENDOR-OUT",
    name: "Critical Vendor Degraded Count",
    domain_code: "THIRD_PARTY_VENDOR",
    product: "CFD+Crypto",
    warn: 1,
    breach: 3,
    unit: "vendors",
    status: "HEALTHY",
    last_value: 0,
    tickets: 0,
  },
  {
    monitor_id: "M2-COMPLAINT",
    name: "Client Complaint Velocity (24h)",
    domain_code: "REPUTATION_COMMS",
    product: "CFD+Crypto",
    warn: 40,
    breach: 100,
    unit: "count/24h",
    status: "HEALTHY",
    last_value: 12,
    tickets: 0,
  },
] as const;

/** Desk-12 canonical catalogue (replaces the older broad SCN-* demo set). */
export const DOMAIN_SCENARIOS: DomainScenario[] = desk12AsDomainScenarios();

export function scenariosForDomain(domainCode: string): DomainScenario[] {
  return DOMAIN_SCENARIOS.filter((s) => s.domain_code === domainCode).sort(
    (a, b) => a.priority - b.priority || a.code.localeCompare(b.code)
  );
}

export function allPrimaryIndicatorIds(): string[] {
  const set = new Set<string>();
  for (const s of DOMAIN_SCENARIOS) {
    for (const id of s.primary_indicators) set.add(id);
    for (const id of s.related_indicators) set.add(id);
  }
  return [...set].sort();
}

/** Priority badge styles for P0–P3. */
export function priorityTone(priority: number): {
  label: string;
  className: string;
} {
  switch (priority) {
    case 0:
      return {
        label: "P0",
        className: "bg-rose-600 text-white border-rose-700",
      };
    case 1:
      return {
        label: "P1",
        className: "bg-orange-500 text-white border-orange-600",
      };
    case 2:
      return {
        label: "P2",
        className: "bg-amber-400 text-amber-950 border-amber-500",
      };
    default:
      return {
        label: `P${priority}`,
        className: "bg-slate-500 text-white border-slate-600",
      };
  }
}
