import { investigationCard, reviewCard, simpleCard } from './cards.js'
import { downloadMessageImage } from './client.js'
import { chatComplete, describeImage } from './llm.js'
import { fetchMarketSnapshot, formatMarketAnswer } from './market.js'
import { fetchQuoteOpsRag } from './quoteOps.js'
import {
  adaptiveNextSteps,
  preferredActions,
  retrieveRag,
} from './skills.js'
import { classifyIntent, detectLang, helpReply, offtopicReply } from './scope.js'
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
      `已摄入 ${args.facts.length} 条事实／证据。`,
      `Skills 命中：${hitLine}。知识库：${kbLine}。`,
      args.adapted
        ? '下一步已依你最新回复／证据重新排序，而非机械贴整份清单。'
        : '请回复你查到的结果或贴上新证据，我会调整建议。',
      '提醒：内部 admin／DB 检索属后续阶段；我不会编造生产数据。',
    ].join(' ')
  }
  if (hant) {
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
    if (lang === 'zh-Hans') return '收到图片消息，但无法解析 image_key。请再传一次，或贴上 OCR 文字。'
    if (lang === 'zh-Hant') return '收到圖片訊息，但無法解析 image_key。請再傳一次，或貼上 OCR 文字。'
    return 'Got an image, but could not parse image_key. Please resend or paste OCR text.'
  }
  try {
    const buf = await downloadMessageImage(msg.messageId, msg.imageKey)
    const b64 = buf.toString('base64')
    const desc = await describeImage({ lang, imageBase64: b64 })
    if (desc) return desc
    if (lang === 'zh-Hans') {
      return '已收到图片。目前无法自动 OCR（未配置视觉模型）。请简述图中告警重点、合约与数值。'
    }
    if (lang === 'zh-Hant') {
      return '已收到圖片。目前無法自動 OCR（未配置視覺模型）。請簡述圖中告警重點、合約與數值。'
    }
    return 'Image received. Auto-OCR unavailable (vision model not configured). Please briefly describe the alert, contract, and values.'
  } catch (e) {
    const err = e instanceof Error ? e.message : 'unknown'
    if (lang === 'zh-Hans') return `图片下载失败：${err}。请改贴文字／表格。`
    if (lang === 'zh-Hant') return `圖片下載失敗：${err}。請改貼文字／表格。`
    return `Image download failed: ${err}. Please paste text/table instead.`
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
  const quoteOps = await fetchQuoteOpsRag(blob.slice(0, 1500))
  const judgePrompt =
    args.lang === 'zh-Hans'
      ? '根据下列事故事实与 RAG 命中，用友好专业语气给出简短研判（不重复整份清单），并说明为何建议这些下一步。优先采用 quote-ops V Exchange 永续知识；忽略 CFD 经纪商定价内容。必须用简体中文回答。'
      : args.lang === 'zh-Hant'
        ? '根據下列事故事實與 RAG 命中，用友好專業語氣給出簡短研判（不重複整份清單），並說明為何建議這些下一步。優先採用 quote-ops V Exchange 永續知識；忽略 CFD 經紀商定價內容。必須用繁體中文回答。'
        : 'Given the incident facts and RAG hits below, give a short friendly-professional judgement (do not dump the full checklist) and why these next steps. Prefer quote-ops V Exchange perpetual knowledge; ignore CFD broker pricing. Reply in English.'
  const llm = await enrichWithLlm({
    lang: args.lang,
    question: judgePrompt,
    context: [
      `FACTS:\n${blob.slice(0, 6000)}`,
      `SKILLS:\n${hits.map((h) => `${h.id} ${h.name} | ${h.check}`).join('\n')}`,
      `KB:\n${kb.map((k) => `${k.title}: ${k.body}`).join('\n')}`,
      quoteOps ? `QUOTE_OPS_RAG:\n${quoteOps}` : '',
      `NEXT:\n${nextSteps.join('\n')}`,
    ]
      .filter(Boolean)
      .join('\n\n'),
  })
  if (llm) llmExtra = `\n\n${llm}`
  else if (quoteOps) llmExtra = `\n\n${quoteOps.slice(0, 1800)}`

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
    const incidents = listIncidents({ limit: 20 })
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
        ? `事故 \`${id}\` 已归档，可供定期复盘。随时输入 \`review\`，或贴新告警重新开始。`
        : lang === 'zh-Hant'
          ? `事故 \`${id}\` 已歸檔，可供定期複盤。隨時輸入 \`review\`，或貼新告警重新開始。`
          : `Incident \`${id}\` archived for regular review. Type \`review\` anytime, or paste a new alert to start fresh.`
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
    const marketTitle =
      lang === 'zh-Hans' ? '市况与趋势' : lang === 'zh-Hant' ? '市況與趨勢' : 'Market trends & conditions'
    return {
      card: simpleCard(marketTitle, llm ? `${base}\n\n---\n${llm}` : base, 'wathet'),
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
        lang === 'zh-Hans'
          ? '已结束本次排查并归档（若有报告）。输入 `review` 查看清单，或贴上新告警重新开始。'
          : lang === 'zh-Hant'
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
        (lang === 'zh-Hans'
          ? '（用户开始排查，尚未提供细节）'
          : lang === 'zh-Hant'
            ? '（使用者開始排查，尚未提供細節）'
            : '(User started investigation without details yet)'),
    })
  }

  // general_risk — answer with local RAG + quote-ops V Exchange RAG + optional LLM
  const { hits, kb, severity } = retrieveRag(workingText)
  const quoteOps = await fetchQuoteOpsRag(workingText)
  const context = [
    `severity=${severity}`,
    `skills=${hits.map((h) => h.id).join(',')}`,
    `kb=${kb.map((k) => k.title).join(',')}`,
    kb.map((k) => `${k.title}: ${k.body}`).join('\n'),
    quoteOps ? `QUOTE_OPS_RAG:\n${quoteOps}` : '',
    'Use V Exchange perpetual knowledge only; do not answer from CFD broker pricing.',
  ]
    .filter(Boolean)
    .join('\n')
  const llm = await enrichWithLlm({ lang, question: workingText, context })
  const body =
    llm ||
    quoteOps ||
    (lang === 'zh-Hans'
      ? '已命中本地 Skills／知识库，但上游 LLM 暂不可用。请输入 `investigate` 进入引导排查。'
      : lang === 'zh-Hant'
        ? '已命中本地 Skills／知識庫，但上游 LLM 暫不可用。請輸入 `investigate` 進入引導排查。'
        : null)
  if (body) {
    const replyTitle =
      lang === 'zh-Hans' ? '风险助手回复' : lang === 'zh-Hant' ? '風險助手回覆' : 'Risk assistant reply'
    const footer =
      lang === 'zh-Hans'
        ? '_来源含 quote-ops V Exchange 永续知识库。若这是事故，请回复更多证据或输入 `investigate`。_'
        : lang === 'zh-Hant'
          ? '_來源含 quote-ops V Exchange 永續知識庫。若這是事故，請回覆更多證據或輸入 `investigate`。_'
          : '_Sources include quote-ops V Exchange perpetual KB. If this is an incident, add evidence or type `investigate`._'
    return {
      card: simpleCard(replyTitle, `${body}\n\n---\n${footer}`),
    }
  }

  const fallback =
    lang === 'zh-Hans'
      ? [
          '这看起来与 V Exchange 风险相关。我可以：',
          '• 输入 `market` 看市况',
          '• 贴告警／截图并输入 `investigate` 开始排查',
          '• 输入 `review` 看已累积事故',
          hits.length ? `初步 Skills 提示：${hits.map((h) => h.id).join(', ')}` : '',
        ]
          .filter(Boolean)
          .join('\n')
      : lang === 'zh-Hant'
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
