/**
 * Guardrails: crypto-exchange admin mount at /exchange (parallel to /admin).
 * Must not alter existing /admin sources.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(__dirname, "..");

function read(rel: string) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

const shell = read("src/components/ExchangeAdminShell.tsx");
assert.match(shell, /ExchangeAdminShell/);
assert.match(shell, /EXCHANGE_MOUNT/);
assert.match(shell, /exchangeShellCopy/);
assert.doesNotMatch(shell, /VantageLogo/);
assert.doesNotMatch(shell, /VantageMark/);
assert.match(shell, /brandEyebrow/);

const guards = read("src/components/ExchangeMountGuards.tsx");
assert.match(guards, /rewriteAdminTarget/);
assert.match(guards, /applyExchangeText/);
assert.match(guards, /vantage-mark/);

const brand = read("src/lib/exchange-brand.ts");
assert.match(brand, /Crypto Exchange/);
assert.match(brand, /加密交易所/);
assert.match(brand, /Vantage Markets/);

const mount = read("src/lib/admin-mount.ts");
assert.match(mount, /EXCHANGE_MOUNT = \"\/exchange\"/);
assert.match(mount, /ADMIN_MOUNT = \"\/admin\"/);

const layout = read("src/app/exchange/layout.tsx");
assert.match(layout, /ExchangeAdminShell/);

const home = read("src/app/exchange/page.tsx");
assert.match(home, /Crypto Exchange Risk Control Plane/);
assert.match(home, /加密交易所風險控制平面/);

const login = read("src/app/exchange/login/page.tsx");
assert.match(login, /exchange-login/);
assert.doesNotMatch(login, /VantageLogo/);

for (const rel of [
  "src/app/exchange/dashboard/page.tsx",
  "src/app/exchange/alerts/page.tsx",
  "src/app/exchange/monitor-2/page.tsx",
  "src/app/exchange/messenger/page.tsx",
  "src/app/exchange/risk-domains/page.tsx",
]) {
  const src = read(rel);
  assert.match(src, /export \{ default \} from/, `${rel} should re-export admin page`);
  assert.match(src, /admin\//, `${rel} should point at admin module`);
}

// Existing admin chrome must still be the Vantage shell.
const adminLayout = read("src/app/admin/layout.tsx");
assert.match(adminLayout, /AdminShell/);
assert.doesNotMatch(adminLayout, /ExchangeAdminShell/);

const adminShell = read("src/components/AdminShell.tsx");
assert.match(adminShell, /VantageLogo/);

const logo = read("src/components/VantageLogo.tsx");
assert.match(logo, /Vantage Markets/);

console.log("ok: crypto-exchange admin mount (/exchange) parallel to /admin");
