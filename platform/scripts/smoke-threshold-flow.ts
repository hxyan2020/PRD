/**
 * Smoke: threshold flow stages + X→Y band math for the demo labels.
 */
import assert from "node:assert/strict";
import {
  THRESHOLD_FLOW_LABELS,
  THRESHOLD_FLOW_STAGES,
} from "../src/lib/threshold-flow-shared";

assert.equal(THRESHOLD_FLOW_STAGES.length, 6);
assert.equal(THRESHOLD_FLOW_STAGES[0].id, "OBSERVE");
assert.equal(THRESHOLD_FLOW_STAGES[5].id, "AUDIT");
assert.ok(THRESHOLD_FLOW_LABELS.to_warn < THRESHOLD_FLOW_LABELS.from_warn);
assert.ok(THRESHOLD_FLOW_LABELS.to_breach < THRESHOLD_FLOW_LABELS.from_breach);
assert.match(THRESHOLD_FLOW_LABELS.title_zh, /門檻/);
assert.match(THRESHOLD_FLOW_STAGES[1].zh, /X → Y|如何改進/);

for (const s of THRESHOLD_FLOW_STAGES) {
  assert.ok(s.en.length > 3);
  assert.ok(s.zh.length > 2);
  assert.ok(s.detail_en.length > 10);
  assert.ok(s.detail_zh.length > 6);
}

console.log("ok: smoke threshold flow", {
  stages: THRESHOLD_FLOW_STAGES.map((s) => s.id),
  from: `${THRESHOLD_FLOW_LABELS.from_warn}/${THRESHOLD_FLOW_LABELS.from_breach}`,
  to: `${THRESHOLD_FLOW_LABELS.to_warn}/${THRESHOLD_FLOW_LABELS.to_breach}`,
});
