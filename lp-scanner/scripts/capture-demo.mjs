import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

const base = "http://127.0.0.1:3010";
const out = "/opt/cursor/artifacts";
await mkdir(out, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

await page.goto(base, { waitUntil: "networkidle" });
await page.waitForSelector("h1");
await page.screenshot({ path: `${out}/lp-scanner-home.png`, fullPage: false });

const search = page.locator("form input").first();
await search.fill("XAUUSD");
await page.locator("form button[type='submit']").click();
await page.waitForSelector("table tbody tr", { timeout: 20000 });
await page.waitForTimeout(800);
await page.screenshot({ path: `${out}/lp-scanner-xauusd.png`, fullPage: true });

await page.getByRole("button", { name: /Score|得分/ }).click();
await page.waitForTimeout(400);
await page.screenshot({ path: `${out}/lp-scanner-sorted.png`, fullPage: false });

await page.getByRole("button", { name: "中文" }).click();
await page.waitForTimeout(500);
await page.screenshot({ path: `${out}/lp-scanner-zh.png`, fullPage: false });

await page.goto(`${base}/knowledge`, { waitUntil: "networkidle" });
await page.waitForSelector("article", { timeout: 20000 });
await page.waitForTimeout(600);
await page.screenshot({ path: `${out}/lp-scanner-knowledge.png`, fullPage: false });

await page.goto(`${base}/repository`, { waitUntil: "networkidle" });
await page.waitForSelector("table tbody tr", { timeout: 20000 });
await page.waitForTimeout(600);
await page.screenshot({ path: `${out}/lp-scanner-repository.png`, fullPage: false });

await page.goto(base, { waitUntil: "networkidle" });
await page.locator("button").filter({ hasText: /LP|名称/ }).first().click();
await page.locator("form input").first().fill("LMAX");
await page.locator("form button[type='submit']").click();
await page.waitForSelector("text=LMAX", { timeout: 25000 });
await page.waitForTimeout(900);
await page.screenshot({ path: `${out}/lp-scanner-lp-search.png`, fullPage: true });

await page.locator("button").filter({ hasText: "AI" }).last().click();
await page.waitForTimeout(400);
await page.locator(".panel input, fixed input").last().fill("best LP for gold?");
await page.locator("button").filter({ hasText: /Send|发送/ }).click();
await page.waitForTimeout(1500);
await page.screenshot({ path: `${out}/lp-scanner-ai.png`, fullPage: false });

await browser.close();
console.log("screenshots written to", out);
