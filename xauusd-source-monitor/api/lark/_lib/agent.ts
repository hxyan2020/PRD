import { downloadMessageImage } from './client.js'
import {
  greetingCard,
  helpCard,
  investigationCard,
  knowledgeCatalogCard,
  nodeDetailCard,
  reviewCard,
  simpleCard,
  skillsCatalogCard,
} from './cards.js'
import { chatComplete, describeImage } from './llm.js'
import {
  extractWikiQuery,
  fetchChatHistory,
  readDocxRaw,
  searchLarkWiki,
} from './larkDocs.js'
import { fetchMarketSnapshot, formatMarketAnswer } from './market.js'
import { fetchQuoteOpsRag } from './quoteOps.js'
import { buildWeeklyReport, weeklyReportCard } from './weeklyReport.js'
import {
  adaptiveNextSteps,
  formatRagAnswer,
  loadKnowledge,
  loadSkills,
  looksLikeNodeIdReply,
  preferredActions,
  resolveNodeById,
  retrieveRag,
} from './skills.js'
import { detectSafetyViolation, safetyReply } from './safety.js'
import {
  accessUnavailableReply,
  botMetaReply,
  classifyIntent,
  detectLang,
  greetingReply,
  helpReply,
  isLarkWikiQuestion,
  looksLikeIncidentEvidence,
  needsInaccessibleAccess,
  isStepDoneCommand,
  offtopicReply,
} from './scope.js'
import { logInbound } from './inboundLog.js'
import {
  clearSession,
  getIncident,
  getSession,
  listIncidents,
  newIncidentId,
  saveSession,
  upsertIncident,
} from './store.js'
import type { BotReply, IncomingMessage, IncidentRecord, Lang } from './types.js'

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
  hits: { id: string; name: string }[]
  kb: { title: string }[]
  facts: string[]
  adapted: boolean
}): string {
  const hans = args.lang === 'zh-Hans'
  const hant = args.lang === 'zh-Hant'
  const hitLine = args.hits.length
    ? args.hits
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
  if (hans) {
    return [
      '📋 **摘要**',
      '',
      `• **已摄入事实／证据：** **${args.facts.length}**`,
      `• **本次参考：** Skills **${hitLine}** · 知识库 **${kbLine}**（文末可点开）`,
      '• **证据分级：** **已证实** / **假设** / **未排除** — [OBS] [DESIGN] [PUBLIC] [TBC] [INCIDENT]',
      args.adapted
        ? '• **指引：** 排查路径已依你最新证据调整；请继续回复结果'
        : '• **指引：** 请回复排查结果或贴新证据，我会调整路径',
    ].join('\n')
  }
  if (hant) {
    return [
      '📋 **摘要**',
      '',
      `• **已攝入事實／證據：** **${args.facts.length}**`,
      `• **本次參考：** Skills **${hitLine}** · 知識庫 **${kbLine}**（文末可點開）`,
      '• **證據分級：** **已證實** / **假設** / **未排除** — [OBS] [DESIGN] [PUBLIC] [TBC] [INCIDENT]',
      args.adapted
        ? '• **指引：** 排查路徑已依你最新證據調整；請繼續回覆結果'
        : '• **指引：** 請回覆排查結果或貼新證據，我會調整路徑',
    ].join('\n')
  }
  return [
    '📋 **Summary**',
    '',
    `• **Facts ingested:** **${args.facts.length}**`,
    `• **Used this turn:** Skills **${hitLine}** · Knowledge **${kbLine}** (links at end)`,
    '• **Evidence grades:** **Confirmed** / **Suspected** / **Unknown** — [OBS] [DESIGN] [PUBLIC] [TBC] [INCIDENT]',
    args.adapted
      ? '• **Guidance:** Path re-ranked from your latest evidence — reply with findings'
      : '• **Guidance:** Reply with findings or new evidence and I’ll adapt the path',
  ].join('\n')
}

/** Lean investigate body when LLM is down: possible causes + path cues (not full Skills/KB dump). */
function formatInvestigateCore(args: {
  lang: Lang
  hits: { id: string; name: string; check: string; action: string }[]
  kb: { title: string }[]
}): string {
  const hans = args.lang === 'zh-Hans'
  const hant = args.lang === 'zh-Hant'
  const lines: string[] = []
  lines.push(hans ? '🔎 **可能原因**' : hant ? '🔎 **可能原因**' : '🔎 **Possible causes**')
  if (args.hits.length) {
    for (const h of args.hits.slice(0, 4)) {
      lines.push(`• **${h.id} · ${h.name}** — ${h.check.slice(0, 160)}${h.check.length > 160 ? '…' : ''}`)
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
  lines.push('')
  lines.push(hans ? '🧭 **排查路径要点**' : hant ? '🧭 **排查路徑要點**' : '🧭 **Investigation path**')
  if (args.hits.length) {
    for (const h of args.hits.slice(0, 3)) {
      lines.push(`• **${h.id}：** ${h.action.slice(0, 160)}${h.action.length > 160 ? '…' : ''}`)
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

async function enrichWithLlm(args: {
  lang: Lang
  question: string
  context: string
}): Promise<string | null> {
  return chatComplete({
    lang: args.lang,
    user: args.question,
    systemExtra: args.context,
  })
}

async function handleImage(msg: IncomingMessage, lang: Lang): Promise<string> {
  if (!msg.imageKey) {
    if (lang === 'zh-Hans') return '收到图片消息，但无法解析 image_key。请再传一次，或贴上 OCR 文字。'
    if (lang === 'zh-Hant') return '收到圖片訊息，但無法解析 image_key。請再傳一次，或貼上 OCR 文字。'
    return 'Got an image, but could not parse image_key. Please resend or paste OCR text.'
  }
  try {
    const buf = await downloadMessageImage(msg.messageId, msg.imageKey)
    const b64 = buf.toString('base64')
    const desc = await describeImage({ lang, imageBase64: b64 })
    if (desc) return desc
    return accessUnavailableReply(
      lang,
      lang === 'zh-Hans'
        ? '图片已收到，但视觉 OCR 不可用（未配置或无法访问视觉模型）。也可直接简述图中告警重点、合约与数值。'
        : lang === 'zh-Hant'
          ? '圖片已收到，但視覺 OCR 不可用（未配置或無法訪問視覺模型）。也可直接簡述圖中告警重點、合約與數值。'
          : 'Image received, but vision OCR is unavailable (not configured or unreachable). You can also briefly describe the alert, contract, and values.',
    )
  } catch (e) {
    const err = e instanceof Error ? e.message : 'unknown'
    return accessUnavailableReply(
      lang,
      lang === 'zh-Hans'
        ? `图片下载／访问失败（${err}）。也可改贴文字／表格。`
        : lang === 'zh-Hant'
          ? `圖片下載／訪問失敗（${err}）。也可改貼文字／表格。`
          : `Image download/access failed (${err}). You can also paste text/table instead.`,
    )
  }
}

function persistOpenIncident(args: {
  chatId: string
  openId: string
  lang: Lang
  facts: string[]
  severity: string
  hits: { id: string; name: string }[]
  kb: { title: string }[]
  summary: string
  recommendations: string[]
  existingId?: string
}): IncidentRecord {
  const id = args.existingId || newIncidentId()
  const prev = args.existingId ? getIncident(args.existingId) : undefined
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
    status: prev?.status === 'archived' ? 'archived' : 'open',
    createdAt: prev?.createdAt || Date.now(),
    updatedAt: Date.now(),
    lang: args.lang,
  }
  upsertIncident(rec)
  return rec
}

async function handleWikiAsk(lang: Lang, text: string, openId: string): Promise<BotReply> {
  const query = extractWikiQuery(text) || text.trim().slice(0, 120)
  const title =
    lang === 'zh-Hans' ? '飞书 Wiki / 文档' : lang === 'zh-Hant' ? '飛書 Wiki / 文檔' : 'Lark Wiki / Docs'
  const searched = await searchLarkWiki(query, 5)
  logInbound({
    at: new Date().toISOString(),
    kind: 'wiki_search',
    openId,
    textPreview: query.slice(0, 80),
    result: searched.ok ? `hits:${searched.hits.length}` : `fail:${searched.error || 'unknown'}`,
  })

  if (!searched.ok) {
    return {
      card: simpleCard(
        title,
        accessUnavailableReply(
          lang,
          lang === 'zh-Hans'
            ? `飞书 Wiki／文档读取未授权或不可用（${searched.error || 'scope/凭证'}）。这是 AIPO Lark API UAT 只读项，请联系 @Yan Haixiang 开通 Wiki/Docs 只读权限。`
            : lang === 'zh-Hant'
              ? `飛書 Wiki／文檔讀取未授權或不可用（${searched.error || 'scope/憑證'}）。這是 AIPO Lark API UAT 唯讀項，請聯繫 @Yan Haixiang 開通 Wiki/Docs 唯讀權限。`
              : `Lark Wiki/Docs read is unauthorized or unavailable (${searched.error || 'scope/credentials'}). AIPO Lark API UAT read-only item — contact @Yan Haixiang to grant Wiki/Docs read scopes.`,
        ),
        'orange',
      ),
    }
  }

  if (!searched.hits.length) {
    const empty =
      lang === 'zh-Hans'
        ? [
            '📚 **Wiki 检索**',
            '',
            `• **查询：** ${query}`,
            '• **结果：** 未找到授权范围内的页面',
            '• **提示：** 换关键词再试；若应有文档，请联系 **@Yan Haixiang** 确认授权范围',
          ].join('\n')
        : lang === 'zh-Hant'
          ? [
              '📚 **Wiki 檢索**',
              '',
              `• **查詢：** ${query}`,
              '• **結果：** 未找到授權範圍內的頁面',
              '• **提示：** 換關鍵詞再試；若應有文檔，請聯繫 **@Yan Haixiang** 確認授權範圍',
            ].join('\n')
          : [
              '📚 **Wiki search**',
              '',
              `• **Query:** ${query}`,
              '• **Result:** no pages in the authorized scope',
              '• **Tip:** try other keywords; if a doc should exist, ask **@Yan Haixiang** to confirm the allow-list',
            ].join('\n')
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
  const session = getSession(args.msg.chatId, args.msg.openId)
  session.mode = 'investigate'
  if (args.newFact.trim()) {
    session.facts.push(args.newFact.trim())
  }
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

  const nextSteps = adaptiveNextSteps({
    facts: session.facts,
    hits,
    checkedSteps: session.checkedSteps,
    lang: args.lang,
    max: 3,
  })
  session.pendingPrompt = nextSteps[0]
  const actions = preferredActions(hits, args.lang, 2)
  const summary = buildSummary({
    lang: args.lang,
    severity,
    hits,
    kb,
    facts: session.facts,
    adapted: session.facts.length > 1 || session.checkedSteps.length > 0,
  })

  const quoteOps = await fetchQuoteOpsRag(blob.slice(0, 1500))
  const judgePrompt =
    args.lang === 'zh-Hans'
      ? '根据事故事实与命中的 Skills／知识库，写排查报告正文。正文只写两块：🔎 可能原因、🧭 排查路径。把根因分成「已证实 / 假设 / 未排除」，尽量标注 [OBS]/[DESIGN]/[PUBLIC]/[TBC]/[INCIDENT]。Skills／知识库只需点名 ID／标题一句带过，不要粘贴整份检查清单或知识库长摘录（链接在卡片文末）。用 emoji 分段 +「• **关键词：** 说明」。必须用简体中文。优先 quote-ops V Exchange 永续知识；忽略 CFD。'
      : args.lang === 'zh-Hant'
        ? '根據事故事實與命中的 Skills／知識庫，寫排查報告正文。正文只寫兩塊：🔎 可能原因、🧭 排查路徑。把根因分成「已證實／假設／未排除」，盡量標註 [OBS]/[DESIGN]/[PUBLIC]/[TBC]/[INCIDENT]。Skills／知識庫只需點名 ID／標題一句帶過，不要貼整份清單或長摘錄（連結在卡片文末）。用 emoji 分段 +「• **關鍵詞：** 說明」。必須用繁體中文。優先 quote-ops V Exchange 永續知識；忽略 CFD。'
        : 'Write the investigation body from the facts and matched Skills/KB. Body has only two sections: Possible causes, Investigation path. Split causes into Confirmed / Suspected / Unknown and tag [OBS]/[DESIGN]/[PUBLIC]/[TBC]/[INCIDENT]. Only briefly name Skill ids / KB titles — do not paste full checklists or long KB excerpts (links are at the card footer). Use emoji section headers and "• **Keyword:** detail" bullets. Prefer quote-ops V Exchange perpetual KB; ignore CFD. English.'
  const llm = await enrichWithLlm({
    lang: args.lang,
    question: judgePrompt,
    context: [
      `FACTS:\n${blob.slice(0, 6000)}`,
      `SKILLS:\n${hits.map((h) => `${h.id} ${h.name} | ${h.check} | ${h.action}`).join('\n')}`,
      `KB:\n${kb.map((k) => `${k.title}: ${k.body.slice(0, 1500)}`).join('\n')}`,
      quoteOps ? `QUOTE_OPS_RAG:\n${quoteOps}` : '',
      `NEXT:\n${nextSteps.join('\n')}`,
    ]
      .filter(Boolean)
      .join('\n\n'),
  })
  // Body = causes + path. Skills/KB full dumps stay out; ids are named briefly in summary + footer links.
  const llmExtra = llm
    ? `\n\n${llm}`
    : `\n\n${formatInvestigateCore({ lang: args.lang, hits, kb })}`

  const rec = persistOpenIncident({
    chatId: args.msg.chatId,
    openId: args.msg.openId,
    lang: args.lang,
    facts: session.facts,
    severity,
    hits,
    kb,
    summary: summary + (llm ? ' (LLM-assisted)' : ''),
    recommendations: [...nextSteps, ...actions],
    existingId: session.lastReportId,
  })
  session.lastReportId = rec.id
  session.preferredLang = args.lang
  saveSession(args.msg.chatId, args.msg.openId, session)

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
      summary: summary + llmExtra,
      nextSteps,
      actions,
      skills: hits.map((h) => h.id),
      knowledge: kb.map((k) => k.title),
      incidentId: rec.id,
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
  const session = getSession(args.chatId, args.openId)
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
    const incidents = listIncidents({ limit: 50 })
    return { card: reviewCard({ lang, incidents }) }
  }

  if (action === 'archive') {
    const id = incidentId || session.lastReportId
    if (id) {
      const inc = getIncident(id)
      if (inc) {
        inc.status = 'archived'
        inc.updatedAt = Date.now()
        upsertIncident(inc)
      }
    }
    clearSession(args.chatId, args.openId)
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
    return runInvestigation({
      msg: fakeMsg,
      lang,
      newFact: doneFact,
      markStepDone: true,
    })
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

  // Image / media first → OCR into investigate flow
  let workingText = msg.text
  const session = getSession(msg.chatId, msg.openId)
  let lang = detectLang(msg.text || '', session.preferredLang || 'en')

  if (msg.messageType === 'image' || msg.imageKey) {
    const ocr = await handleImage(msg, lang)
    workingText = ocr
    lang = detectLang(ocr, lang)
  } else if (msg.messageType === 'post' && /\|/.test(msg.text)) {
    // Tables in post often flatten with spaces; keep as investigate evidence
    workingText = `[table/post]\n${msg.text}`
  }

  session.preferredLang = lang
  saveSession(msg.chatId, msg.openId, session)

  const intent = classifyIntent(workingText, {
    inInvestigateSession: session.mode === 'investigate',
    mentionedBot: msg.mentionedBot,
    chatType: msg.chatType,
  })

  if (intent === 'greeting' || intent === 'ack_mention') {
    return { card: greetingCard(lang, greetingReply(lang)) }
  }

  if (intent === 'help') {
    return { card: helpCard(lang, helpReply(lang)) }
  }

  if (intent === 'safety') {
    const hit = detectSafetyViolation(workingText) || 'pii'
    return { text: safetyReply(lang, hit) }
  }

  if (intent === 'offtopic') {
    return { text: offtopicReply(lang) }
  }

  // AIPO Lark API UAT: Wiki / Docs read (authorized, read-only) before generic access gate
  if (isLarkWikiQuestion(workingText)) {
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
    const snap = await fetchMarketSnapshot()
    const base = formatMarketAnswer(snap, lang, workingText)
    // Structured hourly card mirrors the web desk — only LLM-enrich when the user asked a free-form market question.
    const bareMarket = /^(market|markets|行情|市况|市況|趋势|趨勢|gold|xau|xauusd)$/i.test(
      workingText.trim(),
    )
    const llm = bareMarket
      ? null
      : await enrichWithLlm({
          lang,
          question: workingText,
          context: base,
        })
    const marketTitle =
      lang === 'zh-Hans'
        ? '小时行情扫报'
        : lang === 'zh-Hant'
          ? '小時行情掃報'
          : 'Hourly market scan'
    return {
      card: simpleCard(marketTitle, llm ? `${base}\n\n---\n${llm}` : base, 'wathet'),
    }
  }

  if (intent === 'review') {
    const incidents = listIncidents({ limit: 50 })
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

  if (intent === 'weekly') {
    const report = buildWeeklyReport(listIncidents({ status: 'all', limit: 200 }), Date.now(), lang)
    return { card: weeklyReportCard(report.markdown, report.empty) }
  }

  if (intent === 'archive') {
    if (session.lastReportId) {
      const inc = getIncident(session.lastReportId)
      if (inc) {
        inc.status = 'archived'
        inc.updatedAt = Date.now()
        upsertIncident(inc)
      }
    }
    clearSession(msg.chatId, msg.openId)
    return {
      text:
        lang === 'zh-Hans'
          ? '已结束本次排查并归档（若有报告）。输入 review 查看清单，或贴上新告警重新开始。'
          : lang === 'zh-Hant'
            ? '已結束本次排查並歸檔（若有報告）。輸入 review 查看清單，或貼上新告警重新開始。'
            : 'Investigation closed and archived (if a report existed). Type review for the list, or paste a new alert to start again.',
    }
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
    // Strip command prefix — bare "investigate"/"排查" with no details should not open a report card
    const fact = workingText.replace(/^(investigate|排查|開始排查|开始排查)\s*/i, '').trim()
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

  // Desk FAQ / admin meta: direct answer only — never attach investigate Skills+severity dump
  const meta = botMetaReply(lang, workingText)
  if (meta) {
    return { card: simpleCard(replyTitle, meta, 'blue') }
  }

  const incidentish = looksLikeIncidentEvidence(workingText)
  const { hits, kb, severity } = retrieveRag(workingText)
  const quoteOps = incidentish ? await fetchQuoteOpsRag(workingText) : null
  const ragBody = incidentish
    ? formatRagAnswer({
        lang,
        question: workingText,
        hits,
        kb,
        severity,
        quoteOps,
      })
    : formatSoftKbAnswer(lang, workingText, kb)

  const context = [
    `severity=${incidentish ? severity : 'n/a'}`,
    incidentish
      ? `skills=${hits.map((h) => `${h.id}|${h.check}|${h.action}`).join('\n')}`
      : 'Do NOT invent an investigation, severity, or Skills checklist. This is a normal Q&A.',
    `kb=${kb.map((k) => `${k.title}: ${k.body.slice(0, 1200)}`).join('\n')}`,
    quoteOps ? `QUOTE_OPS_RAG:\n${quoteOps}` : '',
    'Answer the user question directly and helpfully. Prefer V Exchange perpetual KB when relevant; ignore CFD broker pricing. Format with emoji headers and bold-keyword bullets. Do NOT reply with a command menu / greeting. Do NOT start an investigation unless the user pasted an alert.',
  ]
    .filter(Boolean)
    .join('\n\n')
  const llm = await enrichWithLlm({ lang, question: workingText, context })
  const body = llm ? (ragBody ? `${llm}\n\n---\n${ragBody}` : llm) : ragBody
  return {
    card: simpleCard(replyTitle, body),
  }
}

/** Soft KB-only block for normal Q&A (no Skills / no severity). */
function formatSoftKbAnswer(
  lang: Lang,
  question: string,
  kb: { title: string; body: string }[],
): string {
  if (!kb.length) {
    if (lang === 'zh-Hans') {
      return [
        '💬 **直接回答**',
        '',
        `针对「${question.slice(0, 80)}」：我这边没有命中高相关知识摘录。你可以换个说法再问，或发送 **knowledge** 浏览知识库；若是告警排查请贴原文或发 **investigate**。`,
      ].join('\n')
    }
    if (lang === 'zh-Hant') {
      return [
        '💬 **直接回答**',
        '',
        `針對「${question.slice(0, 80)}」：我這邊沒有命中高相關知識摘錄。你可以換個說法再問，或發送 **knowledge** 瀏覽知識庫；若是告警排查請貼原文或發 **investigate**。`,
      ].join('\n')
    }
    return [
      '💬 **Direct answer**',
      '',
      `On “${question.slice(0, 80)}”: no high-relevance KB excerpt. Rephrase, send **knowledge** to browse, or paste an alert / **investigate** for RCA.`,
    ].join('\n')
  }
  const lines: string[] = []
  if (lang === 'zh-Hans') {
    lines.push('📖 **相关知识摘录**', '')
  } else if (lang === 'zh-Hant') {
    lines.push('📖 **相關知識摘錄**', '')
  } else {
    lines.push('📖 **Related knowledge**', '')
  }
  for (const k of kb.slice(0, 3)) {
    const excerpt = k.body.replace(/\s+/g, ' ').trim().slice(0, 280)
    lines.push(`• **${k.title}**`)
    lines.push(`  ${excerpt}${k.body.length > 280 ? '…' : ''}`)
  }
  return lines.join('\n')
}
