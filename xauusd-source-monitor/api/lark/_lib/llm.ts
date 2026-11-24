import { isZh, languageInstruction } from './lang.js'
import {
  SAFETY_SYSTEM_RULES_EN,
  SAFETY_SYSTEM_RULES_ZH_HANS,
  SAFETY_SYSTEM_RULES_ZH_HANT,
  scrubOutgoing,
} from './safety.js'
import { cleanLarkMd } from './plain.js'
import type { Lang } from './types.js'

const SYSTEM_EN = `You are V Exchange Risk Copilot on Lark — friendly, professional, concise.
Scope: XAUUSD perpetual risk (index/Mark sources, LPs, liquidation/ADL, hedge, market monitoring, incident RCA).
Rules:
- Never invent admin/DB/production data. Say uncertain when evidence is missing.
- Observations (bps/basis) ≠ causes (news/macro).
- Preferred actions require human approval; never claim you executed production changes.
- Adapt investigation steps to the user's latest evidence — do not dump a mechanical full checklist.
- If off-topic, politely redirect to V Exchange risk management.
- Prefer short chat-friendly replies.
- Formatting (required for Lark cards): use light emoji section headers and bold-keyword bullets with blank lines between sections, e.g. "🔎 **Judgement**" then "• **Cause:** …" / "✅ **Next:** …". Do not spam emoji; 1 emoji per section max. Avoid # headings.
${SAFETY_SYSTEM_RULES_EN}`

const SYSTEM_ZH_HANS = `你是 Lark 上的 V Exchange Risk Copilot——语气友好、专业、简洁。
业务范围：XAUUSD 永续风险（指数／Mark、LP、强平／ADL、对冲、行情监控、事故 RCA）。
规则：
- 不编造管理台／DB／生产数据；证据不足就说不确定。
- 价格「观察」（bps／基差）≠「原因」（新闻／宏观）。
- Preferred Action 需人工审批；不得声称已执行生产操作。
- 依用户最新证据调整排查步骤，禁止机械贴整份 Skill 清单。
- 离题时温柔导回 V Exchange 风险管理。
- 可读性格式（必须，供 Lark 卡片渲染）：用少量 emoji 分段标题 + 粗体关键词子弹，段与段之间空一行，例如「🔎 **研判**」然后「• **根因：** …」／「✅ **下一步：** …」。不要刷屏 emoji；每段最多 1 个。避免 # 标题。
${SAFETY_SYSTEM_RULES_ZH_HANS}`

const SYSTEM_ZH_HANT = `你是 Lark 上的 V Exchange Risk Copilot——語氣友好、專業、簡潔。
業務範圍：XAUUSD 永續風險（指數／Mark、LP、強平／ADL、對沖、行情監控、事故 RCA）。
規則：
- 不編造管理台／DB／生產數據；證據不足就說不確定。
- 價格「觀察」（bps／基差）≠「原因」（新聞／宏觀）。
- Preferred Action 需人工審批；不得聲稱已執行生產操作。
- 依使用者最新證據調整排查步驟，禁止機械貼整份 Skill 清單。
- 離題時溫柔導回 V Exchange 風險管理。
- 可讀性格式（必須，供 Lark 卡片渲染）：用少量 emoji 分段標題 + 粗體關鍵詞子彈，段與段之間空一行，例如「🔎 **研判**」然後「• **根因：** …」／「✅ **下一步：** …」。不要刷屏 emoji；每段最多 1 個。避免 # 標題。
${SAFETY_SYSTEM_RULES_ZH_HANT}`

function systemFor(lang: Lang): string {
  if (lang === 'zh-Hans') return SYSTEM_ZH_HANS
  if (lang === 'zh-Hant') return SYSTEM_ZH_HANT
  return SYSTEM_EN
}

export async function chatComplete(args: {
  lang: Lang
  user: string
  systemExtra?: string
}): Promise<string | null> {
  const key = process.env.OPENAI_API_KEY || ''
  if (!key) return null
  const system =
    systemFor(args.lang) +
    `\n\n${languageInstruction(args.lang)}` +
    (args.systemExtra ? `\n\nContext:\n${args.systemExtra}` : '')

  try {
    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: process.env.LARK_LLM_MODEL || 'gpt-4o-mini',
        temperature: 0.3,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: args.user },
        ],
      }),
      signal: AbortSignal.timeout(45_000),
    })
    const data = (await r.json()) as {
      choices?: { message?: { content?: string } }[]
    }
    if (!r.ok) return null
    const raw = data.choices?.[0]?.message?.content?.trim() || ''
    return raw ? cleanLarkMd(scrubOutgoing(raw)) : null
  } catch {
    return null
  }
}

/** Vision OCR / describe for alert screenshots. */
export async function describeImage(args: {
  lang: Lang
  imageBase64: string
  mime?: string
}): Promise<string | null> {
  const key = process.env.OPENAI_API_KEY || ''
  if (!key) return null
  const prompt = isZh(args.lang)
    ? args.lang === 'zh-Hans'
      ? '这是 V Exchange 风险告警／监控截图。请提取所有可见文字、数值、合约、时间戳与表格内容；标注不确定处。不要臆造。用简体中文输出。'
      : '這是 V Exchange 風險告警／監控截圖。請提取所有可見文字、數值、合約、時間戳與表格內容；標註不確定處。不要臆造。用繁體中文輸出。'
    : 'This is a V Exchange risk alert / monitoring screenshot. Extract all visible text, numbers, contracts, timestamps, and table cells. Mark uncertainty. Do not invent. Reply in English.'

  try {
    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: process.env.LARK_VISION_MODEL || 'gpt-4o-mini',
        temperature: 0.1,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${args.mime || 'image/png'};base64,${args.imageBase64}`,
                },
              },
            ],
          },
        ],
      }),
      signal: AbortSignal.timeout(60_000),
    })
    const data = (await r.json()) as {
      choices?: { message?: { content?: string } }[]
    }
    if (!r.ok) return null
    const raw = data.choices?.[0]?.message?.content?.trim() || ''
    return raw ? cleanLarkMd(scrubOutgoing(raw)) : null
  } catch {
    return null
  }
}
