# Vantage CRMP — 技術規格設計（TSD）

**文件編號：** CRMP-TSD-001  
**版本：** 1.1  
**狀態：** 原型／持續更新  
**產品範圍：** CFD + 加密貨幣交易所  
**主要技術棧：** Next.js 15（App Router）、React 19、SQLite（`better-sqlite3`）、RBAC Session 驗證  

本 TSD 描述中央風險管理平台（CRMP）管理控制平面之技術設計。  
**§8 AI Admin 管理頁**為一級模組規格（介面、API、資料模型、權限、Maker/Checker）。

---

## 1. 目的與範圍

### 1.1 目的
提供單一管理控制平面，讓風險、營運、AI、系統人員可以：
- 監看 Monitor 2.0 指標／警報
- 執行 AI 根因分析（Skills + RAG）
- 對高影響動作強制人工關卡
- 以 Maker/Checker 治理 AI 設定
- 檢視 Spine 日誌、風險分析與每日績效

### 1.2 原型範圍內
- 管理 UI + SQLite 持久化
- Detectors → Alarm → AI → Intervention → Spine → Dashboard
- AI Admin 治理（參數、Skills、RAG、訓練、準確率）
- 風險情境劇本與多指標時間鏈
- Lark 頻道登錄（模擬 Webhook）

### 1.3 原型範圍外（正式接線）
- 正式 SSO／IdP
- 真實 Lark／oneZero／錢包適配器
- 正式模型訓練叢集

---

## 2. 系統脈絡

```
Monitor 2.0 / Detectors ──► 警報 ──► AI RCA（Skills | RAG）
                                      │
                                      ▼
                           人工介入（Human Intervention）
                                      │
                                      ▼
                           Spine 日誌 + Risk Log + 每日儀表板
                                      │
                                      ▼
                           Lark 頻道（通知／升級）
```

**AI Admin** 位於執行期 Spine 旁側：不直接執行交易動作；在雙人管控下治理模型、劇本、RAG 語料與 AI 參數。

---

## 3. 架構總覽

| 層級 | 職責 | 主要路徑 |
|---|---|---|
| UI（App Router） | RBAC 控管管理頁 | `platform/src/app/admin/**` |
| 前端主控台 | 互動分頁／表單 | `platform/src/components/*` |
| API | JSON 讀寫 | `platform/src/app/api/**` |
| 領域邏輯 | 業務規則 | `platform/src/lib/ai/*`、`lib/db.ts`、`lib/auth.ts` |
| 持久化 | SQLite 檔 | `platform/data/vantage_risk.db` |

### 3.1 執行期 Spine 階段
1. **Detectors** 採樣指標（`/admin/detectors`）
2. **Alarm** 建立 Monitor 警報／工單
3. **AI RCA** 匹配 Skill 或 RAG 推論（`/admin/ai-analyses`）
4. **人工介入** 核准／駁回關卡步驟（`/admin/interventions`）
5. **Spine 日誌** 記錄階段轉換（`/admin/spine`）
6. **每日績效／Risk Log** 彙總結果

---

## 4. 資料模型（核心）

### 4.1 身分與 RBAC
- `users`、`roles`（權限 JSON）、`departments`、`teams`
- 權限為字串代碼；`SUPER_ADMIN` 擁有 `*`

### 4.2 監控
- `monitor_indicators`、`monitor_alerts`、`monitor_tickets`
- `risk_domains`、`escalation_routes`、`lark_channels`

### 4.3 AI 執行期
- `ai_skills`（含 `scenario_json`）、`risk_scenario_chains`
- `rag_documents`（含 FTS）
- `ai_analyses`、`ai_analysis_evidence`、`ai_skill_runs`
- `interventions`、Spine 相關表

### 4.4 AI Admin 治理
見 **§8.4** — `ai_change_requests`、`ai_training_runs`、`ai_feedback`、`ai_accuracy_snapshots`，以及 `platform_settings` 中的 AI 鍵值。

---

## 5. 安全與 RBAC（摘要）

| 議題 | 規則 |
|---|---|
| 頁面存取 | `getCurrentUser()` + `hasPermission(role, code)` |
| Maker ≠ Checker | 當 `ai.maker_checker_required=true` 時，提案者不可核准自己的變更單 |
| AI Admin 變更 | 僅能經 `/api/ai-admin` 且具備 propose／approve 權限 |
| 稽核 | 提案、裁決、回饋、訓練排隊皆 `writeAudit` |

AI Admin 權限矩陣詳見 **§8.3**。

---

## 6. 整合點

| 系統 | 原型模式 | 說明 |
|---|---|---|
| Monitor 2.0 | 鏡像表 + 同步動作 | 指標／警報／工單 |
| Lark | 頻道登錄 + 模擬 Webhook | 依嚴重度路由 |
| LP／Bridge／錢包 | 僅建議動作 | 真實適配前需人工關卡 |
| 模型訓練 | 排隊執行 + 種子指標 | 原型無 GPU 叢集 |

---

## 7. 管理介面地圖

| URL | 模組 |
|---|---|
| `/admin` | 首頁 |
| `/admin/dashboard` | 每日績效 |
| `/admin/risk-log` | 風險日誌分析 |
| `/admin/detectors` | 偵測器 |
| `/admin/alerts` | 即時警報 |
| `/admin/ai-analyses` | AI RCA 執行期 |
| **`/admin/ai-admin`** | **AI Admin 管理（本 TSD §8）** |
| `/admin/interventions` | 人工關卡 |
| `/admin/spine` | Spine 日誌 |
| `/admin/rag` | RAG 語料（執行期檢視） |
| `/admin/skills` | Skill／風險情境劇本 |
| `/admin/docs/tsd` | 本 TSD（英文／繁中） |
| `/admin/monitor-2`、`/admin/lark`、`/admin/escalation`… | 平台營運 |

---

## 8. AI Admin 管理頁 — 完整規格

### 8.1 目的
`/admin/ai-admin` 為 **AI 控制平面**。操作人員用它來：
1. 監看 AI 健康 KPI 與準確率歷史
2. 提案變更 AI 參數、Skills、RAG 文件
3. 在 **Maker/Checker 雙人管控** 下核准／駁回變更
4. 排隊訓練／重新校正工作
5. 標註 RCA 品質回饋（CORRECT／INCORRECT／PARTIAL）

此頁是**治理**，不是即時 RCA 工作台（`/admin/ai-analyses`），也不是介入櫃檯（`/admin/interventions`）。

### 8.2 路由與元件

| 項目 | 規格 |
|---|---|
| 頁面路由 | `GET /admin/ai-admin` → `platform/src/app/admin/ai-admin/page.tsx` |
| UI 元件 | `AiAdminConsole`（`platform/src/components/AiAdminConsole.tsx`）客戶端主控台 |
| API | `GET/POST /api/ai-admin` → `platform/src/app/api/ai-admin/route.ts` |
| 領域邏輯 | `platform/src/lib/ai/admin.ts` |
| Schema | `platform/src/lib/ai/admin-schema.ts`（`ensureAiAdminSchema`） |
| 種子資料 | `seedAiAdminIfEmpty`（參數、訓練、準確率快照、示範變更單） |

### 8.3 存取控制

#### 8.3.1 頁面檢視（符合任一即可）
- `ai.admin`
- `skills.manage`
- `rag.manage`
- `ai.read`

未授權使用者重導向 `/admin`。

#### 8.3.2 Maker（提案）— 符合任一即可
- `ai.propose`
- `skills.manage`
- `rag.manage`
- `settings.manage`

#### 8.3.3 Checker（核准／駁回）— 符合任一即可
- `ai.approve`
- `skills.approve`
- `rag.approve`

#### 8.3.4 角色對照（原型）

| 角色 | 檢視 AI Admin | Maker | Checker | 說明 |
|---|---|---|---|---|
| `AI_ENGINEER` | 是 | 是 | 否 | 提案 Skills／RAG／參數／訓練 |
| `RISK_OWNER` | 是 | 是* | 是 | 主要 Checker；亦可提案 |
| `RISK_ANALYST` | 是 | 是 | 否 | 提案 + 回饋操作 |
| `SUPER_ADMIN` | 是 | 是 | 是 | 完整權限；啟用雙人制時仍不可自核 |
| `OPS_LEAD`／`SYSTEM_ADMIN` | 依權限 | 依 ROLE_DEFS | 依 ROLE_DEFS | 見 `db.ts` 之 `ROLE_DEFS` |
| `VIEWER` | 否（除非另授） | 否 | 否 | 其他頁唯讀 |

\* Risk Owner 同時具備提案與核准；仍不可核准自己的變更單。

#### 8.3.5 Maker ≠ Checker 規則
當 `platform_settings.ai.maker_checker_required != "false"`：
- 若 `proposed_by === decided_by`，`decideChangeRequest` 拋錯
- UI 僅應對非提案者之 Checker 顯示核准／駁回

### 8.4 資料模型

#### 8.4.1 `ai_change_requests`
| 欄位 | 型別 | 說明 |
|---|---|---|
| `id` | INTEGER PK | |
| `request_id` | TEXT UNIQUE | 如 `CR-A1B2C3D4` |
| `entity_type` | TEXT | `PARAM` \| `SKILL` \| `RAG` \| `TRAINING` |
| `action` | TEXT | `UPDATE` \| `CREATE` \| `DISABLE` \| `RETIRE` 等 |
| `title`、`summary` | TEXT | 人讀說明 |
| `payload_json` | TEXT | 變更後／建立內容 |
| `before_json` | TEXT NULL | 變更前狀態（diff） |
| `status` | TEXT | `PENDING` \| `APPROVED` \| `REJECTED` |
| `proposed_by`／`proposed_at` | FK／時間 | Maker |
| `decided_by`／`decided_at`／`decision_note` | FK／時間／TEXT | Checker |

#### 8.4.2 `ai_training_runs`
追蹤排隊／執行中／完成之重新校正：`run_id`、`model_name`、`dataset_label`、指標（`accuracy`、`precision_score`、`recall_score`、`f1_score`）、`samples`、`status`、時間戳、`created_by`。

#### 8.4.3 `ai_feedback`
每筆分析標籤：`CORRECT` \| `INCORRECT` \| `PARTIAL`，可附註記、`rated_by`。

#### 8.4.4 `ai_accuracy_snapshots`
每日彙總：Skill 匹配率、人工同意率、回饋正確率、分析總數、介入核准／駁回數。Overview 重新整理時會 upsert 當日 live 快照。

#### 8.4.5 受治理參數（`platform_settings` 鍵）
| 鍵 | 用途 | 預設（種子） |
|---|---|---|
| `ai.rca_enabled` | RCA 總開關 | `true` |
| `ai.auto_on_alarm` | 警報時自動觸發 RCA | `true` |
| `ai.skill_certainty_only` | 僅在確定匹配時自動執行 Skill | `true` |
| `ai.min_confidence` | 自動完成最低信心度 | `0.55` |
| `ai.rag_top_k` | RAG Top-K | `6` |
| `ai.second_opinion_severity` | 觸發第二意見 AI 的嚴重度 | `BREACH` |
| `ai.maker_checker_required` | 強制雙人管控 | `true` |
| `detectors.auto_raise_alarms` | 偵測器是否產生 Monitor 警報 | `true` |

僅 `ai.*` 或 `detectors.auto_raise_alarms` 可經 AI Admin PARAM 變更套用。

### 8.5 UI 規格（分頁）

| 分頁 ID | 標籤 | 功能 |
|---|---|---|
| `overview` | Overview | KPI：分析總數、Skill 匹配%、平均信心、需人工、待介入、人工同意%、回饋正確%、待決 CR；近期分析與回饋 |
| `params` | Parameters | AI 設定草稿；**Propose** 建立 PARAM CR（不立即生效） |
| `changes` | Maker / Checker | CR 清單（PENDING 優先）。Checker 核准／駁回並填註記；顯示 Maker、before/after；分頁顯示待決數 |
| `skills` | Skills | Skill 清單；表單**提案建立** Skill；核准後才套用；可連至 `/admin/skills` 情境板 |
| `rag` | RAG | 文件清單（摘要）；表單提案建立；核准後套用並重建 FTS |
| `training` | Training | 訓練執行清單與指標；表單排隊訓練（建立 TRAINING CR） |
| `history` | History & accuracy | 準確率快照表（14 日） |

頁首徽章顯示目前 `role_code`、**Maker** 與／或 **Checker** 能力。

### 8.6 API 規格

#### 8.6.1 `GET /api/ai-admin`
查詢參數：
- `tab` = `overview`（預設）\| `params` \| `changes` \| `training` \| `skills` \| `rag`
- `status`（可選，篩選變更單）

驗證：§8.3.1 檢視權限。  
預設回應含 `{ overview, params, changes, training, skills, rag, roles }`。

#### 8.6.2 `POST /api/ai-admin`
JSON `action`：

| `action` | 權限 | 效果 |
|---|---|---|
| `propose` | Maker | 通用 CR 寫入 |
| `propose_param` | Maker | PARAM UPDATE CR |
| `propose_skill` | `skills.manage` 或 `ai.propose` | SKILL CR |
| `propose_rag` | `rag.manage` 或 `ai.propose` | RAG CR |
| `decide` | Checker | `APPROVED` 套用；`REJECTED` 結案；強制 Maker≠Checker |
| `queue_training` | Maker | TRAINING CREATE CR |
| `feedback` | `ai.operate` 或 `ai.admin` | 寫入 `ai_feedback` |

錯誤：`{ error: string }`，HTTP 400／403。

### 8.7 核准後套用語意

| entity_type | action | 行為 |
|---|---|---|
| `PARAM` | `UPDATE` | 更新 `platform_settings.value` |
| `SKILL` | `CREATE` | 插入 ACTIVE `ai_skills` |
| `SKILL` | `UPDATE` | 更新欄位 |
| `SKILL` | `DISABLE` | `status='DISABLED'` |
| `RAG` | `CREATE` | 插入文件 + `reindexRagFts` |
| `RAG` | `UPDATE` | 內容／狀態更新 + 重建索引 |
| `RAG` | `RETIRE` | `status='RETIRED'` + 重建索引 |
| `TRAINING` | `CREATE` | 插入 QUEUED `ai_training_runs` |

### 8.8 稽核事件
| 事件 | 時機 |
|---|---|
| `AI_CHANGE_PROPOSED` | Maker 提交 CR |
| `AI_CHANGE_APPROVED`／`AI_CHANGE_REJECTED` | Checker 裁決 |
| `AI_FEEDBACK` | 提交回饋標籤 |

### 8.9 非功能需求
| NFR | 規格 |
|---|---|
| 延遲 | SSR + 客戶端分頁；原型突變 API p95 < 500ms |
| 耐久性 | SQLite WAL；稽核保留 |
| 安全 | 啟用雙人制時 PARAM／SKILL／RAG 不可直接套用 |
| 分離 | 執行期介入仍在 `/admin/interventions` |
| 可觀測性 | Overview KPI + 準確率快照 |

### 8.10 驗收標準
1. AI Engineer 可開啟 AI Admin 並提案 Skill；CR 為 PENDING。
2. 同一 AI Engineer **不可**核准該 CR（Maker/Checker 錯誤）。
3. Risk Owner 可核准；Skill 變 ACTIVE 並出現於 `/admin/skills`。
4. 參數提案在 APPROVED 前不改即時值。
5. 訓練排隊先建 CR，核准後建立 TRAINING run。
6. Overview 顯示待決 CR 數與準確率歷史。
7. 回饋標籤持久化並影響回饋正確率。

### 8.11 序列 — 提案 Skill（成功路徑）

```
AI Engineer（Maker）              API / admin.ts                 Risk Owner（Checker）
       │ propose_skill                  │                                │
       ├───────────────────────────────►│ 插入 PENDING CR                │
       │◄──────── request_id ───────────┤                                │
       │                                │◄──── decide APPROVED ──────────┤
       │                                │ applyChange SKILL/CREATE       │
       │                                │ 稽核 AI_CHANGE_APPROVED        │
       │                                ├──────── ok + applied ─────────►│
```

### 8.12 相關頁面
| 頁面 | 關係 |
|---|---|
| `/admin/skills` | 核准後之劇本／情境板 |
| `/admin/rag` | 語料瀏覽；受治理變更應走 AI Admin CR |
| `/admin/ai-analyses` | 消費此處治理之 Skills／RAG／參數 |
| `/admin/interventions` | **執行期**動作關卡（非設定 CR） |
| `/admin/roles` | 定義 §8.3 權限 |

### 8.13 後續強化（尚未必做）
- `before_json` vs `payload_json` Diff UI
- CRITICAL 參數變更強制雙重核准
- PENDING CR 通知 Lark `oc_ai_detection_lab`
- 匯出 CR 包供合規

---

## 9. Skills 與風險情境（摘要）

Skills 儲存完整 `scenario_json`：指標、門檻與理由、故障區域、升級路徑、BU 矯正、歷史案件。  
`risk_scenario_chains` 連結多指標時間線。見 `/admin/skills` 與 `risk-scenarios-catalog.ts`。

---

## 10. 部署（原型）

```bash
cd platform
npm install
npm run dev   # http://localhost:3000
```

SQLite：`platform/data/vantage_risk.db`。  
重置：`npm run db:reset` 後重啟。

---

## 11. 文件控制

| 版次 | 日期 | 說明 |
|---|---|---|
| 1.0 | 2026-10-01 | 初版骨架 |
| 1.1 | 2026-10-01 | **新增完整 §8 AI Admin 管理頁規格** |

**對應文件：** [English TSD](./TSD.md)
