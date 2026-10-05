# CRMP 開放議題

**文件編號：** CRMP-OI-001 · **互動看板：** [/admin/docs/open-issues](/admin/docs/open-issues) · **進度雙生：** [/admin/docs/progress](/admin/docs/progress)

CRMP 管理後台／控制面計畫的**暫定**開放議題清單。前提明示：

1. **Monitor 2.0** 仍在新增指標 — CRMP 同步，不擁有登錄表。  
2. **CRMP** 生產範圍仍處**初始設計**（原型台面已交付）。  
3. **技術細節**與**資源規劃**仍開放（見生態評估區間）。

狀態：**已規劃 · 已啟動 · 進行中 · 延期 · UAT · 上線 · 日常**。每一列含負責 BU 與依賴。ETA 暫定至 **2027 年底**。

互動清單資料源：`platform/src/lib/docs/open-issues.ts`。完整勾選明細見英文版 [OPEN_ISSUES.md](./OPEN_ISSUES.md)；管理後台看板提供篩選與勾選 UI。

| ID | 優先 | 領域 | BU | 狀態 | 暫定 ETA | 標題 |
|---|---|---|---|---|---|---|
| OI-01 | P0 | Monitor | Monitor | 進行中 | 2027-Q2 | Monitor 2.0 指標擴充 |
| OI-02 | P0 | Product | Product | 已啟動 | 2027-Q1 | CRMP 控制面 — 初始設計凍結 |
| OI-03 | P0 | System | System | 已規劃 | 2027-Q1 | 技術架構與資源規劃 |
| OI-04 | P1 | AI | AI | 進行中 | 2027-Q3 | 生產 LLM 根因＋獨立挑戰者 |
| OI-05 | P1 | AI | AI | 已啟動 | 2027-Q1 | 知識樹＋RAG 語料治理 |
| OI-06 | P0 | System | System | 已規劃 | 2027-Q2 | SSO／IdP＋SCIM |
| OI-07 | P0 | Ops | Ops | 已規劃 | 2027-Q4 | 真實控制適配 |
| OI-08 | P1 | Ops | Ops | 已規劃 | 2027-Q2 | 生產 Lark 互動卡片 |
| OI-09 | P1 | RO | Risk Owner | 已啟動 | 2026-Q4／2027-Q1 | 風險負責人 UAT 出口＋政策門檻 |
| OI-10 | P2 | Pricing | Pricing | 已規劃 | 2027-Q3 | LP／定價饋送契約 |
| OI-11 | P2 | Platform | System | 進行中 | 2026-Q4 | 管理後台 UX 打磨 |
| OI-12 | P1 | GRC | GRC | 已規劃 | 2027-Q4 | 證據保存、遮罩與稽核匯出（原型已分流 CRMP／Vantage Markets 管理日誌＋回滾） |
| OI-13 | P1 | Monitor | Monitor | 延期 | 2027-Q3 | Monitor 工單雙向回寫 |
| OI-14 | P2 | AI | AI | UAT | 2026-10／11 | 原型 AI 台面功能 — UAT（含可編輯角色、稽核平面分流） |
| OI-15 | P3 | Product | All | 日常 | 持續→2027-12 | 文件與網址目錄跟上後台 |

已交付（原型）：稽核 **CRMP 日誌**／**Vantage Markets 管理日誌**兩分頁＋`POST /api/audit/rollback`；可編輯角色（`/admin/roles` · `/api/roles`）；升級維度 × 係數與 ESC-DEFAULT；首頁脊柱階段計數（無脊柱日誌分頁）；BU 與團隊合併；左側**即時警報與追蹤**；偵測器併入 Monitor 2.0（`/admin/detectors` 轉址）；AI 分析列表轉址即時警報與追蹤。

| Ver | Date | Notes |
|---|---|---|
| 1.0 | 2026-10-05 | 初版開放議題包接入管理文件 |
| 1.1 | 2026-10-05 | 稽核平面分流＋回滾；可編輯角色；升級維度 |

**負責人：** demo platform owner（`haixiang.yan@hytechc.com`）
