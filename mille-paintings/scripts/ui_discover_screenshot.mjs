import puppeteer from 'puppeteer-core'
import fs from 'node:fs'
import path from 'node:path'

const OUT = '/opt/cursor/artifacts'
const BASE = 'http://127.0.0.1:4173/PRD/mille/'

async function main() {
  fs.mkdirSync(OUT, { recursive: true })
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome-stable',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,1600'],
    defaultViewport: { width: 1280, height: 1600 },
  })
  const page = await browser.newPage()
  page.setDefaultTimeout(180000)

  await page.goto(BASE, { waitUntil: 'networkidle0' })
  await page.evaluate(() => {
    localStorage.clear()
    localStorage.setItem(
      'mille.prefs',
      JSON.stringify({
        genres: ['shan shui'],
        countries: ['China'],
        eras: [],
        moods: [],
      }),
    )
  })

  await page.goto(`${BASE}#/preferences`, { waitUntil: 'networkidle0' })
  await page.waitForSelector('main', { timeout: 20000 })

  // Confirm chips are selected (prefs loaded from localStorage).
  await page.waitForFunction(() => {
    const genres = [...document.querySelectorAll('button.chip-genre.on')].map((b) =>
      (b.textContent || '').toLowerCase(),
    )
    const countries = [...document.querySelectorAll('button.chip-country.on')].map((b) =>
      (b.textContent || '').toLowerCase(),
    )
    return genres.some((g) => g.includes('shan')) && countries.some((c) => c.includes('china'))
  })

  await page.screenshot({ path: path.join(OUT, 'discover-prefs-selected.png'), fullPage: true })

  const started = await page.evaluate(() => {
    const btn = [...document.querySelectorAll('button.btn')].find((b) =>
      /Discover more paintings|发现更多画作/i.test(b.textContent || ''),
    )
    if (!btn) return null
    btn.scrollIntoView({ block: 'center' })
    btn.click()
    return (btn.textContent || '').trim()
  })
  console.log('START_BTN', started)
  if (!started) throw new Error('Discover button not found')

  await page.waitForSelector('.discover-status', { timeout: 15000 })

  // Wait until merge step finishes (ok/empty/error) and nothing is running.
  await page.waitForFunction(() => {
    const running = document.querySelector('.discover-step.status-running')
    if (running) return false
    const merge = [...document.querySelectorAll('.discover-step')].find((li) =>
      /Merge|合并/i.test(li.textContent || ''),
    )
    if (!merge) return false
    return (
      merge.classList.contains('status-ok') ||
      merge.classList.contains('status-empty') ||
      merge.classList.contains('status-error')
    )
  }, { timeout: 180000, polling: 1000 })

  await new Promise((r) => setTimeout(r, 5000))

  const report = await page.evaluate(async () => {
    const cards = [...document.querySelectorAll('.discover-card')]
    const western = [
      'nighthawks',
      'seurat',
      'hopper',
      'caillebotte',
      'grande jatte',
      'paris street',
      'crucifixion',
      'shirlaw',
    ]
    const items = []
    for (const card of cards.slice(0, 12)) {
      const img = card.querySelector('img')
      const title = (card.querySelector('h3')?.textContent || '').trim()
      const painter = (card.querySelector('p')?.textContent || '').trim()
      let natural = 0
      if (img) {
        try {
          if (img.decode) await img.decode()
        } catch {
          /* ignore */
        }
        natural = img.naturalWidth || 0
      }
      const fallback = !!card.querySelector('.safe-image-fallback')
      const blob = `${title} ${painter}`.toLowerCase()
      items.push({
        title,
        painter,
        naturalWidth: natural,
        fallback,
        src: img?.src?.slice(0, 120) || '',
        westernLeak: western.some((w) => blob.includes(w)),
      })
    }
    return {
      cardCount: cards.length,
      status: document.querySelector('.discover-status-msg')?.textContent || '',
      items,
    }
  })

  await page.screenshot({
    path: path.join(OUT, 'discover-china-shanshui-results.png'),
    fullPage: true,
  })
  const grid = await page.$('.discover-grid')
  if (grid) {
    await grid.screenshot({ path: path.join(OUT, 'discover-china-shanshui-grid.png') })
  }

  console.log(JSON.stringify(report, null, 2))
  fs.writeFileSync(path.join(OUT, 'discover-ui-report.json'), JSON.stringify(report, null, 2))

  const imagesOk = report.items.filter((i) => i.naturalWidth > 0 && !i.fallback).length
  const westernLeak = report.items.filter((i) => i.westernLeak).length
  const pass = report.cardCount >= 3 && imagesOk >= 3 && westernLeak === 0
  console.log('UI_PASS', pass, { imagesOk, westernLeak, cards: report.cardCount })
  await browser.close()
  process.exit(pass ? 0 : 1)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
