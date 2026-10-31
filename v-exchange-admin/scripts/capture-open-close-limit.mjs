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
await page.getByRole('menuitem', { name: '开平仓限制', exact: true }).click();
await page.waitForTimeout(500);
await page.screenshot({ path: `${outDir}/open-close-limit-list.png`, fullPage: true });

await page.getByRole('button', { name: '新增限制' }).click();
await page.getByText('新增限制').first().waitFor();
await page.waitForTimeout(400);
await page.screenshot({ path: `${outDir}/open-close-limit-drawer.png` });

await browser.close();
console.log('open-close limit screenshots saved');
