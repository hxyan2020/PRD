import { chromium } from 'playwright';
import { mkdirSync } from 'fs';

const outDir = '/opt/cursor/artifacts';
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto('http://127.0.0.1:5173', { waitUntil: 'networkidle' });

await page.locator('.ant-layout-sider').evaluate((el) => {
  el.scrollTop = el.scrollHeight;
});
await page.waitForTimeout(200);
await page.getByRole('menuitem', { name: 'DB账户告警', exact: true }).click();
await page.waitForTimeout(500);
await page.screenshot({ path: `${outDir}/db-account-alert-full.png`, fullPage: true });

const rows = await page.locator('.ant-table-tbody tr').count();
console.log('alert rows:', rows);

await browser.close();
