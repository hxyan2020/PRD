/**
 * Verify home dummy spine walk: alarm → AI → messenger → close + logs.
 * Run: npx tsx scripts/verify-dummy-spine.ts
 */
import { getDb } from "../src/lib/db";
import { runDummyAlertDemo } from "../src/lib/ai/dummy-spine";

function fail(msg: string): never {
  console.error(`FAIL: ${msg}`);
  process.exit(1);
}

function expect(cond: unknown, msg: string) {
  if (!cond) fail(msg);
}

const single = runDummyAlertDemo({ mode: "single" });
expect(single.ok, "single ok");
expect(single.runs.length === 1, `single run count ${single.runs.length}`);
const run = single.runs[0];
expect(run.closed, "single closed");
expect(run.alert_id, "single alert_id");
expect(run.analysis_id, "single analysis");
expect(run.thread_id, "single messenger thread");
expect(run.stages.includes("DETECT"), "DETECT");
expect(run.stages.includes("ALARM"), "ALARM");
expect(run.stages.includes("AI_RCA"), "AI_RCA");
expect(run.stages.includes("RESOLVED"), "RESOLVED");
expect(run.stages.includes("DASHBOARD"), "DASHBOARD");

const db = getDb();
const alert = db
  .prepare(`SELECT status FROM monitor_alerts WHERE alert_id = ?`)
  .get(run.alert_id) as { status: string } | undefined;
expect(alert?.status === "CLOSED", `alert status ${alert?.status}`);

const ticket = db
  .prepare(`SELECT status FROM monitor_tickets WHERE ticket_id = ?`)
  .get(run.ticket_id) as { status: string } | undefined;
expect(ticket?.status === "RESOLVED", `ticket status ${ticket?.status}`);

const thread = db
  .prepare(`SELECT status FROM messenger_threads WHERE thread_id = ?`)
  .get(run.thread_id) as { status: string } | undefined;
expect(thread?.status === "CLOSED", `thread status ${thread?.status}`);

const spine = db
  .prepare(`SELECT COUNT(*) AS c FROM spine_events WHERE ref_id = ?`)
  .get(run.alert_id) as { c: number };
expect(spine.c >= 2, `spine events ${spine.c}`);

const audit = db
  .prepare(`SELECT COUNT(*) AS c FROM audit_logs WHERE action = 'DUMMY_SPINE_RUN' AND entity_id = ?`)
  .get(run.alert_id) as { c: number };
expect(audit.c >= 1, `audit DUMMY_SPINE_RUN ${audit.c}`);

const group = runDummyAlertDemo({ mode: "group" });
expect(group.runs.length === 3, `group count ${group.runs.length} errors=${group.errors.join("; ")}`);
expect(
  group.runs.every((r) => r.closed && r.alert_id && r.thread_id),
  "group all closed with threads"
);

console.log(
  JSON.stringify(
    {
      ok: true,
      single: { alert_id: run.alert_id, mode: run.analysis_mode, stages: run.stages },
      group: group.runs.map((r) => ({ alert_id: r.alert_id, key: r.key, mode: r.analysis_mode })),
    },
    null,
    2
  )
);
