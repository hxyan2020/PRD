#!/usr/bin/env node
import puppeteer from "puppeteer-core";
import { mkdirSync, writeFileSync } from "node:fs";
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
  // Use neutral filenames — identify also scores the filename, and names like
  // "noise.png" can falsely match catalogue items.
  const texturePng = await page.evaluate(async () => {
    const canvas = document.createElement("canvas");
    canvas.width = 640;
    canvas.height = 360;
    const ctx = canvas.getContext("2d");
    for (let y = 0; y < 360; y += 6) {
      for (let x = 0; x < 640; x += 6) {
        ctx.fillStyle = `rgb(${40 + (x % 30)},${50 + (y % 40)},${60 + ((x + y) % 20)})`;
        ctx.fillRect(x, y, 6, 6);
      }
    }
    return canvas.toDataURL("image/png").split(",")[1];
  });
  const texturePath = join(outDir, "upload-texture.png");
  writeFileSync(texturePath, Buffer.from(texturePng, "base64"));

  await page.goto(BASE, { waitUntil: "domcontentloaded" });
  await page.evaluate(() => localStorage.clear());
  await page.goto(`${BASE}#/scan`, { waitUntil: "networkidle0", timeout: 90000 });

  const tipBefore = await page.evaluate(() => {
    const banners = [...document.querySelectorAll(".banner")].map((b) =>
      (b.textContent || "").trim(),
    );
    return (
      banners.find((t) =>
        /upload a photo that clearly shows|relevant photo/i.test(t),
      ) ||
      banners[0] ||
      ""
    );
  });
  if (!/upload a photo that clearly shows|relevant/i.test(tipBefore)) {
    throw new Error(`Expected proactive relevant-upload tip, got: ${tipBefore}`);
  }

  const input = await page.$('input[type="file"]');
  await input.uploadFile(texturePath);
  await page.waitForFunction(
    () =>
      [...document.querySelectorAll("button")].some((b) =>
        /identify with ai/i.test(b.textContent || ""),
      ),
    { timeout: 10000 },
  );
  await page.evaluate(() => {
    [...document.querySelectorAll("button")]
      .find((b) => /identify with ai/i.test(b.textContent || ""))
      ?.click();
  });

  await page.waitForSelector(".banner--warn", { timeout: 120000 });
  const warn = await page.evaluate(() => {
    const el = document.querySelector(".banner--warn");
    const text = (el?.textContent || "").trim();
    const hasUploadAnother = [...document.querySelectorAll("button")].some((b) =>
      /upload another image/i.test(b.textContent || ""),
    );
    return { text, hasUploadAnother };
  });
  await page.screenshot({ path: join(outDir, "identify-cant-analyse.png") });

  if (!/can.?t analyse|can.?t analyze/i.test(warn.text)) {
    throw new Error(`Expected cant-analyse title, got: ${warn.text}`);
  }
  if (!/upload a relevant|please upload/i.test(warn.text)) {
    throw new Error(`Expected re-upload advice, got: ${warn.text}`);
  }
  if (!warn.hasUploadAnother) {
    throw new Error("Expected Upload another image CTA");
  }

  console.log(
    JSON.stringify(
      {
        tipBefore: tipBefore.slice(0, 140),
        unclearTitle: true,
        reuploadAdvice: true,
        uploadAnotherCta: warn.hasUploadAnother,
      },
      null,
      2,
    ),
  );
} catch (err) {
  await page.screenshot({ path: join(outDir, "identify-reupload-error.png") }).catch(() => {});
  console.error(err);
  process.exitCode = 1;
} finally {
  await browser.close();
}
