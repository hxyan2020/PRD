import { chromium } from 'playwright';
import { mkdirSync } from 'fs';

const outDir = '/opt/cursor/artifacts';
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto('http://127.0.0.1:5173', { waitUntil: 'networkidle' });

await page.getByRole('menuitem', { name: 'Index Price', exact: true }).click();
await page.waitForTimeout(400);

await page.getByRole('button', { name: '添加' }).click();
const modal = page.getByRole('dialog', { name: '新增指数价格' });
await modal.waitFor();
await page.waitForTimeout(400);
await page.screenshot({ path: `${outDir}/index-price-add-top.png` });

await modal.getByText('放大倍数', { exact: false }).first().scrollIntoViewIfNeeded();
await page.waitForTimeout(200);
await page.screenshot({ path: `${outDir}/index-price-magnification.png` });

await page.locator('.ant-modal-body').evaluate((el) => {
  el.scrollTop = el.scrollHeight;
});
await page.waitForTimeout(300);
await page.screenshot({ path: `${outDir}/index-price-add-bottom.png` });

const marketSourceLabels = await modal.locator('.ant-form-item-label').filter({ hasText: /^行情源/ }).count();
const checkboxGroups = await modal.locator('.ant-checkbox-group').count();
console.log('行情源 form labels:', marketSourceLabels);
console.log('checkbox groups:', checkboxGroups);

await browser.close();
