# 平台改進路線圖

**文件編號：** CRMP-RM-001  
**版本：** 1.1  
**狀態：** 持續更新待辦（原型之後）  
**依據：** 現行 CRMP 管理控制平面（偵測 → 雙 AI RCA → Demo Messenger → Spine；AI Admin；市場情報；雙語文件；響應式殼層）  
**相關文件：** [PRD](/admin/docs/prd) · [TSD](/admin/docs/tsd) · [生態評估](/admin/docs/ecosystem) · [UAT](/admin/docs/uat)

**工期（Effort）**為相對工程規模，**不是**行事曆排程；實際天數視人力與外部核准而定。

| 工期 | 含義 |
|---|---|
| **S** | 小型垂直切片 — 單一工程師可交付、無新供應商 |
| **M** | 多模組變更 — 通常 1–2 名工程師、外部依賴有限 |
| **L** | 跨團隊模組 — 需整合契約、雙重控制、預發環境 |
| **XL** | 計畫級 — 架構、供應商與組織變革 |

**嚴重度：** Critical（阻礙正式信任）· High（重大風險／品質）· Medium（擴充／體驗）· Low（可選）

**相對現況：** `Done` 已完成 · `Partial` 部分完成 · `Open` 未開始

---

## 優先待辦

| ID | 項目內容 | 原因（相對現況缺口） | 工期 | 人力 | 依賴 | 嚴重度 | 狀態 | 備註 |
|---|---|---|---|---|---|---|---|---|
| RM-01 | **正式 Lark 互動卡片** — 按鈕呼叫 CRMP API（證據、升級、排除、結案、建議控制） | 操作員不會長期只待在站內 Demo Messenger；Lark 傳輸為模擬 | L | 2 FE + 1 BE + Lark 應用負責人 | Lark 應用核准；頻道登錄；稽核契約 | Critical | Open | Demo Messenger 可作後備／預發 |
| RM-02 | **Monitor 2.0 webhook 接入＋工單回寫** | 警報多為模擬／種子；排除／結案未回寫真實 Monitor | L | 2 BE + Monitor API 負責人 | Monitor API 契約；冪等鍵 | Critical | Open | 完成營運閉環 |
| RM-03 | **正式 LLM 主 RCA**（工具呼叫＋離線評測） | Skill／RAG 為啟發式替代 | XL | 1 ML + 2 BE + Risk Owner（評測） | Prompt 庫；預算上限；黃金案例集 | High | Open | 評測過關才可上線 |
| RM-04 | **挑戰模型多樣化** — 與主模型分離供應商／提示堆疊 | `crmp-challenger-v0` 邏輯獨立但供應商未多樣 | M | 1 ML | RM-03；禁止共用 prompt cache | High | Open | 降低相關失敗 |
| RM-05 | **SSO + SCIM** 使用者／角色佈建 | 示範帳密削弱職能分離與稽核 | M | 1 BE + 資安 | 企業 IdP；角色對映 | Critical | Open | 淘汰共用示範密碼 |
| RM-06 | **Postgres＋多實例部署**（具備 HA） | SQLite 單機檔案；併發寫入弱 | M | 1 SRE + 1 BE | 基礎建設；結構遷移 | High | Open | 多使用者正式營運前提 |
| RM-07 | **行動操作體驗再強化** — PWA／觸控密度／開啟執行緒離線讀取 | 響應式抽屜＋messenger 主從已交付 | S | 1 FE | Design tokens；RM-01（Lark 行動） | Medium | Partial | 網頁響應式＝部分完成 |
| RM-08 | **管理介面完整 i18n**（各看板英／繁） | 文件＋導覽切換已有；多數看板字串仍偏英文 | M | 1 FE + PM（字串目錄） | 訊息目錄；截圖 UAT | Medium | Partial | 文件已雙語 |
| RM-09 | **交易控制匯流排適配**（停牌／槓桿／擴點／暫停跟單／封鎖）含 **dry-run＋緊急開關** | 控制僅產生模擬 admin ref／深連結 | L | 2 BE + Ops + Risk Owner | 控制匯流排 API；雙重控制政策 | Critical | Open | 先影子模式（RM-11） |
| RM-10 | **證據遮罩與保存週期作業** | 摘要可能含 PII；無自動保存策略 | M | 1 BE + GRC／法遵 | 保存政策；靜態加密 | High | Open | 正式識別資料前需法遵簽核 |
| RM-11 | **影子模式儀表板** — 僅建議／通知，無寫入副作用 | 任何寫入適配上線前必要 | S | 1 FE + 1 BE | Spine 指標；功能旗標 | Medium | Open | Phase C 出場條件 |
| RM-12 | **CI 自動化 UAT 煙測**（種子庫） | 互動 UAT 看板已有；尚未作 PR 閘道 | S | 1 QA + 1 BE | 種子資料；無頭登入 | Medium | Open | 關鍵 UAT 擋 PR |
| RM-13 | **多品牌／實體租戶** | 單一示範租戶阻礙集團推廣 | XL | 架構師 + 2 BE | 組織模型；隔離測試 | Medium | Open | 於 HA＋SSO 之後 |
| RM-14 | **AI 路徑成本／延遲 SLO 告警** | RCA／挑戰路徑無可正式觀測 | S | 1 SRE | APM；RM-03 花費計量 | Medium | Open | 搭配模型上線 |
| RM-15 | **市場情報授權來源＋評分** | 掃描為合成／啟發式 | M | 1 DS + 1 BE | 供應源；速率限制 | Medium | Open | 降噪後桌面才會信任 |
| RM-16 | **AI 存取黑名單綁定服務主體** | 黑名單多為介面文件性質 | M | 1 BE + 資安 | IAM 角色；AI 服務帳號 | Critical | Open | 在授權層強制，非僅 UI |
| RM-17 | **稽核包匯出**（JSON／PDF）供合規審閱 | Spine／稽核 UI 已有；無匯出包 | S | 1 BE + 1 FE | 保存政策（RM-10） | High | Open | Risk Owner 簽核需要 |
| RM-18 | **Skill 編輯工作室** — 引導式 scenario_json＋歷史警報 dry-run | Skills 看板已有；編輯偏 JSON 進階 | M | 1 FE + 1 BE + AI Eng | Skill schema；沙盒庫 | Medium | Open | 加速劇本覆蓋 |
| RM-19 | **Teams（或第二即時通訊）適配** | 企業標準可能非僅 Lark | L | 1 BE + 1 FE | RM-01 模式；IT 決策 | Medium | Open | 傳輸抽象於 messenger 領域 |
| RM-20 | **誤報學習迴路** — 排除原因 → RAG／Skill 調優佇列 | 排除可結案；結構化回饋進訓練有限 | M | 1 ML + 1 BE | AI Admin 訓練佇列；UAT 標註 | High | Open | 長期提升精準度 |

---

## 建議波次

### 波次 A — 基礎（信任與可部署）
RM-05 SSO · RM-06 Postgres／HA · RM-16 黑名單強制 · RM-02 Monitor 回寫 · RM-17 稽核匯出

### 波次 B — 操作通道與安全護欄
RM-01 Lark 卡片 · RM-11 影子模式 · RM-07 行動強化 · RM-12 CI UAT

### 波次 C — 寫入路徑（Risk Owner 接受波次 B 後）
RM-09 控制適配＋緊急開關 · dry-run 演練 · BREACH／CRITICAL 自動結案政策（預設：**關閉**）

### 波次 D — 模型品質
RM-03 LLM RCA＋評測 · RM-04 多樣挑戰者 · RM-14 SLO · RM-20 排除學習 · RM-18 Skill 工作室

### 波次 E — 強化與擴充
RM-08 完整 UI i18n · RM-10 遮罩／保存 · RM-15 市場情報來源 · RM-13 多品牌 · RM-19 第二通訊適配

---

## 現行原型已交付（勿重複投資）

| 能力 | 位置 |
|---|---|
| 嚴重度門檻以上雙 AI 挑戰 | `/admin/ai-analyses`、`challenger.ts` |
| Demo Messenger 分流動作 | `/admin/messenger` |
| AI Admin Maker／Checker＋黑名單 UI | `/admin/ai-admin`、`/admin/security` |
| 市場情報 5 分鐘掃描＋outbox | `/admin/market-intel` |
| 雙語文件 | `/admin/docs/*` |
| 響應式管理殼層＋messenger 主從 | `AdminShell`、`DemoMessenger` |
| 互動 UAT 清單 | `/admin/docs/uat` |
| 核心變更之 Spine＋稽核 | `/admin/spine`、`/admin/audit` |

---

## 文件控制

| 版次 | 說明 |
|---|---|
| 1.0 | 初版 15 項待辦 |
| 1.1 | 依已交付原型更新；新增 RM-16…20；狀態欄；波次；修正「從頭做行動抽屜」為過時項 |

**對應文件：** [English](./ROADMAP.md) · `/admin/docs/roadmap`
