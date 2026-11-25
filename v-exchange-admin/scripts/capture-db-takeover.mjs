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

await page.getByRole('menuitem', { name: 'DB接仓账户管理', exact: true }).click();
await page.waitForTimeout(500);
await page.screenshot({ path: `${outDir}/db-takeover-account-full.png`, fullPage: true });

await browser.close();
console.log('DB takeover account screenshot saved');
