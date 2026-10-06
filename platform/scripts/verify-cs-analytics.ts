/**
 * CS/TR dashboard + log are separate from Daily Performance / Risk Log.
 * Run: npx tsx scripts/verify-cs-analytics.ts
 */
import fs from "node:fs";
import path from "node:path";
import { getCsDashboard, getCsLog, CS_AUDIT_ACTIONS } from "../src/lib/cs/analytics";
import { ingestCsRequest, resolveRequest } from "../src/lib/cs/desk";

function assert(cond: unknown, msg: string) {
  if (!cond) throw new Error(msg);
}

const dash = getCsDashboard();
assert(dash.summary.total >= 4, `expected seeded total ≥ 4, got ${dash.summary.total}`);
assert(dash.summary.open >= 1, "expected open tickets");
assert(dash.summary.waiting >= 1, "expected WAITING follow-ups on seeded unclear/ID cases");
assert(dash.by_channel.some((b) => b.key === "C1_LIVE_CHAT" && b.count >= 1), "C1 channel bucket");
assert(dash.by_channel.some((b) => b.key === "WEB_FORM"), "form channel bucket");
assert(dash.by_channel.some((b) => b.key === "OFFICIAL_EMAIL"), "email channel bucket");
assert(dash.by_desk.some((b) => b.key === "CS"), "CS desk bucket");
assert(dash.by_desk.some((b) => b.key === "TR") || dash.summary.assigned_tr >= 1, "TR desk or assigned_tr");
assert(dash.by_skill.some((b) => String(b.key).startsWith("SKILL-CS-") || String(b.key).startsWith("SKILL-TR-")), "skill buckets");
assert(dash.waiting.length === dash.summary.waiting, "waiting list matches summary");
assert(dash.recent.length >= 1, "recent rows");

const packed = ingestCsRequest({
  channel: "WEB_FORM",
  client_name: "Dash Verify",
  client_email: "dash.verify@client.example",
  subject: "Swap on XAUUSD overnight confirm rate",
  body: "Hi CS, I held XAUUSD overnight on UID 880299. Can you confirm the swap rate that was charged on 5 Oct and whether weekends are triple? Thanks.",
  locale: "en",
  actor: "verify-cs-analytics",
});
assert(packed?.request.status === "OPEN" || packed?.request.status === "ASSIGNED_TR" || packed?.request.status === "AI_REPLIED", `clear ingest status ${packed?.request.status}`);
resolveRequest(packed!.request.id, "verify-cs-analytics", "en");

const after = getCsDashboard();
assert(after.summary.resolved >= dash.summary.resolved + 1, "resolve increments dashboard resolved");
assert(after.summary.total >= dash.summary.total + 1, "ingest increments total");

const log = getCsLog();
assert(log.events.length >= 1, "CS log has CS_* audit events");
assert(
  log.events.some((e) => e.action === "CS_INTAKE"),
  "CS_INTAKE on the CS log"
);
assert(
  log.events.some((e) => e.action === "CS_RESOLVE"),
  "CS_RESOLVE on the CS log"
);
assert(
  log.resolved.some((r) => r.request_id === packed!.request.request_id),
  "resolved pack on CS log"
);
assert(CS_AUDIT_ACTIONS.includes("CS_INTAKE_CONTINUE"), "continue action listed");

const root = path.resolve(__dirname, "..");
const nav = fs.readFileSync(path.join(root, "src/lib/nav.ts"), "utf8");
assert(nav.includes('href: "/admin/cs-dashboard"'), "nav dashboard");
assert(nav.includes('href: "/admin/cs-log"'), "nav log");
assert(!nav.includes('href: "/admin/cs-dashboard"') || nav.indexOf("/admin/cs-dashboard") > nav.indexOf("/admin/cs-desk"), "dashboard after desk");

const dashPage = fs.readFileSync(path.join(root, "src/app/admin/cs-dashboard/page.tsx"), "utf8");
assert(dashPage.includes("getCsDashboard"), "dashboard page uses analytics");
assert(dashPage.includes("cs.read"), "dashboard auth");

const logPage = fs.readFileSync(path.join(root, "src/app/admin/cs-log/page.tsx"), "utf8");
assert(logPage.includes("getCsLog"), "log page uses analytics");

const api = fs.readFileSync(path.join(root, "src/app/api/cs/route.ts"), "utf8");
assert(api.includes('view === "dashboard"') || api.includes('view=dashboard') || api.includes('"dashboard"'), "API dashboard view");
assert(api.includes('"log"'), "API log view");

const i18n = fs.readFileSync(path.join(root, "src/lib/i18n.ts"), "utf8");
assert(i18n.includes('"cs-dashboard"'), "i18n page meta dashboard");
assert(i18n.includes('"cs-log"'), "i18n page meta log");
assert(i18n.includes("/admin/cs-dashboard"), "i18n nav dashboard");
assert(i18n.includes("/admin/cs-log"), "i18n nav log");

console.log("verify-cs-analytics: ok");
console.log(
  JSON.stringify(
    {
      total: after.summary.total,
      open: after.summary.open,
      resolved: after.summary.resolved,
      waiting: after.summary.waiting,
      events: log.events.length,
      resolvedPacks: log.resolved.length,
    },
    null,
    2
  )
);
