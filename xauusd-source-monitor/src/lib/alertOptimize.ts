/** Client-side ingest + profiling for Alert Optimize (告警优化). */

export type DataSourceKind = 'csv' | 'api' | 'json'

export type IngestedDataset = {
  id: string
  name: string
  kind: DataSourceKind
  sourceLabel: string
  fetchedAt: number
  columns: string[]
  rows: Record<string, string>[]
  rawPreview: string
  rowCount: number
  issues: string[]
}

export type ColumnProfile = {
  name: string
  nonEmpty: number
  empty: number
  unique: number
  numericCount: number
  sample: string[]
  min?: number
  max?: number
  mean?: number
}

export type ChartSpec = {
  id: string
  title: string
  kind: 'bar' | 'line'
  labels: string[]
  values: number[]
}

export type AnalysisResult = {
  readback: string[]
  charts: ChartSpec[]
  answer: string
  dataIssues: string[]
  assumptions: string[]
  reportMarkdown: string
}

export type StatusStep = {
  id: string
  label: string
  state: 'pending' | 'running' | 'done' | 'error'
  detail?: string
}

function splitCsvLine(line: string): string[] {
  const out: string[] = []
  let cur = ''
  let inQ = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]!
    if (ch === '"') {
      if (inQ && line[i + 1] === '"') {
        cur += '"'
        i++
      } else {
        inQ = !inQ
      }
      continue
    }
    if (ch === ',' && !inQ) {
      out.push(cur.trim())
      cur = ''
      continue
    }
    cur += ch
  }
  out.push(cur.trim())
  return out
}

export function parseCsvText(text: string, name: string): IngestedDataset {
  const issues: string[] = []
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).filter((l) => l.trim().length)
  if (!lines.length) {
    return {
      id: `csv_${Date.now()}`,
      name,
      kind: 'csv',
      sourceLabel: name,
      fetchedAt: Date.now(),
      columns: [],
      rows: [],
      rawPreview: text.slice(0, 400),
      rowCount: 0,
      issues: ['CSV is empty'],
    }
  }
  const header = splitCsvLine(lines[0]!)
  if (header.length < 1) issues.push('No header columns detected')
  const columns = header.map((h, i) => h || `col_${i + 1}`)
  const rows: Record<string, string>[] = []
  for (const line of lines.slice(1)) {
    const cells = splitCsvLine(line)
    if (cells.every((c) => !c)) continue
    const row: Record<string, string> = {}
    columns.forEach((c, i) => {
      row[c] = cells[i] ?? ''
    })
    rows.push(row)
  }
  if (!rows.length) issues.push('CSV has a header but no data rows')
  return {
    id: `csv_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    name,
    kind: 'csv',
    sourceLabel: name,
    fetchedAt: Date.now(),
    columns,
    rows,
    rawPreview: text.slice(0, 600),
    rowCount: rows.length,
    issues,
  }
}

export function parseJsonPayload(raw: unknown, name: string, sourceLabel: string): IngestedDataset {
  const issues: string[] = []
  let rows: Record<string, string>[] = []
  let columns: string[] = []

  const asRows = (arr: unknown[]): void => {
    const objs = arr.filter((x) => x && typeof x === 'object' && !Array.isArray(x)) as Record<
      string,
      unknown
    >[]
    if (!objs.length) {
      issues.push('JSON array has no object rows')
      return
    }
    const colSet = new Set<string>()
    for (const o of objs.slice(0, 5000)) {
      Object.keys(o).forEach((k) => colSet.add(k))
    }
    columns = [...colSet]
    rows = objs.slice(0, 5000).map((o) => {
      const row: Record<string, string> = {}
      for (const c of columns) row[c] = o[c] == null ? '' : String(o[c])
      return row
    })
  }

  if (Array.isArray(raw)) {
    asRows(raw)
  } else if (raw && typeof raw === 'object') {
    const obj = raw as Record<string, unknown>
    const listKey = ['data', 'rows', 'items', 'records', 'alerts', 'list', 'result'].find((k) =>
      Array.isArray(obj[k]),
    )
    if (listKey) {
      asRows(obj[listKey] as unknown[])
    } else {
      columns = Object.keys(obj)
      const row: Record<string, string> = {}
      for (const c of columns) row[c] = obj[c] == null ? '' : String(obj[c])
      rows = [row]
      issues.push('JSON root is a single object — treated as one row')
    }
  } else {
    issues.push('Unsupported JSON shape')
  }

  const preview =
    typeof raw === 'string' ? raw.slice(0, 600) : JSON.stringify(raw).slice(0, 600)

  return {
    id: `api_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    name,
    kind: 'api',
    sourceLabel,
    fetchedAt: Date.now(),
    columns,
    rows,
    rawPreview: preview,
    rowCount: rows.length,
    issues,
  }
}

export function profileColumns(dataset: IngestedDataset): ColumnProfile[] {
  return dataset.columns.map((name) => {
    const vals = dataset.rows.map((r) => (r[name] || '').trim())
    const nonEmpty = vals.filter(Boolean)
    const nums = nonEmpty
      .map((v) => Number(String(v).replace(/,/g, '')))
      .filter((n) => Number.isFinite(n))
    const unique = new Set(nonEmpty).size
    const profile: ColumnProfile = {
      name,
      nonEmpty: nonEmpty.length,
      empty: vals.length - nonEmpty.length,
      unique,
      numericCount: nums.length,
      sample: nonEmpty.slice(0, 5),
    }
    if (nums.length >= 2) {
      profile.min = Math.min(...nums)
      profile.max = Math.max(...nums)
      profile.mean = nums.reduce((a, b) => a + b, 0) / nums.length
    }
    return profile
  })
}

function pickChartColumns(profiles: ColumnProfile[]): ColumnProfile[] {
  return profiles
    .filter((p) => p.numericCount >= Math.max(3, Math.floor(p.nonEmpty * 0.5)))
    .sort((a, b) => b.numericCount - a.numericCount)
    .slice(0, 3)
}

export function buildCharts(datasets: IngestedDataset[]): ChartSpec[] {
  const charts: ChartSpec[] = []
  for (const ds of datasets) {
    const profiles = profileColumns(ds)
    const numeric = pickChartColumns(profiles)
    for (const col of numeric) {
      const pairs = ds.rows
        .map((r, i) => {
          const n = Number(String(r[col.name] || '').replace(/,/g, ''))
          if (!Number.isFinite(n)) return null
          const labelCol =
            ds.columns.find((c) => c !== col.name && (r[c] || '').trim()) || `#${i + 1}`
          const label = String(r[labelCol] || `#${i + 1}`).slice(0, 18)
          return { label, value: n }
        })
        .filter(Boolean) as { label: string; value: number }[]
      const sample = pairs.slice(0, 24)
      if (sample.length < 2) continue
      charts.push({
        id: `${ds.id}_${col.name}`,
        title: `${ds.name} · ${col.name}`,
        kind: sample.length >= 8 ? 'line' : 'bar',
        labels: sample.map((p) => p.label),
        values: sample.map((p) => p.value),
      })
    }
    // Category frequency for a low-cardinality string column
    const cat = profiles
      .filter((p) => p.unique >= 2 && p.unique <= 12 && p.numericCount < p.nonEmpty * 0.4)
      .sort((a, b) => a.unique - b.unique)[0]
    if (cat) {
      const counts = new Map<string, number>()
      for (const r of ds.rows) {
        const v = (r[cat.name] || '').trim() || '(empty)'
        counts.set(v, (counts.get(v) || 0) + 1)
      }
      const entries = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10)
      if (entries.length >= 2) {
        charts.push({
          id: `${ds.id}_cat_${cat.name}`,
          title: `${ds.name} · ${cat.name} (count)`,
          kind: 'bar',
          labels: entries.map(([k]) => k.slice(0, 18)),
          values: entries.map(([, v]) => v),
        })
      }
    }
  }
  return charts.slice(0, 6)
}

export function analyzeLocally(args: {
  datasets: IngestedDataset[]
  question: string
  lang: 'en' | 'zh-Hant'
}): AnalysisResult {
  const zh = args.lang !== 'en'
  const readback: string[] = []
  const dataIssues: string[] = []
  const assumptions: string[] = []

  if (!args.datasets.length) {
    dataIssues.push(zh ? '未提供任何 CSV 或 API 数据。' : 'No CSV or API data provided.')
  }

  for (const ds of args.datasets) {
    const profiles = profileColumns(ds)
    readback.push(
      zh
        ? `数据集 **${ds.name}**（${ds.kind} · ${ds.sourceLabel}）：**${ds.rowCount}** 行 × **${ds.columns.length}** 列；列：${ds.columns.slice(0, 12).join(', ')}${ds.columns.length > 12 ? '…' : ''}`
        : `Dataset **${ds.name}** (${ds.kind} · ${ds.sourceLabel}): **${ds.rowCount}** rows × **${ds.columns.length}** cols; columns: ${ds.columns.slice(0, 12).join(', ')}${ds.columns.length > 12 ? '…' : ''}`,
    )
    for (const p of profiles.slice(0, 8)) {
      if (p.empty > 0) {
        const pct = Math.round((p.empty / Math.max(1, p.empty + p.nonEmpty)) * 100)
        if (pct >= 20) {
          dataIssues.push(
            zh
              ? `${ds.name}.${p.name} 空值约 **${pct}%**（${p.empty}/${p.empty + p.nonEmpty}）`
              : `${ds.name}.${p.name} ~**${pct}%** empty (${p.empty}/${p.empty + p.nonEmpty})`,
          )
        }
      }
    }
    for (const issue of ds.issues) dataIssues.push(`${ds.name}: ${issue}`)
  }

  const charts = buildCharts(args.datasets)
  assumptions.push(
    zh
      ? 'CSV 首行视为表头；数值列按可解析数字统计；API JSON 优先取 data/rows/items 等数组字段。'
      : 'CSV first row is treated as header; numeric stats use parseable numbers; JSON prefers data/rows/items arrays.',
  )
  assumptions.push(
    zh
      ? '图表仅抽样最多 24 个点／10 个类别，用于可读性，不代表全量精确分布。'
      : 'Charts sample ≤24 points / ≤10 categories for readability — not a full-population histogram.',
  )
  if (!args.question.trim()) {
    assumptions.push(
      zh ? '未提供具体问题 — 给出数据概览与明显质量问题。' : 'No question provided — overview + data-quality notes only.',
    )
  }

  const q = args.question.trim()
  const answerParts: string[] = []
  if (q) {
    answerParts.push(
      zh
        ? `针对问题「${q.slice(0, 200)}」：基于已摄入的 **${args.datasets.length}** 个数据集（合计 **${args.datasets.reduce((n, d) => n + d.rowCount, 0)}** 行）做了结构化审阅。`
        : `For “${q.slice(0, 200)}”: reviewed **${args.datasets.length}** dataset(s) (**${args.datasets.reduce((n, d) => n + d.rowCount, 0)}** rows total).`,
    )
  } else {
    answerParts.push(
      zh
        ? '已完成数据摄入与画像。请补充具体分析问题以得到更定向的结论。'
        : 'Ingest + profiling complete. Add a concrete question for a directed conclusion.',
    )
  }

  // Heuristic keyword hooks for alert/ops language
  const blob = [
    q,
    ...args.datasets.flatMap((d) => d.columns),
    ...args.datasets.flatMap((d) => d.rows.slice(0, 20).flatMap((r) => Object.values(r))),
  ]
    .join('\n')
    .toLowerCase()

  if (/alert|告警|报警|阈值|threshold|severity|p0|p1/.test(blob)) {
    answerParts.push(
      zh
        ? '数据中出现告警／阈值相关字段。建议核对：触发条件是否过宽、是否与后管配置一致、是否存在重复告警或时钟漂移。'
        : 'Alert/threshold-like fields are present. Check: trigger width, admin-config alignment, duplicate fires, and clock skew.',
    )
  }
  if (/depth|深度|spread|价差|mark|index|funding/.test(blob)) {
    answerParts.push(
      zh
        ? '见到盘口／指数／资金费率类字段 — 优化告警时应同时看绝对阈值与相对波动（相对自身均值／友商），避免静态阈值误报。'
        : 'Book/index/funding-like fields found — prefer relative (vs own mean / peers) alongside absolute thresholds to cut false positives.',
    )
  }
  if (dataIssues.length) {
    answerParts.push(
      zh
        ? `在修复下方 **数据问题** 之前，任何阈值调参结论都应标为暂定。`
        : 'Any threshold-tuning conclusion is provisional until the **data issues** below are addressed.',
    )
  } else {
    answerParts.push(
      zh
        ? '未发现严重空值／结构问题；可在图表所示分布上进一步做分位阈值建议（需业务确认）。'
        : 'No severe emptiness/structure issues; percentile-based threshold suggestions can follow (business sign-off required).',
    )
  }

  const answer = answerParts.join('\n\n')
  const reportMarkdown = [
    zh ? '# 告警优化分析报告' : '# Alert optimization analysis',
    '',
    zh ? '## 我读到了什么' : '## What I read',
    ...readback.map((x) => `- ${x}`),
    '',
    zh ? '## 图表' : '## Charts',
    charts.length
      ? charts.map((c) => `- ${c.title}: ${c.labels.length} points (${c.kind})`).join('\n')
      : zh
        ? '- （无可绘制数值／类别列）'
        : '- (no plottable numeric/category columns)',
    '',
    zh ? '## 分析结论' : '## Answer',
    answer,
    '',
    zh ? '## 数据问题' : '## Data issues',
    ...(dataIssues.length ? dataIssues.map((x) => `- ${x}`) : [zh ? '- 无' : '- none']),
    '',
    zh ? '## 假设' : '## Assumptions',
    ...assumptions.map((x) => `- ${x}`),
    '',
    zh ? `生成时间：${new Date().toISOString()}` : `Generated: ${new Date().toISOString()}`,
  ].join('\n')

  return { readback, charts, answer, dataIssues, assumptions, reportMarkdown }
}

export function initialStatusSteps(lang: 'en' | 'zh-Hant'): StatusStep[] {
  const zh = lang !== 'en'
  return [
    { id: 'ingest', label: zh ? '摄入 CSV／API 数据' : 'Ingest CSV / API data', state: 'pending' },
    { id: 'profile', label: zh ? '画像字段与质量' : 'Profile fields & quality', state: 'pending' },
    { id: 'chart', label: zh ? '构建图表' : 'Build charts', state: 'pending' },
    { id: 'reason', label: zh ? '审阅问题并推理' : 'Review question & reason', state: 'pending' },
    { id: 'draft', label: zh ? '整理结论与假设' : 'Draft answer & assumptions', state: 'pending' },
  ]
}
