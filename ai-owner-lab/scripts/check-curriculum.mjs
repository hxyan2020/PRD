import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

// Bundle-free check: parse exported day numbers via dynamic import after ts compile is heavy.
// Instead, assert source files contain Day 1–30 uniquely by scanning `day: N`.

function collectDays(file) {
  const text = readFileSync(join(root, file), 'utf8')
  return [...text.matchAll(/\bday:\s*(\d+)/g)].map((m) => Number(m[1]))
}

function assertThirty(label, days) {
  const unique = new Set(days)
  const missing = []
  for (let i = 1; i <= 30; i++) {
    if (!unique.has(i)) missing.push(i)
  }
  const duplicates = days.filter((d, i) => days.indexOf(d) !== i)
  if (missing.length || duplicates.length || days.length !== 30) {
    console.error(`${label} check failed`, { days: days.length, missing, duplicates })
    process.exit(1)
  }
  console.log(`${label} check passed: 30 unique days (1–30).`)
}

const curriculumDays = [
  'src/data/curriculum-week1.ts',
  'src/data/curriculum-week2.ts',
  'src/data/curriculum-week3.ts',
  'src/data/curriculum-week4.ts',
].flatMap(collectDays)

assertThirty('Curriculum', curriculumDays)
assertThirty('Visuals', collectDays('src/data/visuals.ts'))
assertThirty('Visual flowcharts', collectDays('src/data/visualFlowcharts.ts'))
const flowchartZh = readFileSync(join(root, 'src/data/zh/visualFlowcharts.ts'), 'utf8')
assertThirty(
  'Visual flowcharts ZH',
  [...flowchartZh.matchAll(/^\s*(\d+)\s*:\s*\{/gm)].map((m) => Number(m[1])),
)

const prodText = readFileSync(join(root, 'src/data/productionExamples.ts'), 'utf8')
const prodDays = [...prodText.matchAll(/^\s*(\d+)\s*:\s*\{/gm)].map((m) => Number(m[1]))
assertThirty('Production examples', prodDays)

assertThirty('Curriculum ZH', collectDays('src/data/zh/curriculum.ts'))
const prodZh = readFileSync(join(root, 'src/data/zh/productionExamples.ts'), 'utf8')
assertThirty(
  'Production examples ZH',
  [...prodZh.matchAll(/^\s*(\d+)\s*:\s*\{/gm)].map((m) => Number(m[1])),
)
