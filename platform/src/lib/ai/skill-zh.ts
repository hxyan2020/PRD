/** Traditional Chinese overlays for skill playbooks. Missing keys fall back to generated copy. */
export type SkillZh = {
  name: string;
  description: string;
  why: string;
  indicator_name?: string;
  fault_areas?: string[];
  when_to_use?: string[];
  when_not_to_use?: string[];
  prechecks?: string[];
  evidence_to_collect?: string[];
  stop_conditions?: string[];
  success_criteria?: string[];
  corrections?: string[];
  steps?: string[];
};

export const SKILL_ZH: Record<string, SkillZh> = {
  "SKILL-MARGIN-SPIKE": {
    name: "保證金使用率暴衝（≥100 帳戶 >90%）",
    description: "波動時段大量帳戶保證金使用率超過 90% 時的信貸連鎖風險。",
    why: "≥100 個受壓帳戶時，強平叢集可同時衝擊公司權益與 LP 成交；50 為台面人力預警。",
    indicator_name: "保證金使用率 >90% 帳戶數",
    fault_areas: ["跟單槓桿傳染", "過期報價導致延遲強平", "週末缺口／新聞衝擊未拉闊 A-book", "贈金濫用推高名目對權益比"],
    corrections: ["對應受壓帳戶與頭部訊號提供者", "對有毒商品暫時下調組別槓桿（人工關卡）", "凍結新帳戶槓桿上調"],
    steps: ["通知信貸與客戶風險", "檢查保證金暴衝是否對應頭部跟單提供者", "若非宏觀日曆可解釋，考慮組別槓桿下調"],
  },
  "SKILL-COPY-CONCENTRATION": {
    name: "跟單提供者集中度違規（>25%）",
    description: "單一訊號提供者主導跟單權益 — 相關強平與有毒流量。",
    why: "超過 25% 時單一提供者可同步帶動帳簿損益與保證金使用；15% 啟動容量覆核。",
    indicator_name: "頭部訊號提供者跟單集中度",
    fault_areas: ["提供者行銷暴衝", "缺少每提供者權益上限", "高槓桿商品鏡像", "女巫／多帳戶跟單"],
  },
  "SKILL-CRYPTO-HOT-WALLET": {
    name: "熱錢包浮額偏高（≥15%）",
    description: "熱錢包佔總託管比例過高時的託管控制。",
    why: "產業慣例維持低熱錢包浮額；≥25% 為營運／資安違規，需節流出金。",
    indicator_name: "熱錢包浮額比例",
    fault_areas: ["冷錢包歸集任務延遲", "自動歸集前入金暴衝", "人工營運覆寫", "橋接壅塞延遲冷轉"],
  },
  "SKILL-LP-REJECT-STORM": {
    name: "LP 拒單率風暴（≥5%）",
    description: "LP 拒單上升導致客戶成交失敗、B-book 庫存與滑點惡化。",
    why: "拒單率 ≥5% 代表橋接或 LP 健康惡化；客戶會卡在未對沖曝險。",
    indicator_name: "LP 拒單率（oneZero）",
  },
  "SKILL-HEDGE-COVERAGE": {
    name: "對沖覆蓋低於目標（<85%）",
    description: "目標對沖覆蓋不足，公司庫存暴露於方向性風險。",
    why: "覆蓋 <85% 時庫存方向性風險上升；應檢查 LP 額度與 A-book 路由。",
    indicator_name: "對沖覆蓋率",
  },
  "SKILL-FRAUD-CLUSTER": {
    name: "多帳戶詐欺叢集（≥0.85）",
    description: "KYC／裝置／資金圖顯示關聯帳戶協同交易或濫用活動。",
    why: "分數 ≥0.85 幾乎確定多帳戶協同；0.7 為調查預警。",
    indicator_name: "多帳戶叢集分數",
  },
  "SKILL-XAU247-EXPOSURE": {
    name: "XAUUSD247 淨曝險接近上限（≥1 萬手）",
    description: "週末黃金 CFD 淨曝險接近產品上限，週一缺口風險上升。",
    why: "淨曝險接近產品上限時，週一跳空可造成集中損失。",
    indicator_name: "XAUUSD247 淨曝險",
  },
  "SKILL-EQUITY-DRAWDOWN": {
    name: "公司權益回撤上升（≥3%）",
    description: "公司權益日內回撤擴大 — 資本與市場風險的總覽警報。",
    why: "權益回撤 ≥3% 需風險負責人綜觀信貸、對沖與報價問題，而非單一商品處置。",
    indicator_name: "公司權益回撤",
  },
  "SKILL-STALE-FEED": {
    name: "過期報價商品（≥3）",
    description: "多個商品報價停滯，強平與對沖可能用錯誤價格。",
    why: "≥3 個商品過期報價會扭曲保證金與對沖決策，可能誤傷客戶。",
    indicator_name: "過期報價商品數",
  },
  "SKILL-CRYPTO-LIQ-BACKLOG": {
    name: "加密強平引擎積壓（≥50）",
    description: "強平佇列堆積，保險基金與穿倉風險上升。",
    why: "積壓 ≥50 表示引擎跟不上標記價格移動；保險基金可能被快速消耗。",
    indicator_name: "強平引擎積壓",
  },
  "SKILL-GENERIC-HUMAN-REVIEW": {
    name: "通用人工 RCA 覆核（後援）",
    description: "沒有確定技能匹配時，走 RAG 推理並升級給人工。",
    why: "不確定時不要自動執行不可逆控制；改蒐集證據並交風險台。",
    indicator_name: "後援／未匹配指標",
  },
  "SKILL-STOPOUT-VELOCITY": {
    name: "強平速度暴衝（≥40／5 分鐘）",
    description: "短窗強平數量暴衝，通常早於保證金違規。",
    why: "5 分鐘 ≥40 筆強平代表叢集結束，可能是報價、跟單或缺口驅動。",
    indicator_name: "強平筆數（5 分鐘窗）",
  },
  "SKILL-NEGATIVE-BALANCE": {
    name: "負餘額帳戶（≥5）",
    description: "負餘額保護缺口 — 公司可能吸收客戶損失。",
    why: "≥5 個負餘額帳戶代表缺口／滑點／強平延遲，資本被侵蝕。",
    indicator_name: "負餘額帳戶數",
  },
  "SKILL-SLIPPAGE-SPIKE": {
    name: "客戶滑點暴衝（均 ≥3.5 pips）",
    description: "成交品質惡化，可能是橋接、LP 或點差設定問題。",
    why: "均滑點 ≥3.5 pips 會引發客訴並掩蓋真實 LP 拒單。",
    indicator_name: "客戶均滑點（主要商品，15 分鐘）",
  },
  "SKILL-BRIDGE-LATENCY": {
    name: "oneZero 橋接延遲（p95 ≥250ms）",
    description: "橋接路徑變慢，導致拒單、滑點與延遲強平。",
    why: "p95 ≥250ms 時有毒流量與延遲套利機會增加。",
    indicator_name: "橋接成交延遲 p95",
  },
  "SKILL-ABOOK-RATIO": {
    name: "A-book 比例漂移（<40% 或 >90%）",
    description: "帳簿結構風險 — A-book 過少留下庫存；過多則壓迫 LP 額度。",
    why: "A-book <40% 代表波動中 B-book 庫存過重；<30% 需對有毒流量強制 A-book。",
    indicator_name: "A-book 成交量比例（時段）",
    fault_areas: ["人工 B-book 覆寫未關", "LP 額度滿載 → 靜默改 B-book", "有毒商品分類錯誤"],
    when_to_use: [
      "當 M2-ABOOK-008 顯示時段 A-book 比例 ≤40%（警告）或 ≤30%（違規）。",
      "也適用於 A-book >90% 且 LP 額度告警同時出現時 — 過度 A-book 會壓迫信用。",
      "僅在確認不是已知 UAT／測試流量後使用。",
    ],
    when_not_to_use: [
      "不要只因單一商品短暫內轉 B-book 就強制全帳 A-book。",
      "LP 額度已滿時，先處理額度，不要再加壓 A-book。",
      "沒有風險負責人核准，不要對零售流量做不可逆路由變更。",
    ],
    corrections: ["對頭部有毒商品強制 A-book（人工關卡）", "稽核人工 B-book 覆寫"],
    steps: ["通知風險控管台", "列出現行 B-book 覆寫", "核准強制 A-book"],
  },
  "SKILL-VAR-BREACH": {
    name: "1 日 VaR 使用率（≥95%）",
    description: "公司 VaR 接近上限時的資本／市場風險 — 常與權益回撤連動。",
    why: "VaR 使用率 ≥95% 幾乎沒有緩衝，新曝險可能違反內部限額。",
    indicator_name: "1 日 VaR 使用率",
  },
  "SKILL-CORRELATION-BREAK": {
    name: "外匯相關性體制破裂（Δ≥0.35）",
    description: "相關矩陣相對基線漂移，對沖與 VaR 模型可能失效。",
    why: "相關性破裂會讓對沖失效並突然推高 VaR。",
    indicator_name: "相關矩陣相對基線漂移",
  },
  "SKILL-GAP-RISK": {
    name: "週末／假期缺口曝險（≥200 萬美元）",
    description: "休市期間持倉在跳空時可能穿透止損。",
    why: "估測缺口曝險 ≥200 萬美元需在休市前檢視強制 A-book 或減倉。",
    indicator_name: "估測缺口曝險（美元）",
  },
  "SKILL-SPREAD-ANOMALY": {
    name: "客戶點差異常（≥中位數 3 倍）",
    description: "點差標價錯誤或 LP 來源異常，造成客戶傷害與客訴。",
    why: "點差達時段中位數 3 倍通常是設定錯誤，而非真實波動。",
    indicator_name: "點差相對時段中位數倍率",
  },
  "SKILL-LEVERAGE-ONBOARD": {
    name: "高槓桿新帳戶（≥200／日）",
    description: "新開戶大量使用最高槓桿，後續保證金與詐欺風險上升。",
    why: "24 小時 ≥200 個最高槓桿新戶，通常對應推廣或介紹人活動。",
    indicator_name: "最高槓桿新帳戶（24 小時）",
  },
  "SKILL-BONUS-BURN": {
    name: "贈金兌換濫用（≥15 萬美元／日）",
    description: "贈金快速轉現金，常與多帳戶或對倒有關。",
    why: "24 小時贈金兌換 ≥15 萬美元超過常態推廣消耗。",
    indicator_name: "贈金轉現金（24 小時美元）",
  },
  "SKILL-WITHDRAWAL-VELOCITY": {
    name: "出金速度暴衝（≥500 萬美元／小時）",
    description: "出金佇列異常，可能是擠兌、詐欺或託管壓力。",
    why: "1 小時出金 ≥500 萬美元需核對付款詐欺分數與熱錢包浮額。",
    indicator_name: "出金量（1 小時美元）",
  },
  "SKILL-FUNDING-EXCEPTION": {
    name: "入金例外暴衝（≥80／小時）",
    description: "入金匹配失敗或退款激增，可能掩蓋分隔或詐欺問題。",
    why: "1 小時 ≥80 筆例外不應視為作業噪音 — 核對客戶資金分隔。",
    indicator_name: "入金例外（1 小時）",
  },
  "SKILL-PAYMENT-FRAUD": {
    name: "付款詐欺分數（≥0.8）",
    description: "入金／出金模型顯示高詐欺可能性。",
    why: "分數 ≥0.8 應凍結付款並交作業調查，不可自動放行。",
    indicator_name: "付款詐欺模型分數",
  },
  "SKILL-WASH-TRADE": {
    name: "對倒／串通分數（≥0.75）",
    description: "配對模式顯示關聯帳戶對倒或傳輸損益。",
    why: "分數 ≥0.75 需凍結相關帳戶並對照跟單集中度。",
    indicator_name: "對倒／串通偵測分數",
  },
  "SKILL-API-ERROR-RATE": {
    name: "交易 API 錯誤率（≥5%）",
    description: "客戶無法平倉或下單，保證金與權益會漂移。",
    why: "5 分鐘錯誤率 ≥5% 等於部分客戶被鎖在曝險中。",
    indicator_name: "交易 API 錯誤率（5 分鐘）",
  },
  "SKILL-DETECTOR-DRIFT": {
    name: "偵測器精確率漂移（<70%）",
    description: "偵測器精確率下滑，技能可能漏報或誤報。",
    why: "7 日精確率 <70% 時，不要盲目信任自動技能匹配。",
    indicator_name: "偵測器精確率（7 日滾動）",
  },
  "SKILL-ENTITY-CAPITAL": {
    name: "實體資本緩衝偏薄（<15%）",
    description: "受監管實體相對限額的資本緩衝不足。",
    why: "緩衝 <15% 限制可承擔風險，可能觸發監管通報門檻。",
    indicator_name: "實體資本緩衝比例",
  },
  "SKILL-SEGREGATION-GAP": {
    name: "客戶資金分隔缺口（≥25 萬美元）",
    description: "客戶資金分隔低於應有水平 — 合規緊急事件。",
    why: "缺口 ≥25 萬美元必須當日升級合規與財務，不可僅當作業工單。",
    indicator_name: "客戶資金分隔缺口（美元）",
  },
  "SKILL-CRYPTO-ORACLE": {
    name: "預言機／指數延遲（≥2 秒）",
    description: "標記價格落後，強平與保險基金可能用錯誤價格。",
    why: "延遲 ≥2 秒時強平可能錯價，造成穿倉與客訴。",
    indicator_name: "標記價格預言機延遲",
  },
  "SKILL-CRYPTO-INSURANCE": {
    name: "保險基金回撤（單日 ≥8%）",
    description: "保險基金快速消耗，穿倉社會化風險上升。",
    why: "單日回撤 ≥8% 代表強平引擎或預言機路徑失敗。",
    indicator_name: "保險基金單日回撤",
  },
  "SKILL-CRYPTO-OI-CONC": {
    name: "永續合約 OI 集中（單一帳戶 ≥35%）",
    description: "單一帳戶持有過多未平倉量，強平懸崖風險。",
    why: "單一帳戶 ≥35% OI 時，其強平會衝擊標記價格與保險基金。",
    indicator_name: "頭部帳戶 OI 佔比（每合約）",
  },
  "SKILL-CRYPTO-DEPOSIT-SPIKE": {
    name: "加密入金暴衝（≥800 萬美元／小時）",
    description: "入金暴衝推高熱錢包浮額與出金壓力。",
    why: "1 小時入金 ≥800 萬美元通常早於熱錢包警告。",
    indicator_name: "加密入金（1 小時美元）",
  },
  "SKILL-LATENCY-ARB": {
    name: "延遲套利分數（≥0.7）",
    description: "延遲套利毒性上升，通常在過期報價之後。",
    why: "分數 ≥0.7 表示客戶正在收割慢報價 — 檢查饋送健康。",
    indicator_name: "延遲套利毒性分數",
  },
  "SKILL-SWAP-MISCONFIG": {
    name: "隔夜利息／融資設定錯誤（≥10 商品）",
    description: "商品掉期與基準偏離，隔夜權益被侵蝕。",
    why: "≥10 個商品掉期異常幾乎可確定為設定錯誤，而非市場。",
    indicator_name: "掉期相對基準偏離商品數",
  },
  "SKILL-MARKET-INTEL": {
    name: "市場情報高影響命中（≥1／5 分鐘）",
    description: "新聞／社群／官方頻道出現可能移動 LP 價格的事件。",
    why: "5 分鐘窗高影響命中應對齊保證金、權益與點差監控，而非單獨看待。",
    indicator_name: "市場情報高影響命中（5 分鐘）",
    when_to_use: [
      "當 M2-MKT-INTEL 在最近 5 分鐘掃描出現 ≥1 筆高影響命中。",
      "標題涉及央行、戰爭、交易所停機或大型商品衝擊時優先。",
      "與保證金或權益警告同時出現時，視為連結時間鏈。",
    ],
  },
  "SKILL-PERP-BASIS": {
    name: "永續標記－指數基差（≥60 bps）",
    description: "永續合約標記價與指數偏離 — 強平公平性與保險基金風險。",
    why: "基差 ≥60 bps 表示標記脫離指數；強制平倉不公，保險基金易失血。",
    indicator_name: "永續標記－指數基差",
  },
  "SKILL-FUNDING-EXTREME": {
    name: "永續資金費率極端（≥0.5%／8h）",
    description: "極端資金費率擠壓單邊，可能觸發強平與 OI 流失。",
    why: "8 小時絕對資金費率 ≥0.5% 屬擠壓行情；庫存與強平積壓常在一小時內跟進。",
    indicator_name: "永續資金費率絕對值（8 小時）",
  },
  "SKILL-STABLE-DEPEG": {
    name: "穩定幣庫存脫鉤曝險（≥$2m）",
    description: "穩定幣脫鉤時房屋庫存承壓 — 託管與出金公平性。",
    why: "脫鉤曝險 ≥200 萬美元時需同步處理託管浮額與出金佇列。",
    indicator_name: "穩定幣脫鉤曝險（美元）",
  },
  "SKILL-PLATFORM-DISCONNECT": {
    name: "交易平台斷線率（≥5%）",
    description: "基礎設施中斷使客戶無法管理部位，轉為信貸連鎖。",
    why: "斷線 ≥5% 時客戶無法平倉／加保，保證金與權益漂移加速。",
    indicator_name: "交易平台斷線率",
  },
  "SKILL-RECON-BREAKS": {
    name: "對帳差異（≥20）",
    description: "營運對帳差異上升，可能演成分隔與資本壓力。",
    why: "≥20 筆未解差異不可只當作業工單，需對齊客戶資金路徑。",
    indicator_name: "未解對帳差異數",
  },
  "SKILL-SYMBOL-HALTS": {
    name: "作用中商品熔斷（≥5）",
    description: "多商品熔斷同時作用，對沖與客戶公平性受影響。",
    why: "≥5 個作用中熔斷通常代表饋送或流動性系統性問題。",
    indicator_name: "作用中商品熔斷數",
  },
  "SKILL-NEWS-GROSS": {
    name: "一級新聞前名目（≥$120m）",
    description: "一級宏觀窗口前過大名目，缺口／負餘額風險上升。",
    why: "新聞前名目 ≥1.2 億美元需預先拉闊與風控台值班。",
    indicator_name: "一級新聞前名目（美元）",
  },
  "SKILL-CHARGEBACK-SPIKE": {
    name: "支付退單（≥40／24h）",
    description: "入金濫用演成收單行退單與營運資金壓力。",
    why: "24 小時退單 ≥40 筆需對齊詐欺分數與出金佇列。",
    indicator_name: "支付退單（24 小時）",
  },
  "SKILL-IB-REBATE-ANOMALY": {
    name: "IB 返佣異常分數（≥0.8）",
    description: "循環 IB 經濟叠加對倒與贈金套現跡象。",
    why: "分數 ≥0.8 幾乎確定異常返佣環，需凍結相關 IB 結算。",
    indicator_name: "IB 返佣異常分數",
  },
  "SKILL-COPY-CHURN": {
    name: "跟單淨流失（≥25%／1h）",
    description: "跟隨者恐慌離場，經集中度與保證金打到公司權益。",
    why: "1 小時淨流失 ≥25% 需分階段平倉與暫停新跟單。",
    indicator_name: "跟單淨流失（1 小時）",
  },
  "SKILL-CS-CLARIFY": {
    name: "CS 釐清過短或不清楚的客戶請求",
    description: "C1／表單／信件過短無法辦理時的 24/7 劇本。先寄信、等待回覆，禁止臆測需求。",
    why: "不清楚案件堆積代表 AI 在猜。自動信件上限 3 封，案件維持待客戶直到客戶回答。",
    indicator_name: "待釐清 CS 請求（未結）",
    fault_areas: ["一行 C1（help me ???）", "表單細節空白", "語言混雜／無 UID", "承諾截圖未附"],
    when_to_use: [
      "進件短於 48 字，或含 help me／???／不清楚／不知道時使用。",
      "重新分流時若最新回覆仍無法判斷 FAQ／TR／核身，繼續用本技能。",
    ],
    when_not_to_use: [
      "不要從一行字臆測隔夜利息、成交或 KYC 結果。",
      "追問信仍為 WAITING 時不可結案。",
      "若已提到護照／KYC／登不進去，改用 SKILL-CS-ID-VERIFY。",
    ],
    corrections: ["官方信箱詢問發生什麼／UID／截圖／期望結果", "維持待客戶；WAITING 時禁止結案", "第 3 封後由 CS Lead 人工跟進"],
    steps: ["通知 CS 24/7 台已啟動釐清迴圈", "寄出官方 EMAIL_OUT", "等待 EMAIL_IN 後重新分流"],
  },
  "SKILL-CS-ID-VERIFY": {
    name: "CS 帳戶操作前身分驗證",
    description: "KYC／護照／登不進去／出金被擋。要求證件＋UID 後四碼＋自拍，維持身分驗證直到回覆。",
    why: "未核身做出金、重設密碼或改 UID 是帳戶盜用路徑。佇列 ≥12 代表核身流程卡住。",
    indicator_name: "CS 核身佇列（未結）",
    fault_areas: ["客戶登不進去／出金需 KYC", "自拍與護照不符", "缺 UID 後四碼", "共用裝置多帳戶叢集"],
    corrections: ["要求護照／證件、UID 後四碼、相符自拍", "狀態維持身分驗證直到 EMAIL_IN", "自拍／裝置不符則升級風控"],
    steps: ["寄核身信件", "維持身分驗證；WAITING 時禁止結案", "CS Lead 確認核身包或升級詐欺"],
  },
  "SKILL-CS-ACCOUNT-FAQ": {
    name: "CS 帳戶／產品 FAQ（隔夜利息、時段、UID）",
    description: "CS 可從 RAG 回答的清楚問題（隔夜利息、週末三倍、帳戶類型、交易時段），不需 TR 成交帶或風控開關。",
    why: "FAQ 量是人力而非帳簿風險。違規代表 RAG 答案過期或夜間 C1 人力不足。",
    indicator_name: "未結 CS FAQ／產品詢問",
    fault_areas: ["RAG 隔夜利息表過期", "未揭露實體時段", "客戶搞混 XAUUSD 與 XAUUSD247", "週末三倍未說明"],
    corrections: ["引用 cs-swap-faq／accounts-pricing／xauusd247", "若答案缺失則 propose_rag（人工關卡）"],
    steps: ["檢索 cs-swap-faq／accounts-pricing", "CS 專員引用產品規則回覆"],
  },
  "SKILL-TR-EXECUTION": {
    name: "TR 成交 — 成交、滑點、強平、MT4／MT5",
    description: "成交投訴離開 CS。TR 重建成交帶（票號、商品、時間、LP 成交對按鈕）。CS 不可臆測點數。",
    why: "波動後 TR 佇列常與 M2-SLIP-021／M2-LP-022 同動。要台面人力加成交帶覆核，不是 CS 複製貼上。",
    indicator_name: "TR 成交佇列（已派）",
    fault_areas: ["LP 拒單／部分成交", "橋接延遲對按鈕價", "過期聚合器", "跳空標記上的強平"],
    corrections: ["台面=TR、狀態已派 TR", "票號、商品、UTC 時間、按鈕對 LP 成交", "對照滑點／LP 監控 — 勿從 CS 調帳簿"],
    steps: ["蓋 desk=TR 與已派 TR", "蒐集票號／商品／時間／聲稱點數", "若全市場滑點則升級風控"],
  },
  "SKILL-CS-ESCALATE-RISK": {
    name: "CS／TR 將帳簿風險升級至風控脊柱",
    description: "真正的信貸、詐欺、錢包或連鎖風險離開 CS／TR。Messenger＋人工干預擁有開關。CS／TR 不再單獨處理。",
    why: "CS→風控交接暴衝是帳簿事故在客戶端的鏡像。未結 ≥8 代表脊柱沒有吸收投訴。",
    indicator_name: "CS／TR 升級風控（未結）",
    fault_areas: ["強平連鎖以 CS 聊天出現", "帳戶盜用／詐欺環", "熱錢包／出金凍結觀感", "LP 拒單風暴被當成滑點投訴"],
    corrections: ["狀態已升級風控；CS／TR 停止單獨回覆", "示範 Messenger／人工干預 — 開關需 Maker／Checker"],
    steps: ["蓋已升級風控並停止 CS 單獨處理", "風險負責人接手 Messenger／干預"],
  },
};

export const CHAIN_ZH: Record<string, { name: string; description: string }> = {
  "CHAIN-CREDIT-CASCADE": {
    name: "跟單集中 → 保證金暴衝 → 權益回撤",
    description: "信貸連鎖：頭部提供者帶動跟單者同時受壓。",
  },
  "CHAIN-LP-HEDGE-GAP": {
    name: "LP 拒單風暴 → 對沖缺口 → 權益壓力",
    description: "執行品質惡化後庫存暴露。",
  },
  "CHAIN-FEED-LIQUIDATION-ERROR": {
    name: "過期饋送 → 錯誤保證金壓力 → 權益雜訊",
    description: "錯誤價格驅動的假強平風險。",
  },
  "CHAIN-CRYPTO-CUSTODY-STRESS": {
    name: "熱錢包浮額 → 出金壓力 → 強平積壓風險",
    description: "託管與引擎同時受壓。",
  },
  "CHAIN-FRAUD-COPY-ABUSE": {
    name: "詐欺叢集＋跟單集中（女巫跟單）",
    description: "多帳戶跟單同一提供者。",
  },
  "CHAIN-METALS-WEEKEND": {
    name: "XAUUSD247 堆積 → 週一開盤對沖缺口",
    description: "週末黃金曝險在跳空中擴大。",
  },
  "CHAIN-VOL-TRIPLE": {
    name: "新聞波動：饋送警告＋保證金＋對沖同時",
    description: "宏觀事件同時觸發三條線。",
  },
  "CHAIN-MODEL-DRIFT-SHADOW": {
    name: "AI 技能漏報 → RAG 路徑灌入 → 人工佇列積壓",
    description: "模型漂移使自動路徑失效。",
  },
  "CHAIN-OPS-FUNDING-STRESS": {
    name: "詐欺警告＋保證金警告於入金例外暴衝",
    description: "作業與信貸同時告警。",
  },
  "CHAIN-FULL-STACK-CRYPTO-CFD": {
    name: "跨產品壓力：加密託管＋CFD 信貸同日",
    description: "風險負責人需在兩本帳簿間分配台面。",
  },
  "CHAIN-STOPOUT-CASCADE": {
    name: "強平速度 → 保證金違規 → 權益警告",
    description: "短窗強平升級為信貸事件。",
  },
  "CHAIN-EXECUTION-DEGRADE": {
    name: "橋接延遲 → 滑點 → LP 拒單",
    description: "執行堆疊由慢變拒。",
  },
  "CHAIN-GAP-NBP": {
    name: "缺口曝險 → 負餘額帳戶 → 權益打擊",
    description: "跳空穿透止損後的資本吸收。",
  },
  "CHAIN-PROMO-TOXICITY": {
    name: "槓桿開戶暴衝 → 贈金燃燒 → 詐欺警告",
    description: "推廣驅動的毒性開戶。",
  },
  "CHAIN-WITHDRAWAL-RUN": {
    name: "出金暴衝＋入金例外＋詐欺分數",
    description: "類似擠兌的付款壓力。",
  },
  "CHAIN-CRYPTO-ORACLE-LIQ": {
    name: "預言機延遲 → 強平積壓 → 保險基金回撤",
    description: "標記價格路徑失敗。",
  },
  "CHAIN-WHALE-OI-INS": {
    name: "OI 集中 → 強平懸崖 → 保險壓力",
    description: "巨鯨倉位威脅保險基金。",
  },
  "CHAIN-VAR-CORR-EQ": {
    name: "相關性破裂 → VaR 使用率 → 權益回撤",
    description: "模型假設失效後的資本壓力。",
  },
  "CHAIN-ABOOK-HEDGE-EQ": {
    name: "A-book 比例崩塌 → 對沖缺口 → 權益",
    description: "帳簿結構把庫存留給公司。",
  },
  "CHAIN-SPREAD-MARKUP-BUG": {
    name: "點差異常 → 滑點雜訊 → 客戶作業暴衝",
    description: "標價錯誤造成客服與作業負載。",
  },
  "CHAIN-TOXIC-ARB": {
    name: "過期饋送 → 延遲套利 → 權益滴漏",
    description: "慢報價被收割。",
  },
  "CHAIN-REG-CAPITAL": {
    name: "權益回撤 → 資本緩衝偏薄 → 分隔警告",
    description: "市場損失碰上合規緩衝。",
  },
  "CHAIN-API-OUTAGE-RISK": {
    name: "API 錯誤 → 客戶無法平倉 → 保證金／權益漂移",
    description: "鎖倉放大市場移動。",
  },
  "CHAIN-WASH-COPY": {
    name: "對倒分數＋跟單集中（鏡像串通）",
    description: "跟單掩蓋對倒。",
  },
  "CHAIN-SWAP-OVERNIGHT": {
    name: "掉期設定錯誤 → 隔夜權益滴漏 → 作業調整",
    description: "設定錯誤而非市場造成的 PnL。",
  },
  "CHAIN-DEPOSIT-FLOAT": {
    name: "加密入金暴衝 → 熱錢包浮額警告 → 出金壓力",
    description: "入金先推高託管風險。",
  },
  "CHAIN-MODEL-FALSE-CALM": {
    name: "偵測器漂移＋漏報保證金 → 延遲人工搶救",
    description: "安靜儀表板其實已漏報。",
  },
  "CHAIN-SEGREGATION-FUNDING": {
    name: "入金例外 → 分隔缺口 → 資本警告",
    description: "客戶資金路徑破裂。",
  },
  "CHAIN-MKT-INTEL-VOL": {
    name: "市場情報命中 → 權益／保證金升溫",
    description: "外部新聞對齊內部風險指標。",
  },
  "CHAIN-PERP-BASIS-ORACLE": {
    name: "預言機延遲 → 基差 → 強平 → 保險",
    description: "加密標記價格完整性失效，串聯預言機、基差、強平引擎與保險基金。",
  },
  "CHAIN-FUNDING-SQUEEZE": {
    name: "極端資金費率 → OI 集中 → 強平積壓",
    description: "資金費率擠壓把 OI 擠向單邊，壓垮強平引擎。",
  },
  "CHAIN-STABLE-CUSTODY": {
    name: "穩定幣脫鉤曝險 → 熱錢包浮額 → 出金",
    description: "穩定幣壓力同時打擊託管浮額與出金公平性。",
  },
  "CHAIN-PLATFORM-CREDIT": {
    name: "平台斷線 → API 錯誤 → 強平 → 權益",
    description: "基礎設施中斷使客戶無法管理部位，轉為信貸連鎖。",
  },
  "CHAIN-NEWS-GROSS-GAP": {
    name: "情報＋新聞名目 → 點差 → 強平 → 缺口 USD",
    description: "一級宏觀窗口叠加過大名目，演成缺口／負餘額事件。",
  },
  "CHAIN-RECON-SEGREGATION": {
    name: "對帳差異 → 分隔缺口 → 資本緩衝",
    description: "營運對帳債務轉為監管客戶資金與資本壓力。",
  },
  "CHAIN-IB-FRAUD-RING": {
    name: "IB 返佣異常 → 對倒 → 贈金 → 出金",
    description: "循環 IB 經濟叠加對倒與贈金套現。",
  },
  "CHAIN-COPY-PANIC-UNWIND": {
    name: "跟單流失 → 集中度 → 保證金 → 權益",
    description: "跟隨者恐慌離場，經集中度與保證金打到公司權益。",
  },
  "CHAIN-KILL-FEED-HEDGE": {
    name: "過期饋送 → 熔斷 → 對沖／LP 壓力",
    description: "饋送健康觸發停牌，對沖覆蓋斷裂並推高 LP 拒單。",
  },
  "CHAIN-CHARGEBACK-FUNDING": {
    name: "支付詐欺 → 退單 → 入金例外 → 出金",
    description: "入金濫用變成收單行退單與營運資金壓力。",
  },
  "CHAIN-CS-TR-INTAKE": {
    name: "不清楚 C1 → 核身 → TR 成交帶 → 風控脊柱",
    description: "客戶 24/7 大門：過短聊天先釐清；KYC 走核身；成交字詞給 TR；帳簿風險離開 CS／TR 進入 Messenger。",
  },
};
