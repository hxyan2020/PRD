# Crypto Exchange Risk Management — BU User Handbook

**Audience:** Business Unit Persons-in-Charge (BU PICs), Risk Officers (RO), Product, Trading Ops, Engineering, Compliance, Treasury, Listing, Custody  
**Scope:** Spot · Cross/Isolated Margin · USDⓈ-M & COIN-M Perpetuals (and dated futures where noted)  
**Version:** 1.0 · **Owner:** Chief Risk Officer (2nd line) · **Review cycle:** Quarterly or after material incident  

> This handbook is the **operating playbook** for who owns what, how work is divided, standard operating procedures (SOPs), consoles/admin pages, and day-to-day tools. It does not replace legal policy, limit books, or regulatory filings.

---

## Table of contents

1. [How to use this handbook](#1-how-to-use-this-handbook)
2. [Three lines of defence & role map](#2-three-lines-of-defence--role-map)
3. [Instrument primers (Spot / Margin / Perps)](#3-instrument-primers-spot--margin--perps)
4. [BU-by-BU playbooks](#4-bu-by-bu-playbooks)
5. [Cross-BU RACI matrix](#5-cross-bu-raci-matrix)
6. [Global SOPs (shared)](#6-global-sops-shared)
7. [Admin pages & tool catalogue](#7-admin-pages--tool-catalogue)
8. [Limits, KRIs & escalation](#8-limits-kris--escalation)
9. [Incident severity & war room](#9-incident-severity--war-room)
10. [Appendix — glossary & checklists](#10-appendix--glossary--checklists)

---

## 1. How to use this handbook

| If you are… | Read first |
|-------------|------------|
| New BU PIC | §§2–4 for your BU + §7 tools |
| Risk Officer / Risk Ops | Full doc; own §8 limits & §9 incidents |
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

## 8. Limits, KRIs & escalation

### 8.1 Limit types

| Type | Meaning | Example |
|------|---------|---------|
| Soft (WARN) | Early warning; no auto-block | Perps OI 80% of cap |
| Hard (BREACH) | Auto-action or mandatory human action | User leverage > bracket → reject order |
| Kill | Immediate safety stop | Matching kill switch |

### 8.2 Minimum KRI set by instrument

**Spot:** spread vs mid, depth notional, halt count, cancel/fill, deposit–trade–withdraw velocity  

**Margin:** borrow utilisation by asset, avg LTV, liquidation notional, bad-debt daily, interest exceptions  

**Perps:** insurance coverage ratio, ADL count, mark–index deviation, funding percentile, liq burst notional, top-trader concentration  

### 8.3 Escalation ladder

| Level | Criteria (examples) | Notify |
|-------|---------------------|--------|
| L1 | Single WARN, data blip | RO-OPS |
| L2 | Hard BREACH, contained | RO + BU PIC |
| L3 | Multi-symbol cascade, insurance draw | CRO + Product + ME + RE |
| L4 | Client-fund threat, key compromise, exchange-wide halt | ELT / Crisis Comms / Legal / CP |

---

## 9. Incident severity & war room

| Sev | Definition | War room chair |
|-----|------------|----------------|
| Sev-1 | Client asset loss risk, engine integrity fail, widespread wrong marks | CRO or CTO |
| Sev-2 | Material bad debt, ADL storm, prolonged halt | BU PIC + RO |
| Sev-3 | Degraded feature, single-market issue | BU PIC |
| Sev-4 | Cosmetic / minor | On-call |

**Standing war-room roles:** Incident Commander · Risk · ME · RE · Wallet · Comms · CP · Scribe  

**Always capture:** timeline, configs touched, orders/liquidations during incident, client impact, permanent fix owner.

---

## 10. Appendix — glossary & checklists

### 10.1 Glossary (short)

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

### 10.2 BU PIC weekly checklist

- [ ] Review open WARNs/BREACHes and waivers nearing expiry  
- [ ] Confirm admin ACL joiner/mover/leaver tickets closed  
- [ ] Instrument KRIs green/amber/red with comments  
- [ ] Upcoming listings/delistings risk opinions scheduled  
- [ ] DR / failover or liquidation dry-run status (monthly at minimum)  
- [ ] Read-across: any Spot issue that should change Margin/Perps params  

### 10.3 Go-live checklist — Perps (summary)

- [ ] Contract specs signed (PM + Legal)  
- [ ] Index constituents ≥ policy minimum; deviation alerts on  
- [ ] Leverage brackets & risk limits dual-approved  
- [ ] Insurance fund seed per policy  
- [ ] Funding formula & caps tested in staging  
- [ ] Liquidation & ADL dry-run signed by RE + RO  
- [ ] Matching symbol configured; rate limits set  
- [ ] Comms + support macros  
- [ ] Hypercare roster 72h  

### 10.4 Go-live checklist — Margin asset

- [ ] Spot market stable ≥ observation window  
- [ ] Haircut/LTV stress-tested (DA)  
- [ ] Borrow inventory & caps set  
- [ ] Interest curve approved  
- [ ] Liquidation path tested on isolated + cross  
- [ ] Bad-debt ledger mapping ready  

### 10.5 Go-live checklist — Spot

- [ ] Listing diligence complete (LI/RO/CP/Legal)  
- [ ] Wallet deposit/withdraw enabled on correct chain(s)  
- [ ] Tick/lot/bands/STP/fees configured  
- [ ] MM SLA live or disclosure if thin book  
- [ ] Halt authority tested  

### 10.6 Document control

| Item | Value |
|------|-------|
| Classification | Internal — Risk Restricted |
| Change control | CRO approve; publish via Risk portal |
| Related artefacts | Limit Book, Liquidation Policy, Insurance/ADL Policy, Listing Policy, BCP/DR |
| Training | Mandatory for all BU PICs within 30 days of role start |

---

*End of handbook. For template tickets, alert routing schemas, and automation owners, see companion modules in repo root and the use-case narrative flowchart.*
