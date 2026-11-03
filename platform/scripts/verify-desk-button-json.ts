/**
 * Guardrails: desk buttons must not bare-parse HTML 404/405 as JSON on Pages.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { runClientAggregationAction } from "../src/lib/indicator-aggregation-client";
import type { AggregateDefinition, AggregationSession } from "../src/lib/indicator-aggregation-shared";
import { isApiUnavailableStatus, readResponseJson } from "../src/lib/fetch-json";

const root = path.resolve(__dirname, "..");

function read(rel: string) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

const fetchJson = read("src/lib/fetch-json.ts");
assert.match(fetchJson, /export async function readResponseJson/);
assert.match(fetchJson, /export async function postDeskJson/);
assert.match(fetchJson, /isPublicSnapshot/);
assert.match(fetchJson, /pagesReadOnlyHint/);
assert.match(fetchJson, /pagesMutationHint/);
assert.match(fetchJson, /nonJson/);
assert.match(fetchJson, /apiUnavailable/);

const clientAgg = read("src/lib/indicator-aggregation-client.ts");
assert.match(clientAgg, /export function runClientAggregationAction/);
assert.match(clientAgg, /clientStartAggregation/);
assert.match(clientAgg, /clientForceAggregate/);
assert.match(clientAgg, /clientContinuePostFlow/);

const board = read("src/components/IndicatorAggregationBoard.tsx");
assert.match(board, /runClientAggregationAction/);
assert.match(board, /postDeskJson/);
assert.match(board, /isPublicSnapshot/);
assert.match(board, /pagesMutationHint/);
assert.doesNotMatch(board, /await res\.json\(\)/);

const hardened = [
  "src/components/MonitorActions.tsx",
  "src/components/MonitorEngineActions.tsx",
  "src/components/DailyDashboardView.tsx",
  "src/components/AiAnalysesBoard.tsx",
  "src/components/HomeDummyAlertButtons.tsx",
  "src/components/AlertTrackerBoard.tsx",
  "src/components/DiscoverySuggestionBoard.tsx",
  "src/components/DetectorsBoard.tsx",
  "src/components/AuditBoard.tsx",
  "src/components/EscalationManager.tsx",
  "src/components/SeverityFormulaBoard.tsx",
  "src/components/LarkManager.tsx",
  "src/components/BuTeamsBoard.tsx",
  "src/components/RolesEditorBoard.tsx",
  "src/components/AiAdminConsole.tsx",
  "src/components/DemoMessenger.tsx",
  "src/components/SelectionChatbot.tsx",
  "src/components/AiImprovementPanel.tsx",
  "src/components/IndicatorThresholdEditor.tsx",
  "src/components/AlertsBoard.tsx",
  "src/components/UsersManager.tsx",
  "src/components/DataSourcesManager.tsx",
  "src/components/RagManager.tsx",
];

for (const rel of hardened) {
  const src = read(rel);
  assert.match(src, /postDeskJson|readResponseJson/, `${rel} missing safe JSON helper`);
}

const defs: AggregateDefinition[] = [
  {
    code: "CHAIN-DEMO",
    name: "Demo chain",
    name_zh: "示範鏈",
    description: "demo",
    description_zh: "示範",
    domain: "LP_HEDGE",
    product: "CFD",
    severity: "BREACH",
    member_monitors: ["M2-LP-022", "M2-FEED-003"],
    window_minutes: 30,
    linked_skills: ["SKILL-LP-REJECT-STORM"],
    sequence: [
      { t_minutes: 0, monitor_id: "M2-LP-022", severity: "BREACH", signal: "reject" },
      { t_minutes: 5, monitor_id: "M2-FEED-003", severity: "WARN", signal: "stale" },
    ],
  },
];

let sessions: AggregationSession[] = [];
const started = runClientAggregationAction("start", sessions, defs, {
  trigger_monitor: "M2-LP-022",
  trigger_severity: "BREACH",
});
sessions = started.sessions;
assert.equal(started.session.step, "CORRELATED_WAIT");
assert.equal(started.session.outcome, "PENDING");

const injected = runClientAggregationAction("inject_related", sessions, defs, {
  session_id: started.session.session_id,
  related_monitor: "M2-FEED-003",
  severity: "WARN",
});
assert.equal(injected.session.outcome, "AGGREGATED");
assert.ok(injected.session.l2_severity);

const orphan = runClientAggregationAction("start", [], defs, {
  trigger_monitor: "M2-ORPHAN-999",
  trigger_severity: "WARN",
});
assert.equal(orphan.session.outcome, "SINGLE_NO_MEMBERSHIP");

const waiting = runClientAggregationAction("start", [], defs, {
  trigger_monitor: "M2-LP-022",
  trigger_severity: "BREACH",
});
const forced = runClientAggregationAction("force_aggregate", waiting.sessions, defs, {
  session_id: waiting.session.session_id,
  reason: "verify",
});
assert.equal(forced.session.outcome, "FORCE_AGGREGATED");

const continued = runClientAggregationAction("continue_post_flow", forced.sessions, defs, {
  session_id: forced.session.session_id,
});
assert.ok((continued.session.post_flow || []).length > 0);

const timed = runClientAggregationAction("start", [], defs, {
  trigger_monitor: "M2-LP-022",
  trigger_severity: "BREACH",
});
const closed = runClientAggregationAction("close_window", timed.sessions, defs, {
  session_id: timed.session.session_id,
});
assert.equal(closed.session.outcome, "SINGLE_WINDOW_TIMEOUT");

assert.equal(isApiUnavailableStatus(405), true);
assert.equal(isApiUnavailableStatus(200), false);

const htmlRes = new Response("<html><head></head><body>Method Not Allowed</body></html>", {
  status: 405,
  headers: { "content-type": "text/html" },
});
const jsonRes = new Response(JSON.stringify({ ok: true, message: "hi" }), {
  status: 200,
  headers: { "content-type": "application/json" },
});

readResponseJson(htmlRes)
  .then((parsed) => {
    assert.equal(parsed.nonJson, true);
    assert.equal(parsed.apiUnavailable, true);
    assert.equal(parsed.ok, false);
    assert.deepEqual(parsed.data, {});
    return readResponseJson<{ message?: string }>(jsonRes);
  })
  .then((ok) => {
    assert.equal(ok.nonJson, false);
    assert.equal(ok.ok, true);
    assert.equal(ok.data.message, "hi");
    console.log("ok: desk button JSON hardening + client aggregation");
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
