# 平台改進路線圖

已交付台面打磨（即時警報與追蹤命名；偵測器合併至 Monitor 2.0；分組 AI 管線、MonitorCode、RAG 葉、ESC-DEFAULT＋維度係數、BU 與團隊、一線／二線 AI 管理、可編輯角色、稽核 CRMP／Vantage Markets 管理分頁＋回滾、手機卡片列表）屬文件日常；**計畫開放議題**見 [開放議題](/admin/docs/open-issues)／[進度追蹤](/admin/docs/progress)。

**文件編號：** CRMP-RM-001 · 現行 CRMP 原型之後的優先待辦  
**讀者：** 風險負責人、平台負責人、工程、GRC  
**讀法：** 管理頁 `/admin/docs/roadmap` 是操作員視圖（可展開卡片）。本檔是可列印對本。每個 `RM-xx` 寫明 **今日原型**、**要做什麼**、**完成標準**、**程式落點**、**不做的風險**。

本原型已能走通脊柱：**Monitor 警報 → AI 根因（技能／RAG）→ 第二 AI 挑戰 → Messenger → Maker／Checker → 稽核／首頁脊柱**。本表要補上會讓正式台面失敗的缺口：模擬 Lark、種子 Monitor、啟發式 AI、SQLite、共用示範密碼、只記日誌的「執行」。

**工期鍵：** S 一個垂直切片 · M 多日模組 · L 跨團隊 · XL 計畫級

**本輪 UAT 範圍外：** 真實交易匯流排寫入（RM-09）、正式 IdP（RM-05）、以及取代 Monitor 2.0 本身。這些應列後期工作，不要當 UAT Fail。

---

## 掃描表

| ID | 項目（操作員實際拿到什麼） | 工期 | 人力 | 依賴 | 嚴重度 |
|---|---|---|---|---|---|
| RM-01 | 正式 Lark **互動卡片**：Ack／升級／核准在公司通訊完成，不必只待在示範 Messenger | L | 2 FE + 1 BE | Lark 應用核准 | Critical |
| RM-02 | 真實 **Monitor 2.0 接入＋工單回寫**：CRMP 排除／結案會更新上游工單 | L | 2 BE | Monitor API 契約 | Critical |
| RM-03 | **LLM 主 RCA**：工具呼叫＋評測架（取代啟發式技能／RAG） | XL | 1 ML + 2 BE | Prompt 庫、花費上限 | High |
| RM-04 | **挑戰者使用獨立供應商／提示**：第二意見不能與主模型共失敗 | M | 1 ML | RM-03 | High |
| RM-05 | **SSO + SCIM**：企業登入，廢除共用 `risk123` 角色 | M | 1 BE + 資安 | IdP（Okta／Entra） | Critical |
| RM-06 | **Postgres＋多實例**：離開單一 SQLite 檔 | M | 1 SRE + 1 BE | 基礎建設／備份 | High |
| RM-07 | **觸控優先**後台＋Messenger（抽屜、44px、卡片不裁切） | S | 1 FE | Design tokens | Medium |
| RM-08 | **補完管理介面 i18n**：剩餘種子文案、文件表、錯誤字串 EN／繁中 | M | 1 FE + PM | 字串目錄 | Medium |
| RM-09 | **真實控制適配**（停商品／槓桿／A-book／暫停出金），先 dry-run 再 Checker | L | 2 BE + Ops | 交易控制匯流排 | Critical |
| RM-10 | **證據遮罩＋保存作業**：KYC／帳戶識別不要在摘要裡永久保存 | M | 1 BE + GRC | 法遵政策 | High |
| RM-11 | **影子模式儀表板**：AI 只能建議、寫入關閉，風險負責人看「建議 vs 實作」 | S | 1 FE + 1 BE | Spine 指標 | Medium |
| RM-12 | **CI UAT 煙測**：每次 PR 用種子庫跑危急案例 | S | 1 QA + 1 BE | Seed DB | Medium |
| RM-13 | **多品牌／實體租戶**（VFSC vs FCA 包、資料隔離） | XL | 架構 + 2 BE | 組織模型 | Medium |
| RM-14 | **AI 成本／延遲 SLO**：RCA 或挑戰者超預算就告警 | S | SRE | 可觀測性 | Medium |
| RM-15 | **有評分的市場情報來源**（授權饋送，不是模板標題） | M | 1 DS + 1 BE | 供應合約 | Medium |

## 建議順序

1. **基礎：** RM-05、RM-06、RM-02 — 身分、耐久儲存、即時警報與追蹤串流。
2. **操作體驗：** RM-01、RM-07、RM-11 — 人在 Lark 工作，並能跑影子模式。
3. **寫路徑（最後）：** RM-09＋全域緊急開關 — 等風險負責人接受影子誤報率。
4. **模型品質：** RM-03＋RM-04＋RM-14。
5. **強化與擴充：** RM-08、RM-10、RM-12、RM-15。RM-13 屬後期計畫。

規則：在 B 階段誤報與挑戰者 `DISAGREE` 流程被接受前，**不要**打開 RM-09 寫入適配。

---

## RM-01 — 正式 Lark 互動卡片

**嚴重度：** Critical · **工期：** L · **人力：** 2 前端 + 1 後端 · **依賴：** Lark（或 Teams）應用核准、機器人憑證進密鑰庫。

### 為何要做

值班不會一直開著 CRMP 分頁。若唯一可用收件匣是站內示範，違規卡片到不了真正被呼叫的台面。

### 今日原型

[示範 Messenger](/admin/messenger) 是 CRMP 內的 Lark 風格收件匣。[Lark 整合](/admin/lark) 存模擬 Webhook。沒有任何訊息發到真實 Lark。

- 種子頻道：`oc_risk_control_desk`、`oc_ops_funding_recon`、`oc_ai_detection_lab`、`oc_trading_infra`、`oc_crypto_exchange_risk`、`oc_exec_risk_bridge`。
- Webhook 為模擬網址（`https://open.larksuite.com/hook/mock-risk-desk` 等）。`POST /api/lark` 的 `test_notify` 寫稽核 `LARK_TEST_NOTIFY` 並回 `{ mock: true }`。
- 設定 `lark.app_id` = `cli_mock_vantage_crmp`。示範 Messenger 已有確認／升級／排除／結案／Maker／Checker — 全部只寫本機 SQLite（`lib/messenger/demo.ts`、`LarkManager.tsx`）。

### 要做

1. 註冊正式 Lark 應用；app id／密鑰／加密金鑰進密鑰庫（廢除 `cli_mock_vantage_crmp`）。
2. 每個 CRMP `chat_id` 對到真實聊天室。對 ALERT／AI_REPORT／ESCALATION 發**卡片**。
3. 按鈕：確認、升級、排除（誤報）、結案（接受 AI）、確認動作（Maker）、Checker 核准。
4. 按鈕以操作員 SSO 身分呼叫 CRMP，再更新脊柱與稽核。人工關卡動作不得靜默執行。

### 完成標準

- 測試 Monitor 違規會在風險控管台聊天室出卡。
- 點 Ack 把 CRMP 警報標成 `ACKNOWLEDGED`，並回寫 Monitor 工單（搭配 RM-02）。
- 點人工關卡動作會走 Maker／Checker。示範 Messenger 可留作除錯台。

### 不做的風險

操作員要顧兩個收件匣；Lark 上的 Ack 回不到 CRMP；SLA 時鐘說謊。

---

## RM-02 — 真實 Monitor 2.0 webhook + 工單回寫

**嚴重度：** Critical · **工期：** L · **人力：** 2 後端 · **依賴：** Monitor 2.0 API 契約負責人。

### 為何要做

今日目錄是種子。示範同步假裝拉了 5 筆警報。正式台面一個班次就會和 Monitor 分叉。

### 今日原型

[Monitor 2.0](/admin/monitor-2) 是種子 SQLite **指標＋偵測器登錄**（`M2-MRG-014`、`M2-EQ-001`、工單 `TKT-88421`…），含全部執行／同步／暫停。未結警報在 [即時警報與追蹤](/admin/alerts)（`/admin/detectors` 轉址至此 — 左側無偵測器列）。`POST /api/monitor` 的 `run_detectors`／`toggle_pause`／`update_thresholds`／`ack_alert`／`update_ticket`／`sync_monitor2` 打本機列。`sync_monitor2` 稽核 `pulled_alerts: 5` — 不對 `monitor.vantagemarkets.internal` 發 HTTP。旗標 `monitor2.sync_enabled` 不會外呼。

### 要做

1. 入站：Monitor 推送警告／違規 → CRMP 更新 `monitor_indicators`／`monitor_alerts`／`monitor_tickets` 並觸發 AI RCA。
2. 出站：CRMP 的 Ack、排除、結案、承辦人變更 **PATCH Monitor 工單**。
3. 重放／冪等鍵，避免重複分析。
4. 對 Monitor 沙盒做契約測試。

### 完成標準

- 沙盒違規在 SLA 內產生 CRMP 警報＋分析。
- 在 CRMP 或 Lark 確認後，Monitor 側顯示已確認。
- CRMP **不會**僅憑 AI 就關閉 BREACH／CRITICAL 工單。

### 不做的風險

兩本工單；CRMP 結案後 Monitor 仍在呼叫；AI 分析打在過期種子列上。

---

## RM-03 — LLM 主 RCA：工具呼叫＋評測架

**嚴重度：** High · **工期：** XL · **人力：** 1 ML + 2 後端 · **依賴：** Prompt 庫、花費上限、RM-02 即時警報當標註。

### 為何要做

啟發式 `matchSkill` 可能因用詞重疊就把信心打到 1.0。一旦 RM-09 能寫入，這就不安全。

### 今日原型

`lib/ai/analyze.ts` 匹配技能（`lib/ai/skills.ts` 的 `matchSkill`）或檢索 RAG。非人工步驟存 `EXECUTED_MOCK`；人工步驟 `AWAITING_HUMAN`。`POST /api/ai` 分析不呼叫線上模型。種子分析看起來已經完成。

### 要做

1. 主 RCA 模型＋**工具**：指標快照、相關監控、RAG `top_k`、市場情報、未結工單、宏觀日曆。
2. 僅在匹配器 **與** 模型都同意時走技能路徑。
3. 評測架：歷史標註案例（跟單集中、LP 拒單、熱錢包浮額、權益回撤）。
4. Prompt 版本走 [AI 管理](/admin/ai-admin) Maker／Checker。

### 完成標準

- 留出測試包技能精確率達約定門檻（起步 80%）。
- 沒有人工關卡的不可逆建議 = 0。
- 每筆 RCA 至少引用一筆證據庫。挑戰者（RM-04）維持 **獨立** 行程。

### 不做的風險

一旦適配存在，錯誤的高確定技能會自動排隊停商品／槓桿；品質無法回歸。

---

## RM-04 — 挑戰者使用獨立供應商／提示

**嚴重度：** High · **工期：** M · **人力：** 1 ML · **依賴：** RM-03。

### 為何要做

今日「第二 AI」是同一程式庫裡的另一套啟發式。用詞 bug 可以同時騙過兩邊。

### 今日原型

[即時警報與追蹤](/admin/alerts)（明細包在 `/admin/ai-analyses/[id]`）已對 BREACH／CRITICAL 跑第二 AI（`ai.second_opinion_severity`，預設 BREACH）。`lib/ai/challenger.ts` 是第二套啟發式。表 `ai_analysis_challenges` 存 `AGREE`／`PARTIAL`／`DISAGREE` — 由規則填入，不是供應商。

### 要做

1. 獨立模型：不同供應商 **或** 隔離端點＋提示。不與主 RCA 共用工具結果快取。
2. 裁決維持 `AGREE`／`PARTIAL`／`DISAGREE`。`DISAGREE` 或 `PARTIAL` **阻止**自動技能執行。
3. 分析上記兩個模型 id 與 token 成本（供 RM-14）。

### 完成標準

- 注入（主路徑宣稱技能確定、饋送其實過期）時 100% 給 `DISAGREE` 或 `PARTIAL`。
- 風險負責人可依裁決篩選；花費出現在 RM-14。

### 不做的風險

相關的錯誤確定；沒人挑戰的停商品建議。

---

## RM-05 — SSO + SCIM 使用者佈建

**嚴重度：** Critical · **工期：** M · **人力：** 1 後端 + 資安 · **依賴：** 企業 IdP（Okta／Entra ID）。**本輪 UAT 範圍外。**

### 為何要做

共用示範密碼過不了職責分離。知道 `risk123` 的人可以同時當風險負責人和唯讀訪客。

### 今日原型

`POST /api/auth/login` 是電子郵件＋密碼 Cookie 工作階段。角色：`risk.owner@vantagemarkets.com`／`risk123`，加上具名平台負責人（`yan123`）。[使用者](/admin/users) 是 `lib/db.ts` 種子的本機目錄。Maker ≠ Checker 是應用內旗標，不是 IdP 身分。

### 要做

1. OIDC／SAML SSO。SCIM（或 JIT）從 IdP 建立／停用使用者。
2. IdP 群組對 CRMP 角色。測試／正式環境廢除示範密碼。
3. Maker ≠ Checker 用 **IdP 身分** 執行。緊急 `SUPER_ADMIN` 放密鑰庫，使用需雙人核准。

### 完成標準

- 風險 IdP 群組新人可免本機密碼登入。
- 離職者在 SCIM SLA 內停用。
- 測試環境不能再用 `risk123` 登入。

### 不做的風險

密碼共用；離職者仍握 `SUPER_ADMIN`；Maker／Checker 是演戲。

---

## RM-06 — Postgres＋多實例部署

**嚴重度：** High · **工期：** M · **人力：** 1 SRE + 1 後端 · **依賴：** 託管 Postgres、證據物件儲存。

### 為何要做

單一 SQLite 檔示範夠用。併寫、GitHub Pages、故障轉移不夠。

### 今日原型

持久化是 `platform/data/vantage_risk.db`（`better-sqlite3`）。github.io 靜態匯出不能寫庫。`npm run db:reset` 會刪檔。RAG 用 SQLite FTS。

### 要做

1. Postgres（WAL、備份、PITR）。應用無狀態（至少 2 實例）。
2. 先原表遷移（警報、分析、脊柱、稽核、RAG）。
3. 健康／就緒探針。正式環境不要默默回退 SQLite。

### 完成標準

- 偵測器執行中殺掉一個應用實例，脊柱事件不丟。
- 從備份還原演練符合系統管理員簽下的 RPO／RTO。

### 不做的風險

部署時默默丟資料；Pages 示範和「那套」CRMP 分叉。

---

## RM-07 — 觸控優先後台＋Messenger

**嚴重度：** Medium · **工期：** S · **人力：** 1 前端 · **依賴：** 既有 design tokens。

### 為何要做

美盤值班常用手機開 CRMP。密表格與被裁切的卡片會讓人漏按 Ack。

### 今日原型

後台已有抽屜、Messenger 列表→執行緒，以及 Monitor 2.0／升級／資料來源／風險日誌／稽核的手機卡片（`sm:hidden`）。雙重確認表與部分寬板仍偏桌面。

### 要做

1. 375px 走通：登入、首頁、警報、Messenger 執行緒、干預核准／駁回。
2. 44px 熱區、主動作不橫向裁切、輸入列固定、語言切換搆得到。
3. Messenger 卡片直向堆疊；證據用抽屜。

### 完成標準

- 真機 UAT 完成 Maker 確認，不必捏合縮放。
- CI 自動截 375px（搭配 RM-12）。

### 不做的風險

夜間違規因為按鈕在畫面外而 Ack 太晚。

---

## RM-08 — 補完管理介面 i18n（EN／繁中）

**嚴重度：** Medium · **工期：** M · **人力：** 1 前端 + PM · **依賴：** 字串目錄；PM 風險用詞表。

### 為何要做

港／台值班讀繁中。中英混雜看起來未完成，也容易漏掉嚴重度用詞。

### 今日原型

`useUiLocale`＋Cookie `crmp_ui_lang`、`t()`／`phrase()` 已覆蓋多數 chrome。剩下的英文多半是編號、電子郵件、權限碼（刻意保留），以及部分 AI／證據字串與文件表。代碼（`M2-MRG-014`、`SUPER_ADMIN`）維持拉丁字母。詞彙：違規／警告／危急。

### 要做

1. 登錄所有操作員可見字串（AI 摘要模板、UAT chrome、文件表）。
2. 截圖閘道：技能、警報、Messenger、設定切到繁中。

### 完成標準

- 15 個高流量頁的繁中掃過，沒有殘留英文 **chrome**。
- 種子營運用名要嘛有 overlay，要嘛標成「代碼」。

### 不做的風險

值班漏掉「危急」，因為按鈕仍是英文（代碼可保留拉丁字母）。

---

## RM-09 — 真實控制適配（停商品／槓桿／A-book／暫停出金）

**嚴重度：** Critical · **工期：** L · **人力：** 2 後端 + Ops · **依賴：** 交易／LP 控制匯流排；RM-05；緊急開關。**本輪 UAT 範圍外。**

### 為何要做

今日核准只寫脊柱／稽核。把 `EXECUTED_MOCK` 當成已防損，是最危險的示範誤解。

### 今日原型

[人工干預](/admin/interventions)：`decideIntervention()` 設 `EXECUTED_AFTER_APPROVAL`，**不呼叫**券商。`analyze.ts` 非人工步驟為 `EXECUTED_MOCK`。目錄動作：`suggest_symbol_halt`、`suggest_lp_disable`、`group_leverage_tighten`、`pause_new_copies`、`pause_large_withdrawals`、`suggest_abook_increase`。[AI 存取安全](/admin/security/ai-access) 已把停商品／只平倉列為 AI 角色禁區。

### 要做

1. 依動作適配；**dry-run** 回傳實際控制 payload 與受影響商品／帳戶。
2. 正式執行必須 Maker **且** Checker（不同 SSO 使用者）。
3. 平台設定裡有全域與逐適配緊急開關。這些權限永不授給 AI 服務角色。

### 完成標準

- 測試 dry-run「停止過期報價商品」列出風險負責人預期的商品。
- 在 **測試帳簿** 上真實執行可在交易後台看到並完整稽核。
- 緊急開關能在下一請求擋住後續 live。

### 不做的風險

以為已經防損；或之後半接線的適配在沒有雙人控制時打出去。

---

## RM-10 — 證據遮罩＋保存作業

**嚴重度：** High · **工期：** M · **人力：** 1 後端 + GRC · **依賴：** 證據庫資料分類（法遵）。

### 為何要做

分析可能嵌入帳戶數、提供者名、錢包比例。永久保存會被 GRC 抓。

### 今日原型

`ai_analyses` 把摘要與證據片段存在 SQLite。Messenger 摘錄會留下。沒有 TTL、自動遮罩、法律保全旗標。

### 要做

1. 欄位分類（公開指標 vs 客戶識別 vs 員工個資）。預設 UI 遮罩登入帳號、支付工具、錢包地址。
2. 保存作業（例如 WARN 90 天；BREACH／CRITICAL／法律保全較長）＋將清除項目的演練報表。
3. 給監管的匯出包。完整 payload 僅限授權角色＋原因碼。

### 完成標準

- GRC 抽 20 筆測試分析，預設畫面沒有原始客戶登入或錢包地址。
- 保存演練列出將清除的項目；清除寫入稽核。

### 不做的風險

RCA 摘錄殘留 KYC；刪除請求沒有答案。

---

## RM-11 — 影子模式儀表板（僅 AI 建議）

**嚴重度：** Medium · **工期：** S · **人力：** 1 前端 + 1 後端 · **依賴：** 脊柱指標；自動執行緊急開關。

### 為何要做

沒有單一畫面，高管分不清示範 mock 執行與真實防損。

### 今日原型

已有 `ai.skill_certainty_only`（預設 true）與 `ai.maker_checker_required`，但 [每日績效](/admin/dashboard)／[風險日誌](/admin/risk-log) **沒有**「目前影子」橫幅。

### 要做

1. 影子模式（或橫幅）。強制關閉自動技能執行。
2. 儀表板：建議 vs 人類決策、確認時長、挑戰者 `DISAGREE` 率、本來會寫入的計數（不送出）。
3. 離開影子＝風險負責人＋系統管理員，已稽核變更單。

### 完成標準

- 測試預設即影子；一週建議 vs 實作且 RM-09 適配一次都沒打出。
- 離開影子是已稽核的變更單。

### 不做的風險

台面還以為是示範時，有人打開了 RM-09。

---

## RM-12 — 每次 PR 的 CI UAT 煙測

**嚴重度：** Medium · **工期：** S · **人力：** 1 QA + 1 後端 · **依賴：** CI 內種子庫。

### 為何要做

風險負責人包又長又人工。兩個 UAT 視窗之間會進回歸。

### 今日原型

[UAT 清單](/admin/docs/uat) 是 `lib/docs/uat-cases.ts`（UAT-01…）。沒有流水線在每次 PR 重放危急案例。

### 要做

無頭煙測：角色登入、首頁計數、Monitor 2.0 全部執行、在即時警報與追蹤確認警報、存在 AI 分析、Messenger 有 ALERT＋AI_REPORT、干預佇列、技能頁繁中標題、本路線圖可渲染。斷言失敗即擋 PR。人工包留給 RCA 品質判斷。

### 完成標準

- 故意弄壞（例如技能頁標題）會讓 CI 失敗。
- Critical 清單在約定牆鐘時間內跑完。

### 不做的風險

UAT 當天又發現登入 404、分析列表是空的。

---

## RM-13 — 多品牌／實體租戶

**嚴重度：** Medium · **工期：** XL · **人力：** 架構 + 2 後端 · **依賴：** 組織／實體模型；先完成 RM-05、RM-06。

### 為何要做

槓桿上限與揭露依實體而異。全域角色過不了雙牌照稽核。

### 今日原型

單一種子 CRMP：CFD＋加密混在一起。ASIC／FCA／VFSC 只是 **參考來源**，不是隔離帳簿。角色是全域的。

### 要做

租戶＝法律實體（或品牌）。警報、RAG、技能包、Lark 路由、稽核匯出隔離。跨實體高管視圖只讀彙總。兩套 UAT 種子（VFSC vs FCA）。

### 完成標準

- VFSC 使用者不能確認 FCA 實體工單。
- 高管角色能在有標籤的彙總裡看兩邊。

### 不做的風險

Ack 錯實體；FCA 槓桿技能打到 VFSC 帳簿。

---

## RM-14 — AI 成本／延遲 SLO 告警

**嚴重度：** Medium · **工期：** S · **人力：** SRE · **依賴：** 可觀測性堆疊；搭配 RM-03。

### 為何要做

沒有成本／延遲，壞 Prompt 就是無上限帳單和卡住的台面。

### 今日原型

[管理首頁脊柱](/admin)（`/admin/spine` 轉址）有階段工單計數與時間戳。沒有 token 成本、RCA p95 延遲、花費上限警報。

### 要做

指標：RCA p50／p95、挑戰者延遲、各模型進出 token、每筆分析美元、錯誤率。SLO 示例：不含人工關卡 p95 RCA 15 秒內；每日 AI 花費上限。告警到交易基礎設施＋AI 偵測實驗室。供應商掛掉時降級為只走技能。

### 完成標準

- 測試環境 50 筆併發警報能畫在儀表板。
- 超過美元上限會叫應值班，並停止新的非危急呼叫。

### 不做的風險

花費默默爆掉；RCA 慢過 SLA 卻沒人被叫。

---

## RM-15 — 有評分的市場情報來源（授權饋送）

**嚴重度：** Medium · **工期：** M · **人力：** 1 資料科學 + 1 後端 · **依賴：** 授權新聞／官方／社群合約。

### 為何要做

模板標題會訓練台面去反應假催化。指標計數也會說謊。

### 今日原型

[市場情報](/admin/market-intel) 每五分鐘輪轉 `EVENT_TEMPLATES`（`lib/market-intel/scanner.ts`，Pages 用 `demo-scan.ts`）。種子 `MARKET_INTEL_SOURCES` — 發現可以是合成的。指標 `M2-MKT-INTEL` 計命中。發現卡片帶文章網址進 `oc_market_intelligence`。

### 要做

1. 接入合約電訊＋官方日曆＋選定社群。
2. 依來源類型、交叉印證數、商品命中、地理評分。五分鐘桶內用指紋除重。
3. 只有 WARN 以上 **經印證** 的命中才累加 `M2-MKT-INTEL`。

### 完成標準

- 已知 CPI 公布從至少 2 個授權源接入、除重成一筆、評為高、指標不雙計。
- 單則未印證社群貼文不會違規。

### 不做的風險

合成「非農意外」呼叫台面；真實公布被漏掉或被雙計。

---

## 對照

| 路線圖 | 相關管理頁／文件 |
|---|---|
| RM-01 | [示範 Messenger](/admin/messenger) · [Lark](/admin/lark) |
| RM-02 | [Monitor 2.0](/admin/monitor-2) · [即時警報與追蹤](/admin/alerts) |
| RM-03／RM-04 | [即時警報與追蹤](/admin/alerts) · [AI 管理](/admin/ai-admin) |
| RM-05 | [使用者](/admin/users) · [角色](/admin/roles) |
| RM-09 | [人工干預](/admin/interventions) · [AI 存取安全](/admin/security/ai-access) |
| RM-11 | [每日績效](/admin/dashboard) · [風險日誌](/admin/risk-log) |
| RM-12 | [UAT 清單](/admin/docs/uat) |
| RM-15 | [市場情報](/admin/market-intel) |
| 預算／人力 | [生態導入評估](/admin/docs/ecosystem) |

---

## 文件控制

| 版次 | 日期 | 說明 |
|---|---|---|
| 1.7 | 2026-10-05 | 日常打磨：稽核分頁＋回滾、ESC-DEFAULT、BU 與團隊、開放議題／進度 |
| 1.8 | 2026-10-05 | 選單真相：即時警報與追蹤；偵測器→Monitor 2.0；RM-02／RM-12 今日事實；手機卡片列表 |

**負責人：** demo platform owner（`haixiang.yan@hytechc.com`）
