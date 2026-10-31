#!/usr/bin/env node
import puppeteer from "puppeteer-core";
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const BASE = process.env.SEEN_BASE || "http://127.0.0.1:4175/PRD/brand-atlas/";
const CHROME = process.env.CHROME_PATH || "/usr/bin/google-chrome";
const outDir = "/opt/cursor/artifacts";
mkdirSync(outDir, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
  args: ["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage", "--window-size=420,900"],
});
const page = await browser.newPage();
await page.setViewport({ width: 420, height: 900, isMobile: true, hasTouch: true });

try {
  await page.goto(`${BASE}#/scan`, { waitUntil: "networkidle0", timeout: 60000 });
  await page.waitForSelector('input[type="file"]');

  const before = await page.evaluate(() =>
    [...document.querySelectorAll("button")].some((b) =>
      /identify with ai/i.test(b.textContent || ""),
    ),
  );
  await page.screenshot({ path: join(outDir, "scan-identify-hidden.png") });

  const pngB64 = await page.evaluate(async () => {
    const canvas = document.createElement("canvas");
    canvas.width = 320;
    canvas.height = 180;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#222";
    ctx.fillRect(0, 0, 320, 180);
    ctx.fillStyle = "#fff";
    ctx.font = "bold 36px sans-serif";
    ctx.fillText("TEST", 100, 100);
    return canvas.toDataURL("image/png").split(",")[1];
  });
  const sample = join(outDir, "sample-identify-ready.png");
  writeFileSync(sample, Buffer.from(pngB64, "base64"));

  const input = await page.$('input[type="file"]');
  await input.uploadFile(sample);
  await page.waitForFunction(
    () =>
      [...document.querySelectorAll("button")].some((b) =>
        /identify with ai/i.test(b.textContent || ""),
      ),
    { timeout: 10000 },
  );
  const after = await page.evaluate(() =>
    [...document.querySelectorAll("button")].some((b) =>
      /identify with ai/i.test(b.textContent || ""),
    ),
  );
  await page.screenshot({ path: join(outDir, "scan-identify-visible.png") });

  console.log(JSON.stringify({ identifyBeforeUpload: before, identifyAfterUpload: after }));
  if (before !== false || after !== true) {
    process.exitCode = 1;
    throw new Error("Identify button visibility incorrect");
  }
} catch (err) {
  await page.screenshot({ path: join(outDir, "scan-identify-visibility-error.png") }).catch(() => {});
  console.error(err);
  process.exitCode = 1;
} finally {
  await browser.close();
}
