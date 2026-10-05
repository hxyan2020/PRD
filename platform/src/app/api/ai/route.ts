import { NextResponse } from "next/server";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { analyzeAlert, analyzeOpenAlerts, createAlarmAndAnalyze, getAnalysisBundle } from "@/lib/ai/analyze";
import { backfillChallenges } from "@/lib/ai/challenger";

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role_code, "ai.read")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (id) {
    const bundle = getAnalysisBundle(Number(id));
    if (!bundle.analysis) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(bundle);
  }

  const analyses = getDb()
    .prepare(
      `SELECT a.*, m.alert_id AS monitor_alert_id, m.title AS alert_title, m.severity,
              s.code AS skill_code
       FROM ai_analyses a
       JOIN monitor_alerts m ON m.id = a.alert_id
       LEFT JOIN ai_skills s ON s.id = a.skill_id
       ORDER BY a.id DESC
       LIMIT 100`
    )
    .all();
  return NextResponse.json({ analyses });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role_code, "ai.operate")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await req.json();

  if (body.action === "analyze_alert") {
    const bundle = analyzeAlert(Number(body.alert_id), { force: !!body.force });
    if (!bundle) {
      return NextResponse.json(
        { error: "Indicator paused — resume it on Monitor 2.0 or force analysis" },
        { status: 409 }
      );
    }
    return NextResponse.json({ ok: true, ...bundle });
  }

  if (body.action === "analyze_open") {
    const results = analyzeOpenAlerts({ force: !!body.force });
    return NextResponse.json({ ok: true, count: results.length, results });
  }

  if (body.action === "simulate_alarm") {
    const bundle = createAlarmAndAnalyze({
      monitor_id: body.monitor_id,
      severity: body.severity || "BREACH",
      title: body.title || `Simulated alarm on ${body.monitor_id}`,
      message: body.message || "Simulated Monitor 2.0 alarm for AI pipeline demo",
      observed_value: Number(body.observed_value ?? 0),
    });
    return NextResponse.json({ ok: true, ...bundle });
  }

  if (body.action === "backfill_challenges") {
    const results = backfillChallenges(Number(body.limit ?? 40));
    return NextResponse.json({ ok: true, count: results.length, results });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
