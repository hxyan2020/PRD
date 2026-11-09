import { kbPath } from '../storage'
import type {
  KbNode,
  KnowledgeItem,
  KnowledgeHitRef,
  L1Skill,
  RuleAnalysis,
  SeverityChoice,
  SkillHitRef,
  SkillRecord,
  TimelineEvent,
} from '../types'
import type { AppLang } from '../../i18n/messages'
import { assessFollowUpRelevance } from './relevance'

export function skillsToL1(active: SkillRecord[]): L1Skill[] {
  return active
    .filter((s) => s.level === 'L1' && !s.disabled && !s.archivedAt)
    .map((s) => ({
      id: s.id,
      name: s.name,
      severity: s.severity,
      check: s.check,
      action: s.action,
      opt: s.opt,
    }))
}

/** Extra alert phrases so catalog skills match production Lark/OCR wording. */
const EXTRA_MATCH_HINTS: Record<string, string> = {
  'IDX-01':
    '指数源变更剔除告警 指数源剔除 剔除告警 剔除 源变更剔除 source removal removed constituent BYBIT_INDEX OKX_INDEX',
  'IDX-02':
    '指数源变更恢复告警 指数源恢复 恢复告警 恢复 源变更恢复 source recovery recovered constituent BYBIT_INDEX',
  'IDX-05': 'Index 无有效源 无有效源 no valid source',
  'IDX-06':
    '指数价格线性过渡开始 线性过渡开始 线性过渡 平滑开始 linear transition start smoothing start',
  'IDX-07':
    '指数价格线性过渡结束 线性过渡结束 线性过渡 平滑结束 linear transition end smoothing end',
  'IDX-08': '仅一家有效指数源 单源 single source',
  'MARK-01': 'Mark 计算降级 mark degraded',
  'PRICE-01': 'Mark vs Index mark/index',
}

function skillMatchKeys(s: SkillRecord): string[] {
  const extra = EXTRA_MATCH_HINTS[s.id] || ''
  const raw = `${s.id} ${s.name} ${s.matchHints} ${extra}`
  const keys = new Set<string>()
  keys.add(s.id.toLowerCase())
  keys.add(s.name.toLowerCase())
  for (const part of raw.split(/[\s,/|，、；;]+/).filter(Boolean)) {
    if (part.length >= 2) keys.add(part.toLowerCase())
  }
  // Keep longer Chinese phrases intact for stronger hits
  for (const phrase of [
    s.name,
    ...Object.entries(EXTRA_MATCH_HINTS)
      .filter(([id]) => id === s.id)
      .flatMap(([, v]) => v.split(/\s+/)),
  ]) {
    if (phrase && phrase.length >= 4) keys.add(phrase.toLowerCase())
  }
  return [...keys]
}

function matchSkills(
  text: string,
  skills: SkillRecord[],
): { s: SkillRecord; score: number }[] {
  const t = text.toLowerCase()
  return skills
    .filter((s) => !s.disabled && !s.archivedAt)
    .map((s) => {
      let score = 0
      for (const k of skillMatchKeys(s)) {
        if (!t.includes(k)) continue
        // Longer / more specific tokens weigh more; short generic tokens weigh less
        if (k.length >= 8) score += 4
        else if (k.length >= 4) score += 2
        else if (k.length >= 3) score += 1
      }
      // Soft boost for check phrases only when already somewhat matched
      if (score > 0) {
        for (const w of s.check.split(/[，、；;/\s]+/).filter((x) => x.length >= 4)) {
          if (t.includes(w.toLowerCase())) score += 1
        }
      }
      return { s, score }
    })
    .filter((x) => x.score >= 3)
    .sort((a, b) => b.score - a.score)
    .slice(0, 6)
}

/** Pull confirmed facts that are literally present in the operator alert / OCR. */
export function extractAlertFacts(text: string, zh: boolean): string[] {
  const raw = String(text || '').trim()
  if (!raw) return []
  const facts: string[] = []
  const idx = raw.match(/\bXAU[_\s-]?USD\b|\bXAUUSD\b/i)?.[0]
  const venue = raw.match(
    /\(?\s*(BYBIT_INDEX|OKX_INDEX|BINANCE_INDEX|BITGET_INDEX)[^\n\)]{0,40}\)?/i,
  )?.[0]
  const price = raw.match(/当前价格[：:]\s*([0-9.]+)|current price[：:]\s*([0-9.]+)/i)
  const tRemove = raw.match(
    /触发时间[：:]\s*([0-9:\-\s]+)|trigger(?:ed)?(?:\s*time)?[：:]\s*([0-9:\-\s]+)/i,
  )

  if (/指数源变更剔除|源变更剔除|指数源剔除|source removal|constituent.*removed|removed.*constituent/i.test(raw)) {
    facts.push(
      zh
        ? `告警原文证实：指数成分被剔除${venue ? `（${venue.trim()}）` : ''}${idx ? ` · 指数 ${idx}` : ''} — 这是已陈述事实，不是推断。`
        : `Alert text confirms: index constituent removed${venue ? ` (${venue.trim()})` : ''}${idx ? ` · index ${idx}` : ''} — stated fact, not inference.`,
    )
  }
  if (/指数源变更恢复|源变更恢复|指数源恢复|source recovery|constituent.*recover|recovered.*constituent/i.test(raw)) {
    facts.push(
      zh
        ? `告警原文证实：指数成分已恢复${venue ? `（${venue.trim()}）` : ''} — 需核对恢复后观察期与偏差。`
        : `Alert text confirms: index constituent recovered${venue ? ` (${venue.trim()})` : ''} — verify post-recovery observation and deviation.`,
    )
  }
  if (/线性过渡开始|平滑开始|linear transition start/i.test(raw)) {
    facts.push(
      zh
        ? `告警原文证实：指数价格线性过渡开始${price ? ` · 价格 ${price[1] || price[2]}` : ''}。`
        : `Alert text confirms: index linear transition started${price ? ` · price ${price[1] || price[2]}` : ''}.`,
    )
  }
  if (/线性过渡结束|平滑结束|linear transition end/i.test(raw)) {
    facts.push(
      zh
        ? `告警原文证实：指数价格线性过渡结束${price ? ` · 价格 ${price[1] || price[2]}` : ''}。`
        : `Alert text confirms: index linear transition ended${price ? ` · price ${price[1] || price[2]}` : ''}.`,
    )
  }
  if (tRemove && !facts.some((f) => f.includes('时间') || f.includes('time'))) {
    const ts = (tRemove[1] || tRemove[2] || '').trim()
    if (ts) {
      facts.push(zh ? `告警触发时间（原文）：${ts}` : `Alert trigger time (from text): ${ts}`)
    }
  }
  return facts
}

function buildRootCauses(args: {
  zh: boolean
  alertFacts: string[]
  hits: { s: SkillRecord; score: number }[]
  l2: { x: SkillRecord; score: number }[]
}): string[] {
  const { zh, alertFacts, hits, l2 } = args
  const out: string[] = []

  if (alertFacts.length) {
    out.push(...alertFacts.map((f) => (zh ? `【已证实】${f}` : `【Confirmed】${f}`)))
  }

  const topHits = hits.slice(0, 3)
  for (const h of topHits) {
    out.push(
      zh
        ? `【候选】对齐 L1 ${h.s.id} ${h.s.name}：${h.s.check}（由告警关键词匹配，仍需日志核验）`
        : `【Candidate】Aligns L1 ${h.s.id} ${h.s.name}: ${h.s.check} (keyword match — still needs log verification)`,
    )
  }

  // Only keep L2 that are tightly linked to top L1 hits — never dump unrelated chains
  const topIds = new Set(topHits.map((h) => h.s.id))
  const tightL2 = l2
    .filter((o) => o.x.linkedL1.split(/\s+/).some((id) => topIds.has(id)) || o.score >= 4)
    .slice(0, 2)
  for (const o of tightL2) {
    out.push(
      zh
        ? `【待验证链路】${o.x.id} ${o.x.name} — ${o.x.check}`
        : `【Unverified chain】${o.x.id} ${o.x.name} — ${o.x.check}`,
    )
  }

  if (!hits.length) {
    out.unshift(
      zh
        ? '【Skill 缺口】当前告警未匹配到已定义好的 L1/L2 Skill；下列仅为基于告警原文的可能 RCA 假设，需人工核验后才能当作结论。'
        : '【Skill gap】No defined L1/L2 skill matched this alert; items below are possible RCA hypotheses from the alert text only — not confirmed conclusions.',
    )
  }

  if (!out.length) {
    out.push(
      zh
        ? '告警文本未能对齐具体 Skill；请粘贴完整告警标题、成分源名称、触发时间与价格后再分析。'
        : 'Alert text did not align to a concrete skill — paste full alert title, constituent source, trigger time, and price.',
    )
  }
  return out
}


function matchKnowledge(
  text: string,
  knowledge: KnowledgeItem[],
  tree?: KbNode[],
): { item: KnowledgeItem; score: number; path: string }[] {
  const t = text.toLowerCase()
  return knowledge
    .map((x) => {
      const titleHits = x.title
        .split(/\s+/)
        .filter((w) => w && t.includes(w.toLowerCase())).length
      const bodyHit = x.body
        .split(/[\s，、。；;]+/)
        .filter((w) => w.length >= 4 && t.includes(w.toLowerCase())).length
      const score = titleHits * 2 + Math.min(bodyHit, 3)
      return {
        item: x,
        score,
        path: tree ? kbPath(tree, x.id) : x.title,
      }
    })
    .filter((o) => o.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
}

export function analyzeWithRules(args: {
  text: string
  /** Prefer user alert / OCR for skill matching; ignore auto-bound briefing noise. */
  matchFocus?: string
  severity: SeverityChoice
  skills: SkillRecord[]
  knowledge: KnowledgeItem[]
  tree?: KbNode[]
  startedAt?: number
  lang?: AppLang
  dataSources?: { label: string; url: string }[]
}): RuleAnalysis {
  const lang: AppLang = args.lang === 'zh-Hant' ? 'zh-Hant' : 'en'
  const zh = lang === 'zh-Hant'
  const startedAt = args.startedAt ?? Date.now()
  const focus = (args.matchFocus || args.text || '').trim() || args.text
  const l1Pool = args.skills.filter((s) => s.level === 'L1')
  const l2Pool = args.skills.filter((s) => s.level === 'L2')
  const hits = matchSkills(focus, l1Pool)
  const ids = hits.map((h) => h.s.id)

  // L2 only when tightly linked to matched L1 — avoid dumping every related chain
  const l2 = l2Pool
    .filter((x) => !x.disabled && !x.archivedAt)
    .map((x) => ({
      x,
      score: x.linkedL1.split(/\s+/).filter((id) => ids.includes(id)).length,
    }))
    .filter((o) => o.score >= 2 || (o.score >= 1 && ids.length <= 2))
    .sort((a, b) => b.score - a.score)
    .slice(0, 2)

  const k = matchKnowledge(focus, args.knowledge, args.tree)
  const alertFacts = extractAlertFacts(focus, zh)

  const p0 =
    hits.some((h) => h.s.severity === 'P0') ||
    /ADL失败|全部.*源.*失败|错误强平|强平失败|无有效源|对冲失控|排查後未發現|no clear cause/i.test(
      args.text,
    )
  const sev =
    args.severity === '自动建议'
      ? p0
        ? 'P0'
        : hits.some((h) => h.s.severity === 'P1')
          ? 'P1'
          : hits.length
            ? 'P2'
            : '待判定'
      : args.severity

  const thinking: string[] = zh
    ? [
        '優先用「用戶告警／OCR」做 Skill 匹配；自動綁定行情簡報只作附帶上下文，不主導根因。',
        alertFacts.length
          ? `從告警原文抽出 ${alertFacts.length} 條已證實事實。`
          : '告警原文未抽出結構化事實 — 請貼完整 Lark／監控告警標題與正文。',
        hits.length
          ? `告警對齊已定義 Skill：${hits.map((h) => h.s.id).join(', ')}。`
          : '未匹配到已定義好的 Skill — 將先說明缺口，再動用 LLM 給出可能 RCA，並附外網核驗頁面。',
        l2.length
          ? `僅保留與命中 L1 緊密關聯的 ${l2.length} 條 L2 候選（不堆砌無關鏈路）。`
          : '不強制輸出無關 L2 根因鏈。',
        k.length
          ? `知識樹檢索到 ${k.length} 份文件作為 RAG 上下文。`
          : '知識樹無關鍵詞命中 — 結論保持保守。',
        '區分已證實事實與假設；不編造管理台／DB 答案（Phase 2）。',
        `建議嚴重度：${sev}（需當班人員確認）。`,
      ]
    : [
        'Skill matching uses operator alert / OCR first; auto-bound market briefings are secondary context only.',
        alertFacts.length
          ? `Extracted ${alertFacts.length} confirmed fact(s) from alert text.`
          : 'No structured facts extracted — paste the full monitor/Lark alert title and body.',
        hits.length
          ? `Alert aligned to defined skill(s): ${hits.map((h) => h.s.id).join(', ')}.`
          : 'No defined skill matched — will state the gap, then call LLM for possible RCA and attach external verification pages.',
        l2.length
          ? `Kept ${l2.length} tightly linked L2 candidate(s) only (no unrelated chain dump).`
          : 'Not forcing unrelated L2 root-cause chains.',
        k.length
          ? `Retrieved ${k.length} knowledge-tree document(s) for RAG context.`
          : 'No knowledge-tree keyword hit — answer stays conservative.',
        'Distinguish confirmed facts vs hypotheses; do not invent admin-DB answers (Phase 2).',
        `Severity proposal: ${sev} (human on-duty must confirm).`,
      ]

  const timeline: TimelineEvent[] = zh
    ? [
        { at: startedAt, label: 'RCA 觸發 — 事實已攝入' },
        { at: startedAt + 1, label: 'Skills 匹配（L1 → L2）' },
        { at: startedAt + 2, label: '知識樹 RAG 檢索' },
        { at: startedAt + 3, label: `建議嚴重度 ${sev}` },
        { at: startedAt + 4, label: '已草擬建議下一步' },
      ]
    : [
        { at: startedAt, label: 'RCA triggered — facts ingested' },
        { at: startedAt + 1, label: 'Skills matching (L1 → L2)' },
        { at: startedAt + 2, label: 'Knowledge tree RAG retrieval' },
        { at: startedAt + 3, label: `Severity proposal ${sev}` },
        { at: startedAt + 4, label: 'Recommended next steps drafted' },
      ]

  const skillsUsed: SkillHitRef[] = [
    ...hits.map((h) => ({
      id: h.s.id,
      name: h.s.name,
      level: 'L1' as const,
      severity: h.s.severity,
    })),
    ...l2.map((o) => ({
      id: o.x.id,
      name: o.x.name,
      level: 'L2' as const,
      severity: o.x.severity,
    })),
  ]

  const knowledgeUsed: KnowledgeHitRef[] = k.map((o) => ({
    id: o.item.id,
    title: o.item.title,
    path: o.path,
  }))

  const topForActions = hits.slice(0, 3)
  const nextSteps = [
    ...topForActions.map((h) =>
      zh ? `${h.s.id} 檢查：${h.s.check}` : `${h.s.id} check: ${h.s.check}`,
    ),
    ...l2.slice(0, 2).map((o) =>
      zh ? `${o.x.id} 檢查：${o.x.check}` : `${o.x.id} check: ${o.x.check}`,
    ),
    ...topForActions.map((h) =>
      zh
        ? `${h.s.id} 建議動作（需審批）：${h.s.action}`
        : `${h.s.id} preferred action (approval required): ${h.s.action}`,
    ),
    ...l2.slice(0, 2).map((o) =>
      zh
        ? `${o.x.id} 建議動作（需審批）：${o.x.action}`
        : `${o.x.id} preferred action (approval required): ${o.x.action}`,
    ),
  ]
  if (!nextSteps.length) {
    nextSteps.push(
      ...(zh
        ? [
            '補齊 event_time、contract_id、account_id、原始指標、閾值、上下游日誌。',
            '補上 OCR 文字或行情條件簡報後重新執行排查。',
            '若市場影響不明，升級 Risk Ops — 勿編造管理台答案（Phase 2）。',
          ]
        : [
            'Collect event_time, contract_id, account_id, raw metric, threshold, upstream/downstream logs.',
            'Re-run Investigate after adding OCR text or a Market Condition briefing.',
            'Escalate to Risk Ops if market impact is unclear — do not invent admin DB answers (Phase 2).',
          ]),
    )
  }

  const sources = (args.dataSources || []).filter((s) => s.url && s.label)
  const pathSteps = [
    ...(zh
      ? [
          '核對告警原文：標題、成分源、觸發時間、價格／窗口（不以行情簡報替代告警）',
          '用告警關鍵詞對齊 L1 Skills，再只展開緊密關聯的 L2',
          '知識樹 RAG 僅作佐證，不覆蓋告警事實',
          '產出建議嚴重度與需審批動作',
        ]
      : [
          'Verify alert text: title, constituent source, trigger time, price/window (do not let market briefings replace the alert)',
          'Align L1 skills from alert keywords, then expand only tightly linked L2',
          'Knowledge-tree RAG is supporting evidence only — never override alert facts',
          'Propose severity and approval-gated actions',
        ]),
    ...(hits.slice(0, 4).map((h) =>
      zh
        ? `L1 ${h.s.id} ${h.s.name} — 檢查：${h.s.check}`
        : `L1 ${h.s.id} ${h.s.name} — check: ${h.s.check}`,
    )),
    ...l2.map((o) =>
      zh
        ? `L2 ${o.x.id} ${o.x.name} — ${o.x.check}`
        : `L2 ${o.x.id} ${o.x.name} — ${o.x.check}`,
    ),
  ]

  const rootCauses = buildRootCauses({ zh, alertFacts, hits, l2 })

  const lines = zh
    ? [
        `【建議嚴重度】${sev}（僅基於輸入和規則，需當班人員覆核）`,
        '',
        '【根因】',
        ...rootCauses.map((x) => `• ${x}`),
        '',
        '【排查路徑】',
        ...pathSteps.map((x, i) => `${i + 1}. ${x}`),
        '',
        '【下一步／建議方案（需人工審批）】',
        ...nextSteps.map((s, i) => `${i + 1}. ${s}`),
        '',
        '【使用的數據來源（直連連結）】',
        ...(sources.length
          ? sources.map((s) => `• ${s.label} — ${s.url}`)
          : ['• 尚無行情掃描引用連結；請先在「行情條件」產生簡報。']),
        '',
        '【思考過程】',
        ...thinking.map((x) => `• ${x}`),
        '',
        '【時間線】',
        ...timeline.map(
          (e) =>
            `• ${new Date(e.at).toLocaleString('en-SG', { timeZone: 'Asia/Singapore' })} SGT — ${e.label}`,
        ),
        '',
        '【已知事實】',
        args.text || '未提供告警文字。',
        '',
        '【使用的 Skills】',
        ...(skillsUsed.length
          ? skillsUsed.map(
              (s) =>
                `• [${s.level}] ${s.id} ${s.name}${s.severity ? ` (${s.severity})` : ''}`,
            )
          : ['• 未能可靠匹配。請補充告警原文、合約、數值和時間。']),
        '',
        '【使用的知識樹節點】',
        ...(knowledgeUsed.length
          ? knowledgeUsed.map((n) => `• ${n.path}`)
          : ['• 無關鍵詞匹配；請在知識庫補充相關節點。']),
        '',
        '【後續優化（僅歸檔 RCA 進入週優化輸入）】',
        ...hits.map((h) => `• ${h.s.opt}`),
        ...l2.map((o) => `• ${o.x.opt}`),
        '',
        '【升級與收口】',
        sev === 'P0'
          ? '• 立即通知 Risk Ops、業務 Owner 與技術值班；不等待 L2 或 AI。'
          : '• 當班確認責任人、業務影響和下一次覆核時間。',
        '• 恢復需核對價格／倉位／帳務／服務狀態，觀察穩定後由授權人員關閉。',
        '',
        '【缺失證據／誠實邊界】',
        '• 需要準確的 event_time、contract_id、account_id、指標原始值、閾值、上下游日誌、已採取動作。',
        '• 內部管理台／帳戶資料庫檢索為 Phase 2 — 本助手不會編造 admin DB 答案。',
        '',
        '本段為確定性規則輔助；不構成已證實根因或自動執行指令。即時統計會計入每一次觸發的 RCA；僅歸檔後才進入週優化輸入。',
      ]
    : [
        `【Recommended severity】${sev} (rules + input only — on-duty must confirm)`,
        '',
        '【Root cause】',
        ...rootCauses.map((x) => `• ${x}`),
        '',
        '【Investigation path】',
        ...pathSteps.map((x, i) => `${i + 1}. ${x}`),
        '',
        '【Next steps / recommendations (approval required)】',
        ...nextSteps.map((s, i) => `${i + 1}. ${s}`),
        '',
        '【Data sources used (direct links)】',
        ...(sources.length
          ? sources.map((s) => `• ${s.label} — ${s.url}`)
          : ['• No market-scan citation URLs yet — generate a Market Condition briefing first.']),
        '',
        '【Thinking】',
        ...thinking.map((x) => `• ${x}`),
        '',
        '【Timeline】',
        ...timeline.map(
          (e) =>
            `• ${new Date(e.at).toLocaleString('en-SG', { timeZone: 'Asia/Singapore' })} SGT — ${e.label}`,
        ),
        '',
        '【Confirmed facts】',
        args.text || 'No alert text provided.',
        '',
        '【Skills used】',
        ...(skillsUsed.length
          ? skillsUsed.map(
              (s) =>
                `• [${s.level}] ${s.id} ${s.name}${s.severity ? ` (${s.severity})` : ''}`,
            )
          : ['• No confident match. Add alert text, contract, values, and timestamps.']),
        '',
        '【Knowledge tree nodes】',
        ...(knowledgeUsed.length
          ? knowledgeUsed.map((n) => `• ${n.path}`)
          : ['• No keyword hit — add related nodes in Knowledge Base.']),
        '',
        '【Follow-on optimisation (archived RCAs only enter weekly opt)】',
        ...hits.map((h) => `• ${h.s.opt}`),
        ...l2.map((o) => `• ${o.x.opt}`),
        '',
        '【Escalation & close】',
        sev === 'P0'
          ? '• Page Risk Ops, business owner, and tech on-call immediately — do not wait for L2/AI.'
          : '• Confirm owner, business impact, and next review time.',
        '• Recovery must reconcile price/position/ledger/service health; authorised staff close after stable observation.',
        '',
        '【Missing evidence / honesty bounds】',
        '• Need accurate event_time, contract_id, account_id, raw metric, threshold, upstream/downstream logs, actions already taken.',
        '• Internal admin / account DB retrieval is Phase 2 — this assistant will not invent admin DB answers.',
        '',
        'This block is deterministic rules assist only; it is not a confirmed root cause or an auto-executed order. Realtime stats count every triggered RCA; only archived ones enter weekly optimisation.',
      ]

  const skillContext = [
    '## Skills used',
    ...skillsUsed.map((s) => `- [${s.level}] ${s.id} ${s.name}`),
    '## L1 detail',
    ...hits.map(
      (h) =>
        `- ${h.s.id} ${h.s.name} [${h.s.severity}]\n  check: ${h.s.check}\n  action: ${h.s.action}\n  opt: ${h.s.opt}`,
    ),
    '## L2 detail',
    ...l2.map(
      (o) =>
        `- ${o.x.id} ${o.x.name}\n  linked: ${o.x.linkedL1}\n  check: ${o.x.check}\n  action: ${o.x.action}\n  opt: ${o.x.opt}`,
    ),
    '## Data sources (direct links)',
    ...(sources.length
      ? sources.map((s) => `- ${s.label}: ${s.url}`)
      : ['- (none attached)']),
  ].join('\n')

  const kbContext = k.map((o) => `### ${o.path}\n${o.item.body}`).join('\n\n')

  return {
    body: lines.join('\n'),
    sev,
    hits: ids,
    l2: l2.map((o) => o.x.id),
    skillContext,
    kbContext,
    thinking,
    timeline,
    skillsUsed,
    knowledgeUsed,
    nextSteps,
    rootCauses,
    pathSteps,
    skillMatched: hits.length > 0,
  }
}

/** Rules-mode follow-up that refuses invented admin answers. */
export function followUpWithRules(
  question: string,
  activeFacts: string,
  lang: AppLang = 'en',
): string {
  const q = question.trim()
  const lower = q.toLowerCase()
  const zh = lang === 'zh-Hant'
  const relevance = assessFollowUpRelevance(q, activeFacts, lang)
  if (!relevance.ok) return relevance.message

  const wantsAdmin =
    /admin|账号|账户|倉位|仓位|持仓|數據庫|数据库|db\b|sql|后台|管理台|內部數據|拉取|查詢用戶|查询用户/i.test(
      q,
    )
  const lines = zh
    ? ['【追問回覆 · 本地規則】', '', `問題：${q}`, '']
    : ['【Follow-up · local rules】', '', `Question: ${q}`, '']

  if (wantsAdmin) {
    lines.push(
      ...(zh
        ? [
            '我不確定，也無法在本階段檢索內部管理台或帳戶資料庫。',
            '內部 admin 資訊檢索屬於 Phase 2 — 請勿假設我已存取生產資料。',
            '請改用當班 Risk Ops 工具鏈，或把已知截圖／指標貼到排查事實框後重新分析。',
          ]
        : [
            'I do not know, and I cannot query internal admin or account databases in this phase.',
            'Internal admin retrieval is Phase 2 — do not assume I have production access.',
            'Use the on-duty Risk Ops toolchain, or paste known screenshots/metrics into Investigate and re-run.',
          ]),
    )
  } else if (!activeFacts.trim()) {
    lines.push(
      ...(zh
        ? [
            '當前事故缺少事實輸入，我無法可靠回答。',
            '請補充告警原文、合約、數值與時間戳後重新執行分析。',
          ]
        : [
            'This incident lacks facts — I cannot answer reliably.',
            'Add alert text, contract, values, and timestamps, then re-run analysis.',
          ]),
    )
  } else if (/為什麼|why|怎麼|怎么|how|根因|root/i.test(lower)) {
    lines.push(
      ...(zh
        ? [
            '基於已保存事實，我只能複述規則匹配結論，不能發明新根因。',
            '若 Skills／知識庫未覆蓋該場景，答案即為「不確定」。',
            '請在 Skills 或知識樹補充節點後再分析，或升級人工排查。',
            '',
            '提醒：內部 admin 資訊檢索為 Phase 2。',
          ]
        : [
            'From saved facts I can only restate the rules match — I will not invent a new root cause.',
            'If Skills / Knowledge Base do not cover the case, the honest answer is “uncertain”.',
            'Add Skills or knowledge nodes, then re-analyse, or escalate to human investigation.',
            '',
            'Reminder: internal admin retrieval is Phase 2.',
          ]),
    )
  } else {
    lines.push(
      ...(zh
        ? [
            '我只能依據本次 RCA 已匹配的 Skills 與知識樹節點解釋報告內容。',
            '若問題超出已提供證據，我的誠實回答是：不知道。',
            '內部管理台／DB 拉取屬於 Phase 2，不會編造。',
          ]
        : [
            'I can only explain this RCA using matched Skills and knowledge-tree nodes.',
            'If the question exceeds provided evidence, the honest answer is: I do not know.',
            'Internal admin / DB pull is Phase 2 — I will not invent it.',
          ]),
    )
  }
  return lines.join('\n')
}
