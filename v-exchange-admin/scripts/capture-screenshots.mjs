import { chromium } from 'playwright';
import { mkdirSync } from 'fs';

const outDir = '/opt/cursor/artifacts';
mkdirSync(outDir, { recursive: true });

const base = 'http://127.0.0.1:5173';

async function clickMenu(page, label) {
  await page.getByRole('menuitem', { name: label, exact: true }).click();
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(base, { waitUntil: 'networkidle' });

await page.screenshot({ path: `${outDir}/admin-overview.png`, fullPage: true });

await clickMenu(page, 'Contract List');
await page.waitForTimeout(500);
await page.screenshot({ path: `${outDir}/admin-contract-list.png`, fullPage: true });

await clickMenu(page, 'Market Source');
await page.waitForTimeout(500);
await page.screenshot({ path: `${outDir}/admin-market-source.png`, fullPage: true });

await clickMenu(page, 'Index Price');
await page.waitForTimeout(500);
await page.screenshot({ path: `${outDir}/admin-index-price.png`, fullPage: true });

await clickMenu(page, 'Admin Adl');
await page.waitForTimeout(500);
await page.screenshot({ path: `${outDir}/admin-adl.png`, fullPage: true });

await browser.close();
console.log('Screenshots saved to', outDir);
