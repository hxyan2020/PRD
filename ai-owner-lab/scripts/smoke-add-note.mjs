/**
 * Smoke-test notebook add-note: happy path + quota-full error surfacing.
 */
import { chromium } from 'playwright-core'
import fs from 'node:fs'
import path from 'node:path'

const BASE = process.env.OWNLAB_URL || 'http://127.0.0.1:5173/PRD/ownlab/'
const OUT = process.env.ARTIFACT_DIR || '/opt/cursor/artifacts'
fs.mkdirSync(OUT, { recursive: true })

const browser = await chromium.launch({
  executablePath:
    process.env.PLAYWRIGHT_CHROMIUM_PATH ||
    [
      '/home/ubuntu/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome',
      '/home/ubuntu/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome',
    ].find((p) => fs.existsSync(p)),
  headless: true,
})

const page = await browser.newPage()
const errors = []
page.on('pageerror', (e) => errors.push(String(e)))

await page.goto(`${BASE}#/notebook`, { waitUntil: 'networkidle' })
await page.waitForSelector('.notebook-composer .rte-editor')

// Clear any existing notebook storage for a clean run.
await page.evaluate(() => {
  localStorage.removeItem('ownlab-notebook-v1')
  localStorage.removeItem('ownlab-notebook-trash-v1')
})
await page.reload({ waitUntil: 'networkidle' })
await page.waitForSelector('.notebook-composer .rte-editor')

const editor = page.locator('.notebook-composer .rte-editor')
await editor.click()
await page.keyboard.type('Add-note smoke test ' + Date.now())

const before = await page.locator('.notebook-timeline .notebook-entry').count()
await page.getByRole('button', { name: 'Add note' }).click()
await page.waitForTimeout(400)

const after = await page.locator('.notebook-timeline .notebook-entry').count()
const happy = after === before + 1
await page.screenshot({ path: path.join(OUT, 'add-note-happy.png'), fullPage: true })

// Force quota failure on next write.
await page.evaluate(() => {
  const real = Storage.prototype.setItem
  Storage.prototype.setItem = function (key, value) {
    if (String(key).startsWith('ownlab-notebook')) {
      const err = new DOMException('Quota exceeded', 'QuotaExceededError')
      throw err
    }
    return real.call(this, key, value)
  }
})

await editor.click()
await page.keyboard.type('Quota pressure note')
await page.getByRole('button', { name: 'Add note' }).click()
await page.waitForSelector('.notebook-composer-error', { timeout: 3000 })
const errText = await page.locator('.notebook-composer-error').innerText()
const quotaOk = /storage is full/i.test(errText)
await page.screenshot({ path: path.join(OUT, 'add-note-quota-error.png'), fullPage: true })

// Stale-state path: put HTML in the live editor without going through React onChange.
await page.evaluate(() => {
  const el = document.querySelector('.notebook-composer .rte-editor')
  if (!el) throw new Error('missing editor')
  el.innerHTML = '<p>Live DOM flush note ' + Date.now() + '</p>'
})
// Restore setItem for a successful save after flush.
await page.evaluate(() => {
  // Best-effort: reload prototype if we can detect patch — use a fresh page write via native.
})
// Re-open a fresh page context for flush test so storage works.
await browser.close()

const browser2 = await chromium.launch({
  executablePath:
    process.env.PLAYWRIGHT_CHROMIUM_PATH ||
    [
      '/home/ubuntu/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome',
      '/home/ubuntu/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome',
    ].find((p) => fs.existsSync(p)),
  headless: true,
})
const page2 = await browser2.newPage()
await page2.goto(`${BASE}#/notebook`, { waitUntil: 'networkidle' })
await page2.evaluate(() => {
  localStorage.removeItem('ownlab-notebook-v1')
  localStorage.removeItem('ownlab-notebook-trash-v1')
})
await page2.reload({ waitUntil: 'networkidle' })
await page2.waitForSelector('.notebook-composer .rte-editor')

// Seed React state empty, DOM full — simulate desync by setting DOM after mount
// without input events, then click Add note (flush should still save).
await page2.evaluate(() => {
  const el = document.querySelector('.notebook-composer .rte-editor')
  el.innerHTML = '<p>Flushed from live DOM ' + Date.now() + '</p>'
})
const before2 = await page2.locator('.notebook-timeline .notebook-entry').count()
await page2.getByRole('button', { name: 'Add note' }).click()
await page2.waitForTimeout(500)
const after2 = await page2.locator('.notebook-timeline .notebook-entry').count()
const flushOk = after2 === before2 + 1
await page2.screenshot({ path: path.join(OUT, 'add-note-dom-flush.png'), fullPage: true })

await browser2.close()

const report = { happy, quotaOk, flushOk, errText, pageErrors: errors }
fs.writeFileSync(path.join(OUT, 'add-note-smoke.json'), JSON.stringify(report, null, 2))
console.log(JSON.stringify(report, null, 2))
if (!happy || !quotaOk || !flushOk) process.exit(1)
