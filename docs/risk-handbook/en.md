# Crypto Exchange Risk Management — BU User Handbook

**Audience:** Business Unit Persons-in-Charge (BU PICs), Risk Officers (RO), Product, Trading Ops, Engineering, Compliance, Treasury, Listing, Custody  
**Scope:** Full catalogue covers Spot · Margin · Perps; **Phase 1 production = Perps only (incl. XAUUSD) + invite/broker access**  
**Version:** 1.6 · **Owner:** Chief Risk Officer (2nd line) · **Review cycle:** Quarterly or after material incident  

> This handbook is the **operating playbook** for who owns what, how work is divided, standard operating procedures (SOPs), consoles/admin pages, indicators/thresholds/actions, scenario diagnostics, and day-to-day tools. It does not replace legal policy, limit books, or regulatory filings.  
> **Thresholds below are illustrative defaults** for a Tier-1 exchange risk framework — calibrate to your Limit Book; do not copy into production without RO dual-approval.

---

## Table of contents

1. [How to use this handbook](#1-how-to-use-this-handbook)
2. [Three lines of defence & role map](#2-three-lines-of-defence--role-map)
3. [Instrument primers (Spot / Margin / Perps)](#3-instrument-primers-spot--margin--perps)
4. [BU-by-BU playbooks](#4-bu-by-bu-playbooks)
5. [Cross-BU RACI matrix](#5-cross-bu-raci-matrix)
6. [Global SOPs (shared) & detailed runbooks](#6-global-sops-shared--detailed-runbooks)
7. [Admin pages & tool catalogue](#7-admin-pages--tool-catalogue)
8. [Limits, KRIs, thresholds, actions & escalation](#8-limits-kris-thresholds-actions--escalation)
9. [Risk scenario diagnostics (RAG + time sequence)](#9-risk-scenario-diagnostics-rag--time-sequence)
10. [Incident severity & war room](#10-incident-severity--war-room)
11. [Appendix — glossary & checklists](#11-appendix--glossary--checklists)
12. [Phase 1 operating scope](#phase-1-operating-scope-labels-used-throughout)

---

## Phase 1 operating scope (labels used throughout)

> **Phase 1 is live / in-scope now.** Later-phase content stays in this handbook for readiness but is marked **`[Phase 2+]`** (or later). Do not enable Phase 2+ flows in production without a formal phase-gate sign-off (Risk **A** + CP + Product).

### Phase 1 — in scope

| Area | Phase 1 rule |
|------|----------------|
| **Products / instruments** | **Perpetuals only.** Includes **XAUUSD perps** and **other approved perp contracts**. No Spot trading book and no Margin (cross/isolated) lending book in Phase 1. |
| **Account opening** | **Invite-only** and/or **through brokers** (IB / introducing broker / white-label broker channel). No open public self-serve signup. |
| **Trading access** | Users may trade only after invite acceptance **or** broker-introduced onboarding is complete and risk/compliance gates clear. |
| **Primary BUs on critical path** | Futures/Perps Product & Liq Ops · Matching · Risk Engine · Risk Ops · Broker/Invite ops (CP+Product) · Wallet/Settlement as needed for collateral/PnL · Surveillance |

### Phase 1 — out of production (keep playbooks; label only)

| Area | Label | Note |
|------|-------|------|
| Spot markets, spot listing/delist go-live | **`[Phase 2+]`** | Playbooks SP-*, LD-05, spot KRIs remain for future |
| Margin borrow / LTV / interest | **`[Phase 2+]`** | MG-* remain for future |
| Public retail self-serve onboarding | **`[Phase 2+]`** | Phase 1 = invite + broker only |
| Non-perp products (options, earn, etc. if any) | **`[Phase 2+]`** | Unless separately gated |

### Phase 1 control implications (operators)

1. **Listing / go-live:** only **perp** pipeline (incl. **XAUUSD**) and broker/invite entitlement configs are production-critical.  
2. **Access control:** reject or hold any account that is neither **invite-redeemed** nor **broker-linked**.  
3. **KRIs / SOPs:** Spot- and Margin-tagged items are still documented — treat as **dormant** unless a Phase 2+ waiver exists. Prefer Perps + access KRIs in daily MI.  
4. **XAUUSD perps:** apply full Perps controls (mark/index, funding, leverage brackets, insurance/ADL) plus commodity/FX-hours awareness (session gaps, weekend/holiday liquidity).


## 1. How to use this handbook

| If you are… | Read first |
|-------------|------------|
| New BU PIC | §§2–4 for your BU + §7 tools |
| Risk Officer / Risk Ops | Full doc; own §6 SOPs, §8 catalogue, §9 scenarios & §10 incidents |
| Product (Spot / Margin / Futures) | §3 + your product BU chapter + listing SOPs |
| Eng / SRE (Matching, Risk Engine, Wallet) | Your tech BU chapter + failover SOPs |
| Compliance / Surveillance | Compliance BU + market-abuse SOPs |
| Listing / Delisting PIC | Listing BU chapter end-to-end |
| Phase 1 PIC / launch crew | **Phase 1 operating scope** + §3.3 Perps + §4.4 + invite/broker SOPs |

**Golden rules**

1. **No silent limit changes** — every hard limit change is ticketed, dual-approved, and audited.
2. **Segregation of duties** — requester ≠ approver; maker ≠ checker for Tier-A changes.
3. **Instrument-aware** — Spot ≠ Margin ≠ Perps. Controls, liquidation, and insurance differ; do not copy-paste configs.
4. **Pre-trade / at-trade / post-trade** — every material risk has at least one control in each layer where feasible.
5. **Client assets first** — wallet/custody and withdrawal integrity outrank revenue features under stress.
6. **Phase 1 product & access gates** — production trading = **perps only** (incl. **XAUUSD**); accounts = **invite-only or via brokers**. Spot/Margin and public signup remain documented as **`[Phase 2+]`**.

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

### 3.1 Spot `[Phase 2+]`

> **Not enabled in Phase 1.** Retain playbook for later phase-gate.

| Topic | Risk relevance |
|-------|----------------|
| **What it is** | Immediate buy/sell of base/quote; no leverage on the instrument itself |
| **Primary risks** | Market manipulation, fat-finger, listing quality, wallet settlement, fiat rail |
| **Key controls** | Price bands, max order size, self-trade prevention, trading halt, deposit/withdraw gates |
| **No liquidation engine** | Client loss is limited to paid amount (except deposit/withdraw errors) |
| **Admin focus** | Symbol config, fee tiers, STP, halt/resume, ticker metadata |

### 3.2 Margin (Cross & Isolated) `[Phase 2+]`

> **Not enabled in Phase 1.** Retain playbook for later phase-gate.

| Topic | Risk relevance |
|-------|----------------|
| **What it is** | Borrowed funds to amplify spot exposure; interest accrues on loans |
| **Isolated** | Margin & liquidation scoped to one position/pair |
| **Cross** | Shared collateral across positions; contagion within account |
| **Primary risks** | Credit/borrow default, liquidation shortfall, interest misconfig, collateral haircut error |
| **Key controls** | LTV / margin ratio, borrow caps per asset, interest rate curves, liquidation waterfall, negative-balance auto-repay |
| **Admin focus** | Collateral tiers, borrow whitelist, LTV brackets, interest config, forced liquidation console |

### 3.3 Perpetual futures (USDⓈ-M / COIN-M) `[Phase 1]`

> **Phase 1 in scope:** approved perps including **XAUUSD perps** and other listed perps. Spot/Margin are off.

| Topic | Risk relevance |
|-------|----------------|
| **What it is** | Leveraged derivatives with no expiry; funding exchanges long↔short |
| **Mark vs last** | Mark price drives unrealized PnL & liquidation; last price for trading |
| **Primary risks** | Leverage cascades, insurance fund drain, mark/index manipulation, funding extremes, ADL |
| **Key controls** | Max leverage by tier, position notional caps, price index multi-exchange, funding caps, insurance fund, ADL queue |
| **Admin focus** | Leverage brackets, risk limits, funding formula, insurance fund MI, ADL/auto-deleveraging console, circuit breakers |
| **Phase 1 examples** | **XAUUSD** perpetual and other approved perp symbols only |
| **Phase 1 extra watch** | Metals/FX session gaps, weekend/holiday liquidity vs crypto 24×7 index hours |

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
| **Phase label** | **`[Phase 2+]`** | **`[Phase 2+]`** | **`[Phase 1]`** (incl. XAUUSD) |

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
> Detailed who / when / how / SLA cards: **§6.7** (RM-01…).

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

### 4.2 Spot Product & Trading Ops — PM-SPOT / TO `[Phase 2+]`

> Phase 1: dormant product surface. Keep halt/listing readiness; do not open spot symbols.

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

### 4.3 Margin Product & Credit Ops — PM-MARGIN / RO-CREDIT / TO `[Phase 2+]`

> Phase 1: no margin borrow book. Perps margin/liquidation stays under §4.4 / RE.

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

### 4.4 Futures / Perps Product & Liquidation Ops — PM-FUT / RO / TO-FUT `[Phase 1 — primary]`

> Phase 1 critical path: **XAUUSD perps** + other approved perps; invite/broker traders only.

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

> **Phase 1 listing focus:** perp contracts only (e.g. **XAUUSD** and other approved perps). Spot listing/delist SOPs = **`[Phase 2+]`**. Margin eligibility (LD-03) = **`[Phase 2+]`**.

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
- **Phase 1 access:** invite-code redemption controls; **broker / IB** introduced accounts; block public self-serve signup
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

## 6. Global SOPs (shared) & detailed runbooks

Every SOP card below uses the same fields: **When (trigger)** · **Who** · **SLA** · **Preconditions** · **How** · **Systems** · **Done when** · **Escalate if**.  
Role codes: see §2.2. Ticket system = Risk/Ops ticket unless noted.

### 6.0 SOP card legend

| Field | Meaning |
|-------|---------|
| **When** | Event, schedule, or threshold that starts the SOP |
| **Who** | R = does the work · A = accountable sign-off · C = consulted · I = informed |
| **SLA** | Max time to first action / to contain / to close |
| **Preconditions** | Must be true before acting (else stop and escalate) |
| **How** | Ordered steps; do not skip dual-control steps |
| **Systems** | Admin pages / tools / modules |
| **Done when** | Exit criteria + evidence to attach |
| **Escalate if** | Conditions that bump L-level / Sev |

---

### 6.1 SOP-G01 — Limit change (all instruments)

| Field | Detail |
|-------|--------|
| **When** | Any proposed change to soft/hard limits, brackets, bands, OI caps, LTV/haircut, borrow caps, VIP multipliers — scheduled calib or ad-hoc stress response |
| **Who** | **R:** Requester (PM / TO / RO / DA) prepares packet · **A:** RO (Maker) · **Checker A (Tier A+):** RO2 or CRO · **R (deploy):** RE · **C:** ME, Product PIC, CP if retail-impacting · **I:** RO-OPS, Comms if client-visible |
| **SLA** | Non-urgent: decision ≤ 2 business days · Urgent (active BREACH/cascade): Maker decision ≤ 30 min; Checker ≤ 30 min parallel bridge · Hypercare 24h post-deploy |
| **Preconditions** | Instrument tagged **SPOT / MARGIN / PERP**; old→new values numeric; stress delta attached (or waiver by CRO); no conflicting open G01 on same key |
| **Systems** | Ticket · `/admin/risk/limits` · `/admin/risk/waivers` · `/admin/risk-engine/configs` · `stress_testing.py` · `trader_rights_workflow.py` (if rights-linked) |

**How**
1. **Requester** opens ticket: instrument, symbol/contract or asset, field name, old→new, rationale, linked KRI/incident, stress screenshot or note “CRO waived stress”.  
2. **SYS** (or RO-OPS) attaches impact packet: utilisation vs new limit, breaches 30d, concentration, related product spillover.  
3. **Maker (RO)** reviews: reject / approve / approve-with-conditions (expiry, symbol scope). Records comment.  
4. If **Tier A+** (notional, leverage max, insurance-related, or policy table): **Checker** different person four-eyes.  
5. **RE** promotes config in staging → prod; records **config version hash** on ticket.  
6. **ME / Product** ACK on trading-facing params (bands, symbol flags).  
7. **RO-OPS** starts 24h hypercare watchlist for linked KRIs.  
8. Close ticket only when hash + ACKs + hypercare owner named.

**Done when:** Approved decision logged; prod hash matches ticket; no unexplained BREACH in hypercare attributable to change.  
**Escalate if:** Checker unavailable in urgent path → CRO/delegate; deploy fails → RE rollback + L2; client complaints spike → Comms + L3.

---

### 6.2 SOP-G02 — Trading halt / resume (Spot vs Perps / Margin)

| Field | Detail |
|-------|--------|
| **When** | Disorderly market, oracle/index fail, fat-finger contagion, regulatory order, Sev-1 integrity, cascade per §9 families S1–S4/S7 |
| **Who** | **Propose R:** TO (Spot) / TO-FUT / Margin TO · **A approve halt:** RO · **Execute R:** ME (matching) + RE (liq mode) · **C:** CP (if abuse/reg), WO (withdraw policy), Comms · **Resume A:** RO + ME (+ RE mark healthy for perps) |
| **SLA** | Propose→approve ≤ 5 min in Sev-1/2 · ME execute ≤ 2 min after approve · First Comms draft ≤ 10 min · Resume only after written clearance |
| **Preconditions** | Halt reason code selected; scope (symbol / segment / global) stated; for perps: decision on **orders-only vs include liquidations** |
| **Systems** | `/admin/spot/halt` · `/admin/futures/breaker` · `/admin/engine/kill` (global only, dual) · `/admin/margin/borrow` · Comms macros |

**How — Halt**
1. On-call **TO** opens bridge; states scope + reason + §9 family guess.  
2. **RO** approves (or CRO if global).  
3. **ME** applies halt/kill for scope; confirms no new matches (Spot) / no new risk-increasing orders (Perps as designed).  
4. **RE:** if perps/margin — follow RE-02 for whether liquidations continue, pause, or reduce-only only.  
5. **Margin TO:** consider **MG-03** borrow freeze on related collateral.  
6. **WO:** default **keep withdrawals** unless CP/RO order freeze.  
7. **Comms** posts status; Perps text must mention funding/liq behaviour.  
8. Scribe logs timeline on war-room ticket.

**How — Resume**
1. RO verifies root cause contained; ME health green; for perps **RE** confirms mark/index fresh (PL-K06/PF-K02).  
2. Dual ACK RO + ME (+ Product PIC).  
3. Resume in stages: cancel storm check → bands on → normal.  
4. Hypercare 4h minimum.

**Done when:** Matching state matches intended mode; Comms updated; resume ticket signed.  
**Escalate if:** Global kill needed → L4 dual-control on `/admin/engine/kill`; wrong marks during halt → Sev-1.

---

### 6.3 SOP-G03 — Alert ACK (WARN / BREACH / KILL)

| Field | Detail |
|-------|--------|
| **When** | Any Risk Portal / paging alert on §8 KRIs |
| **Who** | **R ACK + triage:** RO-OPS · **C:** BU PIC for L2+ · **A escalation:** RO / CRO by ladder · **I:** ENG if data-quality |
| **SLA** | ACK: WARN ≤15m · BREACH ≤5m · KILL/client-asset ≤2m · Classification note ≤10m after ACK · Containment plan ≤15m on BREACH |
| **Preconditions** | Alert visible with timestamp; on-call calendar current |
| **Systems** | `/admin/risk/alerts` · §9 triage card · Pager |

**How**
1. **ACK** in console (stops re-page per policy).  
2. Check **data freshness** (PL-K06 / feed TS). If stale → ENG-03 path; tag “data”.  
3. If real: identify primary KRI + cluster ±15m; pick §9 family.  
4. Execute linked playbook actions (auto already fired? verify).  
5. Set escalation L1–L4; page required roles.  
6. For Sev-1/2: open war room; schedule post-mortem ≤5 business days.

**Done when:** ACK + classification + action log on ticket; owner for next step named.  
**Escalate if:** ACK SLA missed → auto-page RO; two BREACH without containment → L3.

---

### 6.4 SOP-G04 — Maker–checker & segregation of duties

| Field | Detail |
|-------|--------|
| **When** | Always for Tier A+ limit changes, kill switch, key ceremony, sanctions override, insurance injection, hold removal, leverage rights Tier A+ |
| **Who** | **Maker** initiates · **Checker** different human ID · **SYS** enforces (reject same UID) · **A:** CRO/CISO policy owner |
| **SLA** | Blocking: no prod mutate until checker done · Break-glass: ≤15m with auto-ticket + CRO/CISO page |
| **Preconditions** | ACL roles distinct; maker≠checker≠beneficiary trader |
| **Systems** | IAM · `/admin/audit` · workflow engines |

**How / Rules**
1. Trader **cannot** approve own leverage/rights (`trader_rights_workflow`).  
2. RE deployer **cannot** be sole approver on Tier A config.  
3. Wallet ceremony: ≥2 (prefer 3) key holders + recorded ceremony ID.  
4. CP hold **removal** needs second CP or RO per policy.  
5. Any break-glass: time-bound account, auto ticket PL-K07, same-day review.

**Done when:** Audit shows two distinct actor IDs + ticket link.  
**Escalate if:** Same-ID approval attempted → security incident ENG-04/L3.

---

### 6.5 SOP-G05 — EOD reconciliation & settlement

| Field | Detail |
|-------|--------|
| **When** | Daily at configured UTC cutoff (+ ad-hoc after Sev-1 trading incident) |
| **Who** | **R match:** ENG/SYS · **R exceptions:** Clearing Ops / TO · **Checker:** CO2 or RO if material · **A settlement:** TS · **C:** CP retention |
| **SLA** | Match job complete ≤ 60m after cutoff · Material exceptions aged ≤ 4h · Settlement wires only after `SettlementReady` |
| **Preconditions** | Cutoff complete; feeds available; materiality threshold published |
| **Systems** | `eod_reconciliation.py` · treasury settlement queue · evidence store |

**How**
1. SYS runs internal vs ledger/broker/venue match → `ReconLine[]`.  
2. TO/Clearing assigns each exception owner + action (re-pull, adjust, ticket venue).  
3. If delta notional > materiality: **maker–checker** before approve.  
4. On full approve: emit `SettlementReady`.  
5. **TS** executes settlement; stores bank/on-chain refs.  
6. Retain pack per CP policy.

**Done when:** Zero critical opens or waived with RO sign-off; TS confirmation IDs attached.  
**Escalate if:** Unexplained missing trades → L2/L3 + possible trading halt review.

---

### 6.6 SOP-G06 — New product / instrument approval

| Field | Detail |
|-------|--------|
| **When** | New spot pair, margin asset, perp contract, or material product feature (portfolio margin, unified account) |
| **Who** | Gate owners in order below; **A go-live:** Risk (RO) + CP clear · **R coord:** LI or PM |
| **SLA** | Each gate SLA on listing pipeline board (typ. 2–10 BD per gate) · No “soft launch” without Risk+CP |
| **Preconditions** | Diligence folder ID; Legal classification draft |
| **Systems** | `/admin/listing/pipeline` · product checklists §11 · wallet chain enable |

**How (gates — do not reorder)**
1. **Legal** opinion (instrument type / jurisdiction notes).  
2. **CP** sanctions/securities/AML flags.  
3. **LI** diligence pack + **RO** risk opinion (LD-01).  
4. **Product** go-live checklist (Spot/Margin/Perps §11).  
5. **RE/ME** configs in staging; dry-runs signed.  
6. **WO** deposit/withdraw ready on correct chains.  
7. Soft launch / whitelist if used → hypercare roster 72h.  
8. Only then open traffic — **Phase 1:** invite/broker cohort only, **not** public signup; **perps only**.

> **Phase 1 gate note:** production instruments = **perps (incl. XAUUSD)**; access = **ACC-01/ACC-02**. Spot/Margin = **`[Phase 2+]`**.

**Done when:** Pipeline stage = Live; monitoring KRIs wired; hypercare named.  
**Escalate if:** Traffic detected pre-clear → PL-K12 BREACH, force disable, L3 audit.

---

### 6.7 BU SOP catalogue (detailed)

#### RM — Risk Ops

##### RM-01 Daily risk MI pack
| Field | Detail |
|-------|--------|
| **When** | Every UTC cutoff (default 22:00) + ad-hoc on L3 day |
| **Who** | **R:** SYS assemble · **A:** RO · **C:** PM/TO · **I:** CRO (summary) |
| **SLA** | Pack published ≤ 90m after cutoff |
| **How** | 1) Pull strategy/desk/company snapshots + open alerts + stress highlights via `risk_reporting.py`. 2) RAG §8 families. 3) Flag waivers expiring ≤7d. 4) Distribute DL. 5) RO comments exceptions. |
| **Systems** | `/admin/risk/reports` · `risk_reporting.py` |
| **Done when** | Email/portal post + RO ACK. **Escalate if** pack >2h late → ENG-03. |

##### RM-02 Soft-limit WARN response
| Field | Detail |
|-------|--------|
| **When** | Any WARN (§8) |
| **Who** | **R:** RO-OPS · **C:** BU PIC · **A:** RO if persists >TTE |
| **SLA** | ACK 15m; plan 30–60m |
| **How** | G03 triage → document cause → watch vs act → if approaching BREACH pre-stage G01/G02. |
| **Done when** | WARN cleared or upgraded with ticket. |

##### RM-03 Hard-limit BREACH response
| Field | Detail |
|-------|--------|
| **When** | BREACH / Kill-adjacent |
| **Who** | **R:** RO-OPS + BU PIC · **A:** RO · page CRO if L3+ |
| **SLA** | ACK 5m; containment 15m |
| **How** | Contain per instrument (reduce-only / borrow freeze / halt) → verify auto actions → §9 family → war room if Sev-1/2 → post-mortem. |
| **Done when** | Contained + owner for permanent fix. |

##### RM-04 Leverage / rights increase
| Field | Detail |
|-------|--------|
| **When** | TR/VIP submits buying-power or leverage request |
| **Who** | **R submit:** TR · **R packet:** SYS · **A Maker:** RO · **Checker:** RO2/PM if Tier A+ · **R push:** ENG/RE |
| **SLA** | Eligibility packet <5m auto · Maker ≤1 BD (urgent 1h) |
| **How** | `trader_rights_workflow`: eligibility (Sharpe/DD/VaR/CP hold) → Maker approve/reject → Checker if A+ → enqueue limit update → confirm broker/OMS. |
| **Done when** | Status APPROVED + limit live. **Escalate if** self-approve attempt. |

##### RM-05 Stress catalogue change
| Field | Detail |
|-------|--------|
| **When** | New scenario, shock size, correlation matrix edit |
| **Who** | **R:** DA · **A:** RO · **C:** PM · **I:** CRO if core scenarios |
| **SLA** | Dual sign-off before catalogue publish |
| **How** | Propose → backtest hit rates → RO+DA sign → version catalogue → link to daily pack. |
| **Done when** | Version ID on portal. |

##### RM-06 Insurance fund draw review
| Field | Detail |
|-------|--------|
| **When** | Any insurance payout or ADL (PF-K07/K08/K12) |
| **Who** | **R flash:** TO-FUT · **A review:** RO · **C:** TS accounting · **I:** CRO if >X |
| **SLA** | Flash ≤30m; formal review ≤1 BD |
| **How** | Pull payout vs bankruptcy prices → liq quality → MM during event → decide inject (TS-04) / tighten brackets (G01) / ADL review (PF-06). |
| **Done when** | Review note filed; ledger entries match. |

##### RM-07 Trading halt recommendation
| Field | Detail |
|-------|--------|
| **When** | Gap, oracle fail, cascade, reg ask |
| **Who** | **R recommend:** RO/RO-OPS · **A decide:** RO · execute via G02 |
| **SLA** | Recommendation ≤5m on BREACH cascade |
| **How** | State scope/reason/family → call G02 → stay on bridge until resume criteria set. |

---

#### SP — Spot `[Phase 2+]`

##### SP-01 Spot symbol go-live
| Field | Detail |
|-------|--------|
| **When** | Pipeline stage ready post LD-01 / G06 |
| **Who** | **R:** PM-SPOT + TO · **A:** RO+CP clear already · **C:** WO, MM, ME |
| **SLA** | Checklist complete same day as scheduled launch window |
| **How** | Verify wallet chains · tick/lot/bands/STP/fees · MM SLA or disclosure · halt test · KRI wiring SP-K01/02/03/05 · soft launch optional · announce. |
| **Systems** | `/admin/spot/*` · listing pipeline |
| **Done when** | §11.5 checklist ticked; hypercare 72h named. |

##### SP-02 Spot trading halt
| Field | Detail |
|-------|--------|
| **When** | Index fail, fat-finger, regulatory, disorderly (SP-K03/K06) |
| **Who** | **Propose:** TO · **Approve:** RO · **Execute:** ME · **I:** Comms, WO |
| **SLA** | Execute ≤2m post-approve |
| **How** | Follow G02 Spot column; reason code; keep withdraw default-on. |
| **Done when** | Halt state confirmed on `/admin/spot/halt`. |

##### SP-03 Spot resume
| Field | Detail |
|-------|--------|
| **When** | RO+ME clearance after SP-02 |
| **Who** | **A:** RO+ME · **R:** TO · **C:** Product |
| **How** | Verify book integrity · bands · MM online · staged resume · 4h hypercare. |
| **Done when** | Trades flowing; no immediate SP-K03 BREACH. |

##### SP-04 Price band / max notional change
| Field | Detail |
|-------|--------|
| **When** | Vol regime change or incident lesson |
| **Who** | Via **G01**; **R propose:** TO/PM · **A:** RO |
| **How** | Impact on fills/MM → G01 → `/admin/spot/bands` promote → hypercare. |

##### SP-05 Wash / self-trade handoff
| Field | Detail |
|-------|--------|
| **When** | SP-K08 or surveillance alert |
| **Who** | **R handoff:** TO/RO-OPS · **A case:** CP · **C:** ME (STP mode) |
| **SLA** | Handoff ≤30m; CP triage per CP-01 |
| **How** | Preserve order/trade IDs → open CP case → consider UID hold CP-02 → no silent STP weaken. |

---

#### MG — Margin `[Phase 2+]`

##### MG-01 Add collateral asset
| Field | Detail |
|-------|--------|
| **When** | Post-spot listing + RO opinion for margin eligibility (LD-03) |
| **Who** | **R:** PM-MARGIN · **A haircut/LTV:** RO-Credit · **C:** DA stress · **I:** TS |
| **How** | Stress haircut → set LTV brackets → borrow caps → interest mapping → liq path test isolated+cross → enable `/admin/margin/collateral`. |
| **Done when** | §11.4 checklist done; MG-K05 baseline stored. |

##### MG-02 Haircut / LTV change
| Field | Detail |
|-------|--------|
| **When** | Vol regime, governance, MG-K05 BREACH |
| **Who** | **G01** path; **A:** RO-Credit |
| **SLA** | Urgent depeg: ≤30m dual-approve |
| **How** | DA note → G01 → push RE → notify users if adverse · watch MG-K02/03. |

##### MG-03 Borrow freeze (asset)
| Field | Detail |
|-------|--------|
| **When** | MG-K01 BREACH persistent, depeg S3, inventory crisis |
| **Who** | **R execute:** TO/RO-Credit · **A:** RO · **I:** TS, Comms |
| **SLA** | Decision ≤15m on BREACH |
| **How** | `/admin/margin/borrow` freeze → optional rate max → announce if user-visible → define unfreeze criteria. |
| **Done when** | New borrows blocked; ticket has unfreeze owner. |

##### MG-04 Forced liquidation runbook
| Field | Detail |
|-------|--------|
| **When** | Cascade / engine lag MG-K03 |
| **Who** | **R:** TO + RE · **A:** RO · **C:** ME capacity |
| **How** | Confirm marks fresh → if unsafe RE-02 pause → else ensure liq queue draining → throttle risk-increasing → consider spot bands on collateral → never delete liq history. |
| **Escalate if** | Lag >30s → L3. |

##### MG-05 Bad debt write-off / recovery
| Field | Detail |
|-------|--------|
| **When** | MG-K04 after shortfall |
| **Who** | **R case:** RO-Credit · **A P&L:** TS · **Checker:** RO/CRO if Tier A |
| **How** | Quantify → auto-repay attempts → recover from user → residual write-off dual-control → lessons to haircut/buffer. |
| **Done when** | Ledger + case closed. |

##### MG-06 Interest curve update
| Field | Detail |
|-------|--------|
| **When** | Funding cost / peg risk / governance |
| **Who** | **R:** PM-MARGIN/TS · **A:** RO-Credit · block if MG-K07 open |
| **How** | Propose curve → recon check → G01 if material → `/admin/margin/interest` → monitor exceptions. |

---

#### PF — Perps `[Phase 1]`

##### PF-01 New perp contract launch
| Field | Detail |
|-------|--------|
| **When** | LD-04 + G06 complete |
| **Who** | **R:** PM-FUT · **A:** RO · **C:** RE/ME/DA/TS |
| **How** | Specs → index ≥ min venues → brackets/limits dual-approved → insurance seed → funding caps tested → liq+ADL dry-run → matching symbol → Comms → 72h hypercare · §11.3. |
| **Done when** | Live + PF-K01/02/06/07 dashboards green. |

##### PF-02 Leverage bracket change
| Field | Detail |
|-------|--------|
| **When** | Vol / VIP policy / PF-K11 |
| **Who** | **G01**; **A:** RO · **R propose:** PM-FUT |
| **How** | Impact OI/users near cap → approve → `/admin/futures/leverage` → hypercare liqs. |

##### PF-03 Mark–index deviation response
| Field | Detail |
|-------|--------|
| **When** | PF-K01 WARN/BREACH |
| **Who** | **R:** RO-OPS + RE + DA · **A:** RO · **C:** TO-FUT |
| **SLA** | BREACH triage ≤5m |
| **How** | Check PL-K06 & PF-K02 → if data: S2 failover/pause unsafe liq → if real basis: consider reduce-only PF-07 → never “fix” mark without dual RO+DA. |
| **Done when** | Deviation explained; feed healthy or trading contained. |

##### PF-04 Funding extreme / pause
| Field | Detail |
|-------|--------|
| **When** | PF-K03 near/at cap or oracle fail |
| **Who** | **R:** PM-FUT · **A pause (rare):** RO+PM dual · **I:** Comms |
| **How** | Confirm clamp auto → publish reason → pause only if settlement integrity broken → resume with RO ACK. |

##### PF-05 Insurance payout review
| Field | Detail |
|-------|--------|
| **When** | Bankruptcy fill / fund draw |
| **Who** | See RM-06; **R:** TO-FUT |
| **How** | Same-day flash → quality of liq → recommend TS-04 inject and/or G01 tighten. |

##### PF-06 ADL activation review
| Field | Detail |
|-------|--------|
| **When** | Any ADL (PF-K08) |
| **Who** | **R:** TO-FUT · **A:** RO · **C:** CP (abuse) · Comms |
| **SLA** | Bridge immediate if majors / ≥3 per hour |
| **How** | Verify insurance was insufficient (order: K07 before K08) → ranking fair → user notices → if misconfig, stop ADL + Sev-1. |

##### PF-07 Perps halt / reduce-only
| Field | Detail |
|-------|--------|
| **When** | Cascade, infra, bad marks |
| **Who** | G02 Perps column · **RE** sets liq mode |
| **How** | Prefer reduce-only before full halt when engine healthy · state funding behaviour in Comms. |

##### PF-08 Index constituent outage
| Field | Detail |
|-------|--------|
| **When** | PF-K02 WARN/BREACH |
| **Who** | **R:** DA/RE · **A temp weights:** RO |
| **How** | Auto-drop bad venue if policy → if below min venues: protect mark / reduce-only → RO approve temporary weights → restore when venue healthy. |

---

#### ME — Matching

##### ME-01 Engine deploy / rollback
| Field | Detail |
|-------|--------|
| **When** | Scheduled release or hotfix |
| **Who** | **R:** ENG · **A go/no-go:** ME PIC · **C:** SRE · **I:** TO/RO-OPS |
| **SLA** | Rollback decision ≤15m on Sev-1 latency/integrity |
| **How** | Change ticket → canary → watch SP-K09/K04 → rollback procedure rehearsed → post-deploy verify. |

##### ME-02 Matching halt
| Field | Detail |
|-------|--------|
| **When** | Sev-1 integrity / G02 execute |
| **Who** | **R:** ME · **A:** RO for business halt; dual for global kill |
| **How** | Scope halt → confirm → notify RE/TO → never leave ambiguous shard states. |

##### ME-03 Dual-site failover
| Field | Detail |
|-------|--------|
| **When** | Primary loss / DR drill |
| **Who** | **R:** SRE/ME · **A:** ME PIC · **I:** RO, Comms |
| **How** | Declare incident → drain/failover `/admin/engine/failover` → ME-05 book verify → trading resume per G02 if halted. |

##### ME-04 Cancel storm mitigation
| Field | Detail |
|-------|--------|
| **When** | SP-K04 / rate > SLO |
| **Who** | **R:** ME · **C:** TO/CP |
| **How** | Raise rate limits carefully / shed → identify UID storms → CP if abuse → protect latency SLO. |

##### ME-05 Post-incident book rebuild verify
| Field | Detail |
|-------|--------|
| **When** | After failover/halt |
| **Who** | **R:** ME · **A:** ME PIC · **C:** RE |
| **How** | Compare book checksums / trade continuity → sign attach to ticket before full resume. |

---

#### RE — Risk engine

##### RE-01 Config promote
| Field | Detail |
|-------|--------|
| **When** | After G01 dual-approval |
| **Who** | **R:** RE · **A:** RO ticket link mandatory |
| **How** | Diff configs → staging → prod → hash to ticket → ping RO-OPS hypercare. |
| **Escalate if** | Promote without ticket → revert + audit. |

##### RE-02 Liquidation engine pause / resume
| Field | Detail |
|-------|--------|
| **When** | Unsafe marks (S2), controlled cascade, maintenance |
| **Who** | **R:** RE · **A:** RO · **I:** TO-FUT/Margin TO, Comms |
| **SLA** | Pause ≤2m once RO orders |
| **How** | `/admin/risk-engine/liq` pause → document why → users may still face risk — Comms honesty → resume only when marks healthy + RO ACK. |

##### RE-03 Mark price feed failover
| Field | Detail |
|-------|--------|
| **When** | PL-K06 / PF-K02 / oracle incident |
| **Who** | **R:** RE/ENG · **A:** RO if methodology change |
| **How** | Switch secondary → validate PF-K01 → if both bad: reduce-only/pause liq. |

##### RE-04 Risk state rebuild
| Field | Detail |
|-------|--------|
| **When** | Desync risk vs matching/wallet |
| **Who** | **R:** RE · **A:** RO · **C:** ME/WO |
| **How** | Freeze risk-increasing → rebuild from authoritative ledger → recon sample → unfreeze. |

##### RE-05 Portfolio-margin model change
| Field | Detail |
|-------|--------|
| **When** | Model governance / PM-K01 |
| **Who** | **R:** DA · **A:** RO · **C:** PM · dual G01 |
| **How** | Parallel run → gap report → feature flag → conservative fallback ready. |

---

#### WA — Wallet

##### WA-01 Hot wallet top-up
| Field | Detail |
|-------|--------|
| **When** | PL-K01 WARN/BREACH or forecast outflow |
| **Who** | **R:** WO · **A:** policy TS/RO buffer · **C:** Security ceremony if cold move |
| **SLA** | Start top-up ≤30m on WARN; immediate on BREACH |
| **How** | Confirm on-chain balances → cold→hot per ceremony rules → verify buffer → log. |

##### WA-02 Withdrawal queue / slow mode
| Field | Detail |
|-------|--------|
| **When** | Run risk, attack, chain congestion, PL-K02 |
| **Who** | **R:** WO · **A:** RO (+CP if compliance-driven) · **I:** Comms, TS |
| **SLA** | Slow-mode decision ≤15m on BREACH |
| **How** | `/admin/wallet/withdraw` slow mode → prioritisation rules → status page → exit criteria (buffer+backlog). |

##### WA-03 Chain halt / reorg
| Field | Detail |
|-------|--------|
| **When** | Node alerts / PL-K04 |
| **Who** | **R:** WO/SRE · **A:** RO if credits impacted · **C:** CP |
| **How** | Pause credits on chain → assess depth → clawback SOP if credited reorged → resume with finality policy. |

##### WA-04 Wrong deposit recovery
| Field | Detail |
|-------|--------|
| **When** | User ticket wrong asset/chain/memo |
| **Who** | **R:** WO · **A:** dual WO/TS for moves · **C:** CP AML |
| **How** | Verify ownership → recoverability → fee policy → execute → close with txids. |

##### WA-05 Key ceremony / rotation
| Field | Detail |
|-------|--------|
| **When** | Schedule or incident |
| **Who** | Multi-party WO/Security · **A:** CISO/CRO policy · G04 |
| **How** | Ceremony runbook → record ID → validate sign path → revoke old material. |

##### WA-06 PoR snapshot
| Field | Detail |
|-------|--------|
| **When** | Periodic / attestation request |
| **Who** | **R:** WO/TS · **A:** CRO/Finance per policy · **C:** External auditor if any |
| **How** | Freeze height → liabilities extract → publish/attest → archive. |

---

#### LD — Listing / delisting

##### LD-01 Listing risk opinion
| Field | Detail |
|-------|--------|
| **When** | New asset/contract in pipeline |
| **Who** | **R:** LI pack · **A opinion:** RO · **C:** CP/Legal |
| **SLA** | Per pipeline board |
| **How** | Tokenomics/contract/liquidity/manip history → opinion Approve/Conditional/Reject → conditions become launch checklist. |

##### LD-02 Seed / monitoring tag
| Field | Detail |
|-------|--------|
| **When** | Elevated risk pre/post list |
| **Who** | **R:** LI · **A:** RO · **I:** Comms/Support |
| **How** | `/admin/listing/tags` → disclosure → tighter bands optional. |

##### LD-03 Margin eligibility
| Field | Detail |
|-------|--------|
| **When** | After spot stable observation window |
| **Who** | **A:** RO-Credit · **R:** PM-MARGIN · then MG-01 |

##### LD-04 Perp listing decision
| Field | Detail |
|-------|--------|
| **When** | Demand + risk appetite |
| **Who** | **A:** RO · **R:** PM-FUT/LI · then PF-01 |

##### LD-05 / LD-06 / LD-07 Delist sequences
| Field | Detail |
|-------|--------|
| **When** | Criteria breach or project failure |
| **Who** | **A:** LI+RO+CP+Legal · **R execute:** Product TOs + WO |
| **How (order)** | 1) Approvals. 2) **Perps LD-07:** reduce-only → flatten/settle → delist. 3) **Margin LD-06:** freeze borrow → force repay/liq → remove collateral. 4) **Spot LD-05:** halt if needed → disable trade → withdraw per WA. 5) Comms+support macros. |
| **SLA** | Notice period per Listing Policy unless LD-08 |

##### LD-08 Emergency delist / halt
| Field | Detail |
|-------|--------|
| **When** | Exploit/fraud/security |
| **Who** | **A:** CRO/RO + CP + Legal · execute G02/LD immediately |
| **SLA** | Halt ASAP; formal notes ≤24h |
| **How** | Safety first: halt/disable deposits → follow compressed LD-05–07 → forensic with Security/CP. |

---

#### CP — Compliance

##### CP-01 Surveillance alert triage
| Field | Detail |
|-------|--------|
| **When** | Surveillance alert |
| **Who** | **R:** CP analyst · **A:** CP lead · **C:** TO/RO if markets |
| **SLA** | Per CP SLA table (typ. same day for high severity) |
| **How** | Replay → classify false/positive → case → link UIDs/products. |

##### CP-02 Account hard hold
| Field | Detail |
|-------|--------|
| **When** | Confirmed suspicion / policy |
| **Who** | **R:** CP · **A:** CP lead · G04 to remove |
| **How** | `/admin/compliance/holds` trade/withdraw/leverage as needed → notify Support script → evidence pack. |

##### CP-03 Cross-product abuse review
| Field | Detail |
|-------|--------|
| **When** | Spot+Perps (or margin) pattern |
| **Who** | **R:** CP · **C:** RO/TO-FUT |
| **How** | Combined timeline → holds → market impact note to RO. |

##### CP-04 Reg request / freeze
| Field | Detail |
|-------|--------|
| **When** | External lawful order |
| **Who** | **R:** CP/Legal · **A:** Legal · **I:** CRO |
| **How** | Authenticate order → freeze scope → acknowledge authority → retain. |

---

#### TS / MM / ENG

##### TS-01 Banking corridor outage
**When:** partner down · **Who R:** TS · **A:** TS PIC · **How:** divert rails → update deposit/withdraw UX with WO/Comms → RO if liquidity risk · **Done:** corridor restored or alternative live.

##### TS-02 Stablecoin depeg response
**When:** peg break / MG-K08 · **Who R:** TS+RO · **How:** inventory/redemption · haircut/borrow actions with MG-03 · Comms · S3 family · **Escalate:** hard depeg L3.

##### TS-03 Settlement after EOD recon
**When:** daily post G05 approve · **Who R/A:** TS · **How:** execute only on `SettlementReady` · attach refs · **Escalate:** never settle on open material breaks.

##### TS-04 Insurance fund injection
**When:** Board/CRO approved after RM-06 · **Who R:** TS · **A:** CRO · G04 dual · **How:** `/admin/futures/insurance` or treasury transfer · ledger · notify RO.

##### MM-01 SLA breach escalation
**When:** depth/spread fail SP-K01/02 · **Who R:** MM ops · **C:** TO · **How:** contact MM → enforce agreement → RO halt opinion if disorderly.

##### MM-02 Vol regime quote widen
**When:** stress · **Who R:** MM · **I:** TO/RO · **How:** widen per playbook · ensure not indistinguishable from outage (heartbeat on).

##### MM-03 Information barrier check
**When:** new listing / prop overlap · **Who R:** MM+RO+CP · **How:** confirm Chinese walls · log conflicts.

##### ENG-01 Privileged admin access grant
**When:** joiner/mover · **Who R:** Security/ENG · **A:** BU PIC + Security · **How:** least privilege · time-bound · ticket · quarterly recert.

##### ENG-02 Audit log immutability check
**When:** periodic · **Who R:** Security · **How:** verify sink integrity · alert on gaps · **Escalate:** gap = L3.

##### ENG-03 Pipeline lag incident
**When:** PL-K06 / late risk feeds · **Who R:** ENG · **A:** RE/RO for trading impact · **How:** fix consumer → if marks unsafe trigger RE-02/PF-03 · **Done:** lag <WARN.

##### ENG-04 Security incident (key/API)
**When:** compromise / PL-K08 · **Who R:** Security · **A:** CISO · **I:** CRO/CP · **SLA:** kill key ≤2m · **How:** revoke · rotate · user notify · forensic · L3/L4 war room.

---

#### ACCESS — Phase 1 invite & broker onboarding `[Phase 1]`

##### ACC-01 Invite-only account open
| Field | Detail |
|-------|--------|
| **When** | Prospect redeems invite / allowlist code; or ops issues invite |
| **Who** | **R:** Product/Growth ops or Broker desk · **A CP gates:** CP · **A risk entitlements:** RO (limits tier) · **R enable trade:** RE/ENG flags |
| **SLA** | Invite validate ≤1m automated · Manual CP review per policy · Entitlement push ≤15m after clear |
| **Preconditions** | Phase 1 mode on; invite unused/unexpired; sanctions screen clear |
| **Systems** | Invite admin · KYC · `/admin/compliance/holds` · risk limits tier · broker link (if any) |
| **How** | 1) Validate invite. 2) Collect KYC/KYB as required. 3) CP clear. 4) Bind account to invite issuer metadata. 5) Set Phase 1 product entitlement = **perps only**. 6) Enable trading flags. 7) Audit log. |
| **Done when** | Account can trade approved perps only; spot/margin flags off. |
| **Escalate if** | Invite abuse / shared codes → CP-02 hold; public signup path found open → L3 disable. |

##### ACC-02 Broker-introduced account open
| Field | Detail |
|-------|--------|
| **When** | Broker/IB submits or links end-client under broker agreement |
| **Who** | **R:** Broker ops · **A:** CP (KYC/KYB of client + broker) · **C:** Legal (broker agreement live) · **A risk:** RO for broker-level limits · **R:** RE entitlements |
| **SLA** | Per broker SLA; no trade before CP+agreement+entitlement |
| **Preconditions** | Executed broker agreement; broker on allowlist; client KYC complete |
| **Systems** | Broker portal · master/sub or tagged UID · limit hierarchy |
| **How** | 1) Verify broker status. 2) Onboard client under broker. 3) CP clear client. 4) Apply broker and client limit stacks. 5) Entitlement = Phase 1 perps only. 6) Dual-control if broker credit/vip. |
| **Done when** | Client trades only via approved path; attribution to broker for surveillance/revenue. |
| **Escalate if** | Broker agreement lapsed → freeze new accounts; cascade risk on broker book → RO L2/L3. |

##### ACC-03 Phase 1 entitlement guard (continuous)
| Field | Detail |
|-------|--------|
| **When** | Continuous + daily MI; any attempt to enable spot/margin or public signup |
| **Who** | **R monitor:** RO-OPS/ENG · **A:** RO + CP |
| **How** | Alert if spot/margin symbol enabled; alert if self-serve register open; alert if UID trades without invite/broker tag. |
| **Done when** | Daily zero exceptions or exceptions ticketed with phase-gate waiver. |


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

> **Phase 1 admin priority:** `/admin/futures/*`, `/admin/risk*`, `/admin/engine/*`, invite/broker & compliance holds. `/admin/spot/*` and `/admin/margin/*` stay configured but **disabled** (`[Phase 2+]`).

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

**Phase 1 prefer (perps + access + platform):**  
1. **PF-K01** Mark−index · **PF-K07** Insurance · **PF-K06** Liq burst · **PF-K03** Funding (incl. **XAUUSD**)  
2. **ACC / access:** invite/broker tag coverage; blocked public signup; entitlement = perps-only  
3. **PL-K01** Hot-wallet buffer · **PL-K06** Mark pipeline lag · **PL-K05** Recon · **SP-K09** Matching latency (shared engine)  

**`[Phase 2+]` dormant until enabled:**  
4. **MG-K01 / K04 / K08** · **SP-K03** (spot book) and other Spot/Margin KRIs  

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
| Phase 1 | Production: perps only (incl. XAUUSD); invite-only or broker onboarding |
| Phase 2+ | Documented but not production-enabled (e.g. Spot, Margin, public signup) |
| Invite-only | Account open requires valid invite/allowlist; no public self-serve |
| Broker channel | IB/introducing broker introduced accounts under agreement |

### 11.2 BU PIC weekly checklist

- [ ] Review open WARNs/BREACHes and waivers nearing expiry (ACK SLA breaches noted)  
- [ ] Confirm admin ACL joiner/mover/leaver tickets closed  
- [ ] Instrument KRI RAG vs §8 catalogue (Spot SP-K*, Margin MG-K*, Perps PF-K*, Platform PL-K*)  
- [ ] Spot-check one amber using §9 single-indicator causes + sequence  
- [ ] Attest weekly PIC pack: false-positive rate + any threshold calib requests  
- [ ] Upcoming listings/delistings risk opinions scheduled  
- [ ] DR / failover or liquidation dry-run status (monthly at minimum)  
- [ ] Read-across: any Spot issue that should change Margin/Perps params  

### 11.3 Go-live checklist — Perps (summary) `[Phase 1]`

> Includes **XAUUSD** and other Phase 1 perps. Confirm invite/broker access (ACC-01/02) before publicising any cohort.

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

### 11.3a Go-live checklist — Phase 1 access (invite / broker)

- [ ] Public self-serve registration **disabled**
- [ ] Invite service live; code expiry/reuse rules tested (ACC-01)
- [ ] Broker allowlist + agreements executed; portal/tagging works (ACC-02)
- [ ] Every trade-enabled UID has invite **or** broker attribution
- [ ] Product entitlement = **perps only** (spot/margin flags off)
- [ ] ACC-03 daily exception report subscribed by RO-OPS + CP

### 11.4 Go-live checklist — Margin asset `[Phase 2+]`

- [ ] Spot market stable ≥ observation window  
- [ ] Haircut/LTV stress-tested (DA); **MG-K05** baseline recorded  
- [ ] Borrow inventory & caps set; **MG-K01/MG-K09** alerts on  
- [ ] Interest curve approved; **MG-K07** recon green  
- [ ] Liquidation path tested on isolated + cross (**MG-K02/MG-K03**)  
- [ ] Bad-debt ledger mapping ready (**MG-K04**)  
- [ ] Depeg tabletop (S3) completed if stable / soft-peg collateral  

### 11.5 Go-live checklist — Spot `[Phase 2+]`

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
| Related artefacts | Limit Book, Liquidation Policy, Insurance/ADL Policy, Listing Policy, BCP/DR, **§8 Indicator Catalogue**, **§9 Scenario Diagnostics**; Chinese edition via handbook tabs |
| Training | Mandatory for all BU PICs within 30 days of role start |
| Version | 1.6 — Phase 1 labels: perps (incl. XAUUSD) + invite/broker only |

---

*End of English handbook. Simplified Chinese full translation follows.*

---
