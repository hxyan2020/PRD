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
  args: [
    "--no-sandbox",
    "--disable-gpu",
    "--disable-dev-shm-usage",
    "--use-fake-ui-for-media-stream",
    "--use-fake-device-for-media-stream",
    "--window-size=420,900",
  ],
});

const page = await browser.newPage();
await page.setViewport({ width: 420, height: 900, isMobile: true, hasTouch: true });
const ctx = browser.defaultBrowserContext();
await ctx.overridePermissions("http://127.0.0.1:4175", ["camera"]);

try {
  await page.goto(`${BASE}#/scan`, { waitUntil: "networkidle0", timeout: 60000 });
  await page.waitForFunction(
    () =>
      [...document.querySelectorAll("button")].some((b) =>
        /use camera/i.test(b.textContent || ""),
      ),
    { timeout: 20000 },
  );

  await page.evaluate(() => {
    const btn = [...document.querySelectorAll("button")].find((b) =>
      /use camera/i.test(b.textContent || ""),
    );
    btn?.click();
  });

  await page.waitForSelector("video.dropzone__video", { timeout: 15000 });
  await page.waitForFunction(
    () => {
      const v = document.querySelector("video.dropzone__video");
      return Boolean(v && v.srcObject);
    },
    { timeout: 15000 },
  );

  const ui = await page.evaluate(() => {
    const labels = [...document.querySelectorAll("button")]
      .map((b) => (b.textContent || "").trim())
      .filter(Boolean);
    const video = document.querySelector("video.dropzone__video");
    return {
      labels,
      hasUpload: labels.some((l) => /upload image/i.test(l)),
      hasIdentify: labels.some((l) => /identify with ai/i.test(l)),
      hasCapture: labels.some((l) => /^capture$/i.test(l)),
      hasCancel: labels.some((l) => /^cancel$/i.test(l)),
      hasStop: labels.some((l) => /stop camera/i.test(l)),
      hasVideo: Boolean(video),
      hasStream: Boolean(video?.srcObject),
      videoW: video?.videoWidth ?? 0,
    };
  });

  await page.screenshot({ path: join(outDir, "scan-camera-capture-only.png") });

  // Wait for fake stream frames, then capture
  await page.waitForFunction(
    () => (document.querySelector("video.dropzone__video")?.videoWidth || 0) > 0,
    { timeout: 10000 },
  ).catch(() => {});

  await page.evaluate(() => {
    const btn = [...document.querySelectorAll("button")].find((b) =>
      /^capture$/i.test(b.textContent || ""),
    );
    btn?.click();
  });

  await page.waitForFunction(
    () =>
      [...document.querySelectorAll("button")].some((b) =>
        /identify with ai/i.test(b.textContent || ""),
      ),
    { timeout: 15000 },
  );

  const afterCapture = await page.evaluate(() => ({
    hasIdentify: [...document.querySelectorAll("button")].some((b) =>
      /identify with ai/i.test(b.textContent || ""),
    ),
    hasVideo: Boolean(document.querySelector("video.dropzone__video")),
    hasPreviewImg: Boolean(document.querySelector(".dropzone img")),
  }));
  await page.screenshot({ path: join(outDir, "scan-camera-after-capture.png") });

  console.log(JSON.stringify({ ui, afterCapture }, null, 2));

  if (!ui.hasCapture || !ui.hasCancel || ui.hasUpload || ui.hasIdentify || ui.hasStop) {
    throw new Error("Camera mode should show only Capture + Cancel");
  }
  if (!ui.hasVideo || !ui.hasStream) {
    throw new Error("Camera video stream was not attached");
  }
  if (!afterCapture.hasIdentify || afterCapture.hasVideo || !afterCapture.hasPreviewImg) {
    throw new Error("After capture, expect preview image + Identify, no live video");
  }
} catch (err) {
  await page.screenshot({ path: join(outDir, "scan-camera-ui-error.png") }).catch(() => {});
  console.error(err);
  process.exitCode = 1;
} finally {
  await browser.close();
}
