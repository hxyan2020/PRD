# Indicators & Risk Scenarios

Full operator catalogue for **Admin**, **Pricing**, and **Dealing** desks.

| Surface | Path |
|---------|------|
| Interactive board (filter by BU) | `/admin/docs/indicators-scenarios` |
| Seed SQL explorer | `/admin/docs/simulated-data` |
| Monitor 2.0 live registry | `/admin/monitor-2` |
| Domain scenario map | `/admin/risk-domains` |
| Skill playbooks | `/admin/skills` |

Generated from live SQLite `monitor_indicators` + domain/skill catalogs (2026-10-31). Counts: **50** indicators · **37** domain scenarios · **47** skills · **40** linked timelines.

## Audience map

| Desk | Owns | Typical domains | How to use this doc |
|------|------|-----------------|---------------------|
| **Admin / Risk Owner** | Policy, L2 approve, discovery promote, severity weights | Credit / client, model & AI, fraud, infra | Full indicator + scenario lists below |
| **Pricing** | Quote age, publish lag, product exposure, feed propagation | Market pricing, product config | § Pricing indicators & scenarios |
| **Dealing / LP** | Reject rate, hedge coverage, A-book tilt, weekend metals | LP & hedge, credit contagion companions | § Dealing indicators & scenarios |

## Canonical forex CFD use-case — INC-1028

| Field | Value |
|-------|--------|
| Incident | `INC-1028` |
| LP / symbol | LP-A · XAUUSD |
| Severity | P2 Medium |
| Desk | Pricing Engine SG-02 |
| Chain | `CHAIN-PRICING-FEED-PROPAGATION` |
| Seed monitors | `M2-LP-022`, `M2-FEED-003`, `M2-XAU-247`, `M2-HEDGE-007` |

### Companion cases

| Id | Story | Monitors |
|----|--------|----------|
| LP-HEDGE-GAP | LP reject storm → hedge coverage gap | `M2-LP-022`, `M2-HEDGE-007` |
| XAU-WEEKEND | XAUUSD247 weekend exposure build-up | `M2-XAU-247`, `M2-HEDGE-007`, `M2-LP-022` |
| STALE-FEED-LIQ | Stale feed → liquidation / credit contagion | `M2-FEED-003`, `M2-MRG-014`, `M2-EQ-001` |

## All indicators (50)

| Monitor ID | Name | Domain | Product | Owner BU | Warn | Breach | Unit | Forex demo |
|------------|------|--------|---------|----------|------|--------|------|------------|
| `M2-ARB-026` | Latency Arb Toxicity Score | CREDIT_CLIENT | CFD | dealing | 0.5 | 0.7 | score |  |
| `M2-COPY-009` | Top Signal Provider Copier Concentration | CREDIT_CLIENT | CFD | dealing | 15 | 25 | % |  |
| `M2-COPY-CHURN` | Copy Follower Net Exit (1h) | CREDIT_CLIENT | CFD | dealing | 12 | 25 | % |  |
| `M2-MRG-014` | Accounts >90% Margin Utilisation | CREDIT_CLIENT | CFD | dealing | 50 | 100 | count | yes |
| `M2-NBP-016` | Negative Balance Account Count | CREDIT_CLIENT | CFD | dealing | 2 | 5 | accounts |  |
| `M2-STOP-018` | Stop-out Count (5m window) | CREDIT_CLIENT | CFD | dealing | 20 | 40 | count/5m |  |
| `M2-CRYPTO-DEP` | Crypto Deposits (1h USD) | CRYPTO_EXCHANGE | Crypto | admin | 3000000 | 8000000 | USD |  |
| `M2-CRYPTO-INS` | Insurance Fund Daily Drawdown | CRYPTO_EXCHANGE | Crypto | admin | 4 | 8 | % |  |
| `M2-CRYPTO-LIQ` | Liquidation Engine Backlog | CRYPTO_EXCHANGE | Crypto | admin | 50 | 200 | orders |  |
| `M2-CRYPTO-OI` | Top Account OI Share (per contract) | CRYPTO_EXCHANGE | Crypto | admin | 20 | 35 | % |  |
| `M2-CRYPTO-ORACLE` | Mark Price Oracle Lag | CRYPTO_EXCHANGE | Crypto | admin | 1 | 2 | seconds |  |
| `M2-CRYPTO-WALLET` | Hot Wallet Float Ratio | CRYPTO_EXCHANGE | Crypto | admin | 15 | 25 | % |  |
| `M2-FUNDING-RATE` | Perp Funding Rate Abs (8h) | CRYPTO_EXCHANGE | Crypto | admin | 0.15 | 0.5 | % |  |
| `M2-PERP-BASIS` | Perp Mark–Index Basis | CRYPTO_EXCHANGE | Crypto | admin | 25 | 60 | bps |  |
| `M2-STABLE-EXP` | Stablecoin Depeg Exposure (USD) | CRYPTO_EXCHANGE | Crypto | admin | 500000 | 2000000 | USD |  |
| `M2-BONUS-013` | Bonus Converted to Cash (24h USD) | FRAUD_CONDUCT | CFD | shared | 75000 | 150000 | USD |  |
| `M2-CHARGEBACK` | Payment Chargebacks (24h) | FRAUD_CONDUCT | CFD | shared | 15 | 40 | count/24h |  |
| `M2-FRAUD-011` | Multi-account Cluster Score | FRAUD_CONDUCT | CFD | shared | 0.7 | 0.85 | score |  |
| `M2-IB-PAYOUT` | IB Rebate Anomaly Score | FRAUD_CONDUCT | CFD | shared | 0.6 | 0.8 | score |  |
| `M2-PAY-017` | Payment Fraud Model Score | FRAUD_CONDUCT | CFD | shared | 0.65 | 0.8 | score |  |
| `M2-WASH-020` | Wash/Collusion Detection Score | FRAUD_CONDUCT | CFD+Crypto | shared | 0.55 | 0.75 | score |  |
| `M2-ABOOK-008` | A-book Volume Ratio (session) | LP_HEDGE | CFD | dealing | 40 | 30 | % |  |
| `M2-DISC-CUSUM-LP-REJECT-RATE` | LP Reject Rate (oneZero) CUSUM regime score | LP_HEDGE | CFD | dealing | 1 | 1.5 | score |  |
| `M2-HEDGE-007` | Hedge Coverage Ratio | LP_HEDGE | CFD | dealing | 85 | 70 | % | yes |
| `M2-LP-022` | LP Reject Rate (oneZero) | LP_HEDGE | CFD | dealing | 2 | 5 | % | yes |
| `M2-CORR-004` | Corr Matrix Drift vs Baseline | MARKET_PRICING | CFD | pricing | 0.2 | 0.35 | Δρ |  |
| `M2-EQ-001` | Company Equity Drawdown | MARKET_PRICING | CFD | pricing | 3 | 5 | % | yes |
| `M2-FEED-003` | Stale Quote Symbols | MARKET_PRICING | CFD | pricing | 3 | 10 | symbols | yes |
| `M2-MKT-INTEL` | Market Intelligence High-Impact Hits (5m) | MARKET_PRICING | CFD+Crypto | pricing | 1 | 3 | hits/5m |  |
| `M2-NEWS-GROSS` | Gross Notional into Tier-1 News (USD) | MARKET_PRICING | CFD | pricing | 50000000 | 120000000 | USD |  |
| `M2-SLIP-021` | Avg Client Slippage (majors, 15m) | MARKET_PRICING | CFD | pricing | 2 | 3.5 | pips |  |
| `M2-VAR-002` | 1-day VaR Utilisation | MARKET_PRICING | CFD | pricing | 85 | 95 | % |  |
| `M2-MODEL-006` | Detector Precision (7d rolling) | MODEL_AI | CFD+Crypto | admin | 80 | 70 | % |  |
| `M2-FUND-010` | Funding Exceptions (1h) | OPS_PROCESS | CFD | admin | 30 | 80 | count/h |  |
| `M2-RECON-BRK` | Reconciliation Breaks (open) | OPS_PROCESS | CFD+Crypto | admin | 5 | 20 | count |  |
| `M2-WD-015` | Withdrawal Volume (1h USD) | OPS_PROCESS | CFD+Crypto | admin | 2000000 | 5000000 | USD |  |
| `M2-GAP-012` | Estimated Gap Exposure (USD) | PRODUCT_CONFIG | CFD | pricing | 1000000 | 2000000 | USD |  |
| `M2-LEV-019` | New Accounts at Max Leverage (24h) | PRODUCT_CONFIG | CFD | pricing | 100 | 200 | accounts |  |
| `M2-SPREAD-005` | Spread vs Session Median Ratio | PRODUCT_CONFIG | CFD | pricing | 2 | 3 | x |  |
| `M2-SWAP-027` | Symbols with Swap vs Benchmark Δ | PRODUCT_CONFIG | CFD | pricing | 5 | 10 | symbols |  |
| `M2-XAU-247` | XAUUSD247 Net Exposure | PRODUCT_CONFIG | CFD | pricing | 10000 | 15000 | lots | yes |
| `M2-CAP-024` | Entity Capital Buffer Ratio | REG_CAPITAL | CFD+Crypto | admin | 20 | 15 | % |  |
| `M2-SEG-025` | Client Money Segregation Gap (USD) | REG_CAPITAL | CFD | admin | 50000 | 250000 | USD |  |
| `M2-COMPLAINT` | Client Complaint Velocity (24h) | REPUTATION_COMMS | CFD+Crypto | admin | 40 | 100 | count/24h |  |
| `M2-CROSS-BOOK` | Cross-book Contagion Score | SYSTEMIC_FIRM | CFD+Crypto | admin | 0.55 | 0.75 | score |  |
| `M2-API-023` | Trading API Error Rate (5m) | TECH_INFRA | CFD+Crypto | shared | 2 | 5 | % |  |
| `M2-BRIDGE-LAT` | Bridge Fill Latency p95 | TECH_INFRA | CFD | shared | 120 | 250 | ms |  |
| `M2-KILL-COUNT` | Active Symbol Kill-Switches | TECH_INFRA | CFD+Crypto | shared | 2 | 5 | symbols |  |
| `M2-MT-DISC` | Trading Platform Disconnect Rate | TECH_INFRA | CFD+Crypto | shared | 1 | 5 | % |  |
| `M2-VENDOR-OUT` | Critical Vendor Degraded Count | THIRD_PARTY_VENDOR | CFD+Crypto | admin | 1 | 3 | vendors |  |

### Pricing lens (25)

Indicators owned by Pricing, shared domains, or on the INC-1028 forex demo book.

| Monitor ID | Name | Domain | Product | Owner BU | Warn | Breach | Unit | Forex demo |
|------------|------|--------|---------|----------|------|--------|------|------------|
| `M2-MRG-014` | Accounts >90% Margin Utilisation | CREDIT_CLIENT | CFD | dealing | 50 | 100 | count | yes |
| `M2-BONUS-013` | Bonus Converted to Cash (24h USD) | FRAUD_CONDUCT | CFD | shared | 75000 | 150000 | USD |  |
| `M2-CHARGEBACK` | Payment Chargebacks (24h) | FRAUD_CONDUCT | CFD | shared | 15 | 40 | count/24h |  |
| `M2-FRAUD-011` | Multi-account Cluster Score | FRAUD_CONDUCT | CFD | shared | 0.7 | 0.85 | score |  |
| `M2-IB-PAYOUT` | IB Rebate Anomaly Score | FRAUD_CONDUCT | CFD | shared | 0.6 | 0.8 | score |  |
| `M2-PAY-017` | Payment Fraud Model Score | FRAUD_CONDUCT | CFD | shared | 0.65 | 0.8 | score |  |
| `M2-WASH-020` | Wash/Collusion Detection Score | FRAUD_CONDUCT | CFD+Crypto | shared | 0.55 | 0.75 | score |  |
| `M2-HEDGE-007` | Hedge Coverage Ratio | LP_HEDGE | CFD | dealing | 85 | 70 | % | yes |
| `M2-LP-022` | LP Reject Rate (oneZero) | LP_HEDGE | CFD | dealing | 2 | 5 | % | yes |
| `M2-CORR-004` | Corr Matrix Drift vs Baseline | MARKET_PRICING | CFD | pricing | 0.2 | 0.35 | Δρ |  |
| `M2-EQ-001` | Company Equity Drawdown | MARKET_PRICING | CFD | pricing | 3 | 5 | % | yes |
| `M2-FEED-003` | Stale Quote Symbols | MARKET_PRICING | CFD | pricing | 3 | 10 | symbols | yes |
| `M2-MKT-INTEL` | Market Intelligence High-Impact Hits (5m) | MARKET_PRICING | CFD+Crypto | pricing | 1 | 3 | hits/5m |  |
| `M2-NEWS-GROSS` | Gross Notional into Tier-1 News (USD) | MARKET_PRICING | CFD | pricing | 50000000 | 120000000 | USD |  |
| `M2-SLIP-021` | Avg Client Slippage (majors, 15m) | MARKET_PRICING | CFD | pricing | 2 | 3.5 | pips |  |
| `M2-VAR-002` | 1-day VaR Utilisation | MARKET_PRICING | CFD | pricing | 85 | 95 | % |  |
| `M2-GAP-012` | Estimated Gap Exposure (USD) | PRODUCT_CONFIG | CFD | pricing | 1000000 | 2000000 | USD |  |
| `M2-LEV-019` | New Accounts at Max Leverage (24h) | PRODUCT_CONFIG | CFD | pricing | 100 | 200 | accounts |  |
| `M2-SPREAD-005` | Spread vs Session Median Ratio | PRODUCT_CONFIG | CFD | pricing | 2 | 3 | x |  |
| `M2-SWAP-027` | Symbols with Swap vs Benchmark Δ | PRODUCT_CONFIG | CFD | pricing | 5 | 10 | symbols |  |
| `M2-XAU-247` | XAUUSD247 Net Exposure | PRODUCT_CONFIG | CFD | pricing | 10000 | 15000 | lots | yes |
| `M2-API-023` | Trading API Error Rate (5m) | TECH_INFRA | CFD+Crypto | shared | 2 | 5 | % |  |
| `M2-BRIDGE-LAT` | Bridge Fill Latency p95 | TECH_INFRA | CFD | shared | 120 | 250 | ms |  |
| `M2-KILL-COUNT` | Active Symbol Kill-Switches | TECH_INFRA | CFD+Crypto | shared | 2 | 5 | symbols |  |
| `M2-MT-DISC` | Trading Platform Disconnect Rate | TECH_INFRA | CFD+Crypto | shared | 1 | 5 | % |  |

### Dealing lens (23)

Indicators owned by Dealing / LP, shared domains, or on the INC-1028 forex demo book.

| Monitor ID | Name | Domain | Product | Owner BU | Warn | Breach | Unit | Forex demo |
|------------|------|--------|---------|----------|------|--------|------|------------|
| `M2-ARB-026` | Latency Arb Toxicity Score | CREDIT_CLIENT | CFD | dealing | 0.5 | 0.7 | score |  |
| `M2-COPY-009` | Top Signal Provider Copier Concentration | CREDIT_CLIENT | CFD | dealing | 15 | 25 | % |  |
| `M2-COPY-CHURN` | Copy Follower Net Exit (1h) | CREDIT_CLIENT | CFD | dealing | 12 | 25 | % |  |
| `M2-MRG-014` | Accounts >90% Margin Utilisation | CREDIT_CLIENT | CFD | dealing | 50 | 100 | count | yes |
| `M2-NBP-016` | Negative Balance Account Count | CREDIT_CLIENT | CFD | dealing | 2 | 5 | accounts |  |
| `M2-STOP-018` | Stop-out Count (5m window) | CREDIT_CLIENT | CFD | dealing | 20 | 40 | count/5m |  |
| `M2-BONUS-013` | Bonus Converted to Cash (24h USD) | FRAUD_CONDUCT | CFD | shared | 75000 | 150000 | USD |  |
| `M2-CHARGEBACK` | Payment Chargebacks (24h) | FRAUD_CONDUCT | CFD | shared | 15 | 40 | count/24h |  |
| `M2-FRAUD-011` | Multi-account Cluster Score | FRAUD_CONDUCT | CFD | shared | 0.7 | 0.85 | score |  |
| `M2-IB-PAYOUT` | IB Rebate Anomaly Score | FRAUD_CONDUCT | CFD | shared | 0.6 | 0.8 | score |  |
| `M2-PAY-017` | Payment Fraud Model Score | FRAUD_CONDUCT | CFD | shared | 0.65 | 0.8 | score |  |
| `M2-WASH-020` | Wash/Collusion Detection Score | FRAUD_CONDUCT | CFD+Crypto | shared | 0.55 | 0.75 | score |  |
| `M2-ABOOK-008` | A-book Volume Ratio (session) | LP_HEDGE | CFD | dealing | 40 | 30 | % |  |
| `M2-DISC-CUSUM-LP-REJECT-RATE` | LP Reject Rate (oneZero) CUSUM regime score | LP_HEDGE | CFD | dealing | 1 | 1.5 | score |  |
| `M2-HEDGE-007` | Hedge Coverage Ratio | LP_HEDGE | CFD | dealing | 85 | 70 | % | yes |
| `M2-LP-022` | LP Reject Rate (oneZero) | LP_HEDGE | CFD | dealing | 2 | 5 | % | yes |
| `M2-EQ-001` | Company Equity Drawdown | MARKET_PRICING | CFD | pricing | 3 | 5 | % | yes |
| `M2-FEED-003` | Stale Quote Symbols | MARKET_PRICING | CFD | pricing | 3 | 10 | symbols | yes |
| `M2-XAU-247` | XAUUSD247 Net Exposure | PRODUCT_CONFIG | CFD | pricing | 10000 | 15000 | lots | yes |
| `M2-API-023` | Trading API Error Rate (5m) | TECH_INFRA | CFD+Crypto | shared | 2 | 5 | % |  |
| `M2-BRIDGE-LAT` | Bridge Fill Latency p95 | TECH_INFRA | CFD | shared | 120 | 250 | ms |  |
| `M2-KILL-COUNT` | Active Symbol Kill-Switches | TECH_INFRA | CFD+Crypto | shared | 2 | 5 | symbols |  |
| `M2-MT-DISC` | Trading Platform Disconnect Rate | TECH_INFRA | CFD+Crypto | shared | 1 | 5 | % |  |

## Domain scenarios (37)

| Code | Name | Domain | Priority | Product | Primary indicators | Audience |
|------|------|--------|----------|---------|--------------------|----------|
| `SCN-CROSS-BOOK-CONTAGION` | Cross-book contagion into firm equity | SYSTEMIC_FIRM | P0 | CFD + Crypto | `M2-CROSS-BOOK`, `M2-EQ-001`, `M2-VAR-002` | admin, pricing, dealing |
| `SCN-NEWS-WINDOW-GROSS` | Tier-1 news window gross notional overload | SYSTEMIC_FIRM | P0 | CFD | `M2-NEWS-GROSS`, `M2-EQ-001` | admin, pricing, dealing |
| `SCN-MARGIN-UTIL-SPIKE` | Margin utilisation spike (≥100 accounts >90%) | CREDIT_CLIENT | P0 | CFD | `M2-MRG-014` | dealing, admin |
| `SCN-COPY-CONCENTRATION` | Copy provider concentration breach | CREDIT_CLIENT | P1 | CFD | `M2-COPY-009` | dealing, admin |
| `SCN-STOPOUT-VELOCITY` | Stop-out velocity surge (5-minute window) | CREDIT_CLIENT | P1 | CFD | `M2-STOP-018` | dealing, admin |
| `SCN-NEGATIVE-BALANCE` | Negative balance protection breach | CREDIT_CLIENT | P1 | CFD | `M2-NBP-016` | dealing, admin |
| `SCN-LATENCY-ARB` | Latency arbitrage / toxic flow | CREDIT_CLIENT | P2 | CFD | `M2-ARB-026` | dealing, admin |
| `SCN-COPY-CHURN` | Copy follower panic unwind | CREDIT_CLIENT | P2 | CFD | `M2-COPY-CHURN` | dealing, admin |
| `SCN-EQUITY-DRAWDOWN` | Company equity drawdown | MARKET_PRICING | P0 | CFD | `M2-EQ-001` | pricing, admin |
| `SCN-STALE-FEED` | Stale or crossed quote feed | MARKET_PRICING | P1 | CFD | `M2-FEED-003` | pricing, admin |
| `SCN-SLIPPAGE-SPIKE` | Client slippage spike on majors | MARKET_PRICING | P2 | CFD | `M2-SLIP-021` | pricing, admin |
| `SCN-VAR-CORR` | VaR utilisation and correlation break | MARKET_PRICING | P1 | CFD | `M2-VAR-002`, `M2-CORR-004` | pricing, admin |
| `SCN-MARKET-INTEL` | High-impact market intelligence hit | MARKET_PRICING | P1 | CFD + Crypto | `M2-MKT-INTEL` | pricing, admin |
| `SCN-LP-REJECT-STORM` | LP reject storm (oneZero / prime) | LP_HEDGE | P0 | CFD | `M2-LP-022` | dealing, admin |
| `SCN-HEDGE-COVERAGE` | Hedge coverage below target | LP_HEDGE | P1 | CFD | `M2-HEDGE-007` | dealing, admin |
| `SCN-ABOOK-RATIO` | A-book volume ratio collapse | LP_HEDGE | P2 | CFD | `M2-ABOOK-008` | dealing, admin |
| `SCN-HOT-WALLET` | Hot wallet float elevated | CRYPTO_EXCHANGE | P1 | Crypto | `M2-CRYPTO-WALLET` | admin, pricing, dealing |
| `SCN-CRYPTO-LIQ` | Liquidation engine backlog | CRYPTO_EXCHANGE | P0 | Crypto | `M2-CRYPTO-LIQ` | admin, pricing, dealing |
| `SCN-ORACLE-BASIS` | Mark oracle lag and perp basis blowout | CRYPTO_EXCHANGE | P1 | Crypto | `M2-CRYPTO-ORACLE`, `M2-PERP-BASIS` | admin, pricing, dealing |
| `SCN-FUNDING-STABLE` | Extreme funding and stablecoin depeg exposure | CRYPTO_EXCHANGE | P1 | Crypto | `M2-FUNDING-RATE`, `M2-STABLE-EXP` | admin, pricing, dealing |
| `SCN-CRYPTO-OI-DEP` | OI concentration and deposit spike | CRYPTO_EXCHANGE | P2 | Crypto | `M2-CRYPTO-OI`, `M2-CRYPTO-DEP` | admin, pricing, dealing |
| `SCN-CRYPTO-INSURANCE` | Insurance fund daily drawdown | CRYPTO_EXCHANGE | P1 | Crypto | `M2-CRYPTO-INS` | admin, pricing, dealing |
| `SCN-MULTI-ACCOUNT` | Multi-account fraud cluster | FRAUD_CONDUCT | P1 | CFD | `M2-FRAUD-011` | admin, pricing, dealing |
| `SCN-PAYMENT-CHARGEBACK` | Payment fraud and chargeback surge | FRAUD_CONDUCT | P1 | CFD | `M2-PAY-017`, `M2-CHARGEBACK` | admin, pricing, dealing |
| `SCN-WASH-IB` | Wash trading and IB rebate anomaly | FRAUD_CONDUCT | P2 | CFD + Crypto | `M2-WASH-020`, `M2-IB-PAYOUT` | admin, pricing, dealing |
| `SCN-BONUS-BURN` | Bonus converted to cash abuse | FRAUD_CONDUCT | P2 | CFD | `M2-BONUS-013` | admin, pricing, dealing |
| `SCN-XAU247` | XAUUSD247 net exposure overload | PRODUCT_CONFIG | P1 | CFD | `M2-XAU-247` | pricing, admin |
| `SCN-GAP-SPREAD-LEV` | Gap exposure, spread anomaly, max leverage onboard | PRODUCT_CONFIG | P2 | CFD | `M2-GAP-012`, `M2-SPREAD-005`, `M2-LEV-019` | pricing, admin |
| `SCN-SWAP-MISCONFIG` | Swap versus benchmark misconfiguration | PRODUCT_CONFIG | P3 | CFD | `M2-SWAP-027` | pricing, admin |
| `SCN-FUNDING-WD` | Funding exceptions and withdrawal velocity | OPS_PROCESS | P1 | CFD + Crypto | `M2-FUND-010`, `M2-WD-015` | admin, pricing, dealing |
| `SCN-RECON-BREAKS` | Open reconciliation breaks | OPS_PROCESS | P2 | CFD + Crypto | `M2-RECON-BRK` | admin, pricing, dealing |
| `SCN-BRIDGE-API` | Bridge latency and trading API errors | TECH_INFRA | P1 | CFD + Crypto | `M2-BRIDGE-LAT`, `M2-API-023` | admin, pricing, dealing |
| `SCN-PLATFORM-KILL` | Platform disconnects and active kill-switches | TECH_INFRA | P0 | CFD + Crypto | `M2-MT-DISC`, `M2-KILL-COUNT` | admin, pricing, dealing |
| `SCN-CAPITAL-SEG` | Entity capital buffer and client money segregation | REG_CAPITAL | P1 | CFD + Crypto | `M2-CAP-024`, `M2-SEG-025` | admin, pricing, dealing |
| `SCN-DETECTOR-DRIFT` | Detector precision drift / false positives | MODEL_AI | P2 | Platform | `M2-MODEL-006` | admin, pricing, dealing |
| `SCN-VENDOR-DEGRADED` | Critical vendor degraded or offline | THIRD_PARTY_VENDOR | P3 | CFD + Crypto | `M2-VENDOR-OUT` | admin, pricing, dealing |
| `SCN-COMPLAINT-SPIKE` | Client complaint velocity spike | REPUTATION_COMMS | P3 | CFD + Crypto | `M2-COMPLAINT` | admin, pricing, dealing |

### Admin audience (37)

| Code | Name | Domain | Priority | Product | Primary indicators | Audience |
|------|------|--------|----------|---------|--------------------|----------|
| `SCN-CROSS-BOOK-CONTAGION` | Cross-book contagion into firm equity | SYSTEMIC_FIRM | P0 | CFD + Crypto | `M2-CROSS-BOOK`, `M2-EQ-001`, `M2-VAR-002` | admin, pricing, dealing |
| `SCN-NEWS-WINDOW-GROSS` | Tier-1 news window gross notional overload | SYSTEMIC_FIRM | P0 | CFD | `M2-NEWS-GROSS`, `M2-EQ-001` | admin, pricing, dealing |
| `SCN-MARGIN-UTIL-SPIKE` | Margin utilisation spike (≥100 accounts >90%) | CREDIT_CLIENT | P0 | CFD | `M2-MRG-014` | dealing, admin |
| `SCN-COPY-CONCENTRATION` | Copy provider concentration breach | CREDIT_CLIENT | P1 | CFD | `M2-COPY-009` | dealing, admin |
| `SCN-STOPOUT-VELOCITY` | Stop-out velocity surge (5-minute window) | CREDIT_CLIENT | P1 | CFD | `M2-STOP-018` | dealing, admin |
| `SCN-NEGATIVE-BALANCE` | Negative balance protection breach | CREDIT_CLIENT | P1 | CFD | `M2-NBP-016` | dealing, admin |
| `SCN-LATENCY-ARB` | Latency arbitrage / toxic flow | CREDIT_CLIENT | P2 | CFD | `M2-ARB-026` | dealing, admin |
| `SCN-COPY-CHURN` | Copy follower panic unwind | CREDIT_CLIENT | P2 | CFD | `M2-COPY-CHURN` | dealing, admin |
| `SCN-EQUITY-DRAWDOWN` | Company equity drawdown | MARKET_PRICING | P0 | CFD | `M2-EQ-001` | pricing, admin |
| `SCN-STALE-FEED` | Stale or crossed quote feed | MARKET_PRICING | P1 | CFD | `M2-FEED-003` | pricing, admin |
| `SCN-SLIPPAGE-SPIKE` | Client slippage spike on majors | MARKET_PRICING | P2 | CFD | `M2-SLIP-021` | pricing, admin |
| `SCN-VAR-CORR` | VaR utilisation and correlation break | MARKET_PRICING | P1 | CFD | `M2-VAR-002`, `M2-CORR-004` | pricing, admin |
| `SCN-MARKET-INTEL` | High-impact market intelligence hit | MARKET_PRICING | P1 | CFD + Crypto | `M2-MKT-INTEL` | pricing, admin |
| `SCN-LP-REJECT-STORM` | LP reject storm (oneZero / prime) | LP_HEDGE | P0 | CFD | `M2-LP-022` | dealing, admin |
| `SCN-HEDGE-COVERAGE` | Hedge coverage below target | LP_HEDGE | P1 | CFD | `M2-HEDGE-007` | dealing, admin |
| `SCN-ABOOK-RATIO` | A-book volume ratio collapse | LP_HEDGE | P2 | CFD | `M2-ABOOK-008` | dealing, admin |
| `SCN-HOT-WALLET` | Hot wallet float elevated | CRYPTO_EXCHANGE | P1 | Crypto | `M2-CRYPTO-WALLET` | admin, pricing, dealing |
| `SCN-CRYPTO-LIQ` | Liquidation engine backlog | CRYPTO_EXCHANGE | P0 | Crypto | `M2-CRYPTO-LIQ` | admin, pricing, dealing |
| `SCN-ORACLE-BASIS` | Mark oracle lag and perp basis blowout | CRYPTO_EXCHANGE | P1 | Crypto | `M2-CRYPTO-ORACLE`, `M2-PERP-BASIS` | admin, pricing, dealing |
| `SCN-FUNDING-STABLE` | Extreme funding and stablecoin depeg exposure | CRYPTO_EXCHANGE | P1 | Crypto | `M2-FUNDING-RATE`, `M2-STABLE-EXP` | admin, pricing, dealing |
| `SCN-CRYPTO-OI-DEP` | OI concentration and deposit spike | CRYPTO_EXCHANGE | P2 | Crypto | `M2-CRYPTO-OI`, `M2-CRYPTO-DEP` | admin, pricing, dealing |
| `SCN-CRYPTO-INSURANCE` | Insurance fund daily drawdown | CRYPTO_EXCHANGE | P1 | Crypto | `M2-CRYPTO-INS` | admin, pricing, dealing |
| `SCN-MULTI-ACCOUNT` | Multi-account fraud cluster | FRAUD_CONDUCT | P1 | CFD | `M2-FRAUD-011` | admin, pricing, dealing |
| `SCN-PAYMENT-CHARGEBACK` | Payment fraud and chargeback surge | FRAUD_CONDUCT | P1 | CFD | `M2-PAY-017`, `M2-CHARGEBACK` | admin, pricing, dealing |
| `SCN-WASH-IB` | Wash trading and IB rebate anomaly | FRAUD_CONDUCT | P2 | CFD + Crypto | `M2-WASH-020`, `M2-IB-PAYOUT` | admin, pricing, dealing |
| `SCN-BONUS-BURN` | Bonus converted to cash abuse | FRAUD_CONDUCT | P2 | CFD | `M2-BONUS-013` | admin, pricing, dealing |
| `SCN-XAU247` | XAUUSD247 net exposure overload | PRODUCT_CONFIG | P1 | CFD | `M2-XAU-247` | pricing, admin |
| `SCN-GAP-SPREAD-LEV` | Gap exposure, spread anomaly, max leverage onboard | PRODUCT_CONFIG | P2 | CFD | `M2-GAP-012`, `M2-SPREAD-005`, `M2-LEV-019` | pricing, admin |
| `SCN-SWAP-MISCONFIG` | Swap versus benchmark misconfiguration | PRODUCT_CONFIG | P3 | CFD | `M2-SWAP-027` | pricing, admin |
| `SCN-FUNDING-WD` | Funding exceptions and withdrawal velocity | OPS_PROCESS | P1 | CFD + Crypto | `M2-FUND-010`, `M2-WD-015` | admin, pricing, dealing |
| `SCN-RECON-BREAKS` | Open reconciliation breaks | OPS_PROCESS | P2 | CFD + Crypto | `M2-RECON-BRK` | admin, pricing, dealing |
| `SCN-BRIDGE-API` | Bridge latency and trading API errors | TECH_INFRA | P1 | CFD + Crypto | `M2-BRIDGE-LAT`, `M2-API-023` | admin, pricing, dealing |
| `SCN-PLATFORM-KILL` | Platform disconnects and active kill-switches | TECH_INFRA | P0 | CFD + Crypto | `M2-MT-DISC`, `M2-KILL-COUNT` | admin, pricing, dealing |
| `SCN-CAPITAL-SEG` | Entity capital buffer and client money segregation | REG_CAPITAL | P1 | CFD + Crypto | `M2-CAP-024`, `M2-SEG-025` | admin, pricing, dealing |
| `SCN-DETECTOR-DRIFT` | Detector precision drift / false positives | MODEL_AI | P2 | Platform | `M2-MODEL-006` | admin, pricing, dealing |
| `SCN-VENDOR-DEGRADED` | Critical vendor degraded or offline | THIRD_PARTY_VENDOR | P3 | CFD + Crypto | `M2-VENDOR-OUT` | admin, pricing, dealing |
| `SCN-COMPLAINT-SPIKE` | Client complaint velocity spike | REPUTATION_COMMS | P3 | CFD + Crypto | `M2-COMPLAINT` | admin, pricing, dealing |

### Pricing audience (28)

| Code | Name | Domain | Priority | Product | Primary indicators | Audience |
|------|------|--------|----------|---------|--------------------|----------|
| `SCN-CROSS-BOOK-CONTAGION` | Cross-book contagion into firm equity | SYSTEMIC_FIRM | P0 | CFD + Crypto | `M2-CROSS-BOOK`, `M2-EQ-001`, `M2-VAR-002` | admin, pricing, dealing |
| `SCN-NEWS-WINDOW-GROSS` | Tier-1 news window gross notional overload | SYSTEMIC_FIRM | P0 | CFD | `M2-NEWS-GROSS`, `M2-EQ-001` | admin, pricing, dealing |
| `SCN-EQUITY-DRAWDOWN` | Company equity drawdown | MARKET_PRICING | P0 | CFD | `M2-EQ-001` | pricing, admin |
| `SCN-STALE-FEED` | Stale or crossed quote feed | MARKET_PRICING | P1 | CFD | `M2-FEED-003` | pricing, admin |
| `SCN-SLIPPAGE-SPIKE` | Client slippage spike on majors | MARKET_PRICING | P2 | CFD | `M2-SLIP-021` | pricing, admin |
| `SCN-VAR-CORR` | VaR utilisation and correlation break | MARKET_PRICING | P1 | CFD | `M2-VAR-002`, `M2-CORR-004` | pricing, admin |
| `SCN-MARKET-INTEL` | High-impact market intelligence hit | MARKET_PRICING | P1 | CFD + Crypto | `M2-MKT-INTEL` | pricing, admin |
| `SCN-HOT-WALLET` | Hot wallet float elevated | CRYPTO_EXCHANGE | P1 | Crypto | `M2-CRYPTO-WALLET` | admin, pricing, dealing |
| `SCN-CRYPTO-LIQ` | Liquidation engine backlog | CRYPTO_EXCHANGE | P0 | Crypto | `M2-CRYPTO-LIQ` | admin, pricing, dealing |
| `SCN-ORACLE-BASIS` | Mark oracle lag and perp basis blowout | CRYPTO_EXCHANGE | P1 | Crypto | `M2-CRYPTO-ORACLE`, `M2-PERP-BASIS` | admin, pricing, dealing |
| `SCN-FUNDING-STABLE` | Extreme funding and stablecoin depeg exposure | CRYPTO_EXCHANGE | P1 | Crypto | `M2-FUNDING-RATE`, `M2-STABLE-EXP` | admin, pricing, dealing |
| `SCN-CRYPTO-OI-DEP` | OI concentration and deposit spike | CRYPTO_EXCHANGE | P2 | Crypto | `M2-CRYPTO-OI`, `M2-CRYPTO-DEP` | admin, pricing, dealing |
| `SCN-CRYPTO-INSURANCE` | Insurance fund daily drawdown | CRYPTO_EXCHANGE | P1 | Crypto | `M2-CRYPTO-INS` | admin, pricing, dealing |
| `SCN-MULTI-ACCOUNT` | Multi-account fraud cluster | FRAUD_CONDUCT | P1 | CFD | `M2-FRAUD-011` | admin, pricing, dealing |
| `SCN-PAYMENT-CHARGEBACK` | Payment fraud and chargeback surge | FRAUD_CONDUCT | P1 | CFD | `M2-PAY-017`, `M2-CHARGEBACK` | admin, pricing, dealing |
| `SCN-WASH-IB` | Wash trading and IB rebate anomaly | FRAUD_CONDUCT | P2 | CFD + Crypto | `M2-WASH-020`, `M2-IB-PAYOUT` | admin, pricing, dealing |
| `SCN-BONUS-BURN` | Bonus converted to cash abuse | FRAUD_CONDUCT | P2 | CFD | `M2-BONUS-013` | admin, pricing, dealing |
| `SCN-XAU247` | XAUUSD247 net exposure overload | PRODUCT_CONFIG | P1 | CFD | `M2-XAU-247` | pricing, admin |
| `SCN-GAP-SPREAD-LEV` | Gap exposure, spread anomaly, max leverage onboard | PRODUCT_CONFIG | P2 | CFD | `M2-GAP-012`, `M2-SPREAD-005`, `M2-LEV-019` | pricing, admin |
| `SCN-SWAP-MISCONFIG` | Swap versus benchmark misconfiguration | PRODUCT_CONFIG | P3 | CFD | `M2-SWAP-027` | pricing, admin |
| `SCN-FUNDING-WD` | Funding exceptions and withdrawal velocity | OPS_PROCESS | P1 | CFD + Crypto | `M2-FUND-010`, `M2-WD-015` | admin, pricing, dealing |
| `SCN-RECON-BREAKS` | Open reconciliation breaks | OPS_PROCESS | P2 | CFD + Crypto | `M2-RECON-BRK` | admin, pricing, dealing |
| `SCN-BRIDGE-API` | Bridge latency and trading API errors | TECH_INFRA | P1 | CFD + Crypto | `M2-BRIDGE-LAT`, `M2-API-023` | admin, pricing, dealing |
| `SCN-PLATFORM-KILL` | Platform disconnects and active kill-switches | TECH_INFRA | P0 | CFD + Crypto | `M2-MT-DISC`, `M2-KILL-COUNT` | admin, pricing, dealing |
| `SCN-CAPITAL-SEG` | Entity capital buffer and client money segregation | REG_CAPITAL | P1 | CFD + Crypto | `M2-CAP-024`, `M2-SEG-025` | admin, pricing, dealing |
| `SCN-DETECTOR-DRIFT` | Detector precision drift / false positives | MODEL_AI | P2 | Platform | `M2-MODEL-006` | admin, pricing, dealing |
| `SCN-VENDOR-DEGRADED` | Critical vendor degraded or offline | THIRD_PARTY_VENDOR | P3 | CFD + Crypto | `M2-VENDOR-OUT` | admin, pricing, dealing |
| `SCN-COMPLAINT-SPIKE` | Client complaint velocity spike | REPUTATION_COMMS | P3 | CFD + Crypto | `M2-COMPLAINT` | admin, pricing, dealing |

### Dealing audience (29)

| Code | Name | Domain | Priority | Product | Primary indicators | Audience |
|------|------|--------|----------|---------|--------------------|----------|
| `SCN-CROSS-BOOK-CONTAGION` | Cross-book contagion into firm equity | SYSTEMIC_FIRM | P0 | CFD + Crypto | `M2-CROSS-BOOK`, `M2-EQ-001`, `M2-VAR-002` | admin, pricing, dealing |
| `SCN-NEWS-WINDOW-GROSS` | Tier-1 news window gross notional overload | SYSTEMIC_FIRM | P0 | CFD | `M2-NEWS-GROSS`, `M2-EQ-001` | admin, pricing, dealing |
| `SCN-MARGIN-UTIL-SPIKE` | Margin utilisation spike (≥100 accounts >90%) | CREDIT_CLIENT | P0 | CFD | `M2-MRG-014` | dealing, admin |
| `SCN-COPY-CONCENTRATION` | Copy provider concentration breach | CREDIT_CLIENT | P1 | CFD | `M2-COPY-009` | dealing, admin |
| `SCN-STOPOUT-VELOCITY` | Stop-out velocity surge (5-minute window) | CREDIT_CLIENT | P1 | CFD | `M2-STOP-018` | dealing, admin |
| `SCN-NEGATIVE-BALANCE` | Negative balance protection breach | CREDIT_CLIENT | P1 | CFD | `M2-NBP-016` | dealing, admin |
| `SCN-LATENCY-ARB` | Latency arbitrage / toxic flow | CREDIT_CLIENT | P2 | CFD | `M2-ARB-026` | dealing, admin |
| `SCN-COPY-CHURN` | Copy follower panic unwind | CREDIT_CLIENT | P2 | CFD | `M2-COPY-CHURN` | dealing, admin |
| `SCN-LP-REJECT-STORM` | LP reject storm (oneZero / prime) | LP_HEDGE | P0 | CFD | `M2-LP-022` | dealing, admin |
| `SCN-HEDGE-COVERAGE` | Hedge coverage below target | LP_HEDGE | P1 | CFD | `M2-HEDGE-007` | dealing, admin |
| `SCN-ABOOK-RATIO` | A-book volume ratio collapse | LP_HEDGE | P2 | CFD | `M2-ABOOK-008` | dealing, admin |
| `SCN-HOT-WALLET` | Hot wallet float elevated | CRYPTO_EXCHANGE | P1 | Crypto | `M2-CRYPTO-WALLET` | admin, pricing, dealing |
| `SCN-CRYPTO-LIQ` | Liquidation engine backlog | CRYPTO_EXCHANGE | P0 | Crypto | `M2-CRYPTO-LIQ` | admin, pricing, dealing |
| `SCN-ORACLE-BASIS` | Mark oracle lag and perp basis blowout | CRYPTO_EXCHANGE | P1 | Crypto | `M2-CRYPTO-ORACLE`, `M2-PERP-BASIS` | admin, pricing, dealing |
| `SCN-FUNDING-STABLE` | Extreme funding and stablecoin depeg exposure | CRYPTO_EXCHANGE | P1 | Crypto | `M2-FUNDING-RATE`, `M2-STABLE-EXP` | admin, pricing, dealing |
| `SCN-CRYPTO-OI-DEP` | OI concentration and deposit spike | CRYPTO_EXCHANGE | P2 | Crypto | `M2-CRYPTO-OI`, `M2-CRYPTO-DEP` | admin, pricing, dealing |
| `SCN-CRYPTO-INSURANCE` | Insurance fund daily drawdown | CRYPTO_EXCHANGE | P1 | Crypto | `M2-CRYPTO-INS` | admin, pricing, dealing |
| `SCN-MULTI-ACCOUNT` | Multi-account fraud cluster | FRAUD_CONDUCT | P1 | CFD | `M2-FRAUD-011` | admin, pricing, dealing |
| `SCN-PAYMENT-CHARGEBACK` | Payment fraud and chargeback surge | FRAUD_CONDUCT | P1 | CFD | `M2-PAY-017`, `M2-CHARGEBACK` | admin, pricing, dealing |
| `SCN-WASH-IB` | Wash trading and IB rebate anomaly | FRAUD_CONDUCT | P2 | CFD + Crypto | `M2-WASH-020`, `M2-IB-PAYOUT` | admin, pricing, dealing |
| `SCN-BONUS-BURN` | Bonus converted to cash abuse | FRAUD_CONDUCT | P2 | CFD | `M2-BONUS-013` | admin, pricing, dealing |
| `SCN-FUNDING-WD` | Funding exceptions and withdrawal velocity | OPS_PROCESS | P1 | CFD + Crypto | `M2-FUND-010`, `M2-WD-015` | admin, pricing, dealing |
| `SCN-RECON-BREAKS` | Open reconciliation breaks | OPS_PROCESS | P2 | CFD + Crypto | `M2-RECON-BRK` | admin, pricing, dealing |
| `SCN-BRIDGE-API` | Bridge latency and trading API errors | TECH_INFRA | P1 | CFD + Crypto | `M2-BRIDGE-LAT`, `M2-API-023` | admin, pricing, dealing |
| `SCN-PLATFORM-KILL` | Platform disconnects and active kill-switches | TECH_INFRA | P0 | CFD + Crypto | `M2-MT-DISC`, `M2-KILL-COUNT` | admin, pricing, dealing |
| `SCN-CAPITAL-SEG` | Entity capital buffer and client money segregation | REG_CAPITAL | P1 | CFD + Crypto | `M2-CAP-024`, `M2-SEG-025` | admin, pricing, dealing |
| `SCN-DETECTOR-DRIFT` | Detector precision drift / false positives | MODEL_AI | P2 | Platform | `M2-MODEL-006` | admin, pricing, dealing |
| `SCN-VENDOR-DEGRADED` | Critical vendor degraded or offline | THIRD_PARTY_VENDOR | P3 | CFD + Crypto | `M2-VENDOR-OUT` | admin, pricing, dealing |
| `SCN-COMPLAINT-SPIKE` | Client complaint velocity spike | REPUTATION_COMMS | P3 | CFD + Crypto | `M2-COMPLAINT` | admin, pricing, dealing |

## Skill playbooks (47)

| Skill code | Name | Primary monitor | Related | Owner dept |
|------------|------|-----------------|---------|------------|
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

## Linked scenario timelines (40)

| Code | Name | Monitors |
|------|------|----------|
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

## Where the lists come from

| Layer | Source |
|-------|--------|
| Indicators | SQLite `monitor_indicators` (+ `monitor-indicator-meta`) |
| Domain scenarios | `lib/ai/risk-domain-scenarios.ts` |
| Skill playbooks | `lib/ai/risk-scenarios-catalog.ts` → `/admin/skills` |
| Linked timelines | same catalog → Knowledge Tree |
| Forex pack | `lib/demo/forex-incident-1028.ts` |

## AI / LLM (real thinking each trigger)

| Trigger | Behaviour when `OPENAI_API_KEY` set (`CRMP_AI_LLM` not off) |
|---------|-------------------------------------------------------------|
| Discovery **Scan Now** | Stat/ML on live SQLite window; unique `scan_seed` + thinking trail |
| Discovery **Analyse** | Auto LIVE OpenAI; fresh `ANL-*` thinking each call |
| Alert **AI RCA** | Heuristic first, then OpenAI rewrite with thinking evidence |
| Run detectors / Monitor run | New analyses LLM-enriched after the batch |
| Home **dummy spine** | Enrich after RCA when keyed |
| Desk selection chat | Heuristic grounded reply, then OpenAI rewrite |

Failures fall back to heuristic / MOCK — they never block the desk.
