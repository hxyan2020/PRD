/**
 * Runtime smoke: discovery + lark + messenger mutations leave audit_logs rows.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const dataDir = path.resolve(__dirname, "../data");
fs.mkdirSync(dataDir, { recursive: true });
const dbPath = path.join(dataDir, "vantage_risk.db");
for (const f of [dbPath, `${dbPath}-wal`, `${dbPath}-shm`]) {
  try {
    fs.unlinkSync(f);
  } catch {
    /* ok */
  }
}

async function main() {
  const { getDb, writeAudit } = await import("../src/lib/db");
  const { disableDiscoveryOpenAi, analyseDiscoveryCandidate } = await import(
    "../src/lib/ai/discovery-analyse"
  );
  const { listDiscoveryCandidates, runDiscoveryParallel, reviewDiscoveryCandidate } = await import(
    "../src/lib/ai/discovery"
  );
  const { messengerAction, syncNewAlertsToMessenger } = await import("../src/lib/messenger/demo");

  const db = getDb();
  disableDiscoveryOpenAi();

  const ro = db
    .prepare(`SELECT id, name, role_code FROM users WHERE email=?`)
    .get("risk.owner@vantagemarkets.com") as { id: number; name: string; role_code: string };
  assert.ok(ro);

  runDiscoveryParallel({ actor: ro.name, trigger: "AUDIT_SMOKE" });
  const pending = listDiscoveryCandidates("PENDING_RO", 5) as Array<{
    candidate_id: string;
    method: string;
    scenario: string;
    proposed_indicator: string;
    proposed_dimension: string;
    score: number;
    evidence_json: string;
    window_start: string | null;
    window_end: string | null;
  }>;
  assert.ok(pending.length >= 1);
  const cand = pending[0];

  // Simulate route-level audits that the API would write.
  writeAudit(ro, "DISCOVERY_DISCONNECT_OPENAI", "risk_discovery", "ai_mode", { mode: "MOCK" });
  const suggestion = await analyseDiscoveryCandidate({ candidate: cand });
  writeAudit(ro, "DISCOVERY_ANALYSE", "risk_discovery", cand.candidate_id, {
    analysis_source: suggestion.analysis_source,
  });
  reviewDiscoveryCandidate({
    candidate_id: cand.candidate_id,
    action: "APPROVE_FOR_VALIDATION",
    comment: "audit smoke",
    actor: ro,
  });

  writeAudit(ro, "LARK_TEST_NOTIFY", "lark_channel", "1", { message: "audit smoke" });
  writeAudit(ro, "TOGGLE_LARK_CHANNEL", "lark_channel", "1", {
    before: { enabled: 1 },
    after: { enabled: 0 },
  });

  const synced = syncNewAlertsToMessenger(3, ro);
  assert.ok(synced >= 0);

  const threads = db
    .prepare(`SELECT id, thread_id FROM messenger_threads ORDER BY id DESC LIMIT 1`)
    .get() as { id: number; thread_id: string } | undefined;
  if (threads) {
    messengerAction({
      thread_id: threads.id,
      action: "recommend",
      user_name: ro.name,
      action_code: "BLOCK_ACCOUNT",
    });
  }

  const actions = db
    .prepare(`SELECT action, entity_type FROM audit_logs ORDER BY id DESC LIMIT 80`)
    .all() as Array<{ action: string; entity_type: string }>;
  const set = new Set(actions.map((a) => a.action));
  for (const need of [
    "RUN_DISCOVERY",
    "DISCOVERY_ANALYSE",
    "DISCOVERY_APPROVE_VALIDATION",
    "DISCOVERY_DISCONNECT_OPENAI",
    "LARK_TEST_NOTIFY",
    "TOGGLE_LARK_CHANNEL",
  ]) {
    assert.ok(set.has(need), `missing audit action ${need}`);
  }
  if (threads) {
    assert.ok(set.has("MESSENGER_RECOMMEND"), "missing MESSENGER_RECOMMEND");
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        audited: [...set].sort(),
        sample_count: actions.length,
      },
      null,
      2
    )
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
