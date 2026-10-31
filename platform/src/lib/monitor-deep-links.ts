/** Client-safe Monitor 2.0 deep links for Lark AI_REPORT and related surfaces. */

import { FOREX_INCIDENT_1028, forexIncidentChip } from "@/lib/demo/forex-incident-1028";

export type MonitorDeepLink = {
  id: string;
  href: string;
  en: string;
  zh: string;
};

/**
 * Surfaces operators can open from an AI incident report.
 * When `monitorId` is known, include the indicator-scoped hub + realtime alerts.
 */
export function monitor2DeepLinks(monitorId?: string | null): MonitorDeepLink[] {
  const fx = FOREX_INCIDENT_1028;
  const id = String(monitorId || "")
    .trim()
    .toUpperCase();
  const links: MonitorDeepLink[] = [
    {
      id: "hub",
      href: "/admin/monitor-2",
      en: "Monitor 2.0 hub",
      zh: "Monitor 2.0 中心",
    },
  ];
  if (id) {
    links.push({
      id: "indicator",
      href: `/admin/monitor-2?monitor_id=${encodeURIComponent(id)}`,
      en: `Indicator ${id}`,
      zh: `指標 ${id}`,
    });
    links.push({
      id: "alerts",
      href: `/admin/alerts?monitor_id=${encodeURIComponent(id)}`,
      en: `Realtime alerts · ${id}`,
      zh: `即時警報 · ${id}`,
    });
  } else {
    links.push({
      id: "alerts",
      href: `/admin/alerts?monitor_id=${encodeURIComponent(fx.primary_monitor_id)}`,
      en: `Realtime alerts · ${fx.incident_id}`,
      zh: `即時警報 · ${fx.incident_id}`,
    });
  }
  links.push({
    id: "aggregation",
    href: fx.aggregation_path,
    en: "L1→L2 aggregation board",
    zh: "L1→L2 指標聚合台",
  });
  links.push({
    id: "l2_rca",
    href: fx.l2_labs_path,
    en: "L2 → AI RCA Lab (Discovery→L2→RCA)",
    zh: "L2 → AI RCA 實驗室（發現→L2→RCA）",
  });
  links.push({
    id: "ai_incident",
    href: fx.workspace_path,
    en: `AI Incident Workspace (${forexIncidentChip("en")})`,
    zh: `AI 事故工作台（${forexIncidentChip("zh-Hant")}）`,
  });
  links.push({
    id: "noise_reduction",
    href: fx.noise_labs_path,
    en: "Noise Reduction Lab (same forex book)",
    zh: "降噪實驗室（同一外匯帳簿）",
  });
  links.push({
    id: "discovery",
    href: fx.discovery_path,
    en: "Unknown Risk Discovery",
    zh: "未知風險探索",
  });
  links.push({
    id: "messenger_inc",
    href: "/admin/messenger",
    en: `Ops Inbox (${fx.incident_id} thread)`,
    zh: `值班收件匣（${fx.incident_id} 執行緒）`,
  });
  return links;
}
