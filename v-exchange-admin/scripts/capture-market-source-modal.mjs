import { chromium } from 'playwright';
import { mkdirSync } from 'fs';

const outDir = '/opt/cursor/artifacts';
mkdirSync(outDir, { recursive: true });
const base = 'http://127.0.0.1:5173';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(base, { waitUntil: 'networkidle' });

await page.getByRole('menuitem', { name: 'Market Source', exact: true }).click();
await page.waitForTimeout(500);

// Edit modal directly
await page.locator('.ant-table-tbody .ant-btn-primary').first().click();
await page.getByText('修改指数市场').waitFor({ timeout: 10000 });
await page.waitForTimeout(400);
await page.screenshot({ path: `${outDir}/market-source-edit-modal-top.png` });

await page.locator('.ant-modal-body').evaluate((el) => {
  el.scrollTop = el.scrollHeight;
});
await page.waitForTimeout(400);
await page.screenshot({ path: `${outDir}/market-source-edit-modal-bottom.png` });

await page.keyboard.press('Escape');
await page.waitForTimeout(300);

// Add modal full scroll bottom
await page.getByRole('button', { name: '添加' }).click();
await page.getByText('新增指数市场').waitFor();
await page.locator('.ant-modal-body').evaluate((el) => {
  el.scrollTop = el.scrollHeight;
});
await page.waitForTimeout(400);
await page.screenshot({ path: `${outDir}/market-source-add-modal-bottom.png` });

await browser.close();
console.log('Edit/add bottom screenshots saved');
