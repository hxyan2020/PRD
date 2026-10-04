# 平台改進路線圖

**文件編號：** CRMP-RM-001 · 現行 CRMP 原型之後的優先待辦  
**讀者：** 風險負責人、平台負責人、工程、GRC  
**讀法：** 上表是掃描視圖。每個 `RM-xx` 寫明 **今日原型行為**、**要做什麼**、**完成標準**，方便 UAT 分清示範與正式環境。

本原型已能走通脊柱：**Monitor 警報 → AI 根因（技能／RAG）→ 第二 AI 挑戰 → Messenger → Maker／Checker → 稽核／脊柱**。本表要補上會讓正式台面失敗的缺口：模擬 Lark、種子 Monitor、啟發式 AI、SQLite、共用示範密碼、只記日誌的「執行」。

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

1. **基礎：** RM-05、RM-06、RM-02 — 身分、耐久儲存、即時警報。  
2. **操作體驗：** RM-01、RM-07、RM-11 — 人在 Lark 工作，並能跑影子模式。  
3. **寫路徑（最後）：** RM-09＋全域緊急開關 — 等風險負責人接受影子誤報率。  
4. **模型品質：** RM-03＋RM-04＋RM-14。  
5. **強化與擴充：** RM-08、RM-10、RM-12、RM-15。RM-13 屬後期計畫。

規則：在 B 階段誤報與挑戰者 `DISAGREE` 流程被接受前，**不要**打開 RM-09 寫入適配。

---

## RM-01 — 正式 Lark 互動卡片

**嚴重度：** Critical · **工期：** L · **人力：** 2 前端 + 1 後端 · **依賴：** Lark（或 Teams）應用核准、機器人憑證進密鑰庫。

**今日。** [示範 Messenger](/admin/messenger) 是站內 Lark 風格收件匣。[Lark 整合](/admin/lark) 存頻道（`oc_risk_control_desk` 等），Webhook 為 **模擬** 網址。`POST /api/lark` 的 `test_notify` 只寫稽核並回 `mock: true` — 不會真的發到 Lark。

**要做。** 註冊正式 Lark 應用。每個 CRMP `chat_id` 對到真實聊天室。對 ALERT／AI_REPORT／ESCALATION 發 **卡片**，按鈕：確認、升級、排除（誤報）、結案（接受 AI）、確認動作（Maker）、Checker 核准。按鈕以操作員 SSO 身分呼叫 CRMP API，再更新脊柱與稽核。

**完成標準。** 測試 Monitor 指標違規會在風險控管台聊天室出卡；點 Ack 會把 CRMP 警報標成 `ACKNOWLEDGED` 並回寫 Monitor 工單（搭配 RM-02）；點人工關卡動作會走 Maker／Checker，不會靜默執行。示範 Messenger 可留作除錯台。

---

## RM-02 — 真實 Monitor 2.0 webhook + 工單回寫

**嚴重度：** Critical · **工期：** L · **人力：** 2 後端 · **依賴：** Monitor 2.0 API 契約負責人。

**今日。** [Monitor 2.0](/admin/monitor-2) 是種子 SQLite 目錄（`M2-MRG-014`、`M2-EQ-001` 等）。同步／確認／工單「進行中」是打本機列的原型 POST。沒有入站 webhook，也不呼叫 `monitor.vantagemarkets.internal`。

**要做。** 入站：Monitor 推送警告／違規（指標、觀測值、工單、嚴重度）→ CRMP 更新 `monitor_indicators`／`monitor_alerts`／`monitor_tickets` 並觸發 AI RCA。出站：CRMP 的 Ack、排除、結案、承辦人變更 **PATCH Monitor 工單**。重放／冪等鍵，避免重複分析。對 Monitor 沙盒做契約測試。

**完成標準。** 沙盒違規在 SLA 內產生 CRMP 警報＋分析；在 CRMP 或 Lark 確認後，Monitor 側顯示已確認；CRMP **不會**僅憑 AI 就關閉 BREACH／CRITICAL 工單（風險負責人政策）。

---

## RM-03 — LLM 主 RCA：工具呼叫＋評測架

**嚴重度：** High · **工期：** XL · **人力：** 1 ML + 2 後端 · **依賴：** Prompt 庫、花費上限、RM-02 即時警報當標註。

**今日。** `lib/ai/analyze.ts` **啟發式匹配技能**（`matchSkill`）或檢索 RAG。技能步驟存成 `EXECUTED_MOCK`／`AWAITING_HUMAN`。技能命中時信心可到 1.0。沒有線上模型、工具、離線評測集。

**要做。** 主 RCA 模型＋**工具**：取指標快照、相關監控、RAG `top_k`、市場情報、未結工單、宏觀日曆。僅在匹配器 **與** 模型都同意時走技能路徑。評測架：歷史標註案例（跟單集中、LP 拒單、熱錢包浮額、權益回撤），打假設品質、證據引用、不安全動作率。Prompt 版本走 AI 管理 Maker／Checker。

**完成標準。** 留出測試包上技能精確率達約定門檻（起步 80%）；沒有人工關卡的不可逆建議 = 0；每筆 RCA 至少引用一筆證據庫。挑戰者（RM-04）維持 **獨立** 行程。

---

## RM-04 — 挑戰模型多樣化

**嚴重度：** High · **工期：** M · **人力：** 1 ML · **依賴：** RM-03。

**今日。** [AI 分析](/admin/ai-analyses) 已對 BREACH／CRITICAL 跑第二 AI（`ai.second_opinion_severity`）。`lib/ai/challenger.ts` 是 **第二套啟發式**（共訊號檢查、信心上限）。同一程式庫、沒有第二供應商、沒有隔離 Prompt 快取。

**要做。** 獨立模型（不同供應商 **或** 隔離端點＋提示）。不與主 RCA 共用工具結果快取。裁決維持 `AGREE`／`PARTIAL`／`DISAGREE`。`DISAGREE` 或 `PARTIAL` **阻止**自動技能執行，強制人工干預。分析上記兩個模型 id 與 token 成本。

**完成標準。** 測試注入（主路徑宣稱技能確定、饋送其實過期）時挑戰者 100% 給 `DISAGREE` 或 `PARTIAL`；風險負責人可依裁決篩選；花費出現在 RM-14。

---

## RM-05 — SSO + SCIM 使用者佈建

**嚴重度：** Critical · **工期：** M · **人力：** 1 後端 + 資安 · **依賴：** 企業 IdP（Okta／Entra ID）。

**今日。** 登入是 **示範角色**（`risk.owner@…`／`risk123`，加上具名平台負責人）。工作階段用 Cookie。[使用者](/admin/users) 是本機目錄。共用密碼過不了職責分離與稽核。

**要做。** OIDC／SAML SSO。SCIM（或 JIT）從 IdP 建立／停用使用者。IdP 群組對 CRMP 角色（`RISK_OWNER`、`OPS_LEAD` 等）。測試／正式環境廢除示範密碼。Maker ≠ Checker 用 **IdP 身分** 執行，不只應用內旗標。緊急 `SUPER_ADMIN` 放密鑰庫，使用需雙人核准。

**完成標準。** 風險 IdP 群組新人可免本機密碼登入；離職者在 SCIM SLA 內停用；測試環境不能再用 `risk123` 登入。

---

## RM-06 — Postgres＋多實例部署

**嚴重度：** High · **工期：** M · **人力：** 1 SRE + 1 後端 · **依賴：** 託管 Postgres、證據物件儲存。

**今日。** 持久化是 **一個 SQLite 檔**（`platform/data/vantage_risk.db`、`better-sqlite3`）。示範夠用；無 HA、併寫弱、GitHub Pages 不能寫庫。

**要做。** Postgres（WAL、備份、PITR）。應用無狀態（至少 2 實例）。先原表遷移（警報、分析、脊柱、稽核、RAG 另覓 FTS）。健康／就緒探針。正式環境不要默默回退 SQLite。

**完成標準。** 偵測器執行中殺掉一個應用實例，脊柱事件不丟；從備份還原演練符合系統管理員簽下的 RPO／RTO。

---

## RM-07 — 行動導覽抽屜＋觸控 Messenger

**嚴重度：** Medium · **工期：** S · **人力：** 1 前端 · **依賴：** 既有 design tokens。

**今日。** 後台已有 **抽屜** 與部分 `min-h-11`／安全區，但密表格、Messenger 執行緒、雙重確認表對拇指仍不友善。值班常在美盤用手機開 CRMP。

**要做。** 375px 走通：登入、首頁、警報、Messenger 執行緒（確認／升級／確認動作）、干預核准／駁回。44px 熱區、主動作不橫向裁切、輸入列固定、語言切換搆得到。Messenger 卡片直向堆疊；證據用抽屜而非窄欄。

**完成標準。** 真機 UAT：打開違規執行緒、Ack、打開人工關卡動作、完成 Maker 確認，不必捏合縮放。CI 自動截 375px（搭配 RM-12）。

---

## RM-08 — 補完管理介面 i18n（EN／繁中）

**嚴重度：** Medium · **工期：** M · **人力：** 1 前端 + PM · **依賴：** 字串目錄；PM 審風險用詞。

**今日。** 殼層、頁標題、徽章與大量 phrase 已覆蓋多數 chrome。剩下的英文多半是 **編號、電子郵件、權限碼**（刻意保留），以及部分證據／AI 敘事與文件表。

**要做。** 登錄所有操作員可見字串（含 AI 摘要模板、UAT 案例 chrome、路線圖／文件表）。代碼（`M2-MRG-014`、`SUPER_ADMIN`）維持拉丁字母。詞彙表：違規／警告／危急一致。截圖閘道：技能、警報、Messenger、設定切到繁中。

**完成標準。** 15 個高流量頁的繁中掃過，沒有殘留英文 **chrome**（標題、按鈕、空狀態、錯誤）。種子營運用名要嘛有 overlay，要嘛標成「代碼」。

---

## RM-09 — 干預適配（停商品／槓桿／封鎖）含 dry-run

**嚴重度：** Critical · **工期：** L · **人力：** 2 後端 + Ops · **依賴：** Vantage 交易／LP 控制匯流排；RM-05 身分；緊急開關。

**今日。** [人工干預](/admin/interventions) 佇列帶 `requires_human` 的技能步驟。核准只寫脊柱／稽核並標已執行 — **不會**呼叫停用 LP、停商品、組別槓桿、跟單上限或暫停出金。代碼存 `EXECUTED_MOCK`。

**要做。** 依動作適配：`suggest_symbol_halt`、`suggest_lp_disable`、`group_leverage_tighten`、`pause_new_copies`、`pause_large_withdrawals`、`suggest_abook_increase` 等。**Dry-run** 回傳實際控制 payload 與受影響商品／帳戶。正式執行必須 Maker **且** Checker（不同 SSO 使用者）。平台設定裡有全域與逐適配緊急開關。這些權限 **永不** 授給 AI 服務角色（[AI 存取安全](/admin/security/ai-access)）。

**完成標準。** 測試環境 dry-run「停止過期報價商品」列出風險負責人預期的商品；在 **測試帳簿** 上真實執行可在交易後台看到並完整稽核；緊急開關能在下一請求擋住後續 live。

---

## RM-10 — 證據遮罩與保存作業

**嚴重度：** High · **工期：** M · **人力：** 1 後端 + GRC · **依賴：** 證據庫資料分類（法遵）。

**今日。** 分析把解釋、證據片段、Messenger 摘錄存在 SQLite，可能含帳戶數、提供者名、錢包比例。沒有 TTL、自動遮罩、法律保全旗標。

**要做。** 欄位分類（公開指標 vs 客戶識別 vs 員工個資）。預設 UI 遮罩登入帳號、支付工具、錢包地址；完整 payload 僅限授權角色＋原因碼。保存作業：例如 WARN 證據 90 天，BREACH／CRITICAL／法律保全較長。給監管的匯出包。

**完成標準。** GRC 抽 20 筆測試分析，預設畫面沒有原始客戶登入或錢包地址；保存演練報表列出將清除的項目；清除寫入稽核。

---

## RM-11 — 影子模式儀表板（僅 AI 建議）

**嚴重度：** Medium · **工期：** S · **人力：** 1 前端 + 1 後端 · **依賴：** 脊柱指標；自動執行緊急開關。

**今日。** 已有 `ai.skill_certainty_only` 與 Maker／Checker，但 **沒有單一畫面** 寫著「目前影子：AI 建議 X、人類做了 Y、寫入關閉」。容易把示範 mock 執行當成真實防損。

**要做。** 每日績效／風險日誌的 **影子** 模式（或橫幅）。強制關閉自動技能執行。儀表板：建議 vs 人類決策、確認時長、挑戰者異議率、本來會寫入的動作（只計數、不送出）。離開影子需風險負責人＋系統管理員（雙重控制）。

**完成標準。** 測試預設即影子；風險負責人能給高管看一週建議 vs 實作，且 RM-09 適配一次都沒打出；離開影子是已稽核的變更單。

---

## RM-12 — CI 自動化 UAT 煙測

**嚴重度：** Medium · **工期：** S · **人力：** 1 QA + 1 後端 · **依賴：** CI 內種子庫。

**今日。** [UAT 清單](/admin/docs/uat) 是給風險負責人的長篇 **人工** 包（UAT-01…）。沒有流水線在每次 PR 重放危急案例。

**要做。** 對 Critical／High 做無頭煙測：角色登入、首頁計數、跑偵測器、確認警報、存在 AI 分析、Messenger 執行緒有 ALERT＋AI_REPORT、干預佇列、技能頁繁中標題、路線圖可渲染。斷言失敗即擋 PR。人工 UAT 包留給判斷題（RCA 品質）。

**完成標準。** 故意弄壞（例如技能頁標題）會讓 CI 失敗；Critical 清單在約定牆鐘時間內跑完。

---

## RM-13 — 多品牌／實體租戶

**嚴重度：** Medium · **工期：** XL · **人力：** 架構 + 2 後端 · **依賴：** 組織／實體模型；後期。

**今日。** 單一種子 CRMP：CFD＋加密混在一起，ASIC／FCA／VFSC 只是 **參考來源**，不是隔離帳簿。角色是全域的。

**要做。** 租戶＝法律實體（或品牌）。警報、RAG、技能包（槓桿上限依實體而異）、Lark 路由、稽核匯出隔離。跨實體高管視圖只讀彙總。RM-05／RM-06 完成前不要開工。

**完成標準。** VFSC 使用者不能確認 FCA 實體工單；高管角色能在有標籤的彙總裡看兩邊；UAT 有兩套種子。

---

## RM-14 — AI 路徑成本／延遲 SLO 告警

**嚴重度：** Medium · **工期：** S · **人力：** SRE · **依賴：** 可觀測性堆疊；搭配 RM-03。

**今日。** 有脊柱時間戳；沒有 token 成本、RCA p95 延遲、預算警報。提示迴圈失控會看不見。

**要做。** 指標：RCA 延遲 p50／p95、挑戰者延遲、各模型進出 token、每筆分析美元、錯誤率。SLO 例如（不含人工關卡）p95 RCA 15 秒內、每日 AI 花費上限。告警到交易基礎設施＋AI 偵測實驗室。供應商掛掉時緊急降級為只走技能。

**完成標準。** 測試環境 50 筆併發警報能畫在儀表板；超過美元上限會叫應值班，並停止新的非危急呼叫。

---

## RM-15 — 更完整的市場情報來源評分

**嚴重度：** Medium · **工期：** M · **人力：** 1 資料科學 + 1 後端 · **依賴：** 授權新聞／官方／社群合約。

**今日。** [市場情報](/admin/market-intel) 跑 **五分鐘啟發式掃描**（`EVENT_TEMPLATES`、種子來源）。發現可以是合成的。指標 `M2-MKT-INTEL` 計命中。沒有來源信任分、跨電訊除重、授權稽核。

**要做。** 接入合約電訊＋官方日曆＋選定社群。依來源類型、交叉印證數、商品命中、地理評分。五分鐘桶內用指紋除重。只有 WARN 以上 **經印證** 的命中才累加 `M2-MKT-INTEL`。推送格式維持（i）–（vi）進 `oc_market_intelligence`。

**完成標準。** 已知 CPI 公布從至少 2 個授權源接入、除重成一筆、評為高、指標不雙計；單則未印證社群貼文不會違規。

---

## 對照

| 路線圖 | 相關管理頁／文件 |
|---|---|
| RM-01 | [示範 Messenger](/admin/messenger) · [Lark](/admin/lark) |
| RM-02 | [Monitor 2.0](/admin/monitor-2) · [即時警報](/admin/alerts) |
| RM-03／RM-04 | [AI 分析](/admin/ai-analyses) · [AI 管理](/admin/ai-admin) |
| RM-05 | [使用者](/admin/users) · [角色](/admin/roles) |
| RM-09 | [人工干預](/admin/interventions) · [AI 存取安全](/admin/security/ai-access) |
| RM-11 | [每日績效](/admin/dashboard) · [風險日誌](/admin/risk-log) |
| RM-12 | [UAT 清單](/admin/docs/uat) |
| RM-15 | [市場情報](/admin/market-intel) |
| 預算／人力 | [生態導入評估](/admin/docs/ecosystem) |
