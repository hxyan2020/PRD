/**
 * Live cloud sync round-trip using a GitHub token (gh auth token / GH_TOKEN).
 */
import { chromium } from 'playwright-core'
import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const BASE = process.env.OWNLAB_URL || 'http://127.0.0.1:4173/PRD/ownlab/'
const OUT = process.env.ARTIFACT_DIR || '/opt/cursor/artifacts'
fs.mkdirSync(OUT, { recursive: true })

const token =
  process.env.GH_TOKEN?.trim() ||
  execSync('gh auth token', { encoding: 'utf8' }).trim()
if (!token) {
  console.error('No GitHub token available')
  process.exit(2)
}

function chromePath() {
  return (
    process.env.PLAYWRIGHT_CHROMIUM_PATH ||
    [
      '/home/ubuntu/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome',
      '/home/ubuntu/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome',
    ].find((p) => fs.existsSync(p))
  )
}

async function wipeNotebook(page, { keepGist = false } = {}) {
  await page.evaluate(async (keep) => {
    for (const key of Object.keys(localStorage)) {
      if (!key.startsWith('ownlab-notebook')) continue
      if (keep && key.includes('gist')) continue
      localStorage.removeItem(key)
    }
    await new Promise((resolve) => {
      const req = indexedDB.deleteDatabase('ownlab-notebook-db')
      req.onsuccess = () => resolve()
      req.onerror = () => resolve()
      req.onblocked = () => resolve()
    })
  }, keepGist)
}

const browser = await chromium.launch({ executablePath: chromePath(), headless: true })
const page = await browser.newPage()
const errors = []
page.on('pageerror', (e) => errors.push(String(e)))

await page.goto(`${BASE}#/notebook`, { waitUntil: 'networkidle' })
await wipeNotebook(page)
await page.reload({ waitUntil: 'networkidle' })
await page.waitForSelector('.notebook-composer .rte-editor')

const stamp = `Cloud API ${Date.now()}`
await page.locator('.notebook-composer .rte-editor').click()
await page.keyboard.type(stamp)
await page.getByRole('button', { name: 'Add note' }).click()
await page.waitForSelector('.notebook-timeline .notebook-entry')

await page.getByRole('tab', { name: 'Backup' }).click()
await page.waitForSelector('.notebook-backup')
await page.locator('.notebook-backup input[type="password"]').fill(token)
await page.getByRole('button', { name: 'Enable cloud sync' }).click()
await page.waitForFunction(
  () => {
    const s = document.querySelector('.notebook-recover-status')
    return Boolean(s && /Cloud sync on|云同步已开启/i.test(s.textContent || ''))
  },
  null,
  { timeout: 25000 },
)
const enableStatus = await page.locator('.notebook-recover-status').textContent()
const gistId = await page.locator('.notebook-backup input[type="text"]').inputValue()
await page.screenshot({ path: path.join(OUT, 'cloud-sync-enabled.png'), fullPage: true })

// Simulate a fresh device: wipe local notes + cloud settings, then reconnect.
await wipeNotebook(page, { keepGist: false })
await page.reload({ waitUntil: 'networkidle' })
await page.getByRole('tab', { name: 'Backup' }).click()
await page.waitForSelector('.notebook-backup')
await page.locator('.notebook-backup input[type="password"]').fill(token)
await page.locator('.notebook-backup input[type="text"]').fill(gistId)
await page.getByRole('button', { name: 'Connect this device' }).click()
await page.waitForFunction(
  () => {
    const s = document.querySelector('.notebook-recover-status')
    return Boolean(s && /Connected|已连接/i.test(s.textContent || ''))
  },
  null,
  { timeout: 25000 },
)
await page.getByRole('tab', { name: /Notes/ }).click()
await page.waitForSelector('.notebook-timeline .notebook-entry', { timeout: 8000 })
const restored = await page.evaluate(
  (text) =>
    Array.from(document.querySelectorAll('.notebook-timeline .notebook-entry')).some((el) =>
      el.textContent?.includes(text),
    ),
  stamp,
)
await page.screenshot({ path: path.join(OUT, 'cloud-sync-connected.png'), fullPage: true })

const summary = { enableStatus, gistId, restored, pageErrors: errors }
fs.writeFileSync(path.join(OUT, 'cloud-sync-api.json'), JSON.stringify(summary, null, 2))
console.log(JSON.stringify(summary, null, 2))
await browser.close()
process.exit(restored && errors.length === 0 ? 0 : 1)
