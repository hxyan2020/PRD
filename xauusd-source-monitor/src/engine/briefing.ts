import type { AppLang } from '../i18n/messages'
import type { Briefing, BriefingSeverity, SourceHealth, TriggerEvent } from '../types'
import { citationsToLegacyLines, collectCitations, staticCitationCatalog } from './citations'

function directionWord(bps: number, lang: AppLang): string {
  if (lang === 'zh-Hant') {
    if (bps > 5) return '買盤上抬 / 賣盤被抬'
    if (bps < -5) return '賣盤下壓 / 買盤被打'
    return '雙向但分布不均'
  }
  if (bps > 5) return 'bid higher / offer lifted'
  if (bps < -5) return 'offer lower / bid hit'
  return 'two-way but uneven'
}

function sessionBucket(d = new Date(), lang: AppLang = 'en'): string {
  const h = d.getUTCHours()
  if (lang === 'zh-Hant') {
    if (h >= 0 && h < 7) return '亞洲尾盤 / 倫敦開盤前'
    if (h >= 7 && h < 12) return '倫敦現貨黃金時段'
    if (h >= 12 && h < 17) return '倫敦–紐約重疊時段'
    return '紐約午後 / 亞洲開盤前'
  }
  if (h >= 0 && h < 7) return 'Asia late / London pre-open'
  if (h >= 7 && h < 12) return 'London cash gold hours'
  if (h >= 12 && h < 17) return 'London–NY overlap'
  return 'NY afternoon / Asia pre-open'
}

function techNote(history: { t: number; px: number }[], composite: number, lang: AppLang): string {
  if (history.length < 5) {
    return lang === 'zh-Hant'
      ? '本地 tick 不足以計算 RSI/MA；改以跨場所結構為主。'
      : 'Insufficient local ticks for RSI/MA; relying on cross-venue structure.'
  }
  const window = history.slice(-30)
  const first = window[0]!.px
  const last = composite
  const ret = ((last - first) / first) * 100
  const highs = window.map((w) => w.px)
  const max = Math.max(...highs)
  const min = Math.min(...highs)
  const rangeBps = ((max - min) / last) * 10_000
  if (lang === 'zh-Hant') {
    return `本地 ${window.length} tick 視窗：${ret >= 0 ? '+' : ''}${ret.toFixed(3)}%，振幅 ${rangeBps.toFixed(1)} bps；最新 ${last.toFixed(2)} vs 高 ${max.toFixed(2)} / 低 ${min.toFixed(2)}。`
  }
  return `Local ${window.length}-tick window: ${ret >= 0 ? '+' : ''}${ret.toFixed(3)}%, range ${rangeBps.toFixed(1)} bps; last ${last.toFixed(2)} vs window high ${max.toFixed(2)} / low ${min.toFixed(2)}.`
}

type BriefingCause =
  | { kind: 'known'; en: string; zh: string }
  | { kind: 'undeclared' }

/**
 * Name a concrete cause when checks support one; otherwise mark undeclared so
 * the title states that investigation found no clear driver for the move.
 */
function inferBriefingCause(args: {
  severity: BriefingSeverity
  breached: SourceHealth[]
  exch: SourceHealth[]
  lps: SourceHealth[]
  move: number
  basis: number | null
  firedAt: number
}): BriefingCause {
  const { severity, breached, exch, lps, move, basis, firedAt } = args
  const hour = new Date(firedAt).getUTCHours()

  // Isolated LP soft vs a couple of exchanges — common inventory skew.
  if (severity === 'watch' && lps.length >= 1 && exch.length <= 2 && breached.length <= 3) {
    return {
      kind: 'known',
      en: 'LP soft vs exchanges (common)',
      zh: 'LP 相對交易所偏弱（常見誘因）',
    }
  }

  // Wide crypto–spot basis is a concrete structural driver.
  if (basis != null && Math.abs(basis) > 40) {
    return {
      kind: 'known',
      en: 'wide crypto–spot basis',
      zh: '加密相對現貨基差偏寬',
    }
  }

  // London cash open with moderate composite move — known session pattern.
  if (hour >= 7 && hour < 9 && Math.abs(move) < 40 && severity === 'alert') {
    return {
      kind: 'known',
      en: 'London open dislocation',
      zh: '倫敦開盤錯位',
    }
  }

  // No named macro/session/basis driver after the usual checks.
  return { kind: 'undeclared' }
}

function titleForCause(args: {
  lang: AppLang
  severity: BriefingSeverity
  breachedCount: number
  cause: BriefingCause
}): string {
  const { lang, severity, breachedCount, cause } = args
  const undeclared =
    cause.kind === 'undeclared'
      ? lang === 'zh-Hant'
        ? '排查後未發現造成異常變動的明確原因'
        : 'no clear cause found after checks'
      : null
  const known = cause.kind === 'known' ? (lang === 'zh-Hant' ? cause.zh : cause.en) : null

  if (lang === 'zh-Hant') {
    if (severity === 'critical') {
      return undeclared
        ? `【紅】突發衝擊 — ${breachedCount} 源越界；${undeclared}`
        : `【紅】突發衝擊 — ${breachedCount} 源越界；${known}`
    }
    if (severity === 'alert') {
      return undeclared
        ? `【黃】多源錯位升高 — ${undeclared}`
        : `【黃】多源錯位升高 — ${known}`
    }
    return undeclared
      ? `【綠】跨層級觀察 — ${undeclared}`
      : `【綠】常見誘因 — ${known}`
  }

  if (severity === 'critical') {
    return undeclared
      ? `[RED] Sudden stress — ${breachedCount} sources breached; ${undeclared}`
      : `[RED] Sudden stress — ${breachedCount} sources breached; ${known}`
  }
  if (severity === 'alert') {
    return undeclared
      ? `[YELLOW] Elevated multi-source dislocation — ${undeclared}`
      : `[YELLOW] Elevated multi-source dislocation — ${known}`
  }
  return undeclared
    ? `[GREEN] Cross-tier watch — ${undeclared}`
    : `[GREEN] Common catalyst — ${known}`
}

export async function generateBriefing(args: {
  trigger: TriggerEvent
  health: SourceHealth[]
  composite: number
  spot: number | null
  history: { t: number; px: number }[]
  lang?: AppLang
}): Promise<Briefing> {
  const { trigger, health, composite, spot, history } = args
  const lang = args.lang ?? 'en'
  const breached = health.filter((h) => trigger.breachedSources.includes(h.id))
  const exch = breached.filter((h) => h.kind === 'exchange' || h.kind === 'exchange_index')
  const lps = breached.filter((h) => h.kind === 'lp')
  const avgDev =
    breached.reduce((s, h) => s + Math.abs(h.deviationBps ?? 0), 0) /
    Math.max(1, breached.length)
  const move = trigger.compositeMoveBps5m
  const basis =
    spot != null && Number.isFinite(spot) ? ((composite - spot) / spot) * 10_000 : null
  const session = sessionBucket(new Date(trigger.firedAt), lang)
  const severity: BriefingSeverity = trigger.severity
  const cause = inferBriefingCause({
    severity,
    breached,
    exch,
    lps,
    move,
    basis,
    firedAt: trigger.firedAt,
  })
  const title = titleForCause({
    lang,
    severity,
    breachedCount: breached.length,
    cause,
  })

  const why: string[] = []
  if (lang === 'zh-Hant') {
    why.push(
      cause.kind === 'undeclared'
        ? `原因判定：已對照時段、基差與跨場所結構後，仍未發現造成此次異常變動的明確外部催化 — 標題已標註「排查後未發現明確原因」。`
        : `原因判定：${cause.zh}（已寫入標題）。`,
    )
    why.push(`觸發：${trigger.reason}。時段背景：${session}（UTC）。`)
    why.push(
      `綜合中位數 ${composite.toFixed(2)}；5 分鐘綜合變動 ${move >= 0 ? '+' : ''}${move.toFixed(1)} bps；越界源平均 |偏離| ${avgDev.toFixed(1)} bps（${directionWord(move, lang)}）。`,
    )
    if (exch.length) {
      why.push(
        `涉及交易所/指數：${exch
          .map((h) => `${h.id} (${(h.deviationBps ?? 0) >= 0 ? '+' : ''}${(h.deviationBps ?? 0).toFixed(1)} bps)`)
          .join('、')}。顯示永續/指數簿可能領先或落後於 LP。`,
      )
    }
    if (lps.length) {
      why.push(
        `涉及 LP：${lps
          .map((h) => `${h.id} (${(h.deviationBps ?? 0) >= 0 ? '+' : ''}${(h.deviationBps ?? 0).toFixed(1)} bps)`)
          .join('、')}。LP 偏離常反映庫存/對沖延遲相對加密所 XAUUSDT 成交。`,
      )
    }
    if (basis != null) {
      why.push(
        `永續綜合價相對現貨（gold-api XAU）基差 ${basis >= 0 ? '+' : ''}${basis.toFixed(1)} bps。${
          Math.abs(basis) > 40
            ? '基差偏寬 — 檢查加密場所是否領先實體/現貨對沖。'
            : '基差仍在常見加密黃金溢折價區間。'
        }`,
      )
    }
    why.push(
      '宏觀/利率視角：黃金對實際利率與美元敏感。若多源同步跳動但無 DXY/收益率催化，多半是微結構（資金費、強平、指數權重跳動）而非基本面衝擊。',
    )
    why.push(`技術（本地監控序列）：${techNote(history, composite, lang)}`)
    why.push(
      '請點開下方「可驗證來源」中的單篇新聞與即時 API/合約頁核對催化劑（非官網首頁）。',
    )
  } else {
    why.push(
      cause.kind === 'undeclared'
        ? `Cause call: after session, basis, and cross-venue structure checks, no clear external catalyst for this abnormal move — title states “no clear cause found after checks”.`
        : `Cause call: ${cause.en} (stated in the title).`,
    )
    why.push(`Trigger: ${trigger.reason}. Session context: ${session} (UTC).`)
    why.push(
      `Composite median ${composite.toFixed(2)}; 5m composite move ${move >= 0 ? '+' : ''}${move.toFixed(1)} bps; average |deviation| of breached sources ${avgDev.toFixed(1)} bps (${directionWord(move, lang)}).`,
    )
    if (exch.length) {
      why.push(
        `Exchange / index venues involved: ${exch
          .map((h) => `${h.id} (${(h.deviationBps ?? 0) >= 0 ? '+' : ''}${(h.deviationBps ?? 0).toFixed(1)} bps)`)
          .join(', ')}. Suggests perp/index books reprinting faster than LPs or vice versa.`,
      )
    }
    if (lps.length) {
      why.push(
        `LP quotes involved: ${lps
          .map((h) => `${h.id} (${(h.deviationBps ?? 0) >= 0 ? '+' : ''}${(h.deviationBps ?? 0).toFixed(1)} bps)`)
          .join(', ')}. LP skew often reflects inventory/hedge latency vs crypto-exchange XAUUSDT prints.`,
      )
    }
    if (basis != null) {
      why.push(
        `Perp composite vs LBMA-style spot (gold-api XAU): basis ${basis >= 0 ? '+' : ''}${basis.toFixed(1)} bps. ${
          Math.abs(basis) > 40
            ? 'Wide basis — check whether crypto venues are leading physical/spot hedges.'
            : 'Basis inside normal crypto-gold premium/discount band.'
        }`,
      )
    }
    why.push(
      'Macro / rates lens: gold is inversely sensitive to real yields and USD. A synchronized multi-venue jump without a DXY/yield catalyst often means venue microstructure (funding, liquidations, index weight jumps) rather than a fundamental gold shock.',
    )
    why.push(`Technical (local monitor series): ${techNote(history, composite, lang)}`)
    why.push(
      'Open the Verify sources links below — each points to a specific article or live API/instrument page (not a generic homepage).',
    )
  }

  const { impact, actions } = buildImpactActions({
    lang,
    severity,
    breached,
    exch,
    lps,
    avgDev,
    move,
    basis,
  })

  const citations = await collectCitations({
    lang,
    health,
    composite,
    spot,
    createdAt: trigger.firedAt,
  })

  return {
    id: `brf_${trigger.firedAt}`,
    createdAt: trigger.firedAt,
    severity,
    lang,
    title,
    triggerReason: trigger.reason,
    breachedSources: trigger.breachedSources,
    compositePrice: composite,
    why,
    impact: impact.slice(0, 3),
    actions: actions.slice(0, 3),
    sourcesConsulted: citationsToLegacyLines(citations),
    citations,
  }
}

const STORAGE_KEY = 'xauusd-monitor-briefings-v7'

function seedCitations(lang: AppLang) {
  // Full deep-link catalog (APIs, instrument pages, single articles) — not landing pages.
  return staticCitationCatalog(lang)
}

/** Exactly 3 dense bullets each — pack useful points, do not drop them. */
function buildImpactActions(args: {
  lang: AppLang
  severity: BriefingSeverity
  breached: SourceHealth[]
  exch: SourceHealth[]
  lps: SourceHealth[]
  avgDev: number
  move: number
  basis: number | null
}): { impact: string[]; actions: string[] } {
  const { lang, severity, breached, exch, lps, avgDev, move, basis } = args
  const names = breached.map((h) => h.id).join('/') || '—'
  const exchNames = exch.map((h) => h.id).join('/') || '—'
  const lpNames = lps.map((h) => h.id).join('/') || '—'
  const moveTxt = `${move >= 0 ? '+' : ''}${move.toFixed(1)}`
  const basisTxt =
    basis == null ? null : `${basis >= 0 ? '+' : ''}${basis.toFixed(1)} bps`
  const sevHi = severity === 'critical' || severity === 'alert'

  if (lang === 'zh-Hant') {
    return {
      impact: [
        `指數/標記/交易者：越界源 ${names}（均偏 ${avgDev.toFixed(1)} bps，5m ${moveTxt}）若仍入籃，公允與標記相對同行漂移；高槓桿 XAUUSD 永續易見跳動、對手基差擴大與強平風險上升。`,
        `做市/資金：${exch.length ? `交易所側 ${exchNames} 領先時，` : ''}${lps.length ? `LP ${lpNames} ` : 'LP '}對沖（LMAX/ISPrime 等）落後 → 庫存與資金費逆向選擇；${basisTxt ? `相對現貨基差 ${basisTxt}。` : '需交叉核對現貨基差。'}`,
        `運維/競品：價差·深度·無成交監控在錯位解除前更易誤報佔用值班；同時對照 Binance/OKX/Bybit 標記與指數，避免誤判為單源故障。`,
      ],
      actions: [
        `核對：即時錨點（OKX/Bitget/gold-api）vs 衍生鏡像；≥3 源持續 >15 bps 逾 2 分鐘 → 暫剔最差離群、重跑試算並記錄權重變更。`,
        `風控：收緊 ${names} 觀察/重啟窗口，避免尖峰後自動加回過期 LP；${sevHi ? 'Alert/Critical' : 'Watch'} 若升 Critical 且持續 >5 分鐘 → 降槓桿/吃單檔並暫停新開倉。`,
        `對沖恢復：通知做市商擴大報價、優先在健康場所對沖；冷卻後須試算成功 + 健康分恢復，才恢復完整權重（點「可驗證來源」核對 API/單篇新聞）。`,
      ],
    }
  }

  return {
    impact: [
      `Index/mark/traders: breached ${names} (avg |dev| ${avgDev.toFixed(1)} bps, 5m ${moveTxt}) still in the basket drift fair/mark vs peers — XAUUSD MVP perps see jumps, wider competitor basis, and higher liquidation risk at high leverage.`,
      `MM/funding: ${exch.length ? `exchange-side ${exchNames} leading → ` : ''}${lps.length ? `LP ${lpNames} ` : 'LP '}hedges (LMAX/ISPrime etc.) lag → inventory & funding adverse selection; ${basisTxt ? `spot basis ${basisTxt}.` : 'cross-check spot basis.'}`,
      `Ops/peers: spread·depth·no-trade monitors false-fire until dislocation clears (on-call noise); cross-check Binance/OKX/Bybit mark/index so this is not misread as a single-venue outage.`,
    ],
    actions: [
      `Verify: live anchors (OKX/Bitget/gold-api) vs derived mirrors; if ≥3 sources stay >15 bps for >2m → temporarily drop worst outlier(s), re-run trial calc, log weight changes.`,
      `Risk: tighten observation/re-enable windows on ${names} (avoid auto-reintroducing a stale LP after a spike); if severity hits Critical >5m → cut leverage/market-take and pause new opens.`,
      `Hedge/restore: tell MMs to widen quotes and hedge on healthy venues; restore full weights only after successful trial calc + healthy scores (use Verify sources for API/article deep links).`,
    ],
  }
}

export function loadBriefings(): Briefing[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return seedBriefings()
    const parsed = JSON.parse(raw) as Briefing[]
    if (!Array.isArray(parsed)) return seedBriefings()
    return parsed.map((b) =>
      b.citations?.length
        ? b
        : {
            ...b,
            citations: seedCitations(b.lang === 'zh-Hant' ? 'zh-Hant' : 'en'),
            sourcesConsulted:
              b.sourcesConsulted?.length
                ? b.sourcesConsulted
                : citationsToLegacyLines(seedCitations(b.lang === 'zh-Hant' ? 'zh-Hant' : 'en')),
          },
    )
  } catch {
    return seedBriefings()
  }
}

export function saveBriefings(list: Briefing[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, 100)))
}

export function isBriefingActive(b: Briefing): boolean {
  return b.archivedAt == null
}

/** Mark a briefing archived so it no longer appears in the active list. */
export function archiveBriefingInList(list: Briefing[], id: string, at = Date.now()): Briefing[] {
  return list.map((b) => (b.id === id ? { ...b, archivedAt: at } : b))
}

function seedBriefings(): Briefing[] {
  const now = Date.now()
  return [
    {
      id: 'brf_seed_0_en',
      createdAt: now - 2 * 3600_000,
      severity: 'critical',
      lang: 'en',
      title:
        '[RED] Sudden stress — 6 sources breached; no clear cause found after checks',
      triggerReason: '6 sources in Alert; composite 5m move +52 bps',
      breachedSources: ['BINANCE', 'BYBIT', 'OKEX', 'BITGET', 'ISPRIME', 'VELOCITY'],
      compositePrice: 3861.4,
      why: [
        'Cause call: after session, basis, and cross-venue structure checks, no clear external catalyst for this abnormal move — title states “no clear cause found after checks”.',
        'Simultaneous exchange + LP alerts with a >50 bps composite jump in 5 minutes — beyond routine open noise.',
        'Live anchors and derived mirrors reprinted together; DXY/yields and spot gold showed no matching shock in the same window.',
        'Treat as urgent index-input stress without a named external driver: traders face mark jumps / liquidation risk if basket weights stay unchanged.',
      ],
      impact: [
        'Index/mark/traders: fair/mark can gap vs peers within seconds — high-leverage XAUUSD perps at immediate liquidation risk.',
        'MM/funding: hedges across LMAX/ISPrime lag the crypto print → adverse selection and inventory blowouts until weights cut.',
        'Ops: treat as exchange-critical — auto monitors will flood; decision window is minutes, not hours.',
      ],
      actions: [
        'Immediately drop worst outliers from the index basket and re-run trial calc; pause new opens if Critical holds >2m.',
        'Cut max leverage / market-take; notify MM desk to widen and hedge only on healthy venues.',
        'Restore weights only after trial calc + healthy scores; verify OKX/Bitget/gold-api deep links in Verify sources.',
      ],
      citations: seedCitations('en'),
      sourcesConsulted: citationsToLegacyLines(seedCitations('en')),
    },
    {
      id: 'brf_seed_0_zh',
      createdAt: now - 2 * 3600_000 + 1,
      severity: 'critical',
      lang: 'zh-Hant',
      title: '【紅】突發衝擊 — 6 源越界；排查後未發現造成異常變動的明確原因',
      triggerReason: '6 個來源告警；綜合價 5 分鐘 +52 bps',
      breachedSources: ['BINANCE', 'BYBIT', 'OKEX', 'BITGET', 'ISPRIME', 'VELOCITY'],
      compositePrice: 3861.4,
      why: [
        '原因判定：已對照時段、基差與跨場所結構後，仍未發現造成此次異常變動的明確外部催化 — 標題已標註「排查後未發現明確原因」。',
        '交易所與 LP 同時告警，且綜合價 5 分鐘跳動 >50 bps — 已超出例行開盤噪音。',
        '即時錨點與衍生鏡像同步重印；同窗口 DXY／收益率與現貨黃金未見對應衝擊。',
        '按無明確外部催化的指數輸入壓力處理：若不調權重，交易者面臨標記跳動/強平。',
      ],
      impact: [
        '指數/標記/交易者：公允與標記可在數秒內相對同行跳空 — 高槓桿 XAUUSD 永續強平風險立即上升。',
        '做市/資金：LMAX/ISPrime 對沖落後加密成交 → 逆向選擇與庫存衝擊，直到降權。',
        '運維：按本所緊急事件處理 — 監控會暴衝；決策窗口是分鐘級。',
      ],
      actions: [
        '立刻剔除最差離群源並重跑試算；Critical 持續 >2 分鐘則暫停新開倉。',
        '降低最大槓桿/吃單檔；通知做市商擴大報價、僅在健康場所對沖。',
        '須試算成功 + 健康分恢復才恢復權重；並核對可驗證來源中的 OKX/Bitget/gold-api。',
      ],
      citations: seedCitations('zh-Hant'),
      sourcesConsulted: citationsToLegacyLines(seedCitations('zh-Hant')),
    },
    {
      id: 'brf_seed_1_en',
      createdAt: now - 36 * 3600_000,
      severity: 'alert',
      lang: 'en',
      title: '[YELLOW] Elevated multi-source dislocation — London open dislocation',
      triggerReason: '4 sources in Alert (≥3 required)',
      breachedSources: ['BINANCE', 'BYBIT', 'ISPRIME', 'VELOCITY'],
      compositePrice: 3884.2,
      why: [
        'Cause call: London open dislocation (stated in the title).',
        'London cash open coincided with crypto XAUUSDT catching up to spot after a quiet Asia session.',
        'Exchange perps reprinted higher first; LP quotes lagged ~10–20 bps for ~3 minutes.',
        'Basis vs spot briefly widened then compressed — typical open auction catch-up, not a macro surprise.',
      ],
      impact: [
        'Index/mark/traders: BINANCE/BYBIT/ISPRIME/VELOCITY in basket risked a short mark bounce vs peers; high-leverage XAUUSD perps saw jump + liquidation risk for ~3m.',
        'MM/funding: exchange perps led; LP hedges (LMAX/ISPrime path) lagged ~10–20 bps → inventory/funding adverse selection until catch-up.',
        'Ops/peers: spread/depth monitors noisier at London open; cross-checked OKX/Bitget/gold-api — open-auction microstructure, not a lasting basket fault.',
      ],
      actions: [
        'Verified live anchors vs derived mirrors; held basket after 5m normalization (no permanent exclusion); logged LP lag for weight review.',
        'Tightened observation/re-enable on ISPRIME/VELOCITY to avoid auto-reintroducing stale LP quotes after the open spike.',
        'MM desk widened briefly and hedged on healthier venues; restore full weights only after trial calc + healthy scores (see Verify sources).',
      ],
      citations: seedCitations('en'),
      sourcesConsulted: citationsToLegacyLines(seedCitations('en')),
    },
    {
      id: 'brf_seed_1_zh',
      createdAt: now - 36 * 3600_000 + 1,
      severity: 'alert',
      lang: 'zh-Hant',
      title: '【黃】多源錯位升高 — 倫敦開盤錯位',
      triggerReason: '4 個來源處於告警（需 ≥3）',
      breachedSources: ['BINANCE', 'BYBIT', 'ISPRIME', 'VELOCITY'],
      compositePrice: 3884.2,
      why: [
        '原因判定：倫敦開盤錯位（已寫入標題）。',
        '倫敦現貨開盤時，加密 XAUUSDT 在亞洲安靜時段後追上現貨。',
        '交易所永續先上修；LP 報價落後約 10–20 bps，持續約 3 分鐘。',
        '相對現貨基差短暫走闊後收斂 — 典型開盤追價，非宏觀意外。',
      ],
      impact: [
        '指數/標記/交易者：BINANCE/BYBIT/ISPRIME/VELOCITY 仍入籃時標記相對同行短暫上跳；高槓桿 XAUUSD 永續約 3 分鐘內跳動與強平風險上升。',
        '做市/資金：交易所永續領先，LP（LMAX/ISPrime 路徑）落後約 10–20 bps → 庫存與資金費逆向選擇，直至追價完成。',
        '運維/競品：倫敦開盤價差·深度監控更易誤報；已交叉核對 OKX/Bitget/gold-api — 屬開盤微結構，非持久籃子故障。',
      ],
      actions: [
        '核對即時錨點 vs 衍生鏡像；5 分鐘恢復後維持籃子（未永久剔除），並記錄 LP 延遲供權重覆核。',
        '收緊 ISPRIME/VELOCITY 觀察/重啟窗口，避免開盤尖峰後自動加回過期 LP 報價。',
        '做市商短暫擴大報價並改在健康場所對沖；須試算成功 + 健康分恢復才恢復完整權重（見可驗證來源）。',
      ],
      citations: seedCitations('zh-Hant'),
      sourcesConsulted: citationsToLegacyLines(seedCitations('zh-Hant')),
    },
    {
      id: 'brf_seed_2_en',
      createdAt: now - 5 * 3600_000,
      severity: 'watch',
      lang: 'en',
      title: '[GREEN] Common catalyst — LP soft vs exchanges (common)',
      triggerReason: 'Cross-tier dislocation: 2 exchange + 1 LP at Watch/Alert',
      breachedSources: ['OKEX', 'BITGET', 'STARPRIME'],
      compositePrice: 3890.55,
      why: [
        'Cause call: LP soft vs exchanges (common) (stated in the title).',
        'STARPRIME quoted soft vs OKX/Bitget while indexes stayed tight.',
        'Isolated LP inventory skew; composite move under shock threshold.',
      ],
      impact: [
        'Index/mark/traders: STARPRIME soft vs OKEX/BITGET — limited mark drift if LP weight is low; traders unlikely to see a multi-venue liquidation spike from this alone.',
        'MM/funding: isolated LP inventory skew; hedges on other LPs stay intact, but copycat widening would raise adverse-selection risk.',
        'Ops/peers: keep as Watch (not multi-source Alert); cross-check OKX/Bitget tickers so ops does not escalate a single-LP soft quote.',
      ],
      actions: [
        'Raised watch on STARPRIME only; no basket exclusion and no leverage/take change while composite shock stays below threshold.',
        'Tighten STARPRIME observation window; re-check in 5–10m for copycat LP widening before any weight cut.',
        'Verify OKX/Bitget ticker JSON + gold-api before escalating; restore normal watch only after healthy scores (see Verify sources).',
      ],
      citations: seedCitations('en'),
      sourcesConsulted: citationsToLegacyLines(seedCitations('en')),
    },
    {
      id: 'brf_seed_2_zh',
      createdAt: now - 5 * 3600_000 + 1,
      severity: 'watch',
      lang: 'zh-Hant',
      title: '【綠】常見誘因 — LP 相對交易所偏弱（常見誘因）',
      triggerReason: '跨層級錯位：2 個交易所 + 1 個 LP 處於觀察/告警',
      breachedSources: ['OKEX', 'BITGET', 'STARPRIME'],
      compositePrice: 3890.55,
      why: [
        '原因判定：LP 相對交易所偏弱（常見誘因）（已寫入標題）。',
        'STARPRIME 相對 OKX/Bitget 報價偏弱，指數源仍緊密。',
        '屬單一 LP 庫存偏斜；綜合價變動未達衝擊閾值。',
      ],
      impact: [
        '指數/標記/交易者：STARPRIME 相對 OKEX/BITGET 偏弱 — LP 權重不高則標記漂移有限，不足以單獨觸發多場所強平潮。',
        '做市/資金：屬單一 LP 庫存偏斜，其他 LP 對沖仍可用；若出現跟進擴大價差才會抬升逆向選擇。',
        '運維/競品：維持 Watch（非多源 Alert）；交叉核對 OKX/Bitget ticker，避免把單 LP 軟報價升級為系統事件。',
      ],
      actions: [
        '僅提高 STARPRIME 觀察；綜合衝擊未超閾值前不剔除籃子、不改槓桿/吃單檔。',
        '收緊 STARPRIME 觀察窗口；5–10 分鐘內複查是否有其他 LP 跟進擴大，再決定是否降權。',
        '升級前核對 OKX/Bitget ticker JSON 與 gold-api；健康分恢復後才解除加強觀察（見可驗證來源）。',
      ],
      citations: seedCitations('zh-Hant'),
      sourcesConsulted: citationsToLegacyLines(seedCitations('zh-Hant')),
    },
  ]
}
