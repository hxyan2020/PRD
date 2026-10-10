/**
 * Smoke-test notebook add-note against IndexedDB-backed storage.
 */
import { chromium } from 'playwright-core'
import fs from 'node:fs'
import path from 'node:path'

const BASE = process.env.OWNLAB_URL || 'http://127.0.0.1:5173/PRD/ownlab/'
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
    localStorage.removeItem('ownlab-notebook-v1')
    localStorage.removeItem('ownlab-notebook-trash-v1')
    localStorage.removeItem('ownlab-notebook-categories-v1')
    localStorage.removeItem('ownlab-notebook-idb-banner-seen')
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

// --- Happy path ---
const editor = page.locator('.notebook-composer .rte-editor')
await editor.click()
await page.keyboard.type('Add-note smoke test ' + Date.now())
const before = await page.locator('.notebook-timeline .notebook-entry').count()
await page.getByRole('button', { name: 'Add note' }).click()
await page.waitForFunction(
  (n) => document.querySelectorAll('.notebook-timeline .notebook-entry').length >= n,
  before + 1,
  { timeout: 5000 },
)
const after = await page.locator('.notebook-timeline .notebook-entry').count()
const happy = after === before + 1
await page.screenshot({ path: path.join(OUT, 'add-note-happy.png'), fullPage: true })

// --- Large note that would stress old localStorage (~5MB) ---
const largeBody = 'Diagram block '.repeat(80_000) // ~1.1MB text
await editor.click()
await page.evaluate((text) => {
  const el = document.querySelector('.notebook-composer .rte-editor')
  el.innerHTML = `<p>${text}</p>`
}, largeBody)
await page.getByRole('button', { name: 'Add note' }).click()
await page.waitForTimeout(800)
const largeCount = await page.locator('.notebook-timeline .notebook-entry').count()
const largeOk = largeCount >= after + 1
const lsEntries = await page.evaluate(() => localStorage.getItem('ownlab-notebook-v1'))
const idbHasEntries = await page.evaluate(
  () =>
    new Promise((resolve, reject) => {
      const req = indexedDB.open('ownlab-notebook-db')
      req.onerror = () => reject(req.error)
      req.onsuccess = () => {
        const db = req.result
        const tx = db.transaction('kv', 'readonly')
        const get = tx.objectStore('kv').get('entries')
        get.onsuccess = () => {
          const val = get.result
          db.close()
          resolve(Array.isArray(val) && val.length > 0)
        }
        get.onerror = () => reject(get.error)
      }
    }),
)
const usesIdb = idbHasEntries && lsEntries === null
await page.screenshot({ path: path.join(OUT, 'add-note-large-idb.png'), fullPage: true })

// --- Migrate legacy localStorage ---
await clearNotebookStorage(page)
await page.evaluate(() => {
  localStorage.setItem(
    'ownlab-notebook-v1',
    JSON.stringify([
      {
        id: 'nb_legacy_1',
        createdAt: new Date().toISOString(),
        type: 'note',
        title: 'Legacy LS note',
        selectedText: '<p>Migrated from localStorage</p>',
        sourceLabel: 'Notebook',
      },
    ]),
  )
})
await page.reload({ waitUntil: 'networkidle' })
await page.waitForSelector('.notebook-composer .rte-editor')
await page.waitForTimeout(500)
const migratedVisible = await page.getByText('Legacy LS note').count()
const lsCleared = await page.evaluate(() => localStorage.getItem('ownlab-notebook-v1') === null)
const migrateOk = migratedVisible > 0 && lsCleared
await page.screenshot({ path: path.join(OUT, 'add-note-migrated.png'), fullPage: true })

// --- Live DOM flush ---
await clearNotebookStorage(page)
await page.reload({ waitUntil: 'networkidle' })
await page.waitForSelector('.notebook-composer .rte-editor')
await page.evaluate(() => {
  const el = document.querySelector('.notebook-composer .rte-editor')
  el.innerHTML = '<p>Flushed from live DOM ' + Date.now() + '</p>'
})
const before2 = await page.locator('.notebook-timeline .notebook-entry').count()
await page.getByRole('button', { name: 'Add note' }).click()
await page.waitForTimeout(500)
const after2 = await page.locator('.notebook-timeline .notebook-entry').count()
const flushOk = after2 === before2 + 1
await page.screenshot({ path: path.join(OUT, 'add-note-dom-flush.png'), fullPage: true })

await browser.close()

const report = { happy, largeOk, usesIdb, migrateOk, flushOk, pageErrors: errors }
fs.writeFileSync(path.join(OUT, 'add-note-smoke.json'), JSON.stringify(report, null, 2))
console.log(JSON.stringify(report, null, 2))
if (!happy || !largeOk || !usesIdb || !migrateOk || !flushOk) process.exit(1)
