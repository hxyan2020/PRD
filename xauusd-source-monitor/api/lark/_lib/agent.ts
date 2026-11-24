import { downloadMessageImage, fetchUserDisplayName } from './client.js'
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
import {
  buildMarketCard,
  fetchMarketSnapshot,
  formatMarketAnswer,
  LARK_MARKET_LANG,
} from './market.js'
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
  splitSkillSteps,
  tokenize,
} from './skills.js'
import { detectSafetyViolation, safetyReply } from './safety.js'
import {
  accessUnavailableReply,
  botMetaReply,
  casualChatReply,
  classifyIntent,
  detectLang,
  greetingReply,
  helpReply,
  isCasualBanter,
  isCasualChat,
  isLarkWikiQuestion,
  looksLikeIncidentEvidence,
  needsInaccessibleAccess,
  isStepDoneCommand,
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
      lines.push(`• **${h.id} · ${h.name}**`)
      const steps = splitSkillSteps(h.check)
      for (const step of steps.length ? steps : [h.check]) {
        lines.push(`  - ${step}`)
      }
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
      lines.push(`• **${h.id}**`)
      const steps = splitSkillSteps(h.action)
      for (const step of steps.length ? steps : [h.action]) {
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
  temperature?: number
}): Promise<string | null> {
  return chatComplete({
    lang: args.lang,
    user: args.question,
    systemExtra: args.context,
    temperature: args.temperature,
  })
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
    const doc = await readDocxRaw(token)
    if (doc.ok && doc.content) {
      lines.push(
        '',
        lang === 'zh-Hans'
          ? '**文档正文摘要（只读）：**'
          : lang === 'zh-Hant'
            ? '**文檔正文摘要（唯讀）：**'
            : '**Document body excerpt (read-only):**',
        doc.content.replace(/\s+/g, ' ').trim().slice(0, 1200),
      )
    } else if (url || token) {
      lines.push(
        '',
        lang === 'zh-Hans'
          ? `文档链接／token 已识别${url ? `（${url}）` : ''}，但正文读取失败或未授权${doc.error ? `：${doc.error}` : '。'}可把要点贴出来，或联系 **@Yan Haixiang** 开通只读。`
          : lang === 'zh-Hant'
            ? `文檔連結／token 已識別${url ? `（${url}）` : ''}，但正文讀取失敗或未授權${doc.error ? `：${doc.error}` : '。'}可把要點貼出來，或聯繫 **@Yan Haixiang** 開通唯讀。`
            : `Doc link/token spotted${url ? ` (${url})` : ''}, but body read failed or unauthorized${doc.error ? `: ${doc.error}` : '.'} Paste key points, or ask **@Yan Haixiang** for read scope.`,
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

  if (action === 'alert_nudge_ack') {
    const { ackAlertNudge } = await import('./alertNudge.js')
    ackAlertNudge(args.openId)
    return {
      card: simpleCard('已收到', '知道了 ✅ 已停止提醒。有新告警再叫我。', 'green'),
    }
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

  // Image / file / share first → understand & reiterate before relevance judgement
  let workingText = msg.text
  let attachmentDigest: string | null = null
  let attachmentKind = 'share'
  const userCaption = (msg.text || '').trim()
  const session = getSession(msg.chatId, msg.openId)
  // Prefer sticky Chinese: share-card English must not reset the session language
  const langFallback = session.preferredLang || 'en'
  let lang = detectLang(msg.text || '', langFallback)
  if (
    looksLikeShareOrFileMeta(msg.text || '') &&
    (langFallback === 'zh-Hans' || langFallback === 'zh-Hant')
  ) {
    lang = langFallback
  }

  const attachmentMsg = isAttachmentMessage(msg.messageType, msg.text || '', msg.imageKey)
  if (msg.messageType === 'image' || msg.imageKey) {
    attachmentKind = 'image'
    attachmentDigest = await handleImage(msg, lang)
    workingText = userCaption ? `${userCaption}\n\n${attachmentDigest}` : attachmentDigest
    lang = detectLang(workingText, lang)
  } else if (attachmentMsg) {
    attachmentKind =
      msg.messageType === 'file' || msg.messageType === 'media' ? 'file' : 'share'
    attachmentDigest = await ingestShareOrFile(msg, lang)
    workingText = userCaption && !looksLikeShareOrFileMeta(userCaption)
      ? `${userCaption}\n\n${attachmentDigest}`
      : attachmentDigest
    lang = detectLang(`${userCaption}\n${attachmentDigest}`, lang)
  } else if (msg.messageType === 'post' && /\|/.test(msg.text)) {
    // Tables in post often flatten with spaces; keep as investigate evidence
    workingText = `[table/post]\n${msg.text}`
  }

  if (attachmentDigest) {
    session.lastAttachmentSummary = attachmentDigest.slice(0, 2000)
    session.lastAttachmentKind = attachmentKind
  }
  session.preferredLang = lang
  saveSession(msg.chatId, msg.openId, session)

  // Tomorrow-only alert nudge —「知道了」stops the 1-min loop
  {
    const { isNudgeActive, looksLikeNudgeAck, ackAlertNudge } = await import('./alertNudge.js')
    if (isNudgeActive() && looksLikeNudgeAck(workingText)) {
      ackAlertNudge(msg.openId)
      return {
        card: simpleCard('已收到', '知道了 ✅ 已停止提醒。有新告警再叫我。', 'green'),
      }
    }
  }

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
    const snap = await fetchMarketSnapshot()
    const base = formatMarketAnswer(snap, LARK_MARKET_LANG, workingText)
    // Structured hourly card mirrors the web desk — only LLM-enrich when the user asked a free-form market question.
    const bareMarket = /^(market|markets|行情|市况|市況|趋势|趨勢|gold|xau|xauusd)$/i.test(
      workingText.trim(),
    )
    const llm = bareMarket
      ? null
      : await enrichWithLlm({
          lang: LARK_MARKET_LANG,
          question: workingText,
          context: base,
        })
    return {
      card: await buildMarketCard({
        title: '小时行情扫报',
        snap,
        lang: LARK_MARKET_LANG,
        question: workingText,
        mode: 'hourly',
        appendix: llm ? `---\n${llm}` : '',
        template: 'wathet',
      }),
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

  // Small talk first — never fall through to empty-KB command menus
  if (isCasualChat(workingText)) {
    const wantName = /^(我是谁|我是誰|who\s+am\s+i|whoami|我叫什么|我叫什麼|你知道我是谁吗|你知道我是誰嗎)/i.test(
      workingText.trim(),
    )
    const displayName = wantName ? await fetchUserDisplayName(msg.openId) : null
    const casual = casualChatReply(lang, workingText, displayName)
    if (casual) {
      return { card: simpleCard(replyTitle, casual, 'blue') }
    }
  }

  // Desk FAQ / admin meta: direct answer only — never attach investigate Skills+severity dump
  const meta = botMetaReply(lang, workingText)
  if (meta) {
    return { card: simpleCard(replyTitle, meta, 'blue') }
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
      const llmBanter = await enrichWithLlm({
        lang,
        question: workingText,
        context:
          'Friendly banter / small talk. Reply warmly in 1–2 short beats. Do NOT search the web. Do NOT dump risk command menus. You may lightly mention you also help with markets/alerts.',
        temperature: 0.7,
      })
      const banter =
        llmBanter ||
        casualChatReply(lang, workingText) ||
        (lang === 'zh-Hans'
          ? '😄 挺帅的呀——自信加一分。想继续贫两句，或扔个行情／告警过来，我都在。'
          : lang === 'zh-Hant'
            ? '😄 挺帥的呀——自信加一分。想繼續貧兩句，或扔個行情／告警過來，我都在。'
            : '😄 Looking good — confidence +1. Keep chatting, or toss me a market / alert anytime.')
      return { card: simpleCard(replyTitle, banter, 'blue') }
    }
    if (!shouldAutoWebSearch(workingText)) {
      // Short free-text — chat first (accept everything outside the negative list)
      const llmSoft = await enrichWithLlm({
        lang,
        question: workingText,
        context:
          'Free-text chat or short ask. Engage warmly. Answer if you can; otherwise ask a light clarifying question. Specialty is V Exchange risk, but casual chat is welcome. Do not invent news or secrets.',
        temperature: 0.65,
      })
      if (llmSoft) return { card: simpleCard(replyTitle, llmSoft, 'blue') }
      return {
        card: simpleCard(
          replyTitle,
          lang === 'zh-Hans'
            ? '可以呀 🙂 我专长风控，闲聊也陪。多说两句，或扔个交易所／合约／告警过来都行。'
            : lang === 'zh-Hant'
              ? '可以呀 🙂 我專長風控，閒聊也陪。多說兩句，或扔個交易所／合約／告警過來都行。'
              : 'Sure 🙂 Risk is my specialty, but I’m happy to chat too — say a bit more, or toss an exchange / contract / alert my way.',
          'blue',
        ),
      }
    }
    const searched = await searchWeb(workingText, lang)
    if (searched.hits.length) {
      const searchCtx = [
        'This is a normal product / risk Q&A — NOT an incident investigation.',
        'Local knowledge base had no high-relevance hit — you are in SEARCH MODE.',
        'Answer the user question directly from the search hits below, in a warm conversational tone.',
        'Do NOT say that the knowledge base had no match. Do NOT dump command menus.',
        'End with an explicit 📎 **数据源** / **Sources** section listing the provided URLs as markdown links. Never invent URLs.',
        'Prefer V Exchange perpetual framing when relevant; ignore CFD broker pricing.',
        webSearchContext(searched),
      ].join('\n\n')
      const llm = await enrichWithLlm({
        lang,
        question: workingText,
        context: searchCtx,
        temperature: 0.45,
      })
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
    const llmFallback = await enrichWithLlm({
      lang,
      question: workingText,
      context: [
        'Normal Q&A or casual chat. No local KB hit and web search returned nothing usable.',
        'Answer briefly from general public knowledge if you can; otherwise chat lightly and ask a clarifying question.',
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
  const llm = await enrichWithLlm({ lang, question: workingText, context: qaContext, temperature: 0.55 })
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
