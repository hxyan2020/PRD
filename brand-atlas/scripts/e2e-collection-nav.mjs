#!/usr/bin/env node
import puppeteer from "puppeteer-core";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const BASE = process.env.SEEN_BASE || "http://127.0.0.1:4175/PRD/brand-atlas/";
const CHROME = process.env.CHROME_PATH || "/usr/bin/google-chrome";
const outDir = "/opt/cursor/artifacts";
mkdirSync(outDir, { recursive: true });

const TINY_PNG =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFUlEQVR42mNk+M9Qz0AEYBxVSF+FABJADveWkH6oAAAAAElFTkSuQmCC";

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
  args: ["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage", "--window-size=420,900"],
});
const page = await browser.newPage();
await page.setViewport({ width: 420, height: 900, isMobile: true, hasTouch: true });

try {
  await page.goto(BASE, { waitUntil: "domcontentloaded" });
  await page.evaluate((photo) => {
    localStorage.clear();
    localStorage.setItem(
      "seen.unlocks.v1",
      JSON.stringify({
        liquor__martini: {
          itemId: "liquor__martini",
          unlockedAt: new Date().toISOString(),
          method: "scan",
          photoDataUrl: photo,
          note: "",
          shareId: "liquor-martini-nav",
        },
        liquor__tanqueray: {
          itemId: "liquor__tanqueray",
          unlockedAt: new Date().toISOString(),
          method: "scan",
          photoDataUrl: photo,
          note: "",
          shareId: "liquor-tanqueray-nav",
        },
      }),
    );
  }, TINY_PNG);

  // Full reload so useUnlocks reads the seeded collection count.
  await page.goto(`${BASE}#/unlocked`, { waitUntil: "networkidle0", timeout: 60000 });
  await page.reload({ waitUntil: "networkidle0", timeout: 60000 });
  await page.waitForSelector(".header-progress--link", { timeout: 20000 });
  await page.waitForFunction(
    () =>
      (document.querySelector(".header-progress__count")?.textContent || "").trim() ===
        "2" ||
      /Collection\s*·\s*2/i.test(
        document.querySelector(".header-progress__full")?.textContent || "",
      ),
    { timeout: 10000 },
  );

  const state = await page.evaluate(() => {
    const link = document.querySelector(".header-progress--link");
    const icon = link?.querySelector(".header-progress__icon");
    const count = link?.querySelector(".header-progress__count")?.textContent?.trim();
    return {
      aria: link?.getAttribute("aria-label") || "",
      title: link?.getAttribute("title") || "",
      href: link?.getAttribute("href") || "",
      hasIcon: Boolean(icon),
      count,
      shortText: (link?.querySelector(".header-progress__short")?.textContent || "")
        .replace(/\s+/g, " ")
        .trim(),
    };
  });

  await page.screenshot({ path: join(outDir, "collection-nav-mobile.png") });

  // Desktop width: full "Collection · N" label
  await page.setViewport({ width: 1100, height: 800, isMobile: false, hasTouch: false });
  await page.reload({ waitUntil: "networkidle0", timeout: 60000 });
  await page.waitForSelector(".header-progress__full", { timeout: 20000 });
  const desktop = await page.evaluate(() => {
    const full = document.querySelector(".header-progress__full");
    const cs = full ? getComputedStyle(full) : null;
    return {
      fullText: (full?.textContent || "").trim(),
      fullVisible: cs?.display !== "none",
      hasIcon: Boolean(document.querySelector(".header-progress__icon")),
    };
  });
  await page.screenshot({ path: join(outDir, "collection-nav-desktop.png") });

  if (!state.hasIcon) throw new Error("Expected book icon on collection control");
  if (state.count !== "2") throw new Error(`Expected count 2, got ${state.count}`);
  if (!/collection/i.test(state.aria) && !/collection/i.test(state.title)) {
    throw new Error(`Expected collection wording in aria/title: ${state.aria} / ${state.title}`);
  }
  if (!/collection/i.test(desktop.fullText)) {
    throw new Error(`Expected Collection label on desktop, got: ${desktop.fullText}`);
  }

  console.log(JSON.stringify({ mobile: state, desktop }, null, 2));
} catch (err) {
  await page.screenshot({ path: join(outDir, "collection-nav-error.png") }).catch(() => {});
  console.error(err);
  process.exitCode = 1;
} finally {
  await browser.close();
}
