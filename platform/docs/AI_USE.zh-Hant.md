# CRMP AI 使用手冊

**文件編號：** CRMP-AIU-001 · **對象：** 風險管理台 **與** CS／TR 操作人員  
**語言：** [English](/admin/docs/ai-use?lang=en) · 繁體中文（本頁）  
**文件與平台負責人：** demo platform owner（`haixiang.yan@hytechc.com`）

這是本台的 AI 識字手冊。它不取代[使用手冊](/admin/docs/user-guide)（每一頁怎麼用）或 [PRD](/admin/docs/prd)（我們在做什麼）。當你需要知道 **AI 是什麼、在這裡怎麼用、哪裡會錯、怎麼抓出來** 時讀本頁。

**CRMP Plus（升級管理後台）：** [https://hxyan2020.github.io/PRD/crmp-plus/admin/docs/ai-use/](https://hxyan2020.github.io/PRD/crmp-plus/admin/docs/ai-use/) — 左側 **文件 → AI 使用手冊**。  
**原 CRMP 管理後台**凍結於 [https://hxyan2020.github.io/PRD/crmp-admin/admin/](https://hxyan2020.github.io/PRD/crmp-admin/admin/)，**沒有 CS／TR**；請在 CRMP Plus 打開本手冊。

---

## 1. 給誰讀

| 你是… | 你用 AI 來… | 從這裡開始 |
|---|---|---|
| 風險負責人／風險分析 | 讀根因包、雙 AI 挑戰者、結案或排除 | [即時警報與追蹤](/admin/alerts) 再 [示範 Messenger](/admin/messenger) |
| 營運主管 | 提出暫停／封鎖／停跟單 — 絕不讓 AI 按送出 | [人工干預](/admin/interventions) |
| AI 工程師 | 技能、RAG、挑戰者設定、在 AI 管理當 Maker | [AI 管理](/admin/ai-admin)、[AI 技能](/admin/skills) |
| 客服主管／客服專員 | 蓋技能、自動追問直到回覆，再分類／嚴重度／草稿 | [CS／TR 台](/admin/cs-desk) |
| 成交主管／成交員 | 還原成交對 LP；不值班 C1 | [CS／TR 台](/admin/cs-desk) TR 篩選 |
| GitHub Pages 上任何人 | 劃選文字 → 青色火花聊天（唯讀詞彙） | 任一管理頁 |

兩個故事、同一張台。風險警報走 Monitor → AI → 即時通訊 → 人工關卡。客戶問題走 C1／表單／信箱 → CS／TR 台 → 技能＋等待迴圈 → TR 或風控。**CS 不啟動交易管制。TR 不值班 C1。AI 不能自己核准自己。**

---

## 2. 一頁看懂 AI

本台的 **人工智慧** 是依看過的模式起草說明或下一步的軟體。它**不是**同事、不是監管、也不是帳簿上的開關。

三件事實：

1. **AI 提案。人類拍板。** 結案、排除、送出控制、結案客戶單、POC 放行，都是人的動作。  
2. **今日「AI」多半是啟發式**（技能匹配＋RAG 檢索）。線上大型語言模型（LLM）仍在[路線圖 RM-03](/admin/docs/roadmap)。非人類步驟可能顯示 `EXECUTED_MOCK` — 那是示範標籤，不是圍堵。  
3. **流暢不等於真實。** 自信的段落仍可能是幻覺。一定要看到引用的技能、RAG 葉或證據列。

```mermaid
graph TD
  Human[人類做決定] --> Prompt[提示加脈絡]
  Prompt --> Model[LLM 或啟發式]
  Model --> Out[草稿答案]
  Out --> Check{可安全送出?}
  Check -->|否| Hold[扣住再試]
  Check -->|是| Act[顯示在台面]
```

---

## 3. 本台今天怎麼用 AI

```mermaid
graph TD
  Mon[Monitor 2.0 警報] --> Match{技能匹配?}
  Match -->|是| Skill[跑 SKILL.md]
  Match -->|否| Rag[RAG 檢索]
  Skill --> Rca[主根因]
  Rag --> Rca
  Rca --> Sev{BREACH 或 CRITICAL?}
  Sev -->|是| Chal[第二 AI 挑戰者]
  Sev -->|否| Msg[Messenger 包]
  Chal --> Msg
  Client[C1 表單 信件] --> Cs[CS TR 台]
  Cs --> Stamp[蓋 SKILL-CS 或 TR]
  Stamp --> Wait{不清楚或需核身?}
  Wait -->|是| Mail[自動信後 WAITING]
  Wait -->|否| Score[分類加嚴重度]
  Mail --> Score
  Score --> Gate{直回或 POC?}
  Gate -->|FAQ 直回| Reply[AI_REPLIED]
  Gate -->|敏感| Poc[POC_REVIEW]
```

| 線 | AI 做什麼 | AI 絕不可做 |
|---|---|---|
| **風控** | 匹配劇本、檢索 RAG、寫根因、在 BREACH／CRITICAL 跑第二意見、建議控制 | 暫停商品、關閉 LP、砍槓桿、停跟單、暫停出金、改 RAG、核准自己的變更 |
| **CS／TR** | 蓋 `SKILL-CS-*`／`SKILL-TR-*`、起草一封追問信、資料齊全後分類＋嚴重度＋客戶草稿 | 跳過核身、WAITING 時結案、直寄核身／投訴／成交／CRITICAL、啟動帳簿控制 |
| **劃選聊天** | 解釋劃選的 CRMP 詞 | 核准干預或改設定 |

相關畫面：[AI 技能](/admin/skills) · [知識樹](/admin/knowledge-tree) · [RAG](/admin/rag) · [AI 管理](/admin/ai-admin) · [AI 存取安全](/admin/security/ai-access)。

---

## 4. LLM 是什麼（白話）

**大型語言模型（LLM）** 是統計「下一個詞元」的機器。你給它 **提示詞**（問題＋規則＋檢索到的事實）。它預測下一個 **詞元**（字的碎片），再下一個，直到停下。除非我們用工具（技能劇本、RAG 文件、Monitor 證據）**接地**，它不會去查「真相」。

| 概念 | 在本台的日常意思 |
|---|---|
| 訓練 | 模型在我們打開 CRMP 之前已看過大量文字。偵測器觸發時我們不會重訓。 |
| 推論 | 一次線上呼叫：提示進去、詞元出來。成本與延遲在這裡（RM-03／OI-16）。 |
| 脈絡視窗 | 一次能塞進多少提示＋歷史。太長 → 模型忘掉開頭。 |
| Temperature | 越高越多樣，也越容易發明。台面設定保持保守。 |
| 工具呼叫 | 模型請平台跑技能、檢索 RAG 或讀警報 — 再依結果書寫。規劃於 RM-03。 |
| 接地 | 答案必須引用技能代碼、RAG 葉或證據 id。沒有根據的散文只是草稿，不是事實。 |

**本原型不呼叫線上 LLM。** `POST /api/ai` 分析是匹配技能或檢索 RAG。種子包看起來已完整，方便 UAT 走畫面。正式 LLM＋模型切換＋評測架是 **RM-03**；挑戰者用**獨立供應商或子代理驗證**是 **RM-04**。在那之前，把每一句流暢的話當成 **啟發式草稿**。

```mermaid
sequenceDiagram
  participant You as 你
  participant Desk as 台面
  participant Model as 模型
  participant Tools as 工具
  You ->> Desk: 打開警報或 CS 單
  Desk ->> Model: 提示加檢索事實
  Model ->> Tools: 技能或 RAG 查詢
  Tools -->> Model: 證據列
  Model -->> Desk: 根因或客戶回覆草稿
  Desk -->> You: 帶引用的包
```

---

## 5. 基本詞彙（代理、技能、MCP 等）

先讀這張表。下面的圖說明詞怎麼串起來。

| 詞 | 在這裡的意思 | 你在哪裡看到 |
|---|---|---|
| **模型** | 起草文字的引擎（今日啟發式；RM-03 才是 LLM） | AI 管理一線／二線卡片 |
| **提示詞** | 指令＋案件事實＋檢索文件 | 隱藏；你看到的是**輸出**包 |
| **詞元（token）** | 模型花費的字碎片。越多越貴、越慢 | 原型不計費 |
| **脈絡／脈絡視窗** | 一次呼叫裡的全部：系統規則、歷史、RAG 片段 | 脈絡太少 → 空泛答案 |
| **LLM** | 大型語言模型 — 下一個詞元產生器 | 路線圖 RM-03，尚未上線 |
| **技能** | 有版本的 **SKILL.md 劇本**：何時觸發、步驟、升級綁定 | [AI 技能](/admin/skills) — 進入打開整頁 |
| **RAG** | 檢索增強生成：先搜知識庫再寫 | [RAG 知識庫](/admin/rag)；AI **不能**寫入 — `propose_rag` |
| **知識樹** | 領域 → 技能 → RAG 葉的地圖（含 `CS_SERVICE`／`TRADING_EXEC`） | [知識樹](/admin/knowledge-tree) |
| **代理（agent）** | 會**規劃步驟並呼叫工具**的軟體（不是聊天泡泡）。CRMP 代理會：讀警報、選技能、檢索 RAG、起草根因、停給人類。今日「代理」是腳本管線，不是自主員工。 | 即時警報與追蹤上的管線 |
| **MCP** | **模型上下文協定** — AI 客戶端用標準方式使用伺服器上的**工具、檔案、提示**（例如「列出技能」「檢索 RAG 葉」）。可想成模型的 USB。本原型尚未接線；相關正式項是 RM-03 工具呼叫。 | 路線圖／本手冊 |
| **工具／函式呼叫** | 模型可請求的具名動作（`matchSkill`、`retrieveRag`、`get_client_exposure`，絕不是 `halt_symbol` 或原始 SQL） | AI 存取安全黑名單 |
| **具名函式** | 預先核准的動作，例如 `get_client_exposure()`。名稱固定、參數有型別、回傳有範圍 — 不是自由 SQL。 | 技能／RM-03 工具呼叫 |
| **閘道（Gateway）** | 每個函式前面的權限檢查（角色、台面、客戶範圍）。拒絕 → 扣住，不打資料庫。 | AI 存取安全＋API |
| **幻覺** | 流暢但沒有證據支撐的文字 | 沒有技能／RAG／證據引用的包 |
| **挑戰者／第二 AI** | 對 BREACH／CRITICAL 的獨立第二意見。今日是庫內第二套啟發式（`crmp-challenger-v0`）。獨立供應商＝RM-04。 | 即時警報與追蹤詳情 |
| **Maker／Checker** | 必須是**兩個人**。Maker 提案（AI 管理變更或控制）。Checker 核准。同一人不能自核。 | [AI 管理](/admin/ai-admin)、[人工干預](/admin/interventions) |
| **信心分數** | 包上的分數。高分 ≠ 真實。當**排序提示**，不是綠燈。 | 分析詳情 |
| **EXECUTED_MOCK** | 示範標籤：該步**沒有**打到券商。絕不可當成現場控制。 | 技能執行紀錄、干預 |
| **人工關卡／黑名單** | AI 絕不可碰的頁、功能、欄位（暫停、僅平倉、RAG 寫入、改角色…） | [AI 存取安全](/admin/security/ai-access) |

```mermaid
graph LR
  Prompt[提示詞] --> Agent[代理]
  Agent --> Skill[技能劇本]
  Agent --> Rag[RAG 檢索]
  Agent --> Mcp[MCP 工具]
  Skill --> Draft[草稿包]
  Rag --> Draft
  Mcp --> Draft
  Draft --> Human[人工關卡]
```

**技能、代理、MCP，一口氣。** **技能**是劇本。**代理**是可能跑一本或多本技能的工作者。**MCP** 是讓工作者安全呼叫平台工具的插頭。誰都不能在不可逆工作上跳過人工關卡。工具只走**具名函式**與**閘道**，絕不用原始 SQL 打正式資料庫。

---

## 6. AI 怎麼問資料庫

當 AI 需要帳簿上的數字 — 客戶曝險、未結單、一筆成交 — 它**不可**自己寫 SQL 打正式庫。

**不是這條：** `LLM → SQL → Production DB`  
**是這條：** `LLM → get_client_exposure() → Gateway 檢查 permission → API → DB`

模型只**點名一個函式**。**閘道**檢查這個呼叫者、在這張台、能不能用這些參數跑該函式。通過之後才由 **API** 碰 **DB**。LLM 不持有資料庫密碼，也不自己拼 `SELECT`／`UPDATE`／`DELETE`。

**禁止路徑**（不可上線）：

```mermaid
graph LR
  LlmBad[LLM] --> Sql[SQL]
  Sql --> Prod[Production DB]
```

流暢的模型可以發明一個 dump 全部客戶的 join，或把清理寫成 `DELETE`。沒有權限檢查，也無法稽核「原本要呼叫哪個函式」。

**必走路徑：**

```mermaid
graph LR
  Llm[LLM] --> Fn["get_client_exposure()"]
  Fn --> Gw[Gateway permission]
  Gw --> Api[API]
  Api --> Db[DB]
```

```mermaid
sequenceDiagram
  participant LLM
  participant Fn as get_client_exposure
  participant Gw as Gateway
  participant API
  participant DB
  LLM ->> Fn: 具名函式
  Fn ->> Gw: 檢查權限
  Gw -->> Fn: 允許或拒絕
  Fn ->> API: 有範圍的請求
  API ->> DB: 讀列
  DB -->> API: 結果
  API -->> Fn: 曝險事實
  Fn -->> LLM: 接地資料
```

| 零件 | 是什麼 | 為什麼要有 |
|---|---|---|
| **具名函式** | 預先核准的動作，例如 `get_client_exposure()`。名稱固定、參數有型別、回傳有範圍。 | 模型走不到別張表。 |
| **閘道** | 任何 API 呼叫前的權限檢查（角色、台面、客戶範圍）。拒絕 → 扣住，不打資料庫。 | 與 [AI 存取安全](/admin/security/ai-access) 同一思路。 |
| **API** | 唯一持有資料庫憑證的程序。跑函式已經定義好的查詢。 | 人審函式，不審每一句生成的 SQL。 |
| **DB** | 正式資料。只經 API 讀。寫入仍走人工關卡。 | 圍堵。 |

**本台今天：** `POST /api/ai` 分析與 CS 進件呼叫的是**具名**伺服器函式，不是自由 SQL 提示。線上 LLM 工具呼叫（RM-03）必須維持同一條路 — 更大的模型不是打開資料庫的許可。

**習慣：** 若包、日誌或聊天出現原始 SQL、連線字串或表名，而不是像 `get_client_exposure()` 這樣的函式，**扣住**。請 AI 工程師把需求放進允許清單，做成具名函式。

---

## 7. 怎麼用 AI — 風險管理

每個未結 BREACH／CRITICAL 都走這條。

1. 打開[即時警報與追蹤](/admin/alerts)。展開卡片（或 `/admin/ai-analyses/[id]`）。  
2. 讀 **摘要、證據、技能代碼**。若沒有技能也沒有 RAG 引用，當成猜測。  
3. BREACH／CRITICAL 找到 **第二 AI 挑戰者**。`AGREE` 不是通行證。`PARTIAL` 或 `DISAGREE` → **不要**送出不可逆控制。  
4. 在[示範 Messenger](/admin/messenger) 或 [Lark 整合](/admin/lark) 卡片：**出示證據**，不同意就用聊天，再確認／升級／排除／結案。Lark 按鈕呼叫同一套 CRMP API。  
5. 控制送到[人工干預](/admin/interventions)。Maker ≠ Checker。分清 `EXECUTED_MOCK` 與未來現場匯流排（RM-02／FR-19）。  
6. 結案後包落到[風險日誌分析](/admin/risk-log) — 不是 CS／TR 日誌。

```mermaid
flowchart TD
  Open[打開即時警報] --> Read[讀證據與技能]
  Read --> Dual{BREACH 或 CRITICAL?}
  Dual -->|是| Chal[讀挑戰者結論]
  Dual -->|WARN| Msg[Messenger]
  Chal --> Msg
  Msg --> Act{結案 排除 或控制?}
  Act -->|結案| Log[風險日誌]
  Act -->|排除| Audit[稽核加脊柱]
  Act -->|控制| Gate[Maker 再 Checker]
  Gate --> Admin[送到管理端]
```

**風控每日習慣：** 不要為了清佇列而把 DISAGREE 包結案；不要跳過第二 AI 面板；不要把每日績效（`/admin/dashboard`）當成 CS／TR 儀表板。

---

## 8. 怎麼用 AI — CS／TR

每張新的 `CSR-XXXX` 都走這條。

1. 打開 [CS／TR 台](/admin/cs-desk)。先收件匣，再點卡片。看 **技能晶片**（`SKILL-CS-CLARIFY`、`ID-VERIFY`、`ACCOUNT-FAQ`、`SKILL-TR-EXECUTION`、`SKILL-CS-ESCALATE-RISK`）。  
2. 若不清楚或需要核身：AI 寄 **一封**自動信，案件進入 `WAITING`（`AWAITING_CLIENT`／`ID_VERIFY`）。WAITING 時 **禁止結案**。上限來自 `cs.followup_cap`（預設 3 封），其後由客服主管本人處理。  
3. 客戶用 `CSR-XXXX`／`In-Reply-To`／同一 `channel_ref` 回覆會**延續**原案 — 不可再開第二張。  
4. 資料齊全後：AI **分類、標 LOW｜MEDIUM｜HIGH｜CRITICAL、起草方案**。FAQ／低敏感可直寄（`AI_REPLIED`）。核身、投訴、成交、CRITICAL 交 **具名 POC** 補細節（`POC_REVIEW`）。  
5. 成交投訴 → **指派至 TR**（重蓋 `SKILL-TR-EXECUTION`）。帳簿風險 → **升級至風控**（`SKILL-CS-ESCALATE-RISK`）進入 Messenger／Lark 卡片。  
6. 量在 [CS／TR 儀表板](/admin/cs-dashboard)；歷史在 [CS／TR 日誌](/admin/cs-log)。那**不是**每日績效或風險日誌。

```mermaid
flowchart TD
  In[收件匣 CSR 單] --> Chip[看技能晶片]
  Chip --> Need{不清楚或需核身?}
  Need -->|是| Wait[一封信後 WAITING]
  Need -->|否| Facts[資料已齊]
  Wait --> Reply[客戶回覆]
  Reply --> Facts
  Facts --> Score[分類加嚴重度]
  Score --> Sens{敏感?}
  Sens -->|否 FAQ| Auto[AI_REPLIED]
  Sens -->|是| Poc[POC 補細節]
  Score --> Book{帳簿風險?}
  Book -->|是| Risk[升級至風控]
  Book -->|成交| Tr[指派至 TR]
```

**CS／TR 每日習慣：** WAITING 時不可結案；不可只憑口頭「是我」跳過核身；不可直寄敏感草稿；CS 不啟動交易管制。

---

## 9. 雙 AI 挑戰者（不同意長什麼樣）

嚴重警報會跑 **第二次、獨立** 的判斷。今日是本庫另一套啟發式 — 我們不假裝那是另一家供應商（那是 RM-04）。

```mermaid
sequenceDiagram
  participant Mon as Monitor
  participant AI1 as 主 AI
  participant AI2 as 挑戰者
  participant RO as 風險負責人
  participant Ops as 營運 Checker
  Mon ->> AI1: 警報包
  AI1 ->> AI2: BREACH 或 CRITICAL
  AI2 -->> RO: AGREE PARTIAL 或 DISAGREE
  RO ->> RO: 兩份結論都讀
  RO ->> Ops: 兩邊站住才控制
  Ops -->> RO: Checker 註記
```

| 結論 | 你要做什麼 |
|---|---|
| `AGREE` | 仍要讀證據。可以結案或進入 Maker／Checker。 |
| `PARTIAL` | 點出爭議事實。未解前不要送出控制。 |
| `DISAGREE` | 升級或附理由排除。**不要**為清佇列而結案。 |
| 挑戰者跳過（WARN） | 預期行為。除非政策改，不要在 WARN 強跑第二 AI。 |

---

## 10. AI 發展（原型 vs 正式）

把這張地圖放在腦子裡，才不會把示範當成上線。

| 現在（原型） | 下一步（正式） | 單號 |
|---|---|---|
| 技能匹配＋RAG 檢索；無線上 LLM | LLM 主根因＋**模型切換**（Claude／GPT／Gemini；自架僅在日後確認）＋工具呼叫＋評測架 | RM-03／FR-20／OI-04 |
| 第二 AI＝庫內啟發式 | 挑戰者＝**獨立模型／供應商** *或* 主模型的**子代理驗證**（BREACH／CRITICAL 仍強制 AGREE／PARTIAL／DISAGREE） | RM-04 |
| Token／美元未計量 | 超過門檻發**軟性** token／花費告警 — **呼叫 AI＋基礎設施；不停 RCA 服務** | RM-14／OI-16 |
| `EXECUTED_MOCK`／`EXECUTED_AFTER_APPROVAL` 無券商呼叫 | 真實控制匯流排加 dry-run | RM-02／FR-19 |
| Lark **模擬**互動卡片在 `/admin/lark` | **重用公司 Lark AI 機器人**（他 BU 已建好互動卡片＋回呼）＋必要時 JIRA | RM-01／FR-17／OI-08 |
| 劃選聊天＝接地詞彙 | 同一介面，可選線上模型，仍要引用 | RM-03 |
| CS 分類／嚴重度＝啟發式 | 同一閘道（`cs.auto_reply_max_severity`、`cs.sensitive_categories`）擋在真模型前面 | FR-46 保留；換模型是 RM-03 |
| 無公司 AI→內部庫閘道／單一 MCP | 維持**具名函式＋RBAC**（公司確認：尚無中央 AI→DB 閘道） | 本手冊 §6 |
| MCP 未接線 | 之後可選 MCP 風格伺服器（技能／RAG／警報）— 仍受同一黑名單 | 本手冊＋RM-03 |
| LLM 不可產出 SQL | 具名函式（`get_client_exposure`）＋閘道權限＋API → DB | 本手冊 §6 |

```mermaid
graph LR
  Today[啟發式加 RAG] --> Llm[RM-03 線上 LLM 切換]
  Llm --> Eval[評測架]
  Today --> Chal[RM-04 供應商或子代理]
  Today --> Soft[RM-14 軟性 token 告警]
  Today --> Bus[RM-02 控制匯流排]
  Today --> Lark[RM-01 公司 Lark 機器人]
```

**不做的風險：** 若不交付 RM-03／04，台面聽起來「AI 已齊」其實仍是腳本。把 `EXECUTED_MOCK` 當成圍堵的人，有一天會真的送出暫停。這就是為什麼要有本手冊。

### 10.1 公司 AI 平台（AI 部門 POC — 背景）

風險控制與公司 AI 部門會談紀要。這些塑造**正式**設計；在 RM-03 前原型仍走啟發式。

| 公司事實 | CRMP／風控怎麼用 |
|---|---|
| 公司支援 **Claude、GPT、Gemini** 等 | AI 管理 `ai.line1.model`／切換（RM-03）。原型可只顯示供應商標籤設定。 |
| **自架**模型評估中 — **未確認** | 路線圖僅作可選路徑；不以自架擋 Claude／GPT／Gemini。 |
| 支援 **LLM 切換** | 操作員／風控組長經 AI 管理（Maker）＋風控 Checker 選定主模型 — 不可靜默翻轉。 |
| 追蹤 token；**超限告警；服務不停** | 軟上限（`ai.token.alert_*`）。不可因花費自動殺 RCA。 |
| **風控 BU** 可開發代理（RAG、技能、工具、工作流）；AI BU 必要時協助 | 風控擁有 CRMP 代理內容；AI BU 是可選協助。 |
| 有多種 **RAG 範本**可選 | 先選公司範本，再綁葉（知識樹／技能與 KT 範本）。 |
| RAG 可指向 **Lark／Lark wiki** | 資料來源＋RAG `source_ref`（攝取屬正式工作）。 |
| 各 BU 的 **提示、RAG、日誌隔離** | 風控獨立工作區／代理實例；不與他 BU 共用提示庫。 |
| 風控可在 **風控組長**同意下自行上線提示／技能（**不必** AI BU 核准） | AI 管理 Checker＝風控組長／風險負責人。**不**拿掉 CRMP 停商品／LP／出金人工閘道或 AI 寫入黑名單。 |
| **尚無**公司 AI 閘道／單一 MCP 控內部庫 — 今日用 **RBAC** | 維持具名函式路徑（§6）。不要假裝已有 MCP→DB。 |
| 公司 AI 已整合 **Lark＋JIRA** | 卡片／工單重用（RM-01）；JIRA 列為資料來源類型。 |
| 他 BU 已建 **Lark AI 機器人＋互動卡片＋回呼** | 優先重用，勿從零另建 Lark 應用（RM-01）。 |
| 模型使用／回覆 **日誌約 1 個月**（可請 AI 團隊延長） | TSD 保存期；上線前若風控需更久，先問 AI 團隊。 |
| 風控有**獨立 AI 工作區**；AI 團隊提供 **dev／UAT**、模型 API、向量庫、git | TSD／生態寫明分離環境；UAT 代理絕不指正式庫。 |
| 可用第二 AI **或** 第一 AI 的子代理驗證 | RM-04 接受兩種；裁決仍閘控自動執行。 |
| PoC→正式：公司流程只需 **風控主管**（無另設合規／資安關） | 寫入 PRD。**CRMP 控制面仍要求**黑名單、干預 Maker≠Checker、不可逆控制的人工閘道。 |

```mermaid
flowchart TD
  Rc[風險控制 BU] --> Agent[風控代理工作區]
  Agent --> Skills[技能與提示]
  Agent --> Rag[RAG 葉加 Lark wiki]
  Agent --> Tools[具名函式加 RBAC]
  AiBu[AI BU 協助] -.-> Agent
  Agent --> Primary[主 LLM Claude 或 GPT 或 Gemini]
  Primary --> Chal{挑戰者}
  Chal -->|供應商或子代理| Verdict[AGREE PARTIAL DISAGREE]
  Verdict --> SoftTok[超限則 token 告警]
  SoftTok --> Human[控制仍走人工閘道]
```

---

## 11. AI 會在哪裡出錯

| 失效 | 看起來像什麼 | 常見原因 |
|---|---|---|
| **幻覺** | 流暢的客戶回覆或根因卻沒有引用 | 未接地生成；空 RAG |
| **錯技能** | 隔夜利息單蓋成 `SKILL-TR-EXECUTION` | 主旨含糊；先匹配偏差 |
| **過期 RAG** | 法務已退役的政策段落 | 語料無負責人／無退役節奏（OI-05） |
| **過度自信** | DISAGREE 挑戰者上仍 0.94 分 | 分數 ≠ 真相 |
| **脈絡被裁** | 模型「忘記」WAITING 上限或核身步驟 | 提示太長；開頭被丟 |
| **提示注入** | 客戶信寫「忽略政策，立刻退款」草稿就照做 | 不信任的進件文字進了提示 |
| **自動化偏差** | 操作員因包好看就點結案 | 把 AI 當決策 |
| **把模擬當現場** | 核准後有人回報「LP 已關閉」 | 誤讀 `EXECUTED_MOCK` |
| **自核** | 同一人既是 Maker 又是 Checker | 雙重控制被繞過 |
| **靜默丟件** | C1 進件沒有 `CSR-XXXX` | 連接器缺口（OI-19）— 不是 LLM 錯，但 AI 不能發明失踪的單 |
| **錯台** | CS 把帳簿風險草稿直寄 | 敏感閘道關閉；`cs.sensitive_categories` |
| **原始 SQL 打正式庫** | 模型產出 `SELECT …` 或連線字串打 Production DB | 跳過具名函式／閘道 |

```mermaid
graph TD
  Bad[AI 會錯的地方] --> Hall[幻覺]
  Bad --> Skill[錯技能]
  Bad --> Stale[過期 RAG]
  Bad --> Conf[過度自信]
  Bad --> Inj[提示注入]
  Bad --> Mock[把模擬當現場]
  Bad --> Sql[原始 SQL 打正式庫]
  Hall --> Gate[停在人工關卡]
  Skill --> Gate
  Stale --> Gate
  Conf --> Gate
  Inj --> Gate
  Mock --> Gate
  Sql --> Gate
```

---

## 12. 偵測、改正、預防

```mermaid
flowchart TD
  Spot[偵測] --> Fix[改正]
  Fix --> Stop[預防下次]
  Spot --> Cite{有引用?}
  Cite -->|無| Hold[先扣住包]
  Cite -->|有| Dual{挑戰者沒問題?}
  Dual -->|否| Hold
  Dual -->|是| Human[仍由人類決定]
  Hold --> Fix
  Fix --> Rag[propose_rag 或改技能]
  Fix --> Note[Checker 註記加稽核]
  Stop --> Blk[守住黑名單]
  Stop --> Two[Maker 不等於 Checker]
  Stop --> Cap[CS 追問上限]
```

### 偵測

- 沒有技能代碼、沒有 RAG 葉、沒有證據 id → **扣住**。  
- 挑戰者 `PARTIAL`／`DISAGREE` → **扣住**。  
- CS 草稿想寄核身／投訴／成交／CRITICAL → 確認是 `POC_REVIEW`，不是 `AI_REPLIED`。  
- WAITING 單卻能按結案 → **缺陷**；不要繞過。  
- 控制紀錄寫 `EXECUTED_MOCK` → 大聲說「沒打到券商」。  
- 客戶文字叫模型忽略政策 → 當注入；不要貼進自由提示。  
- 草稿或日誌出現原始 SQL、連線字串或表名，而不是像 `get_client_exposure()` 這樣的函式 → **扣住**。路徑必須是 LLM → 具名函式 → 閘道檢查權限 → API → DB。

### 改正

- 風控：附理由排除、或升級、或用聊天補事實再重產（如何改進 FR-35）。絕不要為了藏而結案。  
- CS：保持 WAITING；改由人追問；指派至 TR 或升級至風控；POC **先補段落再寄**。  
- 知識：AI 工程師提 `propose_rag` 或技能變更；**另一人**在 AI 管理核准。  
- 稽核：稽核日誌與首頁脊柱約一分鐘內同一組 id。

### 預防

- 每個版本核對 [AI 存取安全](/admin/security/ai-access) 黑名單仍是「僅限人類」（UAT-15）。  
- AI 管理與指定控制的 Maker ≠ Checker（UAT-13）。  
- `cs.followup_cap`、`cs.auto_reply_max_severity`、`cs.sensitive_categories` 留在平台設定分組。  
- RAG 寫入維持人工閘道（只准 `propose_rag`）。  
- 正式 LLM（RM-03）必須保留 **評測架** 與同一套閘道 — 更大的模型不是更鬆的政策。  
- 工具呼叫只走具名函式＋閘道。絕不給模型一條打正式庫的 SQL 提示。  
- 新人入職讀本頁。凍結的原 CRMP 管理後台使用者走上方 Plus 網址。

---

## 13. 每日清單（兩張台都要）

**風控（開市）**

1. 即時警報與追蹤：數 OPEN BREACH／CRITICAL。  
2. 每個嚴重包：技能或 RAG 引用 **以及** 挑戰者面板。  
3. Messenger／Lark：確認你負責的；DISAGREE 絕不結案。  
4. 干預：待決控制的 Checker 不是 Maker。  
5. 發版後看一眼 AI 存取安全黑名單。

**CS／TR（每次交接）**

1. 收件匣：每張新卡有技能晶片。  
2. [CS／TR 儀表板](/admin/cs-dashboard) 的 WAITING 清單 — 沒有人對那些結案。  
3. 已達上限 3 的列交客服主管本人。  
4. 資料齊全後：直回 vs POC 符合敏感度；CRITICAL／帳簿風險已經升級至風控離開 CS 台。  
5. 日誌：信件、回覆、分析、POC 都有 `CS_*` 列 — 若故事只在聊天裡，就還沒做完。

**兩邊都要**

- 看不懂就劃選 → 火花聊天（唯讀）。  
- 另一種語言比較清楚就切 **EN／繁中**。  
- 不確定就 **扣住**。沉默比錯寄安全。

---

## 14. 絕不可讓 AI 做這些

| 禁止 | 為什麼 | 擋在哪裡 |
|---|---|---|
| 暫停／僅平倉／關 LP／砍槓桿／停跟單／暫停出金 | 帳簿衝擊 | AI 存取安全＋人工干預 |
| 直接改 RAG 語料 | 知識被下毒 | 只准 `propose_rag` Maker／Checker |
| 核准自己的 AI 管理變更 | 雙重控制崩潰 | FR-07；UAT-13 |
| 對 WAITING 的 CS 單結案 | 客戶停在迴圈中間 | 台面規則；UAT-47 |
| 因客戶說「是我」而跳過核身 | 帳戶被接管 | `SKILL-CS-ID-VERIFY`／`ESC-CS-KYC` |
| 直寄核身、投訴、成交、CRITICAL | 法務／帳簿風險 | `cs.sensitive_categories`＋POC |
| 把 `EXECUTED_MOCK` 當現場成交 | 假圍堵 | 本手冊＋RM-02 |
| 對正式庫寫原始 SQL | 無範圍讀取、靜默寫入、憑證外洩 | 具名函式＋閘道；本手冊 §6 |
| 改角色、設定殺手開關或密鑰 | 爆炸半徑 | 黑名單＋設定分組 |

若某個按鈕會做以上任一項，而你登入的是 AI 形貌的服務帳號，**停下**並打開 AI 存取安全。

---

## 15. 相關頁面

| 頁 | 讀完本手冊為什麼還要開 |
|---|---|
| [使用手冊](/admin/docs/user-guide) | 左側每一頁怎麼用，含 §9.3 CS／TR 與 §9.4 Lark 卡片 |
| [PRD](/admin/docs/prd) | FR-04 挑戰者、FR-07 Maker／Checker、FR-08 黑名單、FR-46 直回 vs POC、FR-48 本手冊 |
| [TSD](/admin/docs/tsd) | §8 AI 管理、§9 挑戰者、`EXECUTED_MOCK`、CS 分析 |
| [UAT 清單](/admin/docs/uat) | UAT-03 技能、UAT-04／05／19 挑戰者、UAT-06 RAG、UAT-13 雙重控制、UAT-15 黑名單、UAT-17 本文件、UAT-47 等待迴圈、UAT-53 直回 vs POC |
| [改進路線圖](/admin/docs/roadmap) | RM-01 公司 Lark 機器人、RM-03 LLM 切換、RM-04 供應商／子代理挑戰者、RM-14 軟性 token 告警、RM-02 控制匯流排 |
| [開放議題](/admin/docs/open-issues) | OI-04 LLM、OI-05 語料、OI-16 可觀測性／token 保存、OI-15 文件日常 |
| [AI 存取安全](/admin/security/ai-access) | 僅限人類清單 |
| [技能與 KT 範本](/admin/docs/templates) | 可複製骨架；風控擁有上線；RAG 範本選擇備註 |
| [網址目錄](/admin/docs/urls) | 每一條路徑，含本頁 |

---

## 16. 文件控制

| 版次 | 日期 | 說明 |
|---|---|---|
| 1.0 | 2026-10-07 | 首份風控＋CS／TR 的 AI 識字手冊；英／繁中；mermaid 圖；FR-48 |
| 1.1 | 2026-10-07 | §6 具名函式＋閘道資料庫路徑（`get_client_exposure` → 權限 → API → DB）；不是 LLM → SQL → Production DB |
| 1.2 | 2026-10-08 | §10＋§10.1 公司 AI POC：多 LLM 切換、軟性 token 告警、風控擁有／隔離、重用 Lark 機器人、挑戰者供應商或子代理、無中央 AI→DB 閘道 |

**負責人：** demo platform owner（`haixiang.yan@hytechc.com`）
