/**
 * Prove AI paths call the configured LLM (mocked HTTP) and record thinking trails.
 * Covers ChatGPT (OpenAI), DeepSeek, Gemini, and Claude routing.
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
process.env.DEEPSEEK_API_KEY = "sk-deepseek-smoke";
process.env.GEMINI_API_KEY = "gemini-smoke";
process.env.ANTHROPIC_API_KEY = "claude-smoke";
process.env.CRMP_AI_LLM = "auto";
process.env.OPENAI_MODEL = "gpt-4.1-mini";
process.env.CRMP_LLM_PROVIDER = "openai";

let openaiCalls = 0;
let deepseekCalls = 0;
let geminiCalls = 0;
let claudeCalls = 0;

function mockJsonContent(sys: string, isJson: boolean) {
  if (/challenger/i.test(sys)) {
    return JSON.stringify({
      verdict: "PARTIAL",
      confidence: 0.7,
      summary: "Mock LLM challenger partial agree",
      thinking_steps: ["Mock challenger step A", "Mock challenger step B"],
      critiques: [{ point: "Need feed latency corroboration", severity: "WARN" }],
      improvements: [{ area: "EVIDENCE", recommendation: "Pull LP reject series", priority: "HIGH" }],
      alternative_hypotheses: [{ hypothesis: "Benign burst", rationale: "Session open", confidence: 0.4 }],
    });
  }
  if (isJson) {
    return JSON.stringify({
      summary: "Mock LLM RCA summary grounded on seed evidence",
      thinking_steps: ["Mock RCA load SQLite", "Mock RCA call LLM", "Mock RCA conclude"],
      explanations: [
        {
          hypothesis: "LP reject / quote delay on INC-1028 book",
          likelihood: "HIGH",
          confidence: 0.82,
          rationale: "Mock thinking from seeded monitors",
        },
      ],
      limitations: ["Mock LLM response"],
      assessment: "Mock discovery LIVE assessment on INC-1028",
      possible_root_causes: ["LP quote delay"],
      proposed_risk_scenario: "LP reject cascade",
      proposed_indicator_formula: "rejects / quotes",
      proposed_dimensions: ["LP", "XAUUSD"],
      recommended_validation_steps: ["Check M2-LP-022"],
      priority: "HIGH",
      confidence: "MEDIUM",
    });
  }
  return "Mock desk chat LLM reply with INC-1028 grounding.";
}

const originalFetch = globalThis.fetch;
globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
  const url = String(typeof input === "string" ? input : input instanceof URL ? input.href : input.url);
  const body = JSON.parse(String(init?.body || "{}")) as {
    messages?: Array<{ role: string; content: string }>;
    system?: string;
    response_format?: { type?: string };
    contents?: unknown[];
    generationConfig?: { responseMimeType?: string };
  };

  if (url.includes("api.openai.com")) {
    openaiCalls += 1;
    const isJson = body.response_format?.type === "json_object";
    const sys = body.messages?.find((m) => m.role === "system")?.content || "";
    return new Response(JSON.stringify({ choices: [{ message: { content: mockJsonContent(sys, !!isJson) } }] }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
  if (url.includes("api.deepseek.com")) {
    deepseekCalls += 1;
    const isJson = body.response_format?.type === "json_object";
    const sys = body.messages?.find((m) => m.role === "system")?.content || "";
    return new Response(JSON.stringify({ choices: [{ message: { content: mockJsonContent(sys, !!isJson) } }] }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
  if (url.includes("generativelanguage.googleapis.com")) {
    geminiCalls += 1;
    const isJson = body.generationConfig?.responseMimeType === "application/json";
    const sys = typeof body.system === "string" ? body.system : "";
    // Gemini body uses systemInstruction; approximate from JSON
    const sysFromParts =
      (body as { systemInstruction?: { parts?: Array<{ text?: string }> } }).systemInstruction?.parts?.[0]?.text ||
      sys;
    return new Response(
      JSON.stringify({
        candidates: [{ content: { parts: [{ text: mockJsonContent(sysFromParts, !!isJson || true) }] } }],
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }
  if (url.includes("api.anthropic.com")) {
    claudeCalls += 1;
    const sys = typeof body.system === "string" ? body.system : "";
    const isJson = /JSON/i.test(String((body.messages || [])[0]?.content || "")) || /Return ONLY valid JSON/i.test(sys);
    return new Response(
      JSON.stringify({
        content: [{ type: "text", text: mockJsonContent(sys, true) }],
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
    enrichAnalysesWithLlm,
    analysisHasLiveLlmEvidence,
  } = await import("../src/lib/ai/llm-enrich");
  const {
    analyseDiscoveryCandidate,
    enableDiscoveryOpenAi,
    getDiscoveryAiStatus,
  } = await import("../src/lib/ai/discovery-analyse");
  const { runDiscoveryParallel, listDiscoveryCandidates } = await import("../src/lib/ai/discovery");
  const { FOREX_INCIDENT_1028 } = await import("../src/lib/demo/forex-incident-1028");
  const {
    llmEnrichmentEnabled,
    openaiKeyConfigured,
    listLlmProviders,
    setRuntimeLlmProvider,
    chatCompletionJson,
  } = await import("../src/lib/ai/openai-client");

  getDb();
  assert.equal(openaiKeyConfigured(), true);
  assert.equal(llmEnrichmentEnabled(), true);
  const providers = listLlmProviders();
  assert.equal(providers.filter((p) => p.configured).length, 4);

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

  setRuntimeLlmProvider("openai");
  const llm = await maybeEnrichAnalysisWithLlm(analysis!.id);
  assert.equal(llm.enriched, true);
  assert.ok(llm.source === "LLM_API" || llm.source === "OPENAI_API");
  assert.equal(llm.provider, "openai");
  assert.ok((llm.thinking_steps || []).some((s) => /Mock RCA|LLM-|Call LLM/i.test(s)));
  assert.equal(analysisHasLiveLlmEvidence(analysis!.id), true);

  const challengeLlm = await maybeEnrichChallengeWithLlm(analysis!.id);
  assert.ok(challengeLlm.source === "LLM_API" || challengeLlm.source === "OPENAI_API" || challengeLlm.source === "SKIPPED");
  if (challengeLlm.source === "LLM_API" || challengeLlm.source === "OPENAI_API") {
    assert.ok((challengeLlm.thinking_steps || []).length >= 2);
  }

  assert.ok(openaiCalls > before, "OpenAI fetch must be invoked for RCA enrich");

  // "Analyze open" must enrich reused rows that lack LLM evidence; skip when already live.
  const reuseBefore = openaiCalls;
  const reuse = await enrichAnalysesWithLlm([analysis!.id], 4, { force: false });
  assert.ok(reuse.some((r) => r.source === "SKIPPED"), "already-enriched analysis should skip without force");
  assert.equal(openaiCalls, reuseBefore, "skip must not call the provider again");
  const forced = await enrichAnalysesWithLlm([analysis!.id], 4, { force: true });
  assert.ok(forced.some((r) => r.enriched), "force must call real AI again");
  assert.ok(openaiCalls > reuseBefore, "force enrich must hit the LLM HTTP API");

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
  assert.ok((chat.thinking_steps || []).some((s) => /LLM ok|Call LLM/i.test(s)));
  assert.ok(openaiCalls > chatBefore);

  enableDiscoveryOpenAi("gpt-4.1-mini", "openai");
  assert.equal(getDiscoveryAiStatus().mode, "LIVE_OPENAI");
  assert.equal(getDiscoveryAiStatus().provider, "openai");
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
  assert.ok(suggestion.analysis_source === "LLM_API" || suggestion.analysis_source === "OPENAI_API");
  assert.ok((suggestion.thinking_steps || []).length >= 1);
  assert.ok(openaiCalls > discBefore, "Discovery Analyse must call LLM when LIVE");

  // Provider routing smoke — DeepSeek / Gemini / Claude
  setRuntimeLlmProvider("deepseek");
  const dsBefore = deepseekCalls;
  const ds = await chatCompletionJson({
    system: "You are a test harness.",
    user: JSON.stringify({ ping: true }),
    max_tokens: 200,
    provider: "deepseek",
  });
  assert.equal(ds.ok, true);
  assert.equal(ds.provider, "deepseek");
  assert.ok(deepseekCalls > dsBefore);

  setRuntimeLlmProvider("gemini");
  const gemBefore = geminiCalls;
  const gem = await chatCompletionJson({
    system: "You are a test harness.",
    user: JSON.stringify({ ping: true }),
    max_tokens: 200,
    provider: "gemini",
  });
  assert.equal(gem.ok, true);
  assert.equal(gem.provider, "gemini");
  assert.ok(geminiCalls > gemBefore);

  setRuntimeLlmProvider("claude");
  const clBefore = claudeCalls;
  const cl = await chatCompletionJson({
    system: "You are a test harness.",
    user: JSON.stringify({ ping: true }),
    max_tokens: 200,
    provider: "claude",
  });
  assert.equal(cl.ok, true);
  assert.equal(cl.provider, "claude");
  assert.ok(claudeCalls > clBefore);

  enableDiscoveryOpenAi(undefined, "deepseek");
  assert.equal(getDiscoveryAiStatus().provider, "deepseek");

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
        deepseek_calls: deepseekCalls,
        gemini_calls: geminiCalls,
        claude_calls: claudeCalls,
        analysis_id: analysis!.analysis_id,
        rca_source: llm.source,
        rca_provider: llm.provider,
        challenge_source: challengeLlm.source,
        chat_used_llm: chat.used_llm,
        discovery_source: suggestion.analysis_source,
        llm_evidence_rows: evidence.length,
        providers_configured: providers.filter((p) => p.configured).map((p) => p.id),
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
