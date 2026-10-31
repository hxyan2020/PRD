import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const BASE = process.env.BASE_URL || 'http://127.0.0.1:5173/';
const OUT = '/opt/cursor/artifacts';

async function shot(page, name) {
  await page.screenshot({ path: `${OUT}/${name}`, fullPage: false });
  console.log('saved', name);
}

async function openMenu(page) {
  await page.getByRole('button', { name: '打开菜单' }).click();
  await page.waitForTimeout(350);
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  await shot(page, 'mobile-overview.png');

  await openMenu(page);
  await shot(page, 'mobile-drawer-menu.png');

  await page.getByRole('menuitem', { name: '价格管理' }).click();
  await page.waitForTimeout(250);
  await page.getByRole('menuitem', { name: '行情源' }).click();
  await page.waitForTimeout(500);
  await shot(page, 'mobile-market-source.png');

  await openMenu(page);
  await page.getByRole('menuitem', { name: '监控告警' }).click();
  await page.waitForTimeout(250);
  await page.getByRole('menuitem', { name: '档位深度监控' }).click();
  await page.waitForTimeout(500);
  await shot(page, 'mobile-depth-monitor.png');

  await page.getByRole('tab', { name: '监控配置' }).click();
  await page.waitForTimeout(300);
  await page.getByRole('button', { name: '增加监控' }).click();
  await page.waitForTimeout(400);
  await shot(page, 'mobile-depth-modal.png');

  // Desktop sanity: sider still present
  const desk = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const dpage = await desk.newPage();
  await dpage.goto(BASE, { waitUntil: 'networkidle' });
  await dpage.waitForTimeout(500);
  await dpage.screenshot({ path: `${OUT}/desktop-overview-after-mobile.png`, fullPage: false });
  console.log('saved desktop-overview-after-mobile.png');

  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
