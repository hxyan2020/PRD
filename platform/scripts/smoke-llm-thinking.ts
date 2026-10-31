/**
 * Prove AI paths call OpenAI (mocked) and record thinking trails.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const dataDir = path.resolve(__dirname, "../data");
fs.mkdirSync(dataDir, { recursive: true });
const dbPath = path.join(dataDir, "vantage_risk_llm_smoke.db");
for (const f of [dbPath, `${dbPath}-wal`, `${dbPath}-shm`]) {
  try {
    fs.unlinkSync(f);
  } catch {
    /* ok */
  }
}
process.env.CRMP_DB_PATH = dbPath;
process.env.OPENAI_API_KEY = "sk-test-smoke-not-real";
process.env.CRMP_AI_LLM = "auto";
process.env.OPENAI_MODEL = "gpt-4.1-mini";

let openaiCalls = 0;

const originalFetch = globalThis.fetch;
globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
  const url = String(typeof input === "string" ? input : input instanceof URL ? input.href : input.url);
  if (url.includes("api.openai.com")) {
    openaiCalls += 1;
    const body = JSON.parse(String(init?.body || "{}")) as {
      messages?: Array<{ role: string; content: string }>;
      response_format?: { type?: string };
    };
    const isJson = body.response_format?.type === "json_object";
    const sys = body.messages?.find((m) => m.role === "system")?.content || "";
    let content: string;
    if (/challenger/i.test(sys)) {
      content = JSON.stringify({
        verdict: "PARTIAL",
        confidence: 0.7,
        summary: "Mock LLM challenger partial agree",
        thinking_steps: ["Mock challenger step A", "Mock challenger step B"],
        critiques: [{ point: "Need feed latency corroboration", severity: "WARN" }],
        improvements: [{ area: "EVIDENCE", recommendation: "Pull LP reject series", priority: "HIGH" }],
        alternative_hypotheses: [{ hypothesis: "Benign burst", rationale: "Session open", confidence: 0.4 }],
      });
    } else if (isJson) {
      content = JSON.stringify({
        summary: "Mock LLM RCA summary grounded on seed evidence",
        thinking_steps: ["Mock RCA load SQLite", "Mock RCA call OpenAI", "Mock RCA conclude"],
        explanations: [
          {
            hypothesis: "LP reject / quote delay on INC-1028 book",
            likelihood: "HIGH",
            confidence: 0.82,
            rationale: "Mock thinking from seeded monitors",
          },
        ],
        limitations: ["Mock OpenAI response"],
      });
    } else {
      content = "Mock desk chat LLM reply with INC-1028 grounding.";
    }
    return new Response(
      JSON.stringify({
        choices: [{ message: { content } }],
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }
  return originalFetch(input, init);
}) as typeof fetch;

async function main() {
  const { getDb } = await import("../src/lib/db");
  const { createAlarmAndAnalyze } = await import("../src/lib/ai/analyze");
  const {
    maybeEnrichAnalysisWithLlm,
    maybeEnrichChallengeWithLlm,
    maybeAnswerDeskChatWithLlm,
  } = await import("../src/lib/ai/llm-enrich");
  const {
    analyseDiscoveryCandidate,
    enableDiscoveryOpenAi,
    getDiscoveryAiStatus,
  } = await import("../src/lib/ai/discovery-analyse");
  const { runDiscoveryParallel, listDiscoveryCandidates } = await import("../src/lib/ai/discovery");
  const { FOREX_INCIDENT_1028 } = await import("../src/lib/demo/forex-incident-1028");
  const { llmEnrichmentEnabled, openaiKeyConfigured } = await import("../src/lib/ai/openai-client");

  getDb();
  assert.equal(openaiKeyConfigured(), true);
  assert.equal(llmEnrichmentEnabled(), true);

  const before = openaiCalls;
  const bundle = createAlarmAndAnalyze({
    monitor_id: FOREX_INCIDENT_1028.primary_monitor_id,
    severity: "BREACH",
    title: "LLM smoke · INC-1028",
    message: "Smoke LLM thinking on forex pack",
    observed_value: 5.2,
  });
  const analysis = bundle.analysis as { id: number; analysis_id: string } | undefined;
  assert.ok(analysis?.id);

  const llm = await maybeEnrichAnalysisWithLlm(analysis!.id);
  assert.equal(llm.enriched, true);
  assert.equal(llm.source, "OPENAI_API");
  assert.ok((llm.thinking_steps || []).some((s) => /Mock RCA|OpenAI|LLM-/i.test(s)));

  const challengeLlm = await maybeEnrichChallengeWithLlm(analysis!.id);
  // BREACH should have challenger row from analyzeAlert
  assert.ok(challengeLlm.source === "OPENAI_API" || challengeLlm.source === "SKIPPED");
  if (challengeLlm.source === "OPENAI_API") {
    assert.ok((challengeLlm.thinking_steps || []).length >= 2);
  }

  assert.ok(openaiCalls > before, "OpenAI fetch must be invoked for RCA enrich");

  const chatBefore = openaiCalls;
  const chat = await maybeAnswerDeskChatWithLlm({
    selection: "INC-1028 LP quote delay",
    question: "What should Pricing check?",
    pagePath: "/admin/alerts",
    locale: "en",
    heuristicReply: "Heuristic: check M2-LP-022 and M2-FEED-003.",
    sources: [{ title: "Open Alerts", href: "/admin/alerts" }],
  });
  assert.equal(chat.used_llm, true);
  assert.match(chat.reply, /Mock desk chat/);
  assert.ok((chat.thinking_steps || []).some((s) => /OpenAI ok|Call OpenAI/i.test(s)));
  assert.ok(openaiCalls > chatBefore);

  enableDiscoveryOpenAi("gpt-4.1-mini");
  assert.equal(getDiscoveryAiStatus().mode, "LIVE_OPENAI");
  const scan = runDiscoveryParallel({ actor: "llm-smoke", trigger: "SMOKE" });
  assert.ok((scan.candidates_new ?? 0) >= 1 || listDiscoveryCandidates("PENDING_RO", 5).length >= 1);
  const pending = listDiscoveryCandidates("PENDING_RO", 5) as Array<{
    candidate_id: string;
    method: string;
    scenario: string;
    proposed_indicator: string;
    proposed_dimension: string;
    score: number;
    evidence_json: string;
  }>;
  assert.ok(pending[0]);
  const discBefore = openaiCalls;
  const suggestion = await analyseDiscoveryCandidate({ candidate: pending[0] });
  assert.equal(suggestion.analysis_source, "OPENAI_API");
  assert.ok((suggestion.thinking_steps || []).length >= 1);
  assert.ok(openaiCalls > discBefore, "Discovery Analyse must call OpenAI when LIVE");

  const evidence = getDb()
    .prepare(
      `SELECT evidence_type, title, excerpt FROM ai_analysis_evidence WHERE analysis_id = ? AND evidence_type = 'LLM'`
    )
    .all(analysis!.id) as Array<{ evidence_type: string; title: string; excerpt: string }>;
  assert.ok(evidence.length >= 1, "LLM evidence rows must be persisted");

  console.log(
    JSON.stringify(
      {
        ok: true,
        openai_calls: openaiCalls,
        analysis_id: analysis!.analysis_id,
        rca_source: llm.source,
        challenge_source: challengeLlm.source,
        chat_used_llm: chat.used_llm,
        discovery_source: suggestion.analysis_source,
        llm_evidence_rows: evidence.length,
      },
      null,
      2
    )
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => {
    globalThis.fetch = originalFetch;
  });
