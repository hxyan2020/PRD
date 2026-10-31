# 指標與風險情境

供 **管理（Admin）**、**定價（Pricing）**、**交易／Dealing** 台面使用的完整目錄。

| 介面 | 路徑 |
|------|------|
| 互動看板（可依 BU 篩選） | `/admin/docs/indicators-scenarios` |
| 種子 SQL 瀏覽 | `/admin/docs/simulated-data` |
| Monitor 2.0 即時登錄 | `/admin/monitor-2` |
| 領域情境圖 | `/admin/risk-domains` |
| 技能劇本 | `/admin/skills` |

由即時 SQLite `monitor_indicators` 與領域／技能目錄產生（2026-10-31）。數量：**50** 項指標 · **37** 項領域情境 · **47** 項技能 · **40** 條連結時間鏈。

## 受眾對照

| 台面 | 負責 | 典型領域 | 本文用法 |
|------|------|----------|----------|
| **管理／風險負責人** | 政策、L2 核准、探索晉升、嚴重度權重 | 信用／客戶、模型與 AI、詐欺、基礎建設 | 下方完整指標與情境清單 |
| **定價** | 報價年齡、發布延遲、商品曝險、行情傳播 | 市場定價、商品設定 | 「定價視角」章節 |
| **交易／LP** | 拒絕率、對沖覆蓋、A-book 傾斜、週末金屬 | LP 與對沖、信用傳染伴隨 | 「交易視角」章節 |

## 標準外匯 CFD 用例 — INC-1028

| 欄位 | 值 |
|------|-----|
| 事故 | `INC-1028` |
| LP／商品 | LP-A · XAUUSD |
| 嚴重度 | P2 Medium |
| 台面 | Pricing Engine SG-02 |
| 鏈碼 | `CHAIN-PRICING-FEED-PROPAGATION` |
| 種子指標 | `M2-LP-022`、`M2-FEED-003`、`M2-XAU-247`、`M2-HEDGE-007` |

### 伴隨案例

| Id | 故事 | 指標 |
|----|------|------|
| LP-HEDGE-GAP | LP 拒絕風暴 → 對沖覆蓋缺口 | `M2-LP-022`、`M2-HEDGE-007` |
| XAU-WEEKEND | XAUUSD247 週末曝險累積 | `M2-XAU-247`、`M2-HEDGE-007`、`M2-LP-022` |
| STALE-FEED-LIQ | 陳舊行情 → 強平／信用傳染 | `M2-FEED-003`、`M2-MRG-014`、`M2-EQ-001` |

## 全部指標（50）

| 指標 ID | 名稱 | 領域 | 產品 | 負責 BU | 警告 | 違規 | 單位 | 外匯示範 |
|---------|------|------|------|---------|------|------|------|----------|
| `M2-ARB-026` | Latency Arb Toxicity Score | CREDIT_CLIENT | CFD | 交易 | 0.5 | 0.7 | score |  |
| `M2-COPY-009` | Top Signal Provider Copier Concentration | CREDIT_CLIENT | CFD | 交易 | 15 | 25 | % |  |
| `M2-COPY-CHURN` | Copy Follower Net Exit (1h) | CREDIT_CLIENT | CFD | 交易 | 12 | 25 | % |  |
| `M2-MRG-014` | Accounts >90% Margin Utilisation | CREDIT_CLIENT | CFD | 交易 | 50 | 100 | count | 是 |
| `M2-NBP-016` | Negative Balance Account Count | CREDIT_CLIENT | CFD | 交易 | 2 | 5 | accounts |  |
| `M2-STOP-018` | Stop-out Count (5m window) | CREDIT_CLIENT | CFD | 交易 | 20 | 40 | count/5m |  |
| `M2-CRYPTO-DEP` | Crypto Deposits (1h USD) | CRYPTO_EXCHANGE | Crypto | 管理 | 3000000 | 8000000 | USD |  |
| `M2-CRYPTO-INS` | Insurance Fund Daily Drawdown | CRYPTO_EXCHANGE | Crypto | 管理 | 4 | 8 | % |  |
| `M2-CRYPTO-LIQ` | Liquidation Engine Backlog | CRYPTO_EXCHANGE | Crypto | 管理 | 50 | 200 | orders |  |
| `M2-CRYPTO-OI` | Top Account OI Share (per contract) | CRYPTO_EXCHANGE | Crypto | 管理 | 20 | 35 | % |  |
| `M2-CRYPTO-ORACLE` | Mark Price Oracle Lag | CRYPTO_EXCHANGE | Crypto | 管理 | 1 | 2 | seconds |  |
| `M2-CRYPTO-WALLET` | Hot Wallet Float Ratio | CRYPTO_EXCHANGE | Crypto | 管理 | 15 | 25 | % |  |
| `M2-FUNDING-RATE` | Perp Funding Rate Abs (8h) | CRYPTO_EXCHANGE | Crypto | 管理 | 0.15 | 0.5 | % |  |
| `M2-PERP-BASIS` | Perp Mark–Index Basis | CRYPTO_EXCHANGE | Crypto | 管理 | 25 | 60 | bps |  |
| `M2-STABLE-EXP` | Stablecoin Depeg Exposure (USD) | CRYPTO_EXCHANGE | Crypto | 管理 | 500000 | 2000000 | USD |  |
| `M2-BONUS-013` | Bonus Converted to Cash (24h USD) | FRAUD_CONDUCT | CFD | 共用 | 75000 | 150000 | USD |  |
| `M2-CHARGEBACK` | Payment Chargebacks (24h) | FRAUD_CONDUCT | CFD | 共用 | 15 | 40 | count/24h |  |
| `M2-FRAUD-011` | Multi-account Cluster Score | FRAUD_CONDUCT | CFD | 共用 | 0.7 | 0.85 | score |  |
| `M2-IB-PAYOUT` | IB Rebate Anomaly Score | FRAUD_CONDUCT | CFD | 共用 | 0.6 | 0.8 | score |  |
| `M2-PAY-017` | Payment Fraud Model Score | FRAUD_CONDUCT | CFD | 共用 | 0.65 | 0.8 | score |  |
| `M2-WASH-020` | Wash/Collusion Detection Score | FRAUD_CONDUCT | CFD+Crypto | 共用 | 0.55 | 0.75 | score |  |
| `M2-ABOOK-008` | A-book Volume Ratio (session) | LP_HEDGE | CFD | 交易 | 40 | 30 | % |  |
| `M2-DISC-CUSUM-LP-REJECT-RATE` | LP Reject Rate (oneZero) CUSUM regime score | LP_HEDGE | CFD | 交易 | 1 | 1.5 | score |  |
| `M2-HEDGE-007` | Hedge Coverage Ratio | LP_HEDGE | CFD | 交易 | 85 | 70 | % | 是 |
| `M2-LP-022` | LP Reject Rate (oneZero) | LP_HEDGE | CFD | 交易 | 2 | 5 | % | 是 |
| `M2-CORR-004` | Corr Matrix Drift vs Baseline | MARKET_PRICING | CFD | 定價 | 0.2 | 0.35 | Δρ |  |
| `M2-EQ-001` | Company Equity Drawdown | MARKET_PRICING | CFD | 定價 | 3 | 5 | % | 是 |
| `M2-FEED-003` | Stale Quote Symbols | MARKET_PRICING | CFD | 定價 | 3 | 10 | symbols | 是 |
| `M2-MKT-INTEL` | Market Intelligence High-Impact Hits (5m) | MARKET_PRICING | CFD+Crypto | 定價 | 1 | 3 | hits/5m |  |
| `M2-NEWS-GROSS` | Gross Notional into Tier-1 News (USD) | MARKET_PRICING | CFD | 定價 | 50000000 | 120000000 | USD |  |
| `M2-SLIP-021` | Avg Client Slippage (majors, 15m) | MARKET_PRICING | CFD | 定價 | 2 | 3.5 | pips |  |
| `M2-VAR-002` | 1-day VaR Utilisation | MARKET_PRICING | CFD | 定價 | 85 | 95 | % |  |
| `M2-MODEL-006` | Detector Precision (7d rolling) | MODEL_AI | CFD+Crypto | 管理 | 80 | 70 | % |  |
| `M2-FUND-010` | Funding Exceptions (1h) | OPS_PROCESS | CFD | 管理 | 30 | 80 | count/h |  |
| `M2-RECON-BRK` | Reconciliation Breaks (open) | OPS_PROCESS | CFD+Crypto | 管理 | 5 | 20 | count |  |
| `M2-WD-015` | Withdrawal Volume (1h USD) | OPS_PROCESS | CFD+Crypto | 管理 | 2000000 | 5000000 | USD |  |
| `M2-GAP-012` | Estimated Gap Exposure (USD) | PRODUCT_CONFIG | CFD | 定價 | 1000000 | 2000000 | USD |  |
| `M2-LEV-019` | New Accounts at Max Leverage (24h) | PRODUCT_CONFIG | CFD | 定價 | 100 | 200 | accounts |  |
| `M2-SPREAD-005` | Spread vs Session Median Ratio | PRODUCT_CONFIG | CFD | 定價 | 2 | 3 | x |  |
| `M2-SWAP-027` | Symbols with Swap vs Benchmark Δ | PRODUCT_CONFIG | CFD | 定價 | 5 | 10 | symbols |  |
| `M2-XAU-247` | XAUUSD247 Net Exposure | PRODUCT_CONFIG | CFD | 定價 | 10000 | 15000 | lots | 是 |
| `M2-CAP-024` | Entity Capital Buffer Ratio | REG_CAPITAL | CFD+Crypto | 管理 | 20 | 15 | % |  |
| `M2-SEG-025` | Client Money Segregation Gap (USD) | REG_CAPITAL | CFD | 管理 | 50000 | 250000 | USD |  |
| `M2-COMPLAINT` | Client Complaint Velocity (24h) | REPUTATION_COMMS | CFD+Crypto | 管理 | 40 | 100 | count/24h |  |
| `M2-CROSS-BOOK` | Cross-book Contagion Score | SYSTEMIC_FIRM | CFD+Crypto | 管理 | 0.55 | 0.75 | score |  |
| `M2-API-023` | Trading API Error Rate (5m) | TECH_INFRA | CFD+Crypto | 共用 | 2 | 5 | % |  |
| `M2-BRIDGE-LAT` | Bridge Fill Latency p95 | TECH_INFRA | CFD | 共用 | 120 | 250 | ms |  |
| `M2-KILL-COUNT` | Active Symbol Kill-Switches | TECH_INFRA | CFD+Crypto | 共用 | 2 | 5 | symbols |  |
| `M2-MT-DISC` | Trading Platform Disconnect Rate | TECH_INFRA | CFD+Crypto | 共用 | 1 | 5 | % |  |
| `M2-VENDOR-OUT` | Critical Vendor Degraded Count | THIRD_PARTY_VENDOR | CFD+Crypto | 管理 | 1 | 3 | vendors |  |

### 定價視角（25）

定價負責、共用領域，或落在 INC-1028 外匯示範帳簿的指標。

| 指標 ID | 名稱 | 領域 | 產品 | 負責 BU | 警告 | 違規 | 單位 | 外匯示範 |
|---------|------|------|------|---------|------|------|------|----------|
| `M2-MRG-014` | Accounts >90% Margin Utilisation | CREDIT_CLIENT | CFD | 交易 | 50 | 100 | count | 是 |
| `M2-BONUS-013` | Bonus Converted to Cash (24h USD) | FRAUD_CONDUCT | CFD | 共用 | 75000 | 150000 | USD |  |
| `M2-CHARGEBACK` | Payment Chargebacks (24h) | FRAUD_CONDUCT | CFD | 共用 | 15 | 40 | count/24h |  |
| `M2-FRAUD-011` | Multi-account Cluster Score | FRAUD_CONDUCT | CFD | 共用 | 0.7 | 0.85 | score |  |
| `M2-IB-PAYOUT` | IB Rebate Anomaly Score | FRAUD_CONDUCT | CFD | 共用 | 0.6 | 0.8 | score |  |
| `M2-PAY-017` | Payment Fraud Model Score | FRAUD_CONDUCT | CFD | 共用 | 0.65 | 0.8 | score |  |
| `M2-WASH-020` | Wash/Collusion Detection Score | FRAUD_CONDUCT | CFD+Crypto | 共用 | 0.55 | 0.75 | score |  |
| `M2-HEDGE-007` | Hedge Coverage Ratio | LP_HEDGE | CFD | 交易 | 85 | 70 | % | 是 |
| `M2-LP-022` | LP Reject Rate (oneZero) | LP_HEDGE | CFD | 交易 | 2 | 5 | % | 是 |
| `M2-CORR-004` | Corr Matrix Drift vs Baseline | MARKET_PRICING | CFD | 定價 | 0.2 | 0.35 | Δρ |  |
| `M2-EQ-001` | Company Equity Drawdown | MARKET_PRICING | CFD | 定價 | 3 | 5 | % | 是 |
| `M2-FEED-003` | Stale Quote Symbols | MARKET_PRICING | CFD | 定價 | 3 | 10 | symbols | 是 |
| `M2-MKT-INTEL` | Market Intelligence High-Impact Hits (5m) | MARKET_PRICING | CFD+Crypto | 定價 | 1 | 3 | hits/5m |  |
| `M2-NEWS-GROSS` | Gross Notional into Tier-1 News (USD) | MARKET_PRICING | CFD | 定價 | 50000000 | 120000000 | USD |  |
| `M2-SLIP-021` | Avg Client Slippage (majors, 15m) | MARKET_PRICING | CFD | 定價 | 2 | 3.5 | pips |  |
| `M2-VAR-002` | 1-day VaR Utilisation | MARKET_PRICING | CFD | 定價 | 85 | 95 | % |  |
| `M2-GAP-012` | Estimated Gap Exposure (USD) | PRODUCT_CONFIG | CFD | 定價 | 1000000 | 2000000 | USD |  |
| `M2-LEV-019` | New Accounts at Max Leverage (24h) | PRODUCT_CONFIG | CFD | 定價 | 100 | 200 | accounts |  |
| `M2-SPREAD-005` | Spread vs Session Median Ratio | PRODUCT_CONFIG | CFD | 定價 | 2 | 3 | x |  |
| `M2-SWAP-027` | Symbols with Swap vs Benchmark Δ | PRODUCT_CONFIG | CFD | 定價 | 5 | 10 | symbols |  |
| `M2-XAU-247` | XAUUSD247 Net Exposure | PRODUCT_CONFIG | CFD | 定價 | 10000 | 15000 | lots | 是 |
| `M2-API-023` | Trading API Error Rate (5m) | TECH_INFRA | CFD+Crypto | 共用 | 2 | 5 | % |  |
| `M2-BRIDGE-LAT` | Bridge Fill Latency p95 | TECH_INFRA | CFD | 共用 | 120 | 250 | ms |  |
| `M2-KILL-COUNT` | Active Symbol Kill-Switches | TECH_INFRA | CFD+Crypto | 共用 | 2 | 5 | symbols |  |
| `M2-MT-DISC` | Trading Platform Disconnect Rate | TECH_INFRA | CFD+Crypto | 共用 | 1 | 5 | % |  |

### 交易視角（23）

交易／LP 負責、共用領域，或落在 INC-1028 外匯示範帳簿的指標。

| 指標 ID | 名稱 | 領域 | 產品 | 負責 BU | 警告 | 違規 | 單位 | 外匯示範 |
|---------|------|------|------|---------|------|------|------|----------|
| `M2-ARB-026` | Latency Arb Toxicity Score | CREDIT_CLIENT | CFD | 交易 | 0.5 | 0.7 | score |  |
| `M2-COPY-009` | Top Signal Provider Copier Concentration | CREDIT_CLIENT | CFD | 交易 | 15 | 25 | % |  |
| `M2-COPY-CHURN` | Copy Follower Net Exit (1h) | CREDIT_CLIENT | CFD | 交易 | 12 | 25 | % |  |
| `M2-MRG-014` | Accounts >90% Margin Utilisation | CREDIT_CLIENT | CFD | 交易 | 50 | 100 | count | 是 |
| `M2-NBP-016` | Negative Balance Account Count | CREDIT_CLIENT | CFD | 交易 | 2 | 5 | accounts |  |
| `M2-STOP-018` | Stop-out Count (5m window) | CREDIT_CLIENT | CFD | 交易 | 20 | 40 | count/5m |  |
| `M2-BONUS-013` | Bonus Converted to Cash (24h USD) | FRAUD_CONDUCT | CFD | 共用 | 75000 | 150000 | USD |  |
| `M2-CHARGEBACK` | Payment Chargebacks (24h) | FRAUD_CONDUCT | CFD | 共用 | 15 | 40 | count/24h |  |
| `M2-FRAUD-011` | Multi-account Cluster Score | FRAUD_CONDUCT | CFD | 共用 | 0.7 | 0.85 | score |  |
| `M2-IB-PAYOUT` | IB Rebate Anomaly Score | FRAUD_CONDUCT | CFD | 共用 | 0.6 | 0.8 | score |  |
| `M2-PAY-017` | Payment Fraud Model Score | FRAUD_CONDUCT | CFD | 共用 | 0.65 | 0.8 | score |  |
| `M2-WASH-020` | Wash/Collusion Detection Score | FRAUD_CONDUCT | CFD+Crypto | 共用 | 0.55 | 0.75 | score |  |
| `M2-ABOOK-008` | A-book Volume Ratio (session) | LP_HEDGE | CFD | 交易 | 40 | 30 | % |  |
| `M2-DISC-CUSUM-LP-REJECT-RATE` | LP Reject Rate (oneZero) CUSUM regime score | LP_HEDGE | CFD | 交易 | 1 | 1.5 | score |  |
| `M2-HEDGE-007` | Hedge Coverage Ratio | LP_HEDGE | CFD | 交易 | 85 | 70 | % | 是 |
| `M2-LP-022` | LP Reject Rate (oneZero) | LP_HEDGE | CFD | 交易 | 2 | 5 | % | 是 |
| `M2-EQ-001` | Company Equity Drawdown | MARKET_PRICING | CFD | 定價 | 3 | 5 | % | 是 |
| `M2-FEED-003` | Stale Quote Symbols | MARKET_PRICING | CFD | 定價 | 3 | 10 | symbols | 是 |
| `M2-XAU-247` | XAUUSD247 Net Exposure | PRODUCT_CONFIG | CFD | 定價 | 10000 | 15000 | lots | 是 |
| `M2-API-023` | Trading API Error Rate (5m) | TECH_INFRA | CFD+Crypto | 共用 | 2 | 5 | % |  |
| `M2-BRIDGE-LAT` | Bridge Fill Latency p95 | TECH_INFRA | CFD | 共用 | 120 | 250 | ms |  |
| `M2-KILL-COUNT` | Active Symbol Kill-Switches | TECH_INFRA | CFD+Crypto | 共用 | 2 | 5 | symbols |  |
| `M2-MT-DISC` | Trading Platform Disconnect Rate | TECH_INFRA | CFD+Crypto | 共用 | 1 | 5 | % |  |

## 領域情境（37）

| 代碼 | 名稱 | 領域 | 優先 | 產品 | 主要指標 | 受眾 |
|------|------|------|------|------|----------|------|
| `SCN-CROSS-BOOK-CONTAGION` | 跨帳簿傳染打到公司權益 | SYSTEMIC_FIRM | P0 | CFD + Crypto | `M2-CROSS-BOOK`, `M2-EQ-001`, `M2-VAR-002` | 管理、定價、交易 |
| `SCN-NEWS-WINDOW-GROSS` | 一級新聞窗口名義部位過載 | SYSTEMIC_FIRM | P0 | CFD | `M2-NEWS-GROSS`, `M2-EQ-001` | 管理、定價、交易 |
| `SCN-MARGIN-UTIL-SPIKE` | 保證金使用率暴衝（≥100 帳戶 >90%） | CREDIT_CLIENT | P0 | CFD | `M2-MRG-014` | 交易、管理 |
| `SCN-COPY-CONCENTRATION` | 跟單提供者集中度違規 | CREDIT_CLIENT | P1 | CFD | `M2-COPY-009` | 交易、管理 |
| `SCN-STOPOUT-VELOCITY` | 強平速度暴衝（5 分鐘視窗） | CREDIT_CLIENT | P1 | CFD | `M2-STOP-018` | 交易、管理 |
| `SCN-NEGATIVE-BALANCE` | 負餘額保護失守 | CREDIT_CLIENT | P1 | CFD | `M2-NBP-016` | 交易、管理 |
| `SCN-LATENCY-ARB` | 延遲套利／有毒流量 | CREDIT_CLIENT | P2 | CFD | `M2-ARB-026` | 交易、管理 |
| `SCN-COPY-CHURN` | 跟單跟隨者恐慌退出 | CREDIT_CLIENT | P2 | CFD | `M2-COPY-CHURN` | 交易、管理 |
| `SCN-EQUITY-DRAWDOWN` | 公司權益回撤 | MARKET_PRICING | P0 | CFD | `M2-EQ-001` | 定價、管理 |
| `SCN-STALE-FEED` | 過期或交叉報價饋送 | MARKET_PRICING | P1 | CFD | `M2-FEED-003` | 定價、管理 |
| `SCN-SLIPPAGE-SPIKE` | 主要商品客戶滑點暴衝 | MARKET_PRICING | P2 | CFD | `M2-SLIP-021` | 定價、管理 |
| `SCN-VAR-CORR` | VaR 使用率與相關性破裂 | MARKET_PRICING | P1 | CFD | `M2-VAR-002`, `M2-CORR-004` | 定價、管理 |
| `SCN-MARKET-INTEL` | 高影響市場情報命中 | MARKET_PRICING | P1 | CFD + Crypto | `M2-MKT-INTEL` | 定價、管理 |
| `SCN-LP-REJECT-STORM` | LP 拒單風暴（oneZero／prime） | LP_HEDGE | P0 | CFD | `M2-LP-022` | 交易、管理 |
| `SCN-HEDGE-COVERAGE` | 對沖覆蓋低於目標 | LP_HEDGE | P1 | CFD | `M2-HEDGE-007` | 交易、管理 |
| `SCN-ABOOK-RATIO` | A-book 成交占比崩落 | LP_HEDGE | P2 | CFD | `M2-ABOOK-008` | 交易、管理 |
| `SCN-HOT-WALLET` | 熱錢包浮額偏高 | CRYPTO_EXCHANGE | P1 | Crypto | `M2-CRYPTO-WALLET` | 管理、定價、交易 |
| `SCN-CRYPTO-LIQ` | 強平引擎積壓 | CRYPTO_EXCHANGE | P0 | Crypto | `M2-CRYPTO-LIQ` | 管理、定價、交易 |
| `SCN-ORACLE-BASIS` | 標記預言機延遲與永續基差失控 | CRYPTO_EXCHANGE | P1 | Crypto | `M2-CRYPTO-ORACLE`, `M2-PERP-BASIS` | 管理、定價、交易 |
| `SCN-FUNDING-STABLE` | 極端資金費與穩定幣脫鉤曝險 | CRYPTO_EXCHANGE | P1 | Crypto | `M2-FUNDING-RATE`, `M2-STABLE-EXP` | 管理、定價、交易 |
| `SCN-CRYPTO-OI-DEP` | 未平倉集中度與入金暴衝 | CRYPTO_EXCHANGE | P2 | Crypto | `M2-CRYPTO-OI`, `M2-CRYPTO-DEP` | 管理、定價、交易 |
| `SCN-CRYPTO-INSURANCE` | 保險基金單日回撤 | CRYPTO_EXCHANGE | P1 | Crypto | `M2-CRYPTO-INS` | 管理、定價、交易 |
| `SCN-MULTI-ACCOUNT` | 多帳戶詐欺叢集 | FRAUD_CONDUCT | P1 | CFD | `M2-FRAUD-011` | 管理、定價、交易 |
| `SCN-PAYMENT-CHARGEBACK` | 支付詐欺與退單暴增 | FRAUD_CONDUCT | P1 | CFD | `M2-PAY-017`, `M2-CHARGEBACK` | 管理、定價、交易 |
| `SCN-WASH-IB` | 對敲交易與 IB 返佣異常 | FRAUD_CONDUCT | P2 | CFD + Crypto | `M2-WASH-020`, `M2-IB-PAYOUT` | 管理、定價、交易 |
| `SCN-BONUS-BURN` | 獎金兌現濫用 | FRAUD_CONDUCT | P2 | CFD | `M2-BONUS-013` | 管理、定價、交易 |
| `SCN-XAU247` | XAUUSD247 淨曝險過載 | PRODUCT_CONFIG | P1 | CFD | `M2-XAU-247` | 定價、管理 |
| `SCN-GAP-SPREAD-LEV` | 跳空曝險、點差異常、最高槓桿開戶 | PRODUCT_CONFIG | P2 | CFD | `M2-GAP-012`, `M2-SPREAD-005`, `M2-LEV-019` | 定價、管理 |
| `SCN-SWAP-MISCONFIG` | 隔夜利息相對基準設定錯誤 | PRODUCT_CONFIG | P3 | CFD | `M2-SWAP-027` | 定價、管理 |
| `SCN-FUNDING-WD` | 資金異常與出金速度 | OPS_PROCESS | P1 | CFD + Crypto | `M2-FUND-010`, `M2-WD-015` | 管理、定價、交易 |
| `SCN-RECON-BREAKS` | 未結對帳差異 | OPS_PROCESS | P2 | CFD + Crypto | `M2-RECON-BRK` | 管理、定價、交易 |
| `SCN-BRIDGE-API` | 橋接延遲與交易 API 錯誤 | TECH_INFRA | P1 | CFD + Crypto | `M2-BRIDGE-LAT`, `M2-API-023` | 管理、定價、交易 |
| `SCN-PLATFORM-KILL` | 平台斷線與作用中熔斷 | TECH_INFRA | P0 | CFD + Crypto | `M2-MT-DISC`, `M2-KILL-COUNT` | 管理、定價、交易 |
| `SCN-CAPITAL-SEG` | 實體資本緩衝與客戶資金隔離 | REG_CAPITAL | P1 | CFD + Crypto | `M2-CAP-024`, `M2-SEG-025` | 管理、定價、交易 |
| `SCN-DETECTOR-DRIFT` | 偵測器精準度漂移／誤報 | MODEL_AI | P2 | Platform | `M2-MODEL-006` | 管理、定價、交易 |
| `SCN-VENDOR-DEGRADED` | 關鍵供應商降級或離線 | THIRD_PARTY_VENDOR | P3 | CFD + Crypto | `M2-VENDOR-OUT` | 管理、定價、交易 |
| `SCN-COMPLAINT-SPIKE` | 客戶投訴速度暴衝 | REPUTATION_COMMS | P3 | CFD + Crypto | `M2-COMPLAINT` | 管理、定價、交易 |

### 管理受眾（37）

| 代碼 | 名稱 | 領域 | 優先 | 產品 | 主要指標 | 受眾 |
|------|------|------|------|------|----------|------|
| `SCN-CROSS-BOOK-CONTAGION` | 跨帳簿傳染打到公司權益 | SYSTEMIC_FIRM | P0 | CFD + Crypto | `M2-CROSS-BOOK`, `M2-EQ-001`, `M2-VAR-002` | 管理、定價、交易 |
| `SCN-NEWS-WINDOW-GROSS` | 一級新聞窗口名義部位過載 | SYSTEMIC_FIRM | P0 | CFD | `M2-NEWS-GROSS`, `M2-EQ-001` | 管理、定價、交易 |
| `SCN-MARGIN-UTIL-SPIKE` | 保證金使用率暴衝（≥100 帳戶 >90%） | CREDIT_CLIENT | P0 | CFD | `M2-MRG-014` | 交易、管理 |
| `SCN-COPY-CONCENTRATION` | 跟單提供者集中度違規 | CREDIT_CLIENT | P1 | CFD | `M2-COPY-009` | 交易、管理 |
| `SCN-STOPOUT-VELOCITY` | 強平速度暴衝（5 分鐘視窗） | CREDIT_CLIENT | P1 | CFD | `M2-STOP-018` | 交易、管理 |
| `SCN-NEGATIVE-BALANCE` | 負餘額保護失守 | CREDIT_CLIENT | P1 | CFD | `M2-NBP-016` | 交易、管理 |
| `SCN-LATENCY-ARB` | 延遲套利／有毒流量 | CREDIT_CLIENT | P2 | CFD | `M2-ARB-026` | 交易、管理 |
| `SCN-COPY-CHURN` | 跟單跟隨者恐慌退出 | CREDIT_CLIENT | P2 | CFD | `M2-COPY-CHURN` | 交易、管理 |
| `SCN-EQUITY-DRAWDOWN` | 公司權益回撤 | MARKET_PRICING | P0 | CFD | `M2-EQ-001` | 定價、管理 |
| `SCN-STALE-FEED` | 過期或交叉報價饋送 | MARKET_PRICING | P1 | CFD | `M2-FEED-003` | 定價、管理 |
| `SCN-SLIPPAGE-SPIKE` | 主要商品客戶滑點暴衝 | MARKET_PRICING | P2 | CFD | `M2-SLIP-021` | 定價、管理 |
| `SCN-VAR-CORR` | VaR 使用率與相關性破裂 | MARKET_PRICING | P1 | CFD | `M2-VAR-002`, `M2-CORR-004` | 定價、管理 |
| `SCN-MARKET-INTEL` | 高影響市場情報命中 | MARKET_PRICING | P1 | CFD + Crypto | `M2-MKT-INTEL` | 定價、管理 |
| `SCN-LP-REJECT-STORM` | LP 拒單風暴（oneZero／prime） | LP_HEDGE | P0 | CFD | `M2-LP-022` | 交易、管理 |
| `SCN-HEDGE-COVERAGE` | 對沖覆蓋低於目標 | LP_HEDGE | P1 | CFD | `M2-HEDGE-007` | 交易、管理 |
| `SCN-ABOOK-RATIO` | A-book 成交占比崩落 | LP_HEDGE | P2 | CFD | `M2-ABOOK-008` | 交易、管理 |
| `SCN-HOT-WALLET` | 熱錢包浮額偏高 | CRYPTO_EXCHANGE | P1 | Crypto | `M2-CRYPTO-WALLET` | 管理、定價、交易 |
| `SCN-CRYPTO-LIQ` | 強平引擎積壓 | CRYPTO_EXCHANGE | P0 | Crypto | `M2-CRYPTO-LIQ` | 管理、定價、交易 |
| `SCN-ORACLE-BASIS` | 標記預言機延遲與永續基差失控 | CRYPTO_EXCHANGE | P1 | Crypto | `M2-CRYPTO-ORACLE`, `M2-PERP-BASIS` | 管理、定價、交易 |
| `SCN-FUNDING-STABLE` | 極端資金費與穩定幣脫鉤曝險 | CRYPTO_EXCHANGE | P1 | Crypto | `M2-FUNDING-RATE`, `M2-STABLE-EXP` | 管理、定價、交易 |
| `SCN-CRYPTO-OI-DEP` | 未平倉集中度與入金暴衝 | CRYPTO_EXCHANGE | P2 | Crypto | `M2-CRYPTO-OI`, `M2-CRYPTO-DEP` | 管理、定價、交易 |
| `SCN-CRYPTO-INSURANCE` | 保險基金單日回撤 | CRYPTO_EXCHANGE | P1 | Crypto | `M2-CRYPTO-INS` | 管理、定價、交易 |
| `SCN-MULTI-ACCOUNT` | 多帳戶詐欺叢集 | FRAUD_CONDUCT | P1 | CFD | `M2-FRAUD-011` | 管理、定價、交易 |
| `SCN-PAYMENT-CHARGEBACK` | 支付詐欺與退單暴增 | FRAUD_CONDUCT | P1 | CFD | `M2-PAY-017`, `M2-CHARGEBACK` | 管理、定價、交易 |
| `SCN-WASH-IB` | 對敲交易與 IB 返佣異常 | FRAUD_CONDUCT | P2 | CFD + Crypto | `M2-WASH-020`, `M2-IB-PAYOUT` | 管理、定價、交易 |
| `SCN-BONUS-BURN` | 獎金兌現濫用 | FRAUD_CONDUCT | P2 | CFD | `M2-BONUS-013` | 管理、定價、交易 |
| `SCN-XAU247` | XAUUSD247 淨曝險過載 | PRODUCT_CONFIG | P1 | CFD | `M2-XAU-247` | 定價、管理 |
| `SCN-GAP-SPREAD-LEV` | 跳空曝險、點差異常、最高槓桿開戶 | PRODUCT_CONFIG | P2 | CFD | `M2-GAP-012`, `M2-SPREAD-005`, `M2-LEV-019` | 定價、管理 |
| `SCN-SWAP-MISCONFIG` | 隔夜利息相對基準設定錯誤 | PRODUCT_CONFIG | P3 | CFD | `M2-SWAP-027` | 定價、管理 |
| `SCN-FUNDING-WD` | 資金異常與出金速度 | OPS_PROCESS | P1 | CFD + Crypto | `M2-FUND-010`, `M2-WD-015` | 管理、定價、交易 |
| `SCN-RECON-BREAKS` | 未結對帳差異 | OPS_PROCESS | P2 | CFD + Crypto | `M2-RECON-BRK` | 管理、定價、交易 |
| `SCN-BRIDGE-API` | 橋接延遲與交易 API 錯誤 | TECH_INFRA | P1 | CFD + Crypto | `M2-BRIDGE-LAT`, `M2-API-023` | 管理、定價、交易 |
| `SCN-PLATFORM-KILL` | 平台斷線與作用中熔斷 | TECH_INFRA | P0 | CFD + Crypto | `M2-MT-DISC`, `M2-KILL-COUNT` | 管理、定價、交易 |
| `SCN-CAPITAL-SEG` | 實體資本緩衝與客戶資金隔離 | REG_CAPITAL | P1 | CFD + Crypto | `M2-CAP-024`, `M2-SEG-025` | 管理、定價、交易 |
| `SCN-DETECTOR-DRIFT` | 偵測器精準度漂移／誤報 | MODEL_AI | P2 | Platform | `M2-MODEL-006` | 管理、定價、交易 |
| `SCN-VENDOR-DEGRADED` | 關鍵供應商降級或離線 | THIRD_PARTY_VENDOR | P3 | CFD + Crypto | `M2-VENDOR-OUT` | 管理、定價、交易 |
| `SCN-COMPLAINT-SPIKE` | 客戶投訴速度暴衝 | REPUTATION_COMMS | P3 | CFD + Crypto | `M2-COMPLAINT` | 管理、定價、交易 |

### 定價受眾（28）

| 代碼 | 名稱 | 領域 | 優先 | 產品 | 主要指標 | 受眾 |
|------|------|------|------|------|----------|------|
| `SCN-CROSS-BOOK-CONTAGION` | 跨帳簿傳染打到公司權益 | SYSTEMIC_FIRM | P0 | CFD + Crypto | `M2-CROSS-BOOK`, `M2-EQ-001`, `M2-VAR-002` | 管理、定價、交易 |
| `SCN-NEWS-WINDOW-GROSS` | 一級新聞窗口名義部位過載 | SYSTEMIC_FIRM | P0 | CFD | `M2-NEWS-GROSS`, `M2-EQ-001` | 管理、定價、交易 |
| `SCN-EQUITY-DRAWDOWN` | 公司權益回撤 | MARKET_PRICING | P0 | CFD | `M2-EQ-001` | 定價、管理 |
| `SCN-STALE-FEED` | 過期或交叉報價饋送 | MARKET_PRICING | P1 | CFD | `M2-FEED-003` | 定價、管理 |
| `SCN-SLIPPAGE-SPIKE` | 主要商品客戶滑點暴衝 | MARKET_PRICING | P2 | CFD | `M2-SLIP-021` | 定價、管理 |
| `SCN-VAR-CORR` | VaR 使用率與相關性破裂 | MARKET_PRICING | P1 | CFD | `M2-VAR-002`, `M2-CORR-004` | 定價、管理 |
| `SCN-MARKET-INTEL` | 高影響市場情報命中 | MARKET_PRICING | P1 | CFD + Crypto | `M2-MKT-INTEL` | 定價、管理 |
| `SCN-HOT-WALLET` | 熱錢包浮額偏高 | CRYPTO_EXCHANGE | P1 | Crypto | `M2-CRYPTO-WALLET` | 管理、定價、交易 |
| `SCN-CRYPTO-LIQ` | 強平引擎積壓 | CRYPTO_EXCHANGE | P0 | Crypto | `M2-CRYPTO-LIQ` | 管理、定價、交易 |
| `SCN-ORACLE-BASIS` | 標記預言機延遲與永續基差失控 | CRYPTO_EXCHANGE | P1 | Crypto | `M2-CRYPTO-ORACLE`, `M2-PERP-BASIS` | 管理、定價、交易 |
| `SCN-FUNDING-STABLE` | 極端資金費與穩定幣脫鉤曝險 | CRYPTO_EXCHANGE | P1 | Crypto | `M2-FUNDING-RATE`, `M2-STABLE-EXP` | 管理、定價、交易 |
| `SCN-CRYPTO-OI-DEP` | 未平倉集中度與入金暴衝 | CRYPTO_EXCHANGE | P2 | Crypto | `M2-CRYPTO-OI`, `M2-CRYPTO-DEP` | 管理、定價、交易 |
| `SCN-CRYPTO-INSURANCE` | 保險基金單日回撤 | CRYPTO_EXCHANGE | P1 | Crypto | `M2-CRYPTO-INS` | 管理、定價、交易 |
| `SCN-MULTI-ACCOUNT` | 多帳戶詐欺叢集 | FRAUD_CONDUCT | P1 | CFD | `M2-FRAUD-011` | 管理、定價、交易 |
| `SCN-PAYMENT-CHARGEBACK` | 支付詐欺與退單暴增 | FRAUD_CONDUCT | P1 | CFD | `M2-PAY-017`, `M2-CHARGEBACK` | 管理、定價、交易 |
| `SCN-WASH-IB` | 對敲交易與 IB 返佣異常 | FRAUD_CONDUCT | P2 | CFD + Crypto | `M2-WASH-020`, `M2-IB-PAYOUT` | 管理、定價、交易 |
| `SCN-BONUS-BURN` | 獎金兌現濫用 | FRAUD_CONDUCT | P2 | CFD | `M2-BONUS-013` | 管理、定價、交易 |
| `SCN-XAU247` | XAUUSD247 淨曝險過載 | PRODUCT_CONFIG | P1 | CFD | `M2-XAU-247` | 定價、管理 |
| `SCN-GAP-SPREAD-LEV` | 跳空曝險、點差異常、最高槓桿開戶 | PRODUCT_CONFIG | P2 | CFD | `M2-GAP-012`, `M2-SPREAD-005`, `M2-LEV-019` | 定價、管理 |
| `SCN-SWAP-MISCONFIG` | 隔夜利息相對基準設定錯誤 | PRODUCT_CONFIG | P3 | CFD | `M2-SWAP-027` | 定價、管理 |
| `SCN-FUNDING-WD` | 資金異常與出金速度 | OPS_PROCESS | P1 | CFD + Crypto | `M2-FUND-010`, `M2-WD-015` | 管理、定價、交易 |
| `SCN-RECON-BREAKS` | 未結對帳差異 | OPS_PROCESS | P2 | CFD + Crypto | `M2-RECON-BRK` | 管理、定價、交易 |
| `SCN-BRIDGE-API` | 橋接延遲與交易 API 錯誤 | TECH_INFRA | P1 | CFD + Crypto | `M2-BRIDGE-LAT`, `M2-API-023` | 管理、定價、交易 |
| `SCN-PLATFORM-KILL` | 平台斷線與作用中熔斷 | TECH_INFRA | P0 | CFD + Crypto | `M2-MT-DISC`, `M2-KILL-COUNT` | 管理、定價、交易 |
| `SCN-CAPITAL-SEG` | 實體資本緩衝與客戶資金隔離 | REG_CAPITAL | P1 | CFD + Crypto | `M2-CAP-024`, `M2-SEG-025` | 管理、定價、交易 |
| `SCN-DETECTOR-DRIFT` | 偵測器精準度漂移／誤報 | MODEL_AI | P2 | Platform | `M2-MODEL-006` | 管理、定價、交易 |
| `SCN-VENDOR-DEGRADED` | 關鍵供應商降級或離線 | THIRD_PARTY_VENDOR | P3 | CFD + Crypto | `M2-VENDOR-OUT` | 管理、定價、交易 |
| `SCN-COMPLAINT-SPIKE` | 客戶投訴速度暴衝 | REPUTATION_COMMS | P3 | CFD + Crypto | `M2-COMPLAINT` | 管理、定價、交易 |

### 交易受眾（29）

| 代碼 | 名稱 | 領域 | 優先 | 產品 | 主要指標 | 受眾 |
|------|------|------|------|------|----------|------|
| `SCN-CROSS-BOOK-CONTAGION` | 跨帳簿傳染打到公司權益 | SYSTEMIC_FIRM | P0 | CFD + Crypto | `M2-CROSS-BOOK`, `M2-EQ-001`, `M2-VAR-002` | 管理、定價、交易 |
| `SCN-NEWS-WINDOW-GROSS` | 一級新聞窗口名義部位過載 | SYSTEMIC_FIRM | P0 | CFD | `M2-NEWS-GROSS`, `M2-EQ-001` | 管理、定價、交易 |
| `SCN-MARGIN-UTIL-SPIKE` | 保證金使用率暴衝（≥100 帳戶 >90%） | CREDIT_CLIENT | P0 | CFD | `M2-MRG-014` | 交易、管理 |
| `SCN-COPY-CONCENTRATION` | 跟單提供者集中度違規 | CREDIT_CLIENT | P1 | CFD | `M2-COPY-009` | 交易、管理 |
| `SCN-STOPOUT-VELOCITY` | 強平速度暴衝（5 分鐘視窗） | CREDIT_CLIENT | P1 | CFD | `M2-STOP-018` | 交易、管理 |
| `SCN-NEGATIVE-BALANCE` | 負餘額保護失守 | CREDIT_CLIENT | P1 | CFD | `M2-NBP-016` | 交易、管理 |
| `SCN-LATENCY-ARB` | 延遲套利／有毒流量 | CREDIT_CLIENT | P2 | CFD | `M2-ARB-026` | 交易、管理 |
| `SCN-COPY-CHURN` | 跟單跟隨者恐慌退出 | CREDIT_CLIENT | P2 | CFD | `M2-COPY-CHURN` | 交易、管理 |
| `SCN-LP-REJECT-STORM` | LP 拒單風暴（oneZero／prime） | LP_HEDGE | P0 | CFD | `M2-LP-022` | 交易、管理 |
| `SCN-HEDGE-COVERAGE` | 對沖覆蓋低於目標 | LP_HEDGE | P1 | CFD | `M2-HEDGE-007` | 交易、管理 |
| `SCN-ABOOK-RATIO` | A-book 成交占比崩落 | LP_HEDGE | P2 | CFD | `M2-ABOOK-008` | 交易、管理 |
| `SCN-HOT-WALLET` | 熱錢包浮額偏高 | CRYPTO_EXCHANGE | P1 | Crypto | `M2-CRYPTO-WALLET` | 管理、定價、交易 |
| `SCN-CRYPTO-LIQ` | 強平引擎積壓 | CRYPTO_EXCHANGE | P0 | Crypto | `M2-CRYPTO-LIQ` | 管理、定價、交易 |
| `SCN-ORACLE-BASIS` | 標記預言機延遲與永續基差失控 | CRYPTO_EXCHANGE | P1 | Crypto | `M2-CRYPTO-ORACLE`, `M2-PERP-BASIS` | 管理、定價、交易 |
| `SCN-FUNDING-STABLE` | 極端資金費與穩定幣脫鉤曝險 | CRYPTO_EXCHANGE | P1 | Crypto | `M2-FUNDING-RATE`, `M2-STABLE-EXP` | 管理、定價、交易 |
| `SCN-CRYPTO-OI-DEP` | 未平倉集中度與入金暴衝 | CRYPTO_EXCHANGE | P2 | Crypto | `M2-CRYPTO-OI`, `M2-CRYPTO-DEP` | 管理、定價、交易 |
| `SCN-CRYPTO-INSURANCE` | 保險基金單日回撤 | CRYPTO_EXCHANGE | P1 | Crypto | `M2-CRYPTO-INS` | 管理、定價、交易 |
| `SCN-MULTI-ACCOUNT` | 多帳戶詐欺叢集 | FRAUD_CONDUCT | P1 | CFD | `M2-FRAUD-011` | 管理、定價、交易 |
| `SCN-PAYMENT-CHARGEBACK` | 支付詐欺與退單暴增 | FRAUD_CONDUCT | P1 | CFD | `M2-PAY-017`, `M2-CHARGEBACK` | 管理、定價、交易 |
| `SCN-WASH-IB` | 對敲交易與 IB 返佣異常 | FRAUD_CONDUCT | P2 | CFD + Crypto | `M2-WASH-020`, `M2-IB-PAYOUT` | 管理、定價、交易 |
| `SCN-BONUS-BURN` | 獎金兌現濫用 | FRAUD_CONDUCT | P2 | CFD | `M2-BONUS-013` | 管理、定價、交易 |
| `SCN-FUNDING-WD` | 資金異常與出金速度 | OPS_PROCESS | P1 | CFD + Crypto | `M2-FUND-010`, `M2-WD-015` | 管理、定價、交易 |
| `SCN-RECON-BREAKS` | 未結對帳差異 | OPS_PROCESS | P2 | CFD + Crypto | `M2-RECON-BRK` | 管理、定價、交易 |
| `SCN-BRIDGE-API` | 橋接延遲與交易 API 錯誤 | TECH_INFRA | P1 | CFD + Crypto | `M2-BRIDGE-LAT`, `M2-API-023` | 管理、定價、交易 |
| `SCN-PLATFORM-KILL` | 平台斷線與作用中熔斷 | TECH_INFRA | P0 | CFD + Crypto | `M2-MT-DISC`, `M2-KILL-COUNT` | 管理、定價、交易 |
| `SCN-CAPITAL-SEG` | 實體資本緩衝與客戶資金隔離 | REG_CAPITAL | P1 | CFD + Crypto | `M2-CAP-024`, `M2-SEG-025` | 管理、定價、交易 |
| `SCN-DETECTOR-DRIFT` | 偵測器精準度漂移／誤報 | MODEL_AI | P2 | Platform | `M2-MODEL-006` | 管理、定價、交易 |
| `SCN-VENDOR-DEGRADED` | 關鍵供應商降級或離線 | THIRD_PARTY_VENDOR | P3 | CFD + Crypto | `M2-VENDOR-OUT` | 管理、定價、交易 |
| `SCN-COMPLAINT-SPIKE` | 客戶投訴速度暴衝 | REPUTATION_COMMS | P3 | CFD + Crypto | `M2-COMPLAINT` | 管理、定價、交易 |

## 技能劇本（47）

| 技能代碼 | 名稱 | 主指標 | 相關 | 負責部門 |
|----------|------|--------|------|----------|
| `SKILL-MARGIN-SPIKE` | Margin utilisation spike (≥100 accounts >90%) | `M2-MRG-014` | `M2-COPY-009`, `M2-EQ-001`, `M2-HEDGE-007`, `M2-FEED-003` | RISK_CONTROL |
| `SKILL-COPY-CONCENTRATION` | Copy provider concentration breach (>25%) | `M2-COPY-009` | `M2-MRG-014`, `M2-EQ-001`, `M2-FRAUD-011` | RISK_CONTROL |
| `SKILL-CRYPTO-HOT-WALLET` | Hot wallet float elevated (≥15%) | `M2-CRYPTO-WALLET` | `M2-CRYPTO-LIQ` | SYSTEM |
| `SKILL-LP-REJECT-STORM` | LP reject rate storm (≥5%) | `M2-LP-022` | `M2-HEDGE-007`, `M2-FEED-003`, `M2-EQ-001` | SYSTEM |
| `SKILL-HEDGE-COVERAGE` | Hedge coverage below target (<85%) | `M2-HEDGE-007` | `M2-LP-022`, `M2-EQ-001`, `M2-XAU-247` | RISK_CONTROL |
| `SKILL-FRAUD-CLUSTER` | Multi-account fraud cluster (≥0.85) | `M2-FRAUD-011` | `M2-COPY-009`, `M2-MRG-014` | OPERATIONS |
| `SKILL-XAU247-EXPOSURE` | XAUUSD247 net exposure near limit (≥10k lots) | `M2-XAU-247` | `M2-HEDGE-007`, `M2-EQ-001`, `M2-LP-022` | RISK_CONTROL |
| `SKILL-EQUITY-DRAWDOWN` | Company equity drawdown rising (≥3%) | `M2-EQ-001` | `M2-HEDGE-007`, `M2-MRG-014`, `M2-LP-022`, `M2-COPY-009` | RISK_CONTROL |
| `SKILL-STALE-FEED` | Stale quote symbols (≥3) | `M2-FEED-003` | `M2-MRG-014`, `M2-LP-022`, `M2-EQ-001` | SYSTEM |
| `SKILL-CRYPTO-LIQ-BACKLOG` | Crypto liquidation engine backlog (≥50) | `M2-CRYPTO-LIQ` | `M2-CRYPTO-WALLET` | SYSTEM |
| `SKILL-GENERIC-HUMAN-REVIEW` | Generic human RCA review (fallback) | `__NEVER_AUTO_MATCH__` | — | RISK_CONTROL |
| `SKILL-STOPOUT-VELOCITY` | Stop-out velocity spike (≥40 / 5m) | `M2-STOP-018` | `M2-MRG-014`, `M2-EQ-001`, `M2-SLIP-021`, `M2-FEED-003` | RISK_CONTROL |
| `SKILL-NEGATIVE-BALANCE` | Negative-balance accounts (≥5) | `M2-NBP-016` | `M2-STOP-018`, `M2-FEED-003`, `M2-EQ-001`, `M2-GAP-012` | OPERATIONS |
| `SKILL-SLIPPAGE-SPIKE` | Client slippage spike (≥3.5 pips avg) | `M2-SLIP-021` | `M2-LP-022`, `M2-FEED-003`, `M2-BRIDGE-LAT` | SYSTEM |
| `SKILL-BRIDGE-LATENCY` | oneZero bridge latency (≥250ms p95) | `M2-BRIDGE-LAT` | `M2-LP-022`, `M2-SLIP-021`, `M2-HEDGE-007` | SYSTEM |
| `SKILL-ABOOK-RATIO` | A-book ratio drift (<40% or >90%) | `M2-ABOOK-008` | `M2-HEDGE-007`, `M2-EQ-001`, `M2-LP-022` | RISK_CONTROL |
| `SKILL-VAR-BREACH` | 1-day VaR utilisation (≥95%) | `M2-VAR-002` | `M2-EQ-001`, `M2-HEDGE-007`, `M2-CORR-004` | RISK_CONTROL |
| `SKILL-CORRELATION-BREAK` | FX correlation regime break (≥0.35 Δ) | `M2-CORR-004` | `M2-VAR-002`, `M2-EQ-001`, `M2-HEDGE-007` | AI |
| `SKILL-GAP-RISK` | Weekend / holiday gap exposure (≥$2m) | `M2-GAP-012` | `M2-XAU-247`, `M2-HEDGE-007`, `M2-NBP-016`, `M2-EQ-001` | RISK_CONTROL |
| `SKILL-SPREAD-ANOMALY` | Abnormal client spread (≥3× median) | `M2-SPREAD-005` | `M2-FEED-003`, `M2-SLIP-021`, `M2-EQ-001` | SYSTEM |
| `SKILL-LEVERAGE-ONBOARD` | High-leverage new accounts (≥200 / day) | `M2-LEV-019` | `M2-MRG-014`, `M2-FRAUD-011`, `M2-BONUS-013` | RISK_CONTROL |
| `SKILL-BONUS-BURN` | Bonus conversion abuse (≥$150k / day) | `M2-BONUS-013` | `M2-FRAUD-011`, `M2-COPY-009`, `M2-WD-015` | OPERATIONS |
| `SKILL-WITHDRAWAL-VELOCITY` | Withdrawal velocity surge (≥$5m / hour) | `M2-WD-015` | `M2-CRYPTO-WALLET`, `M2-FRAUD-011`, `M2-FUND-010`, `M2-BONUS-013` | OPERATIONS |
| `SKILL-FUNDING-EXCEPTION` | Funding exception surge (≥80 / hour) | `M2-FUND-010` | `M2-FRAUD-011`, `M2-WD-015`, `M2-PAY-017` | OPERATIONS |
| `SKILL-PAYMENT-FRAUD` | Payment fraud score (≥0.8) | `M2-PAY-017` | `M2-FRAUD-011`, `M2-FUND-010`, `M2-WD-015` | OPERATIONS |
| `SKILL-WASH-TRADE` | Wash / collusion score (≥0.75) | `M2-WASH-020` | `M2-FRAUD-011`, `M2-COPY-009`, `M2-CRYPTO-OI` | RISK_CONTROL |
| `SKILL-API-ERROR-RATE` | Trading API error rate (≥5%) | `M2-API-023` | `M2-BRIDGE-LAT`, `M2-MRG-014`, `M2-CRYPTO-LIQ` | SYSTEM |
| `SKILL-DETECTOR-DRIFT` | Detector precision drift (<70%) | `M2-MODEL-006` | `M2-EQ-001`, `M2-FRAUD-011` | AI |
| `SKILL-ENTITY-CAPITAL` | Entity capital buffer thin (<15%) | `M2-CAP-024` | `M2-EQ-001`, `M2-VAR-002`, `M2-SEG-025` | RISK_CONTROL |
| `SKILL-SEGREGATION-GAP` | Client money segregation gap (≥$250k) | `M2-SEG-025` | `M2-FUND-010`, `M2-WD-015`, `M2-CAP-024` | OPERATIONS |
| `SKILL-CRYPTO-ORACLE` | Oracle / index lag (≥2s) | `M2-CRYPTO-ORACLE` | `M2-CRYPTO-LIQ`, `M2-CRYPTO-INS`, `M2-FEED-003` | SYSTEM |
| `SKILL-CRYPTO-INSURANCE` | Insurance fund drawdown (≥8% day) | `M2-CRYPTO-INS` | `M2-CRYPTO-LIQ`, `M2-CRYPTO-ORACLE`, `M2-CRYPTO-OI` | RISK_CONTROL |
| `SKILL-CRYPTO-OI-CONC` | Perp OI concentration (≥35% one account) | `M2-CRYPTO-OI` | `M2-CRYPTO-LIQ`, `M2-CRYPTO-INS`, `M2-WASH-020` | RISK_CONTROL |
| `SKILL-CRYPTO-DEPOSIT-SPIKE` | Crypto deposit spike (≥$8m / hour) | `M2-CRYPTO-DEP` | `M2-CRYPTO-WALLET`, `M2-WD-015`, `M2-CRYPTO-LIQ` | SYSTEM |
| `SKILL-LATENCY-ARB` | Latency arb score (≥0.7) | `M2-ARB-026` | `M2-FEED-003`, `M2-SLIP-021`, `M2-EQ-001`, `M2-BRIDGE-LAT` | RISK_CONTROL |
| `SKILL-SWAP-MISCONFIG` | Swap / financing misconfig (≥10 symbols) | `M2-SWAP-027` | `M2-EQ-001`, `M2-SPREAD-005`, `M2-XAU-247` | RISK_CONTROL |
| `SKILL-MARKET-INTEL` | Market intelligence high-impact hits (≥1 / 5m) | `M2-MKT-INTEL` | `M2-EQ-001`, `M2-MRG-014`, `M2-HEDGE-007`, `M2-FEED-003`, `M2-VAR-002`, `M2-XAU-247` | RISK_CONTROL |
| `SKILL-PERP-BASIS` | Perp mark–index basis (≥60 bps) | `M2-PERP-BASIS` | `M2-CRYPTO-ORACLE`, `M2-CRYPTO-LIQ`, `M2-CRYPTO-INS`, `M2-CRYPTO-OI` | RISK_CONTROL |
| `SKILL-FUNDING-EXTREME` | Perp funding rate extreme (≥0.5% / 8h) | `M2-FUNDING-RATE` | `M2-CRYPTO-OI`, `M2-CRYPTO-LIQ`, `M2-PERP-BASIS`, `M2-CRYPTO-INS` | RISK_CONTROL |
| `SKILL-STABLE-DEPEG` | Stablecoin inventory depeg exposure (≥$2m) | `M2-STABLE-EXP` | `M2-CRYPTO-WALLET`, `M2-CRYPTO-DEP`, `M2-WD-015`, `M2-CAP-024` | RISK_CONTROL |
| `SKILL-PLATFORM-DISCONNECT` | Trading platform disconnect rate (≥5%) | `M2-MT-DISC` | `M2-API-023`, `M2-STOP-018`, `M2-MRG-014`, `M2-EQ-001` | SYSTEM |
| `SKILL-RECON-BREAKS` | Reconciliation breaks (≥20) | `M2-RECON-BRK` | `M2-SEG-025`, `M2-FUND-010`, `M2-WD-015`, `M2-CAP-024` | OPERATIONS |
| `SKILL-SYMBOL-HALTS` | Active symbol kill-switches (≥5) | `M2-KILL-COUNT` | `M2-FEED-003`, `M2-HEDGE-007`, `M2-LP-022`, `M2-API-023` | SYSTEM |
| `SKILL-NEWS-GROSS` | Gross notional into Tier-1 news (≥$120m) | `M2-NEWS-GROSS` | `M2-MKT-INTEL`, `M2-GAP-012`, `M2-STOP-018`, `M2-SPREAD-005`, `M2-EQ-001` | RISK_CONTROL |
| `SKILL-CHARGEBACK-SPIKE` | Payment chargebacks (≥40 / 24h) | `M2-CHARGEBACK` | `M2-PAY-017`, `M2-FRAUD-011`, `M2-WD-015`, `M2-FUND-010` | OPERATIONS |
| `SKILL-IB-REBATE-ANOMALY` | IB rebate anomaly score (≥0.8) | `M2-IB-PAYOUT` | `M2-WASH-020`, `M2-BONUS-013`, `M2-FRAUD-011`, `M2-COPY-009` | RISK_CONTROL |
| `SKILL-COPY-CHURN` | Copy follower net exit (≥25% / 1h) | `M2-COPY-CHURN` | `M2-COPY-009`, `M2-MRG-014`, `M2-STOP-018`, `M2-EQ-001` | RISK_CONTROL |

## 連結情境時間鏈（40）

| 代碼 | 名稱 | 指標 |
|------|------|------|
| `CHAIN-CREDIT-CASCADE` | Copy concentration → margin spike → equity drawdown | `M2-COPY-009`, `M2-COPY-009`, `M2-MRG-014`, `M2-MRG-014`, `M2-EQ-001` |
| `CHAIN-LP-HEDGE-GAP` | LP reject storm → hedge coverage gap → equity stress | `M2-LP-022`, `M2-LP-022`, `M2-HEDGE-007`, `M2-HEDGE-007`, `M2-EQ-001` |
| `CHAIN-PRICING-FEED-PROPAGATION` | LP quote delay → final quote stale → pricing publish lag (INC-1028) | `M2-LP-022`, `M2-LP-022`, `M2-FEED-003`, `M2-FEED-003`, `M2-HEDGE-007` |
| `CHAIN-FEED-LIQUIDATION-ERROR` | Stale feed → false margin stress → equity noise | `M2-FEED-003`, `M2-FEED-003`, `M2-MRG-014`, `M2-EQ-001` |
| `CHAIN-CRYPTO-CUSTODY-STRESS` | Hot wallet float → withdrawal pressure → liq backlog risk | `M2-CRYPTO-WALLET`, `M2-CRYPTO-WALLET`, `M2-CRYPTO-LIQ`, `M2-CRYPTO-LIQ` |
| `CHAIN-FRAUD-COPY-ABUSE` | Fraud cluster + copy concentration (sybil copiers) | `M2-FRAUD-011`, `M2-COPY-009`, `M2-FRAUD-011`, `M2-COPY-009` |
| `CHAIN-METALS-WEEKEND` | XAUUSD247 build-up → hedge gap into Monday open | `M2-XAU-247`, `M2-HEDGE-007`, `M2-LP-022`, `M2-EQ-001` |
| `CHAIN-VOL-TRIPLE` | News vol: feed warn + margin + hedge simultaneous | `M2-FEED-003`, `M2-MRG-014`, `M2-HEDGE-007`, `M2-EQ-001` |
| `CHAIN-MODEL-DRIFT-SHADOW` | AI skill miss → RAG path flood → human queue backlog | `M2-EQ-001`, `M2-FRAUD-011`, `M2-MRG-014` |
| `CHAIN-OPS-FUNDING-STRESS` | Fraud WARN + margin WARN during funding exception surge | `M2-FRAUD-011`, `M2-MRG-014`, `M2-COPY-009` |
| `CHAIN-FULL-STACK-CRYPTO-CFD` | Cross-product stress: crypto custody + CFD credit same day | `M2-CRYPTO-WALLET`, `M2-COPY-009`, `M2-MRG-014`, `M2-EQ-001` |
| `CHAIN-STOPOUT-CASCADE` | Stop-out velocity → margin BREACH → equity WARN | `M2-STOP-018`, `M2-STOP-018`, `M2-MRG-014`, `M2-SLIP-021`, `M2-EQ-001` |
| `CHAIN-EXECUTION-DEGRADE` | Bridge latency → slippage → LP rejects | `M2-BRIDGE-LAT`, `M2-BRIDGE-LAT`, `M2-SLIP-021`, `M2-LP-022`, `M2-HEDGE-007` |
| `CHAIN-GAP-NBP` | Gap exposure → NBP accounts → equity hit | `M2-GAP-012`, `M2-XAU-247`, `M2-NBP-016`, `M2-EQ-001` |
| `CHAIN-PROMO-TOXICITY` | Leverage onboard surge → bonus burn → fraud WARN | `M2-LEV-019`, `M2-BONUS-013`, `M2-FRAUD-011`, `M2-MRG-014` |
| `CHAIN-WITHDRAWAL-RUN` | Withdrawal surge + funding exceptions + fraud score | `M2-WD-015`, `M2-FUND-010`, `M2-PAY-017`, `M2-WD-015`, `M2-CRYPTO-WALLET` |
| `CHAIN-CRYPTO-ORACLE-LIQ` | Oracle lag → liq backlog → insurance fund DD | `M2-CRYPTO-ORACLE`, `M2-CRYPTO-ORACLE`, `M2-CRYPTO-LIQ`, `M2-CRYPTO-LIQ`, `M2-CRYPTO-INS` |
| `CHAIN-WHALE-OI-INS` | OI concentration → liq cliff → insurance stress | `M2-CRYPTO-OI`, `M2-CRYPTO-OI`, `M2-CRYPTO-LIQ`, `M2-CRYPTO-INS` |
| `CHAIN-VAR-CORR-EQ` | Correlation break → VaR utilisation → equity DD | `M2-CORR-004`, `M2-CORR-004`, `M2-VAR-002`, `M2-VAR-002`, `M2-EQ-001` |
| `CHAIN-ABOOK-HEDGE-EQ` | A-book ratio collapse → hedge gap → equity | `M2-ABOOK-008`, `M2-ABOOK-008`, `M2-HEDGE-007`, `M2-EQ-001` |
| `CHAIN-SPREAD-MARKUP-BUG` | Spread anomaly → slippage noise → client ops surge | `M2-SPREAD-005`, `M2-SLIP-021`, `M2-FUND-010` |
| `CHAIN-TOXIC-ARB` | Stale feed → latency arb → equity drip | `M2-FEED-003`, `M2-ARB-026`, `M2-ARB-026`, `M2-EQ-001` |
| `CHAIN-REG-CAPITAL` | Equity DD → capital buffer thin → segregation WARN | `M2-EQ-001`, `M2-CAP-024`, `M2-CAP-024`, `M2-SEG-025` |
| `CHAIN-API-OUTAGE-RISK` | API errors → clients cannot close → margin / equity drift | `M2-API-023`, `M2-API-023`, `M2-MRG-014`, `M2-EQ-001` |
| `CHAIN-WASH-COPY` | Wash score + copy concentration (mirrored collusion) | `M2-WASH-020`, `M2-COPY-009`, `M2-WASH-020`, `M2-FRAUD-011` |
| `CHAIN-SWAP-OVERNIGHT` | Swap misconfig → overnight equity drip → ops adjustments | `M2-SWAP-027`, `M2-EQ-001`, `M2-FUND-010` |
| `CHAIN-DEPOSIT-FLOAT` | Crypto deposit spike → hot float WARN → withdrawal pressure | `M2-CRYPTO-DEP`, `M2-CRYPTO-DEP`, `M2-CRYPTO-WALLET`, `M2-CRYPTO-WALLET`, `M2-WD-015` |
| `CHAIN-MODEL-FALSE-CALM` | Detector drift + missed margin → late human scramble | `M2-MODEL-006`, `M2-MODEL-006`, `M2-MRG-014`, `M2-EQ-001` |
| `CHAIN-SEGREGATION-FUNDING` | Funding exceptions → segregation gap → capital WARN | `M2-FUND-010`, `M2-SEG-025`, `M2-SEG-025`, `M2-CAP-024` |
| `CHAIN-MKT-INTEL-VOL` | Market intel hits → equity / margin heat | `M2-MKT-INTEL`, `M2-MKT-INTEL`, `M2-MRG-014`, `M2-EQ-001` |
| `CHAIN-PERP-BASIS-ORACLE` | Oracle lag → basis → liquidation → insurance | `M2-CRYPTO-ORACLE`, `M2-PERP-BASIS`, `M2-PERP-BASIS`, `M2-CRYPTO-LIQ`, `M2-CRYPTO-INS` |
| `CHAIN-FUNDING-SQUEEZE` | Extreme funding → OI concentration → liq backlog | `M2-FUNDING-RATE`, `M2-CRYPTO-OI`, `M2-FUNDING-RATE`, `M2-CRYPTO-LIQ` |
| `CHAIN-STABLE-CUSTODY` | Stable depeg exposure → hot float → withdrawals | `M2-STABLE-EXP`, `M2-CRYPTO-WALLET`, `M2-WD-015`, `M2-STABLE-EXP` |
| `CHAIN-PLATFORM-CREDIT` | Platform disconnect → API errors → stop-outs → equity | `M2-MT-DISC`, `M2-API-023`, `M2-MT-DISC`, `M2-STOP-018`, `M2-EQ-001` |
| `CHAIN-NEWS-GROSS-GAP` | Intel + news gross → spread → stop-outs → gap USD | `M2-MKT-INTEL`, `M2-NEWS-GROSS`, `M2-SPREAD-005`, `M2-STOP-018`, `M2-GAP-012` |
| `CHAIN-RECON-SEGREGATION` | Recon breaks → segregation gap → capital buffer | `M2-RECON-BRK`, `M2-RECON-BRK`, `M2-SEG-025`, `M2-CAP-024` |
| `CHAIN-IB-FRAUD-RING` | IB rebate anomaly → wash → bonus → withdrawals | `M2-IB-PAYOUT`, `M2-WASH-020`, `M2-BONUS-013`, `M2-WD-015`, `M2-IB-PAYOUT` |
| `CHAIN-COPY-PANIC-UNWIND` | Copy churn → concentration → margin → equity | `M2-COPY-CHURN`, `M2-COPY-009`, `M2-MRG-014`, `M2-EQ-001` |
| `CHAIN-KILL-FEED-HEDGE` | Stale feed → kill-switches → hedge / LP stress | `M2-FEED-003`, `M2-KILL-COUNT`, `M2-HEDGE-007`, `M2-LP-022`, `M2-KILL-COUNT` |
| `CHAIN-CHARGEBACK-FUNDING` | Payment fraud → chargebacks → funding exceptions → withdrawals | `M2-PAY-017`, `M2-CHARGEBACK`, `M2-FUND-010`, `M2-CHARGEBACK`, `M2-WD-015` |

## 清單來源

| 層級 | 來源 |
|------|------|
| 指標 | SQLite `monitor_indicators`（＋`monitor-indicator-meta`） |
| 領域情境 | `lib/ai/risk-domain-scenarios.ts` |
| 技能劇本 | `lib/ai/risk-scenarios-catalog.ts` → `/admin/skills` |
| 連結時間鏈 | 同上目錄 → 知識樹 |
| 外匯組合 | `lib/demo/forex-incident-1028.ts` |

## AI／LLM（每次觸發真實思考）

| 觸發 | 設定 `OPENAI_API_KEY` 且 `CRMP_AI_LLM` 未關閉時的行為 |
|------|------------------------------------------------------|
| 探索 **立即掃描** | 在即時 SQLite 視窗跑統計／ML；唯一 `scan_seed`＋思考軌跡 |
| 探索 **分析** | 自動 LIVE OpenAI；每次呼叫新的 `ANL-*` 思考 |
| 警報 **AI 根因** | 先啟發式，再 OpenAI 改寫並寫入思考證據 |
| 執行偵測器／Monitor 執行 | 批次後對新分析做 LLM 強化 |
| 首頁 **虛擬脊柱** | 有金鑰時在 RCA 後強化 |
| 台面選取聊天 | 啟發式回覆後再經 OpenAI 改寫 |

失敗一律回退啟發式／MOCK，不阻斷台面作業。
