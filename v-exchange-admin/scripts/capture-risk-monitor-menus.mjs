import { chromium } from 'playwright';
import { mkdirSync } from 'fs';

const outDir = '/opt/cursor/artifacts';
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto('http://127.0.0.1:5173', { waitUntil: 'networkidle' });

// Scroll sidebar to risk/monitor section
await page.locator('.ant-layout-sider').evaluate((el) => {
  el.scrollTop = el.scrollHeight;
});
await page.waitForTimeout(300);

await page.getByRole('menuitem', { name: '资金费率修改', exact: true }).click();
await page.waitForTimeout(400);

await page.locator('.ant-layout-sider').evaluate((el) => {
  el.scrollTop = el.scrollHeight;
});
await page.waitForTimeout(200);
await page.screenshot({ path: `${outDir}/risk-and-monitor-menus.png`, fullPage: true });

// Confirm both are top-level submenu titles
const risk = await page.locator('.ant-menu-submenu-title').filter({ hasText: '风控管理' }).count();
const monitor = await page.locator('.ant-menu-submenu-title').filter({ hasText: '监控告警' }).count();
console.log('风控管理 top-level count:', risk);
console.log('监控告警 top-level count:', monitor);

await browser.close();
