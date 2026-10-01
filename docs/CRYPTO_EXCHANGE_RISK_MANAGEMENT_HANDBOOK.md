# Crypto Exchange Risk Management — BU User Handbook

**Audience:** Business Unit Persons-in-Charge (BU PICs), Risk Officers (RO), Product, Trading Ops, Engineering, Compliance, Treasury, Listing, Custody  
**Scope:** Spot · Cross/Isolated Margin · USDⓈ-M & COIN-M Perpetuals (and dated futures where noted)  
**Version:** 1.3 · **Owner:** Chief Risk Officer (2nd line) · **Review cycle:** Quarterly or after material incident  
**Languages:** English (below) · [简体中文完整译本](#语言--language)（文末附录）  

> This handbook is the **operating playbook** for who owns what, how work is divided, standard operating procedures (SOPs), consoles/admin pages, indicators/thresholds/actions, scenario diagnostics, and day-to-day tools. It does not replace legal policy, limit books, or regulatory filings.  
> **Thresholds below are illustrative defaults** for a Tier-1 exchange risk framework — calibrate to your Limit Book; do not copy into production without RO dual-approval.

---

## Table of contents

1. [How to use this handbook](#1-how-to-use-this-handbook)
2. [Three lines of defence & role map](#2-three-lines-of-defence--role-map)
3. [Instrument primers (Spot / Margin / Perps)](#3-instrument-primers-spot--margin--perps)
4. [BU-by-BU playbooks](#4-bu-by-bu-playbooks)
5. [Cross-BU RACI matrix](#5-cross-bu-raci-matrix)
6. [Global SOPs (shared)](#6-global-sops-shared)
7. [Admin pages & tool catalogue](#7-admin-pages--tool-catalogue)
8. [Limits, KRIs, thresholds, actions & escalation](#8-limits-kris-thresholds-actions--escalation)
9. [Risk scenario diagnostics (RAG + time sequence)](#9-risk-scenario-diagnostics-rag--time-sequence)
10. [Incident severity & war room](#10-incident-severity--war-room)
11. [Appendix — glossary & checklists](#11-appendix--glossary--checklists)
12. [简体中文完整译本](#语言--language)

---

## 1. How to use this handbook

| If you are… | Read first |
|-------------|------------|
| New BU PIC | §§2–4 for your BU + §7 tools |
| Risk Officer / Risk Ops | Full doc; own §8 catalogue, §9 scenarios & §10 incidents |
| Product (Spot / Margin / Futures) | §3 + your product BU chapter + listing SOPs |
| Eng / SRE (Matching, Risk Engine, Wallet) | Your tech BU chapter + failover SOPs |
| Compliance / Surveillance | Compliance BU + market-abuse SOPs |
| Listing / Delisting PIC | Listing BU chapter end-to-end |

**Golden rules**

1. **No silent limit changes** — every hard limit change is ticketed, dual-approved, and audited.
2. **Segregation of duties** — requester ≠ approver; maker ≠ checker for Tier-A changes.
3. **Instrument-aware** — Spot ≠ Margin ≠ Perps. Controls, liquidation, and insurance differ; do not copy-paste configs.
4. **Pre-trade / at-trade / post-trade** — every material risk has at least one control in each layer where feasible.
5. **Client assets first** — wallet/custody and withdrawal integrity outrank revenue features under stress.

---

## 2. Three lines of defence & role map

### 2.1 Lines of defence

| Line | Who | Mandate |
|------|-----|---------|
| **1st** | Product BUs, Trading Ops, Matching Eng, Wallet Ops, Listing, Market Making Ops | Own risk in BAU; operate controls; escalate breaches |
| **2nd** | Market Risk, Credit/Liquidation Risk, Model Risk, Compliance, Legal | Set appetite & policy; challenge; independent monitoring |
| **3rd** | Internal Audit | Independent assurance of design & operating effectiveness |

### 2.2 Standard role codes (used in tickets & admin ACLs)

| Code | Role | Typical BU |
|------|------|------------|
| **CRO** | Chief Risk Officer | Risk |
| **RO** | Risk Officer (2nd line) | Risk |
| **RO-OPS** | Risk Operations (24×7) | Risk Ops |
| **PM** | Product Manager | Spot / Margin / Futures Product |
| **TO** | Trading Operations | Trading Ops |
| **ME** | Matching Engine PIC | Matching / Exchange Core |
| **RE** | Risk Engine PIC | Risk Systems |
| **WO** | Wallet / Custody Ops | Custody |
| **LI** | Listing PIC | Listing & Token Due Diligence |
| **CP** | Compliance / Surveillance | Compliance |
| **TS** | Treasury / Settlement | Treasury |
| **MM** | Market Making / Liquidity Ops | Liquidity |
| **ENG** | Engineering on-call | Platform |
| **SRE** | Site Reliability | Infra |
| **DA** | Data / Quant / Model | Risk Quant |
| **TR** | Internal trader / VIP desk (if any) | Proprietary / VIP |

---

## 3. Instrument primers (Spot / Margin / Perps)

Use this section when configuring limits, writing SOPs, or deciding which admin page applies.

### 3.1 Spot

| Topic | Risk relevance |
|-------|----------------|
| **What it is** | Immediate buy/sell of base/quote; no leverage on the instrument itself |
| **Primary risks** | Market manipulation, fat-finger, listing quality, wallet settlement, fiat rail |
| **Key controls** | Price bands, max order size, self-trade prevention, trading halt, deposit/withdraw gates |
| **No liquidation engine** | Client loss is limited to paid amount (except deposit/withdraw errors) |
| **Admin focus** | Symbol config, fee tiers, STP, halt/resume, ticker metadata |

### 3.2 Margin (Cross & Isolated)

| Topic | Risk relevance |
|-------|----------------|
| **What it is** | Borrowed funds to amplify spot exposure; interest accrues on loans |
| **Isolated** | Margin & liquidation scoped to one position/pair |
| **Cross** | Shared collateral across positions; contagion within account |
| **Primary risks** | Credit/borrow default, liquidation shortfall, interest misconfig, collateral haircut error |
| **Key controls** | LTV / margin ratio, borrow caps per asset, interest rate curves, liquidation waterfall, negative-balance auto-repay |
| **Admin focus** | Collateral tiers, borrow whitelist, LTV brackets, interest config, forced liquidation console |

### 3.3 Perpetual futures (USDⓈ-M / COIN-M)

| Topic | Risk relevance |
|-------|----------------|
| **What it is** | Leveraged derivatives with no expiry; funding exchanges long↔short |
| **Mark vs last** | Mark price drives unrealized PnL & liquidation; last price for trading |
| **Primary risks** | Leverage cascades, insurance fund drain, mark/index manipulation, funding extremes, ADL |
| **Key controls** | Max leverage by tier, position notional caps, price index multi-exchange, funding caps, insurance fund, ADL queue |
| **Admin focus** | Leverage brackets, risk limits, funding formula, insurance fund MI, ADL/auto-deleveraging console, circuit breakers |

### 3.4 Instrument comparison (ops cheat sheet)

| Dimension | Spot | Margin | Perps |
|-----------|------|--------|-------|
| Leverage | 1× | Configurable (e.g. up to 5–10×) | Tiered (e.g. up to 20–125× by VIP/notional) |
| Liquidation | N/A | Margin call → force sell | Margin ratio → force close → ADL |
| Insurance | N/A / platform ops | Partial (loan loss) | Insurance fund + ADL |
| Index critical? | Low–med | Medium | **Critical** |
| Funding | N/A | Interest on borrow | Periodic funding rate |
| Halt impact | Book frozen | Borrow + liquidations may continue under SOP | Liquidations/funding continue under SOP |
| Typical KRI | Cancel/fill ratio, halt count | Borrow util, liquidation volume, bad debt | Insurance balance, ADL events, basis, mark–index gap |

---

## 4. BU-by-BU playbooks

Each chapter follows the same template:

- **In scope / out of scope**
- **Job division**
- **SOPs (named)**
- **Useful tools**
- **Admin pages**
- **Handoffs**

---

### 4.1 Market Risk & Risk Ops (2nd line) — RO / RO-OPS / CRO

#### In scope
- Enterprise risk appetite, limit books (Spot / Margin / Perps)
- Real-time monitoring of VaR-style desk metrics, concentration, leverage utilisation
- Liquidation / insurance / ADL oversight (challenge 1st line)
- Stress testing & scenario catalogue approval
- New-product risk sign-off; listing risk opinion
- Breach investigation, waiver governance, daily risk pack

#### Out of scope
- Day-to-day matching engine tuning (ME)
- Hot-wallet signing operations (WO)
- KYC onboarding decisions (CP) — except when risk-holds apply

#### Job division

| Role | Owns |
|------|------|
| CRO | Appetite, board pack, material waivers |
| RO (Market) | Perps/spot market risk limits, stress catalogue |
| RO (Credit/Liq) | Margin LTV, borrow caps, liquidation params, insurance fund policy |
| RO-OPS | 24×7 alert ACK, first triage, escalate Sev-1/2 |
| DA | Models, mark/index methodology challenge, stress engines |

#### SOPs
| ID | Name | Trigger |
|----|------|---------|
| RM-01 | Daily risk MI pack | Every UTC cutoff |
| RM-02 | Soft-limit WARN response | Alert WARN |
| RM-03 | Hard-limit BREACH response | Alert BREACH |
| RM-04 | Leverage / rights increase approval | Trader or VIP request |
| RM-05 | Stress catalogue change | Model or scenario edit |
| RM-06 | Insurance fund draw review | Any insurance payout / ADL |
| RM-07 | Trading halt recommendation | Gap, oracle fail, cascade |

#### Useful tools
- Risk metrics monitor (realtime alerts: equity, PnL, DD, VaR, concentration)
- Stress testing / what-if console
- Risk reporting & CSV export
- Liquidation & insurance fund dashboards
- Limit request / trader-rights workflow (maker–checker)

#### Admin pages
| Page | Purpose | ACL |
|------|---------|-----|
| `/admin/risk/limits` | Soft/hard thresholds by instrument & VIP tier | RO + checker |
| `/admin/risk/alerts` | ACK / assign / escalate | RO-OPS |
| `/admin/risk/stress` | Run scenarios; publish catalogue | RO + DA |
| `/admin/risk/insurance` | Fund balance, payouts, ADL log | RO (Credit) |
| `/admin/risk/reports` | Schedule daily/weekly packs | RO |
| `/admin/risk/waivers` | Temporary limit waivers with expiry | CRO/RO dual |

#### Handoffs
- To ME/TO: halt/resume recommendations  
- To RE: push approved limit configs  
- To CP: suspected manipulation during breach  
- To Product: new-product conditions / go-live gates  

---

### 4.2 Spot Product & Trading Ops — PM-SPOT / TO

#### In scope
- Spot symbol lifecycle ops (post-listing config)
- Fee tiers, order types, STP, price protection bands
- Spot trading halt/resume execution (with Risk/ME)
- Spot market quality KRIs (spread, depth, cancel ratio)
- User education copy for risk disclosures (with Legal)

#### Out of scope
- Margin LTV / borrow interest (Margin BU)
- Perps funding / insurance (Futures BU)
- On-chain custody keys (Wallet)

#### Job division

| Role | Owns |
|------|------|
| PM-SPOT | Product rules, fee experiments, UX risk disclosures |
| TO | Halt/resume execution, symbol flags, VIP order exceptions |
| MM liaison | Depth SLAs, MM agreement breaches |

#### SOPs
| ID | Name | Trigger |
|----|------|---------|
| SP-01 | Spot symbol go-live checklist | New listing |
| SP-02 | Spot trading halt | Index fail / fat-finger / regulatory |
| SP-03 | Spot resume | RO + ME clearance |
| SP-04 | Price band / max notional change | Volatility regime change |
| SP-05 | Wash / self-trade investigation handoff | Surveillance alert |

#### Useful tools
- Spot order-book health dashboard
- Halt/resume console
- Fee & VIP tier admin
- Market quality report (spread, depth @ 1%/2%)

#### Admin pages
| Page | Purpose |
|------|---------|
| `/admin/spot/symbols` | Enable/disable, tick size, lot size, filters |
| `/admin/spot/bands` | Price protection / percentage bands |
| `/admin/spot/halt` | Halt reasons + audit trail |
| `/admin/spot/fees` | Maker/taker & VIP schedule |
| `/admin/spot/stp` | Self-trade prevention modes |

#### Handoffs
- Listing → Spot PM for go-live  
- Risk → TO for halt authority  
- Wallet → TO for deposit-only / withdraw-only modes during incidents  

---

### 4.3 Margin Product & Credit Ops — PM-MARGIN / RO-CREDIT / TO

#### In scope
- Cross & Isolated margin product rules
- Collateral whitelist, haircuts, LTV brackets
- Borrow caps (asset & user tier), interest curves
- Margin call / liquidation parameters & messaging
- Bad-debt / negative-balance remediation
- Margin stress (collateral crash + borrow squeeze)

#### Out of scope
- Perps position limits (Futures)
- Spot-only symbol listing (Listing / Spot)

#### Job division

| Role | Owns |
|------|------|
| PM-MARGIN | Product UX, modes (cross/isolated), feature flags |
| RO-CREDIT | Haircuts, LTV, borrow caps, liquidation buffer |
| TO | Force liquidation ops, borrow freeze |
| TS | Interest accrual accounting, bad-debt booking |

#### SOPs
| ID | Name | Trigger |
|----|------|---------|
| MG-01 | Add collateral asset | Listing + risk opinion |
| MG-02 | Haircut / LTV change | Volatility or governance |
| MG-03 | Borrow freeze (asset) | Liquidity crunch / depeg |
| MG-04 | Forced liquidation runbook | Cascade / engine lag |
| MG-05 | Bad debt write-off / recovery | Post-liquidation shortfall |
| MG-06 | Interest curve update | Funding cost / peg risk |

#### Useful tools
- Margin utilisation heat map (by asset)
- Liquidation proximity monitor
- Borrow outstanding vs inventory
- Stress tool with collateral shock + depeg paths
- EOD recon for loans vs ledger

#### Admin pages
| Page | Purpose |
|------|---------|
| `/admin/margin/collateral` | Whitelist, haircut, tier |
| `/admin/margin/ltv` | Initial / maintenance / liquidation ratios |
| `/admin/margin/borrow` | Caps, VIP multipliers, freeze |
| `/admin/margin/interest` | Curves, accrual schedule |
| `/admin/margin/liquidation` | Queue, manual force-close, pause flag |
| `/admin/margin/bad-debt` | Cases, recovery, P&L booking |

#### Handoffs
- To Futures: shared collateral / unified account design changes  
- To Wallet: asset delist → repay & withdraw sequencing  
- To Risk: any bad debt > materiality threshold  

---

### 4.4 Futures / Perps Product & Liquidation Ops — PM-FUT / RO / TO-FUT

#### In scope
- USDⓈ-M and COIN-M perpetuals (and dated futures if live)
- Leverage brackets, position & notional limits
- Mark price / index constituents & deviation alerts
- Funding rate formula, caps, and settlement ops
- Insurance fund policy ops; ADL configuration
- Perps circuit breakers, impact buffers, reduce-only modes

#### Out of scope
- Spot matching fairness (ME, but shared engines possible)
- Margin borrow interest (Margin BU)

#### Job division

| Role | Owns |
|------|------|
| PM-FUT | Contract specs, leverage UX, funding display |
| RO | Brackets, insurance, ADL policy, mark methodology approval |
| TO-FUT | Emergency reduce-only, funding pause (rare), ADL monitoring |
| DA | Index construction, basis/funding analytics |
| RE | Engine params push after approval |

#### SOPs
| ID | Name | Trigger |
|----|------|---------|
| PF-01 | New perp contract launch | Listing + risk sign-off |
| PF-02 | Leverage bracket change | Volatility / VIP policy |
| PF-03 | Mark–index deviation response | Gap > threshold |
| PF-04 | Funding extreme / pause playbook | Funding > cap or oracle fail |
| PF-05 | Insurance fund payout review | Liquidation bankruptcy |
| PF-06 | ADL activation review | Insurance insufficient |
| PF-07 | Perps trading halt / reduce-only | Cascade or infra fail |
| PF-08 | Multi-exchange index constituent outage | Venue down |

#### Useful tools
- Mark vs index vs last price monitor
- Open interest / leverage heat map
- Liquidation calendar / burst monitor
- Insurance fund P&L and coverage ratio
- ADL queue viewer
- Basis & funding analytics
- Stress: spot shock → perp equity → margin shortfall

#### Admin pages
| Page | Purpose |
|------|---------|
| `/admin/futures/contracts` | Specs, tick, contract size, status |
| `/admin/futures/leverage` | Brackets by notional & VIP |
| `/admin/futures/risk-limits` | Position, OI, user notional caps |
| `/admin/futures/mark-index` | Constituents, weights, protection |
| `/admin/futures/funding` | Formula, interval, caps, manual settle |
| `/admin/futures/insurance` | Balances, injections, payouts |
| `/admin/futures/adl` | Ranking, dry-run, enable/disable |
| `/admin/futures/breaker` | Circuit breaker & impact buffer |

#### Handoffs
- To ME: halt matching while liquidations drain under SOP  
- To Risk: Sev-1 if insurance coverage ratio < policy floor  
- To CP: suspected index manipulation  

---

### 4.5 Matching Engine & Exchange Core — ME / SRE / ENG

#### In scope
- Order matching correctness, latency SLOs, fairness
- Failover / DR / dual-site consistency
- Kill switches, cancel-on-disconnect, STP mechanics
- Capacity (cancel storms, burst liquidations)
- Symbol sharding & rate limits

#### Out of scope
- Economic risk appetite (Risk)
- Custody keys (Wallet)

#### Job division

| Role | Owns |
|------|------|
| ME PIC | Matching rules, release notes, config ownership |
| SRE | Availability, DR drills, capacity |
| ENG on-call | Incident fix, rollback |

#### SOPs
| ID | Name | Trigger |
|----|------|---------|
| ME-01 | Engine deploy / rollback | Release |
| ME-02 | Matching halt (global or symbol) | Sev-1 integrity |
| ME-03 | Dual-site failover | Primary loss |
| ME-04 | Cancel storm mitigation | Rate > SLO |
| ME-05 | Post-incident book rebuild verify | After failover |

#### Useful tools
- Matching latency & drop dashboards
- Order/trade recon vs clearing
- Chaos / load test harness
- Kill-switch panel

#### Admin pages
| Page | Purpose |
|------|---------|
| `/admin/engine/status` | Shard health, lag, mode |
| `/admin/engine/kill` | Kill switch (dual control) |
| `/admin/engine/rate-limits` | IP/UID/API weights |
| `/admin/engine/stp` | Engine-level STP |
| `/admin/engine/failover` | Site preference, drain |

#### Handoffs
- TO / Risk approve business halt reasons  
- RE notified so liquidations pause/resume consistently  

---

### 4.6 Risk Engine, Clearing & Liquidation Systems — RE / DA

#### In scope
- Margin ratio calculation, bankruptcy price, liquidation engine
- Limit enforcement at-trade (pre-trade checks where applicable)
- Push of approved risk configs to production
- Reconciliation of risk state vs matching vs wallet ledger
- Unified account / portfolio margin engines (if live)

#### Out of scope
- Setting appetite numbers without RO approval

#### Job division

| Role | Owns |
|------|------|
| RE PIC | Engine config deployment, feature flags |
| DA | Formula correctness, backtests |
| ENG | Performance & data pipelines |

#### SOPs
| ID | Name | Trigger |
|----|------|---------|
| RE-01 | Config promote (limits → prod) | After RO dual-approval |
| RE-02 | Liquidation engine pause/resume | Cascade control |
| RE-03 | Mark price feed failover | Oracle/index issue |
| RE-04 | Risk state rebuild | Desync detected |
| RE-05 | Portfolio-margin model change | Model governance |

#### Useful tools
- Config versioning & diff viewer
- Liquidation simulator (dry-run)
- Risk state vs ledger recon
- Repo modules: `risk_metrics_monitor.py`, `stress_testing.py`, `trader_rights_workflow.py`

#### Admin pages
| Page | Purpose |
|------|---------|
| `/admin/risk-engine/configs` | Versioned params, promote/rollback |
| `/admin/risk-engine/liq` | Pause, speed, batch size |
| `/admin/risk-engine/feeds` | Mark/index health |
| `/admin/risk-engine/sim` | What-if liquidation |

---

### 4.7 Wallet, Custody & Withdrawals — WO / TS / SRE

#### In scope
- Hot / warm / cold / MPC key ops
- Deposit attribution, travel-rule, withdraw screening hooks
- Chain finality, reorg handling, wrong-chain playbooks
- Liquidity buffers for withdrawals (run risk)
- PoR / liabilities reconciliation support

#### Out of scope
- Trading limit policy (Risk)
- Token fundamental diligence (Listing) — except contract deposit/withdraw technical review

#### Job division

| Role | Owns |
|------|------|
| WO | Operational custody runbooks, address ops |
| TS | Fiat + crypto liquidity buffer policy with Risk |
| SRE/Security | HSM/MPC controls, access |

#### SOPs
| ID | Name | Trigger |
|----|------|---------|
| WA-01 | Hot wallet top-up | Below buffer |
| WA-02 | Withdrawal queue / slow mode | Run risk / attack |
| WA-03 | Chain halt / reorg | Node alerts |
| WA-04 | Wrong deposit recovery | User ticket |
| WA-05 | Key ceremony / rotation | Schedule or incident |
| WA-06 | PoR snapshot | Periodic / attestation |

#### Useful tools
- Wallet balance vs ledger recon (`eod_reconciliation.py` pattern)
- Withdrawal backlog & aging
- Chain health monitors
- Address allowlist / whitelist admin for VIP

#### Admin pages
| Page | Purpose |
|------|---------|
| `/admin/wallet/balances` | Hot/cold by asset |
| `/admin/wallet/withdraw` | Queue, hold, release, slow mode |
| `/admin/wallet/deposit` | Crediting rules, memo/tag |
| `/admin/wallet/keys` | Ceremony logs (highly restricted) |
| `/admin/wallet/chains` | Enable/disable network |

---

### 4.8 Listing, Delisting & Token Due Diligence — LI / RO / CP / Legal

#### In scope
- New spot pairs, margin eligibility, perp contracts
- Contract risk (mint, upgrade, pause, blacklist)
- Liquidity & unlock analysis; seed/monitoring tags
- Delisting playbooks across Spot / Margin / Perps
- Rebrand / migration / ticker collision

#### Out of scope
- Day-2 fee tuning (Product)
- Insurance fund sizing (Risk owns policy)

#### Job division

| Role | Owns |
|------|------|
| LI | Diligence pack, project liaison |
| RO | Risk opinion (market/credit/manipulation) |
| CP | Sanctions / securities classification flags |
| Legal | Opinion on legal form |
| PM (Spot/Margin/Fut) | Go-live product checklist |

#### SOPs
| ID | Name | Trigger |
|----|------|---------|
| LD-01 | Listing risk opinion | New asset/contract |
| LD-02 | Seed tag / monitoring tag | Elevated risk |
| LD-03 | Margin eligibility decision | Post-spot listing |
| LD-04 | Perp listing decision | OI demand + risk |
| LD-05 | Delist sequence (Spot) | Criteria breach |
| LD-06 | Delist sequence (Margin) | Force repay → disable borrow → delist |
| LD-07 | Delist sequence (Perps) | Reduce-only → settle → delist |
| LD-08 | Emergency delist / halt | Exploit / fraud |

#### Useful tools
- Diligence checklist workspace
- Holder concentration & unlock calendar
- Contract scanner / audit repository
- Cross-venue liquidity & manipulation screens

#### Admin pages
| Page | Purpose |
|------|---------|
| `/admin/listing/pipeline` | Stages, owners, SLA |
| `/admin/listing/tags` | Seed / monitoring / caution |
| `/admin/listing/delist` | Notices, timelines, force actions |
| `/admin/listing/migrations` | Rebrand / contract swap |

**Delist sequencing (mandatory order)**  
1. Risk + Legal + CP approve  
2. **Perps:** reduce-only → flatten / expiry SOP → delist contract  
3. **Margin:** freeze borrow → force repay / liquidate → remove collateral  
4. **Spot:** halt if needed → trading off → withdrawals remain per WA SOP  
5. Comms templates issued; support macros updated  

---

### 4.9 Compliance, Surveillance & Market Abuse — CP

#### In scope
- KYC/AML, sanctions, travel rule
- Trade surveillance (spoofing, layering, wash, insider)
- Market abuse investigations across Spot / Margin / Perps
- Regulatory reporting liaison
- Hard holds that block leverage / withdraw / trade

#### Out of scope
- Setting economic leverage brackets (RO) — CP can impose hard holds

#### SOPs
| ID | Name | Trigger |
|----|------|---------|
| CP-01 | Surveillance alert triage | Alert |
| CP-02 | Account hard hold | Confirmed suspicion |
| CP-03 | Cross-product abuse review | Spot+Perps pattern |
| CP-04 | Reg request / freeze | External order |

#### Admin pages
| Page | Purpose |
|------|---------|
| `/admin/compliance/surveillance` | Cases, replay |
| `/admin/compliance/holds` | Trade/withdraw/leverage holds |
| `/admin/compliance/kyb-kyc` | Restricted views |
| `/admin/compliance/sanctions` | Screening overrides (dual control) |

---

### 4.10 Treasury, Settlement & Banking — TS

#### In scope
- Fiat corridors, banking concentration
- Corporate treasury (not client trading risk)
- Settlement after recon approval
- Insurance fund / SAFU cash management under policy
- Stablecoin inventory & redemption playbooks

#### SOPs
| ID | Name | Trigger |
|----|------|---------|
| TS-01 | Banking corridor outage | Partner down |
| TS-02 | Stablecoin depeg response | Peg break |
| TS-03 | Settlement after EOD recon | Daily |
| TS-04 | Insurance fund injection | Board/CRO approved |

#### Admin pages
| `/admin/treasury/balances`, `/admin/treasury/settlement`, `/admin/treasury/stablecoins`

---

### 4.11 Liquidity / Market Making Ops — MM

#### In scope
- MM agreement SLAs (depth, spread, uptime) for Spot & Perps
- Inventory & adverse selection monitoring
- Cross-venue arb inventory risk if MM is internal/affiliated (Chinese walls with Risk)

#### SOPs
| ID | Name | Trigger |
|----|------|---------|
| MM-01 | SLA breach escalation | Depth/spread fail |
| MM-02 | Vol regime quote widen | Stress |
| MM-03 | Conflict / information barrier check | New listing / prop overlap |

#### Admin pages
| `/admin/mm/sla`, `/admin/mm/inventory`, `/admin/mm/agreements`

---

### 4.12 Platform Engineering, Security & Data — ENG / SRE / Security / DA

#### In scope
- Secure SDLC, access control, audit logs for all admin pages
- Data pipelines feeding risk (marks, positions, fills)
- Bug bounty / pen-test remediation tracking
- Model & report automation (`risk_reporting.py`, recon, stress)

#### SOPs
| ID | Name | Trigger |
|----|------|---------|
| ENG-01 | Privileged admin access grant | Joiner/mover |
| ENG-02 | Audit log immuntability check | Periodic |
| ENG-03 | Pipeline lag incident | Risk feed late |
| ENG-04 | Security incident (key/API) | Compromise |

---

## 5. Cross-BU RACI matrix

**R** = Responsible · **A** = Accountable · **C** = Consulted · **I** = Informed

| Activity | Spot PM/TO | Margin | Futures | ME | RE | Wallet | Listing | Risk | CP | Treasury |
|----------|------------|--------|---------|----|----|--------|---------|------|----|----------|
| Spot halt/resume | **R** | I | I | **R** | C | C | I | **A** | C | I |
| Margin LTV change | I | **R** | C | I | **R** | I | C | **A** | C | I |
| Perps leverage bracket | I | C | **R** | I | **R** | I | C | **A** | C | I |
| New listing go-live | C | C | C | C | C | C | **R** | **A** | **R** | I |
| Delist (multi-product) | **R** | **R** | **R** | C | C | **R** | **A** | **A** | **R** | C |
| Insurance payout | I | C | **R** | I | C | I | I | **A** | I | **R** |
| ADL event | I | I | **R** | I | **R** | I | I | **A** | I | I |
| Withdraw slow-mode | I | I | I | I | I | **R** | I | **A** | C | **R** |
| Mark/index change | I | C | **R** | I | **R** | I | C | **A** | C | I |
| Surveillance hard hold | C | C | C | I | C | C | I | C | **A/R** | I |
| EOD trade recon | C | C | C | C | C | C | I | C | I | **A** + Ops **R** |
| Stress catalogue | C | C | C | I | C | I | C | **A** | I | I |
| Trader rights / leverage up | C | C | C | I | **R** | I | I | **A** | **C** | I |

---

## 6. Global SOPs (shared)

### 6.1 SOP-G01 — Limit change (all instruments)

1. Requester opens ticket with instrument (**SPOT / MARGIN / PERP**), symbol/contract, old→new values, rationale, stress impact.  
2. SYS builds eligibility / impact packet (utilisation, recent breaches, stress delta).  
3. **Maker (RO)** approves or rejects.  
4. If Tier A+ (materiality): **Checker (RO2 or CRO)** four-eyes.  
5. RE promotes config; ME/Product ACK.  
6. RO-OPS monitors 24h hypercare.  
7. Ticket closed with config version hash.

### 6.2 SOP-G02 — Trading halt (Spot vs Perps)

| Step | Spot | Perps / Margin |
|------|------|----------------|
| 1 | TO proposes; RO approves | TO-FUT / Margin TO proposes; RO approves |
| 2 | ME halts matching | ME may halt **orders**; liquidations follow RE SOP |
| 3 | Wallet: usually keep withdraw unless CP/Risk says otherwise | Same; consider borrow freeze (MG-03) |
| 4 | Comms + support macros | Comms must mention funding/liquidation behaviour |
| 5 | Resume only with RO + ME + Product | Resume with RO + RE mark-feed healthy |

### 6.3 SOP-G03 — Alert ACK (WARN / BREACH)

1. RO-OPS ACKs within SLA (e.g. WARN 15m / BREACH 5m).  
2. Classify: data quality vs real risk.  
3. If real BREACH: contain (reduce-only, freeze borrow, halt) per playbook.  
4. Page BU PIC + CRO for Sev-1.  
5. Post-mortem within 5 business days for Sev-1/2.

### 6.4 SOP-G04 — Maker–checker & segregation

- Trader cannot approve own leverage/rights.  
- Config deployer ≠ sole approver for Tier A.  
- Wallet key ceremony requires multi-party.  
- Compliance hold removal requires dual control.

### 6.5 SOP-G05 — EOD reconciliation & settlement

1. ENG/SYS match internal confirms vs venue/broker/ledger lines.  
2. Exceptions owned by Clearing Ops / TO.  
3. Material notional delta → checker (CO2/RO).  
4. On approve → `SettlementReady` → TS executes.  
5. Retain evidence per CP policy.

### 6.6 SOP-G06 — New product / instrument approval

Gate order: **Legal → CP → Listing diligence → Risk opinion → Product checklist → RE/ME config → Wallet deposit ready → Soft launch → Hypercare**.  
No production traffic before Risk **A** and CP clear.

---

## 7. Admin pages & tool catalogue

### 7.1 Canonical admin map (by domain)

| Domain | Base path | Primary BU |
|--------|-----------|------------|
| Risk limits & alerts | `/admin/risk/*` | RO / RO-OPS |
| Risk engine | `/admin/risk-engine/*` | RE |
| Spot | `/admin/spot/*` | Spot PM / TO |
| Margin | `/admin/margin/*` | Margin PM / RO-Credit |
| Futures/Perps | `/admin/futures/*` | Futures PM / TO-FUT |
| Matching engine | `/admin/engine/*` | ME / SRE |
| Wallet | `/admin/wallet/*` | WO |
| Listing | `/admin/listing/*` | LI |
| Compliance | `/admin/compliance/*` | CP |
| Treasury | `/admin/treasury/*` | TS |
| Market making | `/admin/mm/*` | MM |
| Access & audit | `/admin/iam/*`, `/admin/audit/*` | Security / ENG |

> Paths are **logical**. Map them 1:1 to your internal Admin Console / Orion / Risk Portal names without changing ownership.

### 7.2 Tooling aligned to platform modules

| Need | Tool / module | Primary users |
|------|---------------|---------------|
| Realtime metrics & alert routing | `risk_metrics_monitor.py` / Risk Portal | RO-OPS, TR |
| Leverage / buying-power requests | `trader_rights_workflow.py` | TR, RO, PM |
| Stress / what-if | `stress_testing.py` | RO, DA, PM |
| Daily risk pack | `risk_reporting.py` | RO, PM |
| EOD recon | `eod_reconciliation.py` | CO/TO, TS |
| Performance attribution | `performance_attribution.py` | PM, RO |
| Narrative flowchart | `05-use-case-narrative-flowchart.drawio` | All PICs (training) |

### 7.3 ACL principles for admin pages

1. **Least privilege** by role code.  
2. **Dual control** on: kill switch, key ops, sanctions override, insurance injection, Tier-A limits.  
3. **Immutable audit** on every mutate.  
4. **Break-glass** accounts: time-bound, auto-ticket, CRO/CISO notify.  
5. **Environment separation**: read-only prod replicas for analysts where possible.

---

## 8. Limits, KRIs, thresholds, actions & escalation

### 8.1 How to read the indicator catalogue

Each indicator row uses this schema:

| Column | Meaning |
|--------|---------|
| **ID** | Stable code for tickets, alert routing, dashboards |
| **Indicator** | What is measured |
| **Freq** | Monitoring / evaluation cadence |
| **WARN** | Soft threshold → investigate; usually no auto-block |
| **BREACH** | Hard threshold → mandatory action (auto and/or human) |
| **Auto action** | System response without waiting for human (where safe) |
| **Human action** | Required ops/risk steps |
| **Escalate** | Who is paged and at which ladder level (see §8.2) |
| **Owner** | Primary BU accountable for response quality |

**Severity mapping:** WARN → typically L1–L2 · BREACH (contained) → L2 · BREACH cascade / fund threat → L3–L4 · Kill-switch class → L4.

**ACK SLAs (RO-OPS):** WARN ≤ 15 min · BREACH ≤ 5 min · Kill / client-asset ≤ 2 min.

**Threshold governance:** changes follow SOP-G01; illustrative numbers marked *calib.* must be replaced by Limit Book values.

### 8.2 Escalation ladder (global)

| Level | Criteria | Notify (page / bridge) | Time-to-bridge |
|-------|----------|------------------------|----------------|
| **L1** | Single WARN; data quality suspect; no client impact | RO-OPS | N/A (ticket) |
| **L2** | Hard BREACH contained to 1 symbol/account class; reversible | RO + BU PIC (+ RE if engine-related) | 15 min |
| **L3** | Multi-symbol cascade, insurance draw, ADL storm, prolonged halt | CRO + Product PIC + ME + RE + Comms | Immediate |
| **L4** | Client-fund threat, key/API compromise, exchange-wide halt, wrong marks at scale | ELT · Crisis Comms · Legal · CP · CISO | Immediate + exec bridge |

### 8.3 Limit types

| Type | Meaning | Example |
|------|---------|---------|
| Soft (WARN) | Early warning; no auto-block by default | Perps OI ≥ 80% of cap |
| Hard (BREACH) | Auto-action and/or mandatory human action | User leverage > bracket → reject order |
| Kill | Immediate safety stop | Matching kill switch; withdraw freeze |

---

### 8.4 Spot indicators

| ID | Indicator | Freq | WARN | BREACH | Auto action | Human action | Escalate | Owner |
|----|-----------|------|------|--------|-------------|--------------|----------|-------|
| **SP-K01** | Bid–ask spread vs 30d median (top pair) | 1s tick / 1m agg | ≥ 3× median for 5m | ≥ 5× median for 2m **or** ≥ 10× any 30s | Widen MM alert; flag symbol | TO verify MM SLA; contact MM; consider band tighten | L1→L2 | Spot TO / MM |
| **SP-K02** | Book depth notional within ±2% of mid | 1s / 1m | < 50% of SLA depth for 5m | < 25% of SLA for 2m | Page MM bot | TO enforce MM; RO may recommend halt if disorderly | L2 | MM / Spot TO |
| **SP-K03** | Last vs index/ref mid deviation | 1s | ≥ 2% for 30s (*majors calib.*) | ≥ 5% for 15s **or** ≥ 10% instant | Price-band reject aggressive orders | TO+RO: halt candidate; CP if manip suspected | L2→L3 | Spot TO / RO |
| **SP-K04** | Cancel / fill ratio (UID or symbol) | 1m | > 50:1 sustained 10m | > 100:1 or API weight abuse | Rate-limit / reject cancels | TO throttle; CP surveillance case | L1→L2 | ME / CP |
| **SP-K05** | Fat-finger / max notional hit rate | Per order + 5m | > N rejects/UID/5m (*calib.*) | Single order ≥ hard notional cap | Reject order | TO review VIP exception; RO if repeated | L1 | ME / Spot TO |
| **SP-K06** | Spot trading halt count | Event + daily | ≥ 1 halt/day on majors | ≥ 3 halts/day **or** halt > 60m | — | Post-incident; RO root-cause; Comms | L2→L3 | Spot TO / RO |
| **SP-K07** | Deposit→trade→withdraw velocity (UID) | Per event / 5m | Unusual pattern vs peer | Travel-rule / AML rule hit | Hold withdraw | CP investigate; WO release only on clear | L2 | CP / WO |
| **SP-K08** | Self-trade / wash score | 1m / batch | Score ≥ WARN model cut | Score ≥ BREACH cut | STP block / flag | CP case; possible hard hold | L2 | CP |
| **SP-K09** | Matching latency p99 | 10s | > 2× SLO | > 5× SLO **or** drop rate > 0.1% | Shed non-critical traffic | ME/SRE mitigate; consider halt | L2→L3 | ME / SRE |
| **SP-K10** | Seed-tag / new listing 24h volatility | 1m | Daily range > policy A | Range > policy B **or** −50% from list | Tighten bands | LI+RO monitoring tag; delist path if fraud | L2 | LI / RO |

**Spot response cheat-sheet**

| Condition | First move | Escalate if |
|-----------|------------|-------------|
| Illiquid + wide spread | MM call + SLA ticket | Depth BREACH > 10m → RO halt opinion |
| Price dislocation vs ref | Band enforce | BREACH → SOP-G02 halt |
| Wash / spoof pattern | CP hold on UID | Multi-UID ring → L3 + Legal |

---

### 8.5 Margin indicators (Cross & Isolated)

| ID | Indicator | Freq | WARN | BREACH | Auto action | Human action | Escalate | Owner |
|----|-----------|------|------|--------|-------------|--------------|----------|-------|
| **MG-K01** | Asset borrow utilisation (borrow / inventory) | 1m | ≥ 80% | ≥ 95% | Raise borrow rate step; throttle new borrows | Freeze borrow (MG-03) if persistent; notify TS | L2 | RO-Credit / TS |
| **MG-K02** | User margin ratio / LTV vs maintenance | 1s | Within 10% of call line | Crosses liquidation line | Margin call → liquidation engine | TO monitor queue lag; pause only per RE-02 | L1→L2 | RE / TO |
| **MG-K03** | Platform liquidation notional (5m / 1h) | 1m | > 2× 30d 95th %ile (5m) | > 5× **or** engine lag > 30s | Slow other risk-increasing orders | RO: consider borrow freeze + spot band; RE capacity | L2→L3 | RO / RE |
| **MG-K04** | Bad debt / negative balance created | Event + daily | Any > $X (*calib.*) | Daily sum > $Y **or** single > $Z | Auto-repay attempt; isolate UID | MG-05 recovery; P&L booking; CRO if Tier A | L2→L3 | RO-Credit / TS |
| **MG-K05** | Collateral haircut gap vs realized vol | Hourly / daily | Vol regime up 1 tier vs haircut | Stress LTV breach in DA daily run | — | Propose haircut/LTV change (SOP-G01) | L2 | DA / RO-Credit |
| **MG-K06** | Cross-margin contagion score (acct) | 1m | High HHI + high LTV | Multiple legs near liq | Reduce-only on risk-increasing | TO force partial close if policy allows | L2 | RO-Credit |
| **MG-K07** | Interest accrual exceptions | Hourly | Mismatch count > 0 | Notional interest break > tol | Block curve change push | TS+ENG recon; halt interest updates | L2 | TS / ENG |
| **MG-K08** | Stablecoin collateral depeg (mark) | 1s | Peg < 0.995 for 5m | < 0.99 for 2m **or** < 0.98 instant | Haircut step-up; borrow freeze on asset | TS redemption playbook; RO stress | L2→L3 | TS / RO |
| **MG-K09** | VIP / wholesale borrow concentration | Daily | Top 10 > 40% of asset borrow | Top 10 > 60% **or** single > 25% | Cap new VIP borrow | RO credit review; reduce limits | L2 | RO-Credit |
| **MG-K10** | Liquidation slip vs bankruptcy price | Per liq + daily | Avg slip > buffer/2 | Slip consumes buffer → bad debt | — | Tune impact buffer; review MM during liq | L2 | RO / DA |

**Margin response cheat-sheet**

| Condition | First move | Escalate if |
|-----------|------------|-------------|
| Borrow util BREACH | Rate up + throttle | Still ≥ 95% in 30m → hard freeze |
| Liq cascade | Protect engine capacity | Lag > 30s → L3; consider spot halt on collateral |
| Depeg collateral | Haircut + freeze borrow | Peg < 0.98 → L3 + Treasury war room |

---

### 8.6 Perps indicators (USDⓈ-M / COIN-M)

| ID | Indicator | Freq | WARN | BREACH | Auto action | Human action | Escalate | Owner |
|----|-----------|------|------|--------|-------------|--------------|----------|-------|
| **PF-K01** | Mark − index deviation | 1s | ≥ 0.5% majors / ≥ 1.5% alts (*calib.*) | ≥ 1.5% majors / ≥ 3% alts sustained 30s **or** spike ≥ 5% | Prefer mark protection; reject manipulative fills per rules | PF-03 playbook; check constituents; reduce-only candidate | L2→L3 | RO / RE / DA |
| **PF-K02** | Index constituent stale / outlier | 1s | 1 venue stale > 5s | < min venues **or** 2+ stale | Drop bad venue from index | PF-08; RO approve temporary weights | L2 | DA / RE |
| **PF-K03** | Funding rate (abs) vs cap | Per interval + 1m pred | ≥ 75% of cap | Hit cap **or** predicted next ≥ cap | Clamp funding at cap | PF-04 review; extreme → pause funding (rare, dual) | L2 | PM-FUT / RO |
| **PF-K04** | Open interest vs OI cap | 1m | ≥ 80% cap | ≥ 100% (block increase) | Reject risk-increasing opens | Bracket/OI review; MM OI check | L2 | RO / TO-FUT |
| **PF-K05** | User / VIP position notional vs limit | Per order | ≥ 80% limit | ≥ 100% | Reject / reduce-only only | Rights workflow if increase requested | L1→L2 | RE / RO |
| **PF-K06** | Liquidation notional burst (1m / 5m) | 1s–1m | > 2× 30d 99th %ile | > 5× **or** liq queue lag > 15s | Slow opens; batch liqs per RE config | PF-07 reduce-only; insurance watch | L2→L3 | TO-FUT / RE |
| **PF-K07** | Insurance fund coverage ratio | 1m / event | < 120% of policy floor stress | < 100% floor **or** single payout > X% of fund | — | PF-05; prepare ADL; CRO inject decision | L3 | RO / TS |
| **PF-K08** | ADL events | Event | Any ADL | ≥ 3 ADL / hour **or** ADL on majors | Execute ADL queue | PF-06 review; Comms; CP if abuse | L3 | TO-FUT / RO |
| **PF-K09** | Basis (perp mid − spot mid) | 1m | Outside 30d 95% band | Extreme basis + thin depth | — | Check index; funding; possible reduce-only | L2 | DA / RO |
| **PF-K10** | Top-N long/short concentration | 5m / daily | Top 10 > 30% OI one side | Top 10 > 50% **or** single > 15% | Tighten UID limits | RO concentration action; CP if squeeze pattern | L2 | RO / CP |
| **PF-K11** | Leverage tier utilisation (users near max) | 5m | > 20% users in top bracket | > 40% **or** rising fast into stress | — | Consider bracket tighten (SOP-G01) | L2 | RO / PM-FUT |
| **PF-K12** | Insurance payout / bankruptcy count | Event + daily | Any bankruptcy fill | Payout sum daily > Y | Draw insurance | Accounting + RO challenge MM/liq quality | L2→L3 | RO / TS |

**Perps response cheat-sheet**

| Condition | First move | Escalate if |
|-----------|------------|-------------|
| Mark–index BREACH | Validate feeds; drop bad venue | Sustained + liqs firing → reduce-only / halt opens |
| Insurance < floor | Freeze discretionary risk-ups | ADL armed → L3 bridge |
| Funding at cap | Clamp; publish reason | Need pause → dual RO+PM + Comms |

---

### 8.7 Cross-cutting / platform indicators

| ID | Indicator | Freq | WARN | BREACH | Auto action | Human action | Escalate | Owner |
|----|-----------|------|------|--------|-------------|--------------|----------|-------|
| **PL-K01** | Hot-wallet buffer vs 24h withdraw p95 | 5m | < 150% of p95 | < 100% of p95 | Slow-mode withdraw | WA-01 top-up; WA-02 queue | L2→L3 | WO / TS |
| **PL-K02** | Withdraw backlog age (p95) | 1m | > 30m | > 2h **or** growing > 1h | — | Capacity / chain check; Comms if broad | L2 | WO |
| **PL-K03** | Deposit credit lag vs chain finality | 1m | > 2× expected | > 4× **or** silent fail | — | Chain/node incident; stop auto-credit if reorg risk | L2 | WO / SRE |
| **PL-K04** | Reorg depth detected | Event | Reorg ≥ 1 (non-final) | Reorg affects credited txs | Pause credit on chain | WA-03; possible debit/clawback SOP | L3 | WO / RO |
| **PL-K05** | EOD recon break notional | Daily + intraday | Any unmatched > tol | > materiality $ (*calib.*) | Block `SettlementReady` | SOP-G05 maker–checker | L2 | TO / TS |
| **PL-K06** | Risk feed / mark pipeline lag | 10s | Lag > 2s | Lag > 5s **or** gap | RE feed failover | ENG-03; pause liq if marks unsafe | L2→L3 | RE / ENG |
| **PL-K07** | Admin dual-control bypass / break-glass use | Event | Any use | Use without ticket | Auto-ticket + page | Security+CRO review same day | L3→L4 | Security / CRO |
| **PL-K08** | API key anomaly / privilege spike | 1m | Score WARN | Score BREACH / confirmed leak | Kill API key | ENG-04; user notify; CP if fraud | L3→L4 | Security |
| **PL-K09** | Desk / company VaR or DD vs limit | 1m / daily | ≥ 80% limit | ≥ 100% limit | Alert TR+RO; block size-ups if policy | Rights freeze; stress rerun | L2 | RO / TR |
| **PL-K10** | Stress test: post-shock margin shortfall | Daily + ad hoc | Shortfall in alt scenario | Shortfall in core scenario > appetite | — | Limit tighten proposal; board if persistent | L2→L3 | DA / RO |
| **PL-K11** | Surveillance open cases aging | Daily | Case > SLA | Case > 2× SLA with open exposure | — | CP escalate; hard hold if needed | L2 | CP |
| **PL-K12** | Listing pipeline diligence overdue | Daily | > SLA stage time | Live traffic without Risk/CP clear | Block go-live flag | LI stop; audit exception | L2→L3 | LI / RO |

---

### 8.8 Unified account / portfolio-margin indicators (if enabled)

| ID | Indicator | Freq | WARN | BREACH | Auto action | Human action | Escalate | Owner |
|----|-----------|------|------|--------|-------------|--------------|----------|-------|
| **PM-K01** | Portfolio margin vs SPAN/IM model gap | Hourly | Gap > 10% | Gap > 25% | Fall back to conservative mode | DA model incident; disable PM feature flag if needed | L3 | DA / RE |
| **PM-K02** | Cross-product hedge break (spot vs perp) | 1m | Hedge ratio drift WARN | Hedge broken into naked high leverage | Margin call | RO review correlations | L2 | RO / DA |

---

### 8.9 Monitoring frequency summary (by layer)

| Layer | Cadence | Typical indicators | Primary console |
|-------|---------|--------------------|-----------------|
| **At-trade / streaming** | Tick–1s | Marks, LTV, bands, kill switches | Risk Engine + Matching |
| **Near-real-time** | 1–5m | OI, depth, borrow util, liq bursts, wallet buffer | Risk Portal alerts |
| **Intraday ops** | 15–60m | Concentration, funding pred, backlog age | BU PIC dashboards |
| **Daily** | UTC cutoff | Bad debt, recon, stress, VaR/DD pack | `risk_reporting.py` / MI pack |
| **Weekly** | PIC review | KRI RAG, waiver expiry, listing pipeline | Risk committee pre-read |
| **Monthly / quarterly** | Governance | Threshold calib, model validation, DR/liq dry-run | CRO / Risk Committee |

### 8.10 Alert → action → escalation state machine

```
Detect (SYS) → Route (WARN|BREACH|KILL)
    → ACK (RO-OPS within SLA)
        → Data quality? → fix feed / no-action + note
        → Real risk?
            → Auto actions already fired? confirm effectiveness
            → Human playbook (instrument SOP)
            → Still open after TTE?
                → Escalate L+1 (ladder §8.2)
            → Contained → document + hypercare window
            → Sev-1/2 → war room (§9) + post-mortem
```

| Parameter | Default |
|-----------|---------|
| Time-to-escalate (TTE) WARN | 30–60 min without containment plan |
| TTE BREACH | 15 min without containment |
| TTE Kill / client-asset | 0 (immediate L3/L4) |
| Hypercare after BREACH | 24h enhanced monitoring |
| Post-mortem due | 5 business days (Sev-1/2) |

### 8.11 Reporting & evidence pack (per indicator family)

| Deliverable | Freq | Owner | Contents |
|-------------|------|-------|----------|
| Intraday alert journal | Continuous | RO-OPS | ACK times, false positives, actions |
| Daily risk MI pack | Daily | RO | RAG on SP/MG/PF/PL KRIs + open breaches |
| Liquidation & insurance flash | Event + daily | RO-Credit / Futures | Liq notional, bad debt, insurance, ADL |
| Wallet run-risk flash | Daily / stress | WO / TS | Buffer vs outflow, slow-mode events |
| Weekly PIC attestation | Weekly | Each BU PIC | KRIs reviewed; exceptions accepted |
| Quarterly threshold calib | Quarterly | DA + RO | Backtest hit rates; propose Limit Book edits |

### 8.12 Minimum “always on” set (if tooling is constrained)

Stand up these first — then expand to full catalogue:

1. **PF-K01** Mark−index · **PF-K07** Insurance coverage · **PF-K06** Liq burst  
2. **MG-K01** Borrow util · **MG-K04** Bad debt · **MG-K08** Stable depeg  
3. **SP-K03** Price dislocation · **SP-K09** Matching latency  
4. **PL-K01** Hot-wallet buffer · **PL-K06** Mark pipeline lag · **PL-K05** Recon breaks  

---

## 9. Risk scenario diagnostics (RAG + time sequence)

Use this section when an indicator (or cluster) flips colour. **Never act on colour alone** — reconstruct the **time sequence**, then discriminate causes.

### 9.1 RAG colour map

| Colour | Maps to §8 | Meaning for diagnostics |
|--------|------------|-------------------------|
| **Green (G)** | Below WARN | Healthy *or* silent failure / not computed — confirm data freshness |
| **Amber (A)** | WARN | Elevated; investigate before it becomes BREACH |
| **Red (R)** | BREACH / Kill-adjacent | Contain first, then diagnose; assume real until proven data quality |

**Important:** Green is not always “safe”. A green mark feed that is **stale** (see PL-K06) can hide a red economic reality. Always check **last update timestamp** with colour.

### 9.2 Diagnostic method (mandatory order)

```
1. CLOCK   — Build timeline (T0 first anomaly → Tn now). Note timezone UTC.
2. SCOPE   — 1 UID / 1 symbol / 1 asset / venue-wide / cross-product?
3. DATA    — Is the metric fresh? Formula version? Feed failover active?
4. SINGLE  — Plausible causes for the primary indicator colour (§9.3).
5. CLUSTER — Which other KRIs moved, and in what order? (§9.4–9.5)
6. RULE OUT — Eliminate causes inconsistent with sequence or green peers.
7. ACT     — Contain per §8 actions → escalate per §8.2 → war room if Sev-1/2.
8. WRITE   — Timeline + ruled-in/out causes in incident ticket.
```

**Time-sequence grammar (use in tickets):**

| Pattern | Interpretation |
|---------|----------------|
| **A → B** | A likely causal precursor of B (seconds–minutes) |
| **A ≈ B** | Simultaneous / common driver (same second–minute bucket) |
| **A ↛ B** | A alone usually does *not* produce B; look for third factor |
| **A then quiet then B** | Two-phase incident (e.g. exploit deposit → later dump) |
| **Oscillating A/R** | Flip-flopping often = threshold noise, feed flap, or MM restart |

---

### 9.3 Single-indicator scenarios (all plausible causes)

For each key KRI: what **Green / Amber / Red** can mean. Lists are **exhaustive enough for ops triage**, not metaphysical.

#### 9.3.1 Spot — SP-K01 Bid–ask spread

| Colour | Plausible causes | Quick discriminators |
|--------|------------------|----------------------|
| **G** | Normal MM; tight regime; low vol | Depth SP-K02 also G; latency SP-K09 G |
| **G (false comfort)** | Mid calculation broken (both sides empty → NaN coerced); quoting on wrong tick size | Book empty but spread shows 0; trades failing |
| **A** | MM widened quotes; vol spike; inventory skew; one-sided flow; partial MM outage; competing venue dislocation pulling quotes | Check MM heartbeat; realized vol; SP-K02 depth |
| **R** | Full MM disconnect; disorderly market; fat-finger resting orders cleared; halt remnant; API rate-limit starving MM; intentional thin book pre-news | SP-K02 R? SP-K09 R? Recent halt SP-K06? |

**Typical sequences:** `vol spike → A spread → A depth` (market) · `MM process crash → R depth then R spread within seconds` (tech) · `spread R while depth G` (wide but thick — often policy widen, not outage).

#### 9.3.2 Spot — SP-K03 Last vs ref / index deviation

| Colour | Plausible causes | Quick discriminators |
|--------|------------------|----------------------|
| **G** | Price discovery aligned | Mark/index feeds fresh |
| **G (false)** | Ref feed stale and last follows stale ref; both wrong together | PL-K06 / external venue check |
| **A** | Transient imbalance; arb lag; bands absorbing; news micro-gap; thin alt | Recovers < 60s? Depth OK? |
| **R** | Oracle/ref bug; manipulated last prints; wrong symbol mapping; halt on ref venues only; fat-finger print; index constituent failure | Cross-check 3 external venues; SP-K08 wash; PF-K01 if perp listed |

**Sequences:** `external crash ≈ SP-K03 R` (real move) · `SP-K03 R while externals flat` (local book/manip/data) · `PL-K06 A → SP-K03 A` (feed lag artifact).

#### 9.3.3 Spot — SP-K09 Matching latency p99

| Colour | Plausible causes | Quick discriminators |
|--------|------------------|----------------------|
| **G** | Engine healthy | Drop rate ~0 |
| **A** | Load spike; GC; noisy neighbor; cancel storm start; partial shard hot | Cancel/fill SP-K04; CPU/network |
| **R** | Shard overload; network partition; bad deploy; infinite cancel loop; DDoS; clock skew | Failover status; recent ME-01 deploy; SP-K04 R |

**Sequences:** `SP-K04 A → SP-K09 A→R` (cancel storm) · `deploy → SP-K09 R alone` (bad release) · `SP-K09 R → SP-K03 A` (stale books / delayed matches).

#### 9.3.4 Margin — MG-K01 Borrow utilisation

| Colour | Plausible causes | Quick discriminators |
|--------|------------------|----------------------|
| **G** | Amply inventoried | Rates normal |
| **A** | Organic demand; short squeeze forming; inventory withdrawal by lenders; rate still sticky | VIP concentration MG-K09; funding/perp basis PF-K09 |
| **R** | Squeeze; bank-run on lendable asset; mis-set inventory denomiator; double-count bug; whale borrow | Freeze path; check inventory ledger vs wallet |

**Sequences:** `spot dump → collateral call → rush borrow stable → MG-K01 A/R` · `MG-K01 R with flat markets` (inventory/accounting bug or silent lender exit).

#### 9.3.5 Margin — MG-K02 / proximity to liquidation (user LTV)

| Colour | Plausible causes | Quick discriminators |
|--------|------------------|----------------------|
| **G** | Healthy cushion | — |
| **A** | Vol against position; interest accrual; haircut unchanged while vol rose (MG-K05); user added leverage | Position PnL vs borrow growth |
| **R** | Breach maintenance; liq engine should fire | If R but **no liq orders** → RE stuck (critical) |

**Sequences:** `price shock → MG-K02 R → MG-K03 liq notional ↑` (healthy engine) · `MG-K02 R ↛ MG-K03` for >15–30s (engine/pause/feed fail — escalate L3).

#### 9.3.6 Margin — MG-K04 Bad debt

| Colour | Plausible causes | Quick discriminators |
|--------|------------------|----------------------|
| **G** | No shortfall | Confirm ledger job ran |
| **A** | Small gap after liq slip; partial fill; dust | MG-K10 slip |
| **R** | Gap move through bankruptcy; engine lag; wrong mark; depeged collateral; ADL/insurance analogue missing on margin | MG-K08; PL-K06; insurance analogue |

**Sequences:** `MG-K08 R → MG-K02 R → MG-K03 → MG-K04` (depeg cascade) · `MG-K04 R with MG-K03 G` (accounting/recon bug or manual adjust).

#### 9.3.7 Margin — MG-K08 Stablecoin collateral depeg

| Colour | Plausible causes | Quick discriminators |
|--------|------------------|----------------------|
| **G** | Peg holds | Multi-venue peg |
| **A** | Soft depeg; liquidity thin; temporary venue dislocation | Redemption queue; TS inventory |
| **R** | Hard depeg; issuer freeze; exploit; oracle marks wrong stable | On-chain peg; bank/issuer status; PL-K06 |

**Sequences:** `external depeg ≈ MG-K08` (real) · `MG-K08 R → MG-K01 util ↑ (flight) → MG-K03 liqs` · `MG-K08 R while CEX+on-chain G` (local mark bug).

#### 9.3.8 Perps — PF-K01 Mark − index deviation

| Colour | Plausible causes | Quick discriminators |
|--------|------------------|----------------------|
| **G** | Mark tracks index | Constituents live |
| **G (false)** | Both mark and index stuck on same stale value | PL-K06 timestamp; external spot |
| **A** | Premium/discount building; funding pressure; thin perp vs spot; skew | PF-K03 funding; PF-K09 basis; depth |
| **R** | Index broken (venues down); mark formula bug; manip on last used in mark; circuit not engaged; wrong contract multiplier | PF-K02; external index rebuild |

**Sequences:** `PF-K02 A/R → PF-K01 R` (index integrity) · `PF-K01 R ≈ PF-K09 R with PF-K02 G` (real basis stress) · `PL-K06 R → PF-K01 flap` (pipeline).

#### 9.3.9 Perps — PF-K06 Liquidation burst

| Colour | Plausible causes | Quick discriminators |
|--------|------------------|----------------------|
| **G** | Quiet | — |
| **A** | Vol event; cascade starting; OI high leverage cohort | PF-K11; PF-K10 concentration |
| **R** | Cascade; wrong marks mass-liq; restart draining queue; attack on mark | PF-K01; insurance PF-K07; engine lag |

**Sequences:** `macro dump → PF-K01 A → PF-K06 A→R → PF-K07 A` (classic) · `PF-K06 R with flat underlying` (bad mark / bug — Sev-1 candidate) · `PF-K06 R → PF-K08 ADL` (insurance insufficient).

#### 9.3.10 Perps — PF-K07 Insurance coverage / PF-K08 ADL

| Colour | Plausible causes | Quick discriminators |
|--------|------------------|----------------------|
| **G** | Fund healthy | — |
| **A (K07)** | Large payouts; under-seeded listing; slow fee inject | PF-K12 payouts |
| **R (K07)** | Coverage < floor after bankruptcies | Prepare ADL |
| **A/R (K08)** | ADL fired / storm | Comms + CP abuse check |

**Sequences:** `PF-K06 R → PF-K12 payouts → PF-K07 A→R → PF-K08` (ordered stress) · `PF-K08 without prior PF-K07 A` (misconfig ADL trigger — investigate urgently).

#### 9.3.11 Perps — PF-K03 Funding vs cap

| Colour | Plausible causes | Quick discriminators |
|--------|------------------|----------------------|
| **G** | Balanced OI / premium | — |
| **A** | Persistent premium/discount; one-sided retail; arb constrained | PF-K09; withdraw/fiat rails |
| **R** | Hit clamp; extreme imbalance; formula error; wrong interest component | Predicted vs realized; code version |

**Sequences:** `basis PF-K09 A for hours → PF-K03 A→R` (organic) · `instant PF-K03 R at funding boundary only` (calc bug or clock).

#### 9.3.12 Platform — PL-K01 Hot-wallet buffer / PL-K02 withdraw backlog

| Colour | Plausible causes | Quick discriminators |
|--------|------------------|----------------------|
| **G** | Buffer OK; queue healthy | — |
| **A** | Outflow surge; cold→hot lag; chain fee spike slowing sends; listing unlock day | On-chain congestion; news |
| **R** | Run risk; hot drain; signer stuck; chain halt; attack draining hot | WA-02 slow-mode; Security if unexplained |

**Sequences:** `negative news → withdraw spike → PL-K01 A→R → PL-K02 A→R` (run) · `PL-K02 R with PL-K01 G` (signer/chain bottleneck, not balance) · `PL-K04 reorg → credit pause → perceived backlog`.

#### 9.3.13 Platform — PL-K06 Risk / mark pipeline lag

| Colour | Plausible causes | Quick discriminators |
|--------|------------------|----------------------|
| **G** | Fresh marks | Compare wall clock vs event time |
| **A** | Kafka/consumer lag; GC; dependency slow | Downstream KRIs flap |
| **R** | Pipeline down; poison message; bad deploy; clock jump | Failover; pause unsafe liqs |

**Sequences:** `PL-K06 R first → many KRIs A/R without external move` (data incident) · `external move then PL-K06 A` (backpressure from load — still dangerous).

#### 9.3.14 Platform — PL-K05 EOD recon break

| Colour | Plausible causes | Quick discriminators |
|--------|------------------|----------------------|
| **G** | Books match | Job completed flag |
| **A** | Timing cut-off; fee rounding; partial fills late | Re-pull broker |
| **R** | Missing trades; duplicate; wrong account map; venue outage mid-day; fraud | Materiality; maker–checker |

**Sequences:** `intraday ME incident → late PL-K05 R` · `PL-K05 R isolated` (reporting/ETL) vs with client PnL tickets (real breaks).

#### 9.3.15 When Green is the anomaly

Treat **unexpected Green** as a scenario:

| Observation | Plausible causes |
|-------------|------------------|
| Major market crash but PF-K01/SP-K03 stay G | Feeds frozen; alert rule disabled; wrong symbol scope; thresholds too loose |
| MG-K02 all G while MG-K03 liq notional spikes | Liquidating **wrong accounts** / test bleed / shared engine noise |
| PL-K01 G but users report stuck withdraws | Backlog is chain/signing (PL-K02) not balance; UI status bug |
| All KRIs G after Sev-1 | Dashboard pointed at staging; ACL showing cached snapshot |

---

### 9.4 Multi-indicator cluster scenarios (with time sequence)

Legend: colours on the **cluster at diagnosis time**; arrows show **required order** to prefer that cause.

#### Scenario family S1 — Real macro / crypto risk-off

| Phase (UTC order) | Cluster | Preferred cause | Rule-outs |
|-------------------|---------|-----------------|-----------|
| T0 | External BTC/ETH dump (off-platform) | Macro | — |
| T0+0–30s | SP-K03 A/R · PF-K09 A · SP-K01 A | Price discovery stress | If externals flat → not S1 |
| T0+30s–5m | PF-K01 A · PF-K06 A→R · MG-K02 A→R · MG-K03 ↑ | Liquidations organic | — |
| T0+5–30m | PF-K07 A · MG-K01 A · PL-K01 A | Insurance & borrow & outflows | — |
| Optional | PF-K08 if insurance thin | ADL | |

**Also green that supports S1:** PL-K06 G (feeds fresh), PF-K02 G (index venues alive).  
**Escalation:** L2–L3 depending on insurance/ADL; Comms ready.

#### Scenario family S2 — Mark / index data integrity failure

| Phase | Cluster | Preferred cause | Rule-outs |
|-------|---------|-----------------|-----------|
| T0 | PL-K06 A/R **or** PF-K02 R | Feed/constituent fail | — |
| T0+seconds | PF-K01 R · possibly SP-K03 R **without** matching external move | Bad marks | If externals moved same → S1 |
| T0+1–5m | PF-K06 R (spurious liqs) · MG-K02 R | Engine trusting bad marks | — |
| Concurrent | SP-K09 may stay G | Not matching overload | Distinguishes from S4 |

**Actions:** Pause risk-increasing + pause liq if policy (RE-02); failover feeds; Sev-1 if mass wrong liqs.  
**Green peers:** External spot monitors G/flat; chain health G.

#### Scenario family S3 — Stablecoin depeg contagion

| Phase | Cluster | Preferred cause |
|-------|---------|-----------------|
| T0 | MG-K08 A→R · external peg break | Depeg |
| T0+1–10m | MG-K05 A · MG-K02 R on stable-collateral accounts · MG-K03 ↑ | Collateral shock |
| Parallel | MG-K01 R on other stables/fiat borrows · PF-K09 dislocations on stable pairs | Flight to quality / confusion |
| T0+10–60m | MG-K04 A/R · PL-K01 A · PF-K07 A if perps margined in stable | Bad debt + run + insurance |

**Rule-out:** MG-K08 R with on-chain+off-venue peg G → local oracle (treat as S2 subclass).

#### Scenario family S4 — Matching / infra overload or bad deploy

| Phase | Cluster | Preferred cause |
|-------|---------|-----------------|
| T0 | SP-K09 A→R · often after ME deploy or DDoS ticket | Infra |
| T0+ | SP-K04 A/R (cancel storm) · SP-K01/02 A (MM can't update) | Secondary market quality |
| Later | SP-K03 A · PF-K01 A if delayed updates | Stale trading |
| Usually green | PF-K02 · MG-K08 · PL-K06 may be G early | Distinguishes from S2 |

**Rule-out:** If PL-K06 R leads and SP-K09 G → prefer S2 not S4.

#### Scenario family S5 — MM withdrawal / liquidity hole (single name)

| Phase | Cluster | Preferred cause |
|-------|---------|-----------------|
| T0 | SP-K02 R · SP-K01 R on **one** symbol; others G | MM outage / SLA breach |
| Optional | SP-K03 A on that symbol only | Thin book impact |
| Green | Platform PL-* G · other symbols G · PF-* G if no perp | Localized |

**Vs manipulation (S7):** S5 often has MM heartbeat down; S7 has SP-K08 / CP scores rising with heartbeats up.

#### Scenario family S6 — Liquidation cascade with insurance stress (perps)

| Phase | Cluster | Preferred cause |
|-------|---------|-----------------|
| T0→T1 | PF-K11 A · PF-K10 A (crowded) then shock | Positioning fragility |
| T1 | PF-K01 A · PF-K06 R | Cascade |
| T2 | PF-K12 R · PF-K07 A→R | Fund drain |
| T3 | PF-K08 A/R | ADL |

**Time discipline:** If **PF-K08 before PF-K07 A**, suspect ADL misconfig (not “natural” S6).

#### Scenario family S7 — Market abuse / manipulation

| Phase | Cluster | Preferred cause |
|-------|---------|-----------------|
| T0 | SP-K08 A/R and/or CP alert · often SP-K04 odd patterns | Abuse |
| T0+ | SP-K03 R **localized** · PF-K01 may follow if mark uses last | Print paint / stop hunt |
| Optional | PF-K06 burst on victims · MG-K02 on leveraged victims | Forced flows |
| Green / mixed | SP-K09 often G · PL-K06 G | Not infra |

**Sequence clue:** Repeated **oscillating** SP-K03 A/R around a UID cluster with SP-K08 ↑.

#### Scenario family S8 — Withdrawal run / custody stress

| Phase | Cluster | Preferred cause |
|-------|---------|-----------------|
| T0 | Social/news or competitor failure | Trigger |
| T0+ | PL-K01 A→R · PL-K02 A→R | Outflow |
| Parallel | Spot sell pressure SP-K03 A · MG-K01 A · PF-K09 A | Market side-effects |
| Distinguisher | PL-K08 Security G vs R | Pure run vs compromise |

**If PL-K08 R leads:** treat as security incident (L4) not pure S8.

#### Scenario family S9 — Silent / false-green systemic

| Phase | Cluster | Preferred cause |
|-------|---------|-----------------|
| T0 | User tickets / external price move / support spike | Outside signal |
| T0 | **All primary KRIs G** | Dashboard wrong env; rules disabled; frozen consumers showing last-good |
| Confirm | PL-K06 timestamp ancient **or** alert manager muted | Data plane lie |

**Action:** Page ENG+RO; do not declare “all clear”.

#### Scenario family S10 — Listing / new-market failure

| Phase | Cluster | Preferred cause |
|-------|---------|-----------------|
| T0 | New symbol live | — |
| T0+minutes | SP-K10 R · SP-K01/02 R · SP-K03 R | Thin + volatile listing |
| Optional | MG eligibility too early → MG-K03/04 | Premature margin |
| Optional | Perp day-0 → PF-K01/06 noisy | Index immature (PF-K02) |

**Green elsewhere** supports isolation to the new market.

#### Scenario family S11 — Cross-product arb / basis blowout

| Phase | Cluster | Preferred cause |
|-------|---------|-----------------|
| T0 | PF-K09 R · PF-K03 A | Basis/funding stress |
| Parallel | SP depth OK (SP-K02 G) but perp thin **or** vice versa | One-leg liquidity hole |
| Optional | PL-K01/withdraw friction blocks arb | Rails / run |
| Optional | MG-K01 R if spot-leg financed on margin | Capital constraint |

**Vs S2:** PF-K02 G and PL-K06 G required to trust basis reading.

#### Scenario family S12 — Post-incident recovery (colours improving)

| Phase | Cluster | Meaning |
|-------|---------|---------|
| Tn | Was R, now A, peers still A | Recovering — keep hypercare |
| Tn | Primary G but PF-K07 still A | Price OK, **fund not rebuilt** — don't reset leverage yet |
| Tn | All G except PL-K05 A/R | Market OK, **books not clean** — block settlement |

---

### 9.5 Cluster lookup (symptoms → scenario family)

| You see (approx. order) | Consider first | Then check |
|-------------------------|----------------|------------|
| Externals dump → SP/PF price KRIs → liqs → insurance | **S1** | S6 if ADL |
| PL-K06/PF-K02 first → PF-K01 → spurious liqs | **S2** | Pause liq |
| MG-K08 first → margin liqs / bad debt | **S3** | Oracle vs real peg |
| SP-K09/deploy first → spreads/depth | **S4** | Rollback |
| Single-symbol depth/spread R; rest G | **S5** or **S7** | MM heartbeat vs SP-K08 |
| Crowding KRIs then liq then insurance then ADL | **S6** | ADL order sanity |
| SP-K08/CP first | **S7** | Holds |
| PL-K01/02 lead; security G | **S8** | Slow-mode |
| PL-K08 or key anomaly leads | **Security / L4** (not pure S8) | — |
| Everything G amid chaos | **S9** | Timestamps |
| New listing only | **S10** | Delist / tags |
| Basis/funding extremes; feeds G | **S11** | Rails / borrow |

---

### 9.6 Worked mini-examples (time-stamped)

#### Example A — Amber alone

`10:00:00Z SP-K01 A on ALT/USDT; SP-K02 G; SP-K09 G; PL-K06 G`

- Plausible: MM intentional widen; mild vol; one LP offline but others fill depth.  
- Not yet: full outage (depth still G), engine issue (latency G), feed lie (PL-K06 G).  
- Action: L1 watch 15m; if depth flips A/R → treat as S5.

#### Example B — Red cluster with sequence

```
14:00:00Z  External USDX peg 0.97 (off-site)
14:00:05Z  MG-K08 R
14:00:40Z  MG-K02 R (many UIDs) · MG-K03 A
14:05:00Z  MG-K04 A · MG-K01 R (USDC borrow)
14:10:00Z  PL-K01 A
```

- Diagnosis: **S3** real depeg contagion (not S2 — external peg confirms).  
- Actions: haircut/borrow freeze; liq capacity; Treasury; L3 bridge.

#### Example C — Same reds, different sequence → different cause

```
# Case C1
09:00:00Z  PL-K06 R
09:00:10Z  PF-K01 R · MG-K08 R (stable mark stuck)
09:01:00Z  PF-K06 R
→ Prefer S2 (data). Externals peg still 1.00.

# Case C2
09:00:00Z  External peg break
09:00:10Z  MG-K08 R · PF-K01 A
09:01:00Z  PF-K06 A · PL-K06 G
→ Prefer S3. Do not pause marks; do adjust haircuts.
```

#### Example D — Green + Red contradiction

`PF-K06 R (liq burst) + PF-K01 G + PL-K06 G + externals flat`

- Plausible: liq engine bug; wrong contract config; test traffic in prod; ADL/liq bot loop.  
- Unlikely: honest market cascade (needs price KRIs or externals).  
- Escalate **L3/Sev-1**; consider RE-02 pause.

---

### 9.7 RO-OPS triage card (print / pinned)

1. Screenshot RAG panel + **timestamps** (not only colours).  
2. Mark primary indicator + list all A/R within ±15m.  
3. Draw sequence arrows (T0…Tn).  
4. Pick family S1–S12 from §9.5; note ruled-out families.  
5. Execute §8 auto/human actions for primary + cluster.  
6. Escalation level from worst KRI + family (S2/S8-security/S9 → bias up).  
7. Paste timeline into ticket before handoff.

---

## 10. Incident severity & war room

| Sev | Definition | War room chair |
|-----|------------|----------------|
| Sev-1 | Client asset loss risk, engine integrity fail, widespread wrong marks | CRO or CTO |
| Sev-2 | Material bad debt, ADL storm, prolonged halt | BU PIC + RO |
| Sev-3 | Degraded feature, single-market issue | BU PIC |
| Sev-4 | Cosmetic / minor | On-call |

**Standing war-room roles:** Incident Commander · Risk · ME · RE · Wallet · Comms · CP · Scribe  

**Always capture:** timeline (§9 clock), configs touched, orders/liquidations during incident, ruled-in scenario family (S1–S12), client impact, permanent fix owner.

**Scenario → severity hints:** S2 spurious mass liqs · S8 with PL-K08 · S9 false-green in crisis → start at **Sev-1** until proven otherwise. S5 single-name MM → often Sev-3. S1 orderly risk-off with insurance G → Sev-2/3 ops mode.

---

## 11. Appendix — glossary & checklists

### 11.1 Glossary (short)

| Term | Meaning |
|------|---------|
| Mark price | Fair price for PnL & liquidation (perps) |
| Index price | Multi-venue composite underlying |
| Funding | Periodic payment long↔short to anchor perp to spot |
| ADL | Auto-deleveraging of opposing profitable positions |
| LTV | Loan-to-value for margin |
| STP | Self-trade prevention |
| Insurance fund | Backstop for bankrupt liquidations |
| Reduce-only | Orders that only decrease position |
| Tier A+ | Materiality band requiring four-eyes |
| RAG | Red / Amber / Green indicator state (§9) |
| Scenario family | Named multi-KRI pattern S1–S12 (§9.4) |

### 11.2 BU PIC weekly checklist

- [ ] Review open WARNs/BREACHes and waivers nearing expiry (ACK SLA breaches noted)  
- [ ] Confirm admin ACL joiner/mover/leaver tickets closed  
- [ ] Instrument KRI RAG vs §8 catalogue (Spot SP-K*, Margin MG-K*, Perps PF-K*, Platform PL-K*)  
- [ ] Spot-check one amber using §9 single-indicator causes + sequence  
- [ ] Attest weekly PIC pack: false-positive rate + any threshold calib requests  
- [ ] Upcoming listings/delistings risk opinions scheduled  
- [ ] DR / failover or liquidation dry-run status (monthly at minimum)  
- [ ] Read-across: any Spot issue that should change Margin/Perps params  

### 11.3 Go-live checklist — Perps (summary)

- [ ] Contract specs signed (PM + Legal)  
- [ ] Index constituents ≥ policy minimum; **PF-K01/PF-K02** alerts on  
- [ ] Leverage brackets & risk limits dual-approved; **PF-K04/PF-K05** wired  
- [ ] Insurance fund seed per policy; **PF-K07/PF-K08** dashboards live  
- [ ] Funding formula & caps tested; **PF-K03** clamp verified  
- [ ] Liquidation & ADL dry-run signed by RE + RO (**PF-K06**)  
- [ ] Matching symbol configured; rate limits set  
- [ ] Comms + support macros  
- [ ] Hypercare roster 72h  
- [ ] RO-OPS briefed on S2 vs S1 discrimination for this contract  

### 11.4 Go-live checklist — Margin asset

- [ ] Spot market stable ≥ observation window  
- [ ] Haircut/LTV stress-tested (DA); **MG-K05** baseline recorded  
- [ ] Borrow inventory & caps set; **MG-K01/MG-K09** alerts on  
- [ ] Interest curve approved; **MG-K07** recon green  
- [ ] Liquidation path tested on isolated + cross (**MG-K02/MG-K03**)  
- [ ] Bad-debt ledger mapping ready (**MG-K04**)  
- [ ] Depeg tabletop (S3) completed if stable / soft-peg collateral  

### 11.5 Go-live checklist — Spot

- [ ] Listing diligence complete (LI/RO/CP/Legal)  
- [ ] Wallet deposit/withdraw enabled on correct chain(s); **PL-K01** buffer OK  
- [ ] Tick/lot/bands/STP/fees configured; **SP-K03/SP-K05** live  
- [ ] MM SLA live or disclosure if thin book; **SP-K01/SP-K02** wired  
- [ ] Halt authority tested (**SP-K06**)  

### 11.6 Document control

| Item | Value |
|------|-------|
| Classification | Internal — Risk Restricted |
| Change control | CRO approve; publish via Risk portal |
| Related artefacts | Limit Book, Liquidation Policy, Insurance/ADL Policy, Listing Policy, BCP/DR, **§8 Indicator Catalogue**, **§9 Scenario Diagnostics** |
| Training | Mandatory for all BU PICs within 30 days of role start |
| Version | 1.3 — RAG scenarios + appended Simplified Chinese full translation |

---

*End of English handbook. Simplified Chinese full translation follows.*

---

# 语言 / Language

| Version | 说明 |
|---------|------|
| English | 上文（§1–§11） |
| 简体中文 | 下文（完整译本，指标编号 / SOP / 管理后台路径与英文版一致） |

---

# 加密货币交易所风险管理 — 业务单元（BU）用户手册（简体中文）

**读者：** 业务单元负责人（BU PIC）、风险官（RO）、产品、交易运维、工程、合规、资金、上币、托管  
**范围：** 现货（Spot）· 全仓/逐仓杠杆（Margin）· U本位/币本位永续合约（Perps；定期合约如有则另注）  
**版本：** 1.2 · **归属：** 首席风险官（第二道防线）· **审阅周期：** 每季度或重大事件后  

> 本手册为**操作手册**：明确职责边界、分工、SOP、管理后台、指标/阈值/动作、情景诊断与日常工具。不替代法律政策、限额手册或监管申报。  
> **下文阈值为一级交易所框架的示意默认值** — 须按《限额手册》校准；未经 RO 双人审批不得直接用于生产。

---

## 目录

1. [如何使用本手册](#中文-1-如何使用本手册)
2. [三道防线与角色映射](#中文-2-三道防线与角色映射)
3. [产品入门（现货 / 杠杆 / 永续）](#中文-3-产品入门现货--杠杆--永续)
4. [分 BU 作战手册](#中文-4-分-bu-作战手册)
5. [跨 BU RACI 矩阵](#中文-5-跨-bu-raci-矩阵)
6. [全局 SOP（共用）](#中文-6-全局-sop共用)
7. [管理后台与工具目录](#中文-7-管理后台与工具目录)
8. [限额、KRI、阈值、动作与升级](#中文-8-限额kri阈值动作与升级)
9. [风险情景诊断（红黄绿 + 时序）](#中文-9-风险情景诊断红黄绿--时序)
10. [事件定级与战时指挥](#中文-10-事件定级与战时指挥)
11. [附录 — 术语与检查清单](#中文-11-附录--术语与检查清单)

---

## 中文 1. 如何使用本手册

| 如果你是… | 优先阅读 |
|-----------|----------|
| 新任 BU PIC | 中文 §2–§4（本 BU）+ §7 工具 |
| 风险官 / 风险运维 | 全文；主责 §8 指标目录、§9 情景、§10 事件 |
| 产品（现货/杠杆/合约） | §3 + 对应产品 BU 章 + 上币 SOP |
| 工程 / SRE（撮合、风控引擎、钱包） | 对应技术 BU 章 + 容灾 SOP |
| 合规 / 监察 | 合规 BU + 市场操纵类 SOP |
| 上币 / 下币 PIC | 上币 BU 章全文 |

**铁律**

1. **禁止静默改限额** — 每一笔硬限额变更须工单、双人审批、可审计。  
2. **职责分离** — 申请人 ≠ 审批人；对 A 级变更 maker ≠ checker。  
3. **产品差异意识** — 现货 ≠ 杠杆 ≠ 永续。强平、保险金机制不同，禁止照搬配置。  
4. **盘前 / 盘中 / 盘后** — 重大风险尽量在三层各有控制。  
5. **客户资产优先** — 压力情境下，钱包/托管与提现完整性高于营收功能。

---

## 中文 2. 三道防线与角色映射

### 2.1 三道防线

| 防线 | 谁 | 职责 |
|------|-----|------|
| **第一道** | 产品 BU、交易运维、撮合、钱包运维、上币、做市运维 | BAU 中承担风险；执行控制；升级突破 |
| **第二道** | 市场风险、信用/强平风险、模型风险、合规、法务 | 设定风险偏好与政策；独立挑战与监控 |
| **第三道** | 内部审计 | 对设计与运行有效性做独立鉴证 |

### 2.2 标准角色代码（工单与后台 ACL）

| 代码 | 角色 | 典型 BU |
|------|------|---------|
| **CRO** | 首席风险官 | 风险 |
| **RO** | 风险官（第二道） | 风险 |
| **RO-OPS** | 风险运维（7×24） | 风险运维 |
| **PM** | 产品经理 | 现货 / 杠杆 / 合约产品 |
| **TO** | 交易运维 | 交易运维 |
| **ME** | 撮合引擎负责人 | 撮合 / 交易核心 |
| **RE** | 风控引擎负责人 | 风控系统 |
| **WO** | 钱包 / 托管运维 | 托管 |
| **LI** | 上币负责人 | 上币与代币尽调 |
| **CP** | 合规 / 监察 | 合规 |
| **TS** | 资金 / 结算 | 资金 |
| **MM** | 做市 / 流动性运维 | 流动性 |
| **ENG** | 工程值班 | 平台 |
| **SRE** | 站点可靠性 | 基础设施 |
| **DA** | 数据 / 量化 / 模型 | 风险量化 |
| **TR** | 内部交易 / VIP 台（如有） | 自营 / VIP |

---

## 中文 3. 产品入门（现货 / 杠杆 / 永续）

配置限额、撰写 SOP、选择管理后台时使用本节。

### 3.1 现货 Spot

| 主题 | 风险含义 |
|------|----------|
| **是什么** | 标的/计价即时买卖；产品本身无杠杆 |
| **主要风险** | 操纵、fat-finger、上币质量、钱包结算、法币通道 |
| **关键控制** | 价格带、最大下单、自成交防护（STP）、停牌、充提闸门 |
| **无强平引擎** | 客户亏损原则上以已付金额为限（充提差错除外） |
| **后台重点** | 交易对配置、费率档、STP、停复牌、行情元数据 |

### 3.2 杠杆 Margin（全仓与逐仓）

| 主题 | 风险含义 |
|------|----------|
| **是什么** | 借入资金放大现货敞口；借款计息 |
| **逐仓 Isolated** | 保证金与强平限于单一仓位/交易对 |
| **全仓 Cross** | 抵押品在账户内共享；账户内传染 |
| **主要风险** | 借款违约、强平缺口、利率配错、折扣不足 |
| **关键控制** | LTV/保证金率、分资产借款上限、利率曲线、强平瀑布、负余额自动还款 |
| **后台重点** | 抵押品档位、借款白名单、LTV 档、利率、强制平仓台 |

### 3.3 永续合约 Perps（U 本位 / 币本位）

| 主题 | 风险含义 |
|------|----------|
| **是什么** | 无到期杠杆衍生品；资金费率在多空间交换 |
| **标记价 vs 最新价** | 标记价驱动未实现盈亏与强平；最新价用于撮合成交 |
| **主要风险** | 杠杆连环强平、保险基金耗尽、标记/指数操纵、极端资金费、ADL |
| **关键控制** | 分档杠杆、持仓名义上限、多交易所指数、资金费封顶、保险基金、ADL 队列 |
| **后台重点** | 杠杆档、风险限额、资金费公式、保险基金看板、ADL、熔断 |

### 3.4 产品对比（运维速查）

| 维度 | 现货 | 杠杆 | 永续 |
|------|------|------|------|
| 杠杆 | 1× | 可配（如最高 5–10×） | 分档（如按 VIP/名义最高 20–125×） |
| 强平 | 无 | 追加保证金 → 强制卖出 | 保证金率 → 强制平仓 → ADL |
| 保险 | 无 / 平台运营 | 部分（借款损失） | 保险基金 + ADL |
| 指数关键性 | 低–中 | 中 | **极高** |
| 资金成本 | 无 | 借款利息 | 周期性资金费率 |
| 停牌影响 | 订单簿冻结 | 借款+强平可按 SOP 继续 | 强平/资金费可按 SOP 继续 |
| 典型 KRI | 撤单/成交比、停牌次数 | 借款占用、强平量、坏账 | 保险余额、ADL、基差、标记–指数偏离 |

---

## 中文 4. 分 BU 作战手册

各章统一模板：**范围内/外 → 分工 → SOP → 工具 → 管理后台 → 交接**。

### 4.1 市场风险与风险运维（第二道）— RO / RO-OPS / CRO

**范围内：** 全公司风险偏好与限额手册（现货/杠杆/永续）；实时监控；强平/保险/ADL 监督；压力测试目录审批；新产品风险会签；上币风险意见；突破调查、豁免治理、日报。  

**范围外：** 撮合日常调优（ME）；热钱包签名作业（WO）；KYC 准入决定（CP）— 风险冻结除外。

| 角色 | 负责 |
|------|------|
| CRO | 偏好、董事会材料、重大豁免 |
| RO（市场） | 永续/现货市场风险限额、压力情景目录 |
| RO（信用/强平） | 杠杆 LTV、借款上限、强平参数、保险基金政策 |
| RO-OPS | 7×24 告警确认、初判、Sev-1/2 升级 |
| DA | 模型、标记/指数方法论挑战、压力引擎 |

**SOP：** RM-01 每日风险包 · RM-02 软限额 WARN · RM-03 硬限额 BREACH · RM-04 杠杆/权限上调审批 · RM-05 压力目录变更 · RM-06 保险动用复核 · RM-07 停牌建议  

**工具：** 实时风险指标与告警；压力/情景台；风险报告与 CSV；强平与保险看板；交易员权限/杠杆申请（maker–checker）  

**后台：** `/admin/risk/limits` · `alerts` · `stress` · `insurance` · `reports` · `waivers`  

### 4.2 现货产品与交易运维 — PM-SPOT / TO

**范围内：** 现货交易对生命周期（上币后配置）；费率、订单类型、STP、价格保护带；停复牌执行；市场质量 KRI；风险披露文案（会同法务）。  
**范围外：** 杠杆 LTV/利息（杠杆 BU）；永续资金费/保险（合约 BU）；链上托管密钥（钱包）。

**SOP：** SP-01 上线清单 · SP-02 停牌 · SP-03 复牌 · SP-04 价格带/名义上限变更 · SP-05 对倒/自成交移交  

**后台：** `/admin/spot/symbols` · `bands` · `halt` · `fees` · `stp`

### 4.3 杠杆产品与信用运维 — PM-MARGIN / RO-CREDIT / TO

**范围内：** 全仓/逐仓规则；抵押品白名单、折扣、LTV；借款上限与利率曲线；追加保证金/强平参数；坏账处置；抵押品暴跌+借币挤兑压力。  

**SOP：** MG-01 新增抵押品 · MG-02 折扣/LTV 变更 · MG-03 借款冻结 · MG-04 强制平仓手册 · MG-05 坏账核销/追偿 · MG-06 利率曲线更新  

**后台：** `/admin/margin/collateral` · `ltv` · `borrow` · `interest` · `liquidation` · `bad-debt`

### 4.4 合约 / 永续产品与强平运维 — PM-FUT / RO / TO-FUT

**范围内：** U/币本位永续（及定期合约）；杠杆档与持仓限额；标记价/指数成分与偏离告警；资金费公式与结算；保险基金与 ADL；熔断、冲击缓冲、只减仓。  

**SOP：** PF-01 新合约上线 · PF-02 杠杆档变更 · PF-03 标记–指数偏离响应 · PF-04 极端资金费/暂停 · PF-05 保险赔付复核 · PF-06 ADL 启动复核 · PF-07 停牌/只减仓 · PF-08 指数成分交易所故障  

**后台：** `/admin/futures/contracts` · `leverage` · `risk-limits` · `mark-index` · `funding` · `insurance` · `adl` · `breaker`

### 4.5 撮合引擎与交易核心 — ME / SRE / ENG

**范围内：** 撮合正确性、时延 SLO、公平性；容灾双活一致性；Kill switch、断线撤单、STP；容量（撤单风暴、强平洪峰）；分片与限频。  

**SOP：** ME-01 发布/回滚 · ME-02 撮合停机 · ME-03 双活切换 · ME-04 撤单风暴抑制 · ME-05 故障后订单簿校验  

**后台：** `/admin/engine/status` · `kill` · `rate-limits` · `stp` · `failover`

### 4.6 风控引擎、清算与强平系统 — RE / DA

**范围内：** 保证金率、破产价、强平引擎；盘中限额执行；已批准配置推送生产；风险状态与撮合/钱包对账；统一账户/组合保证金（如已上线）。  

**SOP：** RE-01 配置晋级 · RE-02 强平引擎暂停/恢复 · RE-03 标记价源切换 · RE-04 风险状态重建 · RE-05 组合保证金模型变更  

**后台：** `/admin/risk-engine/configs` · `liq` · `feeds` · `sim`  
**仓内模块：** `risk_metrics_monitor.py` · `stress_testing.py` · `trader_rights_workflow.py`

### 4.7 钱包、托管与提现 — WO / TS / SRE

**范围内：** 热/温/冷/MPC 密钥作业；充值归属、旅行规则、提现筛查挂钩；终局性与重组、错链处理；提现流动性缓冲（挤兑风险）；储备证明支持。  

**SOP：** WA-01 热钱包补款 · WA-02 提现排队/慢速模式 · WA-03 链停/重组 · WA-04 错充找回 · WA-05 密钥仪式/轮换 · WA-06 PoR 快照  

**后台：** `/admin/wallet/balances` · `withdraw` · `deposit` · `keys` · `chains`

### 4.8 上币、下币与代币尽调 — LI / RO / CP / Legal

**范围内：** 新现货对、杠杆资格、永续合约；合约风险（增发、可升级、暂停、黑名单）；流动性与解锁；种子/监控标签；跨产品下币；更名/迁移/代码冲突。  

**SOP：** LD-01 上币风险意见 · LD-02 种子/监控标签 · LD-03 杠杆资格 · LD-04 永续上线决定 · LD-05/06/07 现货/杠杆/永续下币序列 · LD-08 紧急下币/停牌  

**强制下币顺序：** 风险+法务+合规批准 → **永续**只减仓→平仓/到期→下线 → **杠杆**冻借款→强平还款→移出抵押 → **现货**必要时停牌→关闭交易→提现按 WA SOP → 对外沟通与客服话术。

### 4.9 合规、监察与市场滥用 — CP

**范围内：** KYC/AML、制裁、旅行规则；监察（幌骗、分层、对倒、内幕）；跨现货/杠杆/永续调查；监管报送；硬冻结（交易/提现/杠杆）。  

**SOP：** CP-01 告警分流 · CP-02 账户硬冻结 · CP-03 跨产品滥用复核 · CP-04 监管协查/冻结  

**后台：** `/admin/compliance/surveillance` · `holds` · `kyb-kyc` · `sanctions`

### 4.10–4.12 资金结算、做市、平台工程

- **TS：** 法币通道、银行集中度、日终结算、保险/SAFU 现金管理、稳定币库存与兑付。SOP：TS-01~04。后台：`/admin/treasury/*`  
- **MM：** 做市 SLA、库存与逆向选择、信息隔离。SOP：MM-01~03。后台：`/admin/mm/*`  
- **ENG/SRE/安全/DA：** 安全开发生命周期、审计日志、风险数据管道、漏洞赏金。SOP：ENG-01~04  

---

## 中文 5. 跨 BU RACI 矩阵

**R** 执行 · **A** 问责 · **C** 咨询 · **I** 知会  

| 活动 | 现货 | 杠杆 | 合约 | ME | RE | 钱包 | 上币 | 风险 | 合规 | 资金 |
|------|------|------|------|----|----|------|------|------|------|------|
| 现货停复牌 | **R** | I | I | **R** | C | C | I | **A** | C | I |
| 杠杆 LTV 变更 | I | **R** | C | I | **R** | I | C | **A** | C | I |
| 永续杠杆档 | I | C | **R** | I | **R** | I | C | **A** | C | I |
| 新上币上线 | C | C | C | C | C | C | **R** | **A** | **R** | I |
| 多产品下币 | **R** | **R** | **R** | C | C | **R** | **A** | **A** | **R** | C |
| 保险赔付 | I | C | **R** | I | C | I | I | **A** | I | **R** |
| ADL 事件 | I | I | **R** | I | **R** | I | I | **A** | I | I |
| 提现慢速模式 | I | I | I | I | I | **R** | I | **A** | C | **R** |
| 标记/指数变更 | I | C | **R** | I | **R** | I | C | **A** | C | I |
| 监察硬冻结 | C | C | C | I | C | C | I | C | **A/R** | I |
| 日终对账 | C | C | C | C | C | C | I | C | I | **A**+运维 **R** |
| 压力目录 | C | C | C | I | C | I | C | **A** | I | I |
| 交易员权限/加杠杆 | C | C | C | I | **R** | I | I | **A** | **C** | I |

---

## 中文 6. 全局 SOP（共用）

### SOP-G01 — 限额变更（全产品）
提工单（产品类型 SPOT/MARGIN/PERP、标的、旧→新、理由、压力影响）→ 系统生成影响包 → **Maker(RO)** 审批 → A+ 级 **Checker** 四眼 → RE 晋级配置 → ME/产品确认 → RO-OPS 超护 24h → 关闭工单并记录配置哈希。

### SOP-G02 — 停牌（现货 vs 永续/杠杆）
TO 提议、RO 批准 → ME 停撮合（永续可停新开仓，强平按 RE SOP）→ 钱包通常保持提现（除非 CP/风险另令）→ 沟通（永续须说明资金费/强平）→ 复牌须 RO+ME+产品（永续另须标记源健康）。

### SOP-G03 — 告警确认
RO-OPS：WARN ≤15 分 / BREACH ≤5 分确认 → 区分数据质量 vs 真实风险 → 真实 BREACH：遏制（只减仓/冻借款/停牌）→ Sev-1 呼叫 BU PIC+CRO → Sev-1/2 五个工作日内复盘。

### SOP-G04 — Maker–Checker 与职责分离
交易员不得自批杠杆；A 级配置部署者不得单独终批；钱包密钥仪式多方；合规解冻双控。

### SOP-G05 — 日终对账与结算
系统撮合内部确认 vs 账本/券商 → 例外由清算/TO 处理 → 重大差额二审 → 批准后 `SettlementReady` → TS 执行 → 按合规留存证据。

### SOP-G06 — 新产品/新合约准入
门禁顺序：**法务 → 合规 → 上币尽调 → 风险意见 → 产品清单 → RE/ME 配置 → 钱包充值就绪 → 软启动 → 超护**。风险 **A** 与合规放行前禁止生产流量。

---

## 中文 7. 管理后台与工具目录

| 域 | 路径前缀 | 主责 BU |
|----|----------|---------|
| 风险限额与告警 | `/admin/risk/*` | RO / RO-OPS |
| 风控引擎 | `/admin/risk-engine/*` | RE |
| 现货 | `/admin/spot/*` | 现货 PM / TO |
| 杠杆 | `/admin/margin/*` | 杠杆 PM / RO-Credit |
| 合约/永续 | `/admin/futures/*` | 合约 PM / TO-FUT |
| 撮合 | `/admin/engine/*` | ME / SRE |
| 钱包 | `/admin/wallet/*` | WO |
| 上币 | `/admin/listing/*` | LI |
| 合规 | `/admin/compliance/*` | CP |
| 资金 | `/admin/treasury/*` | TS |
| 做市 | `/admin/mm/*` | MM |
| 权限与审计 | `/admin/iam/*`, `/admin/audit/*` | 安全 / ENG |

**工具对齐仓内模块：** `risk_metrics_monitor.py`（实时指标）· `trader_rights_workflow.py`（杠杆/权限）· `stress_testing.py` · `risk_reporting.py` · `eod_reconciliation.py` · `performance_attribution.py` · `05-use-case-narrative-flowchart.drawio`

**ACL 原则：** 最小权限；Kill/密钥/制裁覆盖/保险注资/A 级限额双控；变更不可篡改审计；破窗账户限时+自动工单+通知 CRO/CISO；分析尽量用只读副本。

---

## 中文 8. 限额、KRI、阈值、动作与升级

### 8.1 读法

| 列 | 含义 |
|----|------|
| **ID** | 工单/告警/看板稳定编码 |
| **指标** | 度量内容 |
| **频率** | 监控/计算节奏 |
| **WARN（黄）** | 软阈 — 调查；默认可不自动阻断 |
| **BREACH（红）** | 硬阈 — 必须动作（自动和/或人工） |
| **自动动作** | 系统即时响应 |
| **人工动作** | 运维/风险必做步骤 |
| **升级** | 呼叫对象与阶梯（见 8.2） |
| **主责** | 响应质量主责 BU |

**确认 SLA（RO-OPS）：** WARN ≤15 分 · BREACH ≤5 分 · Kill/客户资产 ≤2 分。  
阈值变更走 SOP-G01；标 *calib.* 须替换为《限额手册》数值。

### 8.2 升级阶梯

| 级别 | 标准 | 通知 | 建桥时限 |
|------|------|------|----------|
| **L1** | 单笔 WARN；疑似数据质量；无客户影响 | RO-OPS | 工单即可 |
| **L2** | 硬突破且限于 1 标的/账户类；可逆 | RO + BU PIC（引擎相关含 RE） | 15 分 |
| **L3** | 多标的连环、保险动用、ADL 风暴、长时间停牌 | CRO + 产品 PIC + ME + RE + 传播 | 立即 |
| **L4** | 客户资金威胁、密钥/API 失陷、全站停牌、大范围错价 | ELT · 危机传播 · 法务 · 合规 · CISO | 立即+高管桥 |

### 8.3 限额类型

软（WARN）/ 硬（BREACH）/ Kill（撮合总闸、提现冻结等）。

### 8.4 现货指标（摘要表）

| ID | 指标 | 频率 | WARN | BREACH | 自动动作 | 人工动作 | 升级 | 主责 |
|----|------|------|------|--------|----------|----------|------|------|
| **SP-K01** | 买卖价差相对 30 日中位数 | 1s/1m | ≥3× 持续 5m | ≥5× 持续 2m 或瞬间 ≥10× | 做市告警 | 查 SLA/联系 MM | L1→L2 | 现货 TO/MM |
| **SP-K02** | ±2% 盘口深度名义 | 1s/1m | <SLA 50%×5m | <SLA 25%×2m | 呼叫 MM | 执行 SLA；可建议停牌 | L2 | MM/TO |
| **SP-K03** | 最新价相对参考/指数偏离 | 1s | ≥2%×30s（主流 *calib.*） | ≥5%×15s 或瞬间 ≥10% | 价格带拒单 | 停牌候选；疑操纵交 CP | L2→L3 | TO/RO |
| **SP-K04** | 撤单/成交比 | 1m | >50:1×10m | >100:1 或 API 滥用 | 限频/拒撤 | 限流；监察立案 | L1→L2 | ME/CP |
| **SP-K05** | Fat-finger / 最大名义命中 | 逐笔+5m | 拒单次数过高 | 单笔触硬顶 | 拒单 | VIP 例外复核 | L1 | ME/TO |
| **SP-K06** | 现货停牌次数 | 事件+日 | 主流 ≥1 次/日 | ≥3 次/日或停牌 >60m | — | 复盘；传播 | L2→L3 | TO/RO |
| **SP-K07** | 充→交易→提速度（UID） | 事件/5m | 相对同侪异常 | 旅行规则/AML 命中 | 扣留提现 | CP 调查后放行 | L2 | CP/WO |
| **SP-K08** | 自成交/对倒评分 | 1m/批 | ≥WARN 切点 | ≥BREACH 切点 | STP/标记 | 立案；可硬冻结 | L2 | CP |
| **SP-K09** | 撮合时延 p99 | 10s | >2×SLO | >5×SLO 或丢单 >0.1% | 降非关键流量 | 缓解；可停牌 | L2→L3 | ME/SRE |
| **SP-K10** | 新币/种子标签 24h 波动 | 1m | 日振幅 >政策 A | >政策 B 或自上市 −50% | 收紧价格带 | 监控标签；欺诈则下币 | L2 | LI/RO |

### 8.5 杠杆指标（摘要表）

| ID | 指标 | 频率 | WARN | BREACH | 自动动作 | 人工动作 | 升级 | 主责 |
|----|------|------|------|--------|----------|----------|------|------|
| **MG-K01** | 资产借款占用（借/库存） | 1m | ≥80% | ≥95% | 利率阶跃；节流新借 | 持续则冻借款 | L2 | RO-Credit/TS |
| **MG-K02** | 用户保证金率/LTV | 1s | 距强平线 10% 内 | 穿强平线 | 追加→强平引擎 | 监控队列；仅按 RE-02 暂停 | L1→L2 | RE/TO |
| **MG-K03** | 平台强平名义（5m/1h） | 1m | >30 日 95 分位 2× | >5× 或引擎延迟 >30s | 抑制增险订单 | 可冻借款+收紧现货带 | L2→L3 | RO/RE |
| **MG-K04** | 坏账/负余额 | 事件+日 | 任笔 >$X | 日合计 >$Y 或单笔 >$Z | 自动还款尝试；隔离 UID | 追偿入账；A 级报 CRO | L2→L3 | RO-Credit/TS |
| **MG-K05** | 折扣相对实现波动缺口 | 时/日 | 波动升一档而折扣未动 | 日压测 LTV 突破 | — | 提折扣/LTV 变更 | L2 | DA/RO-Credit |
| **MG-K06** | 全仓传染评分 | 1m | 高 HHI+高 LTV | 多腿近强平 | 只减仓 | 政策允许则强制减仓 | L2 | RO-Credit |
| **MG-K07** | 利息计提例外 | 时 | 错配数 >0 | 名义突破容差 | 阻断曲线推送 | 对账；停利率更新 | L2 | TS/ENG |
| **MG-K08** | 稳定币抵押脱锚 | 1s | <0.995×5m | <0.99×2m 或瞬间 <0.98 | 折扣上调；冻该资产借款 | 兑付手册；压力 | L2→L3 | TS/RO |
| **MG-K09** | VIP 借款集中度 | 日 | Top10 >40% | Top10 >60% 或单一 >25% | 限制新 VIP 借 | 信用复核降额 | L2 | RO-Credit |
| **MG-K10** | 强平滑点 vs 破产价 | 逐笔+日 | 均滑点 >缓冲/2 | 滑点吃光缓冲→坏账 | — | 调冲击缓冲；检强平时做市 | L2 | RO/DA |

### 8.6 永续指标（摘要表）

| ID | 指标 | 频率 | WARN | BREACH | 自动动作 | 人工动作 | 升级 | 主责 |
|----|------|------|------|--------|----------|----------|------|------|
| **PF-K01** | 标记−指数偏离 | 1s | 主流 ≥0.5% / 山寨 ≥1.5% | 主流 ≥1.5% / 山寨 ≥3%×30s 或尖峰 ≥5% | 标记保护；拒操纵成交 | PF-03；可只减仓 | L2→L3 | RO/RE/DA |
| **PF-K02** | 指数成分陈旧/异常 | 1s | 1 所陈旧 >5s | 少于最少所数或 2+ 陈旧 | 踢出坏成分 | PF-08；临时权重审批 | L2 | DA/RE |
| **PF-K03** | 资金费率相对上限 | 周期+1m 预测 | ≥上限 75% | 触顶或预测触顶 | 钳制在上限 | PF-04；极端可双人暂停 | L2 | PM-FUT/RO |
| **PF-K04** | 持仓量 vs OI 上限 | 1m | ≥80% | ≥100%（禁增仓） | 拒增险开仓 | 限额复核 | L2 | RO/TO-FUT |
| **PF-K05** | 用户/VIP 名义 vs 限额 | 逐笔 | ≥80% | ≥100% | 拒单/只减仓 | 权限上调走流程 | L1→L2 | RE/RO |
| **PF-K06** | 强平名义洪峰 | 1s–1m | >30 日 99 分位 2× | >5× 或队列延迟 >15s | 减速开仓；分批强平 | 只减仓；盯保险 | L2→L3 | TO-FUT/RE |
| **PF-K07** | 保险基金覆盖率 | 1m/事件 | <政策地板压力 120% | <100% 或单笔赔付过大 | — | PF-05；备 ADL；CRO 注资决策 | L3 | RO/TS |
| **PF-K08** | ADL 事件 | 事件 | 任一 ADL | ≥3 次/时或主流 ADL | 执行 ADL 队列 | PF-06；传播；查滥用 | L3 | TO-FUT/RO |
| **PF-K09** | 基差（永续中间价−现货） | 1m | 出 30 日 95% 带 | 极端基差+薄盘 | — | 查指数/资金费；可只减仓 | L2 | DA/RO |
| **PF-K10** | Top-N 多空集中度 | 5m/日 | Top10 单边 >30% OI | >50% 或单一 >15% | 收紧 UID 限额 | 集中度处置；夹空嫌疑交 CP | L2 | RO/CP |
| **PF-K11** | 顶档杠杆使用占比 | 5m | >20% 用户在顶档 | >40% 或压力中急升 | — | 考虑收紧档位 | L2 | RO/PM-FUT |
| **PF-K12** | 保险赔付/破产笔数 | 事件+日 | 任一破产成交 | 日赔付合计 >Y | 动用保险 | 入账；挑战强平质量 | L2→L3 | RO/TS |

### 8.7 平台横切指标（摘要）

| ID | 指标 | 要点 |
|----|------|------|
| **PL-K01** | 热钱包缓冲 vs 24h 提现 p95 | WARN <150% / BREACH <100% → 慢速模式 + 补款 |
| **PL-K02** | 提现积压年龄 p95 | WARN >30m / BREACH >2h |
| **PL-K03** | 充值入账滞后 | BREACH >4× 预期或静默失败 |
| **PL-K04** | 重组深度 | 影响已入账 → 暂停入账 L3 |
| **PL-K05** | 日终对账差额 | 重大 → 阻断结算 |
| **PL-K06** | 标记/风险管道延迟 | >5s → 切源；不安全则暂停强平 |
| **PL-K07** | 破窗/绕过双控 | 任意使用告警；无工单 → L3–L4 |
| **PL-K08** | API 密钥异常 | BREACH → 杀钥 L3–L4 |
| **PL-K09** | 台/公司 VaR 或回撤 | ≥100% 限额 → 冻结加仓 |
| **PL-K10** | 压力测试冲击后缺口 | 核心情景超偏好 → 收紧限额 |
| **PL-K11** | 监察案件超龄 | >2×SLA 且仍有敞口 → 硬冻结评估 |
| **PL-K12** | 上币尽调超期 | 无风险/合规放行却有流量 → 阻断上线 |

### 8.8 组合保证金（如启用）
**PM-K01** 模型缺口 >25% → 保守模式/关特性；**PM-K02** 现货–永续对冲破裂 → 追加保证金。

### 8.9 监控频率分层
流式（tick–1s）→ 近实时（1–5m）→ 盘中（15–60m）→ 日切 MI 包 → 周 PIC 认证 → 季校准。

### 8.10 告警状态机
检测 → WARN|BREACH|KILL 路由 → SLA 内确认 → 数据质量？→ 真实风险则核对自动动作有效性 → 产品 SOP 人工遏制 → 超时升 L+1 → 遏制后超护 → Sev-1/2 进战时与复盘。  
**默认 TTE：** WARN 30–60 分无方案；BREACH 15 分；Kill/客户资产 0（立即 L3/L4）；超护 24h；复盘 5 个工作日。

### 8.11 报告与证据
盘中告警日志 · 每日风险 MI（RAG）· 强平与保险快报 · 钱包挤兑快报 · 周 PIC 认证 · 季阈值校准。

### 8.12 最小必开集
PF-K01/K07/K06 · MG-K01/K04/K08 · SP-K03/K09 · PL-K01/K06/K05。

---

## 中文 9. 风险情景诊断（红黄绿 + 时序）

指标或组合变色时使用。**禁止只看颜色** — 先重建**时序**，再判别原因。

### 9.1 RAG 颜色映射

| 颜色 | 对应 §8 | 诊断含义 |
|------|---------|----------|
| **绿 G** | 低于 WARN | 健康 *或* 静默失败/未计算 — 须确认数据新鲜度 |
| **黄 A** | WARN | 抬升；在变红前调查 |
| **红 R** | BREACH / 近 Kill | 先遏制再诊断；在证明是数据问题前按真实风险处理 |

**要点：** 绿不一定安全。标记源**陈旧**却仍显示绿（见 PL-K06）可掩盖真实红灯。看颜色必看**最后更新时间戳**。

### 9.2 强制诊断顺序

```
1. 时钟  — 建时间线（T0 首异→Tn 现在），统一 UTC
2. 范围  — 单 UID / 单标的 / 单资产 / 全站 / 跨产品？
3. 数据  — 指标新鲜吗？公式版本？是否已切源？
4. 单点  — 主指标颜色的可能原因（§9.3）
5. 组合  — 哪些其他 KRI 动了、顺序如何？（§9.4–9.5）
6. 排除  — 与时序或“同伴仍绿”矛盾的原因划掉
7. 行动  — 按 §8 遏制 → §8.2 升级 → 必要时战时
8. 记录  — 工单写入时间线 + 采纳/排除原因
```

**时序语法：** `A → B` 先因后果 · `A ≈ B` 同时/共同驱动 · `A ↛ B` 单 A 通常推不出 B · `A 静默后 B` 两阶段 · `A/R 振荡` 常为阈值噪声/源抖动/MM 重启。

### 9.3 单指标情景（绿/黄/红可能原因）

#### 现货 SP-K01 价差
- **绿：** 正常做市；低波。同伴深度、时延亦绿。  
- **假绿：** 中间价计算坏（空簿 NaN→0）；错误最小变动价。  
- **黄：** MM 主动扩价；波动抬升；库存偏斜；单边流；部分 MM 故障。  
- **红：** MM 全断；失序市；残停牌；API 限频饿死 MM。  
**时序：** `波动↑ → 黄价差 → 黄深度`（市场）· `MM 进程崩 → 秒级红深度再红价差`（技术）。

#### 现货 SP-K03 偏离
- **绿：** 价格发现一致且源新鲜。  
- **假绿：** 参考源与最新价一起卡住。  
- **黄：** 瞬时失衡、套利滞后、新闻微缺口、薄山寨。  
- **红：** 预言机/参考 bug、操纵成交、符号映射错、仅参考所停牌、成分失效。  
**时序：** `外盘崩 ≈ 红`（真跌）· `外盘平而本地红`（本地簿/操纵/数据）。

#### 现货 SP-K09 时延
- **黄：** 负载、GC、撤单风暴初起。  
- **红：** 分片过载、网络分区、坏发布、无限撤单环、DDoS。  
**时序：** `SP-K04 黄 → SP-K09 黄→红`（撤单风暴）· `发布 → 单独红时延`（坏版本）。

#### 杠杆 MG-K01 借款占用
- **黄：** 真实需求、轧空萌芽、出借人撤资。  
- **红：** 轧空、可借资产挤兑、库存分母配错、巨鲸借入。  
**时序：** `现货暴跌 → 补保 → 抢借稳定币 → 占用黄/红`。

#### 杠杆 MG-K02 近强平
- **红但无强平单：** 引擎卡住 — **L3 级严重**。  
**健康时序：** `价格冲击 → MG-K02 红 → MG-K03 强平量↑`。  
**病态：** `MG-K02 红 ↛ MG-K03` 超过 15–30 秒。

#### 杠杆 MG-K04 坏账 / MG-K08 脱锚
- 脱锚真时序：`外盘脱锚 ≈ MG-K08 → MG-K02/03 → MG-K04`。  
- `MG-K08 红而链上+外盘仍绿` → 本地标记 bug（归 S2 子类）。

#### 永续 PF-K01 / PF-K06 / PF-K07–08
- **PF-K01 红：** 指数坏、标记公式 bug、用最新价被操纵、熔断未触发。  
- **经典连环：** `宏观下跌 → PF-K01 黄 → PF-K06 黄→红 → PF-K07 黄`。  
- **`PF-K06 红 + 标的平坦`：** 错标记/bug — Sev-1 候选。  
- **`PF-K08 早于 PF-K07 黄`：** ADL 触发配错，非自然耗尽。

#### 平台 PL-K01/02 / PL-K06 / PL-K05
- `利空 → 提现浪 → PL-K01→02`（挤兑）。  
- `PL-K02 红而 PL-K01 绿`：签名/链瓶颈非余额。  
- `PL-K06 红领先 → 多 KRI 变色但外盘未动`：数据事件（S2）。

#### 当“绿”本身异常
大跌而 PF-K01/SP-K03 仍绿 → 源冻结/规则关闭/阈值过松；  
MG-K02 全绿却 MG-K03 飙升 → 可能强平错户/测试流量；  
危机中全绿 → 看板指到预发环境或缓存快照（S9）。

### 9.4 多指标组合情景族（含时序）

| 族 | 名称 | 关键时序（摘要） | 与其他族区分 |
|----|------|-----------------|--------------|
| **S1** | 真实宏观/风险资产抛售 | 外盘跌 → 现货/永续价格 KRI → 强平 → 保险/提现 | 需外盘同向；PL-K06/PF-K02 宜绿 |
| **S2** | 标记/指数数据完整性 | **PL-K06 或 PF-K02 先红** → PF-K01 → 虚假强平 | 外盘平坦；可与 S4 比：S4 先红时延 |
| **S3** | 稳定币脱锚传染 | MG-K08 → 杠杆强平/坏账 → 挤兑与保险压力 | 外盘脱锚确认；否则当预言机故障 |
| **S4** | 撮合过载/坏发布 | SP-K09（常跟发布/DDoS）→ 价差深度恶化 | 早期 PL-K06 可仍绿 |
| **S5** | 单币做市撤出 | **仅一标的**深度/价差红，其余绿 | MM 心跳挂 vs S7 心跳在但 SP-K08↑ |
| **S6** | 强平连环+保险压力 | 拥挤(K10/K11)→冲击→强平洪峰→赔付→保险↓→ADL | ADL 不得早于保险告警 |
| **S7** | 市场滥用 | SP-K08/CP 领先 → 局部偏离 → 受害者被强平 | 时延/管道常绿 |
| **S8** | 提现挤兑/托管压力 | 舆情触发 → PL-K01/02 → 市场抛压副作用 | 若 PL-K08 先红 → 安全事件 L4 |
| **S9** | 静默/假绿系统 | 外有混乱而主 KRI 全绿 | 查时间戳/告警是否静音/环境 |
| **S10** | 新币/新市场上线失败 | 仅新标的 SP-K10 与簿质量红 | 其余市场绿支持隔离 |
| **S11** | 跨产品套利/基差爆炸 | PF-K09/K03 极端；喂价绿 | 提现摩擦或借款占用可并存 |
| **S12** | 事后恢复 | 主指标转绿但 PF-K07 仍黄 → 勿急松杠杆；仅 PL-K05 红 → 禁结算 | 分项恢复含义不同 |

### 9.5 症状 → 情景族速查

| 大致顺序所见 | 优先 | 再查 |
|--------------|------|------|
| 外盘跌→价→强平→保险 | S1 | 若 ADL 则 S6 |
| 管道/成分先→标记→假强平 | S2 | 暂停强平 |
| MG-K08 先→杠杆坏账 | S3 | 真脱锚 vs 预言机 |
| 时延/发布先→价差深度 | S4 | 回滚 |
| 单币深度价差红 | S5 或 S7 | MM 心跳 vs SP-K08 |
| 拥挤→强平→保险→ADL | S6 | ADL 顺序 |
| SP-K08/CP 先 | S7 | 冻结 |
| 钱包 KRI 先且安全绿 | S8 | 慢速模式 |
| PL-K08/密钥异常先 | **安全 / L4** | — |
| 一片混乱却全绿 | S9 | 时间戳 |
| 仅新上市 | S10 | 标签/下币 |
| 基差/资金费极端且喂价绿 | S11 | 通道/借款 |

### 9.6 时序工作示例

**例 A — 单独黄：** `SP-K01 黄，深度/时延/管道绿` → 多为有意扩价或轻波动；深度若转红再按 S5。  

**例 B — 红组合：** 外盘 USDX 0.97 → MG-K08 红 → 多户 MG-K02/03 → 坏账与借款占用 → 热钱包黄 → **判 S3**，冻借款/调折扣，L3。  

**例 C — 同红异序：**  
- C1：`PL-K06 先红 → PF-K01/MG-K08 红 → 强平红`，外盘锚仍 1.00 → **S2（数据）**。  
- C2：`外盘先脱锚 → MG-K08 → 强平`，PL-K06 绿 → **S3**；勿停标记，应调折扣。  

**例 D — 绿红矛盾：** `PF-K06 红 + PF-K01 绿 + 管道绿 + 外盘平` → 强平引擎 bug/错合约/测试流量；升 **L3/Sev-1**，考虑 RE-02 暂停。

### 9.7 RO-OPS 分流卡片

1. 截屏 RAG **含时间戳**  
2. 标主指标 + ±15 分钟内全部黄/红  
3. 画 T0…Tn 箭头  
4. 选 S1–S12，写明排除族  
5. 执行 §8 自动/人工动作  
6. 按最差 KRI + 情景族定升级（S2/带安全的 S8/S9 倾向上调）  
7. 交接前把时间线贴进工单  

---

## 中文 10. 事件定级与战时指挥

| 定级 | 定义 | 指挥 |
|------|------|------|
| Sev-1 | 客户资产损失风险、引擎完整性失败、大范围错标记 | CRO 或 CTO |
| Sev-2 | 重大坏账、ADL 风暴、长时间停牌 | BU PIC + RO |
| Sev-3 | 功能降级、单市场问题 | BU PIC |
| Sev-4 | 外观/轻微 | 值班 |

**战时常设角色：** 事件指挥官 · 风险 · 撮合 · 风控引擎 · 钱包 · 传播 · 合规 · 记录员  

**必须记录：** 时间线（§9 时钟）、改过的配置、期间订单/强平、采纳的情景族（S1–S12）、客户影响、永久修复负责人。  

**情景→定级提示：** S2 大规模错强平 · 带 PL-K08 的 S8 · 危机中 S9 → 先按 **Sev-1**；S5 单币 MM → 常 Sev-3；S1 有序抛售且保险仍绿 → Sev-2/3 运维模式。

---

## 中文 11. 附录 — 术语与检查清单

### 11.1 术语

| 术语 | 含义 |
|------|------|
| 标记价 Mark | 永续盈亏与强平用公允价 |
| 指数价 Index | 多所合成标的价 |
| 资金费率 Funding | 多空间周期性支付，锚定现货 |
| ADL | 自动减仓对手方盈利仓 |
| LTV | 贷款价值比（杠杆） |
| STP | 自成交防护 |
| 保险基金 | 强平破产兜底 |
| 只减仓 Reduce-only | 仅允许降低仓位的订单 |
| A+ 级 | 需四眼的重大性档 |
| RAG | 红/黄/绿指示灯状态 |
| 情景族 | 多 KRI 命名模式 S1–S12 |

### 11.2 BU PIC 每周清单

- [ ] 复核未关闭 WARN/BREACH 与临期豁免（含确认超时）  
- [ ] 确认后台 ACL 入转离工单关闭  
- [ ] 按 §8 做现货/杠杆/永续/平台 KRI 红黄绿  
- [ ] 抽 1 个黄灯按 §9 单指标原因+时序走一遍  
- [ ] 周认证：误报率 + 阈值校准申请  
- [ ] 排期上/下币风险意见  
- [ ] 容灾/强平演练状态（至少每月）  
- [ ] 现货问题是否应传导到杠杆/永续参数  

### 11.3 永续上线清单（摘要）
合约规格签字；指数成分达标且 PF-K01/02 告警开；杠杆档与限额双批且 PF-K04/05 接通；保险注资且 K07/K08 看板活；资金费封顶测通；强平+ADL 演练签字；撮合与限频；传播与客服；72h 超护；RO-OPS 掌握本合约 S2 vs S1 判别。

### 11.4 杠杆资产上线清单（摘要）
现货观察窗达标；折扣/LTV 压测；借款库存与上限及 K01/K09；利率曲线与 K07 对账绿；逐仓+全仓强平路径测通；坏账科目映射；若稳定币抵押则完成 S3 桌面推演。

### 11.5 现货上线清单（摘要）
尽调完成；正确链充提且 PL-K01 缓冲 OK；tick/lot/带/STP/费率及 K03/K05；做市 SLA 或薄盘披露及 K01/K02；停牌权限测通（K06）。

### 11.6 文档控制

| 项 | 值 |
|----|-----|
| 密级 | 内部 — 风险受限 |
| 变更控制 | CRO 批准；经风险门户发布 |
| 相关产物 | 限额手册、强平政策、保险/ADL 政策、上币政策、BCP/DR、§8 指标目录、§9 情景诊断 |
| 培训 | 新任 BU PIC 30 日内必修 |
| 版本 | 1.2 — 含 RAG 单/多指标情景与时序分析；含简体中文译本 |

---

*手册正文（英文 + 简体中文）结束。工单模板、告警路由与自动化归属见仓库根目录模块及用例叙述流程图。*

