#!/usr/bin/env node
/** Verify enriched intros + UI-language Wikipedia localization on painting pages. */
import fs from 'node:fs'
import path from 'node:path'
import puppeteer from 'puppeteer-core'

const BASE = process.env.MILLE_BASE || 'http://127.0.0.1:4173/PRD/mille/'
const OUT = process.env.OUT_JSON || '/opt/cursor/artifacts/intro-i18n-report.json'
const PAINTING = 'Q325981'
const LANGS = ['en', 'fr', 'es', 'zh', 'ko', 'it']

const browser = await puppeteer.launch({
  headless: true,
  executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome-stable',
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
})
const page = await browser.newPage()
await page.setViewport({ width: 1280, height: 900 })

const report = {}

for (const lang of LANGS) {
  await page.goto(`${BASE}#/painting/${PAINTING}`, { waitUntil: 'networkidle0', timeout: 60000 })
  await page.evaluate((code) => {
    localStorage.setItem('mille.lang', code)
  }, lang)
  await page.reload({ waitUntil: 'networkidle0', timeout: 60000 })
  // Wait for localization hint to disappear (or timeout).
  await page
    .waitForFunction(
      () => {
        const hint = document.querySelector('.localize-hint')
        return !hint || hint.offsetParent === null
      },
      { timeout: 25000 },
    )
    .catch(() => {})
  await new Promise((r) => setTimeout(r, 2500))

  const info = await page.evaluate(() => {
    const blocks = [...document.querySelectorAll('.detail-block')]
    const about = blocks[0]?.querySelector('p')?.textContent?.trim() || ''
    const buttons = [...document.querySelectorAll('a,button')].map((el) =>
      (el.textContent || '').trim().toLowerCase(),
    )
    return {
      introLen: about.length,
      sample: about.slice(0, 220),
      htmlLang: document.documentElement.lang,
      hiRes: buttons.some(
        (t) => t.includes('high-resolution') || t.includes('haute résolution') || t.includes('高清'),
      ),
      name: document.querySelector('h1')?.textContent?.trim() || '',
    }
  })

  const englishLead = info.sample.startsWith('The Family Reunion')
  report[lang] = {
    ...info,
    englishLead,
    looksLocalized:
      lang === 'en'
        ? info.introLen >= 280 && englishLead
        : lang === 'zh'
          ? info.introLen >= 160 // may fall back to EN when no zhwiki
          : !englishLead && info.introLen >= 80,
  }

  const shot = `/opt/cursor/artifacts/painting-reunion-${lang}-desc.png`
  await page.screenshot({ path: shot, fullPage: false })
}

fs.mkdirSync(path.dirname(OUT), { recursive: true })
fs.writeFileSync(OUT, JSON.stringify(report, null, 2))
console.log(JSON.stringify(report, null, 2))

const frOk = report.fr?.looksLocalized
const esOk = report.es?.looksLocalized
const enOk = report.en?.looksLocalized
const hiResGone = LANGS.every((l) => report[l] && !report[l].hiRes)
const pass = frOk && esOk && enOk && hiResGone
console.log('PASS', pass, { frOk, esOk, enOk, hiResGone })
await browser.close()
process.exit(pass ? 0 : 1)
