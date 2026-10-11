#!/usr/bin/env node
/** Review optimized intros across every supported UI language. */
import fs from 'node:fs'
import puppeteer from 'puppeteer-core'

const BASE = process.env.MILLE_BASE || 'http://127.0.0.1:4173/PRD/mille/'
const OUT = process.env.OUT_JSON || '/opt/cursor/artifacts/intro-all-langs-report.json'
const PAINTING = process.env.PAINTING_ID || 'Q325981'

const LANGS = [
  'en', 'zh', 'zh-TW', 'es', 'fr', 'de', 'pt', 'pt-BR', 'it', 'ru', 'ja', 'ko',
  'ar', 'hi', 'bn', 'ur', 'fa', 'tr', 'id', 'ms', 'vi', 'th', 'fil', 'nl', 'pl',
  'uk', 'ro', 'cs', 'el', 'hu', 'sv', 'da', 'fi', 'no', 'he',
]

const EN_MARKERS = [
  'The Family Reunion or Portraits of the Family',
  'oil-on-canvas painting executed in 1867',
]

const browser = await puppeteer.launch({
  headless: true,
  executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome-stable',
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
})
const page = await browser.newPage()
await page.setViewport({ width: 1280, height: 900 })

const report = { painting: PAINTING, langs: {}, summary: {} }

for (const lang of LANGS) {
  await page.goto(`${BASE}#/painting/${PAINTING}`, { waitUntil: 'networkidle0', timeout: 90000 })
  await page.evaluate((code) => localStorage.setItem('mille.lang', code), lang)
  await page.reload({ waitUntil: 'networkidle0', timeout: 90000 })

  // Localization may pull Wikipedia + MinT; wait until about text stabilizes.
  let about = ''
  let stable = 0
  let last = ''
  for (let i = 0; i < 40; i++) {
    await new Promise((r) => setTimeout(r, 750))
    about = await page.evaluate(() => {
      const blocks = [...document.querySelectorAll('.detail-block')]
      return blocks[0]?.querySelector('p')?.textContent?.trim() || ''
    })
    if (about && about === last && about.length >= 80) {
      stable += 1
      if (stable >= 2) break
    } else {
      stable = 0
    }
    last = about
  }

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
        (t) =>
          t.includes('high-resolution') ||
          t.includes('haute résolution') ||
          t.includes('高清') ||
          t.includes('alta resolución'),
      ),
      name: document.querySelector('h1')?.textContent?.trim() || '',
    }
  })

  const englishLead = EN_MARKERS.some((m) => info.sample.includes(m) || about.includes(m))
  const ok =
    lang === 'en'
      ? info.introLen >= 280 && englishLead && !info.hiRes
      : info.introLen >= 80 && !englishLead && !info.hiRes

  report.langs[lang] = { ...info, englishLead, ok }
  console.log(
    `${ok ? 'OK ' : 'FAIL'} ${lang.padEnd(6)} len=${String(info.introLen).padStart(4)} en=${englishLead} ${info.sample.slice(0, 70)}`,
  )
}

const values = Object.values(report.langs)
report.summary = {
  total: values.length,
  passed: values.filter((v) => v.ok).length,
  failed: values.filter((v) => !v.ok).map((_, i) => LANGS[i]).filter((lang) => !report.langs[lang].ok),
  hiResGone: values.every((v) => !v.hiRes),
}
// Fix failed list properly
report.summary.failed = LANGS.filter((lang) => !report.langs[lang].ok)

fs.writeFileSync(OUT, JSON.stringify(report, null, 2))
console.log(JSON.stringify(report.summary, null, 2))
await browser.close()
process.exit(report.summary.failed.length === 0 ? 0 : 1)
