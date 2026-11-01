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

  const title =
    lang === 'zh-Hant'
      ? severity === 'critical'
        ? `Critical XAUUSD 場所壓力 — ${breached.length} 個來源越界`
        : severity === 'alert'
          ? `XAUUSD 多源告警 — 請檢查指數輸入`
          : `XAUUSD 跨層級觀察 — 交易所/LP 錯位`
      : severity === 'critical'
        ? `Critical XAUUSD venue stress — ${breached.length} sources breached`
        : severity === 'alert'
          ? `XAUUSD multi-source alert — investigate index inputs`
          : `XAUUSD cross-tier watch — exchange/LP dislocation`

  const why: string[] = []
  if (lang === 'zh-Hant') {
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

  const impact =
    lang === 'zh-Hant'
      ? [
          '指數/標記：越界源若仍在籃子內，公允與標記價會相對同行漂移，交易者面臨跳動與強平風險上升。',
          '做市對沖：加密所領先 LP 時，LMAX/ISPrime 對沖落後，庫存與資金費承受逆向選擇。',
          '運維誤報：價差/深度/無成交監控在錯位解除前更容易觸發，佔用值班帶寬。',
        ]
      : [
          'Index/mark: breached sources still in the basket drift fair/mark vs peers — traders see jumps and higher liquidation risk.',
          'MM hedge: when crypto venues lead LPs, LMAX/ISPrime hedges lag and face adverse selection on inventory/funding.',
          'Ops noise: spread/depth/no-trade monitors false-fire until dislocation clears, consuming on-call bandwidth.',
        ]

  const actions =
    lang === 'zh-Hant'
      ? [
          '核對即時錨點 vs 衍生鏡像；≥3 源持續 >15 bps 超過 2 分鐘則剔除最差離群並重跑試算。',
          '收緊觀察/重啟窗口，Critical 持續 >5 分鐘則降槓桿/吃單檔並暫停新開倉。',
          '通知做市商擴大報價、改在健康場所對沖；冷卻後需試算+健康分恢復才恢復權重。',
        ]
      : [
          'Verify live anchors vs derived mirrors; if ≥3 sources stay >15 bps for >2m, drop worst outlier(s) and re-run trial calc.',
          'Tighten observation/re-enable windows; if Critical lasts >5m, cut leverage/take levels and pause new opens.',
          'Tell MMs to widen quotes and hedge on healthy venues; restore weights only after trial calc + healthy scores.',
        ]

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
    impact,
    actions,
    sourcesConsulted: citationsToLegacyLines(citations),
    citations,
  }
}

const STORAGE_KEY = 'xauusd-monitor-briefings-v4'

function seedCitations(lang: AppLang) {
  // Full deep-link catalog (APIs, instrument pages, single articles) — not landing pages.
  return staticCitationCatalog(lang)
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

function seedBriefings(): Briefing[] {
  const now = Date.now()
  return [
    {
      id: 'brf_seed_1_en',
      createdAt: now - 36 * 3600_000,
      severity: 'alert',
      lang: 'en',
      title: 'XAUUSD multi-source alert — London open dislocation',
      triggerReason: '4 sources in Alert (≥3 required)',
      breachedSources: ['BINANCE', 'BYBIT', 'ISPRIME', 'VELOCITY'],
      compositePrice: 3884.2,
      why: [
        'London cash open coincided with crypto XAUUSDT catching up to spot after a quiet Asia session.',
        'Exchange perps reprinted higher first; LP quotes lagged ~10–20 bps for ~3 minutes.',
        'Basis vs spot briefly widened then compressed — typical open auction catch-up, not a macro surprise.',
      ],
      impact: [
        'Index/mark: high Binance/Bybit weight risked a short-lived mark bounce.',
        'MM hedges on LPs lagged exchange-led moves for ~3 minutes.',
        'No lasting basket change after 5m normalization.',
      ],
      actions: [
        'Kept index basket intact after 5m normalization.',
        'Documented LP lag; no permanent exclusion.',
        'Cross-check OKX/Bitget/gold-api links in Verify sources.',
      ],
      citations: seedCitations('en'),
      sourcesConsulted: citationsToLegacyLines(seedCitations('en')),
    },
    {
      id: 'brf_seed_1_zh',
      createdAt: now - 36 * 3600_000 + 1,
      severity: 'alert',
      lang: 'zh-Hant',
      title: 'XAUUSD 多源告警 — 倫敦開盤錯位',
      triggerReason: '4 個來源處於告警（需 ≥3）',
      breachedSources: ['BINANCE', 'BYBIT', 'ISPRIME', 'VELOCITY'],
      compositePrice: 3884.2,
      why: [
        '倫敦現貨開盤時，加密 XAUUSDT 在亞洲安靜時段後追上現貨。',
        '交易所永續先上修；LP 報價落後約 10–20 bps，持續約 3 分鐘。',
        '相對現貨基差短暫走闊後收斂 — 典型開盤追價，非宏觀意外。',
      ],
      impact: [
        '指數/標記：Binance/Bybit 權重偏高時可能短暫標記上跳。',
        '做市對沖：LP 對沖落後交易所主導行情約 3 分鐘。',
        '5 分鐘恢復後籃子無需永久調整。',
      ],
      actions: [
        '5 分鐘恢復正常後維持指數籃子不變。',
        '記錄 LP 延遲；未做永久剔除。',
        '點開「可驗證來源」核對 OKX/Bitget/gold-api 與單篇新聞。',
      ],
      citations: seedCitations('zh-Hant'),
      sourcesConsulted: citationsToLegacyLines(seedCitations('zh-Hant')),
    },
    {
      id: 'brf_seed_2_en',
      createdAt: now - 5 * 3600_000,
      severity: 'watch',
      lang: 'en',
      title: 'XAUUSD cross-tier watch — LP soft vs exchanges',
      triggerReason: 'Cross-tier dislocation: 2 exchange + 1 LP at Watch/Alert',
      breachedSources: ['OKEX', 'BITGET', 'STARPRIME'],
      compositePrice: 3890.55,
      why: [
        'STARPRIME quoted soft vs OKX/Bitget while indexes stayed tight.',
        'Isolated LP inventory skew; composite move under shock threshold.',
      ],
      impact: [
        'Limited index impact if STARPRIME weight is low.',
        'Watch for copycat LP widening.',
        'Ops noise: single-LP watch should not alone fire multi-source alerts.',
      ],
      actions: [
        'Raised watch on STARPRIME only.',
        'No leverage change.',
        'Verify OKX/Bitget ticker JSON links before escalating.',
      ],
      citations: seedCitations('en'),
      sourcesConsulted: citationsToLegacyLines(seedCitations('en')),
    },
    {
      id: 'brf_seed_2_zh',
      createdAt: now - 5 * 3600_000 + 1,
      severity: 'watch',
      lang: 'zh-Hant',
      title: 'XAUUSD 跨層級觀察 — LP 相對交易所偏弱',
      triggerReason: '跨層級錯位：2 個交易所 + 1 個 LP 處於觀察/告警',
      breachedSources: ['OKEX', 'BITGET', 'STARPRIME'],
      compositePrice: 3890.55,
      why: [
        'STARPRIME 相對 OKX/Bitget 報價偏弱，指數源仍緊密。',
        '屬單一 LP 庫存偏斜；綜合價變動未達衝擊閾值。',
      ],
      impact: [
        '若 STARPRIME 權重不高，指數影響有限。',
        '需觀察其他 LP 是否跟進擴大價差。',
        '運維：單一 LP 觀察不應單獨升級為多源告警。',
      ],
      actions: [
        '僅提高 STARPRIME 觀察等級。',
        '未調整槓桿。',
        '升級前先點開 OKX/Bitget ticker JSON 核對。',
      ],
      citations: seedCitations('zh-Hant'),
      sourcesConsulted: citationsToLegacyLines(seedCitations('zh-Hant')),
    },
  ]
}
