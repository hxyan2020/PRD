import { downloadMessageImage, fetchUserDisplayName } from './client.js'
import {
  greetingCard,
  helpCard,
  incidentDetailCard,
  investigationCard,
  knowledgeCatalogCard,
  nodeDetailCard,
  reviewCard,
  riskVerdictPromptCard,
  simpleCard,
  skillsCatalogCard,
} from './cards.js'
import {
  normalizeRiskVerdict,
  riskVerdictEmoji,
  riskVerdictLabel,
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
  isStubMenuReply,
  classifyIntent,
  commandConfirmPrompt,
  detectLang,
  greetingReply,
  helpReply,
  isCasualBanter,
  isCasualChat,
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
  clearSessionDurable,
  ensureSessionInteractions,
  getIncidentDurable,
  getSessionDurable,
  listIncidentsDurable,
  newIncidentId,
  saveSessionDurable,
  upsertIncidentDurable,
} from './store.js'
import type {
  BotReply,
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
    ? byAlertName
      ? args.hits
          .slice(0, 2)
          .map((h) => `${h.id}「${h.name}」`)
          .join(' · ')
      : args.hits
          .slice(0, 4)
          .map((h) => h.id)
          .join(', ')
    : hans
      ? '无自信匹配'
      : hant
        ? '無自信匹配'
        : 'no confident match'
  const kbLine = args.kb.length
    ? args.kb
        .map((k) => k.title)
        .slice(0, 3)
        .join(', ')
    : hans
      ? '无'
      : hant
        ? '無'
        : 'none'
  const skillLabel = byAlertName
    ? hans
      ? '告警名确定命中'
      : hant
        ? '告警名確定命中'
        : 'alert-name match'
    : 'Skills'
  const coveredBits = (args.newlyCovered || [])
    .slice(0, 3)
    .map((s) => s.replace(/^(\[[^\]]+\]|【[^】]+】)\s*/, '').slice(0, 36))
  const coveredLine = coveredBits.length
    ? hans
      ? `• **本轮已覆盖（证据乱序也认）：** ${coveredBits.join('；')}`
      : hant
        ? `• **本輪已覆蓋（證據亂序也認）：** ${coveredBits.join('；')}`
        : `• **Covered this turn (order-agnostic):** ${coveredBits.join('; ')}`
    : ''
  const guide = args.reordered
    ? hans
      ? '• **指引：** 你这次证据不按 Skill 顺序——我已**重排下一步**，先跟你刚提供的线索'
      : hant
        ? '• **指引：** 你這次證據不按 Skill 順序——我已**重排下一步**，先跟你剛提供的線索'
        : '• **Guidance:** Evidence arrived out of Skill order — I **re-ranked next steps** around what you just pasted'
    : args.adapted
      ? hans
        ? '• **指引：** 排查路径已依你最新证据调整；请继续回复结果或贴下一块证据（不必按顺序）'
        : hant
          ? '• **指引：** 排查路徑已依你最新證據調整；請繼續回覆結果或貼下一塊證據（不必按順序）'
          : '• **Guidance:** Path adapted to your latest evidence — reply with findings or the next chunk (any order)'
      : hans
        ? '• **指引：** 请回复排查结果或贴新证据（不必按 Skill 顺序），我会每次重排路径'
        : hant
          ? '• **指引：** 請回覆排查結果或貼新證據（不必按 Skill 順序），我會每次重排路徑'
          : '• **Guidance:** Reply with findings or new evidence in any order — I’ll re-rank the path each turn'
  if (hans) {
    return [
      '📋 **摘要**',
      '',
      `• **已摄入事实／证据：** **${args.facts.length}**`,
      `• **${skillLabel}：** **${hitLine}** · 知识库 **${kbLine}**（文末可点开）`,
      '• **证据分级：** **已证实** / **假设** / **未排除** — [OBS] [DESIGN] [PUBLIC] [TBC] [INCIDENT]',
      coveredLine,
      guide,
    ]
      .filter(Boolean)
      .join('\n')
  }
  if (hant) {
    return [
      '📋 **摘要**',
      '',
      `• **已攝入事實／證據：** **${args.facts.length}**`,
      `• **${skillLabel}：** **${hitLine}** · 知識庫 **${kbLine}**（文末可點開）`,
      '• **證據分級：** **已證實** / **假設** / **未排除** — [OBS] [DESIGN] [PUBLIC] [TBC] [INCIDENT]',
      coveredLine,
      guide,
    ]
      .filter(Boolean)
      .join('\n')
  }
  return [
    '📋 **Summary**',
    '',
    `• **Facts ingested:** **${args.facts.length}**`,
    `• **${skillLabel}:** **${hitLine}** · Knowledge **${kbLine}** (links at end)`,
    '• **Evidence grades:** **Confirmed** / **Suspected** / **Unknown** — [OBS] [DESIGN] [PUBLIC] [TBC] [INCIDENT]',
    coveredLine,
    guide,
  ]
    .filter(Boolean)
    .join('\n')
}

/**
 * Skills-first investigate body (no free reasoning).
 * Causes stay short; check = 排查链路; action = 决策分支 — only Skill text + adaptive NEXT/COVERED.
 */
function formatInvestigateCore(args: {
  lang: Lang
  hits: { id: string; name: string; check: string; action: string }[]
  kb: { title: string }[]
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
    for (const h of args.hits.slice(0, 4)) {
      lines.push(
        hans || hant
          ? `• **假设／待核实：** 命中场景 **${h.id} · ${h.name}**（以告警字段与后管数据核实；结论以 Skill 为准）`
          : `• **Suspected / to verify:** matched **${h.id} · ${h.name}** (confirm with alert fields + admin; Skill is source of truth)`,
      )
    }
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
  lines.push('')
  lines.push(
    hans
      ? '🧭 **排查路径（按 Skill.check · 下一步优先）**'
      : hant
        ? '🧭 **排查路徑（按 Skill.check · 下一步優先）**'
        : '🧭 **Investigation path (Skill.check · next first)**',
  )
  if (args.nextSteps?.length) {
    for (const s of args.nextSteps.slice(0, 4)) lines.push(`• ${s}`)
  } else if (args.hits.length) {
    for (const h of args.hits.slice(0, 3)) {
      lines.push(`• **${h.id} · ${h.name}**`)
      const steps = splitSkillSteps(h.check)
      for (const step of steps.length ? steps : [h.check]) {
        lines.push(`  - ${step}`)
      }
    }
  } else {
    lines.push(
      hans
        ? '• 先核对 Index／Mark／Funding／盘口时间戳与告警原文一致性'
        : hant
          ? '• 先核對 Index／Mark／Funding／盤口時間戳與告警原文一致性'
          : '• First reconcile Index / Mark / Funding / book timestamps with the alert text',
    )
  }
  if (args.covered?.length && !args.newlyCovered?.length) {
    lines.push('')
    lines.push(
      hans
        ? `_已覆盖 ${args.covered.length} 步（证据可乱序）_`
        : hant
          ? `_已覆蓋 ${args.covered.length} 步（證據可亂序）_`
          : `_Covered ${args.covered.length} step(s) (any order OK)_`,
    )
  }
  lines.push('')
  lines.push(hans ? '🌿 **决策分支（Skill.action 原文）**' : hant ? '🌿 **決策分支（Skill.action 原文）**' : '🌿 **Decision branches (Skill.action verbatim)**')
  if (args.hits.length) {
    for (const h of args.hits.slice(0, 3)) {
      lines.push(`• **${h.id}**`)
      const steps = splitSkillSteps(h.action)
      for (const step of steps.length ? steps : [h.action]) {
        lines.push(`  - ${step}`)
      }
    }
  } else {
    lines.push(
      hans
        ? '• 字段不足时先补齐告警原文，再决定观察／升级／归档'
        : hant
          ? '• 欄位不足時先補齊告警原文，再決定觀察／升級／歸檔'
          : '• If fields are missing, gather alert text first, then choose watch / escalate / close',
    )
  }
  lines.push('')
  lines.push(
    hans
      ? '_有疑问或不解时直接问我（例如「为什么要看后管」）——那时才会启用推理与业务说明。_'
      : hant
        ? '_有疑問或不解時直接問我（例如「為什麼要看後管」）——那時才會啟用推理與業務說明。_'
        : '_Ask if anything is unclear (e.g. “why check admin?”) — reasoning unlocks only then._',
  )
  if (args.kb.length) {
    lines.push('')
    lines.push(
      hans
        ? `_知识库仅作参考：${args.kb
            .slice(0, 2)
            .map((k) => k.title)
            .join('、')}（全文见文末链接）_`
        : hant
          ? `_知識庫僅作參考：${args.kb
              .slice(0, 2)
              .map((k) => k.title)
              .join('、')}（全文見文末連結）_`
          : `_Knowledge for reference: ${args.kb
              .slice(0, 2)
              .map((k) => k.title)
              .join(', ')} (full text via end links)_`,
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
    incident.updatedAt = Date.now()
    await upsertIncidentDurable(incident)
  }
  await saveSessionDurable(args.chatId, args.openId, session)
  const title =
    lang === 'zh-Hans'
      ? '排查过程报告'
      : lang === 'zh-Hant'
        ? '排查過程報告'
        : 'Proceed-based investigation report'
  return { card: simpleCard(title, reportMd, 'blue') }
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
    skills: args.hits.map((h) => h.id),
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

async function runInvestigation(args: {
  msg: IncomingMessage
  lang: Lang
  newFact: string
  markStepDone?: boolean
}): Promise<BotReply> {
  const session = await getSessionDurable(args.msg.chatId, args.msg.openId)
  session.mode = 'investigate'
  // Questions / confusion unlock reasoning; evidence pastes stay Skills-path only.
  const questionMode =
    !args.markStepDone &&
    looksLikeInvestigationQuestion(args.newFact) &&
    !looksLikeIncidentEvidence(args.newFact)
  const userFactCountBefore = session.facts.filter((f) => !f.startsWith('[chat-history]')).length
  // Do not treat clarifying questions as investigation evidence / coverage.
  if (args.newFact.trim() && !questionMode) {
    session.facts.push(args.newFact.trim())
  }
  // First generation of a case — remind that more alerts can join this review.
  const showAddAlertHint =
    Boolean(args.newFact.trim()) &&
    !questionMode &&
    userFactCountBefore === 0 &&
    !args.markStepDone
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

  const pathPlan = planInvestigationPath({
    facts: session.facts,
    hits,
    checkedSteps: session.checkedSteps,
    lang: args.lang,
    max: 3,
    latestFact: args.newFact,
  })
  // Persist evidence-inferred coverage so out-of-order pastes stick across turns.
  for (const c of pathPlan.newlyCovered) {
    if (!session.checkedSteps.some((s) => s.toLowerCase() === c.toLowerCase())) {
      session.checkedSteps.push(c)
    }
  }
  const nextSteps = pathPlan.nextSteps
  session.pendingPrompt = nextSteps[0]
  const actions = preferredActions(hits, args.lang, 2)
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
    result: `incident:${rec.id};sev:${severity};skills:${hits.map((h) => h.id).join(',')}`,
  })

  const invTitle =
    args.lang === 'zh-Hans' || args.lang === 'zh-Hant'
      ? `排查进行中 · ${rec.title}`
      : `Investigation · ${rec.title}`
  // Traditional title variant
  const invTitleFinal =
    args.lang === 'zh-Hant' ? `排查進行中 · ${rec.title}` : invTitle

  return {
    card: investigationCard({
      lang: args.lang,
      title: invTitleFinal,
      severity,
      summary: summary + bodyExtra,
      nextSteps,
      actions,
      skills: hits.map((h) => h.id),
      knowledge: kb.map((k) => k.title),
      incidentId: rec.id,
      riskVerdict: rec.riskVerdict,
      showAddAlertHint,
    }),
  }
}

export async function handleCardAction(args: {
  openId: string
  chatId: string
  messageId: string
  value: Record<string, unknown>
}): Promise<BotReply> {
  const action = String(args.value.action || '')
  const incidentId = String(args.value.incidentId || '')
  const session = await getSessionDurable(args.chatId, args.openId)
  const lang: Lang = session.preferredLang || 'en'
  const fakeMsg: IncomingMessage = {
    messageId: args.messageId,
    chatId: args.chatId,
    chatType: 'p2p',
    openId: args.openId,
    messageType: 'interactive',
    text: '',
    mentionedBot: true,
    rawContent: '',
  }

  if (action === 'review') {
    const incidents = await listIncidentsDurable({ limit: 50 })
    return { card: reviewCard({ lang, incidents }) }
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
      inc.status = 'archived'
      await upsertIncidentDurable(inc)
      await clearSessionDurable(args.chatId, args.openId)
      const archivedTitle =
        lang === 'zh-Hans' ? '已归档（含风险判定）' : lang === 'zh-Hant' ? '已歸檔（含風險判定）' : 'Archived with verdict'
      const archivedBody =
        lang === 'zh-Hans'
          ? [
              `${riskVerdictEmoji(verdict)} **最终判定：** **${riskVerdictLabel(verdict, lang)}**`,
              `事故 \`${id}\` 已归档，将计入复盘与周报统计。`,
              '随时输入 **review**，或贴新告警重新开始。',
            ].join('\n')
          : lang === 'zh-Hant'
            ? [
                `${riskVerdictEmoji(verdict)} **最終判定：** **${riskVerdictLabel(verdict, lang)}**`,
                `事故 \`${id}\` 已歸檔，將計入複盤與週報統計。`,
                '隨時輸入 **review**，或貼新告警重新開始。',
              ].join('\n')
            : [
                `${riskVerdictEmoji(verdict)} **Final verdict:** **${riskVerdictLabel(verdict, lang)}**`,
                `Incident \`${id}\` archived — counted on the review board and weekly report.`,
                'Type **review** anytime, or paste a new alert.',
              ].join('\n')
      return { card: simpleCard(archivedTitle, archivedBody, 'green') }
    }
    await upsertIncidentDurable(inc)
    await saveSessionDurable(args.chatId, args.openId, session)
    return { card: incidentDetailCard({ lang, incident: inc }) }
  }

  if (action === 'archive') {
    const id = incidentId || session.lastReportId
    if (id) {
      const inc = await getIncidentDurable(id)
      if (inc && !inc.riskVerdict) {
        return {
          card: riskVerdictPromptCard({
            lang,
            incidentId: id,
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
    }
    await clearSessionDurable(args.chatId, args.openId)
    const archivedTitle =
      lang === 'zh-Hans' ? '已归档' : lang === 'zh-Hant' ? '已歸檔' : 'Archived'
    const archivedBody = id
      ? lang === 'zh-Hans'
        ? `事故 ${id} 已归档，可供定期复盘。随时输入 review，或贴新告警重新开始。`
        : lang === 'zh-Hant'
          ? `事故 ${id} 已歸檔，可供定期複盤。隨時輸入 review，或貼新告警重新開始。`
          : `Incident ${id} archived for regular review. Type review anytime, or paste a new alert to start fresh.`
      : lang === 'zh-Hans'
        ? '会话已清除。请贴上新告警开始排查。'
        : lang === 'zh-Hant'
          ? '會話已清除。請貼上新告警開始排查。'
          : 'Session cleared. Paste a new alert to start investigation.'
    return { card: simpleCard(archivedTitle, archivedBody, 'green') }
  }

  if (action === 'step_done') {
    const doneFact =
      lang === 'zh-Hans'
        ? '值班人员标记上一步建议已完成。'
        : lang === 'zh-Hant'
          ? '值班人員標記上一步建議已完成。'
          : 'Operator marked the previous recommended step as done.'
    pushInteraction(session, {
      role: 'user',
      kind: 'step_done',
      text: doneFact,
      messageId: args.messageId,
    })
    await saveSessionDurable(args.chatId, args.openId, session)
    return runInvestigation({
      msg: fakeMsg,
      lang,
      newFact: doneFact,
      markStepDone: true,
    })
  }

  if (action === 'generate_report') {
    return replyProceedInvestigationReport({
      session,
      lang,
      chatId: args.chatId,
      openId: args.openId,
      messageId: args.messageId,
    })
  }

  if (action === 'alert_nudge_ack') {
    const { ackAlertNudgeDurable } = await import('./alertNudge.js')
    const { rememberAdminOpenId } = await import('./client.js')
    rememberAdminOpenId(args.openId, 'nudge_ack')
    await ackAlertNudgeDurable(args.openId)
    return {
      card: simpleCard('已收到', '知道了 ✅ 已停止提醒。有新告警再叫我。', 'green'),
    }
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

  return {
    text:
      lang === 'zh-Hans'
        ? '未知卡片操作。'
        : lang === 'zh-Hant'
          ? '未知卡片操作。'
          : 'Unknown card action.',
  }
}

export async function handleMessage(msg: IncomingMessage): Promise<BotReply | null> {
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

  // Image / file / share first → understand & reiterate before relevance judgement
  let workingText = inbound.text
  let attachmentDigest: string | null = null
  let attachmentKind = 'share'
  const userCaption = (inbound.text || '').trim()
  const session = await getSessionDurable(inbound.chatId, inbound.openId)
  // Prefer sticky Chinese: share-card English must not reset the session language
  const langFallback = session.preferredLang || 'en'
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
      ALERT_NUDGE_DAY,
      isNudgeActiveDurable,
      looksLikeNudgeAck,
      looksLikeNudgeExplainQuestion,
      formatNudgeExplainReply,
      ackAlertNudgeDurable,
      loadNudgeState,
      isCampaignDay,
    } = await import('./alertNudge.js')
    if (looksLikeNudgeAck(workingText)) {
      const st = await loadNudgeState()
      const todayNudge =
        isCampaignDay() ||
        st?.dayKey === ALERT_NUDGE_DAY ||
        Boolean(st?.active) ||
        Boolean(st?.sendCount) ||
        (await isNudgeActiveDurable())
      // Campaign day / any nudge state: always durable-ack + confirm. Do NOT greet.
      if (todayNudge) {
        const { rememberAdminOpenId } = await import('./client.js')
        rememberAdminOpenId(msg.openId, 'nudge_ack_text')
        await ackAlertNudgeDurable(msg.openId)
        return {
          card: simpleCard('已收到', '知道了 ✅ 已停止提醒。有新告警再叫我。', 'green'),
        }
      }
    }
    if (looksLikeNudgeExplainQuestion(workingText)) {
      const st = await loadNudgeState()
      const explainToday = isCampaignDay() || Boolean(st?.dayKey)
      if (explainToday || (await isNudgeActiveDurable())) {
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
      inInvestigateSession: session.mode === 'investigate',
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
    return { card: greetingCard(lang, greetingReply(lang)) }
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
      intent === 'daily_market')
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

  if (intent === 'skills') {
    return { card: skillsCatalogCard({ lang, skills: loadSkills() }) }
  }

  if (intent === 'knowledge') {
    return { card: knowledgeCatalogCard({ lang, knowledge: loadKnowledge() }) }
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
    return handleCardAction({
      openId: msg.openId,
      chatId: msg.chatId,
      messageId: msg.messageId,
      value: { action: 'archive', incidentId: session.lastReportId || '' },
    })
  }

  // Text alternative to card “Step done” button (works without Lark Card Request URL)
  if (isStepDoneCommand(workingText)) {
    return handleCardAction({
      openId: msg.openId,
      chatId: msg.chatId,
      messageId: msg.messageId,
      value: { action: 'step_done', incidentId: session.lastReportId || '' },
    })
  }

  if (intent === 'investigate' || intent === 'followup') {
    // Strip command prefix — bare "investigate"/"排查" with no details should not open a report card.
    // Also drop the parse-time `[forwarded_card]` marker so report titles stay clean.
    const fact = workingText
      .replace(/^(investigate|排查|開始排查|开始排查)\s*/i, '')
      .replace(/\[(forwarded_card|merge_forward|replied_alert)\]\s*/gi, '')
      .trim()
    if (!fact) {
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
    return runInvestigation({
      msg,
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
