import fs from "node:fs";
import path from "node:path";
import puppeteer from "puppeteer-core";

const OUT = "/opt/cursor/artifacts";
fs.mkdirSync(OUT, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: "/usr/bin/google-chrome-stable",
  headless: "new",
  args: ["--no-sandbox", "--disable-gpu", "--window-size=1440,1100"],
  defaultViewport: { width: 1440, height: 1100 },
});

const page = await browser.newPage();
const base = "http://localhost:3000";

async function shot(name) {
  const file = path.join(OUT, name);
  await page.screenshot({ path: file, fullPage: false });
  console.log("screenshot", file);
}

await page.goto(`${base}/admin/login`, { waitUntil: "networkidle2", timeout: 60000 });
await page.waitForSelector("form.panel input.input", { timeout: 20000 });
const buttons = await page.$$(".action-row button");
for (const btn of buttons) {
  const text = ((await page.evaluate((el) => el.textContent, btn)) || "").trim();
  if (/Risk Owner|風險負責人/i.test(text)) {
    await btn.click();
    break;
  }
}
await Promise.all([
  page.waitForNavigation({ waitUntil: "networkidle2", timeout: 60000 }).catch(() => null),
  page.click("form.panel button.btn-primary"),
]);

await page.goto(`${base}/admin/discovery`, { waitUntil: "networkidle2", timeout: 90000 });
await page.waitForSelector('[data-testid="discovery-suggestion-board"]', { timeout: 45000 });
await shot("crmp-admin-discovery-page.png");

await page.click('[data-testid="discovery-analyse"]');
await page.waitForSelector('[data-testid="discovery-suggestion-card"]', { timeout: 30000 });
await shot("crmp-admin-discovery-suggestion-card.png");

await page.click('[data-testid="discovery-approve-validation"]');
await page.waitForFunction(
  () => {
    const el = document.querySelector('[data-testid="discovery-msg"]');
    return el && /validation|驗證/i.test(el.textContent || "");
  },
  { timeout: 30000 }
);
await new Promise((r) => setTimeout(r, 600));
await shot("crmp-admin-discovery-approved-validation.png");

console.log("ok: admin discovery UI demo");
await browser.close();
