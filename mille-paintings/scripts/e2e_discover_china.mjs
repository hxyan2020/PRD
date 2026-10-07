/**
 * Smoke-test discover for China + shan shui: relevance + image reachability.
 */
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')

// Import compiled? We run via vite-node-less dynamic import of TS through a tiny harness.
// Use playwright-less fetch against the live modules by evaluating after bundling is hard.
// Instead, call the public APIs by spawning a short esbuild-free dynamic import via tsx if available,
// else use a duplicated lightweight check against Commons + the built module.

async function main() {
  let discoverPaintings
  let preferenceSearchQuery
  let matchesPreferences
  try {
    // Prefer tsx if present
    const { register } = await import('node:module')
    // Direct import of TS via vite SSR
    const vite = await import('vite')
    const server = await vite.createServer({
      root,
      server: { middlewareMode: true },
      appType: 'custom',
    })
    const mod = await server.ssrLoadModule('/src/lib/discover.ts')
    discoverPaintings = mod.discoverPaintings
    preferenceSearchQuery = mod.preferenceSearchQuery
    matchesPreferences = mod.matchesPreferences
    await server.close()
  } catch (err) {
    console.error('Failed to load discover module via Vite SSR:', err)
    process.exit(1)
  }

  const prefs = {
    genres: ['shan shui'],
    countries: ['China'],
    eras: [],
    moods: [],
  }
  const query = preferenceSearchQuery(prefs)
  console.log('QUERY:', query)

  const westernHints = [
    'hopper',
    'seurat',
    'caillebotte',
    'shirlaw',
    'nighthawks',
    'grande jatte',
    'paris street',
    'crucifixion',
    'austrian',
    'american',
    'french',
  ]

  const results = await discoverPaintings(prefs, new Set(), (p) => {
    if (p.phase === 'searching' || p.phase === 'done') {
      const step = p.steps.find((s) => s.status === 'running' || s.status === 'ok' || s.status === 'empty' || s.status === 'error')
      // quiet progress
    }
  })

  console.log('COUNT:', results.length)
  const westernLeak = results.filter((r) => {
    const blob = `${r.name} ${r.painter} ${r.painterCountry} ${r.genre} ${r.intro}`.toLowerCase()
    return westernHints.some((h) => blob.includes(h)) && !/china|chinese|shan|山水/.test(blob)
  })
  console.log('WESTERN_LEAK:', westernLeak.length, westernLeak.map((r) => r.name).slice(0, 5))

  let imagesOk = 0
  let imagesFail = 0
  for (const r of results.slice(0, 12)) {
    const url = r.image
    try {
      const res = await fetch(url, {
        method: 'GET',
        headers: { 'User-Agent': 'MillePaintings-e2e/1.0', Referer: '' },
        redirect: 'follow',
        signal: AbortSignal.timeout(12000),
      })
      const ct = res.headers.get('content-type') || ''
      const ok = res.ok && /image|octet-stream/i.test(ct)
      if (ok) imagesOk++
      else {
        imagesFail++
        console.log('IMG_FAIL', r.name, res.status, ct, url.slice(0, 100))
      }
    } catch (e) {
      imagesFail++
      console.log('IMG_ERR', r.name, String(e).slice(0, 120))
    }
    console.log('-', r.name, '|', r.painter, '|', r.painterCountry, '|', r.genre)
  }

  const allMatch = results.every((r) => matchesPreferences(r, prefs))
  console.log('ALL_MATCH_PREFS:', allMatch)
  console.log('IMAGES_OK:', imagesOk, 'IMAGES_FAIL:', imagesFail)

  const pass =
    results.length >= 3 &&
    westernLeak.length === 0 &&
    allMatch &&
    imagesOk >= Math.min(3, results.length) &&
    imagesFail === 0

  console.log(pass ? 'PASS' : 'FAIL')
  process.exit(pass ? 0 : 1)
}

main()
