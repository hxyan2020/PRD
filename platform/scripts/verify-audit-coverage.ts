/**
 * Guardrails: mutating Admin / Lark / messenger paths must call writeAudit.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(__dirname, "..");

function read(rel: string) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

function assertAudited(rel: string, markers: RegExp[]) {
  const src = read(rel);
  assert.match(src, /writeAudit/, `${rel} must import/call writeAudit`);
  for (const m of markers) {
    assert.match(src, m, `${rel} missing audit marker ${m}`);
  }
}

assertAudited("src/app/api/lark/route.ts", [
  /LARK_TEST_NOTIFY/,
  /TOGGLE_LARK_CHANNEL/,
  /CREATE_LARK_CHANNEL/,
]);

assertAudited("src/app/api/discovery/route.ts", [
  /DISCOVERY_CONNECT_OPENAI/,
  /DISCOVERY_DISCONNECT_OPENAI/,
  /DISCOVERY_ANALYSE/,
  /DISCOVERY_TOGGLE_ENABLED/,
]);

assertAudited("src/app/api/detectors/route.ts", [/TOGGLE_DETECTOR/]);
assertAudited("src/app/api/market-intel/route.ts", [/MARKET_INTEL_TOGGLE_ENABLED/]);
assertAudited("src/app/api/auth/login/route.ts", [/LOGIN_FAILED/]);
assertAudited("src/lib/messenger/demo.ts", [
  /MESSENGER_RECOMMEND/,
  /MESSENGER_CANCEL_ACTION/,
  /MESSENGER_SYNC/,
  /MESSENGER_CONFIRM_ACTION/,
  /LARK_TEST_NOTIFY|MESSENGER_ESCALATE/,
]);

const audit = read("src/lib/audit.ts");
assert.match(audit, /LOGIN_FAILED/);
assert.match(audit, /DISCOVERY_ANALYSE/);
assert.match(audit, /MESSENGER_RECOMMEND/);
assert.match(audit, /TOGGLE_DETECTOR/);

const ug = read("docs/USER_GUIDE.md");
assert.match(ug, /Failed logins are also recorded/);
const ugZh = read("docs/USER_GUIDE.zh-Hant.md");
assert.match(ugZh, /登入失敗也會記錄/);

const phrases = read("src/lib/i18n-phrases.ts");
assert.match(phrases, /LOGIN_FAILED:\s*"登入失敗"/);
assert.match(phrases, /DISCOVERY_ANALYSE:\s*"探索分析"/);
assert.match(phrases, /TOGGLE_DETECTOR:\s*"切換偵測器"/);

const intro = read("src/lib/i18n-extra.ts");
assert.match(intro, /audit\.boardIntro/);
assert.match(intro, /失敗登入/);

console.log("ok: Admin/Lark mutation audit coverage guards");
