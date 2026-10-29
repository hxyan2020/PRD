#!/usr/bin/env node
/**
 * Rebuilds public/pair-launch-params.html from launchRecommendations.ts
 * (parsed as a simple object literal — keep the export shape stable).
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const src = fs.readFileSync(path.join(root, 'src/config/launchRecommendations.ts'), 'utf8')

// Extract object body of LAUNCH_RECOMMENDATIONS
const start = src.indexOf('export const LAUNCH_RECOMMENDATIONS')
const brace = src.indexOf('{', start)
let depth = 0
let end = brace
for (let i = brace; i < src.length; i++) {
  if (src[i] === '{') depth++
  if (src[i] === '}') {
    depth--
    if (depth === 0) {
      end = i
      break
    }
  }
}
const body = src.slice(brace, end + 1)
// Convert TS object to JSON-ish via Function (keys may be unquoted Chinese)
const rows = []
const keyRe = /(?:^|,)\s*(?:'([^']+)'|"([^"]+)"|([A-Za-z0-9_\u4e00-\u9fff ()%/-]+))\s*:\s*\{/g
let m
const slices = []
while ((m = keyRe.exec(body))) {
  slices.push({ key: m[1] || m[2] || m[3], index: m.index + m[0].length - 1 })
}
for (let i = 0; i < slices.length; i++) {
  const key = slices[i].key
  const from = slices[i].index
  const to = i + 1 < slices.length ? slices[i + 1].index : body.lastIndexOf('}')
  // find matching close for this object
  let d = 0
  let close = from
  for (let j = from; j < body.length; j++) {
    if (body[j] === '{') d++
    if (body[j] === '}') {
      d--
      if (d === 0) {
        close = j
        break
      }
    }
  }
  const objSrc = body.slice(from, close + 1)
  const get = (field) => {
    const r = new RegExp(`${field}:\\s*'([^']*)'`)
    const mm = objSrc.match(r)
    return mm ? mm[1] : ''
  }
  rows.push({
    nameZh: key,
    module: get('module') || 'common',
    oldParam: get('oldParam') || '—',
    xauRec: get('xauRec') || '—',
    btcRec: get('btcRec') || '—',
    reason: get('reason') || '—',
  })
}

const modLabel = { price: 'Price 价格', risk: 'Risk 风控', alert: 'Alert 告警', mm: 'MM 做市', common: 'Common' }

const sheetRows = rows
  .map(
    (f) => `      <tr>
        <td><span class="mod ${f.module === 'price' ? '' : f.module}">${modLabel[f.module] || f.module}</span></td>
        <td><strong>${escapeHtml(f.nameZh)}</strong></td>
        <td>${escapeHtml(f.oldParam)}</td>
        <td><code>${escapeHtml(f.xauRec)}</code></td>
        <td><code>${escapeHtml(f.btcRec)}</code></td>
        <td>${escapeHtml(f.reason)}</td>
      </tr>`,
  )
  .join('\n')

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>XAUUSD / BTCUSD 首发参数建议 | V-Exchange</title>
  <style>
    :root { --bg:#f5f7fb; --card:#fff; --ink:#1f2329; --muted:#646a73; --line:#e5e6eb; --blue:#1677ff; --green:#389e0d; }
    * { box-sizing: border-box; }
    body { margin:0; font-family:"PingFang SC","Noto Sans SC","Segoe UI",sans-serif; background:linear-gradient(180deg,#eef3ff 0%,var(--bg) 40%); color:var(--ink); line-height:1.55; }
    .wrap { max-width:1200px; margin:0 auto; padding:32px 20px 64px; }
    h1 { font-size:28px; margin:0 0 8px; }
    .sub { color:var(--muted); margin-bottom:20px; }
    .note { background:#fffbe6; border:1px solid #ffe58f; padding:10px 12px; border-radius:8px; margin-bottom:16px; font-size:13px; }
    table { width:100%; border-collapse:collapse; font-size:13px; background:var(--card); }
    th, td { border:1px solid var(--line); padding:10px 8px; vertical-align:top; text-align:left; }
    th { background:#f0f5ff; position:sticky; top:0; z-index:1; }
    tr:nth-child(even) td { background:#fafbff; }
    .mod { display:inline-block; padding:2px 8px; border-radius:999px; background:#e6f4ff; color:#0958d9; font-size:12px; }
    .mod.risk { background:#fff1f0; color:#cf1322; }
    .mod.alert { background:#fff7e6; color:#d46b08; }
    .mod.mm { background:#f6ffed; color:var(--green); }
    code { background:#f5f5f5; padding:1px 4px; border-radius:4px; }
    a { color:var(--blue); }
    .count { color:var(--muted); font-size:13px; margin-bottom:12px; }
  </style>
</head>
<body>
  <div class="wrap">
    <h1>XAUUSD / BTCUSD 首发参数建议表</h1>
    <p class="sub">
      Old (from admin screenshots / mock) → recommended launch values, with short reasons.
      Same tips appear on admin field <code>?</code> tooltips (green icon = has launch tip).
      Related: <a href="./alarm-list.html">告警清单 &amp; SOP</a>
    </p>
    <div class="note">
      <strong>How to use:</strong> For each field under Price / Risk / Alert / MM, set XAU_USD and BTC_USD to the recommended values before public launch, then tighten after 1–2 weeks of live volume.
    </div>
    <p class="count">${rows.length} launch fields · synced from <code>src/config/launchRecommendations.ts</code></p>
    <table>
      <thead>
        <tr>
          <th>模块 Module</th>
          <th>字段 Field</th>
          <th>旧参数 Old</th>
          <th>XAUUSD 建议</th>
          <th>BTCUSD 建议</th>
          <th>推荐原因 Reason</th>
        </tr>
      </thead>
      <tbody>
${sheetRows}
      </tbody>
    </table>
  </div>
</body>
</html>
`

fs.writeFileSync(path.join(root, 'public/pair-launch-params.html'), html)
console.log('synced pair-launch-params.html with', rows.length, 'rows')
