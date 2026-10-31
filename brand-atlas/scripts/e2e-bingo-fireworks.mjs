#!/usr/bin/env node
import puppeteer from "puppeteer-core";
import { mkdirSync } from "node:fs";
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
await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "no-preference" }]);

try {
  await page.goto(BASE, { waitUntil: "domcontentloaded" });
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem(
      "seen.unlocks.v1",
      JSON.stringify({
        "liquor__martini": {
          itemId: "liquor__martini",
          unlockedAt: new Date().toISOString(),
          method: "scan",
          photoDataUrl: null,
          note: "",
          shareId: "liquor-martini-fw",
        },
      }),
    );
  });

  // Inject celebrate modal by navigating unlocked and simulating via React is hard;
  // instead mount by clicking through scan with a filename hint, or open share then
  // programmatically add celebrate DOM — better: use Catalog contribute path.
  // Simplest reliable path: evaluate unlock already set, go unlocked, open detail —
  // but fireworks only on CelebrateModal. Trigger via scan filename "martini.jpg".

  const pngB64 = await page.evaluate(async () => {
    const canvas = document.createElement("canvas");
    canvas.width = 640;
    canvas.height = 360;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#1a3c34";
    ctx.fillRect(0, 0, 640, 360);
    ctx.fillStyle = "#f5f0e6";
    ctx.font = "bold 72px serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("MARTINI", 320, 180);
    return canvas.toDataURL("image/png").split(",")[1];
  });
  const { writeFileSync } = await import("node:fs");
  const sample = join(outDir, "sample-fireworks-martini.png");
  writeFileSync(sample, Buffer.from(pngB64, "base64"));

  await page.goto(`${BASE}#/scan`, { waitUntil: "networkidle0", timeout: 90000 });
  const input = await page.$('input[type="file"]');
  await input.uploadFile(sample);
  await page.waitForFunction(
    () => [...document.querySelectorAll("button")].some((b) => /identify with ai/i.test(b.textContent || "")),
    { timeout: 10000 },
  );
  await page.evaluate(() => {
    [...document.querySelectorAll("button")].find((b) => /identify with ai/i.test(b.textContent || ""))?.click();
  });
  await page.waitForSelector(".guess-list .guess", { timeout: 120000 });
  await page.evaluate(() => {
    const guesses = [...document.querySelectorAll(".guess-list .guess")];
    const hit = guesses.find((g) => /martini/i.test(g.textContent || ""));
    (hit || guesses[0])?.click();
  });
  await page.evaluate(() => {
    [...document.querySelectorAll("button")].find((b) => /confirm selection/i.test(b.textContent || ""))?.click();
  });
  await page.waitForSelector(".celebrate canvas.fireworks", { timeout: 30000 });
  await new Promise((r) => setTimeout(r, 900));

  const state = await page.evaluate(() => {
    const canvas = document.querySelector(".celebrate canvas.fireworks");
    return {
      hasCanvas: Boolean(canvas),
      width: canvas?.width || 0,
      height: canvas?.height || 0,
      title: document.querySelector("#bingo-title")?.textContent?.trim() || null,
    };
  });
  await page.screenshot({ path: join(outDir, "bingo-fireworks.png") });
  console.log(JSON.stringify(state, null, 2));
  if (!state.hasCanvas || state.width < 10) throw new Error("Fireworks canvas missing");
} catch (err) {
  await page.screenshot({ path: join(outDir, "bingo-fireworks-error.png") }).catch(() => {});
  console.error(err);
  process.exitCode = 1;
} finally {
  await browser.close();
}
