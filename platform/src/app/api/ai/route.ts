import { NextResponse } from "next/server";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { analyzeAlert, analyzeOpenAlerts, createAlarmAndAnalyze, getAnalysisBundle } from "@/lib/ai/analyze";
import { maybeEnrichAnalysisWithLlm, maybeEnrichChallengeWithLlm } from "@/lib/ai/llm-enrich";
import { backfillChallenges } from "@/lib/ai/challenger";
import { runDummyAlertDemo } from "@/lib/ai/dummy-spine";
import { getUiLocale } from "@/lib/i18n-server";
import { getLlmStatus, llmEnrichmentEnabled, openaiKeyConfigured } from "@/lib/ai/openai-client";

function llmMeta() {
  const status = getLlmStatus();
  return {
    llm_available: openaiKeyConfigured(),
    llm_enabled: llmEnrichmentEnabled(),
    llm_provider: status.provider,
    llm_model: status.model,
    llm_providers: status.providers,
  };
}

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
        { error: "Indicator paused — resume it on Monitor 2.0 before AI analysis" },
        { status: 409 }
      );
    }
    const analysisRow = bundle.analysis as { id?: number } | null | undefined;
    let llm: Awaited<ReturnType<typeof maybeEnrichAnalysisWithLlm>> = {
      enriched: false,
      source: "SKIPPED",
    };
    let challengeLlm: Awaited<ReturnType<typeof maybeEnrichChallengeWithLlm>> | null = null;
    if (analysisRow?.id) {
      llm = await maybeEnrichAnalysisWithLlm(Number(analysisRow.id));
      challengeLlm = await maybeEnrichChallengeWithLlm(Number(analysisRow.id));
    }
    const refreshed = analysisRow?.id ? getAnalysisBundle(Number(analysisRow.id)) : bundle;
    return NextResponse.json({
      ok: true,
      ...refreshed,
      llm,
      challenge_llm: challengeLlm,
      thinking_steps: [...(llm.thinking_steps || []), ...(challengeLlm?.thinking_steps || [])],
      ...llmMeta(),
    });
  }

  if (body.action === "analyze_open") {
    const results = analyzeOpenAlerts({ force: !!body.force });
    const created = results.filter((r) => r.created);
    const llmRuns = [];
    for (const r of created.slice(0, 8)) {
      llmRuns.push(await maybeEnrichAnalysisWithLlm(r.analysis_db_id));
      llmRuns.push(await maybeEnrichChallengeWithLlm(r.analysis_db_id));
    }
    return NextResponse.json({
      ok: true,
      count: results.length,
      created: created.length,
      reused: results.length - created.length,
      results,
      llm_runs: llmRuns,
      ...llmMeta(),
    });
  }

  if (body.action === "simulate_alarm") {
    try {
      const bundle = createAlarmAndAnalyze({
        monitor_id: body.monitor_id,
        severity: body.severity || "BREACH",
        title: body.title || `Simulated alarm on ${body.monitor_id}`,
        message: body.message || "Simulated Monitor 2.0 alarm for AI pipeline demo",
        observed_value: Number(body.observed_value ?? 0),
        prefer_rag: !!body.prefer_rag,
      });
      const analysisRow = bundle.analysis as
        | {
            id?: number;
            analysis_id?: string;
            mode?: string;
            confidence?: number;
            status?: string;
            needs_human?: number;
          }
        | null
        | undefined;
      let llmSim: Awaited<ReturnType<typeof maybeEnrichAnalysisWithLlm>> | null = null;
      let challengeLlmSim: Awaited<ReturnType<typeof maybeEnrichChallengeWithLlm>> | null = null;
      if (analysisRow?.id) {
        llmSim = await maybeEnrichAnalysisWithLlm(Number(analysisRow.id));
        challengeLlmSim = await maybeEnrichChallengeWithLlm(Number(analysisRow.id));
      }
      const refreshed = analysisRow?.id
        ? getAnalysisBundle(Number(analysisRow.id))
        : bundle;
      const analysis = (refreshed.analysis || analysisRow) as
        | {
            id?: number;
            analysis_id?: string;
            mode?: string;
            confidence?: number;
            status?: string;
            needs_human?: number;
          }
        | null
        | undefined;
      const challenge = refreshed.challenge as { challenge_id?: string; verdict?: string } | null;
      const improvement = refreshed.improvement as {
        review_id?: string;
        status?: string;
        items?: unknown[];
      } | null;
      // Keep simulate responses light so the UI stays responsive after improvement packs.
      return NextResponse.json({
        ok: true,
        monitor_alert_id: bundle.monitor_alert_id,
        analysis: analysis
          ? {
              id: analysis.id,
              analysis_id: analysis.analysis_id,
              mode: analysis.mode,
              confidence: analysis.confidence,
              status: analysis.status,
              needs_human: analysis.needs_human,
            }
          : null,
        challenge: challenge
          ? {
              challenge_id: challenge.challenge_id,
              verdict: challenge.verdict,
            }
          : null,
        improvement: improvement
          ? {
              review_id: improvement.review_id,
              status: improvement.status,
              item_count: Array.isArray(improvement.items) ? improvement.items.length : 0,
            }
          : null,
        llm: llmSim,
        challenge_llm: challengeLlmSim,
        thinking_steps: [...(llmSim?.thinking_steps || []), ...(challengeLlmSim?.thinking_steps || [])],
        ...llmMeta(),
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "simulate_alarm failed";
      const paused = /paused/i.test(msg);
      return NextResponse.json({ error: msg }, { status: paused ? 409 : 400 });
    }
  }

  if (body.action === "dummy_spine") {
    try {
      const locale = await getUiLocale();
      const result = await runDummyAlertDemo({
        mode: body.mode === "group" ? "group" : "single",
        locale,
      });
      return NextResponse.json({
        ok: true,
        mode: result.mode,
        highlight_stages: result.highlight_stages,
        errors: result.errors,
        ...llmMeta(),
        runs: result.runs.map((r) => ({
          key: r.key,
          alert_id: r.alert_id,
          ticket_id: r.ticket_id,
          analysis_id: r.analysis_id,
          analysis_mode: r.analysis_mode,
          thread_id: r.thread_id,
          action_code: r.action_code,
          stages: r.stages,
          closed: r.closed,
        })),
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "dummy_spine failed";
      const paused = /paused/i.test(msg);
      return NextResponse.json({ error: msg }, { status: paused ? 409 : 400 });
    }
  }

  if (body.action === "backfill_challenges") {
    const results = backfillChallenges(Number(body.limit ?? 40));
    return NextResponse.json({
      ok: true,
      count: results.length,
      results: results.map((r) => ({
        challenge_id: r?.challenge_id ?? null,
        verdict: r?.verdict ?? null,
      })),
    });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
