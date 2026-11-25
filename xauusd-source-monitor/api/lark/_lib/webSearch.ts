import type { Lang } from './types.js'

export type WebHit = {
  title: string
  url: string
  snippet: string
  source: string
}

export type WebSearchResult = {
  ok: boolean
  query: string
  hits: WebHit[]
  error?: string
}

function stripHtml(s: string): string {
  return s
    .replace(/<[^>]+>/g, '')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

function wikiLang(lang: Lang): 'zh' | 'en' {
  return lang === 'en' ? 'en' : 'zh'
}

/** Canonical queries first so Chinese free-text does not match random wiki pages. */
function expandQueries(question: string, lang: Lang): string[] {
  const q = question.replace(/^(什么是|什麼是|什么叫|什麼叫|请问|請問|介绍一下|介紹一下)\s*/i, '').trim()
  const out: string[] = []
  const lower = q.toLowerCase()
  if (/永续合约|永續合約|永续期货|永續期貨|perp(etual)?\s*(futures?|swap|contract)?/i.test(q)) {
    // Prefer precise titles before raw chat phrasing
    if (lang !== 'en') out.push('永续期货', '永续合约')
    out.push('perpetual futures', 'perpetual swap')
  }
  if (/币安|幣安|\bbinance\b/i.test(q)) {
    out.push('Binance', '幣安', '币安')
  }
  if (/\bokx\b|欧易|歐易/i.test(q)) out.push('OKX', '欧易')
  if (/\bbybit\b/i.test(q)) out.push('Bybit')
  if (/\bkraken\b/i.test(q)) out.push('Kraken')
  if (/\bbitget\b/i.test(q)) out.push('Bitget')
  if (/funding|资金费率|資金費率/.test(lower) || /资金费率|資金費率/.test(q)) {
    out.push('funding rate', '资金费率')
  }
  if (/强平|強平|liquidation/.test(q)) out.push('liquidation', '强平')
  if (/\badl\b|自动减仓|自動減倉/.test(lower) || /自动减仓|自動減倉/.test(q)) {
    out.push('auto-deleveraging', 'ADL')
  }
  if (q) out.push(q)
  if (question.trim() && question.trim() !== q) out.push(question.trim())
  const seen = new Set<string>()
  return out
    .filter((x) => {
      const k = x.toLowerCase()
      if (!k || seen.has(k)) return false
      seen.add(k)
      return true
    })
    .slice(0, 5)
}

/** Venue aliases so 币安 ↔ 幣安 ↔ Binance (and peers) score as the same entity. */
const VENUE_ALIASES: { cue: RegExp; tokens: string[] }[] = [
  { cue: /币安|幣安|\bbinance\b/i, tokens: ['binance', '币安', '幣安'] },
  { cue: /\bokx\b|欧易|歐易/i, tokens: ['okx', '欧易', '歐易'] },
  { cue: /\bbybit\b/i, tokens: ['bybit'] },
  { cue: /\bkraken\b/i, tokens: ['kraken'] },
  { cue: /\bbitget\b/i, tokens: ['bitget'] },
]

/** Meaningful query tokens (len≥2); ignore single CJK chars that cause 帅→彭帅 collisions. */
function queryTokens(question: string): string[] {
  const q = question.toLowerCase().trim()
  const out = new Set<string>()
  for (const w of q.split(/[^a-z0-9\u4e00-\u9fff]+/i)) {
    if (w.length >= 2) out.add(w)
  }
  const cjk = q.match(/[\u4e00-\u9fff]+/g) || []
  for (const run of cjk) {
    if (run.length >= 2) out.add(run)
    for (let i = 0; i + 1 < run.length; i++) out.add(run.slice(i, i + 2))
  }
  for (const { cue, tokens } of VENUE_ALIASES) {
    if (cue.test(question)) for (const t of tokens) out.add(t.toLowerCase())
  }
  for (const stop of [
    '什么',
    '什麼',
    '怎么',
    '怎麼',
    '如何',
    '请问',
    '請問',
    '一下',
    '这个',
    '這個',
    '是不是',
    '知道',
    '知道吗',
    '知道嗎',
    '你知',
    '你知道',
    '你知道吗',
    '你知道嗎',
    '认识',
    '認識',
    '了解',
  ]) {
    out.delete(stop)
  }
  return [...out].filter((t) => t.length >= 2)
}

/** Drop wiki noise that only matched CJK character fragments (e.g. 帅 → 彭帅). */
function relevanceScore(question: string, hit: WebHit): number {
  const q = question.toLowerCase()
  const hay = `${hit.title} ${hit.snippet}`.toLowerCase()
  const title = hit.title.toLowerCase()
  let score = 0
  const tokens = queryTokens(question)
  // Require real multi-char overlap with the title — never score on a lone character
  const titleHits = tokens.filter((t) => title.includes(t))
  if (!titleHits.length) {
    // Body-only overlap is weak; only allow with finance needles also in the query
    const bodyHits = tokens.filter((t) => t.length >= 3 && hay.includes(t))
    if (!bodyHits.length) return 0
  } else {
    for (const t of titleHits) score += t.length >= 3 ? 5 : 3
  }

  const needles = [
    '永续',
    '永續',
    'perpetual',
    'futures',
    'funding',
    'liquidation',
    '强平',
    '強平',
    'adl',
    '合约',
    '合約',
    '期货',
    '期貨',
    'swap',
    'mark',
    'index',
    'xau',
    '黄金',
    '黃金',
    'binance',
    '币安',
    '幣安',
    'okx',
    'bybit',
    'kraken',
    'bitget',
    '交易所',
  ]
  for (const n of needles) {
    if (q.includes(n) && hay.includes(n)) score += n.length >= 4 ? 4 : 3
  }
  // Cross-script venue needles (query 币安 ↔ title 幣安 / Binance)
  for (const { cue, tokens } of VENUE_ALIASES) {
    if (!cue.test(question)) continue
    if (tokens.some((t) => hay.includes(t.toLowerCase()))) score += 6
  }
  if (/永续期货|perpetual futures/i.test(hit.title) && /永续|perpetual/i.test(q)) score += 12
  if (/合约|合約|futures|perp|期货|期貨/.test(q) && /永续期货|perpetual futures|perpetual swap/i.test(hit.title)) {
    score += 10
  }
  if (/币安|幣安|binance/i.test(q) && /binance|币安|幣安/i.test(hit.title)) score += 14
  if (/\bokx\b|欧易|歐易/i.test(q) && /okx|欧易|歐易/i.test(hit.title)) score += 14
  if (/\bbybit\b/i.test(q) && /bybit/i.test(hit.title)) score += 14
  // Celebrity / scandal / ESG noise
  if (
    /彭帅|彭帥|张高丽|張高麗|性丑闻|性醜聞|振永|鄭秀晶|郑秀晶|偶像|音樂|音乐|电视剧|電視劇|可持续发展|可持續發展|sustainable development/i.test(
      hay,
    )
  ) {
    score -= 40
  }
  return score
}

const RISK_OR_VENUE_RE =
  /永续|永續|合约|合約|funding|mark|index|强平|強平|adl|风险|風險|告警|黄金|黃金|xau|perp|币安|幣安|binance|okx|bybit|kraken|bitget|kitco|交易所|exchange|友商|报价|報價|基差|bps/i

/** Knowledge / definition asks — search even when short (e.g.「什么是ADL」). */
const KNOWLEDGE_ASK_RE =
  /什么是|什麼是|什么叫|什麼叫|怎么|怎麼|为什么|為什麼|为何|為何|介绍|介紹|解释|解釋|是什么|是什麼|啥意思|什么意思|什麼意思|who\s+is\b|what\s+is\b|what\s+are\b|how\s+(do|does|to|can)\b|why\s+/i

/** Only auto-search substantive product / risk / venue questions — never banter like「我帅不」. */
export function shouldAutoWebSearch(question: string): boolean {
  const t = question.trim()
  if (!t || t.length < 2) return false
  // Clock / “what time” / “我意思时间” — never search (wiki hijacks「意思」→ band names)
  if (
    /^(现在几点|現在幾點|现在几点了|現在幾點了|几点了|幾點了|几点啦|幾點啦|几点钟|幾點鐘|现在时间|現在時間|报时|報時|what\s+time\s+is\s+it(?:\s+now)?|what'?s\s+the\s+time|current\s+time)\s*[?？!！.。~]*\s*$/i.test(
      t,
    ) ||
    /^(我意思|我说|我是说|我是說|我指的是|意思是|就是|就是问|就是問)?\s*(时间|時間|几点|幾點|几点了|幾點了|报时|報時|the\s+time|time)\s*[?？!！.。~]*\s*$/i.test(
      t,
    )
  ) {
    return false
  }
  // Short social / flirt / filler
  if (
    /^(我帅不[帅帥]?|我帅吗|我帅嗎|帅不帅|帥不帥|好看吗|好看嗎|漂亮吗|漂亮嗎|可爱吗|可愛嗎|爱我吗|愛我嗎|在吗|在嗎|哈哈+|呵呵+|嗯+|哦+|噢+|lol+|haha+)\s*[?？!！.。~]*\s*$/i.test(
      t,
    )
  ) {
    return false
  }
  // Venue / product asks like「币安你知道吗」are always searchable
  if (RISK_OR_VENUE_RE.test(t)) return true
  // Short definition / how-why asks still search (avoid soft-chat → menu fallback)
  // But not “意思时间” style clarifications (already excluded above)
  if (KNOWLEDGE_ASK_RE.test(t) && t.length >= 3) return true
  if (t.length <= 8) return false
  return true
}

async function wikiSearch(wiki: 'zh' | 'en', query: string, limit: number): Promise<WebHit[]> {
  const api = `https://${wiki}.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(
    query,
  )}&srlimit=${limit}&utf8=1&format=json`
  const r = await fetch(api, {
    headers: { 'User-Agent': 'VERiskCopilot/1.0 (Lark bot; educational)' },
    signal: AbortSignal.timeout(12_000),
  })
  if (!r.ok) return []
  const data = (await r.json()) as {
    query?: { search?: { title: string; snippet: string; pageid: number }[] }
  }
  const rows = data.query?.search || []
  return rows.map((row) => ({
    title: row.title,
    url: `https://${wiki}.wikipedia.org/wiki/${encodeURIComponent(row.title.replace(/ /g, '_'))}`,
    snippet: stripHtml(row.snippet || ''),
    source: wiki === 'zh' ? 'Wikipedia（中文）' : 'Wikipedia',
  }))
}

async function wikiSummary(wiki: 'zh' | 'en', title: string): Promise<string | null> {
  const api = `https://${wiki}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(
    title.replace(/ /g, '_'),
  )}`
  try {
    const r = await fetch(api, {
      headers: { 'User-Agent': 'VERiskCopilot/1.0 (Lark bot; educational)' },
      signal: AbortSignal.timeout(10_000),
    })
    if (!r.ok) return null
    const data = (await r.json()) as { extract?: string }
    return (data.extract || '').trim() || null
  } catch {
    return null
  }
}

async function duckDuckGoInstant(query: string): Promise<WebHit[]> {
  try {
    const api = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`
    const r = await fetch(api, {
      headers: { 'User-Agent': 'VERiskCopilot/1.0' },
      signal: AbortSignal.timeout(10_000),
    })
    if (!r.ok) return []
    const data = (await r.json()) as {
      AbstractText?: string
      AbstractURL?: string
      AbstractSource?: string
      Heading?: string
      RelatedTopics?: ({ Text?: string; FirstURL?: string } | { Name?: string; Topics?: unknown })[]
    }
    const hits: WebHit[] = []
    if (data.AbstractText && data.AbstractURL) {
      hits.push({
        title: data.Heading || query,
        url: data.AbstractURL,
        snippet: data.AbstractText.slice(0, 400),
        source: data.AbstractSource || 'DuckDuckGo',
      })
    }
    for (const topic of data.RelatedTopics || []) {
      if (!('Text' in topic) || !topic.Text || !topic.FirstURL) continue
      hits.push({
        title: topic.Text.split(' - ')[0] || topic.Text.slice(0, 60),
        url: topic.FirstURL,
        snippet: topic.Text.slice(0, 220),
        source: 'DuckDuckGo',
      })
      if (hits.length >= 5) break
    }
    return hits
  } catch {
    return []
  }
}

function dedupeHits(hits: WebHit[]): WebHit[] {
  const seen = new Set<string>()
  const out: WebHit[] = []
  for (const h of hits) {
    const key = (h.url || h.title).toLowerCase()
    if (!key || seen.has(key)) continue
    seen.add(key)
    out.push(h)
  }
  return out
}

/** Public-web search for normal Q&A when local KB has no high-relevance hit. */
export async function searchWeb(question: string, lang: Lang): Promise<WebSearchResult> {
  const q = question.trim()
  if (!q) return { ok: false, query: q, hits: [], error: 'empty' }

  const queries = expandQueries(q, lang)
  const primaryWiki = wikiLang(lang)
  const hits: WebHit[] = []

  try {
    for (const query of queries) {
      const wikiHits = await wikiSearch(primaryWiki, query, 4)
      hits.push(...wikiHits)
      if (primaryWiki === 'zh') {
        hits.push(...(await wikiSearch('en', query, 3)))
      }
      hits.push(...(await duckDuckGoInstant(query)))
      if (dedupeHits(hits).length >= 4) break
    }

    // Never fall back to unfiltered wiki hits — weak CJK fragment matches (帅→彭帅) stay out
    let unique = dedupeHits(hits)
      .map((h) => ({ hit: h, score: relevanceScore(q, h) }))
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((x) => x.hit)
      .slice(0, 5)
    // Enrich top 2 with fuller Wikipedia extracts
    for (const hit of unique.slice(0, 2)) {
      const m = hit.url.match(/https:\/\/(zh|en)\.wikipedia\.org\/wiki\/(.+)$/)
      if (!m) continue
      const extract = await wikiSummary(m[1] as 'zh' | 'en', decodeURIComponent(m[2]!).replace(/_/g, ' '))
      if (extract && extract.length > hit.snippet.length) {
        hit.snippet = extract.slice(0, 500)
      }
    }
    unique = unique.filter((h) => h.snippet || h.url)

    return { ok: unique.length > 0, query: queries[0] || q, hits: unique }
  } catch (e) {
    return {
      ok: false,
      query: q,
      hits: [],
      error: e instanceof Error ? e.message : 'search failed',
    }
  }
}

/** Format search hits as a readable Lark card body with explicit sources. */
export function formatWebSearchAnswer(lang: Lang, question: string, result: WebSearchResult): string {
  if (!result.hits.length) {
    if (lang === 'zh-Hans') {
      return [
        `嗯，公开网上我暂时没搜到靠谱结果（「${question.slice(0, 48)}」）。`,
        '',
        '你可以换个说法再问我；若是问我自己的配置／cron／推送，直接说「你有多少 cron」这类，我按本机配置答，不必走检索。',
      ].join('\n')
    }
    if (lang === 'zh-Hant') {
      return [
        `嗯，公開網上我暫時沒搜到靠譜結果（「${question.slice(0, 48)}」）。`,
        '',
        '你可以換個說法再問我；若是問我自己的配置／cron／推送，直接問就行，我按本機配置答。',
      ].join('\n')
    }
    return [
      `Hmm, I didn’t find solid public results for “${question.slice(0, 48)}”.`,
      '',
      'Try another phrasing — or if you’re asking about *my* crons / pushes, just ask that directly and I’ll answer from config.',
    ].join('\n')
  }

  const top = result.hits[0]!
  const lines: string[] = []
  if (lang === 'zh-Hans') {
    lines.push('🔎 **检索摘要**', '')
    lines.push(top.snippet || `先看公开资料里的「${top.title}」。`)
    lines.push('', '📎 **数据源**')
  } else if (lang === 'zh-Hant') {
    lines.push('🔎 **檢索摘要**', '')
    lines.push(top.snippet || `先看公開資料裡的「${top.title}」。`)
    lines.push('', '📎 **資料來源**')
  } else {
    lines.push('🔎 **Search summary**', '')
    lines.push(top.snippet || `Starting from public notes on “${top.title}”.`)
    lines.push('', '📎 **Sources**')
  }
  for (const h of result.hits.slice(0, 4)) {
    const label = h.source ? `${h.title} · ${h.source}` : h.title
    lines.push(`• [${label}](${h.url})`)
    if (h !== top && h.snippet) {
      lines.push(`  ${h.snippet.slice(0, 140)}${h.snippet.length > 140 ? '…' : ''}`)
    }
  }
  return lines.join('\n')
}

/** Compact context block for LLM synthesis (must cite these URLs). */
export function webSearchContext(result: WebSearchResult): string {
  if (!result.hits.length) return 'Web search returned no hits.'
  return [
    'Public web search hits (cite these URLs as 数据源 / Sources; do not invent URLs):',
    ...result.hits.map(
      (h, i) =>
        `[${i + 1}] ${h.title} | ${h.source} | ${h.url}\n${h.snippet.slice(0, 360)}`,
    ),
  ].join('\n\n')
}
