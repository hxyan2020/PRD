import { chromium } from 'playwright';
import { mkdirSync } from 'fs';

const OUT = '/opt/cursor/artifacts';
mkdirSync(OUT, { recursive: true });

const url = 'https://hxyan2020.github.io/PRD/matching-management/#/api-open-list';

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
  userAgent:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
});
await context.addInitScript(() => {
  localStorage.setItem('mm-admin-lang', 'en');
});
const page = await context.newPage();
await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
await page.waitForTimeout(1500);

// Ensure EN if UI still shows ZH switch
const enSeg = page.getByText('EN', { exact: true }).first();
if (await enSeg.count()) {
  await enSeg.click().catch(() => {});
  await page.waitForTimeout(500);
}

const bodyText = await page.locator('.admin-page-shell').innerText().catch(() => '');
const checks = {
  titleEn: bodyText.includes('API Open'),
  uidEn: /User contract UID/i.test(bodyText),
  searchEn: bodyText.includes('Search'),
  resetEn: bodyText.includes('Reset'),
  addEn: bodyText.includes('Add'),
  emptyEn: /No data|No Data/i.test(bodyText),
  noteEn: /Whitelisted|Note:/i.test(bodyText),
  noChineseTitle: !bodyText.includes('API开放白名单'),
  noChineseQuery: !bodyText.includes('查询'),
  noChineseAdd: !/添加/.test(bodyText),
};
console.log(JSON.stringify({ bodyText: bodyText.slice(0, 800), checks }, null, 2));

await page.screenshot({ path: `${OUT}/api-open-list-en-mobile.png`, fullPage: true });

// Also desktop
const desk = await browser.newPage();
await desk.addInitScript(() => localStorage.setItem('mm-admin-lang', 'en'));
await desk.setViewportSize({ width: 1280, height: 800 });
await desk.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
await desk.waitForTimeout(1000);
await desk.screenshot({ path: `${OUT}/api-open-list-en-desktop.png`, fullPage: false });

await browser.close();
process.exit(Object.values(checks).every(Boolean) ? 0 : 2);
