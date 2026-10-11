/**
 * Smoke-test notebook Backup tab + JSON export/import round-trip.
 */
import { chromium } from 'playwright-core'
import fs from 'node:fs'
import path from 'node:path'

const BASE = process.env.OWNLAB_URL || 'http://127.0.0.1:4173/PRD/ownlab/'
const OUT = process.env.ARTIFACT_DIR || '/opt/cursor/artifacts'
fs.mkdirSync(OUT, { recursive: true })

function chromePath() {
  return (
    process.env.PLAYWRIGHT_CHROMIUM_PATH ||
    [
      '/home/ubuntu/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome',
      '/home/ubuntu/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome',
    ].find((p) => fs.existsSync(p))
  )
}

async function clearNotebookStorage(page) {
  await page.evaluate(async () => {
    for (const key of [
      'ownlab-notebook-v1',
      'ownlab-notebook-trash-v1',
      'ownlab-notebook-categories-v1',
      'ownlab-notebook-idb-banner-seen',
      'ownlab-notebook-gist-token',
      'ownlab-notebook-gist-id',
      'ownlab-notebook-gist-enabled',
    ]) {
      localStorage.removeItem(key)
    }
    await new Promise((resolve, reject) => {
      const req = indexedDB.deleteDatabase('ownlab-notebook-db')
      req.onsuccess = () => resolve()
      req.onerror = () => reject(req.error || new Error('idb delete failed'))
      req.onblocked = () => resolve()
    })
  })
}

const browser = await chromium.launch({ executablePath: chromePath(), headless: true })
const page = await browser.newPage()
const errors = []
page.on('pageerror', (e) => errors.push(String(e)))

await page.goto(`${BASE}#/notebook`, { waitUntil: 'networkidle' })
await clearNotebookStorage(page)
await page.reload({ waitUntil: 'networkidle' })
await page.waitForSelector('.notebook-composer .rte-editor')

const stamp = `Backup smoke ${Date.now()}`
const editor = page.locator('.notebook-composer .rte-editor')
await editor.click()
await page.keyboard.type(stamp)
await page.getByRole('button', { name: 'Add note' }).click()
await page.waitForFunction(
  (text) => Array.from(document.querySelectorAll('.notebook-timeline .notebook-entry')).some((el) => el.textContent?.includes(text)),
  stamp,
  { timeout: 5000 },
)

// Cloud setup card should appear until sync is enabled
const setupVisible = await page.getByRole('heading', { name: 'Turn on cloud sync to keep new notes' }).isVisible()

await page.getByRole('tab', { name: 'Backup' }).click()
await page.waitForSelector('.notebook-backup')
const backupVisible = await page.locator('.notebook-backup').isVisible()
const cloudVisible = await page.getByRole('heading', { name: 'Cloud sync (any device)' }).isVisible()
const persistVisible = await page.getByRole('heading', { name: 'Keep browser storage' }).isVisible()
const folderVisible = await page.getByRole('heading', { name: 'Backup folder' }).isVisible()
const enableCloudVisible = await page.getByRole('button', { name: 'Enable cloud sync' }).count().then((n) => n >= 1)
const recoveryDumpVisible = await page
  .getByRole('button', { name: 'Scan & download recovery dump' })
  .isVisible()

const [download] = await Promise.all([
  page.waitForEvent('download'),
  page.getByRole('button', { name: 'Export backup' }).click(),
])
const downloadPath = path.join(OUT, 'ownlab-backup-smoke.json')
await download.saveAs(downloadPath)
const exported = JSON.parse(fs.readFileSync(downloadPath, 'utf8'))
const exportHasNote = Array.isArray(exported.entries) && exported.entries.some((e) => String(e.selectedText || '').includes(stamp))

await page.screenshot({ path: path.join(OUT, 'backup-tab.png'), fullPage: true })

// Wipe storage, then import the export
await clearNotebookStorage(page)
await page.reload({ waitUntil: 'networkidle' })
await page.getByRole('tab', { name: 'Backup' }).click()
await page.waitForSelector('.notebook-backup')
await page.locator('input[type="file"]').setInputFiles(downloadPath)
await page.waitForFunction(
  () => {
    const status = document.querySelector('.notebook-recover-status')
    return Boolean(status && /Restored|note/i.test(status.textContent || ''))
  },
  null,
  { timeout: 5000 },
)
await page.getByRole('tab', { name: /Notes/ }).click()
await page.waitForSelector('.notebook-timeline .notebook-entry', { timeout: 5000 })
const restored = await page.evaluate(
  (text) =>
    Array.from(document.querySelectorAll('.notebook-timeline .notebook-entry')).some((el) =>
      el.textContent?.includes(text),
    ),
  stamp,
)
await page.screenshot({ path: path.join(OUT, 'backup-import-restored.png'), fullPage: true })

const summary = {
  setupVisible,
  backupVisible,
  cloudVisible,
  enableCloudVisible,
  recoveryDumpVisible,
  persistVisible,
  folderVisible,
  exportHasNote,
  restored,
  pageErrors: errors,
}
fs.writeFileSync(path.join(OUT, 'backup-smoke.json'), JSON.stringify(summary, null, 2))
console.log(JSON.stringify(summary, null, 2))

const ok =
  setupVisible &&
  backupVisible &&
  cloudVisible &&
  enableCloudVisible &&
  recoveryDumpVisible &&
  persistVisible &&
  folderVisible &&
  exportHasNote &&
  restored &&
  errors.length === 0
await browser.close()
process.exit(ok ? 0 : 1)
