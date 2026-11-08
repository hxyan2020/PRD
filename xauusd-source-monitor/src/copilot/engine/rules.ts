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

function matchSkills(
  text: string,
  skills: SkillRecord[],
): { s: SkillRecord; score: number }[] {
  const t = text.toLowerCase()
  return skills
    .filter((s) => !s.disabled && !s.archivedAt)
    .map((s) => {
      const keys = [
        s.id.toLowerCase(),
        s.name.toLowerCase(),
        ...s.name.split(/\s+/),
        ...s.matchHints.split(/[\s,/|]+/).filter(Boolean),
      ]
      let score = 0
      for (const k of keys) {
        if (k.length >= 2 && t.includes(k.toLowerCase())) score += k.length >= 4 ? 2 : 1
      }
      for (const w of s.check.split(/[，、；;/\s]+/).filter((x) => x.length >= 3)) {
        if (t.includes(w.toLowerCase())) score += 1
      }
      return { s, score }
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
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
  const l1Pool = args.skills.filter((s) => s.level === 'L1')
  const l2Pool = args.skills.filter((s) => s.level === 'L2')
  const hits = matchSkills(args.text, l1Pool)
  const ids = hits.map((h) => h.s.id)

  const l2 = l2Pool
    .filter((x) => !x.disabled && !x.archivedAt)
    .map((x) => ({
      x,
      score: x.linkedL1.split(/\s+/).filter((id) => ids.includes(id)).length,
    }))
    .filter((o) => o.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)

  const directL2 = matchSkills(args.text, l2Pool).filter(
    (h) => !l2.some((o) => o.x.id === h.s.id),
  )
  for (const d of directL2.slice(0, 2)) {
    l2.push({ x: d.s, score: d.score })
  }

  const k = matchKnowledge(args.text, args.knowledge, args.tree)

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
        '已攝入告警文字／OCR 事實與可選行情簡報。',
        hits.length
          ? `依 id／名稱／檢查項匹配到 ${hits.length} 個 L1 Skill。`
          : '未能可靠匹配 L1 Skill — 請補充告警原文、合約與指標數值。',
        l2.length
          ? `由關聯 L1／直接命中彙總出 ${l2.length} 條 L2 鏈路候選。`
          : '關聯 L1 證據不足，暫不強制 L2 根因鏈。',
        k.length
          ? `知識樹檢索到 ${k.length} 份文件作為 RAG 上下文。`
          : '知識樹無關鍵詞命中 — 結論保持保守。',
        '區分已證實事實與假設；不編造管理台／DB 答案（Phase 2）。',
        `建議嚴重度：${sev}（需當班人員確認）。`,
      ]
    : [
        'Ingest alert text / OCR facts and optional briefing import.',
        hits.length
          ? `Matched ${hits.length} L1 skill(s) by id/name/check tokens.`
          : 'No confident L1 skill match — need clearer alert text, contract, and metric values.',
        l2.length
          ? `Aggregated ${l2.length} L2 chain candidate(s) from linked L1 / direct hits.`
          : 'Insufficient linked L1 evidence to force an L2 root-cause chain.',
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

  const nextSteps = [
    ...hits.map((h) => `${h.s.id}: ${h.s.check}`),
    ...l2.map((o) => `${o.x.id}: ${o.x.check}`),
    ...hits.map((h) =>
      zh
        ? `${h.s.id} 建議動作（需審批）：${h.s.action}`
        : `${h.s.id} preferred action (approval required): ${h.s.action}`,
    ),
    ...l2.map((o) =>
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
  const pathLines = [
    ...(zh
      ? [
          '1. 攝入告警／截圖與自動綁定的行情事件',
          '2. 匹配 L1 指標 Skills → 彙總關聯 L2 鏈路',
          '3. 知識樹 RAG 檢索佐證',
          '4. 產出建議嚴重度與需審批的建議動作',
        ]
      : [
          '1. Ingest alert / screenshots and auto-bound market events',
          '2. Match L1 indicator skills → aggregate linked L2 chains',
          '3. Knowledge-tree RAG for supporting evidence',
          '4. Propose severity and approval-gated preferred actions',
        ]),
    ...(hits.length
      ? hits.map((h, i) =>
          zh
            ? `${i + 5}. L1 ${h.s.id} ${h.s.name} — 檢查：${h.s.check}`
            : `${i + 5}. L1 ${h.s.id} ${h.s.name} — check: ${h.s.check}`,
        )
      : []),
    ...(l2.length
      ? l2.map((o, i) =>
          zh
            ? `${hits.length + i + 5}. L2 ${o.x.id} ${o.x.name} — 驗證上游是否早於下游`
            : `${hits.length + i + 5}. L2 ${o.x.id} ${o.x.name} — verify upstream precedes downstream`,
        )
      : []),
  ]

  const lines = zh
    ? [
        `【建議嚴重度】${sev}（僅基於輸入和規則，需當班人員覆核）`,
        '',
        '【排查路徑】',
        ...pathLines.map((x) => `• ${x}`),
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
        '【候選根因／驗證方向】',
        ...(l2.length
          ? l2.map((o) => `• ${o.x.name}：需驗證其上游故障是否早於下游異常`)
          : ['• 數據源、報價策略、帳戶風險、撮合／結算或監控自身異常；尚無法確定。']),
        '',
        '【建議方案（需人工審批）】',
        ...nextSteps.map((s, i) => `${i + 1}. ${s}`),
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
        '【Investigation path】',
        ...pathLines.map((x) => `• ${x}`),
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
        '【Candidate root causes / verification】',
        ...(l2.length
          ? l2.map(
              (o) =>
                `• ${o.x.name}: verify whether upstream failure preceded downstream anomaly`,
            )
          : [
              '• Data source, quote policy, account risk, matching/settlement, or monitor self-fault — still unconfirmed.',
            ]),
        '',
        '【Recommendations (approval required)】',
        ...nextSteps.map((s, i) => `${i + 1}. ${s}`),
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
