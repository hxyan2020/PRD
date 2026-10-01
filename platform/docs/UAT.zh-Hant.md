# CRMP UAT 驗收包 — 風險負責人

**文件編號：** CRMP-UAT-001 · **互動示範頁：** [/admin/docs/uat](/admin/docs/uat)

請**依序**執行。Critical 前置未通過前勿跳號。於稽核備註記錄 PASS／FAIL／WAIVE 與證據。

## 時間模型
- `T+0` = 風險負責人開始 UAT。
- 各案有建議起始偏移與工期。
- 全包建議時窗約 **4 小時**（20 案）。

## 摘要矩陣

| 序 | ID | 起始 | 工期 | 嚴重度 | 負責 BU | 依賴 | 標題 |
|---|---|---|---|---|---|---|---|
| 01 | UAT-01 | 0m | 10m | Critical | System + 風險負責人 | 種子使用者 | 登入與 RBAC 閘道 |
| 02 | UAT-02 | 10m | 10m | Critical | Risk | UAT-01 | Monitor 2.0 指標登錄 |
| 03 | UAT-03 | 20m | 15m | Critical | AI + Risk | UAT-02 | COPY breach 技能 RCA |
| 04 | UAT-04 | 35m | 15m | Critical | AI + 風險負責人 | UAT-03 | 獨立第二 AI 挑戰者 |
| 05 | UAT-05 | 50m | 10m | High | AI | 門檻=BREACH | WARN 不觸發挑戰者 |
| 06 | UAT-06 | 60m | 15m | High | AI + Risk | RAG | RAG 推理路徑 |
| 07 | UAT-07 | 75m | 10m | High | Risk | Messenger | Messenger — 顯示證據 |
| 08 | UAT-08 | 85m | 10m | High | 分析師 + 負責人 | UAT-07 | Messenger — 聊天挑戰 |
| 09 | UAT-09 | 95m | 10m | High | Risk | 升級路徑 | Messenger — 升級 |
| 10 | UAT-10 | 105m | 8m | Medium | Risk | 可拋棄 WARN | Messenger — 排除誤報 |
| 11 | UAT-11 | 115m | 10m | Critical | 風險負責人 | 雙 AI 已覆核 | Messenger — 結案接受 AI |
| 12 | UAT-12 | 125m | 15m | Critical | Ops + 風險負責人 | Interventions | 建議控制＋雙重確認＋Checker |
| 13 | UAT-13 | 140m | 20m | Critical | AI + 風險負責人 | 兩名不同使用者 | AI Admin Maker ≠ Checker |
| 14 | UAT-14 | 160m | 15m | Medium | Risk + AI | 情報啟用 | 市場情報 5 分鐘掃描 |
| 15 | UAT-15 | 175m | 10m | High | System + Security | 黑名單 | AI 存取黑名單覆核 |
| 16 | UAT-16 | 185m | 15m | High | System | UAT-07–12 | 稽核與脊柱對應 |
| 17 | UAT-17 | 200m | 10m | Low | All | 文件已發布 | 雙語文件切換 |
| 18 | UAT-18 | 210m | 15m | Medium | All | 響應式殼層 | 行動裝置煙測 |
| 19 | UAT-19 | 225m | 10m | Medium | 風險負責人 | UAT-04 | 雙 AI 覆蓋閘道 |
| 20 | UAT-20 | 235m | 15m | Critical | 風險負責人 | UAT-01–19 | 退出簽核 |

逐步步驟、通過標準與應留證據見互動頁（展開各案）。

## 退出標準
1. 所有 **Critical** 必須 Pass。  
2. **High** 豁免不超過 2 項，且須書面風險接受。  
3. UAT 視窗內 BREACH／CRITICAL **100%** 附第二 AI（UAT-19）。  
4. 完成 **UAT-20** 簽核（ACCEPT／ACCEPT WITH WAIVERS／REJECT）。
