/** Client-side ingest + profiling for Alert Optimize / General analysis. */

/** Hard caps so large CSV/API payloads cannot OOM the desk tab. */
export const AO_LIMITS = {
  /** Max UTF-8 / string length accepted per ingest (file, paste, or API body). */
  maxBytesPerIngest: 1_500_000,
  /** Max data rows kept per dataset (header excluded). */
  maxRowsPerDataset: 5_000,
  /** Max columns kept per dataset. */
  maxColumns: 64,
  /** Max datasets in General analysis mode. */
  maxDatasetsGeneral: 8,
  /** Max datasets per Alert-optimize slot. */
  maxDatasetsPerSlot: 3,
  /** Max total rows across all datasets before analyze refuses. */
  maxTotalRows: 12_000,
  /** Cap unique alert-name dropdown options. */
  maxAlertNameOptions: 200,
} as const

export type DeskMode = 'alert_optimize' | 'general'

/** Three slots for 告警优化 (none individually required; ≥1 overall). */
export type AlertDataSlot = 'underlying' | 'alert_logs' | 'human_labels'

export type OptimizeDirectionId =
  | 'threshold'
  | 'window'
  | 'scan_freq'
  | 'unmonitored'
  | 'false_positive'
  | 'coverage'

export const OPTIMIZE_DIRECTIONS: {
  id: OptimizeDirectionId
  en: string
  zh: string
}[] = [
  { id: 'threshold', en: 'Optimize thresholds', zh: '优化阈值' },
  { id: 'window', en: 'Optimize observation window', zh: '优化观察窗口' },
  { id: 'scan_freq', en: 'Optimize scan frequency', zh: '优化扫描频率' },
  { id: 'unmonitored', en: 'Discover unmonitored risks', zh: '发现未监控风险' },
  { id: 'false_positive', en: 'Cut false positives', zh: '降低误报' },
  { id: 'coverage', en: 'Improve alert coverage', zh: '提升告警覆盖' },
]

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
  /** Present when ingested under 告警优化 slots. */
  slot?: AlertDataSlot
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

/** Reject / truncate oversized raw text before parse. Returns truncated body + issues. */
export function clampIngestText(text: string): { text: string; issues: string[]; truncated: boolean } {
  const issues: string[] = []
  if (text.length > AO_LIMITS.maxBytesPerIngest) {
    issues.push(
      `Input truncated to ${AO_LIMITS.maxBytesPerIngest.toLocaleString()} chars (was ${text.length.toLocaleString()})`,
    )
    return {
      text: text.slice(0, AO_LIMITS.maxBytesPerIngest),
      issues,
      truncated: true,
    }
  }
  return { text, issues, truncated: false }
}

function applyRowColCaps(
  columns: string[],
  rows: Record<string, string>[],
  issues: string[],
  totalCandidateRows?: number,
): { columns: string[]; rows: Record<string, string>[] } {
  let cols = columns
  let data = rows
  if (cols.length > AO_LIMITS.maxColumns) {
    issues.push(`Kept first ${AO_LIMITS.maxColumns} of ${cols.length} columns`)
    cols = cols.slice(0, AO_LIMITS.maxColumns)
    data = data.map((r) => {
      const next: Record<string, string> = {}
      for (const c of cols) next[c] = r[c] ?? ''
      return next
    })
  }
  const rawCount = totalCandidateRows ?? data.length
  if (rawCount > AO_LIMITS.maxRowsPerDataset || data.length > AO_LIMITS.maxRowsPerDataset) {
    issues.push(
      `Kept first ${AO_LIMITS.maxRowsPerDataset.toLocaleString()} of ${rawCount.toLocaleString()} rows`,
    )
    data = data.slice(0, AO_LIMITS.maxRowsPerDataset)
  }
  return { columns: cols, rows: data }
}

export function parseCsvText(text: string, name: string): IngestedDataset {
  const clamped = clampIngestText(text)
  const issues: string[] = [...clamped.issues]
  const body = clamped.text
  const lines = body.replace(/^\uFEFF/, '').split(/\r?\n/).filter((l) => l.trim().length)
  if (!lines.length) {
    return {
      id: `csv_${Date.now()}`,
      name,
      kind: 'csv',
      sourceLabel: name,
      fetchedAt: Date.now(),
      columns: [],
      rows: [],
      rawPreview: body.slice(0, 400),
      rowCount: 0,
      issues: issues.length ? issues : ['CSV is empty'],
    }
  }
  const header = splitCsvLine(lines[0]!)
  if (header.length < 1) issues.push('No header columns detected')
  let columns = header.map((h, i) => h || `col_${i + 1}`)
  const rows: Record<string, string>[] = []
  const dataLines = lines.slice(1)
  const maxScan = AO_LIMITS.maxRowsPerDataset
  let scanned = 0
  let skippedEmpty = 0
  for (const line of dataLines) {
    if (rows.length >= maxScan) break
    scanned++
    const cells = splitCsvLine(line)
    if (cells.every((c) => !c)) {
      skippedEmpty++
      continue
    }
    const row: Record<string, string> = {}
    columns.forEach((c, i) => {
      row[c] = cells[i] ?? ''
    })
    rows.push(row)
  }
  const remaining = dataLines.length - scanned
  if (remaining > 0 || dataLines.length - skippedEmpty > maxScan) {
    const totalNonEmpty = dataLines.length - skippedEmpty
    issues.push(
      `Kept first ${AO_LIMITS.maxRowsPerDataset.toLocaleString()} of ~${Math.max(totalNonEmpty, rows.length).toLocaleString()} rows`,
    )
  }
  const capped = applyRowColCaps(columns, rows, issues)
  columns = capped.columns
  const finalRows = capped.rows
  if (!finalRows.length) issues.push('CSV has a header but no data rows')
  return {
    id: `csv_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    name,
    kind: 'csv',
    sourceLabel: name,
    fetchedAt: Date.now(),
    columns,
    rows: finalRows,
    rawPreview: body.slice(0, 600),
    rowCount: finalRows.length,
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
    const total = objs.length
    const sample = objs.slice(0, AO_LIMITS.maxRowsPerDataset)
    const colSet = new Set<string>()
    for (const o of sample) {
      Object.keys(o).forEach((k) => colSet.add(k))
    }
    columns = [...colSet]
    rows = sample.map((o) => {
      const row: Record<string, string> = {}
      for (const c of columns) row[c] = o[c] == null ? '' : String(o[c]).slice(0, 4000)
      return row
    })
    if (total > AO_LIMITS.maxRowsPerDataset) {
      issues.push(
        `Kept first ${AO_LIMITS.maxRowsPerDataset.toLocaleString()} of ${total.toLocaleString()} rows`,
      )
    }
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

  const capped = applyRowColCaps(columns, rows, issues)
  let preview = ''
  try {
    preview =
      typeof raw === 'string'
        ? raw.slice(0, 600)
        : JSON.stringify(raw, (_k, v) => {
            if (Array.isArray(v) && v.length > 20) return v.slice(0, 20)
            return v
          }).slice(0, 600)
  } catch {
    preview = ''
  }

  return {
    id: `api_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    name,
    kind: 'api',
    sourceLabel,
    fetchedAt: Date.now(),
    columns: capped.columns,
    rows: capped.rows,
    rawPreview: preview,
    rowCount: capped.rows.length,
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

const ALERT_NAME_COLS =
  /^(alert[_\s-]?name|alert|rule|rule[_\s-]?name|name|告警名|告警名称|规则|规则名|metric|指标)$/i

const LABEL_VALID_COLS =
  /^(valid|is[_\s-]?valid|label|human[_\s-]?label|effective|是否有效|有效|标注|人工标注)$/i

export function slotLabel(slot: AlertDataSlot, lang: 'en' | 'zh-Hant'): string {
  const zh = lang !== 'en'
  if (slot === 'underlying') return zh ? '底层数据' : 'Underlying data'
  if (slot === 'alert_logs') return zh ? '告警日志' : 'Alert logs'
  return zh ? '人工标注（是否有效）' : 'Human labels (valid?)'
}

export function directionLabel(id: OptimizeDirectionId, lang: 'en' | 'zh-Hant'): string {
  const row = OPTIMIZE_DIRECTIONS.find((d) => d.id === id)
  if (!row) return id
  return lang === 'en' ? row.en : row.zh
}

/** Pull candidate alert names from any ingested rows/columns. */
export function extractAlertNames(datasets: IngestedDataset[]): string[] {
  const names = new Set<string>()
  for (const ds of datasets) {
    const cols = ds.columns.filter((c) => ALERT_NAME_COLS.test(c))
    const useCols = cols.length ? cols : []
    for (const row of ds.rows) {
      for (const c of useCols) {
        const v = (row[c] || '').trim()
        if (v) names.add(v.slice(0, 80))
      }
      if (!useCols.length) {
        // Fallback: first non-numeric-looking short string column sample
        for (const c of ds.columns.slice(0, 4)) {
          const v = (row[c] || '').trim()
          if (v && !/^-?\d+(\.\d+)?$/.test(v) && v.length <= 64) names.add(v)
        }
      }
    }
  }
  return [...names].sort((a, b) => a.localeCompare(b)).slice(0, AO_LIMITS.maxAlertNameOptions)
}

/** True when adding another dataset would exceed mode/slot caps. */
export function wouldExceedDatasetCap(args: {
  mode: DeskMode
  currentCount: number
  slot?: AlertDataSlot
}): boolean {
  if (args.mode === 'general') return args.currentCount >= AO_LIMITS.maxDatasetsGeneral
  return args.currentCount >= AO_LIMITS.maxDatasetsPerSlot
}

export function totalRowCount(datasets: IngestedDataset[]): number {
  return datasets.reduce((n, d) => n + d.rowCount, 0)
}

function filterByAlertName(datasets: IngestedDataset[], alertName: string): IngestedDataset[] {
  const want = alertName.trim().toLowerCase()
  if (!want) return datasets
  return datasets.map((ds) => {
    const cols = ds.columns.filter((c) => ALERT_NAME_COLS.test(c))
    if (!cols.length) return ds
    const rows = ds.rows.filter((r) =>
      cols.some((c) => (r[c] || '').trim().toLowerCase() === want),
    )
    if (!rows.length) return { ...ds, rows: [], rowCount: 0, issues: [...ds.issues, `No rows for alert "${alertName}"`] }
    return { ...ds, rows, rowCount: rows.length }
  })
}

function summarizeLabels(ds: IngestedDataset | undefined, zh: boolean): string | null {
  if (!ds || !ds.rowCount) return null
  const col = ds.columns.find((c) => LABEL_VALID_COLS.test(c))
  if (!col) {
    return zh
      ? `标注集 **${ds.name}** 有 ${ds.rowCount} 行，但未识别到「是否有效」列（valid / label / 有效…）。`
      : `Label set **${ds.name}** has ${ds.rowCount} rows, but no valid/label column detected.`
  }
  let yes = 0
  let no = 0
  let other = 0
  for (const r of ds.rows) {
    const v = (r[col] || '').trim().toLowerCase()
    if (/^(1|true|yes|y|有效|true_positive|tp)$/i.test(v)) yes++
    else if (/^(0|false|no|n|无效|误报|false_positive|fp)$/i.test(v)) no++
    else other++
  }
  return zh
    ? `人工标注列 **${col}**：有效 **${yes}**／无效（误报） **${no}**／其他 **${other}**（共 ${ds.rowCount}）。`
    : `Human label column **${col}**: valid **${yes}** / invalid (FP) **${no}** / other **${other}** (n=${ds.rowCount}).`
}

function directionGuidance(
  id: OptimizeDirectionId,
  zh: boolean,
  ctx: { hasUnderlying: boolean; hasLogs: boolean; hasLabels: boolean; alertName: string },
): string {
  const focus = ctx.alertName
    ? zh
      ? `针对告警「${ctx.alertName}」`
      : `For alert “${ctx.alertName}”`
    : zh
      ? '在全体告警范围'
      : 'Across all alerts'
  switch (id) {
    case 'threshold':
      return zh
        ? `${focus}：对照底层时序与告警触发点，检查阈值是否过宽／过窄；${ctx.hasLabels ? '结合人工标注的误报率' : '缺少标注时先用重复触发密度作代理'}建议分位阈值，并与后管配置字段对齐。`
        : `${focus}: compare underlying series vs trigger points; ${ctx.hasLabels ? 'use human FP labels' : 'use repeat-fire density as a proxy without labels'} to propose percentile thresholds vs admin config.`
    case 'window':
      return zh
        ? `${focus}：评估观察窗口是否导致漏报（窗口过短）或粘滞告警（窗口过长）；建议用事件间距分布重估窗口。`
        : `${focus}: check if the observation window causes misses (too short) or sticky alerts (too long); re-estimate from inter-event gaps.`
    case 'scan_freq':
      return zh
        ? `${focus}：对比底层采样频率与扫描频率；若底层变化快于扫描，建议提高扫描或改事件驱动；反之可降频减噪。`
        : `${focus}: compare underlying sample rate vs scan cadence; raise scan / go event-driven if series moves faster; else lower cadence to cut noise.`
    case 'unmonitored':
      return zh
        ? `${focus}：在底层字段中找告警日志未覆盖的异常形态（长尾尖刺、单源失效、费率突变等），输出「建议新增监控」清单。`
        : `${focus}: find underlying anomalies not covered by alert logs (tail spikes, single-source loss, funding jumps) and list “suggested new monitors”.`
    case 'false_positive':
      return zh
        ? `${focus}：${ctx.hasLabels ? '用人工标注直接算精确率／误报率' : '无标注时用短时重复触发与自愈回落作误报代理'}，优先收紧误报主导的规则。`
        : `${focus}: ${ctx.hasLabels ? 'compute precision/FP from labels' : 'proxy FP via short burst+self-heal without labels'}; tighten FP-dominated rules first.`
    case 'coverage':
      return zh
        ? `${focus}：对照底层风险维度与现有告警规则覆盖，标出缺口（品种／时段／源／指标）。`
        : `${focus}: map underlying risk dimensions vs current rules; mark coverage gaps (symbol / session / source / metric).`
    default:
      return ''
  }
}

function profileDatasets(
  datasets: IngestedDataset[],
  zh: boolean,
): { readback: string[]; dataIssues: string[] } {
  const readback: string[] = []
  const dataIssues: string[] = []
  for (const ds of datasets) {
    const slot = ds.slot ? slotLabel(ds.slot, zh ? 'zh-Hant' : 'en') : null
    const profiles = profileColumns(ds)
    readback.push(
      zh
        ? `${slot ? `【${slot}】` : ''}数据集 **${ds.name}**（${ds.kind} · ${ds.sourceLabel}）：**${ds.rowCount}** 行 × **${ds.columns.length}** 列；列：${ds.columns.slice(0, 12).join(', ')}${ds.columns.length > 12 ? '…' : ''}`
        : `${slot ? `[${slot}] ` : ''}Dataset **${ds.name}** (${ds.kind} · ${ds.sourceLabel}): **${ds.rowCount}** rows × **${ds.columns.length}** cols; columns: ${ds.columns.slice(0, 12).join(', ')}${ds.columns.length > 12 ? '…' : ''}`,
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
  return { readback, dataIssues }
}

function buildReport(args: {
  zh: boolean
  title: string
  readback: string[]
  charts: ChartSpec[]
  answer: string
  dataIssues: string[]
  assumptions: string[]
  pathSteps?: string[]
}): string {
  const { zh } = args
  return [
    `# ${args.title}`,
    '',
    ...(args.pathSteps?.length
      ? [zh ? '## 排查路径' : '## Investigation path', ...args.pathSteps.map((x) => `- ${x}`), '']
      : []),
    zh ? '## 我读到了什么' : '## What I read',
    ...args.readback.map((x) => `- ${x}`),
    '',
    zh ? '## 图表' : '## Charts',
    args.charts.length
      ? args.charts.map((c) => `- ${c.title}: ${c.labels.length} points (${c.kind})`).join('\n')
      : zh
        ? '- （无可绘制数值／类别列）'
        : '- (no plottable numeric/category columns)',
    '',
    zh ? '## 分析结论' : '## Answer',
    args.answer,
    '',
    zh ? '## 数据问题' : '## Data issues',
    ...(args.dataIssues.length ? args.dataIssues.map((x) => `- ${x}`) : [zh ? '- 无' : '- none']),
    '',
    zh ? '## 假设' : '## Assumptions',
    ...args.assumptions.map((x) => `- ${x}`),
    '',
    zh ? `生成时间：${new Date().toISOString()}` : `Generated: ${new Date().toISOString()}`,
  ].join('\n')
}

/** 通用分析 — free-form CSV/API + question. */
export function analyzeLocally(args: {
  datasets: IngestedDataset[]
  question: string
  lang: 'en' | 'zh-Hant'
}): AnalysisResult {
  const zh = args.lang !== 'en'
  const { readback, dataIssues } = profileDatasets(args.datasets, zh)
  if (!args.datasets.length) {
    dataIssues.push(zh ? '未提供任何 CSV 或 API 数据。' : 'No CSV or API data provided.')
  }

  const charts = buildCharts(args.datasets)
  const assumptions: string[] = [
    zh
      ? 'CSV 首行视为表头；数值列按可解析数字统计；API JSON 优先取 data/rows/items 等数组字段。'
      : 'CSV first row is treated as header; numeric stats use parseable numbers; JSON prefers data/rows/items arrays.',
    zh
      ? '图表仅抽样最多 24 个点／10 个类别，用于可读性，不代表全量精确分布。'
      : 'Charts sample ≤24 points / ≤10 categories for readability — not a full-population histogram.',
  ]
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
        ? '见到盘口／指数／资金费率类字段 — 分析时应同时看绝对阈值与相对波动（相对自身均值／友商）。'
        : 'Book/index/funding-like fields found — prefer relative (vs own mean / peers) alongside absolute thresholds.',
    )
  }
  if (dataIssues.length) {
    answerParts.push(
      zh
        ? '在修复下方 **数据问题** 之前，结论应标为暂定。'
        : 'Conclusions are provisional until the **data issues** below are addressed.',
    )
  } else {
    answerParts.push(
      zh
        ? '未发现严重空值／结构问题；可在图表所示分布上进一步细化。'
        : 'No severe emptiness/structure issues; charts can support a deeper follow-up.',
    )
  }

  const answer = answerParts.join('\n\n')
  return {
    readback,
    charts,
    answer,
    dataIssues,
    assumptions,
    reportMarkdown: buildReport({
      zh,
      title: zh ? '通用分析报告' : 'General analysis report',
      readback,
      charts,
      answer,
      dataIssues,
      assumptions,
    }),
  }
}

/** 告警优化 — three slots + optional alert name + multi-select directions. */
export function analyzeAlertOptimize(args: {
  datasets: IngestedDataset[]
  alertName: string
  directions: OptimizeDirectionId[]
  notes: string
  lang: 'en' | 'zh-Hant'
}): AnalysisResult {
  const zh = args.lang !== 'en'
  const scoped = filterByAlertName(args.datasets, args.alertName)
  const { readback, dataIssues } = profileDatasets(scoped, zh)

  const bySlot = {
    underlying: scoped.filter((d) => d.slot === 'underlying'),
    alert_logs: scoped.filter((d) => d.slot === 'alert_logs'),
    human_labels: scoped.filter((d) => d.slot === 'human_labels'),
  }
  const hasUnderlying = bySlot.underlying.some((d) => d.rowCount > 0)
  const hasLogs = bySlot.alert_logs.some((d) => d.rowCount > 0)
  const hasLabels = bySlot.human_labels.some((d) => d.rowCount > 0)

  if (!hasUnderlying) {
    assumptionsNoteMissing(zh, dataIssues, 'underlying')
  }
  if (!hasLogs) assumptionsNoteMissing(zh, dataIssues, 'alert_logs')
  if (!hasLabels) assumptionsNoteMissing(zh, dataIssues, 'human_labels')

  for (const ds of bySlot.human_labels) {
    const s = summarizeLabels(ds, zh)
    if (s) readback.push(s)
  }

  const charts = buildCharts(scoped)
  const dirs =
    args.directions.length > 0
      ? args.directions
      : (['threshold', 'false_positive'] as OptimizeDirectionId[])

  const pathSteps = zh
    ? [
        '摄入：底层数据／告警日志／人工标注（至少一项）',
        args.alertName ? `锁定告警名称：${args.alertName}` : '未指定告警名称 — 按全体规则汇总',
        `选定优化方向：${dirs.map((d) => directionLabel(d, 'zh-Hant')).join('、')}`,
        '画像字段质量并画图',
        '按方向输出建议，声明缺口与假设',
      ]
    : [
        'Ingest: underlying / alert logs / human labels (≥1)',
        args.alertName ? `Focus alert: ${args.alertName}` : 'No alert name — aggregate across rules',
        `Directions: ${dirs.map((d) => directionLabel(d, 'en')).join(', ')}`,
        'Profile quality + charts',
        'Emit direction-specific recommendations; declare gaps & assumptions',
      ]

  const assumptions: string[] = [
    zh
      ? '三槽位均可选，但至少一项有数据才继续；缺槽会在「数据问题」中标明，结论标为暂定。'
      : 'All three slots are optional, but ≥1 dataset is required; missing slots are flagged and conclusions stay provisional.',
    zh
      ? '告警名称按下拉所选过滤（匹配 alert/rule/告警名 等列）；未选则分析全体。'
      : 'Alert name filters rows via alert/rule/name columns when set; otherwise all rows are used.',
    zh
      ? '未勾选优化方向时，默认按「优化阈值 + 降低误报」路径执行。'
      : 'If no directions are checked, default path is threshold + false-positive reduction.',
    zh
      ? '图表仅抽样最多 24 点／10 类，不代表全量精确分布。'
      : 'Charts sample ≤24 points / ≤10 categories — not a full-population histogram.',
  ]

  const ctx = { hasUnderlying, hasLogs, hasLabels, alertName: args.alertName.trim() }
  const answerParts: string[] = [
    zh
      ? `按排查路径完成告警优化审阅（数据源 **${scoped.filter((d) => d.rowCount).length}** 个有效集，合计 **${scoped.reduce((n, d) => n + d.rowCount, 0)}** 行）。`
      : `Completed alert-optimize review along the investigation path (**${scoped.filter((d) => d.rowCount).length}** active sets, **${scoped.reduce((n, d) => n + d.rowCount, 0)}** rows).`,
  ]
  if (args.notes.trim()) {
    answerParts.push(
      zh
        ? `附加说明：「${args.notes.trim().slice(0, 240)}」`
        : `Operator notes: “${args.notes.trim().slice(0, 240)}”`,
    )
  }
  for (const id of dirs) {
    answerParts.push(directionGuidance(id, zh, ctx))
  }
  if (!hasUnderlying || !hasLogs || !hasLabels) {
    answerParts.push(
      zh
        ? '当前并非三槽齐全 — 建议补齐缺失源后再固化阈值／窗口／频率变更（业务确认）。'
        : 'Not all three slots are present — backfill missing sources before locking threshold/window/cadence changes (business sign-off).',
    )
  }

  const answer = answerParts.join('\n\n')
  return {
    readback,
    charts,
    answer,
    dataIssues,
    assumptions,
    reportMarkdown: buildReport({
      zh,
      title: zh ? '告警优化分析报告' : 'Alert optimization report',
      readback,
      charts,
      answer,
      dataIssues,
      assumptions,
      pathSteps,
    }),
  }
}

function assumptionsNoteMissing(
  zh: boolean,
  dataIssues: string[],
  slot: AlertDataSlot,
) {
  const label = slotLabel(slot, zh ? 'zh-Hant' : 'en')
  dataIssues.push(
    zh ? `未提供「${label}」— 相关结论将受限。` : `Missing “${label}” — related conclusions are limited.`,
  )
}

export function initialStatusSteps(
  lang: 'en' | 'zh-Hant',
  mode: DeskMode = 'general',
): StatusStep[] {
  const zh = lang !== 'en'
  if (mode === 'alert_optimize') {
    return [
      { id: 'ingest', label: zh ? '摄入三槽数据源' : 'Ingest three data slots', state: 'pending' },
      { id: 'scope', label: zh ? '锁定告警名称与优化方向' : 'Scope alert name & directions', state: 'pending' },
      { id: 'profile', label: zh ? '画像字段与质量' : 'Profile fields & quality', state: 'pending' },
      { id: 'chart', label: zh ? '构建图表' : 'Build charts', state: 'pending' },
      { id: 'path', label: zh ? '沿排查路径推理' : 'Reason along investigation path', state: 'pending' },
      { id: 'draft', label: zh ? '整理结论与假设' : 'Draft answer & assumptions', state: 'pending' },
    ]
  }
  return [
    { id: 'ingest', label: zh ? '摄入 CSV／API 数据' : 'Ingest CSV / API data', state: 'pending' },
    { id: 'profile', label: zh ? '画像字段与质量' : 'Profile fields & quality', state: 'pending' },
    { id: 'chart', label: zh ? '构建图表' : 'Build charts', state: 'pending' },
    { id: 'reason', label: zh ? '审阅问题并推理' : 'Review question & reason', state: 'pending' },
    { id: 'draft', label: zh ? '整理结论与假设' : 'Draft answer & assumptions', state: 'pending' },
  ]
}
