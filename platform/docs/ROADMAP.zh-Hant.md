# 平台改進路線圖

**文件編號：** CRMP-RM-001 · 現行原型之後的優先待辦

| ID | 項目 | 工期 | 人力 | 依賴 | 嚴重度 | 備註 |
|---|---|---|---|---|---|---|
| RM-01 | 正式 Lark 互動卡片 | L | 2 FE + 1 BE | Lark 應用核准 | Critical | 取代 demo 傳輸 |
| RM-02 | Monitor 2.0 webhook + 工單回寫 | L | 2 BE | API 契約 | Critical | 關閉／排除閉環 |
| RM-03 | LLM 主 RCA＋工具呼叫＋評測 | XL | 1 ML + 2 BE | Prompt／預算 | High | 挑戰者保持獨立 |
| RM-04 | 挑戰模型多樣化 | M | 1 ML | RM-03 | High | 降低相關失敗 |
| RM-05 | SSO + SCIM | M | 1 BE + 資安 | IdP | Critical | 淘汰示範密碼 |
| RM-06 | Postgres＋多實例 | M | 1 SRE + 1 BE | 基礎建設 | High | 離開 SQLite |
| RM-07 | 行動導覽抽屜＋觸控 messenger | S | 1 FE | Design tokens | Medium | 網頁＋行動優化 |
| RM-08 | 管理介面完整 i18n | M | 1 FE + PM | 字串目錄 | Medium | 文件已雙語 |
| RM-09 | 干預適配（停牌／槓桿／封鎖）含 dry-run | L | 2 BE + Ops | 交易控制匯流排 | Critical | 強制 Checker |
| RM-10 | 證據遮罩與保存作業 | M | 1 BE + GRC | 法遵政策 | High | 摘要中的 PII |
| RM-11 | 影子模式儀表板 | S | 1 FE + 1 BE | Spine 指標 | Medium | 寫入前階段 |
| RM-12 | CI 自動化 UAT 煙測 | S | 1 QA + 1 BE | Seed DB | Medium | PR 閘道 |
| RM-13 | 多品牌租戶 | XL | 架構 + 2 BE | 組織模型 | Medium | 後期 |
| RM-14 | AI 路徑成本／延遲 SLO | S | SRE | 可觀測性 | Medium | 搭配 RM-03 |
| RM-15 | 市場情報來源評分 | M | 1 DS + 1 BE | 供應源 | Medium | 降噪 |

**工期鍵：** S 小切片 · M 多日模組 · L 跨團隊 · XL 計畫級

## 建議順序
1. RM-05、RM-06、RM-02（基礎）
2. RM-01、RM-07、RM-11（操作體驗）
3. RM-09＋緊急開關（寫路徑）
4. RM-03＋RM-04＋RM-14（模型品質）
5. RM-08、RM-10、RM-12、RM-15（強化與擴充）
EOF