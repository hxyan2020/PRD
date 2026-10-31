import { NextResponse } from "next/server";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { getDb, writeAudit } from "@/lib/db";
import { runDetectors } from "@/lib/ai/run-detectors";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role_code, "detectors.read")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const detectors = getDb().prepare(`SELECT * FROM detectors ORDER BY product, code`).all();
  const runs = getDb()
    .prepare(
      `SELECT r.*, d.code AS detector_code
       FROM detector_runs r
       JOIN detectors d ON d.id = r.detector_id
       ORDER BY r.id DESC LIMIT 50`
    )
    .all();
  return NextResponse.json({ detectors, runs });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role_code, "detectors.operate")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await req.json().catch(() => ({}));
  if (body.action === "toggle") {
    const prev = getDb()
      .prepare(`SELECT id, code, enabled FROM detectors WHERE id = ?`)
      .get(body.id) as { id: number; code: string; enabled: number } | undefined;
    if (!prev) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const enabled = body.enabled ? 1 : 0;
    getDb().prepare(`UPDATE detectors SET enabled = ? WHERE id = ?`).run(enabled, body.id);
    writeAudit(user, "TOGGLE_DETECTOR", "detector", prev.code, {
      before: { enabled: prev.enabled },
      after: { enabled },
      detector_id: prev.id,
    });
    return NextResponse.json({ ok: true });
  }
  const results = runDetectors({
    raiseAlarms: body.raiseAlarms !== false,
    actor: user.name,
  });
  const analysisIds = results
    .map((r) => r.analysis_id)
    .filter((id): id is number => typeof id === "number" && id > 0);
  const { enrichAnalysesWithLlm } = await import("@/lib/ai/llm-enrich");
  const { getLlmStatus, llmEnrichmentEnabled, openaiKeyConfigured } = await import("@/lib/ai/openai-client");
  const llm_runs = await enrichAnalysesWithLlm(analysisIds);
  const llm = getLlmStatus();
  return NextResponse.json({
    ok: true,
    results,
    llm_runs,
    llm_available: openaiKeyConfigured(),
    llm_enabled: llmEnrichmentEnabled(),
    llm_provider: llm.provider,
    llm_model: llm.model,
    llm_providers: llm.providers,
  });
}
