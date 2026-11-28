import * as fs from 'node:fs'
import * as OpenCC from 'opencc-js'
import { messages } from '../src/i18n/messages.ts'

const zhHant = messages['zh-Hant']
const en = messages.en
const converter = OpenCC.Converter({ from: 'tw', to: 'cn' })

const keys = Object.keys(en)
const missing = keys.filter((k) => !(k in zhHant))
console.log('en', keys.length, 'hant', Object.keys(zhHant).length, 'missing', missing.length)

const zhHans: Record<string, string> = {}
for (const k of keys) {
  const src = zhHant[k] ?? en[k]!
  let v = converter(src)
  if (k === 'hourlyReportKicker') v = 'EN + 繁中 + 简中 · 按紧急度排序'
  if (k === 'hourlyBilingualNote') v = '在顶部切换 EN／繁中／简中，可阅读同一组排序要点的另一语言。'
  if (k === 'menuLanguage') v = '语言'
  zhHans[k] = v
}

function emitDict(name: string, dict: Record<string, string>): string {
  const lines = [`const ${name}: Dict = {`]
  for (const k of keys) {
    const v = dict[k]!
    lines.push(`  ${JSON.stringify(k)}: ${JSON.stringify(v)},`)
  }
  lines.push('}')
  return lines.join('\n')
}

const out = emitDict('zhHans', zhHans)
fs.writeFileSync('/tmp/zhHans.ts.fragment', out)
fs.writeFileSync('/tmp/zhHans.json', JSON.stringify(zhHans, null, 2))
console.log('sample title', zhHans.title)
console.log('wrote /tmp/zhHans.ts.fragment bytes', out.length)
