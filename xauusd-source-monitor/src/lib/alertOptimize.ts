import type { AppLang } from '../i18n/messages'
/** Client-side ingest + profiling for Alert Optimize / General analysis. */

/**
 * Preprocess-agent strategy only — there is **no analysis quota**.
 * Every row can be scanned; only the in-memory working set is sampled for LLM/charts.
 */
export const AO_PREPROCESS = {
  /** Rows kept in RAM for row-level reasoning / charts after full scan. */
  sampleRows: 3_000,
  /** Max columns kept after priority selection (stats still note original width). */
  workColumns: 64,
  /** Numeric reservoir size per column for percentile estimates while streaming. */
  numericReservoir: 5_000,
  /** Emit preprocess narrative when raw rows exceed this. */
  giantRowThreshold: 3_000,
  /** Alert-name dropdown options (UI convenience only). */
  maxAlertNameOptions: 500,
  /**
   * Only for single-string paste already resident in the DOM — if larger, agent
   * still scans via line walk but may skip holding the raw preview.
   */
  previewChars: 800,
} as const

/** @deprecated Use AO_PREPROCESS — kept so older imports/smoke keep compiling. */
export const AO_LIMITS = {
  sampleRows: AO_PREPROCESS.sampleRows,
  maxRowsPerDataset: AO_PREPROCESS.sampleRows,
  maxColumns: AO_PREPROCESS.workColumns,
  maxScanRows: Number.MAX_SAFE_INTEGER,
  maxBytesPerIngest: Number.MAX_SAFE_INTEGER,
  maxHardBytes: Number.MAX_SAFE_INTEGER,
  maxDatasetsGeneral: Number.MAX_SAFE_INTEGER,
  maxDatasetsPerSlot: Number.MAX_SAFE_INTEGER,
  maxAlertNameOptions: AO_PREPROCESS.maxAlertNameOptions,
  giantRowThreshold: AO_PREPROCESS.giantRowThreshold,
} as const

export type ColumnAggStats = {
  name: string
  n: number
  min: number
  max: number
  mean: number
  p50: number
  p90: number
  p99: number
}

export type PreprocessMeta = {
  triggered: boolean
  originalRowCount: number
  scannedRowCount: number
  keptRowCount: number
  originalColCount: number
  keptColCount: number
  methods: string[]
  columnStats: ColumnAggStats[]
  notes: string[]
}

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
  /** Giant-data preprocess agent output (sample + aggregates). */
  preprocess?: PreprocessMeta
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
  p50?: number
  p90?: number
  p99?: number
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
  /** What the preprocess agent did on giant inputs. */
  preprocessNotes: string[]
  /** Concrete optimization suggestions (post-preprocess). */
  optimizeSuggestions: string[]
  reportMarkdown: string
}

export type AoFollowUpTurn = {
  role: 'user' | 'assistant'
  content: string
  at: number
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

/**
 * No ingest quota — return the full text. `truncated` stays for API compat (always false).
 */
export function clampIngestText(text: string): { text: string; issues: string[]; truncated: boolean } {
  return { text, issues: [], truncated: false }
}

type NumAcc = {
  n: number
  sum: number
  min: number
  max: number
  reservoir: number[]
}

function emptyNumAcc(): NumAcc {
  return { n: 0, sum: 0, min: Infinity, max: -Infinity, reservoir: [] }
}

function pushNum(acc: NumAcc, v: number, reservoirCap = AO_PREPROCESS.numericReservoir) {
  acc.n += 1
  acc.sum += v
  if (v < acc.min) acc.min = v
  if (v > acc.max) acc.max = v
  if (acc.reservoir.length < reservoirCap) {
    acc.reservoir.push(v)
  } else {
    const j = Math.floor(Math.random() * acc.n)
    if (j < reservoirCap) acc.reservoir[j] = v
  }
}

function finalizeNumAcc(name: string, acc: NumAcc): ColumnAggStats | null {
  if (acc.n < 2 || !Number.isFinite(acc.min) || !Number.isFinite(acc.max)) return null
  const sorted = acc.reservoir.slice().sort((a, b) => a - b)
  return {
    name,
    n: acc.n,
    min: acc.min,
    max: acc.max,
    mean: acc.sum / acc.n,
    p50: percentile(sorted, 0.5),
    p90: percentile(sorted, 0.9),
    p99: percentile(sorted, 0.99),
  }
}

/** Reservoir sample — uniform over rows seen so far. */
function reservoirPush<T>(bag: T[], item: T, seen: number, cap: number) {
  if (bag.length < cap) {
    bag.push(item)
    return
  }
  const j = Math.floor(Math.random() * seen)
  if (j < cap) bag[j] = item
}

const PRIORITY_COL =
  /^(alert|rule|name|value|threshold|label|valid|severity|ts|time|timestamp|price|mark|index|depth|spread|funding|告警|规则|阈值|门限|有效|标注|时间)/i

function prioritizeColumns(columns: string[], maxKeep: number): { kept: string[]; methods: string[]; notes: string[] } {
  if (columns.length <= maxKeep) {
    return { kept: columns, methods: [], notes: [] }
  }
  const priority = columns.filter((c) => PRIORITY_COL.test(c))
  const rest = columns.filter((c) => !PRIORITY_COL.test(c))
  const kept = [...priority, ...rest].slice(0, maxKeep)
  return {
    kept,
    methods: ['column_priority'],
    notes: [
      `Preprocess: kept ${kept.length}/${columns.length} columns (priority: alert/value/threshold/label/time + others)`,
    ],
  }
}

function projectRows(rows: Record<string, string>[], cols: string[]): Record<string, string>[] {
  return rows.map((r) => {
    const next: Record<string, string> = {}
    for (const c of cols) next[c] = r[c] ?? ''
    return next
  })
}

/**
 * Preprocess agent: full-scan aggregates + RAM working-set sample.
 * No row quota — every provided row is eligible for the scan/reservoir.
 */
export function runPreprocessAgent(args: {
  columns: string[]
  rows: Record<string, string>[]
  /** True row count before any earlier windowing (optional). */
  originalRowCount?: number
  /** Optional precomputed numeric stats from a streaming pass. */
  columnStats?: ColumnAggStats[]
  streamNote?: string
}): { columns: string[]; rows: Record<string, string>[]; preprocess: PreprocessMeta } {
  const originalRowCount = args.originalRowCount ?? args.rows.length
  const originalColCount = args.columns.length
  const methods: string[] = []
  const notes: string[] = []

  if (args.streamNote) {
    methods.push('stream_scan')
    notes.push(args.streamNote)
  }

  const colPick = prioritizeColumns(args.columns, AO_PREPROCESS.workColumns)
  methods.push(...colPick.methods)
  notes.push(...colPick.notes)
  const columns = colPick.kept
  const rows = projectRows(args.rows, columns)

  let columnStats = args.columnStats?.filter((s) => columns.includes(s.name)) || []
  if (!columnStats.length) {
    const numAcc = new Map<string, NumAcc>()
    for (const c of columns) numAcc.set(c, emptyNumAcc())
    for (const r of rows) {
      for (const c of columns) {
        const n = toNum(r[c] || '')
        if (n != null) pushNum(numAcc.get(c)!, n)
      }
    }
    for (const c of columns) {
      const st = finalizeNumAcc(c, numAcc.get(c)!)
      if (st) columnStats.push(st)
    }
  }
  if (columnStats.length) {
    methods.push('numeric_summary')
    notes.push(
      `Preprocess: full-scan min/max/mean/P50/P90/P99 for ${columnStats.length} numeric column(s)`,
    )
  }

  const needSample =
    originalRowCount > AO_PREPROCESS.giantRowThreshold || rows.length > AO_PREPROCESS.sampleRows
  let kept = rows
  if (needSample && rows.length > AO_PREPROCESS.sampleRows) {
    const bag: Record<string, string>[] = []
    for (let i = 0; i < rows.length; i++) {
      reservoirPush(bag, rows[i]!, i + 1, AO_PREPROCESS.sampleRows)
    }
    kept = bag
    methods.push('reservoir_sample')
    notes.push(
      `Preprocess: reservoir working set ${kept.length.toLocaleString()} of ${originalRowCount.toLocaleString()} rows (uniform) — analysis uses full-scan percentiles + this sample`,
    )
  }

  const triggered =
    methods.length > 0 ||
    originalRowCount > AO_PREPROCESS.giantRowThreshold ||
    originalColCount > AO_PREPROCESS.workColumns

  if (!triggered) {
    methods.push('passthrough')
    notes.push('Preprocess: full set fits in working memory — no downsample')
  }

  return {
    columns,
    rows: kept,
    preprocess: {
      triggered: methods[0] !== 'passthrough' || originalRowCount > AO_PREPROCESS.giantRowThreshold,
      originalRowCount,
      scannedRowCount: originalRowCount,
      keptRowCount: kept.length,
      originalColCount,
      keptColCount: columns.length,
      methods: [...new Set(methods.filter((m) => m !== 'passthrough' || methods.length === 1))],
      columnStats,
      notes,
    },
  }
}

/** Human-readable preprocess + optimization bullets for reports. */
export function formatPreprocessNotes(
  datasets: IngestedDataset[],
  lang: AppLang,
): { preprocessNotes: string[]; optimizeSuggestions: string[] } {
  const zh = lang !== 'en'
  const preprocessNotes: string[] = []
  const optimizeSuggestions: string[] = []

  for (const ds of datasets) {
    const pp = ds.preprocess
    if (!pp?.triggered && !(pp && pp.notes.length)) continue
    if (!pp) continue
    preprocessNotes.push(
      zh
        ? `**${ds.name}**：原始约 **${pp.originalRowCount.toLocaleString()}** 行 × **${pp.originalColCount}** 列 → 分析工作集 **${pp.keptRowCount.toLocaleString()}** 行 × **${pp.keptColCount}** 列；方法：${pp.methods.join('、') || 'passthrough'}。`
        : `**${ds.name}**: raw ~**${pp.originalRowCount.toLocaleString()}** rows × **${pp.originalColCount}** cols → working set **${pp.keptRowCount.toLocaleString()}** × **${pp.keptColCount}**; methods: ${pp.methods.join(', ') || 'passthrough'}.`,
    )
    for (const n of pp.notes) preprocessNotes.push(`- ${n}`)
    for (const st of pp.columnStats.slice(0, 6)) {
      preprocessNotes.push(
        zh
          ? `- 数值列 \`${st.name}\`（n=${st.n.toLocaleString()}）：min=${fmtNum(st.min)} · P50=${fmtNum(st.p50)} · P90=${fmtNum(st.p90)} · P99=${fmtNum(st.p99)} · max=${fmtNum(st.max)} · mean=${fmtNum(st.mean)}`
          : `- Numeric \`${st.name}\` (n=${st.n.toLocaleString()}): min=${fmtNum(st.min)} · P50=${fmtNum(st.p50)} · P90=${fmtNum(st.p90)} · P99=${fmtNum(st.p99)} · max=${fmtNum(st.max)} · mean=${fmtNum(st.mean)}`,
      )
      const span = st.max - st.min
      const upper = st.p99 - st.p50
      if (Number.isFinite(span) && span > 0 && upper / span > 0.4) {
        optimizeSuggestions.push(
          zh
            ? `**${ds.name}.${st.name}** 右尾偏厚（P99−P50 占全距 ${(
                (upper / span) *
                100
              ).toFixed(0)}%）— 阈值建议先试 **P90=${fmtNum(st.p90)}** 或 **P95≈${fmtNum(
                st.p90 + (st.p99 - st.p90) * 0.5,
              )}**，再按误报／漏报回调。`
            : `**${ds.name}.${st.name}** has a heavy right tail (P99−P50 is ${(
                (upper / span) *
                100
              ).toFixed(0)}% of range) — trial threshold at **P90=${fmtNum(st.p90)}** or mid P90–P99, then tune on FP/FN.`,
        )
      } else if (st.n >= 20) {
        optimizeSuggestions.push(
          zh
            ? `**${ds.name}.${st.name}** 分布相对集中 — 可用 **P95 邻域（≈${fmtNum(st.p90)}–${fmtNum(st.p99)}）** 做门限 A/B，避免只看 max=${fmtNum(st.max)} 被极端值带偏。`
            : `**${ds.name}.${st.name}** is relatively concentrated — A/B thresholds near **P90–P99 (${fmtNum(st.p90)}–${fmtNum(st.p99)})**; don’t anchor on max=${fmtNum(st.max)} alone.`,
        )
      }
    }
  }

  if (!preprocessNotes.length) {
    preprocessNotes.push(
      zh
        ? '未触发巨型数据预处理 — 工作集可直接全量画像。'
        : 'No giant-data preprocess triggered — working set profiled in full.',
    )
  }
  if (!optimizeSuggestions.length) {
    optimizeSuggestions.push(
      zh
        ? '补齐 value／threshold／标注列后，可对触发值分位数做阈值与误报联合优化。'
        : 'After value/threshold/label columns are present, jointly tune thresholds on fire-value percentiles vs FP labels.',
    )
  }
  return { preprocessNotes, optimizeSuggestions }
}

/**
 * Full-scan CSV: walk every non-empty data line for percentiles; keep only a
 * reservoir working set in RAM. No row analysis quota.
 */
export function parseCsvText(text: string, name: string): IngestedDataset {
  const issues: string[] = []
  const body = text.replace(/^\uFEFF/, '')
  const lines = body.split(/\r?\n/)
  const nonEmpty = lines.filter((l) => l.trim().length)
  if (!nonEmpty.length) {
    return {
      id: `csv_${Date.now()}`,
      name,
      kind: 'csv',
      sourceLabel: name,
      fetchedAt: Date.now(),
      columns: [],
      rows: [],
      rawPreview: body.slice(0, AO_PREPROCESS.previewChars),
      rowCount: 0,
      issues: ['CSV is empty'],
    }
  }
  const header = splitCsvLine(nonEmpty[0]!)
  if (header.length < 1) issues.push('No header columns detected')
  const columnsAll = header.map((h, i) => h || `col_${i + 1}`)
  const colPick = prioritizeColumns(columnsAll, AO_PREPROCESS.workColumns)
  const columns = colPick.kept

  const numAcc = new Map<string, NumAcc>()
  for (const c of columns) numAcc.set(c, emptyNumAcc())
  const bag: Record<string, string>[] = []
  let seen = 0
  let skippedEmpty = 0
  for (let li = 1; li < nonEmpty.length; li++) {
    const cells = splitCsvLine(nonEmpty[li]!)
    if (cells.every((c) => !c)) {
      skippedEmpty++
      continue
    }
    seen++
    const row: Record<string, string> = {}
    columns.forEach((c) => {
      const idx = columnsAll.indexOf(c)
      row[c] = idx >= 0 ? cells[idx] ?? '' : ''
    })
    for (const c of columns) {
      const n = toNum(row[c] || '')
      if (n != null) pushNum(numAcc.get(c)!, n)
    }
    reservoirPush(bag, row, seen, AO_PREPROCESS.sampleRows)
  }

  const columnStats: ColumnAggStats[] = []
  for (const c of columns) {
    const st = finalizeNumAcc(c, numAcc.get(c)!)
    if (st) columnStats.push(st)
  }

  const pre = runPreprocessAgent({
    columns,
    rows: bag,
    originalRowCount: seen,
    columnStats,
    streamNote:
      seen > AO_PREPROCESS.sampleRows
        ? `Preprocess: streamed all ${seen.toLocaleString()} CSV rows for aggregates; RAM working set ${bag.length.toLocaleString()}`
        : undefined,
  })
  // Merge column_priority notes from first pass
  for (const n of colPick.notes) {
    if (!pre.preprocess.notes.includes(n)) pre.preprocess.notes.unshift(n)
  }
  for (const m of colPick.methods) {
    if (!pre.preprocess.methods.includes(m)) pre.preprocess.methods.unshift(m)
  }
  pre.preprocess.originalColCount = columnsAll.length
  if (!pre.rows.length && seen === 0) issues.push('CSV has a header but no data rows')

  return {
    id: `csv_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    name,
    kind: 'csv',
    sourceLabel: name,
    fetchedAt: Date.now(),
    columns: pre.columns,
    rows: pre.rows,
    rawPreview: body.slice(0, AO_PREPROCESS.previewChars),
    rowCount: pre.rows.length,
    issues,
    preprocess: {
      ...pre.preprocess,
      triggered:
        pre.preprocess.triggered ||
        seen > AO_PREPROCESS.giantRowThreshold ||
        columnsAll.length > AO_PREPROCESS.workColumns,
      scannedRowCount: seen,
      originalRowCount: seen,
    },
  }
}

/** Stream a File without loading the whole blob as one string when possible. */
export async function parseCsvFile(file: File, name = file.name): Promise<IngestedDataset> {
  // Prefer stream for large files; fall back to text() for small / unsupported.
  if (typeof file.stream === 'function' && file.size > 4_000_000) {
    try {
      const reader = file.stream().pipeThrough(new TextDecoderStream()).getReader()
      let pending = ''
      let header: string[] | null = null
      let columnsAll: string[] = []
      let columns: string[] = []
      const numAcc = new Map<string, NumAcc>()
      const bag: Record<string, string>[] = []
      let seen = 0
      let preview = ''
      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        pending += value
        if (preview.length < AO_PREPROCESS.previewChars) {
          preview = (preview + value).slice(0, AO_PREPROCESS.previewChars)
        }
        const parts = pending.split(/\r?\n/)
        pending = parts.pop() || ''
        for (const line of parts) {
          if (!line.trim()) continue
          if (!header) {
            header = splitCsvLine(line)
            columnsAll = header.map((h, i) => h || `col_${i + 1}`)
            columns = prioritizeColumns(columnsAll, AO_PREPROCESS.workColumns).kept
            for (const c of columns) numAcc.set(c, emptyNumAcc())
            continue
          }
          const cells = splitCsvLine(line)
          if (cells.every((c) => !c)) continue
          seen++
          const row: Record<string, string> = {}
          columns.forEach((c) => {
            const idx = columnsAll.indexOf(c)
            row[c] = idx >= 0 ? cells[idx] ?? '' : ''
          })
          for (const c of columns) {
            const n = toNum(row[c] || '')
            if (n != null) pushNum(numAcc.get(c)!, n)
          }
          reservoirPush(bag, row, seen, AO_PREPROCESS.sampleRows)
        }
      }
      if (pending.trim()) {
        if (!header) {
          header = splitCsvLine(pending)
          columnsAll = header.map((h, i) => h || `col_${i + 1}`)
          columns = prioritizeColumns(columnsAll, AO_PREPROCESS.workColumns).kept
          for (const c of columns) numAcc.set(c, emptyNumAcc())
        } else {
          const cells = splitCsvLine(pending)
          if (!cells.every((c) => !c)) {
            seen++
            const row: Record<string, string> = {}
            columns.forEach((c) => {
              const idx = columnsAll.indexOf(c)
              row[c] = idx >= 0 ? cells[idx] ?? '' : ''
            })
            for (const c of columns) {
              const n = toNum(row[c] || '')
              if (n != null) pushNum(numAcc.get(c)!, n)
            }
            reservoirPush(bag, row, seen, AO_PREPROCESS.sampleRows)
          }
        }
      }
      const columnStats: ColumnAggStats[] = []
      for (const c of columns) {
        const st = finalizeNumAcc(c, numAcc.get(c)!)
        if (st) columnStats.push(st)
      }
      const pre = runPreprocessAgent({
        columns,
        rows: bag,
        originalRowCount: seen,
        columnStats,
        streamNote: `Preprocess: streamed file “${name}” (${(file.size / 1e6).toFixed(1)}MB) — scanned ${seen.toLocaleString()} rows, working set ${bag.length.toLocaleString()}`,
      })
      pre.preprocess.originalColCount = columnsAll.length || columns.length
      return {
        id: `csv_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        name,
        kind: 'csv',
        sourceLabel: name,
        fetchedAt: Date.now(),
        columns: pre.columns,
        rows: pre.rows,
        rawPreview: preview,
        rowCount: pre.rows.length,
        issues: [],
        preprocess: { ...pre.preprocess, triggered: true, scannedRowCount: seen, originalRowCount: seen },
      }
    } catch {
      /* fall through to text() */
    }
  }
  const text = await file.text()
  return parseCsvText(text, name)
}

export function parseJsonPayload(raw: unknown, name: string, sourceLabel: string): IngestedDataset {
  const issues: string[] = []
  let rows: Record<string, string>[] = []
  let columns: string[] = []

  let originalRowCount = 0
  const asRows = (arr: unknown[]): void => {
    const objs = arr.filter((x) => x && typeof x === 'object' && !Array.isArray(x)) as Record<
      string,
      unknown
    >[]
    if (!objs.length) {
      issues.push('JSON array has no object rows')
      return
    }
    originalRowCount = objs.length
    const colSet = new Set<string>()
    // Sample keys from head + scattered rows so wide schemas are still discovered
    const keyProbe = Math.min(objs.length, 500)
    for (let i = 0; i < keyProbe; i++) {
      Object.keys(objs[i]!).forEach((k) => colSet.add(k))
    }
    columns = [...colSet]
    const bag: Record<string, string>[] = []
    for (let i = 0; i < objs.length; i++) {
      const o = objs[i]!
      const row: Record<string, string> = {}
      for (const c of columns) row[c] = o[c] == null ? '' : String(o[c]).slice(0, 4000)
      reservoirPush(bag, row, i + 1, AO_PREPROCESS.sampleRows)
    }
    rows = bag
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
      originalRowCount = 1
      issues.push('JSON root is a single object — treated as one row')
    }
  } else {
    issues.push('Unsupported JSON shape')
  }

  const pre = runPreprocessAgent({
    columns,
    rows,
    originalRowCount: originalRowCount || rows.length,
  })

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
    columns: pre.columns,
    rows: pre.rows,
    rawPreview: preview,
    rowCount: pre.rows.length,
    issues,
    preprocess: pre.preprocess,
  }
}

export function profileColumns(dataset: IngestedDataset): ColumnProfile[] {
  const aggByName = new Map((dataset.preprocess?.columnStats || []).map((s) => [s.name, s]))
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
    const agg = aggByName.get(name)
    if (agg) {
      profile.min = agg.min
      profile.max = agg.max
      profile.mean = agg.mean
      profile.p50 = agg.p50
      profile.p90 = agg.p90
      profile.p99 = agg.p99
      profile.numericCount = Math.max(profile.numericCount, agg.n)
    } else if (nums.length >= 2) {
      const sorted = nums.slice().sort((a, b) => a - b)
      profile.min = sorted[0]
      profile.max = sorted[sorted.length - 1]
      profile.mean = nums.reduce((a, b) => a + b, 0) / nums.length
      profile.p50 = percentile(sorted, 0.5)
      profile.p90 = percentile(sorted, 0.9)
      profile.p99 = percentile(sorted, 0.99)
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

export function slotLabel(slot: AlertDataSlot, lang: AppLang): string {
  const zh = lang !== 'en'
  if (slot === 'underlying') return zh ? '底层数据' : 'Underlying data'
  if (slot === 'alert_logs') return zh ? '告警日志' : 'Alert logs'
  return zh ? '人工标注（是否有效）' : 'Human labels (valid?)'
}

export function directionLabel(id: OptimizeDirectionId, lang: AppLang): string {
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
  return [...names].sort((a, b) => a.localeCompare(b)).slice(0, AO_PREPROCESS.maxAlertNameOptions)
}

/** @deprecated No dataset-count analysis quota — always false. */
export function wouldExceedDatasetCap(_args: {
  mode: DeskMode
  currentCount: number
  slot?: AlertDataSlot
}): boolean {
  return false
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

const VALUE_COLS =
  /^(value|val|metric[_\s-]?value|trigger[_\s-]?value|observed|actual|gap|bps|deviation|dev|depth|spread|premium)$/i
const THRESHOLD_COLS =
  /^(threshold|thresh|limit|cfg[_\s-]?threshold|config[_\s-]?threshold|配置阈值|阈值|门限)$/i

function toNum(v: string): number | null {
  const n = Number(String(v || '').replace(/,/g, ''))
  return Number.isFinite(n) ? n : null
}

function percentile(sorted: number[], p: number): number {
  if (!sorted.length) return NaN
  if (sorted.length === 1) return sorted[0]!
  const idx = (sorted.length - 1) * p
  const lo = Math.floor(idx)
  const hi = Math.ceil(idx)
  if (lo === hi) return sorted[lo]!
  const w = idx - lo
  return sorted[lo]! * (1 - w) + sorted[hi]! * w
}

function fmtNum(n: number): string {
  if (!Number.isFinite(n)) return '—'
  const a = Math.abs(n)
  if (a >= 1000) return n.toFixed(1)
  if (a >= 10) return n.toFixed(2)
  if (a >= 1) return n.toFixed(3)
  return n.toFixed(4)
}

function pickCol(columns: string[], re: RegExp): string | undefined {
  return columns.find((c) => re.test(c))
}

function collectNums(datasets: IngestedDataset[], colRe: RegExp): { col: string; values: number[] } | null {
  for (const ds of datasets) {
    const col = pickCol(ds.columns, colRe)
    if (!col) continue
    const values: number[] = []
    for (const r of ds.rows) {
      const n = toNum(r[col] || '')
      if (n != null) values.push(n)
    }
    if (values.length >= 2) return { col, values }
  }
  return null
}

type LabelStats = { col: string; valid: number; invalid: number; other: number; total: number }

function labelStats(datasets: IngestedDataset[]): LabelStats | null {
  for (const ds of datasets) {
    const col = pickCol(ds.columns, LABEL_VALID_COLS)
    if (!col) continue
    let valid = 0
    let invalid = 0
    let other = 0
    for (const r of ds.rows) {
      const v = (r[col] || '').trim().toLowerCase()
      if (/^(1|true|yes|y|有效|true_positive|tp)$/i.test(v)) valid++
      else if (/^(0|false|no|n|无效|误报|false_positive|fp)$/i.test(v)) invalid++
      else other++
    }
    if (valid + invalid + other > 0) {
      return { col, valid, invalid, other, total: valid + invalid + other }
    }
  }
  return null
}

/** Join log rows to label validity by alert/rule name when possible. */
function labeledValueSplit(
  logs: IngestedDataset[],
  labels: IngestedDataset[],
  valueCol: string,
): { tp: number[]; fp: number[] } {
  const tp: number[] = []
  const fp: number[] = []
  const labelMap = new Map<string, boolean>()
  for (const ds of labels) {
    const nameCol = pickCol(ds.columns, ALERT_NAME_COLS)
    const labCol = pickCol(ds.columns, LABEL_VALID_COLS)
    if (!nameCol || !labCol) continue
    for (const r of ds.rows) {
      const key = (r[nameCol] || '').trim().toLowerCase()
      if (!key) continue
      const v = (r[labCol] || '').trim().toLowerCase()
      if (/^(1|true|yes|y|有效|true_positive|tp)$/i.test(v)) labelMap.set(key, true)
      else if (/^(0|false|no|n|无效|误报|false_positive|fp)$/i.test(v)) labelMap.set(key, false)
    }
  }
  for (const ds of logs) {
    const nameCol = pickCol(ds.columns, ALERT_NAME_COLS)
    for (const r of ds.rows) {
      const n = toNum(r[valueCol] || '')
      if (n == null) continue
      const key = nameCol ? (r[nameCol] || '').trim().toLowerCase() : ''
      if (key && labelMap.has(key)) {
        if (labelMap.get(key)) tp.push(n)
        else fp.push(n)
      }
    }
  }
  return { tp, fp }
}

/**
 * Concrete 「优化阈值」bullets with how-to + data support.
 * Returned as a markdown-ish block (title + `-` bullets).
 */
export function buildThresholdOptimizeBullets(args: {
  logs: IngestedDataset[]
  underlying: IngestedDataset[]
  labels: IngestedDataset[]
  alertName: string
  lang: AppLang
}): string {
  const zh = args.lang !== 'en'
  const focus = args.alertName.trim()
    ? zh
      ? `告警「${args.alertName.trim()}」`
      : `alert “${args.alertName.trim()}”`
    : zh
      ? '全体告警'
      : 'all alerts'

  const bullets: string[] = []
  const valueHit = collectNums(args.logs.length ? args.logs : [...args.logs, ...args.underlying], VALUE_COLS)
  const threshHit = collectNums(
    [...args.logs, ...args.underlying],
    THRESHOLD_COLS,
  )
  const labs = labelStats(args.labels)

  if (!valueHit && !threshHit) {
    bullets.push(
      zh
        ? `**补齐字段后再调参** — 当前日志／底层中未识别到 \`value\`／\`threshold\` 列，无法给出数值阈值。**数据支持：** 可用列需包含 value/threshold（或 阈值／门限）。`
        : `**Backfill columns before tuning** — no \`value\`/\`threshold\` columns detected.**Data:** need value/threshold (or 阈值) fields.`,
    )
    bullets.push(
      zh
        ? `**临时动作** — 先按人工标注误报率收紧触发条件（若有标注）；否则导出含触发值与配置阈值的告警日志后重跑。`
        : `**Interim** — tighten via human FP labels if present; otherwise re-export logs with trigger value + config threshold and re-run.`,
    )
  } else {
    const values = valueHit?.values.slice().sort((a, b) => a - b) || []
    const thresholds = threshHit?.values.slice().sort((a, b) => a - b) || []
    const vCol = valueHit?.col
    const tCol = threshHit?.col
    const n = values.length
    const vMin = values[0]
    const vMax = values[values.length - 1]
    const vP50 = percentile(values, 0.5)
    const vP75 = percentile(values, 0.75)
    const vP90 = percentile(values, 0.9)
    const vP95 = percentile(values, 0.95)
    const tMed = thresholds.length ? percentile(thresholds, 0.5) : NaN
    const tMode = thresholds.length ? thresholds[Math.floor(thresholds.length / 2)]! : NaN

    if (values.length) {
      bullets.push(
        zh
          ? `**看触发值分布再定阈值** — 对 ${focus} 的触发值（列 \`${vCol}\`，n=${n}）先用分位数：P50=${fmtNum(vP50)}，P75=${fmtNum(vP75)}，P90=${fmtNum(vP90)}，P95=${fmtNum(vP95)}（min=${fmtNum(vMin!)}，max=${fmtNum(vMax!)}）。**数据支持：** 来自告警日志／底层数值列 \`${vCol}\`。`
          : `**Anchor on fire-value percentiles** — for ${focus}, column \`${vCol}\` (n=${n}): P50=${fmtNum(vP50)}, P75=${fmtNum(vP75)}, P90=${fmtNum(vP90)}, P95=${fmtNum(vP95)} (min=${fmtNum(vMin!)}, max=${fmtNum(vMax!)}).**Data:** numeric column \`${vCol}\` from logs/underlying.`,
      )
    }

    if (thresholds.length && values.length) {
      const thr = tMed
      const above = values.filter((v) => v >= thr).length
      const barely = values.filter((v) => v >= thr && v < thr * 1.05).length
      const barelyPct = Math.round((barely / Math.max(1, values.length)) * 100)
      const slack = values.map((v) => (v - thr) / Math.max(Math.abs(thr), 1e-9))
      const slackMed = percentile(slack.slice().sort((a, b) => a - b), 0.5)

      if (barelyPct >= 30 || slackMed < 0.08) {
        const suggest = fmtNum(vP75)
        bullets.push(
          zh
            ? `**上调阈值（过敏）** — 将配置阈值从约 **${fmtNum(thr)}**（列 \`${tCol}\` 中位）上调到约 **${suggest}**（触发值 P75），减少贴线误触发。**数据支持：** ${barely}/${values.length}（${barelyPct}%）次触发仅超出阈值 <5%；中位相对余量 ${(slackMed * 100).toFixed(1)}%。`
            : `**Raise threshold (too sensitive)** — move config ~**${fmtNum(thr)}** (median \`${tCol}\`) up to ~**${suggest}** (P75 of fire values).**Data:** ${barely}/${values.length} (${barelyPct}%) fires within <5% of threshold; median relative slack ${(slackMed * 100).toFixed(1)}%.`,
        )
      } else if (slackMed > 0.5 && above === values.length) {
        const suggest = fmtNum(Math.max(thr, vP50))
        bullets.push(
          zh
            ? `**核对是否过宽** — 当前阈值约 **${fmtNum(thr)}**，但触发值中位余量 ${(slackMed * 100).toFixed(0)}%，多数事件远超门限；若漏报可接受可维持，否则可试探收到 **${suggest}**（P50）并观察召回。**数据支持：** 阈值列 \`${tCol}\` n=${thresholds.length}；触发值相对余量中位 ${(slackMed * 100).toFixed(1)}%。`
            : `**Check if too loose** — threshold ~**${fmtNum(thr)}** but median slack ${(slackMed * 100).toFixed(0)}%; keep if misses OK, else trial **${suggest}** (P50) and watch recall.**Data:** \`${tCol}\` n=${thresholds.length}; median relative slack ${(slackMed * 100).toFixed(1)}%.`,
        )
      } else {
        bullets.push(
          zh
            ? `**阈值与触发值基本匹配** — 配置中位阈值 **${fmtNum(thr)}**（\`${tCol}\`）相对触发值余量中位 ${(slackMed * 100).toFixed(1)}%；可微调 ±5–10% 做 A/B。**数据支持：** 触发值 n=${values.length}，阈值样本 n=${thresholds.length}。`
            : `**Threshold roughly aligned** — median config **${fmtNum(thr)}** (\`${tCol}\`) vs fire values; median slack ${(slackMed * 100).toFixed(1)}%; A/B ±5–10%.**Data:** values n=${values.length}, threshold samples n=${thresholds.length}.`,
        )
      }
      void tMode
    } else if (values.length && !thresholds.length) {
      bullets.push(
        zh
          ? `**写入明确配置阈值** — 日志仅有触发值、无阈值列；建议后管将阈值设为 **${fmtNum(vP90)}**（P90）作初值，再按误报／漏报回调。**数据支持：** 仅 \`${vCol}\` 可算分位；缺 threshold／阈值 列。`
          : `**Set an explicit config threshold** — only fire values present; start admin threshold at **${fmtNum(vP90)}** (P90), then tune on FP/FN.**Data:** \`${vCol}\` percentiles only; no threshold column.`,
      )
    }

    if (labs && labs.total > 0) {
      const fpRate = labs.invalid / Math.max(1, labs.valid + labs.invalid)
      const fpPct = Math.round(fpRate * 100)
      if (valueHit) {
        const { tp, fp } = labeledValueSplit(args.logs, args.labels, valueHit.col)
        const tpS = tp.slice().sort((a, b) => a - b)
        const fpS = fp.slice().sort((a, b) => a - b)
        if (tpS.length >= 2 && fpS.length >= 1) {
          const cut = percentile(fpS, 0.9)
          const tpP10 = percentile(tpS, 0.1)
          const tpP25 = percentile(tpS, 0.25)
          const rawSuggest = cut <= tpP25 ? (cut + tpP25) / 2 : Math.max(cut, tpP10)
          const suggest = fmtNum(rawSuggest)
          bullets.push(
            zh
              ? `**按有效／误报分离阈值** — 建议阈值设为 **${suggest}**（优先抬过误报团簇 P90=${fmtNum(cut)}，并参考有效值 P10=${fmtNum(tpP10)}／P25=${fmtNum(tpP25)}）。**数据支持：** 标注列 \`${labs.col}\` 有效 ${labs.valid}／误报 ${labs.invalid}（误报率 ${fpPct}%）；误报触发值 n=${fpS.length}；有效触发值 n=${tpS.length}。`
              : `**Separate TP/FP with the cut** — set threshold to **${suggest}** (clear FP cluster P90=${fmtNum(cut)}; TP P10=${fmtNum(tpP10)} / P25=${fmtNum(tpP25)}).**Data:** labels \`${labs.col}\` valid ${labs.valid} / FP ${labs.invalid} (FP rate ${fpPct}%); FP values n=${fpS.length}; TP n=${tpS.length}.`,
          )
        } else {
          bullets.push(
            zh
              ? `**结合误报率收紧** — 人工标注误报率 **${fpPct}%**（有效 ${labs.valid}／误报 ${labs.invalid}，列 \`${labs.col}\`）。若 >30%，将阈值至少上调到触发值 **P75=${fmtNum(vP75)}** 后再复盘。**数据支持：** 标注样本 n=${labs.total}；触发值 P75=${fmtNum(vP75)}。`
              : `**Tighten using FP rate** — human FP rate **${fpPct}%** (valid ${labs.valid} / FP ${labs.invalid}, col \`${labs.col}\`). If >30%, raise at least to fire-value **P75=${fmtNum(vP75)}** then re-review.**Data:** labels n=${labs.total}; value P75=${fmtNum(vP75)}.`,
          )
        }
      } else {
        bullets.push(
          zh
            ? `**按误报率定性调参** — 标注误报率 **${fpPct}%**（\`${labs.col}\`：有效 ${labs.valid}／误报 ${labs.invalid}）。缺触发值列时，先对误报主导规则统一上调 10–20% 配置阈值。**数据支持：** 仅标注集 n=${labs.total}。`
            : `**Qualitative tighten from FP rate** — FP **${fpPct}%** (\`${labs.col}\`: valid ${labs.valid} / FP ${labs.invalid}). Without value column, raise config 10–20% on FP-heavy rules.**Data:** labels only n=${labs.total}.`,
        )
      }
    } else {
      bullets.push(
        zh
          ? `**补人工标注以验证** — 尚无「是否有效」标注；上述分位建议为暂定。标注 ≥30 条后再用有效／误报分布锁定阈值。**数据支持：** 人工标注槽为空或缺少 valid/有效 列。`
          : `**Add human labels to validate** — no validity labels yet; percentile suggestions are provisional. Label ≥30 rows then lock via TP/FP split.**Data:** human-label slot empty or missing valid column.`,
      )
    }

    if (args.underlying.some((d) => d.rowCount > 0) && values.length) {
      const uVal = collectNums(args.underlying, VALUE_COLS)
      if (uVal && uVal.values.length >= 5) {
        const uSorted = uVal.values.slice().sort((a, b) => a - b)
        const uP99 = percentile(uSorted, 0.99)
        bullets.push(
          zh
            ? `**与底层分布对齐** — 底层列 \`${uVal.col}\` P99=${fmtNum(uP99)}（n=${uVal.values.length}）。若告警阈值远低于底层 P99，易在正常噪声带误报；建议阈值 ≥ max(告警触发 P75, 底层 P99×0.9)。**数据支持：** 底层 \`${uVal.col}\` vs 告警触发 \`${vCol}\`。`
            : `**Align with underlying distribution** — underlying \`${uVal.col}\` P99=${fmtNum(uP99)} (n=${uVal.values.length}). Thresholds far below underlying P99 false-fire in noise; prefer ≥ max(alert P75, underlying P99×0.9).**Data:** underlying \`${uVal.col}\` vs alert \`${vCol}\`.`,
        )
      }
    }

    bullets.push(
      zh
        ? `**落地步骤** — ① 在后管把该规则阈值改为建议值；② 灰度 24–72h；③ 对比告警量、误报率、漏报投诉；④ 有回归则回滚并记录。**数据支持：** 变更前后各用同一套日志＋标注口径复跑本页。`
        : `**Rollout** — ① set admin threshold to the suggested value; ② canary 24–72h; ③ compare volume / FP / miss complaints; ④ roll back if regresses.**Data:** re-run this page with the same log+label schema before/after.`,
    )
  }

  const title = zh ? `### 优化阈值（${focus}）` : `### Optimize thresholds (${focus})`
  return [title, ...bullets.map((b) => `- ${b}`)].join('\n')
}

function directionGuidance(
  id: OptimizeDirectionId,
  zh: boolean,
  ctx: {
    hasUnderlying: boolean
    hasLogs: boolean
    hasLabels: boolean
    alertName: string
    logs: IngestedDataset[]
    underlying: IngestedDataset[]
    labels: IngestedDataset[]
    lang: AppLang
  },
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
      return buildThresholdOptimizeBullets({
        logs: ctx.logs,
        underlying: ctx.underlying,
        labels: ctx.labels,
        alertName: ctx.alertName,
        lang: ctx.lang,
      })
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
    const slot = ds.slot ? slotLabel(ds.slot, zh ? 'zh-Hans' : 'en') : null
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
  preprocessNotes?: string[]
  optimizeSuggestions?: string[]
  pathSteps?: string[]
}): string {
  const { zh } = args
  return [
    `# ${args.title}`,
    '',
    ...(args.pathSteps?.length
      ? [zh ? '## 排查路径' : '## Investigation path', ...args.pathSteps.map((x) => `- ${x}`), '']
      : []),
    zh ? '## 数据预处理（Agent）' : '## Data preprocessing (agent)',
    ...(args.preprocessNotes?.length
      ? args.preprocessNotes.map((x) => (x.startsWith('-') || x.startsWith('**') ? x : `- ${x}`))
      : [zh ? '- 未触发' : '- none']),
    '',
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
    zh ? '## 优化建议' : '## Optimization suggestions',
    ...(args.optimizeSuggestions?.length
      ? args.optimizeSuggestions.map((x) => (x.startsWith('-') || x.startsWith('**') ? `- ${x.replace(/^-+\s*/, '')}` : `- ${x}`))
      : [zh ? '- （暂无）' : '- (none)']),
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
  lang: AppLang
}): AnalysisResult {
  const zh = args.lang !== 'en'
  const { readback, dataIssues } = profileDatasets(args.datasets, zh)
  if (!args.datasets.length) {
    dataIssues.push(zh ? '未提供任何 CSV 或 API 数据。' : 'No CSV or API data provided.')
  }

  const { preprocessNotes, optimizeSuggestions } = formatPreprocessNotes(args.datasets, args.lang)
  const charts = buildCharts(args.datasets)
  const assumptions: string[] = [
    zh
      ? 'CSV 首行视为表头；数值列按可解析数字统计；API JSON 优先取 data/rows/items 等数组字段。'
      : 'CSV first row is treated as header; numeric stats use parseable numbers; JSON prefers data/rows/items arrays.',
    zh
      ? '预处理 Agent 对每一行做全量扫描（min/max/P50/P90/P99），仅把 RAM 工作集做水库抽样供图表／推理。'
      : 'Preprocess agent full-scans every row (min/max/P50/P90/P99); only the RAM working set is reservoir-sampled for charts/reasoning.',
    zh
      ? '图表最多画 24 点／10 类；分位数来自全量扫描的数值水库估计。'
      : 'Charts draw ≤24 points / ≤10 categories; percentiles are estimated from the full-scan numeric reservoir.',
  ]
  if (!args.question.trim()) {
    assumptions.push(
      zh ? '未提供具体问题 — 给出数据概览与明显质量问题。' : 'No question provided — overview + data-quality notes only.',
    )
  }

  const q = args.question.trim()
  const rawRows = args.datasets.reduce(
    (n, d) => n + (d.preprocess?.originalRowCount || d.rowCount),
    0,
  )
  const workRows = args.datasets.reduce((n, d) => n + d.rowCount, 0)
  const answerParts: string[] = []
  if (q) {
    answerParts.push(
      zh
        ? `针对问题「${q.slice(0, 200)}」：基于 **${args.datasets.length}** 个数据集（原始约 **${rawRows.toLocaleString()}** 行 → 工作集 **${workRows.toLocaleString()}** 行）完成审阅。`
        : `For “${q.slice(0, 200)}”: reviewed **${args.datasets.length}** dataset(s) (raw ~**${rawRows.toLocaleString()}** rows → working set **${workRows.toLocaleString()}**).`,
    )
  } else {
    answerParts.push(
      zh
        ? '已完成摄入、预处理与画像。请补充具体分析问题以得到更定向的结论。'
        : 'Ingest + preprocess + profiling complete. Add a concrete question for a directed conclusion.',
    )
  }

  answerParts.push(
    zh
      ? '**预处理说明：** 见下方「数据预处理（Agent）」——若触发了抽样／分位数汇总，结论基于工作集 + 扫描窗口统计，并已据此给出优化建议。'
      : '**Preprocess:** see “Data preprocessing (agent)” below — if sampling/percentile summaries ran, conclusions use the working set + scan-window stats, with optimization suggestions derived from them.',
  )

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
        ? '未发现严重空值／结构问题；可在图表与分位数建议上进一步细化。'
        : 'No severe emptiness/structure issues; charts and percentile suggestions can support a deeper follow-up.',
    )
  }

  const answer = answerParts.join('\n\n')
  return {
    readback,
    charts,
    answer,
    dataIssues,
    assumptions,
    preprocessNotes,
    optimizeSuggestions,
    reportMarkdown: buildReport({
      zh,
      title: zh ? '通用分析报告' : 'General analysis report',
      readback,
      charts,
      answer,
      dataIssues,
      assumptions,
      preprocessNotes,
      optimizeSuggestions,
    }),
  }
}

/** 告警优化 — three slots + optional alert name + multi-select directions. */
export function analyzeAlertOptimize(args: {
  datasets: IngestedDataset[]
  alertName: string
  directions: OptimizeDirectionId[]
  notes: string
  lang: AppLang
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

  const { preprocessNotes, optimizeSuggestions } = formatPreprocessNotes(scoped, args.lang)
  const charts = buildCharts(scoped)
  const dirs =
    args.directions.length > 0
      ? args.directions
      : (['threshold', 'false_positive'] as OptimizeDirectionId[])

  const pathSteps = zh
    ? [
        '摄入：底层数据／告警日志／人工标注（至少一项）',
        '预处理 Agent：巨型数据 → 抽样 + min/max/P50/P90/P99',
        args.alertName ? `锁定告警名称：${args.alertName}` : '未指定告警名称 — 按全体规则汇总',
        `选定优化方向：${dirs.map((d) => directionLabel(d, args.lang)).join('、')}`,
        '画像字段质量并画图',
        '按方向输出建议，并说明预处理与优化建议',
      ]
    : [
        'Ingest: underlying / alert logs / human labels (≥1)',
        'Preprocess agent: giant data → sample + min/max/P50/P90/P99',
        args.alertName ? `Focus alert: ${args.alertName}` : 'No alert name — aggregate across rules',
        `Directions: ${dirs.map((d) => directionLabel(d, 'en')).join(', ')}`,
        'Profile quality + charts',
        'Emit direction recommendations; declare preprocess + optimization suggestions',
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
      ? '每一行都参与预处理扫描；分位数来自全量扫描水库，行级推理用工作集样本。'
      : 'Every row participates in the preprocess scan; percentiles come from the full-scan reservoir, row-level reasoning uses the working-set sample.',
  ]

  const ctx = {
    hasUnderlying,
    hasLogs,
    hasLabels,
    alertName: args.alertName.trim(),
    logs: bySlot.alert_logs,
    underlying: bySlot.underlying,
    labels: bySlot.human_labels,
    lang: args.lang,
  }
  const rawRows = scoped.reduce((n, d) => n + (d.preprocess?.originalRowCount || d.rowCount), 0)
  const workRows = scoped.reduce((n, d) => n + d.rowCount, 0)
  const answerParts: string[] = [
    zh
      ? `按排查路径完成告警优化审阅（有效集 **${scoped.filter((d) => d.rowCount).length}**；原始约 **${rawRows.toLocaleString()}** 行 → 工作集 **${workRows.toLocaleString()}** 行）。`
      : `Completed alert-optimize review (**${scoped.filter((d) => d.rowCount).length}** active sets; raw ~**${rawRows.toLocaleString()}** → working set **${workRows.toLocaleString()}** rows).`,
  ]
  answerParts.push(
    zh
      ? '**预处理说明：** 见「数据预处理（Agent）」；阈值／误报建议会结合扫描得到的分位数与抽样行。'
      : '**Preprocess:** see “Data preprocessing (agent)”; threshold/FP suggestions incorporate scan-window percentiles and sampled rows.',
  )
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
    preprocessNotes,
    optimizeSuggestions,
    reportMarkdown: buildReport({
      zh,
      title: zh ? '告警优化分析报告' : 'Alert optimization report',
      readback,
      charts,
      answer,
      dataIssues,
      assumptions,
      preprocessNotes,
      optimizeSuggestions,
      pathSteps,
    }),
  }
}

function assumptionsNoteMissing(
  zh: boolean,
  dataIssues: string[],
  slot: AlertDataSlot,
) {
  const label = slotLabel(slot, zh ? 'zh-Hans' : 'en')
  dataIssues.push(
    zh ? `未提供「${label}」— 相关结论将受限。` : `Missing “${label}” — related conclusions are limited.`,
  )
}

export function initialStatusSteps(
  lang: AppLang,
  mode: DeskMode = 'general',
): StatusStep[] {
  const zh = lang !== 'en'
  if (mode === 'alert_optimize') {
    return [
      { id: 'ingest', label: zh ? '摄入三槽数据源' : 'Ingest three data slots', state: 'pending' },
      {
        id: 'preprocess',
        label: zh ? '预处理巨型数据（抽样／分位数）' : 'Preprocess giant data (sample / percentiles)',
        state: 'pending',
      },
      { id: 'scope', label: zh ? '锁定告警名称与优化方向' : 'Scope alert name & directions', state: 'pending' },
      { id: 'profile', label: zh ? '画像字段与质量' : 'Profile fields & quality', state: 'pending' },
      { id: 'chart', label: zh ? '构建图表' : 'Build charts', state: 'pending' },
      { id: 'path', label: zh ? '沿排查路径推理' : 'Reason along investigation path', state: 'pending' },
      { id: 'draft', label: zh ? '整理结论、预处理说明与优化建议' : 'Draft answer, preprocess notes & suggestions', state: 'pending' },
    ]
  }
  return [
    { id: 'ingest', label: zh ? '摄入 CSV／API 数据' : 'Ingest CSV / API data', state: 'pending' },
    {
      id: 'preprocess',
      label: zh ? '预处理巨型数据（抽样／分位数）' : 'Preprocess giant data (sample / percentiles)',
      state: 'pending',
    },
    { id: 'profile', label: zh ? '画像字段与质量' : 'Profile fields & quality', state: 'pending' },
    { id: 'chart', label: zh ? '构建图表' : 'Build charts', state: 'pending' },
    { id: 'reason', label: zh ? '审阅问题并推理' : 'Review question & reason', state: 'pending' },
    { id: 'draft', label: zh ? '整理结论、预处理说明与优化建议' : 'Draft answer, preprocess notes & suggestions', state: 'pending' },
  ]
}

/** Compact context string for LLM / local follow-up (keeps token & memory bounded). */
export function buildAoFollowUpContext(args: {
  mode: DeskMode
  result: AnalysisResult
  datasets: IngestedDataset[]
  alertName?: string
  directions?: OptimizeDirectionId[]
  question?: string
  lang: AppLang
}): string {
  const zh = args.lang !== 'en'
  const dsLines = args.datasets.map((d) => {
    const slot = d.slot ? slotLabel(d.slot, args.lang) : d.kind
    return `- [${slot}] ${d.name}: ${d.rowCount}×${d.columns.length} cols=${d.columns.slice(0, 10).join(',')}`
  })
  return [
    zh ? `模式：${args.mode === 'alert_optimize' ? '告警优化' : '通用分析'}` : `Mode: ${args.mode}`,
    args.alertName ? (zh ? `告警名：${args.alertName}` : `Alert: ${args.alertName}`) : '',
    args.directions?.length
      ? zh
        ? `方向：${args.directions.map((d) => directionLabel(d, args.lang)).join('、')}`
        : `Directions: ${args.directions.map((d) => directionLabel(d, 'en')).join(', ')}`
      : '',
    args.question?.trim() ? (zh ? `原问题：${args.question.trim().slice(0, 240)}` : `Question: ${args.question.trim().slice(0, 240)}`) : '',
    zh ? '## 数据集' : '## Datasets',
    ...dsLines,
    zh ? '## 既有结论（截断）' : '## Prior conclusion (truncated)',
    args.result.answer.slice(0, 3500),
    zh ? '## 数据问题' : '## Data issues',
    ...(args.result.dataIssues.slice(0, 12).map((x) => `- ${x}`) || ['-']),
    zh ? '## 假设' : '## Assumptions',
    ...args.result.assumptions.slice(0, 8).map((x) => `- ${x}`),
  ]
    .filter(Boolean)
    .join('\n')
}

/**
 * Local (no-LLM) follow-up: answer from the existing analysis + light re-stats.
 * Always returns something useful so chat works offline.
 */
export function followUpAlertOptimize(args: {
  question: string
  result: AnalysisResult
  datasets: IngestedDataset[]
  lang: AppLang
  mode: DeskMode
  alertName?: string
  directions?: OptimizeDirectionId[]
}): string {
  const zh = args.lang !== 'en'
  const q = args.question.trim()
  const qLower = q.toLowerCase()
  const parts: string[] = []

  if (/阈值|threshold|上调|下调|p75|p90|分位/i.test(q)) {
    const thr = buildThresholdOptimizeBullets({
      logs: args.datasets.filter((d) => d.slot === 'alert_logs' || !d.slot),
      underlying: args.datasets.filter((d) => d.slot === 'underlying'),
      labels: args.datasets.filter((d) => d.slot === 'human_labels'),
      alertName: args.alertName || '',
      lang: args.lang,
    })
    parts.push(
      zh
        ? '按你的追问，我重新整理了 **优化阈值** 要点：'
        : 'Re-focused **threshold optimize** bullets for your follow-up:',
    )
    parts.push(thr)
  } else if (/误报|false\s*pos|fp|有效|标注|label/i.test(qLower)) {
    const labs = args.datasets.filter((d) => d.slot === 'human_labels')
    if (!labs.length) {
      parts.push(
        zh
          ? '- **缺标注数据** — 请在「人工标注」槽补 CSV／API 后再问误报率。**数据支持：** 当前 human_labels 槽为空。'
          : '- **Missing labels** — add CSV/API to the human-labels slot.**Data:** human_labels slot empty.',
      )
    } else {
      for (const ds of labs) {
        const s = summarizeLabels(ds, zh)
        if (s) parts.push(`- ${s}`)
      }
      parts.push(
        zh
          ? '- **下一步** — 若误报率偏高，回到「优化阈值」方向，按误报团簇上调门限；或勾选「降低误报」再分析。'
          : '- **Next** — if FP rate is high, re-run with threshold direction to raise past FP clusters, or enable “cut false positives”.',
      )
    }
  } else if (/图|chart|分布|趋势/i.test(q)) {
    parts.push(
      zh
        ? `当前报告含 **${args.result.charts.length}** 张图（最多抽样 24 点／10 类）。若需更细分布，请缩小告警名称或减少行数后重跑分析。`
        : `Report has **${args.result.charts.length}** chart(s) (≤24 points / 10 categories). Narrow alert name or trim rows, then re-analyze for finer plots.`,
    )
    for (const c of args.result.charts.slice(0, 4)) {
      parts.push(`- ${c.title}: ${c.labels.slice(0, 4).join(', ')}…`)
    }
  } else if (/假设|assumption|数据问题|issue|缺口|缺失/i.test(qLower)) {
    parts.push(zh ? '**数据问题：**' : '**Data issues:**')
    for (const x of args.result.dataIssues.slice(0, 10)) parts.push(`- ${x}`)
    if (!args.result.dataIssues.length) parts.push(zh ? '- 无' : '- none')
    parts.push(zh ? '**假设：**' : '**Assumptions:**')
    for (const x of args.result.assumptions.slice(0, 10)) parts.push(`- ${x}`)
  } else {
    // Quote relevant snippets from prior answer
    const lines = args.result.answer.split('\n').filter((l) => l.trim())
    const hits = lines.filter((l) => {
      const tokens = q.replace(/[?？。！!]/g, ' ').split(/\s+/).filter((t) => t.length >= 2)
      return tokens.some((t) => l.toLowerCase().includes(t.toLowerCase()))
    })
    parts.push(
      zh
        ? '基于上一轮结论继续回答（本地规则；接上 LLM 后可做更深推理）：'
        : 'Continuing from the prior conclusion (local rules; LLM enables deeper reasoning):',
    )
    if (hits.length) {
      for (const h of hits.slice(0, 6)) parts.push(h.startsWith('-') ? h : `- ${h}`)
    } else {
      parts.push(
        zh
          ? `- 上一轮结论摘要：${args.result.answer.replace(/\s+/g, ' ').slice(0, 420)}…`
          : `- Prior answer digest: ${args.result.answer.replace(/\s+/g, ' ').slice(0, 420)}…`,
      )
      parts.push(
        zh
          ? '- 可追问：阈值怎么改、误报率、某告警名、数据缺口、落地步骤。'
          : '- You can ask: how to change thresholds, FP rate, a specific alert, data gaps, rollout steps.',
      )
    }
  }

  parts.push(
    zh
      ? `\n_追问不会改动已摄入数据；若要换数据源或方向，请调整上方输入后重新点「分析」。_`
      : `\n_Follow-ups do not mutate ingested data; change inputs above and click Analyze to refresh the base report._`,
  )
  return parts.join('\n')
}

export function appendFollowUpsToReport(
  reportMarkdown: string,
  turns: AoFollowUpTurn[],
  lang: AppLang,
): string {
  if (!turns.length) return reportMarkdown
  const zh = lang !== 'en'
  const lines = [reportMarkdown, '', zh ? '## 追问对话' : '## Follow-up chat', '']
  for (const t of turns) {
    const who = t.role === 'user' ? (zh ? '用户' : 'User') : zh ? '助手' : 'Assistant'
    lines.push(`### ${who}`)
    lines.push(t.content)
    lines.push('')
  }
  return lines.join('\n')
}
