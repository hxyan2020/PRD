/**
 * Verify messenger POC windows: path hops + relay assignment.
 * Run: npx tsx scripts/verify-poc-windows.ts
 */
import { getDb } from "../src/lib/db";
import {
  buildPocWindows,
  getEscalationPocs,
  getMessengerThread,
  listMessengerThreads,
  messengerAction,
  seedMessengerIfEmpty,
  syncNewAlertsToMessenger,
} from "../src/lib/messenger/demo";

function fail(msg: string): never {
  console.error(`FAIL: ${msg}`);
  process.exit(1);
}

function expect(cond: unknown, msg: string) {
  if (!cond) fail(msg);
}

const path = getEscalationPocs("BREACH", "CREDIT_CLIENT");
expect(path.steps.length >= 2, `path hops ${path.steps.length}`);
expect(path.steps[0].team, "primary team");
expect(path.steps.some((s) => /Risk Owner/i.test(s.team)), "includes Risk Owner");

const fakeMsgs = [
  { kind: "ALERT", meta_json: JSON.stringify({ poc_step: 0 }) },
  { kind: "AI_REPORT", meta_json: JSON.stringify({ poc_step: 0 }) },
  {
    kind: "ESCALATION",
    meta_json: JSON.stringify({ poc_step: 0, step: 1, handoff: "out" }),
  },
  {
    kind: "ESCALATION",
    meta_json: JSON.stringify({ poc_step: 1, step: 1, handoff: "in" }),
  },
];
const windows = buildPocWindows(fakeMsgs, path.steps, 1);
expect(windows[0].status === "relayed", `hop0 ${windows[0].status}`);
expect(windows[1].status === "active", `hop1 ${windows[1].status}`);
expect(windows[0].messages.length >= 3, `hop0 msgs ${windows[0].messages.length}`);
expect(windows[1].messages.length >= 1, `hop1 msgs ${windows[1].messages.length}`);

seedMessengerIfEmpty(getDb());
syncNewAlertsToMessenger(4);
const threads = listMessengerThreads() as Array<{ id: number; status: string }>;
expect(threads.length > 0, "threads exist");
const open = threads.find((t) => t.status === "OPEN") || threads[0];
const before = getMessengerThread(open.id);
expect(before?.poc_windows && before.poc_windows.length >= 2, "poc_windows on thread");
expect(before!.poc_windows[0].messages.length >= 1, "hop0 has alert");

const after1 = messengerAction({
  thread_id: open.id,
  action: "escalate",
  user_name: "Priya Nair",
  locale: "en",
});
if (!after1) fail("after1 null");
expect(after1.current_step >= 1, `step after 1 escalate ${after1.current_step}`);
expect(after1.poc_windows[after1.current_step].status === "active", "live hop after escalate");
expect(
  after1.poc_windows[0].messages.some((m) => String((m as { kind?: string }).kind) === "ESCALATION"),
  "hop0 handoff"
);
expect(
  after1.poc_windows[1].messages.some((m) => String((m as { kind?: string }).kind) === "ESCALATION"),
  "hop1 intake"
);

const after2 = messengerAction({
  thread_id: open.id,
  action: "escalate",
  user_name: "Priya Nair",
  locale: "zh-Hant",
});
if (!after2) fail("after2 null");
expect(after2.current_step >= 2, `step after 2 ${after2.current_step}`);
expect(after2.poc_windows.length >= 3, "still all hops");

console.log(
  JSON.stringify(
    {
      ok: true,
      route: path.route_code,
      hops: after2.poc_windows.map((w) => ({
        step: w.step,
        team: w.team,
        poc: w.poc_name,
        status: w.status,
        n: w.messages.length,
      })),
    },
    null,
    2
  )
);
