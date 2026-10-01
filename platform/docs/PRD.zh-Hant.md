# CRMP 產品需求文件（PRD）

**文件編號：** CRMP-PRD-001 · **狀態：** 原型 · **產品：** CFD + Crypto

## 1. 問題
Vantage Markets 需要集中式風險管理平面，將 Monitor 2.0 警報轉為可解釋 AI 根因分析、人工閘道干預與即時通訊操作，且 AI 不得觸及僅限人類之控制項。

## 2. 目標
1. 偵測 → 分析 → 挑戰 → 升級 → 干預 → 稽核 串成單一脊柱。
2. 已知技能確定時自動執行；否則走 RAG + 人工覆核。
3. BREACH/CRITICAL 必須執行獨立第二 AI 挑戰。
4. AI Admin 設定變更採 Maker/Checker。
5. 每 5 分鐘推送可能影響 LP 報價之市場情報。

## 3. 非目標（原型）
- 正式 Lark webhook（以稽核/outbox 模擬）。
- 真實 LLM 計費（以啟發式引擎代替）。
- 完整 MT4/MT5/LP 寫入適配（僅管理後台深連結）。

## 4. 角色
| 角色 | 需求 |
|---|---|
| 風險負責人 | UAT、接受/拒絕 AI、升級、核准不可逆控制 |
| 風險分析師 | 分流警報、於 messenger 挑戰 AI、補充脈絡 |
| 營運主管 | Maker 確認後執行停牌／擴點／暫停跟單 |
| AI 工程師 | Skills、RAG、偵測器、第二意見門檻 |
| 系統管理員 | 使用者、角色、AI 存取黑名單、設定 |

## 5. 功能需求
| ID | 需求 | 優先級 |
|---|---|---|
| FR-01 | 同步 Monitor 2.0 指標並產生警報 | P0 |
| FR-02 | Skill 匹配 RCA 與步驟執行紀錄 | P0 |
| FR-03 | RAG RCA 與外部宏觀證據 | P0 |
| FR-04 | ≥ BREACH 第二 AI 挑戰者 | P0 |
| FR-05 | Demo Messenger（證據／聊天／升級／關閉） | P0 |
| FR-06 | 建議控制項雙重確認 → 管理後台 | P0 |
| FR-07 | AI Admin Maker ≠ Checker | P0 |
| FR-08 | AI 存取黑名單 | P0 |
| FR-09 | 市場情報 5 分鐘掃描 | P1 |
| FR-10 | 風險日誌分析 | P1 |
| FR-11 | 雙語文件（英／繁中） | P1 |
| FR-12 | 響應式管理介面 | P1 |

## 6. 驗收摘要
- 模擬 COPY BREACH 產生 Skill RCA + 第二 AI 改進建議。
- 僅 WARN 的 EQ 路徑不觸發挑戰者。
- Messenger 升級沿預設路徑；關閉／排除更新警報狀態。
- 確認「封鎖帳戶」產生管理編號，必要時待 Checker。
- AI Admin 變更需不同 Checker 核准。
EOF

