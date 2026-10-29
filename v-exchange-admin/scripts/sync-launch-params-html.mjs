#!/usr/bin/env node
/**
 * Rebuilds public/pair-launch-params.html from launchRecommendations.ts via tsx import.
 */
import { spawnSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')

const dump = spawnSync(
  'npx',
  [
    '--yes',
    'tsx',
    '-e',
    `import { LAUNCH_RECOMMENDATIONS } from './src/config/launchRecommendations.ts'; process.stdout.write(JSON.stringify(LAUNCH_RECOMMENDATIONS))`,
  ],
  { cwd: root, encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 },
)

if (dump.status !== 0) {
  console.error(dump.stderr || dump.stdout)
  process.exit(dump.status || 1)
}

const data = JSON.parse(dump.stdout)
const rows = Object.entries(data).map(([nameZh, rec]) => ({
  nameZh,
  module: rec.module || 'common',
  oldParam: rec.oldParam || '—',
  xauRec: rec.xauRec || '—',
  btcRec: rec.btcRec || '—',
  reason: rec.reason || '—',
}))

const modLabel = {
  price: 'Price 价格',
  risk: 'Risk 风控',
  alert: 'Alert 告警',
  mm: 'MM 做市',
  common: 'Common',
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

const order = { price: 0, risk: 1, alert: 2, mm: 3, common: 4 }
rows.sort((a, b) => (order[a.module] ?? 9) - (order[b.module] ?? 9) || a.nameZh.localeCompare(b.nameZh, 'zh'))

const sheetRows = rows
  .map(
    (f) => `      <tr>
        <td><span class="mod${f.module && f.module !== 'price' ? ' ' + f.module : ''}">${modLabel[f.module] || f.module}</span></td>
        <td><strong>${escapeHtml(f.nameZh)}</strong></td>
        <td>${escapeHtml(f.oldParam)}</td>
        <td><code>${escapeHtml(f.xauRec)}</code></td>
        <td><code>${escapeHtml(f.btcRec)}</code></td>
        <td>${escapeHtml(f.reason)}</td>
      </tr>`,
  )
  .join('\n')

const byMod = rows.reduce((acc, r) => {
  acc[r.module] = (acc[r.module] || 0) + 1
  return acc
}, {})

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
    .sub { color:var(--muted); margin-bottom:16px; }
    .note { background:#fffbe6; border:1px solid #ffe58f; padding:10px 12px; border-radius:8px; margin-bottom:16px; font-size:13px; }
    .count { color:var(--muted); font-size:13px; margin-bottom:12px; }
    .panel { background:var(--card); border:1px solid var(--line); border-radius:12px; overflow:auto; }
    table { width:100%; border-collapse:collapse; font-size:13px; }
    th, td { border:1px solid var(--line); padding:10px 8px; vertical-align:top; text-align:left; }
    th { background:#f0f5ff; position:sticky; top:0; z-index:1; }
    tr:nth-child(even) td { background:#fafbff; }
    .mod { display:inline-block; padding:2px 8px; border-radius:999px; background:#e6f4ff; color:#0958d9; font-size:12px; white-space:nowrap; }
    .mod.risk { background:#fff1f0; color:#cf1322; }
    .mod.alert { background:#fff7e6; color:#d46b08; }
    .mod.mm { background:#f6ffed; color:var(--green); }
    .mod.common { background:#f5f5f5; color:#595959; }
    code { background:#f5f5f5; padding:1px 4px; border-radius:4px; word-break:break-word; }
    a { color:var(--blue); }
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
      <strong>How to use:</strong> For each field under Price / Risk / Alert / MM, set <code>XAU_USD</code> and <code>BTC_USD</code> to the recommended values before public launch, then tighten after 1–2 weeks of live volume.
    </div>
    <p class="count">
      ${rows.length} fields ·
      Price ${byMod.price || 0} ·
      Risk ${byMod.risk || 0} ·
      Alert ${byMod.alert || 0} ·
      MM ${byMod.mm || 0}
      · synced from <code>src/config/launchRecommendations.ts</code>
    </p>
    <div class="panel">
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
  </div>
</body>
</html>
`

fs.writeFileSync(path.join(root, 'public/pair-launch-params.html'), html)
console.log('synced pair-launch-params.html with', rows.length, 'rows')
