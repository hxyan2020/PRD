import type { Intent, Lang } from './types.js'

export { detectLang, isZh } from './lang.js'

const MARKET_RE =
  /行情|趋势|趨勢|市况|市況|\bmarket\b|\btrends?\b|\bgold\b|\bxau\b|\bxauusd\b|黄金|黃金|\bdxy\b|美元|波动|波動|基差|\bbps\b|溢价|溢價|折价|折價|\bokx\b|\bbinance\b|\bbybit\b|\bkraken\b|\bkitco\b|\bspot\b|k线|k線|\bcandles?\b/i

const INVESTIGATE_RE =
  /排查|调查|調查|告警|报警|報警|\bincident\b|\balerts?\b|\binvestigate\b|\brca\b|根因|强平|強平|\badl\b|指数源|指數源|\bmarks?\b|\bindex\b|\blp\b|对冲|對沖|拒单|拒單|盘口|盤口|偏差|剔除|无有效源|無有效源|失败|失敗|异常|異常|截图|截圖|表格|\btable\b|\breports?\b|报告|報告/i

const REVIEW_RE = /复盘|複盤|\breview\b|\barchive\b|归档|歸檔|事故清单|事故清單|\bincidents\b|定期回顾|定期回顧/i

const HELP_RE = /^(help|帮助|幫助|\?|你好|您好|hi|hello|start|开始|開始)\s*$/i

const COMMAND_INVESTIGATE = /^(investigate|排查|開始排查|开始排查)\b/i
const COMMAND_MARKET = /^(market|行情|趋势|趨勢)\b/i
const COMMAND_REVIEW = /^(review|复盘|複盤|archive|归档|歸檔)\b/i
const COMMAND_HELP = /^(help|帮助|幫助)\b/i
const COMMAND_DONE = /^(done|完成|结束排查|結束排查|reset|重置)\b/i

/** Clearly out-of-scope topics for a V Exchange risk bot. */
const OFFTOPIC_RE =
  /天气|天氣|食谱|食譜|做饭|做飯|\bcook\b|\bdinner\b|\brecipe\b|笑话|笑話|恋爱|戀愛|星座|彩票|\bfootball\b|\bnba\b|电影推荐|電影推薦|写代码作业|寫代碼作業|助记词|助記詞|\bhack\b|\bphishing\b|钓鱼|釣魚|今晚吃什么|吃什麼/i

const IN_SCOPE_HINT =
  /v\s*exchange|永续|永續|\brisk\b|风险|風險|\bxauusd\b|合约|合約|定价|定價|监控|監控|\bsource\b|源/i

export function classifyIntent(
  text: string,
  opts: { inInvestigateSession: boolean; mentionedBot: boolean; chatType: string },
): Intent {
  const t = text.trim()
  if (!t) {
    if (opts.mentionedBot) return 'ack_mention'
    return opts.inInvestigateSession ? 'followup' : 'help'
  }

  if (COMMAND_HELP.test(t) || HELP_RE.test(t)) return 'help'
  if (COMMAND_REVIEW.test(t) || REVIEW_RE.test(t)) return 'review'
  if (COMMAND_DONE.test(t)) return 'archive'
  if (COMMAND_MARKET.test(t)) return 'market'
  if (COMMAND_INVESTIGATE.test(t)) return 'investigate'

  // Active investigation: treat free-text as evidence/follow-up unless explicit command above
  if (opts.inInvestigateSession) return 'followup'

  if (OFFTOPIC_RE.test(t) && !IN_SCOPE_HINT.test(t) && !INVESTIGATE_RE.test(t) && !MARKET_RE.test(t)) {
    return 'offtopic'
  }

  if (MARKET_RE.test(t) && !INVESTIGATE_RE.test(t)) return 'market'
  if (INVESTIGATE_RE.test(t)) return 'investigate'

  // Vague @ mention with no content
  if (opts.mentionedBot && t.length < 8) return 'ack_mention'

  if (IN_SCOPE_HINT.test(t) || MARKET_RE.test(t) || INVESTIGATE_RE.test(t)) return 'general_risk'
  if (t.length > 24 && !IN_SCOPE_HINT.test(t) && !MARKET_RE.test(t)) return 'offtopic'

  return 'general_risk'
}

export function offtopicReply(lang: Lang): string {
  if (lang === 'zh-Hans') {
    return '谢谢提问 🙂 我主要为 **V Exchange 风险管理** 服务（XAUUSD 永续、指数／Mark、LP、强平／ADL、行情监控与事故排查）。这个问题超出我的训练范围，建议改问行情趋势、告警排查或事故复盘——我很乐意协助。'
  }
  if (lang === 'zh-Hant') {
    return '多謝提問 🙂 我主要服務 **V Exchange 風險管理**（XAUUSD 永續、指數／Mark、LP、強平／ADL、行情監控與事故排查）。這個問題超出我的訓練範圍，建議改問行情趨勢、告警排查或事故複盤——我很樂意協助。'
  }
  return 'Thanks for reaching out 🙂 I’m trained for **V Exchange risk management** (XAUUSD perps, index/Mark, LPs, liquidation/ADL, market monitoring, and incident investigation). That question is outside my scope — try market trends, alert investigation, or incident review, and I’ll gladly help.'
}

export function helpReply(lang: Lang): string {
  if (lang === 'zh-Hans') {
    return [
      '你好，我是 **V Exchange Risk Copilot**（Lark）。我可以：',
      '1. 回答 XAUUSD／黄金与相关市况、趋势问题',
      '2. 读取告警文字、图片、表格，引导排查并生成报告',
      '3. 从 Skills／知识库（RAG）检索，按你回复的新证据调整下一步',
      '4. 累积事故与报告，支持定期复盘（输入 `review`）',
      '',
      '常用指令：`market` · `investigate` · `review` · `help`',
      '群聊请 @我；私聊可直接发送。语气友好、结论需人工审批。我会跟随你的语言（中／英）回复。',
    ].join('\n')
  }
  if (lang === 'zh-Hant') {
    return [
      '你好，我是 **V Exchange Risk Copilot**（Lark）。我可以：',
      '1. 回答 XAUUSD／黃金與相關市況、趨勢問題',
      '2. 讀取告警文字、圖片、表格，引導排查並生成報告',
      '3. 從 Skills／知識庫（RAG）檢索，按你回覆的新證據調整下一步',
      '4. 累積事故與報告，支援定期複盤（輸入 `review`）',
      '',
      '常用指令：`market` · `investigate` · `review` · `help`',
      '群聊請 @我；私聊可直接發送。語氣友好、結論需人工審批。我會跟隨你的語言（中／英）回覆。',
    ].join('\n')
  }
  return [
    'Hi — I’m **V Exchange Risk Copilot** on Lark. I can:',
    '1. Answer XAUUSD / gold market trend & condition questions',
    '2. Read alerts, text, images, and tables; guide investigation and draft reports',
    '3. Retrieve Skills / knowledge (RAG) and adapt next steps from your new evidence',
    '4. Accumulate incidents & reports for regular review (`review`)',
    '',
    'Commands: `market` · `investigate` · `review` · `help`',
    'In groups, please @me; in DMs just send a message. Friendly tone; actions need human approval. I mirror your language (EN / 中文).',
  ].join('\n')
}
