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
await page.getByRole('menuitem', { name: '内部资金费率监控', exact: true }).click();
await page.waitForTimeout(500);
await page.screenshot({ path: `${outDir}/internal-funding-rate-records.png`, fullPage: true });

await page.getByRole('tab', { name: '监控配置' }).click();
await page.waitForTimeout(400);
await page.screenshot({ path: `${outDir}/internal-funding-rate-config.png`, fullPage: true });

await page.getByRole('button', { name: '增加监控' }).click();
await page.getByText('新增 - 监控配置').waitFor();
await page.waitForTimeout(300);
await page.screenshot({ path: `${outDir}/internal-funding-rate-add-modal.png` });

await browser.close();
console.log('internal funding rate screenshots saved');
