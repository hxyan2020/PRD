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

try {
  await page.goto(BASE, { waitUntil: "domcontentloaded" });
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem(
      "seen.unlocks.v1",
      JSON.stringify({
        "liquor__tanqueray": {
          itemId: "liquor__tanqueray",
          unlockedAt: new Date().toISOString(),
          method: "scan",
          photoDataUrl: null,
          note: "",
          shareId: "liquor-tanqueray-test",
        },
      }),
    );
  });

  await page.goto(`${BASE}#/unlocked`, { waitUntil: "networkidle0", timeout: 60000 });
  await page.waitForSelector(".tile, .item-tile, button, a", { timeout: 20000 });

  // Open Tanqueray detail from unlocked page
  const opened = await page.evaluate(() => {
    const hit = [...document.querySelectorAll("button, a, [role='button']")].find((el) =>
      /tanqueray/i.test(el.textContent || ""),
    );
    hit?.click();
    return Boolean(hit);
  });
  if (!opened) {
    // fallback: click first unlocked card
    await page.evaluate(() => {
      const card = document.querySelector(".unlocked-card, .item-tile, .tile, .shelf-card, li button, article button");
      card?.click();
    });
  }

  await page.waitForSelector("#note, textarea, .detail-card", { timeout: 20000 });
  await page.waitForSelector('button', { timeout: 10000 });

  // Fill note
  const noteSel = (await page.$("#note")) ? "#note" : "textarea";
  await page.click(noteSel, { clickCount: 3 });
  await page.type(noteSel, "Adding a note");

  await page.evaluate(() => {
    const btn = [...document.querySelectorAll("button")].find((b) =>
      /save note/i.test(b.textContent || ""),
    );
    btn?.click();
  });

  await page.waitForFunction(
    () =>
      [...document.querySelectorAll("button")].some((b) =>
        /note saved/i.test(b.textContent || ""),
      ),
    { timeout: 5000 },
  );

  const state = await page.evaluate(() => {
    const labels = [...document.querySelectorAll("button")].map((b) =>
      (b.textContent || "").trim(),
    );
    return {
      labels: labels.filter((l) => /note|copy|save|copied/i.test(l)),
      hasNoteSaved: labels.some((l) => /^note saved$/i.test(l)),
      hasCopiedOnSave: labels.some((l) => /^copied$/i.test(l)),
    };
  });

  await page.screenshot({ path: join(outDir, "note-saved-flash.png") });
  console.log(JSON.stringify(state, null, 2));
  if (!state.hasNoteSaved) throw new Error("Expected Note saved flash on Save note");
} catch (err) {
  await page.screenshot({ path: join(outDir, "note-saved-error.png") }).catch(() => {});
  console.error(err);
  process.exitCode = 1;
} finally {
  await browser.close();
}
