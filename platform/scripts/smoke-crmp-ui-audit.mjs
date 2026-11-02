/**
 * Headless UI audit: login + desk path pages + click primary CTAs.
 * Writes JSON report to /opt/cursor/artifacts/crmp-ui-audit.json
 */
import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const BASE = process.env.CRMP_BASE || "http://127.0.0.1:3000";
const OUT = "/opt/cursor/artifacts/crmp-ui-audit.json";
const SHOTS = "/opt/cursor/artifacts";

const PAGES = [
  "/admin/monitor-labs",
  "/admin/risk-domains",
  "/admin/monitor-2",
  "/admin/alerts",
  "/admin/discovery",
  "/admin/indicator-aggregation",
  "/admin/market-intel",
  "/admin/ai-incident",
  "/admin/noise-reduction",
  "/admin/risk-log",
  "/admin/dashboard",
  "/admin/messenger",
  "/admin/skills",
];

async function main() {
  fs.mkdirSync(SHOTS, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const bugs = [];
  const ok = [];
  const consoleErrors = [];

  page.on("pageerror", (e) => consoleErrors.push(String(e.message || e)));
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });

  // Login via API cookie by visiting login UI
  await page.goto(`${BASE}/admin`, { waitUntil: "domcontentloaded", timeout: 60000 });
  // Try demo login form if present
  const email = page.locator('input[type="email"], input[name="email"]').first();
  const password = page.locator('input[type="password"], input[name="password"]').first();
  if (await email.count()) {
    // Pull owner from page buttons if listed, else known demo
    await email.fill("alex.chen@vantagemarkets.com").catch(() => {});
    // Try platform owner from personas — fallback risk owner
    const candidates = [
      ["hxyan2020@gmail.com", "change-me"],
      ["alex.chen@vantagemarkets.com", "risk123"],
      ["platform@vantage.demo", "admin123"],
    ];
    // Discover from demo buttons
    const demoBtns = page.locator("button, a");
    // Use API login for reliability
  }

  // API login — platform owner then risk owner fallback
  let login = await page.request.post(`${BASE}/api/auth/login`, {
    data: { email: "haixiang.yan@hytechc.com", password: "yan123" },
  });
  if (!login.ok()) {
    login = await page.request.post(`${BASE}/api/auth/login`, {
      data: { email: "alex.chen@vantagemarkets.com", password: "risk123" },
    });
  }
  if (!login.ok()) {
    bugs.push({ page: "/api/auth/login", issue: `login failed ${login.status()}` });
  }

  for (const pathName of PAGES) {
    const url = `${BASE}${pathName}`;
    try {
      const res = await page.goto(url, { waitUntil: "networkidle", timeout: 90000 });
      const status = res?.status() ?? 0;
      await page.waitForTimeout(800);
      const bodyText = await page.locator("body").innerText().catch(() => "");
      const title = await page.title();
      const blank = bodyText.trim().length < 40;
      const hasError =
        /Application error|Unhandled Runtime Error|Internal Server Error|Something went wrong/i.test(bodyText);
      const fakeAi =
        /Primary RCA generated from Monitor 2\.0 \+ RAG playbook(?!.*HEURISTIC)/i.test(bodyText) ||
        (/Live LLM|real AI completed/i.test(bodyText) && /no API key|MOCK|HEURISTIC/i.test(bodyText) === false);

      const shot = path.join(SHOTS, `audit${pathName.replace(/\//g, "-")}.png`);
      await page.screenshot({ path: shot, fullPage: false });

      // Try a benign primary button if present
      const btn = page.locator("button.btn-primary, button.btn.btn-primary, .btn-primary").first();
      let btnIssue = null;
      if (await btn.count()) {
        const disabled = await btn.isDisabled().catch(() => false);
        if (!disabled) {
          try {
            await btn.click({ timeout: 3000 });
            await page.waitForTimeout(500);
          } catch (e) {
            btnIssue = `primary button click failed: ${e.message}`;
          }
        }
      }

      if (status >= 400 || blank || hasError) {
        bugs.push({ page: pathName, status, blank, hasError, btnIssue, shot });
      } else if (btnIssue) {
        bugs.push({ page: pathName, issue: btnIssue, shot });
      } else {
        ok.push({ page: pathName, status, title, shot });
      }

      // Page-specific checks
      if (pathName === "/admin/monitor-labs") {
        const map = await page.locator('[data-testid="full-flow-demo"]').count();
        if (!map) bugs.push({ page: pathName, issue: "missing full-flow-demo", shot });
      }
      if (pathName === "/admin/risk-log") {
        // Should not show ALT-1001 style legacy as closed narrative if superseded
        if (/ALT-1001|ALT-STALE-FEED-LIQ/.test(bodyText)) {
          bugs.push({ page: pathName, issue: "legacy superseded alert visible in risk log", shot });
        }
      }
      if (pathName === "/admin/alerts" || pathName === "/admin/ai-incident") {
        // Prefer honest labels when no keys
        // soft note only
      }
      void fakeAi;
    } catch (e) {
      bugs.push({ page: pathName, issue: String(e.message || e) });
    }
  }

  const report = {
    at: new Date().toISOString(),
    base: BASE,
    okCount: ok.length,
    bugCount: bugs.length,
    bugs,
    ok,
    consoleErrors: consoleErrors.slice(0, 40),
  };
  fs.writeFileSync(OUT, JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ okCount: ok.length, bugCount: bugs.length, bugs, consoleErrors: consoleErrors.slice(0, 20) }, null, 2));
  await browser.close();
  process.exit(bugs.length ? 2 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
