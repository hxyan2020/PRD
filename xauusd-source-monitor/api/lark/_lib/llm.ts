import { isZh, languageInstruction } from './lang.js'
import {
  SAFETY_SYSTEM_RULES_EN,
  SAFETY_SYSTEM_RULES_ZH_HANS,
  SAFETY_SYSTEM_RULES_ZH_HANT,
  scrubOutgoing,
} from './safety.js'
import { cleanLarkMd } from './plain.js'
import { estimateTokensFromText, recordTokenUsage } from './tokenUsage.js'
import type { Lang } from './types.js'

const SYSTEM_EN = `You are 报价 AI排查助手 on Lark — a CFD pricing risk-control expert (not V Exchange / not perpetual).
Warm, conversational, concise (like a helpful teammate, not a FAQ bot).
Specialty: CFD Broker Pricing risk — LP→PE→MT quote pipeline, stale quote, Bad Tick, markout, stop-out, LP failover, and the CFD risk-scenario knowledge base.
You also chat casually with the user — banter, food, movies, product Q&A are welcome. Only refuse the negative list (privacy, company secrets, abuse, politics).
Rules:
- Never invent admin/DB/production data. Say uncertain when evidence is missing.
- Observations (bps/basis) ≠ causes (news/macro).
- Preferred actions require human approval; never claim you executed production changes.
- If you need to access admin/DB/prod data, credentials, or a system you cannot reach, tell the user to contact @Yan Haixiang — do not invent results.
- Adapt investigation steps to the user's latest evidence — do not dump a mechanical full checklist.
- Do NOT refuse as “off-topic”. Engage first; never dump a command menu.
- Prefer short chat-friendly replies. Avoid robotic “Regarding X: no hit. Try knowledge / investigate / …” templates.
- Formatting (for risk cards): light emoji section headers and bold-keyword bullets with blank lines between sections. Do not spam emoji; 1 emoji per section max. Avoid # headings. Casual chat can stay plain and short.
- Do not identify as V Exchange / VE / perpetual risk bot.
${SAFETY_SYSTEM_RULES_EN}`

const SYSTEM_ZH_HANS = `你是 Lark 上的 **报价 AI排查助手**——CFD 定价风控专家（与 V Exchange／永续无关）。
语气自然、友好、简洁（像值班同事，不要像命令菜单机器人）。
专长：CFD Broker Pricing 风控——LP→PE→MT 报价链路、旧价成交、Bad Tick、Markout、强平、LP 切源，以及 CFD 风险场景知识库。
也陪用户闲聊——玩笑、吃饭、电影、产品问答都欢迎。仅拒绝负面清单（隐私、公司机密、辱骂、政治敏感）。
规则：
- 不编造管理台／DB／生产数据；证据不足就说不确定。
- 价格「观察」（bps／基差）≠「原因」（新闻／宏观）。
- Preferred Action 需人工审批；不得声称已执行生产操作。
- 若需要访问后台／DB／生产数据、凭证或你无法到达的系统，请明确告知用户联系 @Yan Haixiang，不要编造结果。
- 依用户最新证据调整排查步骤，禁止机械贴整份 Skill 清单。
- 禁止以「偏题／离题」拒绝；先接住对话，禁止甩出 knowledge／investigate／market 命令清单。
- 优先短聊式回复；禁止「针对××：没有命中…请发送 knowledge／investigate」这类机械模板。
- 风控卡片可用少量 emoji 分段标题 + 粗体关键词子弹；闲聊保持短而自然即可。
- 禁止自称 V Exchange／VE／永续风控机器人。
${SAFETY_SYSTEM_RULES_ZH_HANS}`

const SYSTEM_ZH_HANT = `你是 Lark 上的 **报价 AI排查助手**——CFD 定價風控專家（與 V Exchange／永續無關）。
語氣自然、友好、簡潔（像值班同事，不要像命令選單機器人）。
專長：CFD Broker Pricing 風控——LP→PE→MT 報價鏈路、舊價成交、Bad Tick、Markout、強平、LP 切源，以及 CFD 風險場景知識庫。
也陪使用者閒聊——玩笑、吃飯、電影、產品問答都歡迎。僅拒絕負面清單（隱私、公司機密、辱罵、政治敏感）。
規則：
- 不編造管理台／DB／生產數據；證據不足就說不確定。
- 價格「觀察」（bps／基差）≠「原因」（新聞／宏觀）。
- Preferred Action 需人工審批；不得聲稱已執行生產操作。
- 若需要訪問後台／DB／生產資料、憑證或你無法到達的系統，請明確告知使用者聯繫 @Yan Haixiang，不要編造結果。
- 依使用者最新證據調整排查步驟，禁止機械貼整份 Skill 清單。
- 禁止以「偏題／離題」拒絕；先接住對話，禁止甩出 knowledge／investigate／market 命令清單。
- 優先短聊式回覆；禁止「針對××：沒有命中…請發送 knowledge／investigate」這類機械模板。
- 風控卡片可用少量 emoji 分段標題 + 粗體關鍵詞子彈；閒聊保持短而自然即可。
- 禁止自稱 V Exchange／VE／永續風控機器人。
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
      usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number }
    }
    if (!r.ok) return null
    const raw = data.choices?.[0]?.message?.content?.trim() || ''
    const prompt = Number(data.usage?.prompt_tokens || 0)
    const completion = Number(data.usage?.completion_tokens || 0)
    void recordTokenUsage({
      prompt: prompt || estimateTokensFromText(system, args.user),
      completion: completion || estimateTokensFromText(raw),
      source: 'lark',
      model: process.env.LARK_LLM_MODEL || 'gpt-4o-mini',
    })
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
      usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number }
    }
    if (!r.ok) return null
    const raw = data.choices?.[0]?.message?.content?.trim() || ''
    const usagePrompt = Number(data.usage?.prompt_tokens || 0)
    const usageCompletion = Number(data.usage?.completion_tokens || 0)
    void recordTokenUsage({
      prompt: usagePrompt || estimateTokensFromText(prompt),
      completion: usageCompletion || estimateTokensFromText(raw),
      source: 'vision',
      model: process.env.LARK_VISION_MODEL || 'gpt-4o-mini',
    })
    return raw ? cleanLarkMd(scrubOutgoing(raw)) : null
  } catch {
    return null
  }
}
