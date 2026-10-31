import { getDb } from "@/lib/db";
import { chatCompletionJson, chatCompletionText, llmEnrichmentEnabled } from "@/lib/ai/openai-client";
import { FOREX_INCIDENT_1028 } from "@/lib/demo/forex-incident-1028";

/**
 * After heuristic RCA, optionally call OpenAI to rewrite the summary/explanations
 * using the same seed evidence. Falls back silently when the key is missing or the call fails.
 */
export async function maybeEnrichAnalysisWithLlm(analysisDbId: number): Promise<{
  enriched: boolean;
  source: "OPENAI_API" | "HEURISTIC" | "SKIPPED";
  error?: string;
}> {
  if (!llmEnrichmentEnabled()) return { enriched: false, source: "SKIPPED" };
  const db = getDb();
  const row = db
    .prepare(
      `SELECT a.*, m.alert_id AS monitor_alert_id, m.title AS alert_title, m.message AS alert_message,
              m.severity, m.observed_value, i.monitor_id, i.name AS indicator_name, i.domain_code, i.product
       FROM ai_analyses a
       JOIN monitor_alerts m ON m.id = a.alert_id
       JOIN monitor_indicators i ON i.id = m.indicator_id
       WHERE a.id = ?`
    )
    .get(analysisDbId) as
    | {
        id: number;
        analysis_id: string;
        mode: string;
        summary: string;
        explanations_json: string;
        confidence: number;
        monitor_alert_id: string;
        alert_title: string;
        alert_message: string;
        severity: string;
        observed_value: number | null;
        monitor_id: string;
        indicator_name: string;
        domain_code: string;
        product: string;
      }
    | undefined;
  if (!row) return { enriched: false, source: "SKIPPED", error: "analysis not found" };

  const evidence = db
    .prepare(
      `SELECT evidence_type, title, excerpt FROM ai_analysis_evidence WHERE analysis_id = ? ORDER BY id LIMIT 8`
    )
    .all(analysisDbId) as Array<{ evidence_type: string; title: string; excerpt: string }>;

  const result = await chatCompletionJson({
    system: `You are the first-line AI RCA engine for a forex CFD broker risk desk (CRMP).
Return JSON only: { "summary": string, "explanations": [ { "hypothesis": string, "likelihood": "HIGH"|"MEDIUM"|"LOW"|"UNKNOWN", "confidence": number, "rationale": string } ], "limitations": string[] }.
Ground every claim in the provided Monitor/RAG evidence. Never invent live LP fills or client P&L.
If the case resembles ${FOREX_INCIDENT_1028.incident_id} (${FOREX_INCIDENT_1028.lp} ${FOREX_INCIDENT_1028.symbol}), prefer that narrative but still respect the supplied evidence.`,
    user: JSON.stringify({
      analysis_id: row.analysis_id,
      mode: row.mode,
      heuristic_summary: row.summary,
      heuristic_explanations: JSON.parse(row.explanations_json || "[]"),
      alert: {
        id: row.monitor_alert_id,
        title: row.alert_title,
        message: row.alert_message,
        severity: row.severity,
        observed_value: row.observed_value,
      },
      indicator: {
        monitor_id: row.monitor_id,
        name: row.indicator_name,
        domain_code: row.domain_code,
        product: row.product,
      },
      evidence,
      canonical_forex_demo: FOREX_INCIDENT_1028,
    }).slice(0, 14000),
    max_tokens: 1600,
  });

  if (!result.ok) return { enriched: false, source: "HEURISTIC", error: result.error };

  try {
    const parsed = JSON.parse(result.content) as {
      summary?: string;
      explanations?: Array<Record<string, unknown>>;
      limitations?: string[];
    };
    const explanations = Array.isArray(parsed.explanations) && parsed.explanations.length
      ? parsed.explanations
      : JSON.parse(row.explanations_json || "[]");
    const summary = String(parsed.summary || row.summary);
    const limitations = Array.isArray(parsed.limitations) ? parsed.limitations : [];
    const confidences = explanations.map((e: Record<string, unknown>) => Number(e.confidence) || 0);
    const confidence = Math.min(0.95, Math.max(row.confidence, ...confidences, 0));

    db.prepare(
      `UPDATE ai_analyses SET summary = ?, explanations_json = ?, confidence = ?, mode = CASE WHEN mode = 'SKILL_MATCH' THEN mode ELSE 'RAG_LLM' END WHERE id = ?`
    ).run(summary, JSON.stringify(explanations), confidence, analysisDbId);

    db.prepare(
      `INSERT INTO ai_analysis_evidence (analysis_id, evidence_type, ref_id, title, excerpt, url, score)
       VALUES (?, 'LLM', ?, ?, ?, NULL, 0.9)`
    ).run(
      analysisDbId,
      result.model,
      `OpenAI enrichment (${result.model})`,
      `latency_ms=${result.latency_ms}; limitations=${limitations.slice(0, 3).join(" | ") || "n/a"}`
    );

    return { enriched: true, source: "OPENAI_API" };
  } catch (err) {
    return {
      enriched: false,
      source: "HEURISTIC",
      error: err instanceof Error ? err.message : "parse failed",
    };
  }
}

export async function maybeAnswerDeskChatWithLlm(input: {
  selection: string;
  question: string;
  pagePath: string;
  locale: "en" | "zh-Hant";
  heuristicReply: string;
  sources: Array<{ title: string; href?: string }>;
}): Promise<{ reply: string; used_llm: boolean; model?: string | null }> {
  if (!llmEnrichmentEnabled()) {
    return { reply: input.heuristicReply, used_llm: false };
  }
  const zh = input.locale === "zh-Hant";
  const result = await chatCompletionText({
    system: zh
      ? `你是 Vantage CRMP 管理後台的值班助理。只用提供的 CRMP 脈絡回答，不可捏造正式交易系統結果。繁體中文作答。提及外匯示範時優先使用 ${FOREX_INCIDENT_1028.incident_id}（${FOREX_INCIDENT_1028.lp}·${FOREX_INCIDENT_1028.symbol}）。`
      : `You are the CRMP Admin desk assistant. Answer only from the provided CRMP context. Never invent production trading outcomes. Prefer the canonical forex demo ${FOREX_INCIDENT_1028.incident_id} (${FOREX_INCIDENT_1028.lp} · ${FOREX_INCIDENT_1028.symbol}) when relevant.`,
    user: JSON.stringify({
      pagePath: input.pagePath,
      selection: input.selection.slice(0, 1200),
      question: input.question.slice(0, 1200),
      grounded_reply: input.heuristicReply.slice(0, 4000),
      sources: input.sources.slice(0, 8),
      forex_demo: {
        id: FOREX_INCIDENT_1028.incident_id,
        monitors: FOREX_INCIDENT_1028.monitors,
        workspace: FOREX_INCIDENT_1028.workspace_path,
      },
    }),
    max_tokens: 700,
  });
  if (!result.ok) return { reply: input.heuristicReply, used_llm: false, model: result.model };
  return { reply: result.content.trim(), used_llm: true, model: result.model };
}
