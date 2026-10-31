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
  await page.goto(BASE, { waitUntil: "domcontentloaded" });
  await page.evaluate(() => localStorage.clear());

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
  const sample = join(outDir, "sample-bingo-tanqueray.png");
  writeFileSync(sample, Buffer.from(pngB64, "base64"));

  await page.goto(`${BASE}#/scan`, { waitUntil: "networkidle0", timeout: 90000 });
  const input = await page.$('input[type="file"]');
  await input.uploadFile(sample);
  await page.waitForFunction(
    () => [...document.querySelectorAll("button")].some((b) => /identify with ai/i.test(b.textContent || "")),
    { timeout: 10000 },
  );
  await page.evaluate(() => {
    [...document.querySelectorAll("button")]
      .find((b) => /identify with ai/i.test(b.textContent || ""))
      ?.click();
  });
  await page.waitForSelector(".guess-list .guess", { timeout: 120000 });
  await page.evaluate(() => {
    const guesses = [...document.querySelectorAll(".guess-list .guess")];
    const tanq = guesses.find((g) => /tanqueray/i.test(g.textContent || ""));
    (tanq || guesses[0])?.click();
  });
  await page.evaluate(() => {
    [...document.querySelectorAll("button")]
      .find((b) => /confirm selection/i.test(b.textContent || ""))
      ?.click();
  });
  await page.waitForSelector(".celebrate", { timeout: 30000 });

  const state = await page.evaluate(() => {
    const card = document.querySelector(".celebrate__card");
    const text = card?.innerText || "";
    const labels = [...card.querySelectorAll("button, a.btn")].map((el) =>
      (el.textContent || "").trim(),
    );
    return {
      labels,
      hasPermanent: /permanent link/i.test(text),
      hasUrl: /hxyan2020\.github\.io/i.test(text),
      hasCopy: labels.some((l) => /copy/i.test(l)),
      hasOpen: labels.some((l) => /^open link$/i.test(l)),
      hasKeep: labels.some((l) => /keep exploring/i.test(l)),
    };
  });

  await page.screenshot({ path: join(outDir, "bingo-open-keep-only.png") });
  console.log(JSON.stringify(state, null, 2));

  if (state.hasPermanent || state.hasUrl || state.hasCopy || !state.hasOpen || !state.hasKeep) {
    throw new Error("Bingo modal should only expose Open link + Keep exploring");
  }
} catch (err) {
  await page.screenshot({ path: join(outDir, "bingo-actions-error.png") }).catch(() => {});
  console.error(err);
  process.exitCode = 1;
} finally {
  await browser.close();
}
