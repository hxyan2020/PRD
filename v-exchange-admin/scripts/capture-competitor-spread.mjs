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
await page.getByRole('menuitem', { name: '友商价差监控', exact: true }).click();
await page.waitForTimeout(500);
await page.screenshot({ path: `${outDir}/competitor-spread-records.png`, fullPage: true });

await page.getByRole('tab', { name: '监控配置' }).click();
await page.waitForTimeout(400);
await page.screenshot({ path: `${outDir}/competitor-spread-config.png`, fullPage: true });

await page.getByRole('button', { name: '增加监控' }).click();
await page.getByText('新增 - 监控配置').waitFor();
const modal = page.locator('.ant-modal').filter({ hasText: '新增 - 监控配置' });
await modal.locator('.ant-checkbox-input').nth(0).check({ force: true });
await modal.locator('.ant-checkbox-input').nth(1).check({ force: true });
await modal.locator('.ant-checkbox-input').nth(2).check({ force: true });
await page.waitForTimeout(200);
await page.screenshot({ path: `${outDir}/competitor-spread-add-modal.png` });

await browser.close();
console.log('competitor spread screenshots saved');
