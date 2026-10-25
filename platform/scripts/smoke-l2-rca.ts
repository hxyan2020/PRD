/**
 * Smoke: Discovery→L2→RCA prototype present with INC-1028 handoff to AI Incident Workspace.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(__dirname, "..");
const htmlPath = path.join(root, "public/prototypes/monitor2-discovery-l2-rca.html");
assert.ok(fs.existsSync(htmlPath), "prototype HTML missing");
const html = fs.readFileSync(htmlPath, "utf8");

assert.match(html, /crmp-embed/);
assert.match(html, /INC-1028/);
assert.match(html, /\/admin\/ai-incident/);
assert.match(html, /approveL2/);
assert.match(html, /確認聚合/);
assert.match(html, /繁中/);

const pagePath = path.join(root, "src/app/admin/l2-rca/page.tsx");
assert.ok(fs.existsSync(pagePath), "admin page missing");

const agg = fs.readFileSync(path.join(root, "src/components/IndicatorAggregationBoard.tsx"), "utf8");
assert.match(agg, /indicator-agg-open-ai-rca/);

console.log("ok: smoke L2 → AI RCA Lab", {
  htmlBytes: html.length,
  handoff: "/admin/ai-incident",
  incident: "INC-1028",
});
