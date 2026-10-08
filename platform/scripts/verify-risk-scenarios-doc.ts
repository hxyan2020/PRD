import { SKILL_SCENARIOS, LINKED_SCENARIOS } from "../src/lib/ai/risk-scenarios-catalog";
import { CORRELATION_SCENARIOS } from "../src/lib/docs/risk-scenario-correlations";
import {
  allRiskScenarioRows,
  riskScenarioRowsForEdition,
  riskScenarioSummary,
} from "../src/lib/docs/risk-scenario-rows";
import { PLATFORM_URLS } from "../src/lib/docs/urls";
import { NAV_ITEMS } from "../src/lib/nav";

function assert(cond: unknown, msg: string) {
  if (!cond) {
    console.error("FAIL:", msg);
    process.exitCode = 1;
  } else {
    console.log("ok:", msg);
  }
}

const rows = allRiskScenarioRows();
assert(rows.length >= SKILL_SCENARIOS.length + LINKED_SCENARIOS.length, "rows cover skills + chains");

for (const s of SKILL_SCENARIOS) {
  const row = rows.find((r) => r.id === s.code);
  assert(!!row, `skill row ${s.code}`);
  if (!row) continue;
  assert(row.indicators[0] === s.indicator.monitor_id, `${s.code} primary indicator`);
  assert(!!row.warn && !!row.breach, `${s.code} has warn/breach`);
  assert(!!row.frequency_en && !!row.frequency_zh, `${s.code} bilingual frequency`);
  assert(!!row.name_zh && !!row.description_zh, `${s.code} bilingual name/description`);
  assert(
    ["P0", "P1", "P2", "P3"].includes(row.severity) && row.escalation_en.length > 0,
    `${s.code} severity + escalation`
  );
  assert(row.investigation_en.length > 0 && row.solution_en.length > 0, `${s.code} investigation + solution`);
}

for (const c of LINKED_SCENARIOS) {
  assert(rows.some((r) => r.id === c.code), `chain row ${c.code}`);
}

const plus = riskScenarioSummary("plus");
const classic = riskScenarioSummary("classic");
assert(plus.byBucket.cs_tr > 0, "plus edition includes CS/TR");
assert(classic.byBucket.cs_tr === 0, "classic edition excludes CS/TR");
assert(classic.total < plus.total, "classic is smaller than plus");
assert(plus.byBucket.admin_system >= 5, "admin system coverage");
assert(plus.byBucket.pricing >= 5, "pricing coverage");
assert(plus.byBucket.risk_ops >= 10, "risk ops coverage");
assert(rows.some((r) => r.kind === "doc_extra" && r.bucket === "admin_system"), "doc extras for admin");

assert(plus.byKind.correlation >= CORRELATION_SCENARIOS.length, "correlation rows present");
for (const c of CORRELATION_SCENARIOS) {
  assert(rows.some((r) => r.id === c.id && r.kind === "correlation"), `correlation ${c.id}`);
}
assert(
  rows.some((r) => r.correlation_pattern === "one_account_many_alerts"),
  "one account → many alerts pattern"
);
assert(
  rows.some((r) => r.correlation_pattern === "one_alert_many_users"),
  "one alert → many users pattern"
);
assert(rows.some((r) => r.correlation_pattern === "cross_team"), "cross-team pattern");
assert(rows.some((r) => r.correlation_pattern === "cross_book"), "cross-book pattern");
assert(rows.some((r) => r.correlation_pattern === "kyc_cluster"), "KYC cluster pattern");
assert(rows.some((r) => r.correlation_pattern === "vendor_cascade"), "vendor cascade pattern");
assert(
  LINKED_SCENARIOS.every((c) => rows.find((r) => r.id === c.code)?.correlation_pattern === "multi_indicator_sequence"),
  "chains tagged as multi-indicator sequence"
);
assert(plus.total >= 110, "expanded catalogue size");

const requiredCols = [
  "name_en",
  "name_zh",
  "description_en",
  "description_zh",
  "indicators",
  "dimensions",
  "dimensions_zh",
  "warn",
  "warn_zh",
  "breach",
  "breach_zh",
  "frequency_en",
  "frequency_zh",
  "severity",
  "escalation_en",
  "escalation_zh",
  "investigation_en",
  "investigation_zh",
  "solution_en",
  "solution_zh",
] as const;
for (const col of requiredCols) {
  assert(
    riskScenarioRowsForEdition("plus").every((r) => {
      const v = r[col];
      return Array.isArray(v) ? v.length > 0 : String(v || "").length > 0;
    }),
    `every plus row has ${col}`
  );
}

let enEqualsZhSol = 0;
let enEqualsZhEsc = 0;
let enEqualsZhInv = 0;
for (const r of rows) {
  if (r.solution_en.join("|") === r.solution_zh.join("|")) enEqualsZhSol++;
  if (r.escalation_en === r.escalation_zh) enEqualsZhEsc++;
  if (r.investigation_en.join("|") === r.investigation_zh.join("|")) enEqualsZhInv++;
  assert(r.name_en !== r.name_zh || /M2-|SKILL-|CORR-|DOC-|CHAIN-/.test(r.name_en), `${r.id} name bilingual or code`);
}
assert(enEqualsZhSol === 0, `solutions must differ EN vs ZH (had ${enEqualsZhSol})`);
assert(enEqualsZhEsc === 0, `escalation must differ EN vs ZH (had ${enEqualsZhEsc})`);
assert(enEqualsZhInv === 0, `investigation must differ EN vs ZH (had ${enEqualsZhInv})`);
assert(rows.every((r) => /[\u4e00-\u9fff]/.test(r.name_zh)), "every name_zh has CJK");
assert(rows.every((r) => /[\u4e00-\u9fff]/.test(r.description_zh)), "every description_zh has CJK");
assert(rows.every((r) => r.solution_zh.some((s) => /[\u4e00-\u9fff]/.test(s))), "every solution_zh has CJK");

assert(
  NAV_ITEMS.some((n) => n.href === "/admin/docs/risk-scenarios"),
  "nav includes Risk scenarios"
);
assert(
  PLATFORM_URLS.some((u) => u.path === "/admin/docs/risk-scenarios"),
  "URL catalog includes Risk scenarios"
);

if (process.exitCode) {
  console.error("risk-scenarios doc verification failed");
  process.exit(1);
}
console.log("risk-scenarios doc verification passed", {
  plus: plus.total,
  classic: classic.total,
  skills: SKILL_SCENARIOS.length,
  chains: LINKED_SCENARIOS.length,
});
