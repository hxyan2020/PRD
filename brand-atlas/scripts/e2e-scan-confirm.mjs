#!/usr/bin/env node
/**
 * E2E: upload → identify → Confirm selection → bingo modal.
 * Also fills localStorage near quota to catch silent unlock failures.
 */
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
  await page.goto(BASE, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.evaluate(() => localStorage.clear());

  // Near-quota prior unlocks (old Confirm path threw here and never celebrated).
  await page.evaluate(() => {
    const map = {};
    for (let i = 0; i < 6; i++) {
      map[`fill__${i}`] = {
        itemId: `fill__${i}`,
        unlockedAt: new Date(Date.now() - (6 - i) * 1000).toISOString(),
        method: "scan",
        photoDataUrl: "data:image/jpeg;base64," + "A".repeat(120000),
        note: "",
        shareId: `fill-${i}`,
      };
    }
    localStorage.setItem("seen.unlocks.v1", JSON.stringify(map));
  });

  // Build a clear Tanqueray wordmark PNG in-page, then materialize as a file.
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
    ctx.fillText("TANQUERAY", 320, 180);
    return canvas.toDataURL("image/png").split(",")[1];
  });
  const samplePath = join(outDir, "sample-tanqueray.png");
  writeFileSync(samplePath, Buffer.from(pngB64, "base64"));

  await page.goto(`${BASE}#/scan`, { waitUntil: "networkidle0", timeout: 90000 });
  await page.waitForSelector('input[type="file"]', { timeout: 20000 });

  const input = await page.$('input[type="file"]');
  await input.uploadFile(samplePath);

  // Identify
  await page.waitForFunction(
    () =>
      [...document.querySelectorAll("button")].some((b) =>
        /identify with ai/i.test(b.textContent || ""),
      ),
    { timeout: 15000 },
  );
  await page.evaluate(() => {
    const btn = [...document.querySelectorAll("button")].find((b) =>
      /identify with ai/i.test(b.textContent || ""),
    );
    btn?.click();
  });

  await page.waitForSelector(".guess-list .guess", { timeout: 120000 });
  await page.screenshot({
    path: join(outDir, "scan-confirm-guesses.png"),
    fullPage: false,
  });

  // Prefer Tanqueray if present, else first guess
  await page.evaluate(() => {
    const guesses = [...document.querySelectorAll(".guess-list .guess")];
    const tanq = guesses.find((g) => /tanqueray/i.test(g.textContent || ""));
    (tanq || guesses[0])?.click();
  });

  await page.evaluate(() => {
    const btn = [...document.querySelectorAll("button")].find((b) =>
      /confirm selection/i.test(b.textContent || ""),
    );
    btn?.click();
  });

  await page.waitForSelector(".celebrate", { timeout: 30000 });
  const state = await page.evaluate(() => ({
    celebrate: Boolean(document.querySelector(".celebrate")),
    title: document.querySelector("#bingo-title")?.textContent?.trim() || null,
    unlockedCount: (() => {
      try {
        return Object.keys(JSON.parse(localStorage.getItem("seen.unlocks.v1") || "{}")).length;
      } catch {
        return -1;
      }
    })(),
    hasTanqueray: (() => {
      try {
        const m = JSON.parse(localStorage.getItem("seen.unlocks.v1") || "{}");
        return Object.keys(m).some((k) => /tanqueray/i.test(k) || /tanqueray/i.test(m[k]?.itemId || ""));
      } catch {
        return false;
      }
    })(),
  }));

  await page.screenshot({
    path: join(outDir, "scan-confirm-bingo.png"),
    fullPage: false,
  });

  console.log(JSON.stringify(state, null, 2));
  if (!state.celebrate) {
    process.exitCode = 1;
    throw new Error("Celebrate modal did not appear after Confirm selection");
  }
} catch (err) {
  await page.screenshot({
    path: join(outDir, "scan-confirm-error.png"),
    fullPage: true,
  }).catch(() => {});
  console.error(err);
  process.exitCode = 1;
} finally {
  await browser.close();
}
