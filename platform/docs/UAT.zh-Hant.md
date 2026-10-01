# CRMP UAT 驗收包 — 風險負責人

**文件編號：** CRMP-UAT-001 · 請依序執行，並於稽核備註記錄通過／失敗。

| 序 | 案例 | 步驟 | 負責 BU | 依賴 | 嚴重度 | 通過門檻 |
|---|---|---|---|---|---|---|
| 01 | 登入與 RBAC | 以風險負責人登入；Viewer 無法開 AI Admin | System | 種子使用者 | Critical | 角色閘道正確 |
| 02 | Monitor 同步 | 開啟 Monitor 2.0；確認 EQ/MRG/COPY 指標 | Risk | DB 種子 | Critical | 各域至少 1 指標 |
| 03 | Skill RCA | AI Analyses → 模擬 COPY breach | AI + Risk | Skills | Critical | Mode=SKILL_MATCH |
| 04 | 第二 AI | 開啟 BREACH/CRITICAL 詳情 | AI + Risk | Challenger | Critical | 有 verdict 與 ≥1 HIGH 改進 |
| 05 | WARN 不挑戰 | 模擬 EQ WARN | AI | 門檻=BREACH | High | 無 challenge |
| 06 | RAG 路徑 | 無技能匹配路徑 | AI | RAG | High | Mode=RAG_REASONING |
| 07 | Messenger 證據 | Show evidence | Risk | 已連結分析 | High | 聊天出現證據 |
| 08 | 聊天挑戰 | 輸入不同意 | Risk | 開啟執行緒 | High | needs_human |
| 09 | 升級 | Escalate 兩次 | Risk | 升級路徑 | High | 步驟前進 |
| 10 | 排除誤報 | Dismiss | Risk | 開啟執行緒 | Medium | 狀態 DISMISSED |
| 11 | 結案接受 AI | Close | Risk Owner | 雙 AI 包 | Critical | CLOSED 且證據保留 |
| 12 | 建議控制確認 | 封鎖帳戶 → 雙重確認 | Ops + Risk | Interventions | Critical | 產生 admin ref |
| 13 | AI Admin M/C | Maker 提案；不同 Checker 核准 | AI + Risk Owner | 權限 | Critical | 禁止自我核准 |
| 14 | 市場情報 | 執行掃描 | Risk | 設定啟用 | Medium | 有紀錄 |
| 15 | AI 黑名單 | 檢查 AI Access Security | System | 黑名單 | High | 列出僅限人類項 |
| 16 | 稽核與脊柱 | 核對 Audit + Spine | System | 前序案例 | High | 1 分鐘內有對應事件 |
| 17 | 雙語文件 | 切換繁中 | All | Docs | Low | 兩語皆可渲染 |
| 18 | 行動裝置煙測 | 寬度 390px | All | CSS | Medium | 主要 CTA 可用 |

## 退出標準
- 所有 **Critical** 通過。
- **High** 未通過不超過 2 項且經風險負責人書面接受。
- UAT 期間 BREACH/CRITICAL 樣本 100% 附第二 AI。
EOF