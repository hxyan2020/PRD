import { chromium } from 'playwright';
import { mkdirSync } from 'fs';

const outDir = '/opt/cursor/artifacts';
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto('http://127.0.0.1:5173', { waitUntil: 'networkidle' });

await page.getByRole('menuitem', { name: 'Index Market Link', exact: true }).click();
await page.waitForTimeout(400);
await page.screenshot({ path: `${outDir}/index-market-link-empty.png`, fullPage: true });

await page.getByRole('button', { name: '添加' }).click();
await page.getByText('新增指数映射').waitFor();
await page.waitForTimeout(400);
await page.screenshot({ path: `${outDir}/index-market-link-add-modal.png` });

await browser.close();
console.log('Index Market Link modal screenshots saved');
