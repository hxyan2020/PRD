import { investigationCard, reviewCard, simpleCard } from './cards'
import { downloadMessageImage } from './client'
import { chatComplete, describeImage } from './llm'
import { fetchMarketSnapshot, formatMarketAnswer } from './market'
import {
  adaptiveNextSteps,
  preferredActions,
  retrieveRag,
} from './skills'
import { classifyIntent, detectLang, helpReply, offtopicReply } from './scope'
import {
  clearSession,
  getIncident,
  getSession,
  listIncidents,
  newIncidentId,
  saveSession,
  upsertIncident,
} from './store'
import type { BotReply, IncomingMessage, IncidentRecord, Lang } from './types'

function titleFromFacts(facts: string[], lang: Lang): string {
  const first = facts[0]?.replace(/\s+/g, ' ').trim().slice(0, 48) || ''
  if (first) return first
  return lang === 'zh-Hant' ? '未命名事故' : 'Untitled incident'
}

function buildSummary(args: {
  lang: Lang
  severity: string
  hits: { id: string; name: string }[]
  kb: { title: string }[]
  facts: string[]
  adapted: boolean
}): string {
  const zh = args.lang === 'zh-Hant'
  const hitLine = args.hits.length
    ? args.hits
        .slice(0, 4)
        .map((h) => h.id)
        .join(', ')
    : zh
      ? '無自信匹配'
      : 'no confident match'
  const kbLine = args.kb.length
    ? args.kb
        .map((k) => k.title)
        .slice(0, 3)
        .join(', ')
    : zh
      ? '無'
      : 'none'
  if (zh) {
    return [
      `已攝入 ${args.facts.length} 條事實／證據。`,
      `Skills 命中：${hitLine}。知識庫：${kbLine}。`,
      args.adapted
        ? '下一步已依你最新回覆／證據重新排序，而非機械貼整份清單。'
        : '請回覆你查到的結果或貼上新證據，我會調整建議。',
      '提醒：內部 admin／DB 檢索屬後續階段；我不會編造生產數據。',
    ].join(' ')
  }
  return [
    `Ingested ${args.facts.length} fact/evidence item(s).`,
    `Skills hit: ${hitLine}. Knowledge: ${kbLine}.`,
    args.adapted
      ? 'Next steps were re-ranked from your latest replies/evidence — not a mechanical full dump.'
      : 'Reply with findings or new evidence and I’ll adapt the guidance.',
    'Reminder: internal admin/DB retrieval is a later phase — I will not invent production data.',
  ].join(' ')
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
    return lang === 'zh-Hant'
      ? '收到圖片訊息，但無法解析 image_key。請再傳一次，或貼上 OCR 文字。'
      : 'Got an image, but could not parse image_key. Please resend or paste OCR text.'
  }
  try {
    const buf = await downloadMessageImage(msg.messageId, msg.imageKey)
    const b64 = buf.toString('base64')
    const desc = await describeImage({ lang, imageBase64: b64 })
    if (desc) return desc
    return lang === 'zh-Hant'
      ? '已收到圖片。目前無法自動 OCR（未配置視覺模型）。請簡述圖中告警重點、合約與數值。'
      : 'Image received. Auto-OCR unavailable (vision model not configured). Please briefly describe the alert, contract, and values.'
  } catch (e) {
    return lang === 'zh-Hant'
      ? `圖片下載失敗：${e instanceof Error ? e.message : 'unknown'}。請改貼文字／表格。`
      : `Image download failed: ${e instanceof Error ? e.message : 'unknown'}. Please paste text/table instead.`
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

  let llmExtra = ''
  const llm = await enrichWithLlm({
    lang: args.lang,
    question:
      args.lang === 'zh-Hant'
        ? '根據下列事故事實與 RAG 命中，用友好專業語氣給出簡短研判（不重複整份清單），並說明為何建議這些下一步。'
        : 'Given the incident facts and RAG hits below, give a short friendly-professional judgement (do not dump the full checklist) and why these next steps.',
    context: [
      `FACTS:\n${blob.slice(0, 6000)}`,
      `SKILLS:\n${hits.map((h) => `${h.id} ${h.name} | ${h.check}`).join('\n')}`,
      `KB:\n${kb.map((k) => `${k.title}: ${k.body}`).join('\n')}`,
      `NEXT:\n${nextSteps.join('\n')}`,
    ].join('\n\n'),
  })
  if (llm) llmExtra = `\n\n${llm}`

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
  saveSession(args.msg.chatId, args.msg.openId, session)

  return {
    card: investigationCard({
      lang: args.lang,
      title:
        args.lang === 'zh-Hant'
          ? `排查進行中 · ${rec.title}`
          : `Investigation · ${rec.title}`,
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
  const lang: Lang = detectLang('')
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
    const incidents = listIncidents({ limit: 20 })
    return { card: reviewCard({ lang: 'en', incidents }) }
  }

  if (action === 'archive') {
    const session = getSession(args.chatId, args.openId)
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
    return {
      card: simpleCard(
        'Archived',
        id
          ? `Incident \`${id}\` archived for regular review. Type \`review\` anytime, or paste a new alert to start fresh.`
          : 'Session cleared. Paste a new alert to start investigation.',
        'green',
      ),
    }
  }

  if (action === 'step_done') {
    return runInvestigation({
      msg: fakeMsg,
      lang: 'en',
      newFact: 'Operator marked the previous recommended step as done.',
      markStepDone: true,
    })
  }

  return { text: 'Unknown card action.' }
}

export async function handleMessage(msg: IncomingMessage): Promise<BotReply | null> {
  if (!msg.messageId) return null

  // Image / media first → OCR into investigate flow
  let workingText = msg.text
  const langGuessSeed = msg.text || 'en'
  let lang = detectLang(langGuessSeed)

  if (msg.messageType === 'image' || msg.imageKey) {
    const ocr = await handleImage(msg, lang)
    workingText = ocr
    lang = detectLang(ocr)
  } else if (msg.messageType === 'post' && /\|/.test(msg.text)) {
    // Tables in post often flatten with spaces; keep as investigate evidence
    workingText = `[table/post]\n${msg.text}`
  }

  const session = getSession(msg.chatId, msg.openId)
  const intent = classifyIntent(workingText, {
    inInvestigateSession: session.mode === 'investigate',
    mentionedBot: msg.mentionedBot,
    chatType: msg.chatType,
  })

  if (intent === 'help' || intent === 'ack_mention') {
    return { text: helpReply(lang) }
  }

  if (intent === 'offtopic') {
    return { text: offtopicReply(lang) }
  }

  if (intent === 'market') {
    const snap = await fetchMarketSnapshot()
    const base = formatMarketAnswer(snap, lang, workingText)
    const llm = await enrichWithLlm({
      lang,
      question: workingText,
      context: base,
    })
    return {
      card: simpleCard(
        lang === 'zh-Hant' ? '市況與趨勢' : 'Market trends & conditions',
        llm ? `${base}\n\n---\n${llm}` : base,
        'wathet',
      ),
    }
  }

  if (intent === 'review') {
    const incidents = listIncidents({ limit: 20 })
    return { card: reviewCard({ lang, incidents }) }
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
        lang === 'zh-Hant'
          ? '已結束本次排查並歸檔（若有報告）。輸入 `review` 查看清單，或貼上新告警重新開始。'
          : 'Investigation closed and archived (if a report existed). Type `review` for the list, or paste a new alert to start again.',
    }
  }

  if (intent === 'investigate' || intent === 'followup') {
    // Strip command prefix
    const fact = workingText.replace(/^(investigate|排查|開始排查|开始排查)\s*/i, '').trim()
    return runInvestigation({
      msg,
      lang,
      newFact:
        fact ||
        (lang === 'zh-Hant'
          ? '（使用者開始排查，尚未提供細節）'
          : '(User started investigation without details yet)'),
    })
  }

  // general_risk — answer with RAG + optional LLM, offer to investigate
  const { hits, kb, severity } = retrieveRag(workingText)
  const context = [
    `severity=${severity}`,
    `skills=${hits.map((h) => h.id).join(',')}`,
    `kb=${kb.map((k) => k.title).join(',')}`,
    kb.map((k) => `${k.title}: ${k.body}`).join('\n'),
  ].join('\n')
  const llm = await enrichWithLlm({ lang, question: workingText, context })
  if (llm) {
    return {
      card: simpleCard(
        lang === 'zh-Hant' ? '風險助手回覆' : 'Risk assistant reply',
        `${llm}\n\n---\n${
          lang === 'zh-Hant'
            ? '_若這是事故，請回覆更多證據或輸入 `investigate` 進入引導排查。_'
            : '_If this is an incident, reply with more evidence or type `investigate` for guided RCA._'
        }`,
      ),
    }
  }

  const fallback =
    lang === 'zh-Hant'
      ? [
          '這看起來與 V Exchange 風險相關。我可以：',
          '• 輸入 `market` 看市況',
          '• 貼告警／截圖並輸入 `investigate` 開始排查',
          '• 輸入 `review` 看已累積事故',
          hits.length ? `初步 Skills 提示：${hits.map((h) => h.id).join(', ')}` : '',
        ]
          .filter(Boolean)
          .join('\n')
      : [
          'This looks risk-related. I can help with:',
          '• `market` for conditions',
          '• paste an alert/screenshot + `investigate` for guided RCA',
          '• `review` for accumulated incidents',
          hits.length ? `Early skill hints: ${hits.map((h) => h.id).join(', ')}` : '',
        ]
          .filter(Boolean)
          .join('\n')

  return { text: fallback }
}
