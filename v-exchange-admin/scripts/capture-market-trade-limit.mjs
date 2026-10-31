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
await page.getByRole('menuitem', { name: '市价交易限制配置', exact: true }).click();
await page.waitForTimeout(500);
await page.screenshot({ path: `${outDir}/market-trade-limit-list.png`, fullPage: true });

await page.getByRole('button', { name: '增加' }).click();
await page.getByText('新增市价交易限制').waitFor();
await page.waitForTimeout(400);
await page.screenshot({ path: `${outDir}/market-trade-limit-add-modal.png` });

await browser.close();
console.log('market trade limit screenshots saved');
