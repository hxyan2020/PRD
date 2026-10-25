/**
 * Smoke: seed INC-1028 messenger thread + workspace prototype HTML present.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { getDb } from "../src/lib/db";
import { ensureInc1028MessengerThread, ensureMessengerDemoMessages } from "../src/lib/messenger/demo";

const root = path.resolve(__dirname, "..");
const htmlPath = path.join(root, "public/prototypes/monitor2-ai-report.html");
assert.ok(fs.existsSync(htmlPath), "prototype HTML missing");
const html = fs.readFileSync(htmlPath, "utf8");
assert.match(html, /INC-1028/);
assert.match(html, /evidenceCatalog/);

const db = getDb();
ensureMessengerDemoMessages(db);
ensureInc1028MessengerThread(db);

const thread = db
  .prepare(
    `SELECT thread_id, title, severity, status FROM messenger_threads WHERE thread_id = 'THR-INC-1028' OR title LIKE '%INC-1028%' LIMIT 1`
  )
  .get() as { thread_id: string; title: string; severity: string; status: string } | undefined;
assert.ok(thread, "INC-1028 thread not seeded");
assert.equal(thread.status, "OPEN");

const report = db
  .prepare(
    `SELECT body, meta_json FROM messenger_messages
     WHERE thread_id = (SELECT id FROM messenger_threads WHERE thread_id = ?)
       AND kind = 'AI_REPORT' LIMIT 1`
  )
  .get(thread.thread_id) as { body: string; meta_json: string } | undefined;
assert.ok(report, "INC-1028 AI_REPORT missing");
assert.match(report.body, /INC-1028|ai-incident/i);
const meta = JSON.parse(report.meta_json || "{}") as {
  workspace_url?: string;
  monitor_links?: Array<{ id: string; href: string }>;
};
assert.equal(meta.workspace_url, "/admin/ai-incident");
assert.ok(
  (meta.monitor_links || []).some((l) => l.id === "ai_incident" && l.href === "/admin/ai-incident"),
  "ai_incident deep link missing"
);

console.log("ok: smoke AI Incident Workspace", {
  thread: thread.thread_id,
  title: thread.title,
  links: (meta.monitor_links || []).map((l) => l.id),
});
