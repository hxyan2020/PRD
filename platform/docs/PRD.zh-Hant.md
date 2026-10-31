# CRMP 產品需求文件（PRD）

**文件編號：** CRMP-PRD-001  
**狀態：** 原型／可示範  
**產品範圍：** CFD + 加密貨幣交易所  
**負責人：** 風險平台產品經理 · **核准人：** 風險負責人  
**相關文件：** [TSD](/admin/docs/tsd) · [使用手冊](/admin/docs/user-guide) · [UAT](/admin/docs/uat) · [生態導入評估](/admin/docs/ecosystem)

---

## 1. 問題陳述

Vantage Markets 的 CFD 與加密風險橫跨 Monitor 2.0 指標、各桌與即時通訊升級。現況「警報 → 根因 → 行動」分散：分析師重複重建脈絡、AI 建議缺乏獨立挑戰、不可逆控制難以端到端稽核。

**我們需要集中式風險管理平面，能夠：**
- 將 Monitor 警報轉為可解釋 AI RCA  
- 以獨立第二 AI 挑戰高嚴重度 RCA  
- 讓操作者在 messenger 完成證據／升級／排除／結案／控制  
- 強制 Maker／Checker，並禁止 AI 觸及僅限人類介面  
- 留下單一脊柱與稽核軌跡  

---

## 2. 目標

| # | 目標 | 可衡量結果 |
|---|---|---|
| G1 | 單一脊柱 | 偵測→分析→挑戰→升級→干預→稽核可在脊柱日誌看見 |
| G2 | 確定性路由 | 已知技能確定時自動執行；否則 RAG＋人工覆核 |
| G3 | 高嚴重度雙 AI | BREACH／CRITICAL 分析 100% 附第二 AI 挑戰 |
| G4 | AI 設定職責分離 | AI Admin 變更需 Maker ≠ Checker |
| G5 | Messenger 原生操作 | 核心動作不必離開聊天 |
| G6 | 市場感知 | 每 5 分鐘掃描可能影響 LP 之情報 |
| G7 | 安全 AI 邊界 | 僅限人類頁面／功能／欄位列冊並拒絕 AI |

---

## 3. 非目標（本原型）

| 非目標 | 理由 |
|---|---|
| 正式 Lark webhook 投遞 | 以稽核／outbox／站內 Demo Messenger 模擬 |
| 計費正式 LLM API | 以啟發式 Skill／RAG／挑戰引擎代替 |
| 完整 MT4／MT5／LP 寫入適配 | 僅深連結＋模擬 admin ref |
| 大規模多品牌租戶 | 單一示範租戶 |
| 取代 Monitor 2.0 | CRMP 消費 Monitor，不重建 |

---

## 4. 角色與待辦工作

| 角色 | 主要工作 |
|---|---|
| **風險負責人** | 接受／拒絕 AI 包；升級；核准不可逆控制；UAT 退出 |
| **風險分析師** | 分流警報；於 messenger 挑戰 AI；補充脈絡 |
| **營運主管／分析師** | 提出停牌／封鎖／擴點／暫停跟單；Maker 確認進管理後台 |
| **AI 工程師** | Skills、RAG、偵測器、第二意見門檻、AI Admin 提案 |
| **系統管理員** | 使用者／角色、設定、AI 黑名單、稽核衛生 |
| **檢視者** | 唯讀監看（無 AI Admin／操作權） |

---

## 5. 使用者旅程（快樂路徑）

### 5.1 高嚴重度警報 → 雙 AI → messenger 結案
1. Monitor 指標觸發（如跟單集中度）。  
2. CRMP 建立警報＋AI 分析（`SKILL_MATCH` 或 `RAG_REASONING`）。  
3. 若嚴重度 ≥ `ai.second_opinion_severity`（預設 BREACH），執行 `crmp-challenger-v0`。  
4. 分析師於 Demo Messenger **Show evidence**；可選擇以聊天挑戰。  
5. 風險負責人覆核主分析＋挑戰者後 **Close** 或升級／要求控制。

### 5.2 控制項雙重確認＋Checker
1. 操作者選擇建議行動（如封鎖帳戶）。  
2. 雙重確認 → 模擬 Vantage admin ref＋連結。  
3. 若需 Checker，於 Interventions／指示路徑核准。  
4. 稽核＋脊柱記錄 Maker／Checker 結果。

### 5.3 AI Admin 變更
1. Maker 於 AI Admin 提出設定／模型／政策。  
2. 不同 Checker 核准。  
3. 自我核准被拒絕。

---

## 6. 功能需求

### 6.1 P0 — 原型必須

| ID | 需求 | 驗收摘要 |
|---|---|---|
| FR-01 | 同步／顯示 Monitor 2.0 指標並產生警報 | EQ／MRG／COPY 可見；可模擬警報 |
| FR-02 | Skill 匹配 RCA 與步驟紀錄 | COPY breach → `SKILL_MATCH`＋技能步驟 |
| FR-03 | 技能不確定時走 RAG RCA | EQ 路徑可產出 `RAG_REASONING`＋證據 |
| FR-04 | 達門檻之獨立第二 AI 挑戰者 | BREACH／CRITICAL 有面板＋CHALLENGER 證據；WARN 預設跳過 |
| FR-05 | Demo Messenger：證據／聊天／升級／排除／結案 | 各動作更新執行緒＋稽核 |
| FR-06 | 建議控制＋雙重確認 → admin ref | 封鎖／停牌等產生 admin_ref；需要時有 Checker |
| FR-07 | AI Admin Maker ≠ Checker | 同一使用者不可核准自己的提案 |
| FR-08 | AI 存取黑名單（頁面／功能／欄位） | UI 列出僅限人類目標與理由 |
| FR-09 | AI／messenger／干預事件寫入脊柱＋稽核 | 約 1 分鐘內可對應 |
| FR-10 | 管理介面 RBAC | Viewer 無法操作 AI Admin |

### 6.2 P1 — 原型應具備

| ID | 需求 | 驗收摘要 |
|---|---|---|
| FR-11 | 市場情報 5 分鐘掃描＋outbox 卡片 | 可掃描；有發現／outbox 或空掃描紀錄 |
| FR-12 | 風險日誌分析 | 頁面呈現風險事件時間軸／分析 |
| FR-13 | 雙語產品文件（英／繁中） | PRD、TSD、手冊、UAT、生態可切換 |
| FR-14 | 響應式管理介面 | 390px：抽屜＋messenger 主從；無整頁溢出 |
| FR-15 | 強化技能風險情境／鏈 | Skills 看板含門檻與升級 |
| FR-16 | 示範網址目錄 | `/admin/docs/urls` 列出管理／API／資料路徑 |

### 6.3 P2 — 後期（生態階段）

| ID | 需求 |
|---|---|
| FR-17 | 正式 Lark 互動卡片 |
| FR-18 | Monitor 雙向工單回寫 |
| FR-19 | 真實交易控制匯流排（含 dry-run） |
| FR-20 | 正式 LLM＋評測；挑戰者供應商多樣化 |

---

## 7. 非功能需求

| ID | 領域 | 需求 |
|---|---|---|
| NFR-01 | 延遲 | 原型：警報→雙 AI 包通常 &lt; 60 秒 |
| NFR-02 | 可稽核 | 警報／分析／messenger／AI Admin 變更須寫稽核 |
| NFR-03 | 安全 | AI 主體不得擁有黑名單權限 |
| NFR-04 | 職責分離 | AI Admin 強制 M／C；指定控制需 Checker |
| NFR-05 | 可用性 | 示範可用單機 SQLite；正式需 HA（見生態評估） |
| NFR-06 | i18n | 操作文件英＋繁中；導覽可切語言 |
| NFR-07 | 基本可及性 | 手機觸控目標可用；關鍵動作有標籤 |

---

## 8. 詳細驗收標準（原型閘道）

1. **技能＋挑戰者：** 模擬 COPY BREACH → `SKILL_MATCH`＋第二 AI 面板（挑戰時≥1 HIGH 改進）。  
2. **門檻：** 預設 BREACH 下，純 WARN EQ 模擬**不**建立挑戰。  
3. **Messenger：** Show evidence 貼出證據庫；Escalate 前進路徑；Dismiss／Close 更新狀態。  
4. **控制：** 封鎖帳戶→雙重確認→admin_ref；需要時有 Checker 後續。  
5. **AI Admin：** 需不同 Checker；禁止自我核准。  
6. **覆蓋：** UAT 視窗 BREACH／CRITICAL 100% 已挑戰（允許回填）。  
7. **文件：** PRD／TSD／手冊／UAT／生態英繁可渲染。  
8. **行動：** ~390px messenger 列表→執行緒→返回，無文件級橫向溢出。

正式執行見：[UAT 清單](/admin/docs/uat)（UAT-01 … UAT-20）。

---

## 9. 成功指標（試點）

| 指標 | 目標 |
|---|---|
| 警報→雙 AI 包平均時間 | &lt; 60 秒（原型） |
| BREACH+ 附挑戰者比例 | 100% |
| 誤報排除已稽核 | 100% |
| AI Admin 變更經不同 Checker | 100% |
| 僅限人類介面已列入黑名單 | 議定清冊 100% |
| Critical UAT 通過 | 100% |

---

## 10. 範圍邊界與依賴

**依賴：** Monitor 2.0 指標模型；企業 messenger（未來 Lark）；真實控制之 Vantage admin；正式 SSO 之 IdP。  
**對外提供：** 風險／營運桌單一控制平面 UI＋稽核脊柱。  
**B／C 階段前不在範圍：** 正式 webhook、寫入適配、Postgres HA（見[生態導入評估](/admin/docs/ecosystem)）。

---

## 11. 風險與待決問題

| 風險／問題 | 緩解 |
|---|---|
| 啟發式 AI 過度自信 | 高嚴重度強制第二 AI；PARTIAL／DISAGREE → needs_human |
| 操作者繞過 messenger | 保留管理深連結；兩路徑皆稽核 |
| 過早自動化寫入 | 控制匯流排前先影子模式（生態階段 C） |
| 企業 messenger 標準？ | 假設 Lark；Teams 適配待定 |
| 證據個資保存 | 正式識別前先法遵審查 |

---

## 12. 發布計畫（原型 → 正式）

| 階段 | 成果 |
|---|---|
| 原型（現況） | 示範脊柱、雙 AI、messenger、文件、UAT 包 |
| 階段 A | 強化認證／託管／可觀測性 |
| 階段 B | 即時 Monitor＋Lark 通知（讀路徑） |
| 階段 C | 監督寫入＋緊急開關 |
| 階段 D | 模型營運／挑戰者多樣化 |

---

## 13. 簽核

| 角色 | 姓名 | 決策 | 日期 |
|---|---|---|---|
| 風險負責人 | _待填_ | | |
| 風險平台 PM | _待填_ | | |
| 工程負責人 | _待填_ | | |
| 資安／GRC | _待填_ | | |
