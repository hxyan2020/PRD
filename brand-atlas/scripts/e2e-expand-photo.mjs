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
        "liquor__tanqueray": {
          itemId: "liquor__tanqueray",
          unlockedAt: new Date().toISOString(),
          method: "scan",
          photoDataUrl: photo,
          note: "",
          shareId: "liquor-tanqueray-expand",
          unlockedBy: "tester@example.com",
        },
      }),
    );
  }, TINY_PNG);

  await page.goto(`${BASE}#/unlocked`, { waitUntil: "networkidle0", timeout: 60000 });
  await page.waitForSelector(".item-tile, .unlocked-card, button", { timeout: 20000 });
  await page.evaluate(() => {
    const hit = [...document.querySelectorAll("button, a, [role='button']")].find((el) =>
      /tanqueray/i.test(el.textContent || ""),
    );
    hit?.click();
  });

  await page.waitForSelector(".expandable-photo, .sighting-photo, .detail-cover__photo", {
    timeout: 20000,
  });

  const hasExpandable = await page.$(".expandable-photo");
  if (!hasExpandable) throw new Error("Expected expandable photo control on detail");

  await page.click(".expandable-photo");
  await page.waitForSelector(".photo-lightbox", { timeout: 5000 });
  const lightbox = await page.evaluate(() => {
    const root = document.querySelector(".photo-lightbox");
    const img = root?.querySelector(".photo-lightbox__img");
    return {
      open: Boolean(root),
      onBody: root?.parentElement === document.body,
      src: img?.getAttribute("src") || "",
      naturalW: img instanceof HTMLImageElement ? img.naturalWidth : 0,
    };
  });
  await page.screenshot({ path: join(outDir, "expand-photo-lightbox.png") });
  if (!lightbox.open) throw new Error("Lightbox did not open");
  if (!lightbox.onBody) throw new Error("Lightbox should portal to document.body");
  if (!lightbox.src.startsWith("data:image/")) throw new Error("Lightbox missing user photo");

  await page.keyboard.press("Escape");
  await page.waitForFunction(() => !document.querySelector(".photo-lightbox"), {
    timeout: 5000,
  });

  // Scan preview expand
  const pngB64 = await page.evaluate(async () => {
    const canvas = document.createElement("canvas");
    canvas.width = 480;
    canvas.height = 320;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#244";
    ctx.fillRect(0, 0, 480, 320);
    ctx.fillStyle = "#fff";
    ctx.font = "bold 48px sans-serif";
    ctx.fillText("EXPAND", 120, 170);
    return canvas.toDataURL("image/png").split(",")[1];
  });
  const { writeFileSync } = await import("node:fs");
  const sample = join(outDir, "sample-expand-photo.png");
  writeFileSync(sample, Buffer.from(pngB64, "base64"));

  await page.goto(`${BASE}#/scan`, { waitUntil: "networkidle0", timeout: 60000 });
  const input = await page.$('input[type="file"]');
  await input.uploadFile(sample);
  await page.waitForSelector(".expandable-photo.dropzone__photo, .dropzone .expandable-photo", {
    timeout: 10000,
  });
  await page.click(".dropzone .expandable-photo");
  await page.waitForSelector(".photo-lightbox", { timeout: 5000 });
  await page.screenshot({ path: join(outDir, "expand-scan-preview-lightbox.png") });
  await page.click(".photo-lightbox__close");
  await page.waitForFunction(() => !document.querySelector(".photo-lightbox"), {
    timeout: 5000,
  });

  console.log(
    JSON.stringify(
      {
        detailLightbox: true,
        scanPreviewLightbox: true,
        lightboxPortaled: lightbox.onBody,
      },
      null,
      2,
    ),
  );
} catch (err) {
  await page.screenshot({ path: join(outDir, "expand-photo-error.png") }).catch(() => {});
  console.error(err);
  process.exitCode = 1;
} finally {
  await browser.close();
}
