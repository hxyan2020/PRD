/**
 * Verify home dummy spine walk: alarm → AI → messenger → close + logs.
 * Run: npx tsx scripts/verify-dummy-spine.ts
 */
import { getDb } from "../src/lib/db";
import { runDummyAlertDemo } from "../src/lib/ai/dummy-spine";
import { phrase, t } from "../src/lib/i18n";

function fail(msg: string): never {
  console.error(`FAIL: ${msg}`);
  process.exit(1);
}

function expect(cond: unknown, msg: string) {
  if (!cond) fail(msg);
}

const zh = "zh-Hant" as const;
expect(t("home.dummyOne", zh) === "虛擬警報", "chrome dummyOne");
expect(t("home.dummyGroup", zh) === "虛擬警報組", "chrome dummyGroup");
expect(t("tracker.dummyRun", zh) === "虛擬演練", "chrome dummyRun");
expect(phrase("DUMMY · Copy concentration breach", zh) === "虛擬 · 跟單集中度違規", "title copy");
expect(phrase("DUMMY · Equity drawdown warn", zh) === "虛擬 · 權益回撤警告", "title eq");
expect(phrase("DUMMY · Margin utilisation CRITICAL", zh) === "虛擬 · 保證金使用率危急", "title mrg");
expect(phrase("Home dummy", zh) === "首頁虛擬演練", "actor Home dummy");
expect(phrase("home-dummy", zh) === "首頁虛擬演練", "actor home-dummy");
expect(phrase("DUMMY_SPINE_RUN", zh) === "虛擬脊柱演練", "audit action");
expect(
  phrase("DUMMY detect M2-COPY-009 → BREACH", zh) === "虛擬偵測 M2-COPY-009 → BREACH",
  "spine detect"
);
expect(
  phrase("DUMMY alarm ALT-1 (M2-COPY-009)", zh) === "虛擬警報 ALT-1（M2-COPY-009）",
  "spine alarm"
);
expect(phrase("DUMMY closed ALT-1", zh) === "虛擬結案 ALT-1", "spine closed");
expect(
  phrase("DUMMY outcome rolled to desk board (ALT-1)", zh) === "虛擬結果已入台面儀表板（ALT-1）",
  "spine board"
);
expect(
  phrase(
    "Home dummy: top signal provider now at 33% of copy equity after a viral strategy share. Walk the full spine to closure.",
    zh
  ).startsWith("首頁虛擬演練"),
  "message copy"
);
expect(
  !phrase("Dummy home run: accepting the AI pack and walking maker/checker through to closure.", zh).includes(
    "Dummy"
  ),
  "chat note no leftover Dummy"
);
expect(phrase("dummy_spine failed", zh) === "虛擬脊柱演練失敗", "api error");

const single = runDummyAlertDemo({ mode: "single", locale: zh });
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

const zhChat = db
  .prepare(
    `SELECT COUNT(*) AS c
     FROM messenger_messages mm
     JOIN messenger_threads mt ON mt.id = mm.thread_id
     WHERE mt.thread_id = ? AND mm.body LIKE ?`
  )
  .get(run.thread_id, "%虛擬首頁演練%") as { c: number };
expect(zhChat.c >= 1, `zh messenger chat ${zhChat.c}`);

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
