import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

// Bundle-free check: parse exported day numbers via dynamic import after ts compile is heavy.
// Instead, assert source files contain Day 1–30 uniquely by scanning `day: N`.

const files = [
  'src/data/curriculum-week1.ts',
  'src/data/curriculum-week2.ts',
  'src/data/curriculum-week3.ts',
  'src/data/curriculum-week4.ts',
]

const days = []
for (const file of files) {
  const text = readFileSync(join(root, file), 'utf8')
  for (const match of text.matchAll(/\bday:\s*(\d+)/g)) {
    days.push(Number(match[1]))
  }
}

const unique = new Set(days)
const missing = []
for (let i = 1; i <= 30; i++) {
  if (!unique.has(i)) missing.push(i)
}

const duplicates = days.filter((d, i) => days.indexOf(d) !== i)

if (missing.length || duplicates.length || days.length !== 30) {
  console.error('Curriculum check failed', { days: days.length, missing, duplicates })
  process.exit(1)
}

console.log('Curriculum check passed: 30 unique days (1–30).')
