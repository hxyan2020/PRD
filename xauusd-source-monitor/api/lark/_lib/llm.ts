import type { Lang } from './types'

const SYSTEM_EN = `You are V Exchange Risk Copilot on Lark — friendly, professional, concise.
Scope: XAUUSD perpetual risk (index/Mark sources, LPs, liquidation/ADL, hedge, market monitoring, incident RCA).
Rules:
- Never invent admin/DB/production data. Say uncertain when evidence is missing.
- Observations (bps/basis) ≠ causes (news/macro).
- Preferred actions require human approval; never claim you executed production changes.
- Adapt investigation steps to the user's latest evidence — do not dump a mechanical full checklist.
- If off-topic, politely redirect to V Exchange risk management.
- Prefer short paragraphs suitable for chat; use bullet lists for steps.`

const SYSTEM_ZH = `你是 Lark 上的 V Exchange Risk Copilot——語氣友好、專業、簡潔。
業務範圍：XAUUSD 永續風險（指數／Mark、LP、強平／ADL、對沖、行情監控、事故 RCA）。
規則：
- 不編造管理台／DB／生產數據；證據不足就說不確定。
- 價格「觀察」（bps／基差）≠「原因」（新聞／宏觀）。
- Preferred Action 需人工審批；不得聲稱已執行生產操作。
- 依使用者最新證據調整排查步驟，禁止機械貼整份 Skill 清單。
- 離題時溫柔導回 V Exchange 風險管理。
- 回覆適合聊天：短段落＋條列步驟。`

export async function chatComplete(args: {
  lang: Lang
  user: string
  systemExtra?: string
}): Promise<string | null> {
  const key = process.env.OPENAI_API_KEY || ''
  if (!key) return null
  const system =
    (args.lang === 'zh-Hant' ? SYSTEM_ZH : SYSTEM_EN) +
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
    return data.choices?.[0]?.message?.content?.trim() || null
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
  const prompt =
    args.lang === 'zh-Hant'
      ? '這是 V Exchange 風險告警／監控截圖。請提取所有可見文字、數值、合約、時間戳與表格內容；標註不確定處。不要臆造。'
      : 'This is a V Exchange risk alert / monitoring screenshot. Extract all visible text, numbers, contracts, timestamps, and table cells. Mark uncertainty. Do not invent.'

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
    return data.choices?.[0]?.message?.content?.trim() || null
  } catch {
    return null
  }
}
