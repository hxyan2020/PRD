import { NextResponse } from "next/server";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import {
  listMarketIntelFindings,
  listMarketIntelOutbox,
  listMarketIntelScans,
  listMarketIntelSources,
  runMarketIntelScan,
  seedMarketIntel,
} from "@/lib/market-intel/scanner";
import { getDb } from "@/lib/db";

function canView(role: string) {
  return (
    hasPermission(role, "monitor.read") ||
    hasPermission(role, "ai.read") ||
    hasPermission(role, "sources.read")
  );
}

function canOperate(role: string) {
  return (
    hasPermission(role, "monitor.operate") ||
    hasPermission(role, "detectors.operate") ||
    hasPermission(role, "ai.operate")
  );
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user || !canView(user.role_code)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  seedMarketIntel();
  const settings = getDb()
    .prepare(`SELECT key, value, description FROM platform_settings WHERE key LIKE 'market_intel.%' ORDER BY key`)
    .all();
  const indicator = getDb()
    .prepare(`SELECT * FROM monitor_indicators WHERE monitor_id = 'M2-MKT-INTEL'`)
    .get();
  return NextResponse.json({
    sources: listMarketIntelSources(),
    findings: listMarketIntelFindings(80),
    scans: listMarketIntelScans(40),
    outbox: listMarketIntelOutbox(40),
    settings,
    indicator,
  });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || !canOperate(user.role_code)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await req.json().catch(() => ({}));

  if (body.action === "scan_now") {
    const result = await runMarketIntelScan({ trigger: "MANUAL", actor: user.name });
    return NextResponse.json(result);
  }

  if (body.action === "toggle_enabled") {
    const value = body.enabled ? "true" : "false";
    getDb()
      .prepare(
        `INSERT INTO platform_settings (key, value, description) VALUES ('market_intel.enabled', ?, 'Enable 5-minute market intelligence scanner')
         ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')`
      )
      .run(value);
    return NextResponse.json({ ok: true, enabled: body.enabled });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
