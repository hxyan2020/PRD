# 指標與風險情境

供 **管理（Admin）**、**定價（Pricing）**、**交易／Dealing** 台面使用的目錄。

互動看板：`/admin/docs/indicators-scenarios`  
種子 SQL 瀏覽：`/admin/docs/simulated-data`

## 標準外匯 CFD 用例 — INC-1028

| 欄位 | 值 |
|------|-----|
| 事故 | `INC-1028` |
| LP／商品 | LP-A · XAUUSD |
| 嚴重度 | P2 中 |
| 台面 | Pricing Engine SG-02 |
| L1 | `LP_QUOTE_DELAY` → `M2-LP-022`；`FINAL_QUOTE_STALE`／`QUOTE_PUBLISH_LAG` → `M2-FEED-003` |
| L2 | `PRICING_FEED_PROPAGATION` |
| 鏈碼 | `CHAIN-PRICING-FEED-PROPAGATION` |
| 種子指標 | `M2-LP-022`、`M2-FEED-003`、`M2-XAU-247`、`M2-HEDGE-007` |

### 台面流程（各模組同一故事）

1. **Monitor 2.0** — 檢視 `M2-LP-022`／`M2-FEED-003`（組合種子為 WARN／BREACH）
2. **未結警報** — 即時 `ALT-INC-1028` 與伴隨案例；有金鑰時 AI 根因可經 OpenAI 強化
3. **監控實驗室** — L2→RCA／AI 事故／降噪 HTML 演練（同一帳簿）
4. **指標聚合** — 經 `CHAIN-PRICING-FEED-PROPAGATION` 做 L1 → L2
5. **未知風險探索** — 在模擬 SQLite 上跑 ML 掃描；分析走 OpenAI 或 MOCK 思考步驟
6. **值班收件匣** — Messenger 執行緒 `THR-INC-1028`
7. **已結風險日誌** — 已結伴隨軌跡（如 `ALT-STALE-FEED-LIQ`）

首頁虛擬脊柱、探索尖峰、聚合種子與實驗室外框皆匯入 `lib/demo/forex-incident-1028.ts`。

### 伴隨案例（同一 CFD 帳簿）

| Id | 故事 | 指標 |
|----|------|------|
| LP-HEDGE-GAP | LP 拒絕風暴 → 對沖覆蓋缺口 | `M2-LP-022`、`M2-HEDGE-007` |
| XAU-WEEKEND | XAUUSD247 週末曝險累積 | `M2-XAU-247`、`M2-HEDGE-007`、`M2-LP-022` |
| STALE-FEED-LIQ | 陳舊行情 → 強平／信用傳染 | `M2-FEED-003`、`M2-MRG-014`、`M2-EQ-001` |

### BU 視角

- **管理／風險負責人** — 核准 L2、嚴重度權重、探索晉升
- **定價** — 報價年齡、發布延遲、商品曝險（`M2-XAU-247`）
- **交易／LP** — 拒絕率、對沖覆蓋、A-book 傾斜

## 清單來源

| 層級 | 來源 |
|------|------|
| 指標 | SQLite `monitor_indicators`（＋`monitor-indicator-meta`） |
| 領域情境 | `lib/ai/risk-domain-scenarios.ts` |
| 技能劇本 | `lib/ai/risk-scenarios-catalog.ts` → `/admin/skills` |
| 連結時間鏈 | 同上目錄 → 知識樹 |

## AI／LLM

- 探索 **分析** 可連線 OpenAI（`OPENAI_API_KEY`）；即時失敗會回退 MOCK。
- 警報根因／值班聊天在有金鑰時呼叫 OpenAI（`CRMP_AI_LLM` 預設 auto）；失敗仍保留啟發式路徑。
- 未知風險 **掃描** 模型（`isolation_forest`、`cusum` 等）一律從目前 SQLite 種子指標序列取樣 — 不是 HTML 假資料。
