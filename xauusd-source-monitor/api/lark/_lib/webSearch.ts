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

/** Drop wiki noise that only matched CJK character fragments. */
function relevanceScore(question: string, hit: WebHit): number {
  const q = question.toLowerCase()
  const hay = `${hit.title} ${hit.snippet}`.toLowerCase()
  let score = 0
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
  ]
  for (const n of needles) {
    if (q.includes(n) && hay.includes(n)) score += n.length >= 4 ? 4 : 3
  }
  // Title exact-ish boosts
  if (/永续期货|perpetual futures/i.test(hit.title) && /永续|perpetual/i.test(q)) score += 12
  if (/合约|合約|futures|perp|期货|期貨/.test(q) && /永续期货|perpetual futures|perpetual swap/i.test(hit.title)) {
    score += 10
  }
  // Noise: celebrity / ESG “可持续” pages matching the 永续 bigram
  if (
    /振永|鄭秀晶|郑秀晶|偶像|音樂|音乐|电视剧|電視劇|可持续发展|可持續發展|sustainable development/i.test(
      hay,
    ) &&
    /永续|perpetual|合约|合約|风险|風險/.test(q)
  ) {
    score -= 25
  }
  return score
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

    let unique = dedupeHits(hits)
      .map((h) => ({ hit: h, score: relevanceScore(q, h) }))
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((x) => x.hit)
      .slice(0, 5)
    // If filters wiped everything, keep top DDG/wiki by query order but drop obvious noise
    if (!unique.length) {
      unique = dedupeHits(hits)
        .filter((h) => !/振永|鄭秀晶|郑秀晶|偶像|音樂中心/.test(`${h.title}${h.snippet}`))
        .slice(0, 4)
    }
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
        `关于「${question.slice(0, 60)}」，我这边公开检索暂时没拉到可用条目。`,
        '',
        '你可以换个关键词再问，或直接贴告警让我帮你排查。产品／权限找 **@Yan Haixiang**。',
      ].join('\n')
    }
    if (lang === 'zh-Hant') {
      return [
        `關於「${question.slice(0, 60)}」，我這邊公開檢索暫時沒拉到可用條目。`,
        '',
        '你可以換個關鍵詞再問，或直接貼告警讓我幫你排查。產品／權限找 **@Yan Haixiang**。',
      ].join('\n')
    }
    return [
      `I couldn’t pull usable public results for “${question.slice(0, 60)}” just now.`,
      '',
      'Try another phrasing, or paste an alert. Product / access: **@Yan Haixiang**.',
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
