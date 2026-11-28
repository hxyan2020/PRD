import {
  downloadMessageImage,
  fetchUserDisplayName,
  isLarkAdminUser,
  resolveAdminOpenId,
} from './client.js'
import {
  alertGatherCard,
  alertOptimizeCard,
  clearReviewConfirmCard,
  greetingCard,
  helpCard,
  incidentDetailCard,
  investigationEndAskReportCard,
  investigationEscalateBriefingCard,
  investigationEscalatedWaitingCard,
  investigationEvidencePromptCard,
  investigationGuideCompleteCard,
  investigationPathOverviewCard,
  investigationReportDraftCard,
  investigationRequiredSkipPromptCard,
  investigationStepGuideCard,
  investigationSupplementAckCard,
  investigationSupplementPromptCard,
  knowledgeCatalogCard,
  nodeDetailCard,
  reviewCard,
  riskVerdictPromptCard,
  simpleCard,
  skillsCatalogCard,
} from './cards.js'
import {
  clearEscalationPending,
  clearEscalationsForOperator,
  escalateRolesForStep,
  getEscalationPending,
  rememberEscalationPending,
  resolveEscalateOpenIds,
} from './escalate.js'
import {
  looksLikeGroupAutoAlert,
  looksLikeOurOutboundCard,
  sessionOpenIdFor,
} from './parse.js'
import {
  normalizeRiskVerdict,
  riskVerdictEmoji,
  riskVerdictLabel,
  suggestRiskVerdict,
} from './riskVerdict.js'
import { chatComplete, describeImage } from './llm.js'
import {
  extractWikiQuery,
  fetchChatHistory,
  listWikiSpaces,
  readDocxRaw,
  readLarkDocByToken,
  searchLarkWiki,
  wikiAccessSetupHint,
} from './larkDocs.js'
import {
  buildMarketCard,
  fetchMarketSnapshot,
  formatMarketAnswer,
  hourlyMarketTitle,
  rememberChatMarketLang,
  resolveMarketLang,
} from './market.js'
import { fetchQuoteOpsRag } from './quoteOps.js'
import { buildWeeklyReport, weeklyReportCard } from './weeklyReport.js'
import {
  evidenceCoversStep,
  planInvestigationPath,
  formatRagAnswer,
  loadKnowledge,
  loadSkills,
  looksLikeNodeIdReply,
  preferredActions,
  resolveNodeById,
  retrieveRag,
  splitSkillSteps,
  tokenize,
} from './skills.js'
import { detectSafetyViolation, safetyReply } from './safety.js'
import {
  accessUnavailableReply,
  botCapabilitiesReply,
  botMetaReply,
  botRuntimeMetaReply,
  casualChatReply,
  chatbotFallbackReply,
  clearReviewDeniedReply,
  isStubMenuReply,
  classifyIntent,
  commandConfirmPrompt,
  detectLang,
  greetingReply,
  helpReply,
  isCasualBanter,
  isCasualChat,
  isClearReviewConfirmCommand,
  isLarkWikiQuestion,
  looksLikeCommandCancel,
  looksLikeCommandConfirm,
  looksLikeIncidentEvidence,
  looksLikeInvestigationQuestion,
  looksLikeNowTimeQuestion,
  looksLikePureChat,
  looksLikeTimezoneQuestion,
  needsInaccessibleAccess,
  nowTimeReply,
  timezoneReply,
  isInvReportCommand,
  isStepDoneCommand,
  pendingCommandLabel,
  resolveTurnDisposition,
  sharedDocReadReply,
} from './scope.js'
import { looksLikeShareOrFileMeta } from './lang.js'
import {
  attachmentLooksRiskRelated,
  extractDocUrlOrToken,
  formatAttachmentUnderstanding,
  harvestAttachmentText,
  isAttachmentMessage,
} from './attachment.js'
import {
  formatWebSearchAnswer,
  searchWeb,
  shouldAutoWebSearch,
  webSearchContext,
} from './webSearch.js'
import { logInbound } from './inboundLog.js'
import {
  clearAllIncidentsDurable,
  clearSessionDurable,
  ensureSessionInteractions,
  findRecentGatherSession,
  getIncidentDurable,
  getSessionDurable,
  listIncidentsDurable,
  newIncidentId,
  saveSessionDurable,
  upsertIncidentDurable,
} from './store.js'
import type {
  BotReply,
  GuideStep,
  IncomingMessage,
  IncidentRecord,
  InvestigationInteraction,
  InvestigationState,
  Lang,
  PendingCommandIntent,
} from './types.js'

function titleFromFacts(facts: string[], lang: Lang): string {
  const first = facts[0]?.replace(/\s+/g, ' ').trim().slice(0, 48) || ''
  if (first) return first
  if (lang === 'zh-Hans') return '未命名事故'
  if (lang === 'zh-Hant') return '未命名事故'
  return 'Untitled incident'
}

/** Haixiang-only: prompt or execute wipe of all 复盘 historic cases. */
async function handleClearReviewCommand(args: {
  openId: string
  chatId: string
  lang: Lang
  /** true when user already confirmed (text or button). */
  confirmed: boolean
}): Promise<BotReply> {
  const gate = await isLarkAdminUser(args.openId, { preferChatId: args.chatId })
  if (!gate.ok) {
    const title =
      args.lang === 'zh-Hans'
        ? '清空复盘 · 权限不足'
        : args.lang === 'zh-Hant'
          ? '清空複盤 · 權限不足'
          : 'Clear review · denied'
    return { card: simpleCard(title, clearReviewDeniedReply(args.lang), 'orange') }
  }
  if (!args.confirmed) {
    const all = await listIncidentsDurable({ status: 'all', limit: 500 })
    return { card: clearReviewConfirmCard({ lang: args.lang, count: all.length }) }
  }
  const { cleared } = await clearAllIncidentsDurable()
  const title =
    args.lang === 'zh-Hans'
      ? '复盘已清空'
      : args.lang === 'zh-Hant'
        ? '複盤已清空'
        : 'Review cleared'
  const body =
    args.lang === 'zh-Hans'
      ? [
          '✅ **已清空复盘历史案件**（仅 Haixiang 可执行）',
          '',
          `• 删除条数：**${cleared}**`,
          '• 发送 **复盘** 可查看空看板。',
        ].join('\n')
      : args.lang === 'zh-Hant'
        ? [
            '✅ **已清空複盤歷史案件**（僅 Haixiang 可執行）',
            '',
            `• 刪除條數：**${cleared}**`,
            '• 發送 **複盤** 可查看空看板。',
          ].join('\n')
        : [
            '✅ **Review history cleared** (Haixiang only)',
            '',
            `• Removed: **${cleared}**`,
            '• Say **review** to open the empty board.',
          ].join('\n')
  return {
    card: reviewCard({
      lang: args.lang,
      incidents: [],
      doneBanner: body,
    }),
  }
}

/** User-pasted / OCR / forwarded alert bodies — exclude chat-history noise. */
function evidenceFacts(facts: string[]): string[] {
  return facts
    .map((f) => f.trim())
    .filter((f) => f && !f.startsWith('[chat-history]'))
}

/** Always show skill as `L1-xx · name` (never ids-only). */
function formatSkillHitLine(hits: { id: string; name: string }[], max = 3): string {
  return hits
    .slice(0, max)
    .map((h) => `**${h.id} · ${h.name}**`)
    .join('；')
}

/** Quote the operator's screenshot / message / forwarded alert on the overview. */
function formatEvidenceBlock(lang: Lang, facts: string[]): string {
  const items = evidenceFacts(facts).slice(0, 3)
  if (!items.length) return ''
  const hans = lang === 'zh-Hans'
  const hant = lang === 'zh-Hant'
  const head = hans
    ? '📥 **用户告警／截图／转发**'
    : hant
      ? '📥 **使用者告警／截圖／轉發**'
      : '📥 **User alert / screenshot / forward**'
  const lines = items.map((raw, i) => {
    const one = raw
      .replace(/\[(forwarded_card|merge_forward|replied_alert)\]\s*/gi, '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 420)
    const more = raw.replace(/\s+/g, ' ').trim().length > 420 ? '…' : ''
    return `${i + 1}. ${one || (hans ? '（附件已摄入，正文较短）' : hant ? '（附件已攝入，正文較短）' : '(attachment ingested)')}${more}`
  })
  return [head, '', ...lines].join('\n')
}

function buildSummary(args: {
  lang: Lang
  severity: string
  hits: { id: string; name: string; score?: number }[]
  kb: { title: string }[]
  facts: string[]
  adapted: boolean
  newlyCovered?: string[]
  reordered?: boolean
}): string {
  const hans = args.lang === 'zh-Hans'
  const hant = args.lang === 'zh-Hant'
  const byAlertName = args.hits.length > 0 && (args.hits[0]?.score ?? 0) >= 100
  const hitLine = args.hits.length
    ? formatSkillHitLine(args.hits, byAlertName ? 2 : 4)
    : hans
      ? '无自信匹配'
      : hant
        ? '無自信匹配'
        : 'no confident match'
  const skillLabel = byAlertName
    ? hans
      ? '命中 Skill'
      : hant
        ? '命中 Skill'
        : 'Matched Skill'
    : hans
      ? '候选 Skill'
      : hant
        ? '候選 Skill'
        : 'Candidate Skills'
  const coveredBits = (args.newlyCovered || [])
    .slice(0, 3)
    .map((s) => s.replace(/^(\[[^\]]+\]|【[^】]+】)\s*/, '').slice(0, 36))
  const coveredLine = coveredBits.length
    ? hans
      ? `• **本轮已覆盖：** ${coveredBits.join('；')}`
      : hant
        ? `• **本輪已覆蓋：** ${coveredBits.join('；')}`
        : `• **Covered this turn:** ${coveredBits.join('; ')}`
    : ''
  const evidence = formatEvidenceBlock(args.lang, args.facts)
  const evidenceCount = evidenceFacts(args.facts).length
  // Evidence body + skill name are required on 排查/investigate overview.
  if (hans) {
    return [
      '📋 **摘要**',
      '',
      `• **已摄入事实／证据：** **${evidenceCount}**`,
      `• **${skillLabel}：** ${hitLine}`,
      coveredLine,
      evidence ? `\n${evidence}` : '',
    ]
      .filter(Boolean)
      .join('\n')
  }
  if (hant) {
    return [
      '📋 **摘要**',
      '',
      `• **已攝入事實／證據：** **${evidenceCount}**`,
      `• **${skillLabel}：** ${hitLine}`,
      coveredLine,
      evidence ? `\n${evidence}` : '',
    ]
      .filter(Boolean)
      .join('\n')
  }
  return [
    '📋 **Summary**',
    '',
    `• **Facts ingested:** **${evidenceCount}**`,
    `• **${skillLabel}:** ${hitLine}`,
    coveredLine,
    evidence ? `\n${evidence}` : '',
  ]
    .filter(Boolean)
    .join('\n')
}

/** Alert-specific cause hypotheses (not a repeat of the matched Skill id/name). */
function alertCauseHypotheses(args: {
  lang: Lang
  hit: { id: string; name: string; check: string }
  facts: string[]
}): string[] {
  const hans = args.lang === 'zh-Hans'
  const hant = args.lang === 'zh-Hant'
  const en = !hans && !hant
  const blob = args.facts.join('\n')
  const name = args.hit.name
  const cue: string[] = []
  const spreadM = blob.match(/spread\s*[:=]?\s*([0-9.]+)/i)
  const thrM = blob.match(/(?:阈值|threshold)\s*[:=]?\s*([0-9.]+)/i)
  if (spreadM && thrM) {
    cue.push(
      hans
        ? `告警显示 Spread **${spreadM[1]}** 对阈值 **${thrM[1]}**`
        : hant
          ? `告警顯示 Spread **${spreadM[1]}** 對閾值 **${thrM[1]}**`
          : `Alert shows Spread **${spreadM[1]}** vs threshold **${thrM[1]}**`,
    )
  }
  const bpsM = blob.match(/(\d+(?:\.\d+)?)\s*bps/i)
  if (bpsM) {
    cue.push(hans || hant ? `偏离约 **${bpsM[1]} bps**` : `deviation ~**${bpsM[1]} bps**`)
  }

  const family = ((): string[] => {
    if (/价差|價差|spread|盘口价差|盤口價差/i.test(name) || /L1-03/i.test(args.hit.id)) {
      return hans
        ? [
            '做市／流动性不足：买卖盘变薄或单边撤单，Bid–Ask 被动拉宽',
            '短时大额吃单冲击盘口，价差尖刺后尚未恢复',
            '局部盘口异常（Index／Mark 仍正常）— 非指数源问题的可能性',
            '异常挂单／错价委托把盘口价差撑开',
          ]
        : hant
          ? [
              '做市／流動性不足：買賣盤變薄或單邊撤單，Bid–Ask 被動拉寬',
              '短時大額吃單衝擊盤口，價差尖刺後尚未恢復',
              '局部盤口異常（Index／Mark 仍正常）— 非指數源問題的可能性',
              '異常掛單／錯價委託把盤口價差撐開',
            ]
          : [
              'Thin liquidity / one-sided cancels widened Bid–Ask',
              'Short burst of aggressive fills spiked spread before recovery',
              'Local book anomaly while Index/Mark still healthy',
              'Mispriced resting orders holding the spread open',
            ]
    }
    if (/偏离|偏離|deviation|盘口偏离/i.test(name) || /L1-04/i.test(args.hit.id)) {
      return hans
        ? [
            '盘口 Mid 相对 Index 短时偏离（流动性冲击或挂单失衡）',
            '行情源／指数更新滞后，盘口先动、Index 后跟上',
            'Price Band／合理价配置异常导致可成交价被推离 Index',
          ]
        : hant
          ? [
              '盤口 Mid 相對 Index 短時偏離（流動性衝擊或掛單失衡）',
              '行情源／指數更新滯後，盤口先動、Index 後跟上',
              'Price Band／合理價配置異常導致可成交價被推離 Index',
            ]
          : [
              'Book mid briefly diverged from Index (liquidity / imbalance)',
              'Index lag: book moved first, Index caught up later',
              'Price-band / fair-price config pushing tradable prices off Index',
            ]
    }
    if (/插针|插針|spike/i.test(name) || /L1-05/i.test(args.hit.id)) {
      return hans
        ? [
            '薄盘口被大单瞬间打穿，成交价尖刺',
            '条件单／止损连锁触发放大波动',
            '错价或异常订单造成的短暂插针（需核对委托与成交）',
          ]
        : hant
          ? [
              '薄盤口被大單瞬間打穿，成交價尖刺',
              '條件單／止損連鎖觸發放大波動',
              '錯價或異常訂單造成的短暫插針（需核對委託與成交）',
            ]
          : [
              'Thin book swept by a large order → trade-price spike',
              'Stop / conditional cascade amplifying the move',
              'Mispriced order causing a brief spike (check orders & fills)',
            ]
    }
    if (/funding|资金费率|資金費率/i.test(name)) {
      return hans
        ? [
            '本所 Premium／基础费率计算异常或结算窗口错位',
            '友商 Funding 短时偏离，价差监控触发',
            '指数／持仓名义变化带动 Funding 跳变',
          ]
        : hant
          ? [
              '本所 Premium／基礎費率計算異常或結算窗口錯位',
              '友商 Funding 短時偏離，價差監控觸發',
              '指數／持倉名義變化帶動 Funding 跳變',
            ]
          : [
              'Local premium / base-rate calc or settlement-window glitch',
              'Peer Funding briefly diverged and tripped the monitor',
              'Index / OI shift driving a Funding jump',
            ]
    }
    if (/源|剔除|恢复|恢復|超时|超時|降级|降級|mark/i.test(name)) {
      return hans
        ? [
            '行情源超时／抖动，触发剔除或降级',
            '权重／最小源数配置使剩余源不足',
            '切源或线性过渡期间 Index／Mark 短时不稳定',
          ]
        : hant
          ? [
              '行情源超時／抖動，觸發剔除或降級',
              '權重／最小源數配置使剩餘源不足',
              '切源或線性過渡期間 Index／Mark 短時不穩定',
            ]
          : [
              'Source timeout / flap → exclude or degrade',
              'Weight / min-source config left too few live sources',
              'Switchover / linear transition briefly destabilized Index/Mark',
            ]
    }
    if (/强平|爆仓|接仓|ADL/i.test(name)) {
      return hans
        ? [
            '剧烈行情下保证金不足触发强平／接仓',
            '标记价格短时偏离导致误触发风险',
            '接仓账户额度／风控阈值触及',
          ]
        : hant
          ? [
              '劇烈行情下保證金不足觸發強平／接倉',
              '標記價格短時偏離導致誤觸發風險',
              '接倉帳戶額度／風控閾值觸及',
            ]
          : [
              'Margin stress under a sharp move → liq / takeover',
              'Brief mark dislocation raising false-trigger risk',
              'Takeover-account limit / risk threshold hit',
            ]
    }
    // Generic fallback from Skill.check atoms — framed as causes, not “matched skill”.
    const atoms = splitSkillSteps(args.hit.check)
      .map((s) => s.replace(/^【?可选】?\s*|^【?可選】?\s*|\(optional\)/gi, '').trim())
      .filter(Boolean)
      .slice(0, 3)
    if (atoms.length) {
      return atoms.map((a) =>
        hans
          ? `待核实：${a.slice(0, 72)}${a.length > 72 ? '…' : ''} 异常是否导致本告警`
          : hant
            ? `待核實：${a.slice(0, 72)}${a.length > 72 ? '…' : ''} 異常是否導致本告警`
            : `To verify: whether anomaly in “${a.slice(0, 72)}” drove this alert`,
      )
    }
    return en
      ? ['Insufficient fields — hypotheses pending more alert detail']
      : hans
        ? ['字段不足，待补充告警细节后再收敛假设']
        : ['欄位不足，待補充告警細節後再收斂假設']
  })()

  const out: string[] = []
  if (cue.length) {
    out.push(
      hans
        ? `观察：${cue.join('；')}`
        : hant
          ? `觀察：${cue.join('；')}`
          : `Observation: ${cue.join('; ')}`,
    )
  }
  for (const h of family.slice(0, cue.length ? 3 : 4)) out.push(h)
  return out
}

/**
 * Skills-first investigate body (no free reasoning).
 * Causes = alert hypotheses; action = 决策分支 — Skill text + adaptive NEXT/COVERED.
 */
function formatInvestigateCore(args: {
  lang: Lang
  hits: { id: string; name: string; check: string; action: string }[]
  kb: { title: string }[]
  facts?: string[]
  nextSteps?: string[]
  covered?: string[]
  newlyCovered?: string[]
}): string {
  const hans = args.lang === 'zh-Hans'
  const hant = args.lang === 'zh-Hant'
  const lines: string[] = []
  lines.push(
    hans
      ? '📌 **模式：** Skills 路径协助（未启用自由推理）'
      : hant
        ? '📌 **模式：** Skills 路徑協助（未啟用自由推理）'
        : '📌 **Mode:** Skills-guided path (no free reasoning)',
  )
  lines.push('')
  lines.push(hans ? '🔎 **可能原因**' : hant ? '🔎 **可能原因**' : '🔎 **Possible causes**')
  if (args.hits.length) {
    const hyps = alertCauseHypotheses({
      lang: args.lang,
      hit: args.hits[0]!,
      facts: args.facts || [],
    })
    for (const h of hyps) lines.push(`• ${h}`)
  } else {
    lines.push(
      hans
        ? '• 暂无高置信场景命中 — 请补充告警字段（合约／指标／阈值／时间）'
        : hant
          ? '• 暫無高置信場景命中 — 請補充告警欄位（合約／指標／閾值／時間）'
          : '• No high-confidence scenario yet — add alert fields (contract / metric / threshold / time)',
    )
  }
  if (args.newlyCovered?.length) {
    lines.push('')
    lines.push(hans ? '✅ **本轮已覆盖**' : hant ? '✅ **本輪已覆蓋**' : '✅ **Covered this turn**')
    for (const c of args.newlyCovered.slice(0, 4)) lines.push(`• ${c}`)
  }
  // Path + decisions are one block on the overview / step cards — not repeated here.
  if (args.covered?.length && !args.newlyCovered?.length) {
    lines.push('')
    lines.push(
      hans
        ? `_已覆盖 ${args.covered.length} 步_`
        : hant
          ? `_已覆蓋 ${args.covered.length} 步_`
          : `_Covered ${args.covered.length} step(s)_`,
    )
  }
  return lines.join('\n')
}

/** Deterministic answer when user asks during investigate but LLM is unavailable. */
function formatInvestigateQuestionFallback(args: {
  lang: Lang
  question: string
  hits: { id: string; name: string; check: string; action: string }[]
  nextSteps: string[]
}): string {
  const hans = args.lang === 'zh-Hans'
  const hant = args.lang === 'zh-Hant'
  const skill = args.hits[0]
  const lines: string[] = []
  lines.push(
    hans
      ? '💬 **解答（解题模式）**'
      : hant
        ? '💬 **解答（解題模式）**'
        : '💬 **Answer (question mode)**',
  )
  lines.push('')
  lines.push(
    hans
      ? `你问：_「${args.question.replace(/\s+/g, ' ').trim().slice(0, 120)}」_`
      : hant
        ? `你問：_「${args.question.replace(/\s+/g, ' ').trim().slice(0, 120)}」_`
        : `You asked: _“${args.question.replace(/\s+/g, ' ').trim().slice(0, 120)}”_`,
  )
  if (skill) {
    lines.push(
      hans || hant
        ? `• 当前按 Skill **${skill.id} · ${skill.name}** 协助；下面仍只引用该 Skill 的检查／决策原文。`
        : `• Still assisting via Skill **${skill.id} · ${skill.name}**; check/action below stay Skill-verbatim.`,
    )
    lines.push('')
    lines.push(hans || hant ? '**Skill.check**' : '**Skill.check**')
    for (const s of splitSkillSteps(skill.check).slice(0, 5)) lines.push(`• ${s}`)
    lines.push('')
    lines.push(hans || hant ? '**Skill.action**' : '**Skill.action**')
    for (const s of splitSkillSteps(skill.action).slice(0, 4)) lines.push(`• ${s}`)
  }
  if (args.nextSteps.length) {
    lines.push('')
    lines.push(hans ? '**建议仍回到的下一步**' : hant ? '**建議仍回到的下一步**' : '**Suggested next steps**')
    for (const s of args.nextSteps.slice(0, 3)) lines.push(`• ${s}`)
  }
  lines.push('')
  lines.push(
    hans
      ? '_继续贴排查结果即可回到 Skills 路径模式。_'
      : hant
        ? '_繼續貼排查結果即可回到 Skills 路徑模式。_'
        : '_Paste the next finding to return to Skills-path mode._',
  )
  return lines.join('\n')
}

async function enrichWithLlm(args: {
  lang: Lang
  question: string
  context: string
  temperature?: number
}): Promise<string | null> {
  return chatComplete({
    lang: args.lang,
    user: args.question,
    systemExtra: args.context,
    temperature: args.temperature,
  })
}

/** Keep LLM text unless it collapsed into a rigid menu / stub. */
function usableLlmReply(text: string | null | undefined): string | null {
  const t = (text || '').trim()
  if (!t || isStubMenuReply(t)) return null
  return t
}

/**
 * Prefer a real answer: first LLM pass, then one sharper retry.
 * Avoids dropping into chatbotFallbackReply on a single soft miss.
 */
async function answerWithLlmRetry(args: {
  lang: Lang
  question: string
  context: string
  temperature?: number
}): Promise<string | null> {
  const first = usableLlmReply(
    await enrichWithLlm({
      lang: args.lang,
      question: args.question,
      context: args.context,
      temperature: args.temperature,
    }),
  )
  if (first) return first
  const retryCtx = [
    args.context,
    '',
    'RETRY — previous draft was empty or a rigid menu stub.',
    'Answer the user question DIRECTLY in 1–3 short beats.',
    'FORBIDDEN: “I received your message”, three-way menus (chat / market / alert), command checklists.',
    'If unsure, give a best-effort take on their topic, then ask ONE clarifying question about that topic.',
  ].join('\n')
  return usableLlmReply(
    await enrichWithLlm({
      lang: args.lang,
      question: args.question,
      context: retryCtx,
      temperature: Math.min(0.9, (args.temperature ?? 0.6) + 0.15),
    }),
  )
}

async function handleImage(msg: IncomingMessage, lang: Lang): Promise<string> {
  if (!msg.imageKey) {
    if (lang === 'zh-Hans') return '收到图片，但缺少 image_key，还无法解读内容。请再传一次，或贴上图中文字。'
    if (lang === 'zh-Hant') return '收到圖片，但缺少 image_key，還無法解讀內容。請再傳一次，或貼上圖中文字。'
    return 'Got an image, but image_key is missing so I can’t read it yet. Please resend or paste the text.'
  }
  try {
    const buf = await downloadMessageImage(msg.messageId, msg.imageKey)
    const b64 = buf.toString('base64')
    const desc = await describeImage({ lang, imageBase64: b64 })
    if (desc) return desc
    if (lang === 'zh-Hans') {
      return '图片已收到，但视觉解读暂不可用（未配置或无法访问视觉模型）。请补一句图中主题，或贴关键文字。'
    }
    if (lang === 'zh-Hant') {
      return '圖片已收到，但視覺解讀暫不可用（未配置或無法訪問視覺模型）。請補一句圖中主題，或貼關鍵文字。'
    }
    return 'Image received, but vision is unavailable. Add one line on what it shows, or paste key text.'
  } catch (e) {
    const err = e instanceof Error ? e.message : 'unknown'
    if (lang === 'zh-Hans') return `图片已收到，但下载／访问失败（${err}）。也可改贴文字／表格，我先按文字理解。`
    if (lang === 'zh-Hant') return `圖片已收到，但下載／訪問失敗（${err}）。也可改貼文字／表格，我先按文字理解。`
    return `Image received, but download/access failed (${err}). Paste text/table and I’ll work from that.`
  }
}

/** Best-effort read of shared file / doc / card preview — understand before judging relevance. */
async function ingestShareOrFile(msg: IncomingMessage, lang: Lang): Promise<string> {
  const harvested = harvestAttachmentText(msg.rawContent || '', msg.text || '')
  const { token, url, kind } = extractDocUrlOrToken(`${harvested}\n${msg.text || ''}`)
  const lines: string[] = []
  if (harvested) {
    lines.push(
      lang === 'zh-Hans'
        ? '**附件／分享里我能直接看到的信息：**'
        : lang === 'zh-Hant'
          ? '**附件／分享裡我能直接看到的資訊：**'
          : '**What I can see from the share/file card:**',
      harvested.slice(0, 1500),
    )
  }
  if (token && (kind === 'docx' || !kind || kind === 'wiki')) {
    const doc = await readLarkDocByToken({ token, kind })
    if (doc.ok && doc.content) {
      lines.push(
        '',
        lang === 'zh-Hans'
          ? `**文档正文摘要（只读）${doc.title ? ` · ${doc.title}` : ''}：**`
          : lang === 'zh-Hant'
            ? `**文檔正文摘要（唯讀）${doc.title ? ` · ${doc.title}` : ''}：**`
            : `**Document body excerpt (read-only)${doc.title ? ` · ${doc.title}` : ''}:**`,
        doc.content.replace(/\s+/g, ' ').trim().slice(0, 1200),
      )
    } else if (url || token) {
      lines.push(
        '',
        lang === 'zh-Hans'
          ? `文档链接／token 已识别${url ? `（${url}）` : ''}，但正文读取失败或未授权${doc.error ? `：${doc.error}` : '。'}可把要点贴出来；或按知识库「添加文档应用／群成员」给本机器人开通只读。`
          : lang === 'zh-Hant'
            ? `文檔連結／token 已識別${url ? `（${url}）` : ''}，但正文讀取失敗或未授權${doc.error ? `：${doc.error}` : '。'}可把要點貼出來；或依知識庫「新增文件應用／群成員」開通唯讀。`
            : `Doc link/token spotted${url ? ` (${url})` : ''}, but body read failed or unauthorized${doc.error ? `: ${doc.error}` : '.'} Paste key points, or grant this bot Wiki/Docs read (add app / bot group as collaborator).`,
      )
    }
  }
  if (!lines.length) {
    return lang === 'zh-Hans'
      ? '收到附件／分享，但当前消息里几乎没有可解析的预览正文。请发文档链接，或把关键段落贴出来。'
      : lang === 'zh-Hant'
        ? '收到附件／分享，但當前訊息裡幾乎沒有可解析的預覽正文。請發文檔連結，或把關鍵段落貼出來。'
        : 'Got a share/file, but almost no readable preview in this message. Send the doc link or paste key paragraphs.'
  }
  // Optional LLM tighten when key available
  const draft = lines.join('\n')
  const llm = await enrichWithLlm({
    lang,
    question:
      lang === 'zh-Hans'
        ? '请先复述这份附件／分享在讲什么，再简要说明是否像风控／报价／监控相关。不要一上来就说无关。'
        : lang === 'zh-Hant'
          ? '請先複述這份附件／分享在講什麼，再簡要說明是否像風控／報價／監控相關。不要一來就說無關。'
          : 'First restate what this attachment/share is about, then note if it looks risk/pricing/monitoring related. Do not dismiss it up front.',
    context: draft,
    temperature: 0.3,
  })
  return llm ? `${llm}\n\n---\n${draft}` : draft
}

function pushInteraction(
  session: InvestigationState,
  entry: Omit<InvestigationInteraction, 'at'> & { at?: number },
) {
  ensureSessionInteractions(session)
  const text = (entry.text || '').trim()
  if (!text) return
  session.interactions.push({
    at: entry.at || Date.now(),
    role: entry.role,
    kind: entry.kind || 'other',
    text: text.slice(0, 4000),
    messageId: entry.messageId,
  })
  // Cap log size for ephemeral session store
  if (session.interactions.length > 80) {
    session.interactions = session.interactions.slice(-80)
  }
}

function classifyUserInteractionKind(text: string): string {
  const t = text.trim()
  if (isInvReportCommand(t)) return 'report_request'
  if (isStepDoneCommand(t)) return 'step_done'
  if (/^(done|reset|完成|结束排查|結束排查|重置)\b/i.test(t)) return 'command'
  if (looksLikeIncidentEvidence(t) || /\[(forwarded_card|merge_forward|replied_alert)\]/i.test(t)) {
    return 'alert'
  }
  if (looksLikeInvestigationQuestion(t)) return 'question'
  return 'note'
}

function formatInteractionLog(interactions: InvestigationInteraction[], lang: Lang): string {
  if (!interactions.length) {
    return lang === 'en' ? '(no interactions recorded)' : '（尚无互动记录）'
  }
  return interactions
    .map((it, i) => {
      const who =
        it.role === 'user'
          ? lang === 'en'
            ? 'User'
            : '用户'
          : it.role === 'bot'
            ? lang === 'en'
              ? 'Bot'
              : '助手'
            : 'System'
      const when = new Date(it.at).toISOString().replace('T', ' ').slice(0, 19)
      return `${i + 1}. [${when}] ${who}/${it.kind}: ${it.text.replace(/\s+/g, ' ').trim().slice(0, 500)}`
    })
    .join('\n')
}

async function buildProceedInvestigationReport(args: {
  lang: Lang
  session: InvestigationState
  incident?: IncidentRecord
}): Promise<string> {
  const hans = args.lang === 'zh-Hans'
  const hant = args.lang === 'zh-Hant'
  const interactions = ensureSessionInteractions(args.session).interactions
  const facts = args.session.facts.length
    ? args.session.facts
    : args.incident?.facts || []
  const checked = args.session.checkedSteps
  const severity = args.session.lastSeverity || args.incident?.severity || '待判定'
  const skills =
    args.session.lastHits.map((h) => h.id).join(', ') ||
    (args.incident?.skills || []).join(', ') ||
    (hans || hant ? '尚未匹配' : 'none')
  const log = formatInteractionLog(interactions, args.lang)
  const factBlock = facts
    .filter((f) => !f.startsWith('[chat-history]'))
    .map((f, i) => `${i + 1}. ${f.replace(/\s+/g, ' ').trim().slice(0, 400)}`)
    .join('\n')
  const stepBlock = checked.length
    ? checked.map((s, i) => `${i + 1}. ${s}`).join('\n')
    : hans || hant
      ? '（尚未标记完成步骤）'
      : '(no steps marked done)'

  const llm = await enrichWithLlm({
    lang: args.lang,
    question: hans
      ? '根据完整互动日志写一份「排查过程报告」。必须含：1) 时间线摘要 2) 摄入告警／证据 3) 已完成步骤 4) 当前判断与未决问题 5) 建议下一步。只依据给定日志，勿编造未出现的菜单／字段／结论。用简体中文，emoji 小标题。'
      : hant
        ? '根據完整互動日誌寫一份「排查過程報告」。必須含：時間線摘要、攝入告警／證據、已完成步驟、當前判斷與未決問題、建議下一步。只依據日誌，勿編造。用繁體中文。'
        : 'Write a proceed-based investigation report from the interaction log. Include: timeline, alerts/evidence, completed steps, current judgment & open questions, recommended next steps. Use only the log — do not invent. English, emoji section headers.',
    context: [
      `SEVERITY=${severity}`,
      `SKILLS=${skills}`,
      `FACTS:\n${factBlock || '(none)'}`,
      `CHECKED_STEPS:\n${stepBlock}`,
      `INTERACTION_LOG:\n${log}`,
    ].join('\n\n'),
    temperature: 0.2,
  })

  if (llm) return llm

  // Deterministic fallback when LLM unavailable
  const verdict =
    args.incident?.riskVerdict != null
      ? `${riskVerdictEmoji(args.incident.riskVerdict)} ${riskVerdictLabel(args.incident.riskVerdict, args.lang)}`
      : hans || hant
        ? '⚪ 未判定（请在排查卡点「有风险／无风险」）'
        : '⚪ Unset (tap At risk / No risk on the investigation card)'
  if (hans) {
    return [
      '📋 **排查过程报告**（基于本会话互动记录）',
      '',
      `🟠 **当前严重度：** **${severity}**`,
      `⚖️ **最终判定：** **${verdict}**`,
      `• **命中 Skills：** ${skills}`,
      '',
      '🕒 **互动时间线**',
      log,
      '',
      '📥 **摄入告警／证据**',
      factBlock || '（无）',
      '',
      '✅ **已完成步骤**',
      stepBlock,
      '',
      '🧭 **说明：** 完整过程已按上方日志归档；继续贴告警或发 **step done** 可刷新排查卡。归档前请完成最终判定，计入复盘与周报。',
    ].join('\n')
  }
  if (hant) {
    return [
      '📋 **排查過程報告**（基於本會話互動記錄）',
      '',
      `🟠 **當前嚴重度：** **${severity}**`,
      `⚖️ **最終判定：** **${verdict}**`,
      `• **命中 Skills：** ${skills}`,
      '',
      '🕒 **互動時間線**',
      log,
      '',
      '📥 **攝入告警／證據**',
      factBlock || '（無）',
      '',
      '✅ **已完成步驟**',
      stepBlock,
    ].join('\n')
  }
  return [
    '📋 **Proceed-based investigation report** (from this case’s interaction log)',
    '',
    `🟠 **Severity:** **${severity}**`,
    `⚖️ **Final verdict:** **${verdict}**`,
    `• **Skills:** ${skills}`,
    '',
    '🕒 **Interaction timeline**',
    log,
    '',
    '📥 **Alerts / evidence**',
    factBlock || '(none)',
    '',
    '✅ **Completed steps**',
    stepBlock,
  ].join('\n')
}

async function replyProceedInvestigationReport(args: {
  session: InvestigationState
  lang: Lang
  chatId: string
  openId: string
  messageId: string
}): Promise<BotReply> {
  const { session, lang } = args
  const priorInteractions = ensureSessionInteractions(session).interactions.filter(
    (i) => i.kind !== 'report_request' && i.kind !== 'report',
  )
  const hasCase =
    session.mode === 'investigate' ||
    Boolean(session.lastReportId) ||
    session.facts.some((f) => !f.startsWith('[chat-history]')) ||
    priorInteractions.length > 0
  if (!hasCase) {
    const title =
      lang === 'zh-Hans' ? '排查过程报告' : lang === 'zh-Hant' ? '排查過程報告' : 'Investigation report'
    const body =
      lang === 'zh-Hans'
        ? '当前没有进行中的排查会话。请先贴告警或发 **investigate**，互动会被记录；完成几轮后再发 **生成排查报告**。'
        : lang === 'zh-Hant'
          ? '當前沒有進行中的排查會話。請先貼告警或發 **investigate**，互動會被記錄；完成幾輪後再發 **生成排查報告**。'
          : 'No active investigation case yet. Paste an alert or send **investigate** first — turns are logged; then send **generate investigation report**.'
    return { card: simpleCard(title, body, 'wathet') }
  }
  const incident = session.lastReportId ? await getIncidentDurable(session.lastReportId) : undefined
  const reportMd = await buildProceedInvestigationReport({ lang, session, incident })
  pushInteraction(session, {
    role: 'bot',
    kind: 'report',
    text: reportMd.slice(0, 2000),
    messageId: args.messageId,
  })
  if (session.lastReportId && incident) {
    incident.interactions = ensureSessionInteractions(session).interactions.slice(-80)
    incident.summary = reportMd.slice(0, 1200)
    incident.updatedAt = Date.now()
    await upsertIncidentDurable(incident)
  }
  session.mode = 'report_draft'
  session.lastReportMarkdown = reportMd
  await saveSessionDurable(args.chatId, args.openId, session)
  const title =
    lang === 'zh-Hans'
      ? '排查过程报告'
      : lang === 'zh-Hant'
        ? '排查過程報告'
        : 'Proceed-based investigation report'
  return {
    card: investigationReportDraftCard({
      lang,
      title,
      body: reportMd,
      incidentId: session.lastReportId || '',
      riskVerdict: incident?.riskVerdict,
    }),
  }
}

function reviewDoneBanner(lang: Lang): string {
  if (lang === 'zh-Hans') {
    return [
      '✅ **已归档并完成复盘**',
      '本案件已写入复盘看板（含最终风险判定统计）。下方是当前看板；也可随时发 **review** 再看。',
    ].join('\n')
  }
  if (lang === 'zh-Hant') {
    return [
      '✅ **已歸檔並完成複盤**',
      '本案件已寫入複盤看板（含最終風險判定統計）。下方是當前看板；也可隨時發 **review** 再看。',
    ].join('\n')
  }
  return [
    '✅ **Archived — review complete**',
    'This case is on the review board (incl. risk-verdict stats). Board below; send **review** anytime.',
  ].join('\n')
}

/**
 * Mid-exit / no formal archive after report → still record as investigated,
 * classified 无风险 (no_risk). Idempotent if already archived.
 */
async function closeIncidentAsInvestigatedNoRisk(args: {
  incidentId?: string
  openId?: string
  reason?: string
}): Promise<boolean> {
  const id = (args.incidentId || '').trim()
  if (!id) return false
  const inc = await getIncidentDurable(id)
  if (!inc || inc.status === 'archived') return false
  inc.status = 'archived'
  inc.riskVerdict = 'no_risk'
  inc.riskVerdictAt = Date.now()
  inc.riskVerdictBy = args.openId ? `${args.openId}:auto_exit` : 'auto_exit'
  const note = (args.reason || 'mid-exit / no archive → investigated · no_risk').slice(0, 200)
  const marker =
    inc.lang === 'zh-Hans'
      ? `\n\n_[系统] 未正式归档（${note}）→ 记为排查过 · **无风险**_`
      : inc.lang === 'zh-Hant'
        ? `\n\n_[系統] 未正式歸檔（${note}）→ 記為排查過 · **無風險**_`
        : `\n\n_[system] No formal archive (${note}) → investigated · **no risk**_`
  inc.summary = `${(inc.summary || '').trim()}${marker}`.slice(0, 1400)
  inc.updatedAt = Date.now()
  await upsertIncidentDurable(inc)
  return true
}

/** Report + Archive: keep user ruling (有风险 / 无风险). Prompt if missing. */
async function archiveIncidentAndShowReview(args: {
  lang: Lang
  chatId: string
  openId: string
  incidentId: string
}): Promise<BotReply> {
  const inc = await getIncidentDurable(args.incidentId)
  // Formal archive after report must be classified 有风险 or 无风险 (not unclear/unset).
  if (inc && inc.riskVerdict !== 'at_risk' && inc.riskVerdict !== 'no_risk') {
    return {
      card: riskVerdictPromptCard({
        lang: args.lang,
        incidentId: args.incidentId,
        title: inc.title,
        thenArchive: true,
      }),
    }
  }
  if (inc) {
    inc.status = 'archived'
    inc.updatedAt = Date.now()
    await upsertIncidentDurable(inc)
  }
  await clearSessionDurable(args.chatId, args.openId)
  const incidents = await listIncidentsDurable({ limit: 50 })
  return {
    card: reviewCard({
      lang: args.lang,
      incidents,
      doneBanner: reviewDoneBanner(args.lang),
    }),
  }
}

async function reviseReportDraft(args: {
  session: InvestigationState
  lang: Lang
  chatId: string
  openId: string
  messageId: string
  instruction: string
}): Promise<BotReply> {
  const { session, lang } = args
  const current = (session.lastReportMarkdown || '').trim()
  if (!current) {
    return replyProceedInvestigationReport({
      session,
      lang,
      chatId: args.chatId,
      openId: args.openId,
      messageId: args.messageId,
    })
  }
  pushInteraction(session, {
    role: 'user',
    kind: 'note',
    text: args.instruction.slice(0, 800),
    messageId: args.messageId,
  })
  const revised =
    (await enrichWithLlm({
      lang,
      question:
        lang === 'zh-Hans'
          ? '按用户修改意见改写排查报告全文。保留原有结构与事实，勿编造未出现的菜单／字段。输出完整报告 markdown。'
          : lang === 'zh-Hant'
            ? '按用戶修改意見改寫排查報告全文。保留結構與事實，勿編造。輸出完整報告 markdown。'
            : 'Revise the full investigation report per the user instruction. Keep structure and facts; do not invent. Output the full report markdown.',
      context: [`CURRENT_REPORT:\n${current.slice(0, 8000)}`, `USER_EDIT:\n${args.instruction.slice(0, 1500)}`].join(
        '\n\n',
      ),
      temperature: 0.2,
    })) || `${current}\n\n---\n\n✏️ **${lang === 'en' ? 'Edit note' : '修改说明'}：** ${args.instruction.slice(0, 500)}`
  session.lastReportMarkdown = revised
  session.mode = 'report_draft'
  pushInteraction(session, {
    role: 'bot',
    kind: 'report',
    text: revised.slice(0, 2000),
    messageId: args.messageId,
  })
  if (session.lastReportId) {
    const inc = await getIncidentDurable(session.lastReportId)
    if (inc) {
      inc.summary = revised.slice(0, 1200)
      inc.interactions = ensureSessionInteractions(session).interactions.slice(-80)
      inc.updatedAt = Date.now()
      await upsertIncidentDurable(inc)
    }
  }
  await saveSessionDurable(args.chatId, args.openId, session)
  const title =
    lang === 'zh-Hans'
      ? '排查过程报告（已按你的意见更新）'
      : lang === 'zh-Hant'
        ? '排查過程報告（已按你的意見更新）'
        : 'Investigation report (updated)'
  const inc = session.lastReportId ? await getIncidentDurable(session.lastReportId) : undefined
  return {
    card: investigationReportDraftCard({
      lang,
      title,
      body: revised,
      incidentId: session.lastReportId || '',
      riskVerdict: inc?.riskVerdict,
    }),
  }
}

async function persistOpenIncident(args: {
  chatId: string
  openId: string
  lang: Lang
  facts: string[]
  severity: string
  hits: { id: string; name: string }[]
  kb: { title: string }[]
  summary: string
  recommendations: string[]
  interactions?: InvestigationInteraction[]
  existingId?: string
}): IncidentRecord {
  const id = args.existingId || newIncidentId()
  const prev = args.existingId ? await getIncidentDurable(args.existingId) : undefined
  const rec: IncidentRecord = {
    id,
    chatId: args.chatId,
    openId: args.openId,
    title: titleFromFacts(args.facts, args.lang),
    facts: args.facts,
    severity: args.severity,
    skills: args.hits.map((h) => `${h.id} · ${h.name}`),
    knowledge: args.kb.map((k) => k.title),
    summary: args.summary,
    recommendations: args.recommendations,
    interactions: args.interactions?.length
      ? args.interactions.slice(-80)
      : prev?.interactions,
    riskVerdict: prev?.riskVerdict,
    riskVerdictAt: prev?.riskVerdictAt,
    riskVerdictBy: prev?.riskVerdictBy,
    status: prev?.status === 'archived' ? 'archived' : 'open',
    createdAt: prev?.createdAt || Date.now(),
    updatedAt: Date.now(),
    lang: args.lang,
  }
  await upsertIncidentDurable(rec)
  return rec
}

async function handleWikiAsk(lang: Lang, text: string, openId: string): Promise<BotReply> {
  const extracted = extractWikiQuery(text)
  const bareDocsCmd = /^(文档|文檔|wiki|飞书文档|飛書文檔|百科)$/i.test(text.trim())
  const query = (extracted || (bareDocsCmd ? '' : text.trim())).slice(0, 120)
  const title =
    lang === 'zh-Hans' ? '飞书 Wiki / 文档' : lang === 'zh-Hant' ? '飛書 Wiki / 文檔' : 'Lark Wiki / Docs'

  // Bare「文档」— show accessible spaces + how to search / paste links (no fake hits).
  if (!query) {
    const listed = await listWikiSpaces(20)
    logInbound({
      at: new Date().toISOString(),
      kind: 'wiki_list',
      openId,
      result: listed.ok ? `spaces:${listed.spaces.length}` : `fail:${listed.error || 'unknown'}`,
    })
    const setup = wikiAccessSetupHint(lang)
    if (!listed.ok || !listed.spaces.length) {
      return {
        card: simpleCard(
          title,
          accessUnavailableReply(
            lang,
            lang === 'zh-Hans'
              ? `当前机器人还看不到任何知识空间（${listed.error || 'spaces empty'}）。\n\n${setup}`
              : lang === 'zh-Hant'
                ? `目前機器人還看不到任何知識空間（${listed.error || 'spaces empty'}）。\n\n${setup}`
                : `This bot cannot see any Wiki spaces yet (${listed.error || 'spaces empty'}).\n\n${setup}`,
          ),
          'orange',
        ),
      }
    }
    const lines =
      lang === 'zh-Hans'
        ? [
            '📚 **已授权知识空间（只读）**',
            '',
            ...listed.spaces.slice(0, 12).map((s) => `• **${s.name}** · \`${s.spaceId}\``),
            '',
            '发送关键词继续检索，例如：`文档 Mark Price`；或直接贴文档链接。',
          ]
        : lang === 'zh-Hant'
          ? [
              '📚 **已授權知識空間（唯讀）**',
              '',
              ...listed.spaces.slice(0, 12).map((s) => `• **${s.name}** · \`${s.spaceId}\``),
              '',
              '傳送關鍵詞繼續檢索，例如：`文檔 Mark Price`；或直接貼文件連結。',
            ]
          : [
              '📚 **Authorized Wiki spaces (read-only)**',
              '',
              ...listed.spaces.slice(0, 12).map((s) => `• **${s.name}** · \`${s.spaceId}\``),
              '',
              'Send a keyword next (e.g. `wiki Mark Price`), or paste a doc link.',
            ]
    return { card: simpleCard(title, lines.join('\n'), 'blue') }
  }

  const searched = await searchLarkWiki(query, 5)
  logInbound({
    at: new Date().toISOString(),
    kind: 'wiki_search',
    openId,
    textPreview: query.slice(0, 80),
    result: searched.ok ? `hits:${searched.hits.length}` : `fail:${searched.error || 'unknown'}`,
  })

  if (!searched.ok) {
    const setup = wikiAccessSetupHint(lang)
    return {
      card: simpleCard(
        title,
        accessUnavailableReply(
          lang,
          lang === 'zh-Hans'
            ? `飞书 Wiki／文档读取未授权或不可用（${searched.error || 'scope/凭证'}）。\n\n${setup}`
            : lang === 'zh-Hant'
              ? `飛書 Wiki／文檔讀取未授權或不可用（${searched.error || 'scope/憑證'}）。\n\n${setup}`
              : `Lark Wiki/Docs read is unauthorized or unavailable (${searched.error || 'scope/credentials'}).\n\n${setup}`,
        ),
        'orange',
      ),
    }
  }

  if (!searched.hits.length) {
    const setup =
      searched.hint === 'wiki_membership' || !(searched.spaceIds || []).length
        ? `\n\n${wikiAccessSetupHint(lang)}`
        : ''
    const empty =
      lang === 'zh-Hans'
        ? [
            '📚 **Wiki 检索**',
            '',
            `• **查询：** ${query}`,
            '• **结果：** 未找到授权范围内的页面',
            '• **提示：** 换关键词再试，或直接贴文档链接',
            setup,
          ]
            .filter(Boolean)
            .join('\n')
        : lang === 'zh-Hant'
          ? [
              '📚 **Wiki 檢索**',
              '',
              `• **查詢：** ${query}`,
              '• **結果：** 未找到授權範圍內的頁面',
              '• **提示：** 換關鍵詞再試，或直接貼文件連結',
              setup,
            ]
              .filter(Boolean)
              .join('\n')
          : [
              '📚 **Wiki search**',
              '',
              `• **Query:** ${query}`,
              '• **Result:** no pages in the authorized scope',
              '• **Tip:** try other keywords, or paste a doc link',
              setup,
            ]
              .filter(Boolean)
              .join('\n')
    return { card: simpleCard(title, empty, 'blue') }
  }

  const lines: string[] = []
  if (lang === 'zh-Hans') {
    lines.push('📚 **授权 Wiki／文档（只读）**', '', `• **查询：** ${query}`, '')
  } else if (lang === 'zh-Hant') {
    lines.push('📚 **授權 Wiki／文檔（唯讀）**', '', `• **查詢：** ${query}`, '')
  } else {
    lines.push('📚 **Authorized Wiki/Docs (read-only)**', '', `• **Query:** ${query}`, '')
  }

  for (const hit of searched.hits.slice(0, 5)) {
    lines.push(`• **${hit.title}**`)
    if (hit.snippet) lines.push(`  ${hit.snippet.replace(/\s+/g, ' ').slice(0, 180)}`)
    if (hit.url) lines.push(`  ${hit.url}`)
  }

  // Best-effort: expand first docx body (still read-only)
  const first = searched.hits[0]
  if (first?.objToken) {
    const raw = await readDocxRaw(first.objToken)
    logInbound({
      at: new Date().toISOString(),
      kind: 'wiki_docx',
      openId,
      textPreview: first.objToken.slice(0, 40),
      result: raw.ok ? `chars:${raw.content.length}` : `fail:${raw.error || 'unknown'}`,
    })
    if (raw.ok && raw.content) {
      const excerpt = raw.content.replace(/\s+/g, ' ').trim().slice(0, 900)
      if (lang === 'zh-Hans') lines.push('', '---', '', `📄 **摘录（${first.title}）**`, '', excerpt)
      else if (lang === 'zh-Hant') lines.push('', '---', '', `📄 **摘錄（${first.title}）**`, '', excerpt)
      else lines.push('', '---', '', `📄 **Excerpt (${first.title})**`, '', excerpt)
    }
  }

  lines.push(
    '',
    lang === 'zh-Hans'
      ? '_未授权的 Wiki／群组不会被访问；凭证与操作可审计。_'
      : lang === 'zh-Hant'
        ? '_未授權的 Wiki／群組不會被訪問；憑證與操作可審計。_'
        : '_Unauthorized Wiki/chats are not accessed; credentials and actions are auditable._',
  )
  return { card: simpleCard(title, lines.join('\n'), 'blue') }
}

function mergeGuideSteps(
  planned: ReturnType<typeof planInvestigationPath>['fullSteps'],
  previous?: GuideStep[],
): GuideStep[] {
  const prevById = new Map((previous || []).map((s) => [s.id, s]))
  return planned.map((p) => {
    const prev = prevById.get(p.id)
    let status: GuideStep['status'] = prev?.status || 'pending'
    if (p.covered && status === 'pending') status = 'done'
    return {
      id: p.id,
      skillId: p.skillId,
      label: p.label,
      raw: p.raw,
      required: p.required,
      status,
    }
  })
}

function firstPendingGuideIndex(steps: GuideStep[], preferIds?: string[]): number {
  if (preferIds?.length) {
    for (const id of preferIds) {
      const i = steps.findIndex((s) => s.id === id && s.status === 'pending')
      if (i >= 0) return i
    }
  }
  const i = steps.findIndex((s) => s.status === 'pending')
  return i
}

function decisionBranchesForStep(
  session: InvestigationState,
  skillId?: string,
): string[] {
  const hit =
    (skillId && session.lastHits.find((h) => h.id === skillId)) || session.lastHits[0]
  const action =
    hit?.action ||
    (skillId ? loadSkills().find((s) => s.id === skillId)?.action : '') ||
    ''
  const atoms = splitSkillSteps(action)
  return (atoms.length ? atoms : action ? [action] : []).map((s) => s.trim()).filter(Boolean)
}

function guideStepReply(args: {
  lang: Lang
  session: InvestigationState
  incidentId?: string
  includeOverview: boolean
  title: string
  severity: string
  summary: string
  actions: string[]
  skills: string[]
  knowledge: string[]
  riskVerdict?: IncidentRecord['riskVerdict']
  showAddAlertHint?: boolean
}): BotReply {
  const steps = args.session.pathSteps || []
  const idx = args.session.pathStepIndex ?? firstPendingGuideIndex(steps)
  const overviewBranches = decisionBranchesForStep(
    args.session,
    steps[idx >= 0 ? idx : 0]?.skillId || args.session.lastHits[0]?.id,
  )
  // Clear “总览” header (not the mid-case step title) — analysis first, then step card.
  const overviewTitle =
    args.lang === 'zh-Hans'
      ? `排查总览 · ${args.title.replace(/^排查进行中\s*·\s*/i, '')}`
      : args.lang === 'zh-Hant'
        ? `排查總覽 · ${args.title.replace(/^排查進行中\s*·\s*/i, '')}`
        : `Investigation overview · ${args.title.replace(/^Investigation\s*·\s*/i, '')}`
  const overview = investigationPathOverviewCard({
    lang: args.lang,
    title: overviewTitle,
    severity: args.severity,
    summary: args.summary,
    steps,
    actions: args.actions,
    decisionBranches: overviewBranches,
    skills: args.skills,
    knowledge: args.knowledge,
    incidentId: args.incidentId,
    riskVerdict: args.riskVerdict,
    showAddAlertHint: args.showAddAlertHint,
    nextStepNumber: idx >= 0 ? idx + 1 : 1,
  })

  if (!steps.length || idx < 0) {
    const recommended = suggestRiskVerdict(args.severity)
    const complete = investigationGuideCompleteCard({
      lang: args.lang,
      incidentId: args.incidentId,
      recommendedVerdict: recommended,
      recommendReason:
        args.lang === 'zh-Hans'
          ? `综合已收集告警／步骤证据与严重度 **${args.severity}**`
          : args.lang === 'zh-Hant'
            ? `綜合已收集告警／步驟證據與嚴重度 **${args.severity}**`
            : `From collected alerts / step evidence and severity **${args.severity}**`,
    })
    if (args.includeOverview) {
      return { card: overview, followUpCards: [complete] }
    }
    return { card: complete }
  }

  const step = steps[idx]!
  const skillAction =
    args.session.lastHits.find((h) => h.id === step.skillId)?.action ||
    loadSkills().find((s) => s.id === step.skillId)?.action ||
    ''
  const escalateRoles = escalateRolesForStep(step, skillAction)
  const stepCard = investigationStepGuideCard({
    lang: args.lang,
    step,
    stepIndex: idx,
    totalSteps: steps.length,
    incidentId: args.incidentId,
    escalateRoles,
    decisionBranches: decisionBranchesForStep(args.session, step.skillId),
  })
  if (args.includeOverview) {
    return { card: overview, followUpCards: [stepCard] }
  }
  return { card: stepCard }
}

/** Summarize what the operator pasted and how it helps the current step. */
function describeSupplementHelp(args: {
  lang: Lang
  step: GuideStep
  text: string
  facts: string[]
}): { submittedSummary: string; helpSummary: string } {
  const raw = args.text.trim().replace(/\s+/g, ' ')
  const preview = raw.length > 280 ? `${raw.slice(0, 277)}…` : raw
  const submittedSummary = preview ? `> ${preview}` : '_(empty)_'
  const covers = evidenceCoversStep(args.step.label, args.text)
  const hasNum = /\d+(\.\d+)?\s*(bps|bp|%|ms|s|秒)?/i.test(args.text)
  const hasShot = /截图|截圖|screenshot|image|图示|圖示/i.test(args.text)
  const hasPeer = /友商|binance|okx|bybit|peer/i.test(args.text)
  const hasFront = /前端|index|mark|k线|k線/i.test(args.text)
  const helps: string[] = []
  if (args.lang === 'zh-Hans') {
    if (covers) helps.push(`• 与当前步骤「${args.step.label}」高度相关，可直接支撑本步核对。`)
    else helps.push(`• 已记入本案证据池，供后续步骤与报告引用（尚未完整覆盖「${args.step.label}」）。`)
    if (hasNum) helps.push('• 含具体数值／阈值类线索，便于对照告警阈值与偏差幅度。')
    if (hasShot) helps.push('• 含截图／画面说明，便于复盘时核对当时盘口或系统状态。')
    if (hasPeer) helps.push('• 含友商／外部源线索，有助于交叉验证是否为单源异常。')
    if (hasFront) helps.push('• 含前端 Index/Mark／K 线线索，有助于判断展示层与计价源是否一致。')
    helps.push(`• 本案现有证据条数：**${args.facts.length + 1}**（含本条）。`)
  } else if (args.lang === 'zh-Hant') {
    if (covers) helps.push(`• 與當前步驟「${args.step.label}」高度相關，可直接支撐本步核對。`)
    else helps.push(`• 已記入本案證據池，供後續步驟與報告引用（尚未完整覆蓋「${args.step.label}」）。`)
    if (hasNum) helps.push('• 含具體數值／閾值類線索，便於對照告警閾值與偏差幅度。')
    if (hasShot) helps.push('• 含截圖／畫面說明，便於複盤時核對當時盤口或系統狀態。')
    if (hasPeer) helps.push('• 含友商／外部源線索，有助於交叉驗證是否為單源異常。')
    if (hasFront) helps.push('• 含前端 Index/Mark／K 線線索，有助於判斷展示層與計價源是否一致。')
    helps.push(`• 本案現有證據條數：**${args.facts.length + 1}**（含本條）。`)
  } else {
    if (covers) helps.push(`• Strongly matches current step “${args.step.label}” — can support this check.`)
    else
      helps.push(
        `• Logged into the case evidence pool for later steps/report (doesn’t fully cover “${args.step.label}” yet).`,
      )
    if (hasNum) helps.push('• Includes numeric / threshold cues for comparing alert levels and deviation size.')
    if (hasShot) helps.push('• Includes screenshot / visual notes for reconstructing desk state.')
    if (hasPeer) helps.push('• Mentions peer / external sources — useful to check single-source failure.')
    if (hasFront) helps.push('• Mentions frontend Index/Mark/K-line — useful for display vs pricing checks.')
    helps.push(`• Case evidence count now: **${args.facts.length + 1}** (including this).`)
  }
  return { submittedSummary, helpSummary: helps.join('\n') }
}

async function ingestSupplementEvidence(args: {
  msg: IncomingMessage
  lang: Lang
  session: InvestigationState
  text: string
}): Promise<BotReply> {
  const session = args.session
  const steps = session.pathSteps || []
  const idx = session.pathStepIndex ?? firstPendingGuideIndex(steps)
  const step = idx >= 0 ? steps[idx] : undefined
  const fact = args.text.trim()
  if (!fact || !step) {
    return {
      card: investigationSupplementPromptCard({
        lang: args.lang,
        step: step || {
          id: 'unknown',
          skillId: '',
          label: session.pendingPrompt || '—',
          raw: '',
          required: true,
          status: 'pending',
        },
        stepIndex: Math.max(0, idx),
        totalSteps: Math.max(1, steps.length),
      }),
    }
  }

  session.facts.push(fact)
  pushInteraction(session, {
    role: 'user',
    kind: 'evidence',
    text: `supplement:${fact.slice(0, 2000)}`,
    messageId: args.msg.messageId,
  })
  session.stepAwaiting = 'none'
  session.pendingPrompt = step.label
  await saveSessionDurable(args.msg.chatId, args.msg.openId, session)

  // Keep incident facts in sync when a case id exists.
  if (session.lastReportId) {
    const inc = await getIncidentDurable(session.lastReportId)
    if (inc) {
      inc.facts = [...session.facts]
      inc.interactions = session.interactions
      inc.updatedAt = Date.now()
      await upsertIncidentDurable(inc)
    }
  }

  const { submittedSummary, helpSummary } = describeSupplementHelp({
    lang: args.lang,
    step,
    text: fact,
    facts: session.facts.slice(0, -1),
  })
  const skillAction =
    session.lastHits.find((h) => h.id === step.skillId)?.action ||
    loadSkills().find((s) => s.id === step.skillId)?.action ||
    ''
  return {
    card: investigationSupplementAckCard({
      lang: args.lang,
      step,
      stepIndex: idx,
      totalSteps: steps.length,
      submittedSummary,
      helpSummary,
      incidentId: session.lastReportId,
      escalateRoles: escalateRolesForStep(step, skillAction),
      decisionBranches: decisionBranchesForStep(session, step.skillId),
    }),
  }
}

async function advanceGuideAfterUserInput(args: {
  msg: IncomingMessage
  lang: Lang
  session: InvestigationState
  text: string
  kind: 'evidence' | 'required_skip_reply' | 'escalate_feedback'
}): Promise<BotReply> {
  const session = args.session
  const steps = session.pathSteps || []
  const idx = session.pathStepIndex ?? firstPendingGuideIndex(steps)
  const step = idx >= 0 ? steps[idx] : undefined
  const fact = args.text.trim()
  if (!fact) {
    const caseId = session.lastReportId || ''
    if (args.kind === 'evidence' && step) {
      return {
        card: investigationEvidencePromptCard({
          lang: args.lang,
          step,
          stepIndex: idx,
          totalSteps: steps.length,
          incidentId: caseId,
        }),
      }
    }
    if (args.kind === 'escalate_feedback' && step) {
      return {
        card: investigationEscalatedWaitingCard({
          lang: args.lang,
          step,
          stepIndex: idx,
          totalSteps: steps.length,
          roles: session.escalation?.roles || ['RC'],
          notifiedCount: session.escalation?.openIds?.length || 0,
          incidentId: caseId,
        }),
      }
    }
    if (step) {
      return {
        card: investigationRequiredSkipPromptCard({
          lang: args.lang,
          step,
          stepIndex: idx,
          totalSteps: steps.length,
          incidentId: caseId,
        }),
      }
    }
  }

  if (step) {
    step.status =
      args.kind === 'required_skip_reply' ? 'skipped' : 'done'
    if (!session.checkedSteps.some((s) => s.toLowerCase() === step.label.toLowerCase())) {
      session.checkedSteps.push(step.label)
    }
  }
  session.stepAwaiting = 'none'
  session.escalation = undefined
  pushInteraction(session, {
    role: 'user',
    kind:
      args.kind === 'evidence'
        ? 'evidence'
        : args.kind === 'escalate_feedback'
          ? 'escalate_feedback'
          : 'step_skip',
    text:
      args.kind === 'escalate_feedback'
        ? `escalate_feedback:${fact}`
        : fact,
    messageId: args.msg.messageId,
  })
  await clearEscalationsForOperator(args.msg.chatId, args.msg.openId)
  await saveSessionDurable(args.msg.chatId, args.msg.openId, session)

  const newFact =
    args.kind === 'escalate_feedback'
      ? args.lang === 'zh-Hans'
        ? `升级反馈：${fact}`
        : args.lang === 'zh-Hant'
          ? `升級反饋：${fact}`
          : `Escalate feedback: ${fact}`
      : fact

  // Re-run investigation with the evidence/reply so coverage + incident stay in sync.
  return runInvestigation({
    msg: args.msg,
    lang: args.lang,
    newFact,
    markStepDone: args.kind !== 'required_skip_reply',
    guideAdvanceOnly: true,
  })
}

/** Escalatee replied in their own DM — fold feedback into the operator's case. */
async function ingestEscalateeFeedback(args: {
  escalateeOpenId: string
  escalateeChatId: string
  messageId: string
  text: string
}): Promise<BotReply | null> {
  const pending = await getEscalationPending(args.escalateeOpenId)
  if (!pending) return null
  const fact = args.text.trim()
  if (!fact) {
    return {
      card: simpleCard(
        pending.lang === 'en' ? 'Need feedback' : '请补充反馈',
        pending.lang === 'en'
          ? 'Reply with your conclusion for the escalated step.'
          : '请直接回复你对本步的结论／反馈。',
        'wathet',
      ),
    }
  }
  const opSession = await getSessionDurable(
    pending.operatorChatId,
    pending.operatorOpenId,
  )
  const lang = opSession.preferredLang || pending.lang || 'zh-Hans'
  let escalateeName = ''
  try {
    escalateeName = (await fetchUserDisplayName(args.escalateeOpenId)) || ''
  } catch {
    escalateeName = ''
  }
  const labeled =
    lang === 'zh-Hans'
      ? `【${pending.roles.join('/') || '升级'}反馈 · ${escalateeName || '同事'}】${fact}`
      : lang === 'zh-Hant'
        ? `【${pending.roles.join('/') || '升級'}反饋 · ${escalateeName || '同事'}】${fact}`
        : `[${pending.roles.join('/') || 'escalate'} feedback · ${escalateeName || 'peer'}] ${fact}`

  // Advance operator case as if they pasted the feedback.
  const fakeMsg: IncomingMessage = {
    messageId: args.messageId,
    chatId: pending.operatorChatId,
    chatType: 'p2p',
    openId: pending.operatorOpenId,
    messageType: 'text',
    text: labeled,
    mentionedBot: true,
    rawContent: labeled,
  }
  if (opSession.mode === 'investigate') {
    opSession.pathStepIndex =
      opSession.pathSteps?.findIndex((s) => s.id === pending.stepId) ??
      opSession.pathStepIndex
    opSession.stepAwaiting = 'escalate_feedback'
    await saveSessionDurable(pending.operatorChatId, pending.operatorOpenId, opSession)
    const advanced = await advanceGuideAfterUserInput({
      msg: fakeMsg,
      lang,
      session: opSession,
      text: labeled,
      kind: 'escalate_feedback',
    })
    // Notify operator that feedback arrived.
    try {
      const { sendCardToOpenId, sendCardToChat } = await import('./client.js')
      const note = simpleCard(
        lang === 'zh-Hans'
          ? '收到升级反馈'
          : lang === 'zh-Hant'
            ? '收到升級反饋'
            : 'Escalate feedback received',
        labeled.slice(0, 1800),
        'green',
      )
      if (pending.operatorChatId.startsWith('oc_')) {
        await sendCardToChat(pending.operatorChatId, note)
      } else if (pending.operatorOpenId.startsWith('ou_')) {
        await sendCardToOpenId(pending.operatorOpenId, note)
      }
      void advanced
    } catch {
      /* best-effort */
    }
  } else {
    pushInteraction(opSession, {
      role: 'user',
      kind: 'escalate_feedback',
      text: labeled,
      messageId: args.messageId,
    })
    await saveSessionDurable(pending.operatorChatId, pending.operatorOpenId, opSession)
    await clearEscalationPending(args.escalateeOpenId)
  }

  await clearEscalationPending(args.escalateeOpenId)
  return {
    card: simpleCard(
      pending.lang === 'en' ? 'Feedback sent' : '反馈已回传',
      pending.lang === 'en'
        ? 'Thanks — your reply was logged on the investigation timeline and sent to the operator.'
        : '已记入排查时间线并通知升级方。谢谢。',
      'green',
    ),
  }
}

/** Normalize alert text for gather dedupe (same paste / webhook retry). */
function normalizeGatherFact(text: string): string {
  return text.trim().replace(/\s+/g, ' ')
}

async function replyAlertGather(args: {
  msg: IncomingMessage
  lang: Lang
  session: InvestigationState
  newFact: string
  /** Starting a brand-new case — close any abandoned open incident as 无风险. */
  freshCase?: boolean
}): Promise<BotReply | null> {
  if (args.freshCase && args.session.lastReportId) {
    await closeIncidentAsInvestigatedNoRisk({
      incidentId: args.session.lastReportId,
      openId: args.msg.openId,
      reason: 'new_alert_gather',
    })
    args.session.lastReportId = undefined
    args.session.lastReportMarkdown = undefined
    args.session.facts = args.session.facts.filter((f) => f.startsWith('[chat-history]'))
    args.session.interactions = []
    args.session.checkedSteps = []
  }
  const fact = args.newFact.trim()
  const mid = (args.msg.messageId || '').trim()
  if (fact) {
    ensureSessionInteractions(args.session)
    // Same Feishu message redelivered → do not append or send another gather card.
    if (mid && args.session.interactions.some((i) => i.messageId === mid && i.kind === 'evidence')) {
      return null
    }
    const norm = normalizeGatherFact(fact)
    const already = args.session.facts.some(
      (f) => !f.startsWith('[chat-history]') && normalizeGatherFact(f) === norm,
    )
    // Identical alert body already gathered (retry / double paste) → silent skip.
    if (already) return null
    args.session.facts.push(fact)
    pushInteraction(args.session, {
      role: 'user',
      kind: 'evidence',
      text: fact.slice(0, 2000),
      messageId: args.msg.messageId,
    })
  }
  args.session.mode = 'gather_alerts'
  args.session.preferredLang = args.lang
  args.session.pathSteps = undefined
  args.session.pathStepIndex = undefined
  args.session.checkedSteps = []
  args.session.stepAwaiting = 'none'
  args.session.pendingPrompt = undefined
  args.session.escalation = undefined
  await saveSessionDurable(args.msg.chatId, args.msg.openId, args.session)
  const alerts = args.session.facts.filter((f) => !f.startsWith('[chat-history]'))
  return {
    card: alertGatherCard({
      lang: args.lang,
      alerts,
      chatId: args.msg.chatId,
      chatType: args.msg.chatType,
    }),
  }
}

async function runInvestigation(args: {
  msg: IncomingMessage
  lang: Lang
  newFact: string
  markStepDone?: boolean
  /** After Done/Skip evidence — send only the next step card (path already shown). */
  guideAdvanceOnly?: boolean
  /** Start analysis from gather_alerts (facts already stashed; open guide at step 1). */
  fromGather?: boolean
}): Promise<BotReply> {
  const session = await getSessionDurable(args.msg.chatId, args.msg.openId)
  session.mode = 'investigate'
  // Questions / confusion unlock reasoning; evidence pastes stay Skills-path only.
  const questionMode =
    !args.markStepDone &&
    !args.fromGather &&
    looksLikeInvestigationQuestion(args.newFact) &&
    !looksLikeIncidentEvidence(args.newFact)
  const userFactCountBefore = session.facts.filter((f) => !f.startsWith('[chat-history]')).length
  // Do not treat clarifying questions as investigation evidence / coverage.
  if (args.newFact.trim() && !questionMode && !args.fromGather) {
    session.facts.push(args.newFact.trim())
  }
  // First generation of a case — open guided step 1 (gather phase already collected alerts).
  const showAddAlertHint =
    Boolean(args.fromGather) ||
    (Boolean(args.newFact.trim()) &&
      !questionMode &&
      userFactCountBefore === 0 &&
      !args.markStepDone)
  if (args.markStepDone && session.pendingPrompt) {
    session.checkedSteps.push(session.pendingPrompt)
  }

  // AIPO: enrich with authorized chat history when available (group / thread context)
  if (
    args.msg.chatType === 'group' &&
    !session.facts.some((f) => f.startsWith('[chat-history]'))
  ) {
    const hist = await fetchChatHistory(args.msg.chatId, 12)
    logInbound({
      at: new Date().toISOString(),
      kind: 'chat_history',
      chatId: args.msg.chatId,
      openId: args.msg.openId,
      result: hist.ok ? `lines:${hist.lines.length}` : `fail:${hist.error || 'unknown'}`,
    })
    if (hist.ok && hist.lines.length) {
      session.facts.push(`[chat-history]\n${hist.lines.join('\n')}`)
    }
  }

  const blob = session.facts.join('\n\n')
  const { hits, kb, severity } = retrieveRag(blob)
  session.lastHits = hits
  session.lastKb = kb
  session.lastSeverity = severity

  // Case open: never infer coverage / never re-rank away from Skill.check step 1.
  // Opening alerts often echo Bid1/Ask1/Spread (or operator paraphrase) and would
  // otherwise mark early atoms done → tip says「第 1 步」while push is 4/4.
  // Also drop stale checkedSteps from a previous case so we never resume at step 7/13.
  const openCaseGuide = showAddAlertHint
  if (openCaseGuide || args.fromGather) {
    session.checkedSteps = []
  }
  const pathPlan = planInvestigationPath({
    facts: session.facts,
    hits,
    checkedSteps: session.checkedSteps,
    lang: args.lang,
    max: 3,
    latestFact: args.newFact,
    inferCoverage: !openCaseGuide,
  })
  // Persist evidence-inferred coverage so out-of-order pastes stick across turns.
  if (!openCaseGuide) {
    for (const c of pathPlan.newlyCovered) {
      if (!session.checkedSteps.some((s) => s.toLowerCase() === c.toLowerCase())) {
        session.checkedSteps.push(c)
      }
    }
  }
  const hadPath = Boolean(session.pathSteps?.length)
  // Case open ignores prior step statuses (stale durable sessions / cleared facts).
  session.pathSteps = mergeGuideSteps(
    pathPlan.fullSteps,
    openCaseGuide ? undefined : session.pathSteps,
  )
  // Prefer re-ranked remaining steps when latest evidence points elsewhere (mid-case only).
  const preferIds = openCaseGuide
    ? undefined
    : pathPlan.fullSteps
        .filter((s) => !s.covered)
        .sort((a, b) => {
          if (b.latestScore !== a.latestScore) return b.latestScore - a.latestScore
          return a.authorIdx - b.authorIdx
        })
        .map((s) => s.id)
  session.pathStepIndex = firstPendingGuideIndex(session.pathSteps, preferIds)
  session.stepAwaiting = session.stepAwaiting || 'none'
  if (session.pathStepIndex < 0) {
    session.pendingPrompt = undefined
  } else {
    session.pendingPrompt = session.pathSteps[session.pathStepIndex]?.label
  }
  const nextSteps =
    session.pathStepIndex >= 0 && session.pathSteps[session.pathStepIndex]
      ? [session.pathSteps[session.pathStepIndex]!.label]
      : pathPlan.nextSteps
  const actions = preferredActions(hits, args.lang, 2)
  // Path overview (= 总分析) once at case open / start_analysis; Done/Skip advances step-only.
  const includeOverview =
    Boolean(args.fromGather) ||
    (!args.guideAdvanceOnly && (!hadPath || Boolean(showAddAlertHint)))
  const summary = buildSummary({
    lang: args.lang,
    severity,
    hits,
    kb,
    facts: session.facts,
    adapted:
      session.facts.length > 1 ||
      session.checkedSteps.length > 0 ||
      pathPlan.reordered ||
      pathPlan.newlyCovered.length > 0,
    newlyCovered: pathPlan.newlyCovered,
    reordered: pathPlan.reordered,
  })

  const primaryByAlertName = hits.length > 0 && hits[0]!.score >= 100
  let bodyExtra: string
  let assistTag = ''
  if (questionMode) {
    // Unlock reasoning + business knowledge only when the duty officer is stuck / asking.
    const quoteOps = await fetchQuoteOpsRag(blob.slice(0, 1500))
    const reasonPrompt =
      args.lang === 'zh-Hans'
        ? '用户在排查中提问或不解。先简短直接回答其问题（可用业务常识／推理），再引用当前 Skill.check／action 原文说明「按 Skill 应怎么做」。不要脱离命中 Skill 另开场景。末尾给出仍建议的下一步。简体中文、emoji 小标题。'
        : args.lang === 'zh-Hant'
          ? '使用者在排查中提問或不解。先簡短回答問題（可用業務常識／推理），再引用當前 Skill.check／action 原文。勿脫離命中 Skill。繁體中文。'
          : 'User is asking or confused mid-investigation. Answer briefly with business reasoning, then tie back to the hit Skill.check/action verbatim. Do not invent another scenario. English.'
    const llm = await enrichWithLlm({
      lang: args.lang,
      question: reasonPrompt,
      context: [
        `USER_QUESTION:\n${args.newFact.slice(0, 1500)}`,
        `FACTS:\n${blob.slice(0, 4000)}`,
        `SKILLS:\n${hits
          .map((h) => `${h.id} ${h.name}\nCHECK: ${h.check}\nACTION: ${h.action}`)
          .join('\n\n')}`,
        `NEXT:\n${nextSteps.join('\n')}`,
        `KB:\n${kb.map((k) => `${k.title}: ${k.body.slice(0, 1200)}`).join('\n')}`,
        quoteOps ? `QUOTE_OPS_RAG:\n${quoteOps}` : '',
      ]
        .filter(Boolean)
        .join('\n\n'),
      temperature: 0.3,
    })
    bodyExtra = llm
      ? `\n\n${llm}`
      : `\n\n${formatInvestigateQuestionFallback({
          lang: args.lang,
          question: args.newFact,
          hits,
          nextSteps,
        })}`
    assistTag = llm ? ' (question+LLM)' : ' (question)'
  } else {
    // Skills-first: no free-form reasoning — only Skill.check / action + adaptive path.
    bodyExtra = `\n\n${formatInvestigateCore({
      lang: args.lang,
      hits,
      kb,
      facts: session.facts,
      nextSteps,
      covered: pathPlan.covered,
      newlyCovered: pathPlan.newlyCovered,
    })}`
    assistTag = primaryByAlertName ? ' (skills-path)' : ' (skills-path·soft)'
  }

  const rec = await persistOpenIncident({
    chatId: args.msg.chatId,
    openId: args.msg.openId,
    lang: args.lang,
    facts: session.facts,
    severity,
    hits,
    kb,
    summary: summary + assistTag,
    recommendations: [...nextSteps, ...actions],
    interactions: ensureSessionInteractions(session).interactions,
    existingId: session.lastReportId,
  })
  session.lastReportId = rec.id
  session.preferredLang = args.lang
  await saveSessionDurable(args.msg.chatId, args.msg.openId, session)

  logInbound({
    at: new Date().toISOString(),
    kind: 'investigate',
    chatId: args.msg.chatId,
    openId: args.msg.openId,
    messageId: args.msg.messageId,
    textPreview: args.newFact.slice(0, 80),
    result: `incident:${rec.id};sev:${severity};skills:${hits.map((h) => `${h.id} · ${h.name}`).join(',')}`,
  })

  const invTitle =
    args.lang === 'zh-Hans' || args.lang === 'zh-Hant'
      ? `排查进行中 · ${rec.title}`
      : `Investigation · ${rec.title}`
  // Traditional title variant
  const invTitleFinal =
    args.lang === 'zh-Hant' ? `排查進行中 · ${rec.title}` : invTitle
  const skillLabels = hits.map((h) => `${h.id} · ${h.name}`)

  // Mid-case questions must surface the answer — overview is often skipped after the first path push.
  if (questionMode) {
    const qTitle =
      args.lang === 'zh-Hans'
        ? '排查解答'
        : args.lang === 'zh-Hant'
          ? '排查解答'
          : 'Investigation answer'
    const stepFollow = guideStepReply({
      lang: args.lang,
      session,
      incidentId: rec.id,
      includeOverview: false,
      title: invTitleFinal,
      severity,
      summary: summary + bodyExtra,
      actions,
      skills: skillLabels,
      knowledge: kb.map((k) => k.title),
      riskVerdict: rec.riskVerdict,
    })
    return {
      card: simpleCard(qTitle, (summary + bodyExtra).trim(), 'blue'),
      followUpCards: [
        ...(stepFollow.card ? [stepFollow.card] : []),
        ...(stepFollow.followUpCards || []),
      ],
    }
  }

  return guideStepReply({
    lang: args.lang,
    session,
    incidentId: rec.id,
    includeOverview,
    title: invTitleFinal,
    severity,
    summary: summary + bodyExtra,
    actions,
    skills: skillLabels,
    knowledge: kb.map((k) => k.title),
    riskVerdict: rec.riskVerdict,
    showAddAlertHint,
  })
}

export async function handleCardAction(args: {
  openId: string
  chatId: string
  messageId: string
  value: Record<string, unknown>
  /** When set (group), session is shared across participants. */
  chatType?: string
}): Promise<BotReply> {
  const reply = await handleCardActionCore(args)
  const { recordAgentTurnUsage } = await import('./tokenUsage.js')
  await recordAgentTurnUsage({
    inboundText: `card:${String(args.value?.action || 'action')}`,
    reply,
    source: 'rules',
  })
  return reply
}

async function handleCardActionCore(args: {
  openId: string
  chatId: string
  messageId: string
  value: Record<string, unknown>
  chatType?: string
}): Promise<BotReply> {
  const action = String(args.value.action || '')
  const incidentId = String(args.value.incidentId || '')
  // Do NOT infer group from oc_ prefix — Feishu p2p chats also use oc_ chat ids.
  const chatTypeFromValue = String(args.value.chatType || '').trim()
  const chatType =
    args.chatType ||
    (chatTypeFromValue === 'group' || chatTypeFromValue === 'p2p'
      ? chatTypeFromValue
      : 'p2p')
  // Button value may carry chatId when Feishu callback omits context.open_chat_id.
  let chatId =
    String(args.chatId || '').trim() ||
    String(args.value.chatId || args.value.openChatId || '').trim()
  let sessionUser = sessionOpenIdFor(chatType, args.openId)
  let session = await getSessionDurable(chatId, sessionUser)
  const sessionHasWork = (s: InvestigationState) =>
    s.mode !== 'idle' || s.facts.some((f) => !f.startsWith('[chat-history]'))
  // oc_→group heuristic (or missing chatType) often misses the real p2p/group key.
  if (!sessionHasWork(session) && args.openId.startsWith('ou_') && chatId) {
    const altUser = sessionUser === '__group__' ? args.openId : '__group__'
    const alt = await getSessionDurable(chatId, altUser)
    if (sessionHasWork(alt)) {
      sessionUser = altUser
      session = alt
    }
  }
  // Prefer lang stashed on the button (user's language), then session, then ZH desk default.
  const langFromValue = String(args.value.lang || '').trim()
  let lang: Lang =
    langFromValue === 'zh-Hans' || langFromValue === 'zh-Hant' || langFromValue === 'en'
      ? (langFromValue as Lang)
      : session.preferredLang || 'zh-Hans'

  if (action === 'start_analysis') {
    const stashedAlerts = (() => {
      const raw = args.value.alerts
      if (Array.isArray(raw)) {
        return raw.map((a) => String(a || '').trim()).filter(Boolean)
      }
      if (typeof raw === 'string' && raw.trim()) {
        try {
          const parsed = JSON.parse(raw) as unknown
          if (Array.isArray(parsed)) {
            return parsed.map((a) => String(a || '').trim()).filter(Boolean)
          }
        } catch {
          /* ignore */
        }
        return [raw.trim()]
      }
      return [] as string[]
    })()
    let hasAlerts = session.facts.some((f) => !f.startsWith('[chat-history]'))
    if (!hasAlerts) {
      // 1) Recover durable gather session (wrong chat key / oc_→group miss).
      const found = await findRecentGatherSession(args.openId)
      if (found) {
        chatId = found.chatId
        sessionUser = found.sessionUser
        session = found.state
        hasAlerts = session.facts.some((f) => !f.startsWith('[chat-history]'))
        if (!langFromValue) lang = session.preferredLang || lang
      }
    }
    if (!hasAlerts && stashedAlerts.length) {
      // 2) Rehydrate from button-stashed alerts (survives cross-instance session miss).
      for (const a of stashedAlerts) {
        if (!session.facts.some((f) => f === a || f.includes(a.slice(0, 80)))) {
          session.facts.push(a)
        }
      }
      session.mode = 'gather_alerts'
      session.preferredLang = lang
      hasAlerts = true
      if (!chatId) chatId = String(args.value.chatId || args.chatId || '').trim()
    }
    if (!hasAlerts) {
      const title =
        lang === 'zh-Hans' ? '还没有告警' : lang === 'zh-Hant' ? '還沒有告警' : 'No alerts yet'
      const body =
        lang === 'zh-Hans'
          ? '请先粘贴一条告警，再点 **开始分析**。'
          : lang === 'zh-Hant'
            ? '請先貼上一條告警，再點 **開始分析**。'
            : 'Paste an alert first, then tap **Start analysis**.'
      return { card: simpleCard(title, body, 'orange') }
    }
    // If mode drifted (idle) but facts exist, still allow start.
    if (session.mode !== 'gather_alerts' && session.mode !== 'investigate') {
      session.mode = 'gather_alerts'
    }
    session.preferredLang = lang
    const fakeMsg: IncomingMessage = {
      messageId: args.messageId,
      chatId: chatId || args.chatId || `p2p_${args.openId}`,
      chatType,
      openId: sessionUser === '__group__' ? args.openId : sessionUser,
      messageType: 'interactive',
      text: '',
      mentionedBot: true,
      rawContent: '',
    }
    // Keep group shared session key when recovered as __group__.
    const saveUser = sessionUser
    pushInteraction(session, {
      role: 'user',
      kind: 'command',
      text:
        lang === 'zh-Hans'
          ? '开始分析'
          : lang === 'zh-Hant'
            ? '開始分析'
            : 'Start analysis',
      messageId: args.messageId,
    })
    await saveSessionDurable(fakeMsg.chatId, saveUser, session)
    return runInvestigation({
      msg: { ...fakeMsg, openId: saveUser },
      lang,
      newFact: '',
      fromGather: true,
    })
  }

  const fakeMsg: IncomingMessage = {
    messageId: args.messageId,
    chatId: chatId || args.chatId,
    chatType,
    openId: sessionUser,
    messageType: 'interactive',
    text: '',
    mentionedBot: true,
    rawContent: '',
  }

  if (action === 'review') {
    const incidents = await listIncidentsDurable({ limit: 50 })
    return { card: reviewCard({ lang, incidents }) }
  }

  if (action === 'clear_review_confirm') {
    return handleClearReviewCommand({
      openId: args.openId,
      chatId,
      lang,
      confirmed: true,
    })
  }

  if (action === 'clear_review_cancel') {
    const title =
      lang === 'zh-Hans'
        ? '已取消清空'
        : lang === 'zh-Hant'
          ? '已取消清空'
          : 'Clear cancelled'
    const body =
      lang === 'zh-Hans'
        ? '已取消。复盘历史未改动。发送 **复盘** 可继续查看。'
        : lang === 'zh-Hant'
          ? '已取消。複盤歷史未改動。發送 **複盤** 可繼續查看。'
          : 'Cancelled. Review history unchanged. Say **review** to browse.'
    return { card: simpleCard(title, body, 'turquoise') }
  }

  if (action === 'open_incident') {
    const id = incidentId || String(args.value.incidentId || '')
    const inc = id ? await getIncidentDurable(id) : undefined
    if (!inc) {
      const title =
        lang === 'zh-Hans' ? '报告未找到' : lang === 'zh-Hant' ? '報告未找到' : 'Report not found'
      const body =
        lang === 'zh-Hans'
          ? `找不到事故 \`${id || '—'}\`。请返回看板刷新后重试。`
          : lang === 'zh-Hant'
            ? `找不到事故 \`${id || '—'}\`。請返回看板刷新後重試。`
            : `Incident \`${id || '—'}\` was not found. Go back to the board and refresh.`
      return {
        card: {
          ...simpleCard(title, body, 'orange'),
          elements: [
            { tag: 'div', text: { tag: 'lark_md', content: body } },
            {
              tag: 'action',
              actions: [
                {
                  tag: 'button',
                  text: {
                    tag: 'plain_text',
                    content:
                      lang === 'zh-Hans' || lang === 'zh-Hant' ? '返回看板' : 'Back to board',
                  },
                  type: 'primary',
                  value: { action: 'review' },
                },
              ],
            },
          ],
        },
      }
    }
    return { card: incidentDetailCard({ lang, incident: inc }) }
  }

  if (action === 'set_risk_verdict') {
    const verdict = normalizeRiskVerdict(args.value.verdict)
    const id = incidentId || session.lastReportId || ''
    const thenArchive = String(args.value.then || '') === 'archive'
    if (!verdict || !id) {
      const title =
        lang === 'zh-Hans' ? '判定失败' : lang === 'zh-Hant' ? '判定失敗' : 'Verdict failed'
      const body =
        lang === 'zh-Hans'
          ? '请从排查卡选择：有风险／无风险／尚不明确。'
          : lang === 'zh-Hant'
            ? '請從排查卡選擇：有風險／無風險／尚不明確。'
            : 'Pick At risk / No risk / Unclear on the investigation card.'
      return { card: simpleCard(title, body, 'orange') }
    }
    const inc = await getIncidentDurable(id)
    if (!inc) {
      return {
        card: simpleCard(
          lang === 'zh-Hans' ? '事故未找到' : lang === 'zh-Hant' ? '事故未找到' : 'Not found',
          `ID \`${id}\``,
          'orange',
        ),
      }
    }
    inc.riskVerdict = verdict
    inc.riskVerdictAt = Date.now()
    inc.riskVerdictBy = args.openId || 'operator'
    inc.updatedAt = Date.now()
    pushInteraction(session, {
      role: 'user',
      kind: 'command',
      text:
        lang === 'zh-Hans'
          ? `最终判定：${riskVerdictLabel(verdict, lang)}`
          : lang === 'zh-Hant'
            ? `最終判定：${riskVerdictLabel(verdict, lang)}`
            : `Final verdict: ${riskVerdictLabel(verdict, lang)}`,
      messageId: args.messageId,
    })
    if (thenArchive) {
      await upsertIncidentDurable(inc)
      await saveSessionDurable(args.chatId, sessionUser, session)
      return archiveIncidentAndShowReview({
        lang,
        chatId: args.chatId,
        openId: sessionUser,
        incidentId: id,
      })
    }
    await upsertIncidentDurable(inc)
    await saveSessionDurable(args.chatId, sessionUser, session)
    if (session.mode === 'report_draft' && session.lastReportMarkdown) {
      const title =
        lang === 'zh-Hans'
          ? '排查过程报告'
          : lang === 'zh-Hant'
            ? '排查過程報告'
            : 'Investigation report'
      return {
        card: investigationReportDraftCard({
          lang,
          title,
          body: session.lastReportMarkdown,
          incidentId: id,
          riskVerdict: inc.riskVerdict,
        }),
      }
    }
    return { card: incidentDetailCard({ lang, incident: inc }) }
  }

  if (action === 'archive') {
    const id = incidentId || session.lastReportId
    if (!id) {
      // No case id — treat any leftover open case as mid-exit · 无风险, then clear.
      await closeIncidentAsInvestigatedNoRisk({
        incidentId: session.lastReportId,
        openId: args.openId,
        reason: 'archive_without_id',
      })
      await clearSessionDurable(args.chatId, sessionUser)
      return {
        card: simpleCard(
          lang === 'zh-Hans' ? '已结束' : lang === 'zh-Hant' ? '已結束' : 'Closed',
          lang === 'zh-Hans'
            ? '会话已清除。请贴上新告警开始排查。'
            : lang === 'zh-Hant'
              ? '會話已清除。請貼上新告警開始排查。'
              : 'Session cleared. Paste a new alert to start investigation.',
          'green',
        ),
      }
    }
    return archiveIncidentAndShowReview({
      lang,
      chatId: args.chatId,
      openId: sessionUser,
      incidentId: id,
    })
  }

  if (action === 'end_investigation') {
    pushInteraction(session, {
      role: 'user',
      kind: 'command',
      text: 'end_investigation',
      messageId: args.messageId,
    })
    await saveSessionDurable(args.chatId, sessionUser, session)
    return {
      card: investigationEndAskReportCard({
        lang,
        incidentId: incidentId || session.lastReportId || '',
        stepId: String(args.value.stepId || ''),
      }),
    }
  }

  if (action === 'end_and_report' || action === 'generate_report') {
    return replyProceedInvestigationReport({
      session,
      lang,
      chatId: args.chatId,
      openId: args.openId,
      messageId: args.messageId,
    })
  }

  if (action === 'end_without_report') {
    const endedId = incidentId || session.lastReportId || ''
    pushInteraction(session, {
      role: 'user',
      kind: 'command',
      text: 'end_without_report',
      messageId: args.messageId,
    })
    // Mid-exit: record as investigated · 无风险 (no formal archive-after-report).
    await closeIncidentAsInvestigatedNoRisk({
      incidentId: endedId,
      openId: args.openId,
      reason: 'end_without_report',
    })
    session.mode = 'idle'
    session.pathSteps = undefined
    session.pathStepIndex = undefined
    session.stepAwaiting = 'none'
    session.pendingPrompt = undefined
    session.escalation = undefined
    session.lastReportId = undefined
    session.lastReportMarkdown = undefined
    await saveSessionDurable(args.chatId, sessionUser, session)
    const title =
      lang === 'zh-Hans'
        ? '排查已结束'
        : lang === 'zh-Hant'
          ? '排查已結束'
          : 'Investigation ended'
    const body =
      lang === 'zh-Hans'
        ? '已结束排查（未生成报告）。本案已记为 **排查过 · 无风险**。**下一步：** 可贴新告警重新开始。'
        : lang === 'zh-Hant'
          ? '已結束排查（未生成報告）。本案已記為 **排查過 · 無風險**。**下一步：** 可貼新告警重新開始。'
          : 'Ended without a report. Recorded as **investigated · no risk**. **Next:** paste a new alert to restart.'
    return {
      card: {
        config: { wide_screen_mode: true },
        header: {
          template: 'grey',
          title: { tag: 'plain_text', content: title },
        },
        elements: [{ tag: 'div', text: { tag: 'lark_md', content: body } }],
      },
    }
  }

  if (action === 'guide_step_done') {
    const steps = session.pathSteps || []
    const stepId = String(args.value.stepId || '')
    let idx = steps.findIndex((s) => s.id === stepId)
    if (idx < 0) idx = session.pathStepIndex ?? firstPendingGuideIndex(steps)
    const step = idx >= 0 ? steps[idx] : undefined
    if (!step) {
      return {
        card: simpleCard(
          lang === 'zh-Hans' ? '无当前步骤' : lang === 'zh-Hant' ? '無當前步驟' : 'No current step',
          lang === 'zh-Hans'
            ? '请先贴告警开始排查。'
            : lang === 'zh-Hant'
              ? '請先貼告警開始排查。'
              : 'Paste an alert to start investigation.',
          'wathet',
        ),
      }
    }
    // Done → mark complete and push the next step card immediately.
    // (Evidence can still be added via 补充信息; requiring a paste here left
    // operators with only a toast when card.reply failed after the callback.)
    session.pathStepIndex = idx
    session.pendingPrompt = step.label
    step.status = 'done'
    session.stepAwaiting = 'none'
    if (!session.checkedSteps.some((s) => s.toLowerCase() === step.label.toLowerCase())) {
      session.checkedSteps.push(step.label)
    }
    pushInteraction(session, {
      role: 'user',
      kind: 'step_done',
      text: `guide_step_done:${step.id}`,
      messageId: args.messageId,
    })
    await saveSessionDurable(args.chatId, sessionUser, session)
    const doneFact =
      lang === 'zh-Hans'
        ? `值班人员已完成步骤：${step.label}`
        : lang === 'zh-Hant'
          ? `值班人員已完成步驟：${step.label}`
          : `Operator marked step done: ${step.label}`
    return runInvestigation({
      msg: fakeMsg,
      lang,
      newFact: doneFact,
      markStepDone: true,
      guideAdvanceOnly: true,
    })
  }

  if (action === 'guide_step_cancel_await') {
    const steps = session.pathSteps || []
    const stepId = String(args.value.stepId || '')
    let idx = steps.findIndex((s) => s.id === stepId)
    if (idx < 0) idx = session.pathStepIndex ?? firstPendingGuideIndex(steps)
    const step = idx >= 0 ? steps[idx] : undefined
    if (!step) {
      return {
        card: simpleCard(
          lang === 'zh-Hans' ? '无当前步骤' : lang === 'zh-Hant' ? '無當前步驟' : 'No current step',
          lang === 'zh-Hans'
            ? '请先贴告警开始排查。'
            : lang === 'zh-Hant'
              ? '請先貼告警開始排查。'
              : 'Paste an alert to start investigation.',
          'wathet',
        ),
      }
    }
    session.pathStepIndex = idx
    session.stepAwaiting = 'none'
    session.pendingPrompt = step.label
    session.escalation = undefined
    pushInteraction(session, {
      role: 'user',
      kind: 'command',
      text: `guide_step_cancel_await:${step.id}`,
      messageId: args.messageId,
    })
    await clearEscalationsForOperator(args.chatId, sessionUser)
    await saveSessionDurable(args.chatId, sessionUser, session)
    const skillAction =
      session.lastHits.find((h) => h.id === step.skillId)?.action ||
      loadSkills().find((s) => s.id === step.skillId)?.action ||
      ''
    return {
      card: investigationStepGuideCard({
        lang,
        step,
        stepIndex: idx,
        totalSteps: steps.length,
        incidentId: incidentId || session.lastReportId || '',
        escalateRoles: escalateRolesForStep(step, skillAction),
        decisionBranches: decisionBranchesForStep(session, step.skillId),
      }),
    }
  }

  if (action === 'guide_step_supplement') {
    const steps = session.pathSteps || []
    const stepId = String(args.value.stepId || '')
    let idx = steps.findIndex((s) => s.id === stepId)
    if (idx < 0) idx = session.pathStepIndex ?? firstPendingGuideIndex(steps)
    const step = idx >= 0 ? steps[idx] : undefined
    if (!step) {
      return {
        card: simpleCard(
          lang === 'zh-Hans' ? '无当前步骤' : lang === 'zh-Hant' ? '無當前步驟' : 'No current step',
          lang === 'zh-Hans'
            ? '请先贴告警开始排查。'
            : lang === 'zh-Hant'
              ? '請先貼告警開始排查。'
              : 'Paste an alert to start investigation.',
          'wathet',
        ),
      }
    }
    session.pathStepIndex = idx
    session.stepAwaiting = 'supplement'
    session.pendingPrompt = step.label
    pushInteraction(session, {
      role: 'user',
      kind: 'command',
      text: `guide_step_supplement:${step.id}`,
      messageId: args.messageId,
    })
    await saveSessionDurable(args.chatId, sessionUser, session)
    return {
      card: investigationSupplementPromptCard({
        lang,
        step,
        stepIndex: idx,
        totalSteps: steps.length,
      }),
    }
  }

  if (action === 'guide_step_skip') {
    const steps = session.pathSteps || []
    const stepId = String(args.value.stepId || '')
    let idx = steps.findIndex((s) => s.id === stepId)
    if (idx < 0) idx = session.pathStepIndex ?? firstPendingGuideIndex(steps)
    const step = idx >= 0 ? steps[idx] : undefined
    if (!step) {
      return {
        card: simpleCard(
          lang === 'zh-Hans' ? '无当前步骤' : lang === 'zh-Hant' ? '無當前步驟' : 'No current step',
          lang === 'zh-Hans'
            ? '请先贴告警开始排查。'
            : lang === 'zh-Hant'
              ? '請先貼告警開始排查。'
              : 'Paste an alert to start investigation.',
          'wathet',
        ),
      }
    }
    session.pathStepIndex = idx
    session.pendingPrompt = step.label
    if (step.required) {
      session.stepAwaiting = 'required_skip_reply'
      pushInteraction(session, {
        role: 'user',
        kind: 'step_skip',
        text: `guide_step_skip_required:${step.id}`,
        messageId: args.messageId,
      })
      await saveSessionDurable(args.chatId, sessionUser, session)
      return {
        card: investigationRequiredSkipPromptCard({
          lang,
          step,
          stepIndex: idx,
          totalSteps: steps.length,
          incidentId: incidentId || session.lastReportId || '',
        }),
      }
    }
    // Optional: skip immediately and advance.
    step.status = 'skipped'
    session.stepAwaiting = 'none'
    if (!session.checkedSteps.some((s) => s.toLowerCase() === step.label.toLowerCase())) {
      session.checkedSteps.push(step.label)
    }
    pushInteraction(session, {
      role: 'user',
      kind: 'step_skip',
      text: `guide_step_skip_optional:${step.id}`,
      messageId: args.messageId,
    })
    await saveSessionDurable(args.chatId, sessionUser, session)
    const skipFact =
      lang === 'zh-Hans'
        ? `值班人员跳过可选步骤：${step.label}`
        : lang === 'zh-Hant'
          ? `值班人員跳過可選步驟：${step.label}`
          : `Operator skipped optional step: ${step.label}`
    return runInvestigation({
      msg: fakeMsg,
      lang,
      newFact: skipFact,
      markStepDone: true,
      guideAdvanceOnly: true,
    })
  }

  if (action === 'guide_step_escalate') {
    const steps = session.pathSteps || []
    const stepId = String(args.value.stepId || '')
    let idx = steps.findIndex((s) => s.id === stepId)
    if (idx < 0) idx = session.pathStepIndex ?? firstPendingGuideIndex(steps)
    const step = idx >= 0 ? steps[idx] : undefined
    if (!step) {
      return {
        card: simpleCard(
          lang === 'zh-Hans' ? '无当前步骤' : lang === 'zh-Hant' ? '無當前步驟' : 'No current step',
          lang === 'zh-Hans'
            ? '请先贴告警开始排查。'
            : lang === 'zh-Hant'
              ? '請先貼告警開始排查。'
              : 'Paste an alert to start investigation.',
          'wathet',
        ),
      }
    }
    const skillAction =
      session.lastHits.find((h) => h.id === step.skillId)?.action ||
      loadSkills().find((s) => s.id === step.skillId)?.action ||
      ''
    const fromBtn = String(args.value.roles || '')
      .split(/[/,，、\s]+/)
      .map((s) => s.trim())
      .filter(Boolean)
    const roles =
      fromBtn.length > 0 ? fromBtn : escalateRolesForStep(step, skillAction)
    const resolved = await resolveEscalateOpenIds(roles.length ? roles : ['RC'])
    const rolesFinal = roles.length ? roles : Object.keys(resolved.roleMap)
    const caseId = incidentId || session.lastReportId || ''
    const timeline = formatInteractionLog(
      ensureSessionInteractions(session).interactions,
      lang,
    )
    const factsMd = (session.facts || [])
      .filter((f) => !f.startsWith('[chat-history]'))
      .map((f, i) => `${i + 1}. ${f.replace(/\s+/g, ' ').trim().slice(0, 400)}`)
      .join('\n')
    let operatorName = ''
    try {
      operatorName = (await fetchUserDisplayName(args.openId)) || ''
    } catch {
      operatorName = ''
    }
    const briefing = investigationEscalateBriefingCard({
      lang,
      roles: rolesFinal,
      stepLabel: step.label,
      stepIndex: idx,
      totalSteps: steps.length,
      incidentId: caseId || undefined,
      operatorName: operatorName || undefined,
      factsMarkdown: factsMd || (lang === 'en' ? '(none)' : '（暂无）'),
      timelineMarkdown: timeline,
    })
    const { sendCardToOpenId } = await import('./client.js')
    let notified = 0
    for (const oid of resolved.openIds) {
      if (oid === args.openId) continue
      try {
        await sendCardToOpenId(oid, briefing)
        await rememberEscalationPending(oid, {
          operatorChatId: args.chatId,
          operatorOpenId: args.openId,
          incidentId: caseId || undefined,
          stepId: step.id,
          stepLabel: step.label,
          stepIndex: idx,
          totalSteps: steps.length,
          roles: rolesFinal,
          lang,
          at: Date.now(),
          factsPreview: factsMd.slice(0, 2000),
          timelinePreview: timeline.slice(0, 3500),
        })
        notified += 1
      } catch {
        /* try next recipient */
      }
    }
    // If only self matched (UAT), still DM self so the briefing is visible.
    if (!notified && resolved.openIds[0]) {
      try {
        await sendCardToOpenId(resolved.openIds[0], briefing)
        await rememberEscalationPending(resolved.openIds[0], {
          operatorChatId: args.chatId,
          operatorOpenId: args.openId,
          incidentId: caseId || undefined,
          stepId: step.id,
          stepLabel: step.label,
          stepIndex: idx,
          totalSteps: steps.length,
          roles: rolesFinal,
          lang,
          at: Date.now(),
          factsPreview: factsMd.slice(0, 2000),
          timelinePreview: timeline.slice(0, 3500),
        })
        notified = 1
      } catch {
        /* ignore */
      }
    }

    session.pathStepIndex = idx
    session.pendingPrompt = step.label
    session.stepAwaiting = 'escalate_feedback'
    session.escalation = {
      stepId: step.id,
      stepLabel: step.label,
      stepIndex: idx,
      roles: rolesFinal,
      openIds: resolved.openIds,
      at: Date.now(),
    }
    pushInteraction(session, {
      role: 'user',
      kind: 'escalate',
      text: `guide_step_escalate:${step.id}→${rolesFinal.join('/')};notified=${notified}`,
      messageId: args.messageId,
    })
    await saveSessionDurable(args.chatId, sessionUser, session)
    return {
      card: investigationEscalatedWaitingCard({
        lang,
        step,
        stepIndex: idx,
        totalSteps: steps.length,
        roles: rolesFinal,
        notifiedCount: notified,
        incidentId: caseId || undefined,
      }),
    }
  }

  // Kept for older cards still in chat history
  if (action === 'step_done') {
    // Legacy button → same as guide Done (advance to next step).
    return handleCardAction({
      ...args,
      value: {
        ...args.value,
        action: 'guide_step_done',
        stepId: session.pathSteps?.[session.pathStepIndex ?? 0]?.id || '',
      },
    })
  }

  if (action === 'alert_nudge_ack') {
    const {
      ackAlertNudgeDurable,
      buildAlertNudgeAckCard,
      loadNudgeState,
    } = await import('./alertNudge.js')
    const { rememberAdminOpenId, resolveAdminOpenId, sendCardToOpenId } =
      await import('./client.js')
    rememberAdminOpenId(args.openId, 'nudge_ack')
    const before = await loadNudgeState()
    const st = await ackAlertNudgeDurable(args.openId)
    const openId = st?.openId || before?.openId || args.openId
    const ackCard = buildAlertNudgeAckCard({
      openId,
      alertAt: st?.alertAt || before?.alertAt || Date.now(),
      ackedAt: st?.ackedAt || Date.now(),
      sendCount: st?.sendCount ?? before?.sendCount ?? 0,
      alertPreview: st?.alertPreview || before?.alertPreview,
    })
    // Report TTR to the @mentioned person (Yan).
    try {
      const admin = await resolveAdminOpenId({ preferChatId: args.chatId })
      const target = admin.openId || openId
      if (target && target.startsWith('ou_') && target !== args.openId) {
        await sendCardToOpenId(target, ackCard)
      }
    } catch {
      /* best-effort DM */
    }
    return { card: ackCard }
  }

  // Market card: switch OKX K-line interval (15m / 1H / 4H / 1D) in place.
  if (action === 'market_kline_tf') {
    const { isKlineIntervalBar, rebuildMarketCardForInterval, resolveMarketLang } =
      await import('./market.js')
    const barRaw = String(args.value.bar || '1H')
    const bar = isKlineIntervalBar(barRaw) ? barRaw : '1H'
    const mode = String(args.value.mode || '') === 'daily' ? 'daily' : 'hourly'
    // Prefer live session language over the lang baked into the button when the card was sent.
    const cardLang = resolveMarketLang(
      session.preferredLang || String(args.value.lang || lang || 'zh-Hans'),
    )
    const card = await rebuildMarketCardForInterval({ bar, mode, lang: cardLang })
    return { card }
  }

  // Always return a card so callback-token delivery can update the message.
  return {
    card: simpleCard(
      lang === 'zh-Hans' ? '未知操作' : lang === 'zh-Hant' ? '未知操作' : 'Unknown action',
      lang === 'zh-Hans'
        ? `未识别的按钮：\`${action || '—'}\`。请重新打开步骤卡，或回复 **help**。`
        : lang === 'zh-Hant'
          ? `未識別的按鈕：\`${action || '—'}\`。請重新打開步驟卡，或回覆 **help**。`
          : `Unrecognized button: \`${action || '—'}\`. Re-open the step card, or reply **help**.`,
      'orange',
    ),
  }
}

export async function handleMessage(msg: IncomingMessage): Promise<BotReply | null> {
  const reply = await handleMessageCore(msg)
  if (reply) {
    const { recordAgentTurnUsage } = await import('./tokenUsage.js')
    await recordAgentTurnUsage({
      inboundText: msg.text || msg.rawContent || '',
      reply,
      source: 'rules',
    })
  }
  return reply
}

async function handleMessageCore(msg: IncomingMessage): Promise<BotReply | null> {
  if (!msg.messageId) return null

  // Forwarded cards / merge_forward / reply-to-alert often lack body in the event —
  // re-fetch via message API before intent routing (otherwise empty → greeting).
  let inbound = msg
  try {
    const { enrichIncomingEvidence } = await import('./parse.js')
    inbound = await enrichIncomingEvidence(msg)
  } catch {
    inbound = msg
  }

  // Groups share one investigation session so auto-captured alerts + later @replies
  // from any participant continue the same case.
  const sessionUser = sessionOpenIdFor(inbound.chatType, inbound.openId)
  const realOpenId = msg.openId
  if (sessionUser !== inbound.openId) {
    inbound = { ...inbound, openId: sessionUser }
  }

  // Group silence nudge: arm on alert; cancel arm on human (non-alert) reply before first nudge.
  {
    const ct = (inbound.chatType || '').toLowerCase()
    const isGroup = ct === 'group' || ct === 'topic' || ct === 'topic_group'
    if (isGroup && inbound.chatId) {
      try {
        const {
          armAlertNudgeFromGroupAlert,
          noteGroupHumanResponseDurable,
          looksLikeNudgeAck,
        } = await import('./alertNudge.js')
        const { resolveAdminOpenId } = await import('./client.js')
        const text = (inbound.text || '').trim()
        if (looksLikeGroupAutoAlert(inbound)) {
          const admin = await resolveAdminOpenId({ preferChatId: inbound.chatId })
          await armAlertNudgeFromGroupAlert({
            chatId: inbound.chatId,
            openId: admin.openId,
            alertAt: Date.now(),
            alertPreview: text.slice(0, 200),
          })
        } else if (
          text &&
          !looksLikeOurOutboundCard(text) &&
          !looksLikeNudgeAck(text) &&
          realOpenId &&
          realOpenId.startsWith('ou_')
        ) {
          await noteGroupHumanResponseDurable({ chatId: inbound.chatId })
        }
      } catch {
        /* nudge arming must not block the main reply */
      }
    }
  }

  // Image / file / share first → understand & reiterate before relevance judgement
  let workingText = inbound.text
  let attachmentDigest: string | null = null
  let attachmentKind = 'share'
  const userCaption = (inbound.text || '').trim()
  const session = await getSessionDurable(inbound.chatId, inbound.openId)
  // Desk default ZH. detectLang mirrors the user's latest message language:
  // EN keyword commands → en; 简体/繁體 commands → matching ZH; share-meta / soft acks stay sticky.
  const langFallback = session.preferredLang || 'zh-Hans'
  let lang = detectLang(inbound.text || '', langFallback)
  if (
    looksLikeShareOrFileMeta(inbound.text || '') &&
    (langFallback === 'zh-Hans' || langFallback === 'zh-Hant')
  ) {
    lang = langFallback
  }

  const attachmentMsg = isAttachmentMessage(
    inbound.messageType,
    inbound.text || '',
    inbound.imageKey,
  )
  if (inbound.messageType === 'image' || inbound.imageKey) {
    attachmentKind = 'image'
    attachmentDigest = await handleImage(inbound, lang)
    workingText = userCaption ? `${userCaption}\n\n${attachmentDigest}` : attachmentDigest
    lang = detectLang(workingText, lang)
  } else if (attachmentMsg && inbound.messageType !== 'merge_forward') {
    // merge_forward is already expanded above — don't treat placeholder as a doc share.
    attachmentKind =
      inbound.messageType === 'file' || inbound.messageType === 'media' ? 'file' : 'share'
    attachmentDigest = await ingestShareOrFile(inbound, lang)
    workingText = userCaption && !looksLikeShareOrFileMeta(userCaption)
      ? `${userCaption}\n\n${attachmentDigest}`
      : attachmentDigest
    lang = detectLang(`${userCaption}\n${attachmentDigest}`, lang)
  } else if (inbound.messageType === 'post' && /\|/.test(inbound.text)) {
    // Tables in post often flatten with spaces; keep as investigate evidence
    workingText = `[table/post]\n${inbound.text}`
  }

  if (attachmentDigest) {
    session.lastAttachmentSummary = attachmentDigest.slice(0, 2000)
    session.lastAttachmentKind = attachmentKind
  }
  session.preferredLang = lang
  await saveSessionDurable(inbound.chatId, inbound.openId, session)
  // Remember chat + user language for cron / market cards (简体 ≠ 繁體)
  void rememberChatMarketLang(inbound.chatId, lang, inbound.openId)

  // Pending soft-command confirm — yes runs it; no / chat continues as chatbot
  let forcedIntent: PendingCommandIntent | null = null
  let skipCommandConfirm = false
  if (session.pendingCommand && session.pendingCommandAt && Date.now() - session.pendingCommandAt < 15 * 60_000) {
    const pending = session.pendingCommand
    const pendingText = session.pendingCommandText || workingText
    if (looksLikeCommandConfirm(workingText)) {
      session.pendingCommand = undefined
      session.pendingCommandText = undefined
      session.pendingCommandAt = undefined
      await saveSessionDurable(msg.chatId, msg.openId, session)
      workingText = pendingText
      forcedIntent = pending
      skipCommandConfirm = true
    } else if (
      looksLikeCommandCancel(workingText) ||
      looksLikePureChat(workingText) ||
      isCasualChat(workingText)
    ) {
      session.pendingCommand = undefined
      session.pendingCommandText = undefined
      session.pendingCommandAt = undefined
      await saveSessionDurable(msg.chatId, msg.openId, session)
      if (looksLikeCommandCancel(workingText)) {
        const replyTitle =
          lang === 'zh-Hans' ? '好的，我们聊' : lang === 'zh-Hant' ? '好的，我們聊' : 'Sure — let’s chat'
        const body =
          lang === 'zh-Hans'
            ? '好的，先不跑指令 🙂 想聊什么直接说；要看行情／贴告警随时叫我。'
            : lang === 'zh-Hant'
              ? '好的，先不跑指令 🙂 想聊什麼直接說；要看行情／貼告警隨時叫我。'
              : 'Okay, skipping the command 🙂 Say anything — or toss a market / alert anytime.'
        return { card: simpleCard(replyTitle, body, 'blue') }
      }
      // Fall through as normal chat with cleared pending
    }
  } else if (session.pendingCommand) {
    session.pendingCommand = undefined
    session.pendingCommandText = undefined
    session.pendingCommandAt = undefined
    await saveSessionDurable(msg.chatId, msg.openId, session)
  }

  // Alert nudge —「知道了」must stop (never fall through to greeting soft-ack)
  {
    const {
      isNudgeActiveDurable,
      isNudgeArmedOrActiveDurable,
      looksLikeNudgeAck,
      looksLikeNudgeExplainQuestion,
      formatNudgeExplainReply,
      ackAlertNudgeDurable,
      buildAlertNudgeAckCard,
      loadNudgeState,
    } = await import('./alertNudge.js')
    if (looksLikeNudgeAck(workingText)) {
      const st0 = await loadNudgeState()
      const shouldAck =
        Boolean(st0?.active) ||
        Boolean(st0?.armed) ||
        Boolean(st0?.sendCount) ||
        (await isNudgeActiveDurable()) ||
        (await isNudgeArmedOrActiveDurable())
      if (shouldAck) {
        const { rememberAdminOpenId, resolveAdminOpenId, sendCardToOpenId } =
          await import('./client.js')
        rememberAdminOpenId(msg.openId, 'nudge_ack_text')
        const st = await ackAlertNudgeDurable(msg.openId)
        const openId = st?.openId || st0?.openId || msg.openId
        const ackCard = buildAlertNudgeAckCard({
          openId,
          alertAt: st?.alertAt || st0?.alertAt || Date.now(),
          ackedAt: st?.ackedAt || Date.now(),
          sendCount: st?.sendCount ?? st0?.sendCount ?? 0,
          alertPreview: st?.alertPreview || st0?.alertPreview,
        })
        try {
          const admin = await resolveAdminOpenId({ preferChatId: inbound.chatId })
          const target = admin.openId || openId
          if (target && target.startsWith('ou_') && target !== msg.openId) {
            await sendCardToOpenId(target, ackCard)
          }
        } catch {
          /* best-effort */
        }
        return { card: ackCard }
      }
    }
    if (looksLikeNudgeExplainQuestion(workingText)) {
      const st = await loadNudgeState()
      if (st || (await isNudgeActiveDurable()) || (await isNudgeArmedOrActiveDurable())) {
        return {
          card: simpleCard(
            lang === 'zh-Hans' || lang === 'zh-Hant' ? '关于「新告警」提醒' : 'About the alert nudge',
            formatNudgeExplainReply(lang, st),
            'orange',
          ),
        }
      }
    }
  }

  // Forwarded / replied alert markers must never fall through to greeting.
  const looksForwardedEvidence =
    inbound.messageType === 'interactive' ||
    inbound.messageType === 'merge_forward' ||
    Boolean(inbound.parentId || inbound.rootId) ||
    /\[(forwarded_card|merge_forward|replied_alert)\]/i.test(workingText)

  let intent =
    forcedIntent ||
    classifyIntent(workingText, {
      inInvestigateSession:
        session.mode === 'investigate' ||
        session.mode === 'gather_alerts' ||
        session.mode === 'report_draft',
      mentionedBot: inbound.mentionedBot,
      chatType: inbound.chatType,
    })

  if (looksForwardedEvidence && (intent === 'greeting' || intent === 'ack_mention' || !workingText.trim())) {
    intent = 'investigate'
  }
  if (
    looksForwardedEvidence &&
    intent !== 'investigate' &&
    intent !== 'followup' &&
    looksLikeIncidentEvidence(workingText)
  ) {
    intent = 'investigate'
  }
  // Multi-participant group: alert post without @ → always open investigation.
  if (
    !inbound.mentionedBot &&
    looksLikeGroupAutoAlert(inbound) &&
    intent !== 'followup' &&
    intent !== 'inv_report' &&
    intent !== 'archive'
  ) {
    intent = 'investigate'
  }

  // Report draft: free chat revises the full report; archive finishes review.
  if (session.mode === 'report_draft') {
    if (intent === 'archive') {
      return handleCardAction({
        openId: msg.openId,
        chatId: msg.chatId,
        messageId: msg.messageId,
        value: { action: 'archive', incidentId: session.lastReportId || '' },
      })
    }
    if (intent === 'review') {
      const incidents = await listIncidentsDurable({ limit: 50 })
      return { card: reviewCard({ lang, incidents }) }
    }
    if (intent === 'inv_report') {
      return replyProceedInvestigationReport({
        session,
        lang,
        chatId: inbound.chatId,
        openId: inbound.openId,
        messageId: inbound.messageId,
      })
    }
    // New alert / investigate while draft open = mid-exit → investigated · 无风险, then gather.
    if (
      intent === 'investigate' &&
      (looksLikeIncidentEvidence(workingText) || looksForwardedEvidence)
    ) {
      await closeIncidentAsInvestigatedNoRisk({
        incidentId: session.lastReportId,
        openId: inbound.openId,
        reason: 'abandon_report_draft',
      })
      session.lastReportId = undefined
      session.lastReportMarkdown = undefined
      session.facts = session.facts.filter((f) => f.startsWith('[chat-history]'))
      session.interactions = []
      session.checkedSteps = []
      session.mode = 'idle'
      await saveSessionDurable(inbound.chatId, inbound.openId, session)
      const fact = workingText
        .replace(/^(investigate|排查|開始排查|开始排查)\s*/i, '')
        .replace(/\[(forwarded_card|merge_forward|replied_alert)\]\s*/gi, '')
        .trim()
      return replyAlertGather({
        msg: inbound,
        lang,
        session,
        newFact: fact,
        freshCase: true,
      })
    }
    if (
      intent === 'greeting' ||
      intent === 'ack_mention' ||
      intent === 'help' ||
      intent === 'market' ||
      intent === 'weekly' ||
      intent === 'oscillation' ||
      intent === 'daily_market' ||
      intent === 'skills' ||
      intent === 'knowledge' ||
      intent === 'alert_optimize' ||
      intent === 'safety'
    ) {
      // fall through to normal handlers
    } else if (workingText.trim()) {
      return reviseReportDraft({
        session,
        lang,
        chatId: inbound.chatId,
        openId: inbound.openId,
        messageId: inbound.messageId,
        instruction: workingText.trim(),
      })
    }
  }

  if (intent === 'greeting' || intent === 'ack_mention') {
    // Empty @mention / hi only — never greet on a forwarded or reply-to alert.
    if (looksForwardedEvidence) {
      const title =
        lang === 'zh-Hans' ? '开始排查' : lang === 'zh-Hant' ? '開始排查' : 'Start investigation'
      const body =
        lang === 'zh-Hans'
          ? '收到转发／引用的消息，但卡片正文读取失败或权限不足。请直接粘贴告警文字，或确认应用已开通「获取单聊、群组消息」读权限。'
          : lang === 'zh-Hant'
            ? '收到轉發／引用的訊息，但卡片正文讀取失敗或權限不足。請直接貼上告警文字，或確認應用已開通「獲取單聊、群組訊息」讀權限。'
            : 'Got a forward/reply, but could not read the card body (or lacking message-read scope). Paste the alert text, or grant im:message:readonly.'
      return { card: simpleCard(title, body, 'orange') }
    }
    // Token usage is a private daily DM to Yan (18:00 SGT) — not on greeting.
    // @Haixiang only in the UAT footer (by open_id), not in feature bullets.
    const admin = await resolveAdminOpenId({ preferChatId: inbound.chatId })
    return { card: greetingCard(lang, greetingReply(lang, admin.openId)) }
  }

  if (intent === 'help') {
    return { card: helpCard(lang, helpReply(lang)) }
  }

  if (intent === 'safety') {
    const hit = detectSafetyViolation(workingText) || 'pii'
    return { text: safetyReply(lang, hit) }
  }

  // Clear instruction → execute; ambiguous soft command → clarify; question/chat → no workflow
  const disposition = resolveTurnDisposition(workingText, intent, {
    skipConfirm: skipCommandConfirm,
  })
  if (
    disposition === 'chat' &&
    (intent === 'market' ||
      intent === 'investigate' ||
      intent === 'review' ||
      intent === 'skills' ||
      intent === 'knowledge' ||
      intent === 'weekly' ||
      intent === 'oscillation' ||
      intent === 'daily_market' ||
      intent === 'alert_optimize')
  ) {
    intent = 'general_risk'
  }
  if (disposition === 'clarify') {
    session.pendingCommand = intent as PendingCommandIntent
    session.pendingCommandText = workingText
    session.pendingCommandAt = Date.now()
    await saveSessionDurable(msg.chatId, msg.openId, session)
    const { title } = pendingCommandLabel(intent, lang)
    return {
      card: simpleCard(title, commandConfirmPrompt(lang, intent, workingText), 'wathet'),
    }
  }

  // Attachments: always understand & reiterate before relevance judgement
  if (attachmentDigest) {
    const riskRelated = attachmentLooksRiskRelated(attachmentDigest)
    const captionCmd =
      /^(?:market|investigate|help|skills?|knowledge|kb|review|dashboard|weekly|done|行情|市况|市況|排查|帮助|幫助|技能|知识库|知識庫|复盘|複盤|看板|周报|週報|完成|文档|文檔|说明|說明)(?:\s|$)/i.test(
        userCaption,
      )
    const continueAsEvidence =
      session.mode === 'investigate' ||
      intent === 'investigate' ||
      intent === 'followup' ||
      (riskRelated && looksLikeIncidentEvidence(attachmentDigest) && intent === 'general_risk')
    if (!captionCmd && !continueAsEvidence) {
      const title =
        lang === 'zh-Hans' || lang === 'zh-Hant' ? '附件理解' : 'Attachment understanding'
      return {
        card: simpleCard(
          title,
          formatAttachmentUnderstanding({
            lang,
            kind: attachmentKind,
            digest: attachmentDigest,
            riskRelated,
            userAsk:
              userCaption && !looksLikeShareOrFileMeta(userCaption) ? userCaption : undefined,
          }),
          riskRelated ? 'blue' : 'wathet',
        ),
      }
    }
  }

  // `offtopic` intent is retired (negative-list only). Fall through to chat / Q&A.

  // AIPO Lark API UAT: Wiki / Docs read (authorized, read-only) before generic access gate
  if (isLarkWikiQuestion(workingText) || isLarkWikiQuestion(userCaption)) {
    // “你能读取这里面的数据吗” — prefer last attachment digest over capability-only FAQ
    if (
      /(能|可以|可否|能不能).{0,8}(读|讀|读取|讀取|查看)|(can\s+you\s+read)/i.test(userCaption || workingText) &&
      !/\bwiki\b|(飞书|飛書).{0,6}(wiki|文档|文檔)/i.test(userCaption || workingText)
    ) {
      const prior = session.lastAttachmentSummary
      if (prior) {
        return {
          card: simpleCard(
            lang === 'zh-Hans' ? '附件理解' : lang === 'zh-Hant' ? '附件理解' : 'Attachment understanding',
            formatAttachmentUnderstanding({
              lang,
              kind: session.lastAttachmentKind || 'share',
              digest: prior,
              riskRelated: attachmentLooksRiskRelated(prior),
              userAsk: userCaption || workingText,
            }),
            'blue',
          ),
        }
      }
      return {
        card: simpleCard(
          lang === 'zh-Hans' ? '文档读取' : lang === 'zh-Hant' ? '文檔讀取' : 'Doc read',
          sharedDocReadReply(lang),
          'blue',
        ),
      }
    }
    return handleWikiAsk(lang, workingText, msg.openId)
  }

  // User asks for admin/DB/prod/secrets the bot cannot reach → contact @Yan Haixiang.
  // Only skip when this is a long alert paste that also happens to mention admin/DB.
  const accessAsk = needsInaccessibleAccess(workingText)
  const looksLikeLongAlertPaste =
    workingText.length > 200 &&
    /告警|报警|報警|\balert\b|\bseverity\b|剔除|偏差|无有效源|無有效源|\bbps\b/i.test(workingText)
  if (accessAsk && !looksLikeLongAlertPaste) {
    const title =
      lang === 'zh-Hans' ? '无法访问' : lang === 'zh-Hant' ? '無法訪問' : 'Access unavailable'
    return { card: simpleCard(title, accessUnavailableReply(lang), 'orange') }
  }

  if (intent === 'market') {
    // Match the user's current session language — 简体 / 繁體 / en are distinct.
    const marketLang = resolveMarketLang(session.preferredLang || lang)
    const snap = await fetchMarketSnapshot()
    const base = formatMarketAnswer(snap, marketLang, workingText)
    // Structured hourly card mirrors the web desk — only LLM-enrich when the user asked a free-form market question.
    const bareMarket = /^(market|markets|行情|市况|市況|趋势|趨勢|gold|xau|xauusd)$/i.test(
      workingText.trim(),
    )
    const llm = bareMarket
      ? null
      : await enrichWithLlm({
          lang: marketLang,
          question: workingText,
          context: base,
        })
    return {
      card: await buildMarketCard({
        title: hourlyMarketTitle(marketLang),
        snap,
        lang: marketLang,
        question: workingText,
        mode: 'hourly',
        appendix: llm ? `---\n${llm}` : '',
        template: 'wathet',
      }),
    }
  }

  if (intent === 'review') {
    const incidents = await listIncidentsDurable({ limit: 50 })
    return { card: reviewCard({ lang, incidents }) }
  }

  if (intent === 'clear_review') {
    return handleClearReviewCommand({
      openId: realOpenId,
      chatId: msg.chatId,
      lang,
      confirmed: isClearReviewConfirmCommand(workingText),
    })
  }

  if (intent === 'skills') {
    return { card: skillsCatalogCard({ lang, skills: loadSkills() }) }
  }

  if (intent === 'knowledge') {
    return { card: knowledgeCatalogCard({ lang, knowledge: loadKnowledge() }) }
  }

  if (intent === 'alert_optimize') {
    return { card: alertOptimizeCard(lang) }
  }

  // After catalogue: user replies with a node ID → open that Skills / KB entry
  if (looksLikeNodeIdReply(workingText)) {
    const node = resolveNodeById(workingText)
    if (node) {
      return {
        card: nodeDetailCard({
          lang,
          kind: node.kind,
          id: node.id,
          title: node.title,
          body: node.body,
        }),
      }
    }
  }

  // Persist every user turn that belongs to (or starts) an investigation case.
  const shouldLogInteraction =
    session.mode === 'investigate' ||
    session.mode === 'report_draft' ||
    intent === 'investigate' ||
    intent === 'followup' ||
    intent === 'inv_report' ||
    intent === 'archive' ||
    isStepDoneCommand(workingText)
  if (shouldLogInteraction && workingText.trim()) {
    pushInteraction(session, {
      role: 'user',
      kind: classifyUserInteractionKind(workingText),
      text: workingText,
      messageId: inbound.messageId,
    })
    await saveSessionDurable(inbound.chatId, inbound.openId, session)
  }

  if (intent === 'weekly') {
    const report = buildWeeklyReport(await listIncidentsDurable({ status: 'all', limit: 200 }), Date.now(), lang)
    return { card: weeklyReportCard(report.markdown, report.empty) }
  }

  if (intent === 'oscillation') {
    const { evaluateOscillation, buildOscillationStatusCard } = await import(
      './oscillationAlert.js'
    )
    const snap = await evaluateOscillation({ demo: false })
    return { card: buildOscillationStatusCard(snap, lang) }
  }

  if (intent === 'daily_market') {
    const { readDurableJson } = await import('./durableJson.js')
    const {
      buildMarketCard,
      dailyMarketTitle,
      fetchMarketSnapshot,
      shanghaiDayKey,
    } = await import('./market.js')
    const { shanghaiHm } = await import('./oscillationAlert.js')
    const dayKey = shanghaiDayKey(Date.now())
    const hm = shanghaiHm(Date.now())
    const sentMap =
      (await readDurableJson<Record<string, number>>('market-daily-sent.json')) || {}
    const alreadySent = Boolean(sentMap[dayKey])
    const statusBits =
      lang === 'zh-Hans'
        ? [
            '📌 **触发机制**',
            '• 东八区每天 **09:00**（UTC 01:00）cron 自动推送到指定群',
            '• 内容：过去 **24 小时** 行情摘要',
            '• 你发「每日 24h 早报」= **即时预览**（不会因此再推群）',
            '',
            `• **今日 ${dayKey} · 东八区 ${hm}**`,
            alreadySent
              ? '• **今日推送：** 已发送（同日不重复）'
              : hm < '09:00'
                ? '• **今日推送：** 尚未到 09:00，等 cron'
                : '• **今日推送：** 尚未记录已发送',
            '',
          ].join('\n')
        : lang === 'zh-Hant'
          ? [
              '📌 **觸發機制**',
              '• 東八區每天 **09:00**（UTC 01:00）cron 自動推送到指定群',
              '• 內容：過去 **24 小時** 行情摘要',
              '• 你發「每日 24h 早報」= **即時預覽**（不會因此再推群）',
              '',
              `• **今日 ${dayKey} · 東八區 ${hm}**`,
              alreadySent
                ? '• **今日推送：** 已發送（同日不重複）'
                : hm < '09:00'
                  ? '• **今日推送：** 尚未到 09:00'
                  : '• **今日推送：** 尚未記錄已發送',
              '',
            ].join('\n')
          : [
              '📌 **Trigger mechanism**',
              '• Cron pushes the group daily at **09:00 Asia/Shanghai** (01:00 UTC)',
              '• Content: past-**24h** market digest',
              '• This command = **live preview** (does not re-push the group)',
              '',
              `• **Today ${dayKey} · Asia/Shanghai ${hm}**`,
              alreadySent
                ? '• **Today’s push:** already sent (idempotent)'
                : hm < '09:00'
                  ? '• **Today’s push:** waiting for 09:00 cron'
                  : '• **Today’s push:** not marked sent yet',
              '',
            ].join('\n')
    const snap = await fetchMarketSnapshot()
    return {
      card: await buildMarketCard({
        title: dailyMarketTitle(lang),
        snap,
        lang,
        mode: 'daily',
        intro: statusBits,
        template: 'blue',
        question: lang === 'en' ? 'daily 24h' : '每日 24h 早报',
      }),
    }
  }

  if (intent === 'inv_report') {
    return replyProceedInvestigationReport({
      session,
      lang,
      chatId: inbound.chatId,
      openId: inbound.openId,
      messageId: inbound.messageId,
    })
  }

  if (intent === 'archive') {
    // While still investigating, "done" ends the case and generates the full report first.
    if (session.mode === 'investigate') {
      return replyProceedInvestigationReport({
        session,
        lang,
        chatId: inbound.chatId,
        openId: inbound.openId,
        messageId: inbound.messageId,
      })
    }
    return handleCardAction({
      openId: msg.openId,
      chatId: msg.chatId,
      messageId: msg.messageId,
      value: { action: 'archive', incidentId: session.lastReportId || '' },
    })
  }

  // Text alternative to card “已完成” (works without Lark Card Request URL)
  if (isStepDoneCommand(workingText) && session.mode === 'investigate') {
    return handleCardAction({
      openId: msg.openId,
      chatId: msg.chatId,
      messageId: msg.messageId,
      value: {
        action: 'guide_step_done',
        stepId: session.pathSteps?.[session.pathStepIndex ?? 0]?.id || '',
        incidentId: session.lastReportId || '',
      },
    })
  }

  // Escalatee DM: fold their reply into the operator's investigation timeline.
  if (inbound.openId) {
    const escPending = await getEscalationPending(inbound.openId)
    if (
      escPending &&
      (escPending.operatorOpenId !== inbound.openId ||
        escPending.operatorChatId !== inbound.chatId)
    ) {
      const escText = workingText
        .replace(/\[(forwarded_card|merge_forward|replied_alert)\]\s*/gi, '')
        .trim()
      const ingested = await ingestEscalateeFeedback({
        escalateeOpenId: inbound.openId,
        escalateeChatId: inbound.chatId,
        messageId: inbound.messageId,
        text: escText || workingText,
      })
      if (ingested) return ingested
    }
  }

  // After 补充信息: next message is free evidence (does not auto-complete the step).
  if (session.mode === 'investigate' && session.stepAwaiting === 'supplement') {
    const awaitingText = workingText
      .replace(/\[(forwarded_card|merge_forward|replied_alert)\]\s*/gi, '')
      .trim()
    return ingestSupplementEvidence({
      msg: inbound,
      lang,
      session,
      text: awaitingText || workingText,
    })
  }

  // After Done / required-Skip / Escalate: next user message is evidence, skip reply, or feedback.
  if (
    session.mode === 'investigate' &&
    (session.stepAwaiting === 'evidence' ||
      session.stepAwaiting === 'required_skip_reply' ||
      session.stepAwaiting === 'escalate_feedback')
  ) {
    const awaitingText = workingText
      .replace(/\[(forwarded_card|merge_forward|replied_alert)\]\s*/gi, '')
      .trim()
    const kind =
      session.stepAwaiting === 'evidence'
        ? 'evidence'
        : session.stepAwaiting === 'escalate_feedback'
          ? 'escalate_feedback'
          : 'required_skip_reply'
    return advanceGuideAfterUserInput({
      msg: inbound,
      lang,
      session,
      text: awaitingText || workingText,
      kind,
    })
  }

  if (intent === 'investigate' || intent === 'followup') {
    // Strip command prefix — bare "investigate"/"排查" with no details should not open a report card.
    // Also drop the parse-time `[forwarded_card]` marker so report titles stay clean.
    // `\b` does not work after CJK — mirror COMMAND_INVESTIGATE (CMD_END).
    const explicitNewCase = /^(?:investigate\b|排查|开始排查|開始排查)(?:\s|$|[：:])/i.test(
      workingText.trim(),
    )
    const fact = workingText
      .replace(/^(investigate|排查|開始排查|开始排查)\s*/i, '')
      .replace(/\[(forwarded_card|merge_forward|replied_alert)\]\s*/gi, '')
      .trim()
    // Text command while gathering → same as tapping 开始分析.
    if (
      session.mode === 'gather_alerts' &&
      /^(开始分析|開始分析|start\s*analysis|start\s*investigat)/i.test(fact)
    ) {
      return runInvestigation({
        msg: inbound,
        lang,
        newFact: '',
        fromGather: true,
      })
    }
    // Explicit「排查 / investigate」while mid-case → close as 无风险, then gather
    // (ask「还有其他告警吗」). Do not resume at step 7/13 of the abandoned path.
    if (session.mode === 'investigate' && explicitNewCase) {
      await closeIncidentAsInvestigatedNoRisk({
        incidentId: session.lastReportId,
        openId: inbound.openId,
        reason: 'explicit_new_investigate',
      })
      session.lastReportId = undefined
      session.lastReportMarkdown = undefined
      session.facts = session.facts.filter((f) => f.startsWith('[chat-history]'))
      session.interactions = []
      session.checkedSteps = []
      session.pathSteps = undefined
      session.pathStepIndex = undefined
      session.stepAwaiting = 'none'
      session.pendingPrompt = undefined
      session.escalation = undefined
      session.mode = 'idle'
      await saveSessionDurable(inbound.chatId, inbound.openId, session)
      if (!fact) {
        const title =
          lang === 'zh-Hans' ? '开始排查' : lang === 'zh-Hant' ? '開始排查' : 'Start investigation'
        const body =
          lang === 'zh-Hans'
            ? [
                '上一次排查已结束（排查过 · 无风险）。',
                '',
                '请粘贴新的告警原文／截图／表格；收集后会先问你还有没有更多告警，再开始分析。',
              ].join('\n')
            : lang === 'zh-Hant'
              ? [
                  '上一次排查已結束（排查過 · 無風險）。',
                  '',
                  '請貼上新的告警原文／截圖／表格；收集後會先問你還有沒有更多告警，再開始分析。',
                ].join('\n')
              : [
                  'Previous case closed (investigated · no risk).',
                  '',
                  'Paste a new alert / screenshot / table. I’ll ask if there are more before analysis.',
                ].join('\n')
        return { card: simpleCard(title, body, 'wathet') }
      }
      return replyAlertGather({
        msg: inbound,
        lang,
        session,
        newFact: fact,
        freshCase: true,
      })
    }
    if (!fact) {
      if (session.mode === 'gather_alerts' && session.facts.some((f) => !f.startsWith('[chat-history]'))) {
        return {
          card: alertGatherCard({
            lang,
            alerts: session.facts.filter((f) => !f.startsWith('[chat-history]')),
            chatId: inbound.chatId,
            chatType: inbound.chatType,
          }),
        }
      }
      const title =
        lang === 'zh-Hans' ? '开始排查' : lang === 'zh-Hant' ? '開始排查' : 'Start investigation'
      const body =
        lang === 'zh-Hans'
          ? [
              '请先说明要排查的问题，例如：',
              '',
              '• 粘贴告警原文／截图／表格',
              '• 或简述：合约、指标、阈值、时间、现象',
              '',
              '_发 **investigate** + 内容，或直接贴告警即可。_',
            ].join('\n')
          : lang === 'zh-Hant'
            ? [
                '請先說明要排查的問題，例如：',
                '',
                '• 貼上告警原文／截圖／表格',
                '• 或簡述：合約、指標、閾值、時間、現象',
                '',
                '_發 **investigate** + 內容，或直接貼告警即可。_',
              ].join('\n')
            : [
                'Please specify the issue first, for example:',
                '',
                '• Paste the alert text / screenshot / table',
                '• Or briefly: contract, metric, threshold, time, symptom',
                '',
                '_Send **investigate** + details, or just paste the alert._',
              ].join('\n')
      return { card: simpleCard(title, body, 'wathet') }
    }
    // Idle / gather: stash alert(s) and wait for 开始分析 — do not open the path yet.
    if (session.mode === 'idle' || session.mode === 'gather_alerts') {
      // Idle with leftover open case (never archived) → close as 排查过 · 无风险.
      const freshCase =
        session.mode === 'idle' && Boolean(session.lastReportId)
      return replyAlertGather({
        msg: inbound,
        lang,
        session,
        newFact: fact,
        freshCase,
      })
    }
    return runInvestigation({
      msg: inbound,
      lang,
      newFact: fact,
    })
  }

  // general_risk — answer the user's question (FAQ / RAG / LLM); never dump greeting
  const replyTitle =
    lang === 'zh-Hans' ? '风险助手回复' : lang === 'zh-Hant' ? '風險助手回覆' : 'Risk assistant reply'
  const chatTitle = lang === 'zh-Hans' || lang === 'zh-Hant' ? '聊聊' : 'Chat'

  // Capabilities / cron / admin FAQ first — never LLM stub or web-search
  const caps = botCapabilitiesReply(lang, workingText)
  if (caps) {
    return { card: simpleCard(chatTitle, caps, 'blue') }
  }
  const runtimeMeta = botRuntimeMetaReply(lang, workingText)
  if (runtimeMeta) {
    return { card: simpleCard(chatTitle, runtimeMeta, 'blue') }
  }
  const meta = botMetaReply(lang, workingText)
  if (meta) {
    return { card: simpleCard(replyTitle, meta, 'blue') }
  }

  // Clock / timezone common knowledge — never search or “说具体一点” stub
  {
    const timeReply = nowTimeReply(lang, workingText)
    if (timeReply) {
      return { card: simpleCard(chatTitle, timeReply, 'blue') }
    }
    const tzReply = timezoneReply(lang, workingText)
    if (tzReply) {
      return { card: simpleCard(chatTitle, tzReply, 'blue') }
    }
  }

  // Pure chat / life Q — semantic LLM reply; no capability / command templates
  if (looksLikePureChat(workingText) || isCasualChat(workingText)) {
    const wantName = /^(我是谁|我是誰|who\s+am\s+i|whoami|我叫什么|我叫什麼|你知道我是谁吗|你知道我是誰嗎)/i.test(
      workingText.trim(),
    )
    const displayName = wantName ? await fetchUserDisplayName(msg.openId) : null
    // Prefer LLM semantic chat; only use tiny identity/thanks canned lines if LLM misses
    const llmChat = await answerWithLlmRetry({
      lang,
      question: workingText,
      context: [
        'CHAT / Q&A MODE — there is no desk instruction to run.',
        'Read the user’s meaning and reply naturally like a warm teammate (1–3 short beats).',
        'If they ask what to eat, suggest 2–3 options and ask a preference — do not dump a fixed menu of bot capabilities.',
        'If they ask the current time, say Asia/Shanghai wall clock — never web-search for “意思/time”.',
        'If their ask is unclear, ask ONE short clarifying question about THAT topic — never a 闲聊/行情/告警 checklist.',
        'FORBIDDEN: “I can also chat”, “say whatever”, “risk is my specialty but…”, command menus, investigate/market dumps.',
        'Do NOT search the web unless they clearly ask for news/facts.',
        displayName ? `Their Feishu display name is ${displayName}.` : '',
      ]
        .filter(Boolean)
        .join('\n'),
      temperature: 0.75,
    })
    if (llmChat) {
      return { card: simpleCard(chatTitle, llmChat, 'blue') }
    }
    const casual = casualChatReply(lang, workingText, displayName)
    if (casual) {
      return { card: simpleCard(chatTitle, casual, 'blue') }
    }
    // Factual-ish chat ask + LLM miss → search before last-resort clarify
    // Never search clock / banter / pure chat soft misses (「我意思时间」→ band wiki).
    if (
      !isCasualBanter(workingText) &&
      !looksLikeNowTimeQuestion(workingText) &&
      !looksLikeTimezoneQuestion(workingText) &&
      shouldAutoWebSearch(workingText)
    ) {
      const searched = await searchWeb(workingText, lang)
      if (searched.hits.length) {
        const llm = usableLlmReply(
          await enrichWithLlm({
            lang,
            question: workingText,
            context: [
              'CHAT + SEARCH — answer from hits in a warm conversational tone.',
              'Do NOT dump command menus. Cite 📎 sources with the provided URLs only.',
              webSearchContext(searched),
            ].join('\n\n'),
            temperature: 0.5,
          }),
        )
        if (llm) {
          const hasSources = /📎|\*\*数据源\*\*|\*\*資料來源\*\*|\*\*Sources\*\*|wikipedia\.org/i.test(llm)
          const footer = hasSources ? '' : `\n\n---\n${formatSourcesFooter(lang, searched.hits)}`
          return { card: simpleCard(chatTitle, `${llm}${footer}`, 'blue') }
        }
        return {
          card: simpleCard(chatTitle, formatWebSearchAnswer(lang, workingText, searched), 'blue'),
        }
      }
    }
    return { card: simpleCard(chatTitle, chatbotFallbackReply(lang, workingText), 'blue') }
  }

  const incidentish = looksLikeIncidentEvidence(workingText)
  const { hits, kb, severity } = retrieveRag(workingText)
  const quoteOps = incidentish ? await fetchQuoteOpsRag(workingText) : null

  if (incidentish) {
    const ragBody = formatRagAnswer({
      lang,
      question: workingText,
      hits,
      kb,
      severity,
      quoteOps,
    })
    const context = [
      `severity=${severity}`,
      `skills=${hits.map((h) => `${h.id}|${h.check}|${h.action}`).join('\n')}`,
      `kb=${kb.map((k) => `${k.title}: ${k.body.slice(0, 1200)}`).join('\n')}`,
      quoteOps ? `QUOTE_OPS_RAG:\n${quoteOps}` : '',
      'Answer helpfully. Prefer V Exchange perpetual KB; ignore CFD. Format with emoji headers and bold-keyword bullets.',
    ]
      .filter(Boolean)
      .join('\n\n')
    const llm = await enrichWithLlm({ lang, question: workingText, context })
    const body = llm ? `${llm}\n\n---\n${ragBody}` : ragBody
    return { card: simpleCard(replyTitle, body) }
  }

  // Normal / “random” Q&A: answer first; only attach highly relevant KB (never dump weak hits)
  const relevantKb = pickRelevantKb(workingText, kb)

  // No local KB → chat / search (never banter like「我帅不」→ scandal wiki; negative-list already handled)
  if (!relevantKb.length) {
    if (isCasualBanter(workingText)) {
      // Engage the banter — do NOT open web search (帅≠彭帅)
      const llmBanter = await answerWithLlmRetry({
        lang,
        question: workingText,
        context:
          'Friendly banter / small talk. Reply warmly in 1–2 short beats. Do NOT search the web. Do NOT dump risk command menus or three-way 闲聊/行情/告警 menus.',
        temperature: 0.7,
      })
      const banter =
        llmBanter ||
        casualChatReply(lang, workingText) ||
        (lang === 'zh-Hans'
          ? '😄 挺帅的呀——自信加一分。想继续贫两句随时来。'
          : lang === 'zh-Hant'
            ? '😄 挺帥的呀——自信加一分。想繼續貧兩句隨時來。'
            : '😄 Looking good — confidence +1. Keep the banter coming.')
      return { card: simpleCard(replyTitle, banter, 'blue') }
    }
    if (!shouldAutoWebSearch(workingText)) {
      // Short free-text — chat first; retry LLM; then casual / clarify.
      // Do NOT soft-search here:「我意思时间」etc. get hijacked by unrelated wiki hits.
      const llmSoft = await answerWithLlmRetry({
        lang,
        question: workingText,
        context: [
          'Free-text question or chat — no desk command was issued.',
          'Analyze meaning and reply naturally. ANSWER if you can; if unclear, ask ONE clarifying question on their topic.',
          'If they ask the current time, give Asia/Shanghai wall clock — never search the web for 意思/time.',
          'Never a 闲聊/行情/告警 menu, never a fixed capability checklist, never “I can also chat” meta.',
          'Specialty is V Exchange risk, but casual chat is welcome. Do not invent news or secrets.',
        ].join('\n'),
        temperature: 0.65,
      })
      if (llmSoft) {
        return { card: simpleCard(replyTitle, llmSoft, 'blue') }
      }
      const softCasual = casualChatReply(lang, workingText)
      if (softCasual) {
        return { card: simpleCard(replyTitle, softCasual, 'blue') }
      }
      return {
        card: simpleCard(replyTitle, chatbotFallbackReply(lang, workingText), 'blue'),
      }
    }
    const searched = await searchWeb(workingText, lang)
    if (searched.hits.length) {
      const searchCtx = [
        'This is a normal product / risk Q&A — NOT an incident investigation.',
        'Local knowledge base had no high-relevance hit — you are in SEARCH MODE.',
        'Answer the user question directly from the search hits below, in a warm conversational tone.',
        'Do NOT say that the knowledge base had no match. Do NOT dump command menus or three-way menus.',
        'End with an explicit 📎 **数据源** / **Sources** section listing the provided URLs as markdown links. Never invent URLs.',
        'Prefer V Exchange perpetual framing when relevant; ignore CFD broker pricing.',
        webSearchContext(searched),
      ].join('\n\n')
      const llm = usableLlmReply(
        await enrichWithLlm({
          lang,
          question: workingText,
          context: searchCtx,
          temperature: 0.45,
        }),
      )
      if (llm) {
        const hasSources = /📎|\*\*数据源\*\*|\*\*資料來源\*\*|\*\*Sources\*\*|wikipedia\.org/i.test(llm)
        const footer = hasSources ? '' : `\n\n---\n${formatSourcesFooter(lang, searched.hits)}`
        return { card: simpleCard(replyTitle, `${llm}${footer}`, 'blue') }
      }
      return {
        card: simpleCard(replyTitle, formatWebSearchAnswer(lang, workingText, searched), 'blue'),
      }
    }
    // Search empty too — still chat / answer; avoid “no KB” wording
    const llmFallback = await answerWithLlmRetry({
      lang,
      question: workingText,
      context: [
        'Normal Q&A or casual chat. No local KB hit and web search returned nothing usable.',
        'Answer briefly from general public knowledge if you can; otherwise ask ONE clarifying question about their topic.',
        'Do NOT mention knowledge-base miss. Do NOT dump command menus. Do NOT refuse as offtopic.',
      ].join('\n'),
      temperature: 0.55,
    })
    if (llmFallback) {
      return { card: simpleCard(replyTitle, llmFallback, 'blue') }
    }
    return {
      card: simpleCard(replyTitle, formatWebSearchAnswer(lang, workingText, searched), 'blue'),
    }
  }

  const qaContext = [
    'This is a normal product / risk Q&A — NOT an incident investigation.',
    'Do NOT invent severity, Skills checklists, or RCA steps unless the user pasted an alert.',
    'Answer warmly and conversationally in short paragraphs — like a helpful teammate, not a command menu.',
    'Do NOT list knowledge / investigate / market / help as a fallback checklist unless the user asked for commands.',
    'Prefer V Exchange perpetual knowledge when relevant; ignore CFD broker pricing.',
    'Light emoji section headers + bold-keyword bullets are OK when structuring a real answer.',
    `Highly relevant KB (optional support only):\n${relevantKb
      .map((k) => `${k.title}: ${k.body.slice(0, 900)}`)
      .join('\n')}`,
  ].join('\n\n')
  const llm = await answerWithLlmRetry({
    lang,
    question: workingText,
    context: qaContext,
    temperature: 0.55,
  })
  if (llm) {
    const support = `\n\n---\n${formatSoftKbAnswer(lang, workingText, relevantKb, true)}`
    return { card: simpleCard(replyTitle, `${llm}${support}`, 'blue') }
  }
  return {
    card: simpleCard(replyTitle, formatSoftKbAnswer(lang, workingText, relevantKb, false), 'blue'),
  }
}

function formatSourcesFooter(
  lang: Lang,
  hits: { title: string; url: string; source?: string }[],
): string {
  const header =
    lang === 'zh-Hans' ? '📎 **数据源**' : lang === 'zh-Hant' ? '📎 **資料來源**' : '📎 **Sources**'
  const lines = [header]
  for (const h of hits.slice(0, 4)) {
    const label = h.source ? `${h.title} · ${h.source}` : h.title
    lines.push(`• [${label}](${h.url})`)
  }
  return lines.join('\n')
}

/** Meta / ops-principle docs — only keep when the user asked about the KB itself. */
const META_KB_TITLE =
  /使用原则|使用原則|knowledge base principles|audience|ai duties|read-only limits|证据等级|證據等級/i

/** Keep only KB hits that are actually about the question (avoid random excerpt dumps). */
function pickRelevantKb(
  question: string,
  kb: { id: string; title: string; body: string; score: number }[],
): { id: string; title: string; body: string; score: number }[] {
  const q = question.toLowerCase()
  const askingAboutKb = /知识库|知識庫|knowledge|使用原则|使用原則|skills?|rag/.test(q)
  const stop = new Set([
    '知识库',
    '知識庫',
    'knowledge',
    'skill',
    'skills',
    've',
    'v',
    'exchange',
    '什么是',
    '什麼是',
    '什么',
    '什麼',
    '怎么',
    '怎麼',
    '如何',
    '请问',
    '請問',
    '有哪些',
    '哪些',
    '一下',
  ])
  // Use bi/trigram tokenize so「可能出现的风险有哪些」still overlaps title「可能出现的风险」
  const qTokens = tokenize(question).filter((t) => t.length >= 2 && !stop.has(t))
  return kb
    .filter((k) => {
      if (k.score < 8) return false
      if (!askingAboutKb && META_KB_TITLE.test(k.title)) return false
      const title = k.title.toLowerCase()
      const bodyHead = k.body.slice(0, 320).toLowerCase()
      const titleHit = qTokens.some((t) => t.length >= 2 && title.includes(t))
      const strongTitleHit = qTokens.some((t) => t.length >= 4 && title.includes(t))
      const bodyPhraseHit = qTokens.some((t) => t.length >= 3 && bodyHead.includes(t))
      if (strongTitleHit) return true
      if (titleHit && k.score >= 10) return true
      // Very strong RAG score + body phrase — still never meta principles for unrelated Q
      return k.score >= 20 && bodyPhraseHit && qTokens.length > 0
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 2)
}

/** Soft KB-only block for normal Q&A (no Skills / no severity). */
function formatSoftKbAnswer(
  lang: Lang,
  question: string,
  kb: { title: string; body: string }[],
  asSupportOnly: boolean,
): string {
  if (!kb.length) {
    if (asSupportOnly) return ''
    if (lang === 'zh-Hans') {
      return [
        '🙂 这个问题我这边没有特别贴切的现成摘录。',
        '',
        '你可以换个说法再问我；产品／权限找 **@Yan Haixiang**，或者直接贴一条告警，我帮你一起看。',
      ].join('\n')
    }
    if (lang === 'zh-Hant') {
      return [
        '🙂 這個問題我這邊沒有特別貼切的現成摘錄。',
        '',
        '你可以換個說法再問我；產品／權限找 **@Yan Haixiang**，或者直接貼一條告警，我幫你一起看。',
      ].join('\n')
    }
    return [
      '🙂 I don’t have a closely matching excerpt for that.',
      '',
      'Try rephrasing; for product / access ask **@Yan Haixiang**, or paste an alert and I’ll dig in with you.',
    ].join('\n')
  }
  const lines: string[] = []
  if (lang === 'zh-Hans') {
    lines.push(asSupportOnly ? '📎 **参考摘录**' : '📖 **相关知识摘录**', '')
  } else if (lang === 'zh-Hant') {
    lines.push(asSupportOnly ? '📎 **參考摘錄**' : '📖 **相關知識摘錄**', '')
  } else {
    lines.push(asSupportOnly ? '📎 **Supporting excerpts**' : '📖 **Related knowledge**', '')
  }
  for (const k of kb.slice(0, 2)) {
    const excerpt = k.body.replace(/\s+/g, ' ').trim().slice(0, 220)
    lines.push(`• **${k.title}**`)
    lines.push(`  ${excerpt}${k.body.length > 220 ? '…' : ''}`)
  }
  return lines.join('\n')
}
