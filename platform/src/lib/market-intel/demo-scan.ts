import { formatMarketIntelMessage } from "@/lib/market-intel/format";
import { EVENT_TEMPLATES, MARKET_INTEL_SOURCES } from "@/lib/market-intel/sources";

export type DemoFinding = {
  id: number;
  finding_id: string;
  event_title: string;
  event_summary: string;
  geography: string;
  severity: string;
  products_json: string;
  sources_json: string;
  asset_classes_json: string;
  scanned_at: string;
  pushed_to_lark: number;
  lark_message_id: string | null;
  status: string;
};

export type DemoScan = {
  scan_id: string;
  started_at: string;
  finished_at: string | null;
  sources_checked: number;
  findings_new: number;
  findings_pushed: number;
  high_impact_count: number;
  status: string;
  trigger_mode: string;
};

export type DemoOutbox = {
  id: number;
  finding_id: string;
  channel_chat_id: string;
  formatted_message: string;
  delivered: number;
  created_at: string;
};

export type DemoScanResult = {
  ok: true;
  scan_id: string;
  sources_checked: number;
  findings_new: number;
  findings_pushed: number;
  high_impact_count: number;
  findings: DemoFinding[];
  scans: DemoScan[];
  outbox: DemoOutbox[];
};

function shortId(prefix: string) {
  const n = Math.floor(Math.random() * 0xffffff)
    .toString(16)
    .toUpperCase()
    .padStart(6, "0");
  return `${prefix}-${n}`;
}

export function pickDemoTemplates(at = new Date(), count?: number) {
  const hour = at.getUTCHours();
  const minuteBucket = Math.floor(at.getUTCMinutes() / 5);
  const pickCount = count ?? 1 + ((hour + minuteBucket) % 3);
  const start = (hour * 3 + minuteBucket) % EVENT_TEMPLATES.length;
  return Array.from({ length: pickCount }, (_, i) => EVENT_TEMPLATES[(start + i) % EVENT_TEMPLATES.length]);
}

/** Client-side scan used on GitHub Pages (no /api). Rotates EVENT_TEMPLATES like the live scanner. */
export function runClientMarketIntelScan(opts?: {
  existingFindingIds?: string[];
  sourceCount?: number;
  trigger?: string;
}): DemoScanResult {
  const now = new Date();
  const ts = now.toISOString();
  const scanId = shortId("MIS");
  const templates = pickDemoTemplates(now);
  const sourcesChecked = opts?.sourceCount || MARKET_INTEL_SOURCES.length;
  const seen = new Set(opts?.existingFindingIds || []);

  const findings: DemoFinding[] = [];
  const outbox: DemoOutbox[] = [];
  let highImpact = 0;

  templates.forEach((c, i) => {
    const findingId = shortId("MIF");
    if (seen.has(findingId)) return;
    const isHigh = c.severity === "WARN" || c.severity === "BREACH" || c.severity === "CRITICAL";
    if (isHigh) highImpact += 1;
    const message = formatMarketIntelMessage({
      finding_id: findingId,
      event_title: c.event_title,
      event_summary: c.event_summary,
      geography: c.geography,
      severity: c.severity,
      products: c.products,
      timestamp: ts,
      sources: c.source_urls,
    });
    const numericId = Date.now() + i;
    findings.push({
      id: numericId,
      finding_id: findingId,
      event_title: c.event_title,
      event_summary: c.event_summary,
      geography: c.geography,
      severity: c.severity,
      products_json: JSON.stringify(c.products),
      sources_json: JSON.stringify(c.source_urls),
      asset_classes_json: JSON.stringify(c.asset_classes),
      scanned_at: ts,
      pushed_to_lark: 1,
      lark_message_id: `om_mi_${findingId.toLowerCase()}`,
      status: "PUSHED",
    });
    outbox.push({
      id: numericId,
      finding_id: findingId,
      channel_chat_id: "oc_market_intelligence",
      formatted_message: message,
      delivered: 1,
      created_at: ts,
    });
  });

  const scan: DemoScan = {
    scan_id: scanId,
    started_at: ts,
    finished_at: ts,
    sources_checked: sourcesChecked,
    findings_new: findings.length,
    findings_pushed: findings.length,
    high_impact_count: highImpact,
    status: "COMPLETED",
    trigger_mode: opts?.trigger || "MANUAL",
  };

  return {
    ok: true,
    scan_id: scanId,
    sources_checked: sourcesChecked,
    findings_new: findings.length,
    findings_pushed: findings.length,
    high_impact_count: highImpact,
    findings,
    scans: [scan],
    outbox,
  };
}
