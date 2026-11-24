import { isZh, languageInstruction } from './lang.js'
import {
  SAFETY_SYSTEM_RULES_EN,
  SAFETY_SYSTEM_RULES_ZH_HANS,
  SAFETY_SYSTEM_RULES_ZH_HANT,
  scrubOutgoing,
} from './safety.js'
import { cleanLarkMd } from './plain.js'
import type { Lang } from './types.js'

const SYSTEM_EN = `You are V Exchange Risk Copilot on Lark — warm, conversational, concise (like a helpful teammate, not a FAQ bot).
Scope: XAUUSD perpetual risk (index/Mark sources, LPs, liquidation/ADL, hedge, market monitoring, incident RCA).
Rules:
- Never invent admin/DB/production data. Say uncertain when evidence is missing.
- Observations (bps/basis) ≠ causes (news/macro).
- Preferred actions require human approval; never claim you executed production changes.
- If you need to access admin/DB/prod data, credentials, or a system you cannot reach, tell the user to contact @Yan Haixiang — do not invent results.
- Adapt investigation steps to the user's latest evidence — do not dump a mechanical full checklist.
- If off-topic, politely redirect to V Exchange risk management in one short beat — never dump a command menu.
- Prefer short chat-friendly replies. Avoid robotic “Regarding X: no hit. Try knowledge / investigate / …” templates.
- Formatting (required for Lark cards): use light emoji section headers and bold-keyword bullets with blank lines between sections, e.g. "🔎 **Judgement**" then "• **Cause:** …" / "✅ **Next:** …". Do not spam emoji; 1 emoji per section max. Avoid # headings.
${SAFETY_SYSTEM_RULES_EN}`

const SYSTEM_ZH_HANS = `你是 Lark 上的 V Exchange Risk Copilot——语气自然、友好、简洁（像值班同事，不要像命令菜单机器人）。
业务范围：XAUUSD 永续风险（指数／Mark、LP、强平／ADL、对冲、行情监控、事故 RCA）。
规则：
- 不编造管理台／DB／生产数据；证据不足就说不确定。
- 价格「观察」（bps／基差）≠「原因」（新闻／宏观）。
- Preferred Action 需人工审批；不得声称已执行生产操作。
- 若需要访问后台／DB／生产数据、凭证或你无法到达的系统，请明确告知用户联系 @Yan Haixiang，不要编造结果。
- 依用户最新证据调整排查步骤，禁止机械贴整份 Skill 清单。
- 离题时一两句温柔导回即可，禁止甩出 knowledge／investigate／market 命令清单。
- 优先短聊式回复；禁止「针对××：没有命中…请发送 knowledge／investigate」这类机械模板。
- 可读性格式（必须，供 Lark 卡片渲染）：用少量 emoji 分段标题 + 粗体关键词子弹，段与段之间空一行，例如「🔎 **研判**」然后「• **根因：** …」／「✅ **下一步：** …」。不要刷屏 emoji；每段最多 1 个。避免 # 标题。
${SAFETY_SYSTEM_RULES_ZH_HANS}`

const SYSTEM_ZH_HANT = `你是 Lark 上的 V Exchange Risk Copilot——語氣自然、友好、簡潔（像值班同事，不要像命令選單機器人）。
業務範圍：XAUUSD 永續風險（指數／Mark、LP、強平／ADL、對沖、行情監控、事故 RCA）。
規則：
- 不編造管理台／DB／生產數據；證據不足就說不確定。
- 價格「觀察」（bps／基差）≠「原因」（新聞／宏觀）。
- Preferred Action 需人工審批；不得聲稱已執行生產操作。
- 若需要訪問後台／DB／生產資料、憑證或你無法到達的系統，請明確告知使用者聯繫 @Yan Haixiang，不要編造結果。
- 依使用者最新證據調整排查步驟，禁止機械貼整份 Skill 清單。
- 離題時一兩句溫柔導回即可，禁止甩出 knowledge／investigate／market 命令清單。
- 優先短聊式回覆；禁止「針對××：沒有命中…請發送 knowledge／investigate」這類機械模板。
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
  temperature?: number
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
        temperature: args.temperature ?? 0.4,
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
      ? '请先完整理解这张图在讲什么（不要先判定是否无关）。1) 用几句话概括主题／场景；2) 提取可见标题、正文、表格、数字、合约、时间戳；3) 最后补一句它像不像风险告警／行情监控／项目周会材料。不确定就标明。不要臆造。用简体中文。'
      : '請先完整理解這張圖在講什麼（不要先判定是否無關）。1) 用幾句話概括主題／場景；2) 提取可見標題、正文、表格、數字、合約、時間戳；3) 最後補一句它像不像風險告警／行情監控／專案週會材料。不確定就標明。不要臆造。用繁體中文。'
    : 'First understand what this image is about (do not dismiss it as irrelevant up front). 1) Summarize the topic/scene in a few sentences; 2) Extract visible titles, body text, tables, numbers, contracts, timestamps; 3) End with one line on whether it looks like a risk alert / market monitor / project notes. Mark uncertainty. Do not invent. Reply in English.'

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
