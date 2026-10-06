import { createHash, randomBytes } from "crypto";
import { getDb, writeAudit } from "@/lib/db";
import { ensureMarketIntelSchema } from "@/lib/market-intel/schema";
import { formatMarketIntelMessage } from "@/lib/market-intel/format";
import {
  EVENT_TEMPLATES,
  MARKET_INTEL_SOURCES,
  type ScrapedCandidate,
} from "@/lib/market-intel/sources";
import { DEMO_SOURCE_HEALTH } from "@/lib/market-intel/source-brand";
import { createAlarmAndAnalyze } from "@/lib/ai/analyze";
import { logSpineEvent } from "@/lib/ai/spine";

const SCAN_INTERVAL_MS = 5 * 60 * 1000;
const LARK_CHAT_ID = "oc_market_intelligence";
const INDICATOR_ID = "M2-MKT-INTEL";

declare global {
  // eslint-disable-next-line no-var
  var __crmpMarketIntelTimer: ReturnType<typeof setInterval> | undefined;
  // eslint-disable-next-line no-var
  var __crmpMarketIntelStarted: boolean | undefined;
}

function newId(prefix: string) {
  return `${prefix}-${randomBytes(3).toString("hex").toUpperCase()}`;
}

function fingerprint(seed: string, title: string) {
  // 5-minute bucket matches scan cadence — same headline can re-fire next window if still relevant
  const d = new Date();
  const bucket = `${d.toISOString().slice(0, 13)}:${String(Math.floor(d.getUTCMinutes() / 5) * 5).padStart(2, "0")}`;
  return createHash("sha256").update(`${seed}|${title}|${bucket}`).digest("hex").slice(0, 24);
}

export function seedMarketIntel(db = getDb()) {
  ensureMarketIntelSchema(db);

  const upsertSrc = db.prepare(
    `INSERT INTO market_intel_sources
       (source_key, name, channel_type, asset_classes_json, url, enabled, health_status, health_detail)
     VALUES (?, ?, ?, ?, ?, 1, ?, ?)
     ON CONFLICT(source_key) DO UPDATE SET
       name = excluded.name,
       channel_type = excluded.channel_type,
       asset_classes_json = excluded.asset_classes_json,
       url = excluded.url`
  );
  for (const s of MARKET_INTEL_SOURCES) {
    const demo = DEMO_SOURCE_HEALTH[s.source_key];
    upsertSrc.run(
      s.source_key,
      s.name,
      s.channel_type,
      JSON.stringify(s.asset_classes),
      s.url,
      demo?.status ?? "HEALTHY",
      demo?.detail ?? "Catalog seed — awaiting next scrape"
    );
  }
  // Apply demo health only when still UNKNOWN / catalog-seeded (never overwrite live scrape health).
  for (const [key, demo] of Object.entries(DEMO_SOURCE_HEALTH)) {
    db.prepare(
      `UPDATE market_intel_sources
       SET health_status = ?, health_detail = ?
       WHERE source_key = ?
         AND (health_status = 'UNKNOWN' OR health_detail LIKE 'Catalog seed%')`
    ).run(demo.status, demo.detail, key);
  }
  // Existing rows with a recent scrape but no health yet → HEALTHY.
  db.prepare(
    `UPDATE market_intel_sources
     SET health_status = 'HEALTHY',
         health_detail = COALESCE(NULLIF(health_detail, ''), 'Last scrape OK')
     WHERE health_status = 'UNKNOWN' AND last_scraped_at IS NOT NULL`
  ).run();

  // Dedicated Lark / messenger group
  const existing = db
    .prepare(`SELECT id FROM lark_channels WHERE chat_id = ?`)
    .get(LARK_CHAT_ID) as { id: number } | undefined;
  if (!existing) {
    db.prepare(
      `INSERT INTO lark_channels (name, chat_id, purpose, department_code, severity_min, enabled, webhook_url)
       VALUES (?, ?, ?, ?, ?, 1, ?)`
    ).run(
      "Market Intelligence",
      LARK_CHAT_ID,
      "5-min market intel scans — news, social, official pubs affecting LP-priced Vantage instruments",
      "RISK_CONTROL",
      "INFO",
      "https://open.larksuite.com/hook/mock-market-intel"
    );
  }

  const upsertSetting = db.prepare(
    `INSERT INTO platform_settings (key, value, description) VALUES (?, ?, ?)
     ON CONFLICT(key) DO NOTHING`
  );
  upsertSetting.run("market_intel.enabled", "true", "Enable 5-minute market intelligence scanner");
  upsertSetting.run("market_intel.interval_minutes", "5", "Scan cadence in minutes");
  upsertSetting.run("market_intel.lark_chat_id", LARK_CHAT_ID, "Dedicated messenger group for intel pushes");
  upsertSetting.run(
    "market_intel.raise_indicator_alarms",
    "true",
    "When high-impact findings arrive, update M2-MKT-INTEL and raise alarm"
  );

  seedDemoFindingsIfEmpty(db);
}

/** Bake a few findings into SSG / first load so Scan is not an empty 0-count desk. */
export function seedDemoFindingsIfEmpty(db = getDb()) {
  const count = db.prepare(`SELECT COUNT(*) AS c FROM market_intel_findings`).get() as { c: number };
  if (count.c > 0) return;

  const ts = new Date().toISOString();
  const insertFinding = db.prepare(
    `INSERT INTO market_intel_findings
     (finding_id, event_title, event_summary, geography, severity, products_json, directions_json,
      sources_json, asset_classes_json, fingerprint, scanned_at, pushed_to_lark, lark_message_id, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, 'PUSHED')`
  );
  const insertOutbox = db.prepare(
    `INSERT INTO market_intel_lark_outbox (finding_id, channel_chat_id, formatted_message, delivered, mock, delivered_at)
     VALUES (?, ?, ?, 1, 1, datetime('now'))`
  );
  const insertScan = db.prepare(
    `INSERT INTO market_intel_scans
     (scan_id, started_at, finished_at, sources_checked, findings_new, findings_pushed, high_impact_count, status, trigger_mode, detail_json)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'COMPLETED', 'SEED', ?)`
  );

  const picked = EVENT_TEMPLATES.slice(0, 3);
  let high = 0;
  for (const c of picked) {
    const findingId = newId("MIF");
    const fp = fingerprint(c.fingerprint_seed, `seed|${c.event_title}`);
    if (c.severity === "WARN" || c.severity === "BREACH" || c.severity === "CRITICAL") high += 1;
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
    insertFinding.run(
      findingId,
      c.event_title,
      c.event_summary,
      c.geography,
      c.severity,
      JSON.stringify(c.products),
      JSON.stringify(c.products.map((p) => ({ product: p.product, direction: p.direction }))),
      JSON.stringify(c.source_urls),
      JSON.stringify(c.asset_classes),
      fp,
      ts,
      `om_mi_${findingId.toLowerCase()}`
    );
    insertOutbox.run(findingId, LARK_CHAT_ID, message);
  }
  insertScan.run(
    newId("MIS"),
    ts,
    ts,
    MARKET_INTEL_SOURCES.length,
    picked.length,
    picked.length,
    high,
    JSON.stringify({ seed: true })
  );

  db.prepare(`UPDATE market_intel_sources SET last_scraped_at = datetime('now')`).run();
}

/** Prototype scrape: try lightweight HTTP HEAD/GET on a few sources; always enrich with templates. */
async function scrapeCandidates(): Promise<{ checked: number; candidates: ScrapedCandidate[] }> {
  let checked = 0;
  const liveHints: string[] = [];

  const sample = MARKET_INTEL_SOURCES.filter((_, i) => i % 3 === new Date().getMinutes() % 3).slice(0, 6);
  await Promise.all(
    sample.map(async (src) => {
      checked += 1;
      try {
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), 2500);
        const res = await fetch(src.url, {
          method: "GET",
          signal: ctrl.signal,
          headers: { "User-Agent": "VantageCRMP-MarketIntel/1.0" },
          redirect: "follow",
        }).catch(() => null);
        clearTimeout(t);
        if (res && (res.ok || res.status < 500)) {
          liveHints.push(src.source_key);
          getDb()
            .prepare(
              `UPDATE market_intel_sources
               SET last_scraped_at = datetime('now'),
                   health_status = 'HEALTHY',
                   health_detail = ?
               WHERE source_key = ?`
            )
            .run(`HTTP ${res.status} OK`, src.source_key);
        } else {
          getDb()
            .prepare(
              `UPDATE market_intel_sources
               SET health_status = 'DOWN',
                   health_detail = ?
               WHERE source_key = ?`
            )
            .run(res ? `HTTP ${res.status}` : "Network unreachable", src.source_key);
        }
      } catch {
        getDb()
          .prepare(
            `UPDATE market_intel_sources
             SET health_status = 'DOWN',
                 health_detail = 'Fetch aborted / error'
             WHERE source_key = ?`
          )
          .run(src.source_key);
      }
    })
  );

  // Rotate 1–3 templates per scan so the 5-min job always has signal
  const hour = new Date().getUTCHours();
  const minuteBucket = Math.floor(new Date().getUTCMinutes() / 5);
  const pickCount = 1 + ((hour + minuteBucket) % 3);
  const start = (hour * 3 + minuteBucket) % EVENT_TEMPLATES.length;
  const candidates: ScrapedCandidate[] = [];
  for (let i = 0; i < pickCount; i++) {
    const base = EVENT_TEMPLATES[(start + i) % EVENT_TEMPLATES.length];
    // Prefer templates whose sources were "touched" this scan when possible
    const boosted =
      liveHints.length && base.source_keys.some((k) => liveHints.includes(k))
        ? base
        : base;
    candidates.push(boosted);
  }
  return { checked, candidates };
}

function pushToLark(findingId: string, message: string) {
  const db = getDb();
  const chatId =
    (
      db.prepare(`SELECT value FROM platform_settings WHERE key='market_intel.lark_chat_id'`).get() as
        | { value: string }
        | undefined
    )?.value || LARK_CHAT_ID;

  const channel = db
    .prepare(`SELECT id, enabled, webhook_url FROM lark_channels WHERE chat_id = ?`)
    .get(chatId) as { id: number; enabled: number; webhook_url: string | null } | undefined;

  const msgId = `om_mi_${randomBytes(4).toString("hex")}`;
  db.prepare(
    `INSERT INTO market_intel_lark_outbox (finding_id, channel_chat_id, formatted_message, delivered, mock, delivered_at)
     VALUES (?, ?, ?, 1, 1, datetime('now'))`
  ).run(findingId, chatId, message);

  writeAudit(
    { id: null, name: "market-intel-scanner" },
    "MARKET_INTEL_LARK_PUSH",
    "market_intel_finding",
    findingId,
    {
      chat_id: chatId,
      channel_enabled: channel?.enabled ?? 0,
      webhook: channel?.webhook_url,
      mock: true,
      lark_message_id: msgId,
      message_preview: message.slice(0, 240),
    },
    { plane: "vantage" }
  );

  return msgId;
}

function updateIndicatorAndMaybeAlarm(highImpactCount: number, topFindingTitle: string) {
  const db = getDb();
  const raise =
    (
      db.prepare(`SELECT value FROM platform_settings WHERE key='market_intel.raise_indicator_alarms'`).get() as
        | { value: string }
        | undefined
    )?.value !== "false";

  const ind = db
    .prepare(`SELECT * FROM monitor_indicators WHERE monitor_id = ?`)
    .get(INDICATOR_ID) as
    | {
        id: number;
        threshold_warn: number;
        threshold_breach: number;
        name: string;
        paused?: number;
      }
    | undefined;

  if (!ind) return;
  // Paused indicators must not raise alarms or enter AI analysis.
  if (ind.paused) return;

  let status: "HEALTHY" | "WARN" | "BREACH" = "HEALTHY";
  if (highImpactCount >= ind.threshold_breach) status = "BREACH";
  else if (highImpactCount >= ind.threshold_warn) status = "WARN";

  db.prepare(
    `UPDATE monitor_indicators SET last_value = ?, last_checked_at = datetime('now'), status = ? WHERE id = ?`
  ).run(highImpactCount, status, ind.id);

  db.prepare(
    `UPDATE detectors SET last_run_at = datetime('now'), last_status = ?, last_value = ? WHERE monitor_id = ?`
  ).run(status, highImpactCount, INDICATOR_ID);

  if (!raise || status === "HEALTHY") return;

  const recent = db
    .prepare(
      `SELECT id FROM monitor_alerts
       WHERE indicator_id = ? AND status IN ('OPEN','ACKNOWLEDGED','ESCALATED')
         AND created_at >= datetime('now', '-20 minutes')
       ORDER BY id DESC LIMIT 1`
    )
    .get(ind.id) as { id: number } | undefined;

  if (recent) return;

  createAlarmAndAnalyze({
    monitor_id: INDICATOR_ID,
    severity: status,
    title: `Market intel high-impact hits ${status}`,
    message: `${highImpactCount} high-impact market intelligence finding(s) in latest 5m scan. Top: ${topFindingTitle}`,
    observed_value: highImpactCount,
  });
}

export async function runMarketIntelScan(opts: { trigger?: "SCHEDULE" | "MANUAL"; actor?: string } = {}) {
  const db = getDb();
  seedMarketIntel(db);

  const enabled =
    (
      db.prepare(`SELECT value FROM platform_settings WHERE key='market_intel.enabled'`).get() as
        | { value: string }
        | undefined
    )?.value !== "false";
  if (!enabled) {
    return { ok: false, skipped: true, reason: "market_intel.enabled=false" };
  }

  const scanId = newId("MIS");
  const started = new Date().toISOString();
  db.prepare(
    `INSERT INTO market_intel_scans (scan_id, started_at, status, trigger_mode)
     VALUES (?, ?, 'RUNNING', ?)`
  ).run(scanId, started, opts.trigger || "SCHEDULE");

  try {
    const { checked, candidates } = await scrapeCandidates();
  let findingsNew = 0;
  let findingsPushed = 0;
  let highImpact = 0;
  let topTitle = "";

  for (const c of candidates) {
    const fp = fingerprint(c.fingerprint_seed, c.event_title);
    const dup = db.prepare(`SELECT id FROM market_intel_findings WHERE fingerprint = ?`).get(fp);
    if (dup) continue;

    const findingId = newId("MIF");
    const ts = new Date().toISOString();
    const isHigh = c.severity === "WARN" || c.severity === "BREACH" || c.severity === "CRITICAL";
    if (isHigh) {
      highImpact += 1;
      if (!topTitle) topTitle = c.event_title;
    }

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

    const larkMsgId = pushToLark(findingId, message);
    findingsNew += 1;
    findingsPushed += 1;

    db.prepare(
      `INSERT INTO market_intel_findings
       (finding_id, event_title, event_summary, geography, severity, products_json, directions_json,
        sources_json, asset_classes_json, fingerprint, scanned_at, pushed_to_lark, lark_message_id, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, 'PUSHED')`
    ).run(
      findingId,
      c.event_title,
      c.event_summary,
      c.geography,
      c.severity,
      JSON.stringify(c.products),
      JSON.stringify(c.products.map((p) => ({ product: p.product, direction: p.direction }))),
      JSON.stringify(c.source_urls),
      JSON.stringify(c.asset_classes),
      fp,
      ts,
      larkMsgId
    );
  }

  // Indicator reflects high-impact findings in the rolling 5-minute window (not only brand-new rows)
  const windowHit = db
    .prepare(
      `SELECT COUNT(*) AS c,
              (SELECT event_title FROM market_intel_findings
               WHERE severity IN ('WARN','BREACH','CRITICAL')
                 AND scanned_at >= datetime('now', '-5 minutes')
               ORDER BY id DESC LIMIT 1) AS top_title
       FROM market_intel_findings
       WHERE severity IN ('WARN','BREACH','CRITICAL')
         AND scanned_at >= datetime('now', '-5 minutes')`
    )
    .get() as { c: number; top_title: string | null };
  const indicatorHits = windowHit.c || highImpact;
  const indicatorTitle = windowHit.top_title || topTitle || "n/a";
  try {
    updateIndicatorAndMaybeAlarm(indicatorHits, indicatorTitle);
  } catch (alarmErr) {
    console.error("[market-intel] indicator/alarm update failed", alarmErr);
  }

  logSpineEvent({
    stage: "DETECT",
    title: `Market intel scan ${scanId}: ${findingsNew} new / ${indicatorHits} high-impact (5m)`,
    product: "CFD+CRYPTO",
    ref_type: "market_intel_scan",
    ref_id: scanId,
    severity: indicatorHits >= 3 ? "BREACH" : indicatorHits >= 1 ? "WARN" : "INFO",
    detail: { checked, findingsNew, findingsPushed, highImpact, indicatorHits },
    actor: opts.actor || "market-intel-scanner",
  });

  db.prepare(
    `UPDATE market_intel_scans
     SET finished_at = datetime('now'), sources_checked = ?, findings_new = ?, findings_pushed = ?,
         high_impact_count = ?, status = 'COMPLETED', detail_json = ?
     WHERE scan_id = ?`
  ).run(
    checked,
    findingsNew,
    findingsPushed,
    indicatorHits,
    JSON.stringify({ topTitle: indicatorTitle, newHighImpact: highImpact }),
    scanId
  );

  writeAudit(
    { id: null, name: opts.actor || "market-intel-scanner" },
    "MARKET_INTEL_SCAN",
    "market_intel_scan",
    scanId,
    { checked, findingsNew, findingsPushed, highImpact, trigger: opts.trigger || "SCHEDULE" }
  );

    return {
      ok: true,
      scan_id: scanId,
      sources_checked: checked,
      findings_new: findingsNew,
      findings_pushed: findingsPushed,
      high_impact_count: indicatorHits,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[market-intel] scan failed", error);
    try {
      db.prepare(
        `UPDATE market_intel_scans
         SET finished_at = datetime('now'), status = 'FAILED', detail_json = ?
         WHERE scan_id = ?`
      ).run(JSON.stringify({ error: message }), scanId);
    } catch {
      /* ignore */
    }
    return { ok: false, scan_id: scanId, error: message };
  }
}

export function startMarketIntelScheduler() {
  if (global.__crmpMarketIntelStarted) return;
  global.__crmpMarketIntelStarted = true;

  // Kick once shortly after boot, then every 5 minutes
  setTimeout(() => {
    runMarketIntelScan({ trigger: "SCHEDULE" }).catch((e) =>
      console.error("[market-intel] initial scan failed", e)
    );
  }, 8000);

  global.__crmpMarketIntelTimer = setInterval(() => {
    runMarketIntelScan({ trigger: "SCHEDULE" }).catch((e) =>
      console.error("[market-intel] scheduled scan failed", e)
    );
  }, SCAN_INTERVAL_MS);

  if (global.__crmpMarketIntelTimer.unref) {
    global.__crmpMarketIntelTimer.unref();
  }
  console.log("[market-intel] scheduler started (every 5 minutes)");
}

export function listMarketIntelFindings(limit = 50) {
  return getDb()
    .prepare(`SELECT * FROM market_intel_findings ORDER BY id DESC LIMIT ?`)
    .all(limit);
}

export function listMarketIntelScans(limit = 30) {
  return getDb()
    .prepare(`SELECT * FROM market_intel_scans ORDER BY id DESC LIMIT ?`)
    .all(limit);
}

export function listMarketIntelSources() {
  return getDb()
    .prepare(`SELECT * FROM market_intel_sources ORDER BY channel_type, name`)
    .all();
}

export function listMarketIntelOutbox(limit = 40) {
  return getDb()
    .prepare(`SELECT * FROM market_intel_lark_outbox ORDER BY id DESC LIMIT ?`)
    .all(limit);
}
