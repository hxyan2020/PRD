import type { Lang } from './types.js'

const MEDIA_TYPES = new Set([
  'image',
  'file',
  'media',
  'audio',
  'video',
  'share_chat',
  'share_user',
  // merge_forward is handled via enrichIncomingEvidence → investigate, not doc-share ingest
  'folder',
  'drive',
  'docx',
  'sticker',
])

/** True when the inbound message is (or looks like) an attachment / share card. */
export function isAttachmentMessage(messageType: string, text: string, imageKey?: string): boolean {
  if (imageKey) return true
  if (MEDIA_TYPES.has(String(messageType || '').toLowerCase())) return true
  const t = text || ''
  return /^\[(file|share|docx|wiki|image)/i.test(t) || /share_chat|file attachment/i.test(t)
}

/** Risk / ops cues — used only AFTER we already reiterated what the attachment is. */
export function attachmentLooksRiskRelated(digest: string): boolean {
  return /告警|报警|報警|预警|預警|\balert\b|\bincident\b|\brca\b|排查|强平|強平|\badl\b|指数|指數|\bmark\b|\bindex\b|偏离|偏差|bps|funding|行情|监控|監控|永续|永續|风险|風險|定价|定價|报价|報價|liquidity|\blp\b|价差|價差|\bspread\b|阈值|閾值|买一|賣一|卖一|\[forwarded_card\]/i.test(
    digest,
  )
}

/** Harvest human-readable strings from opaque Feishu share/file JSON. */
export function harvestAttachmentText(rawContent: string, fallbackText = ''): string {
  const parts: string[] = []
  if (fallbackText.trim()) parts.push(fallbackText.trim())
  try {
    const walk = (v: unknown, depth: number) => {
      if (depth > 6 || v == null) return
      if (typeof v === 'string') {
        const s = v.trim()
        if (
          s.length >= 2 &&
          s.length <= 500 &&
          !/^\{/.test(s) &&
          !/^(https?:\/\/open\.feishu\.cn)/i.test(s) &&
          !/^[A-Za-z0-9_-]{20,}$/.test(s) // bare tokens
        ) {
          parts.push(s)
        }
        // Keep doc URLs — useful for read attempts
        if (/feishu\.cn\/(docx|wiki|sheets|base)\//i.test(s) || /larksuite\.com\/(docx|wiki)\//i.test(s)) {
          parts.push(s)
        }
        return
      }
      if (Array.isArray(v)) {
        for (const x of v) walk(x, depth + 1)
        return
      }
      if (typeof v === 'object') {
        for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
          if (/token|key|id|secret|cipher/i.test(k) && typeof val === 'string' && val.length > 12) continue
          walk(val, depth + 1)
        }
      }
    }
    walk(JSON.parse(rawContent), 0)
  } catch {
    /* ignore */
  }
  const seen = new Set<string>()
  const out: string[] = []
  for (const p of parts) {
    const k = p.toLowerCase()
    if (seen.has(k)) continue
    seen.add(k)
    out.push(p)
  }
  return out.join('\n').slice(0, 2500)
}

export function extractDocUrlOrToken(text: string): { url?: string; token?: string; kind?: string } {
  const t = text || ''
  const urlMatch = t.match(/https?:\/\/[^\s)]+(?:feishu\.cn|larksuite\.com)\/(docx|wiki|sheets)\/([A-Za-z0-9]+)/i)
  if (urlMatch) {
    return { url: urlMatch[0], kind: urlMatch[1], token: urlMatch[2] }
  }
  const bare = t.match(/\b(docx|wiki)[/:]([A-Za-z0-9]{10,})\b/i)
  if (bare) return { kind: bare[1], token: bare[2] }
  return {}
}

/**
 * Card body: always reiterate what we saw first, then relevance, then next step.
 * Never jump straight to “offtopic / out of scope”.
 */
export function formatAttachmentUnderstanding(args: {
  lang: Lang
  kind: string
  digest: string
  riskRelated: boolean
  userAsk?: string
}): string {
  const dig = (args.digest || '').trim() || (
    args.lang === 'zh-Hans'
      ? '（已收到附件，但暂时没解析出可读正文。）'
      : args.lang === 'zh-Hant'
        ? '（已收到附件，但暫時沒解析出可讀正文。）'
        : '(Attachment received, but no readable body yet.)'
  )
  const kindLabel =
    args.lang === 'zh-Hans'
      ? args.kind === 'image'
        ? '图片'
        : args.kind === 'file'
          ? '文件'
          : '分享／附件'
      : args.lang === 'zh-Hant'
        ? args.kind === 'image'
          ? '圖片'
          : args.kind === 'file'
            ? '檔案'
            : '分享／附件'
        : args.kind === 'image'
          ? 'image'
          : args.kind === 'file'
            ? 'file'
            : 'share / attachment'

  if (args.lang === 'zh-Hans') {
    const lines = [
      `👀 **我先看了一下这份${kindLabel}**`,
      '',
      dig.slice(0, 1200),
      '',
      '🧭 **相关性**',
      args.riskRelated
        ? '• 这和 **CFD 定价风控／报价链路／监控／排查** 相关，我可以继续帮你看。'
        : '• 目前看起来不一定是告警／行情排查材料；若你有具体问题，直接问我即可。',
    ]
    if (args.userAsk?.trim()) {
      lines.push('', `💬 **你的问题：** ${args.userAsk.trim().slice(0, 120)}`)
    }
    if (args.riskRelated) {
      lines.push('', '_要排查的话，直接说重点或发 **investigate**；我也可以按这份内容继续问澄清问题。_')
    } else {
      lines.push('', '_如果其实和风控有关，补一句场景（例如报价监控／周会里的卡点），我按那个角度帮你看。_')
    }
    return lines.join('\n')
  }

  if (args.lang === 'zh-Hant') {
    const lines = [
      `👀 **我先看了一下這份${kindLabel}**`,
      '',
      dig.slice(0, 1200),
      '',
      '🧭 **相關性**',
      args.riskRelated
        ? '• 這和 **CFD 定價風控／報價鏈路／監控／排查** 相關，我可以繼續幫你看。'
        : '• 目前看起來不一定是告警／行情排查材料；若你有具體問題，直接問我即可。',
    ]
    if (args.userAsk?.trim()) {
      lines.push('', `💬 **你的問題：** ${args.userAsk.trim().slice(0, 120)}`)
    }
    if (args.riskRelated) {
      lines.push('', '_要排查的話，直接說重點或發 **investigate**；我也可以按這份內容繼續問澄清問題。_')
    } else {
      lines.push('', '_如果其實和風控有關，補一句場景，我按那個角度幫你看。_')
    }
    return lines.join('\n')
  }

  const lines = [
    `👀 **Here’s what I took from this ${kindLabel}**`,
    '',
    dig.slice(0, 1200),
    '',
    '🧭 **Relevance**',
    args.riskRelated
      ? '• This looks related to **CFD pricing risk / quote pipeline / monitoring / investigation** — I can dig further.'
      : '• This may not be an alert/market investigation artifact; ask me anything specific you need.',
  ]
  if (args.userAsk?.trim()) {
    lines.push('', `💬 **Your question:** ${args.userAsk.trim().slice(0, 120)}`)
  }
  if (args.riskRelated) {
    lines.push('', '_Say the focus or send **investigate** and I’ll continue from this content._')
  } else {
    lines.push('', '_If it is risk-related, add one line of context and I’ll take that angle._')
  }
  return lines.join('\n')
}
