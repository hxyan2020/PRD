# 指標與風險情境

供 **管理（Admin）**、**定價（Pricing）**、**交易／Dealing** 台面使用的目錄。

| 介面 | 路徑 |
|------|------|
| 互動看板（可依 BU 篩選） | `/admin/docs/indicators-scenarios` |
| 種子 SQL 瀏覽 | `/admin/docs/simulated-data` |
| Monitor 2.0 即時登錄 | `/admin/monitor-2` |
| 領域情境圖 | `/admin/risk-domains` |
| 技能劇本 | `/admin/skills` |

看板為即時目錄：每一列來自 SQLite（`monitor_indicators`）與程式內領域／技能目錄。本文是台面手冊摘要。

## 受眾對照

| 台面 | 負責 | 典型領域 | 範例指標 |
|------|------|----------|----------|
| **管理／風險負責人** | 政策、L2 核准、探索晉升、嚴重度權重 | 信用／客戶、模型與 AI、詐欺、基礎建設 | `M2-MRG-014`、`M2-EQ-001`、探索 `M2-DISC-*` |
| **定價** | 報價年齡、發布延遲、商品曝險、行情傳播 | 市場定價、商品設定 | `M2-LP-022`、`M2-FEED-003`、`M2-XAU-247` |
| **交易／LP** | 拒絕率、對沖覆蓋、A-book 傾斜、週末金屬 | LP 與對沖、信用傳染伴隨 | `M2-LP-022`、`M2-HEDGE-007`、`M2-XAU-247` |

在看板使用 **管理／定價／交易** 晶片篩選指標與領域情境。

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
2. **未結警報** — 即時 `ALT-INC-1028` 與伴隨案例；有金鑰時 AI 根因經 OpenAI 強化
3. **監控實驗室** — L2→RCA／AI 事故／降噪 HTML 演練（同一帳簿）
4. **指標聚合** — 經 `CHAIN-PRICING-FEED-PROPAGATION` 做 L1 → L2
5. **未知風險探索** — 每次掃描建立新的 SQLite 特徵窗與過程軌跡；分析重新產生思考（OpenAI 或 MOCK）
6. **值班收件匣** — Messenger 執行緒 `THR-INC-1028`
7. **已結風險日誌** — 已結伴隨軌跡（如 `ALT-STALE-FEED-LIQ`）

首頁虛擬脊柱、探索尖峰、聚合種子與實驗室外框皆匯入 `lib/demo/forex-incident-1028.ts`。

### 伴隨案例（同一 CFD 帳簿）

| Id | 故事 | 指標 | 主責台面 |
|----|------|------|----------|
| LP-HEDGE-GAP | LP 拒絕風暴 → 對沖覆蓋缺口 | `M2-LP-022`、`M2-HEDGE-007` | 交易 |
| XAU-WEEKEND | XAUUSD247 週末曝險累積 | `M2-XAU-247`、`M2-HEDGE-007`、`M2-LP-022` | 定價＋交易 |
| STALE-FEED-LIQ | 陳舊行情 → 強平／信用傳染 | `M2-FEED-003`、`M2-MRG-014`、`M2-EQ-001` | 定價＋管理 |

## 清單來源

| 層級 | 來源 |
|------|------|
| 指標 | SQLite `monitor_indicators`（＋`monitor-indicator-meta`） |
| 領域情境 | `lib/ai/risk-domain-scenarios.ts` |
| 技能劇本 | `lib/ai/risk-scenarios-catalog.ts` → `/admin/skills` |
| 連結時間鏈 | 同上目錄 → 知識樹 |
| 外匯組合 | `lib/demo/forex-incident-1028.ts` |

## AI／LLM（每次觸發真實思考）

| 觸發 | 設定 `OPENAI_API_KEY` 且 `CRMP_AI_LLM` 未關閉時的行為 |
|------|------------------------------------------------------|
| 探索 **立即掃描** | 在即時 SQLite 視窗跑統計／ML；唯一 `scan_seed`＋思考軌跡寫入 `detail_json`／證據（非 HTML 假資料） |
| 探索 **分析** | 自動 LIVE OpenAI；每次呼叫新的 `ANL-*` 思考；僅在缺金鑰／操作者強制 Mock 時走 MOCK |
| 警報 **AI 根因** | 先啟發式，再 OpenAI 改寫；LLM 證據與思考寫入分析 |
| 執行偵測器／Monitor 執行 | 批次後對新分析做 LLM 強化 |
| 首頁 **虛擬脊柱** | 有金鑰時在 RCA 後強化 |
| 台面選取聊天 | 啟發式回覆後再經 OpenAI 改寫 |

失敗一律回退啟發式／MOCK，不阻斷台面作業。
