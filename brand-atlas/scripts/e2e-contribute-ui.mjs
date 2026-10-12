#!/usr/bin/env node
import puppeteer from "puppeteer-core";
import { writeFileSync } from "node:fs";

const BASE = process.env.SEEN_BASE || "http://localhost:4175/PRD/brand-atlas/";
const CHROME = process.env.CHROME_PATH || "/usr/bin/google-chrome";

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ["--no-sandbox", "--disable-gpu", "--window-size=1440,1100"],
});

try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1100 });
  await page.goto(BASE, { waitUntil: "domcontentloaded" });
  await page.evaluate(() => localStorage.clear());

  // --- Trees: add new Kauri ---
  await page.goto(`${BASE}#/catalog/trees`, { waitUntil: "networkidle0", timeout: 60000 });
  await page.waitForSelector("#contribute-title", { timeout: 20000 });
  const before = await page.$eval(".progress-panel", (el) => el.textContent?.replace(/\s+/g, " ").trim());
  const fileInput = await page.$('.contribute-panel input[type="file"]');
  await fileInput.uploadFile("/opt/cursor/artifacts/sample-tree.png");
  await page.type("#contrib-name-trees", "Kauri");
  await page.click(".contribute-panel__form .btn--primary");
  await page.waitForFunction(
    () => Boolean(document.querySelector(".contribute-panel .banner--ok, .contribute-panel .banner--warn")),
    { timeout: 90000 },
  );
  // Celebrate modal may be open — close it
  await page.evaluate(() => {
    const btn = [...document.querySelectorAll("button")].find((b) => /keep exploring|close|got it/i.test(b.textContent || ""));
    btn?.click();
    document.querySelector(".celebrate")?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
  await page.waitForTimeout?.(500);
  const treeAccept = await page.evaluate(() => ({
    ok: document.querySelector(".contribute-panel .banner--ok")?.textContent?.trim() || null,
    warn: document.querySelector(".contribute-panel .banner--warn")?.textContent?.trim() || null,
    progress: document.querySelector(".progress-panel")?.textContent?.replace(/\s+/g, " ").trim() || null,
    contribCount: document.querySelectorAll(".contribute-panel__list li").length,
  }));
  await page.screenshot({ path: "/opt/cursor/artifacts/e2e-trees-kauri.png", fullPage: false });
  console.log("before", before, "treeAccept", treeAccept);

  // --- Trees: reject Toyota ---
  await page.goto(`${BASE}#/catalog/trees`, { waitUntil: "networkidle0", timeout: 60000 });
  await page.waitForSelector("#contribute-title");
  const fileInput2 = await page.$('.contribute-panel input[type="file"]');
  await fileInput2.uploadFile("/opt/cursor/artifacts/sample-car.png");
  await page.type("#contrib-name-trees", "Toyota");
  await page.click(".contribute-panel__form .btn--primary");
  await page.waitForFunction(
    () => Boolean(document.querySelector(".contribute-panel .banner--warn, .contribute-panel .banner--ok")),
    { timeout: 60000 },
  );
  const treeReject = await page.evaluate(() => ({
    ok: document.querySelector(".contribute-panel .banner--ok")?.textContent?.trim() || null,
    warn: document.querySelector(".contribute-panel .banner--warn")?.textContent?.trim() || null,
  }));
  await page.screenshot({ path: "/opt/cursor/artifacts/e2e-trees-toyota-reject.png", fullPage: false });
  console.log("treeReject", treeReject);

  // --- Cars resource pack: India ---
  await page.goto(`${BASE}#/catalog/cars`, { waitUntil: "networkidle0", timeout: 60000 });
  await page.waitForSelector("#resource-pack-title");
  const carsBefore = await page.$eval(".progress-panel", (el) => el.textContent?.replace(/\s+/g, " ").trim());
  await page.evaluate(() => {
    const pills = [...document.querySelectorAll(".resource-pack .pill")];
    pills.find((p) => p.textContent?.trim() === "India")?.click();
  });
  await page.click(".resource-pack__actions .btn--primary");
  await page.waitForFunction(
    () => Boolean(document.querySelector(".resource-pack__preview, .resource-pack .banner--ok, .resource-pack .banner--warn")),
    { timeout: 90000 },
  );
  const packState = await page.evaluate(() => ({
    previewCount: document.querySelectorAll(".resource-pack__preview li").length,
    status: (document.querySelector(".resource-pack .banner--ok, .resource-pack .banner--warn")?.textContent || "").trim().slice(0, 220),
  }));
  if (packState.previewCount > 0) {
    await page.click(".resource-pack__actions .btn--forest");
    await new Promise((r) => setTimeout(r, 800));
  }
  const afterPack = await page.evaluate(() => ({
    progress: document.querySelector(".progress-panel")?.textContent?.replace(/\s+/g, " ").trim() || null,
    installed: document.querySelectorAll(".resource-pack__installed li").length,
  }));
  await page.screenshot({ path: "/opt/cursor/artifacts/e2e-cars-india-pack.png", fullPage: false });
  console.log("carsBefore", carsBefore, "packState", packState, "afterPack", afterPack);

  const report = { before, treeAccept, treeReject, carsBefore, packState, afterPack };
  writeFileSync("/opt/cursor/artifacts/e2e-contribute-ui.json", JSON.stringify(report, null, 2));

  if (!treeAccept.ok || !/Accepted|added|unlocked/i.test(treeAccept.ok)) {
    throw new Error(`Kauri contribute failed: ${JSON.stringify(treeAccept)}`);
  }
  if (!treeReject.warn || treeReject.ok) {
    throw new Error(`Toyota on trees should be rejected: ${JSON.stringify(treeReject)}`);
  }
  console.log("OK e2e contribute accept/reject + resource pack");
} finally {
  await browser.close();
}
