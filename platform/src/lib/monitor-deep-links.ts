/** Client-safe Monitor 2.0 deep links for Lark AI_REPORT and related surfaces. */

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
      href: "/admin/alerts",
      en: "Realtime Alert & Tracker",
      zh: "即時警報與追蹤",
    });
  }
  links.push({
    id: "aggregation",
    href: "/admin/indicator-aggregation",
    en: "L1→L2 aggregation board",
    zh: "L1→L2 指標聚合台",
  });
  return links;
}
