# CRMP 使用手冊

**對象：** 風險負責人、分析師、營運、AI 工程師、系統管理員

## 1. 登入
1. 開啟 `/login`。
2. 使用種子帳號（例如 `risk.owner@vantagemarkets.com` / `risk123`）。
3. 進入 Admin Home。

## 2. 分流警報
1. 於 **Live Alerts** 或 **Monitor 2.0** 找到 OPEN 項目。
2. 於 **AI Analyses** 開啟對應 RCA。
3. 閱讀主要說明與證據庫。
4. 若嚴重度 ≥ BREACH，檢視 **第二 AI 挑戰者**。
5. 若挑戰結果為 `PARTIAL`/`DISAGREE`，不可逆控制前必須人工處理。

## 3. Demo Messenger 流程
1. 開啟 **Demo Messenger**（`/admin/messenger`）。
2. 選擇執行緒（由警報自動同步）。
3. 內嵌操作：
   - **Show evidence** — 拉入證據與挑戰摘要。
   - **Chatbot** — 挑戰報告或補充資訊。
   - **Escalate** — 沿升級路徑前進。
   - **Dismiss** — 誤報並關閉。
   - **Close** — 接受 AI 並結案。
4. 選擇建議控制項並 **雙重確認** → 產生管理後台編號；必要時待 Checker。

## 4. AI Admin
1. 開啟 **AI Admin**。
2. Maker 提出變更；不同 Checker 核准。
3. 禁止自我核准。

## 5. 市場情報
1. 開啟 **Market Intelligence**。
2. 手動掃描或等待 5 分鐘排程。
3. 檢視發現與 messenger outbox 卡片。

## 6. 安全
- 參閱 **AI Access Security** 了解僅限人類介面。
- 操作寫入 **Audit Log** 與 **Spine Log**。
EOF

