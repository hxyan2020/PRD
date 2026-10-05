# Platform Improvement Roadmap

**Document ID:** CRMP-RM-001 · Prioritised backlog after the current CRMP prototype  
**Audience:** Risk Owner, Platform Owner, engineering, GRC  
**How to read:** the admin page `/admin/docs/roadmap` is the operator view (expandable cards). This file is the printable twin. Each `RM-xx` states **today’s prototype**, **what to build**, **done-when**, **where in the code**, and **skip risk**.

This prototype already walks the spine **Monitor alarm → AI RCA (skill / RAG) → second-AI challenge → messenger → maker/checker → audit + home spine**. Shipped desk polish (grouped AI pipeline, MonitorCode, RAG leaves, ESC-DEFAULT + dimension coefficients, BU and Teams, first/second-line AI Admin, editable Roles, audit CRMP / Vantage Markets Admin tabs + Roll back) is tracked as BAU docs; **programme open issues** with ETAs/BU live in [Open Issues](/admin/docs/open-issues) / [Progress Tracker](/admin/docs/progress). Items here close the gaps that would fail a live desk: mocked Lark, seeded Monitor, heuristic AI, SQLite, shared demo passwords, and logged-only “executions”.

**Effort key:** S = one vertical slice · M = multi-day module · L = cross-team module · XL = programme-sized

**Out of scope for this UAT window:** live trading-bus writes (RM-09), production IdP (RM-05), and replacing Monitor 2.0 itself. File those as later work, not UAT Fail.

---

## Scan table

| ID | Item (what operators actually get) | Effort | People | Depends | Sev. |
|---|---|---|---|---|---|
| RM-01 | Live Lark **interactive cards** so Ack / Escalate / Approve happen in the company messenger, not only Demo Messenger | L | 2 FE + 1 BE | Lark app approval | Critical |
| RM-02 | Real **Monitor 2.0 ingest + ticket write-back** so dismiss/close in CRMP updates the upstream ticket | L | 2 BE | Monitor API contract | Critical |
| RM-03 | **LLM primary RCA** with tool-calling and an eval harness (replace heuristic skill/RAG) | XL | 1 ML + 2 BE | Prompt vault, spend caps | High |
| RM-04 | **Challenger on a separate vendor/prompt** so second opinion cannot share primary failure modes | M | 1 ML | RM-03 | High |
| RM-05 | **SSO + SCIM** — corporate login, no shared `risk123` personas | M | 1 BE + Security | IdP (Okta / Entra) | Critical |
| RM-06 | **Postgres + multi-instance** — leave the single SQLite file | M | 1 SRE + 1 BE | Infra / backups | High |
| RM-07 | **Touch-first admin + messenger** on phone (drawer, 44px targets, no clipped cards) | S | 1 FE | Design tokens | Medium |
| RM-08 | **Finish admin i18n** — remaining seed copy, docs tables, and error strings EN / 繁中 | M | 1 FE + PM | Message catalog | Medium |
| RM-09 | **Real control adapters** (halt / leverage / A-book / withdrawal pause) with dry-run then checker | L | 2 BE + Ops | Trading control bus | Critical |
| RM-10 | **Evidence redaction + retention jobs** so KYC / account IDs are not kept forever in excerpts | M | 1 BE + GRC | Legal policy | High |
| RM-11 | **Shadow-mode dashboard** — AI may suggest, writes stay off, Risk Owner sees suggest-vs-act | S | 1 FE + 1 BE | Spine metrics | Medium |
| RM-12 | **CI UAT smoke** — seed DB + critical cases on every PR | S | 1 QA + 1 BE | Seed DB | Medium |
| RM-13 | **Multi-brand / entity tenancy** (VFSC vs FCA packs, data isolation) | XL | Arch + 2 BE | Org model | Medium |
| RM-14 | **AI cost & latency SLOs** with alerts when RCA or challenger blows budget | S | SRE | Observability | Medium |
| RM-15 | **Scored market-intel sources** (licensed feeds, not template headlines) | M | 1 DS + 1 BE | Vendor contracts | Medium |

## Suggested sequencing

1. **Foundations:** RM-05, RM-06, RM-02 — identity, durable store, live alarms.
2. **Operator UX:** RM-01, RM-07, RM-11 — people work in Lark and can run shadow.
3. **Write path (last):** RM-09 with a global kill-switch — only after Risk Owner accepts shadow false-alarm rates.
4. **Model quality:** RM-03 + RM-04 + RM-14.
5. **Harden & scale:** RM-08, RM-10, RM-12, RM-15. RM-13 stays a later programme.

Rule: do **not** enable RM-09 write adapters until Phase-B false alarms and challenger `DISAGREE` handling are accepted.

---

## RM-01 — Production Lark interactive cards

**Severity:** Critical · **Effort:** L · **People:** 2 frontend + 1 backend · **Depends:** Lark (or Teams) app approval, bot credentials in a vault.

### Why

On-call will not keep the CRMP tab open. If the only working inbox is the in-app demo, BREACH cards never reach the desk that actually pages.

### Today

[Demo Messenger](/admin/messenger) is a CRMP-hosted Lark lookalike. [Lark Integration](/admin/lark) stores mock webhooks. Nothing is posted to a real Lark chat.

- Seeded chats: `oc_risk_control_desk`, `oc_ops_funding_recon`, `oc_ai_detection_lab`, `oc_trading_infra`, `oc_crypto_exchange_risk`, `oc_exec_risk_bridge`.
- Webhooks are mock URLs (`https://open.larksuite.com/hook/mock-risk-desk`, …). `POST /api/lark` `test_notify` writes audit `LARK_TEST_NOTIFY` and returns `{ mock: true }`.
- Setting `lark.app_id` = `cli_mock_vantage_crmp`. Demo Messenger already has Ack / Escalate / Dismiss / Close / maker-confirm / checker — all local to SQLite (`lib/messenger/demo.ts`, `LarkManager.tsx`).

### Build

1. Register a real Lark app; store app id / secret / encrypt key in a vault (retire `cli_mock_vantage_crmp`).
2. Map each CRMP `chat_id` to a live chat. Post **card messages** for ALERT / AI_REPORT / ESCALATION.
3. Card buttons: Acknowledge, Escalate, Dismiss (false positive), Close (accept AI), Confirm action (maker), Checker approve.
4. Each button calls CRMP with the operator’s SSO identity, then updates spine + audit. Human-gated actions must not silent-execute.

### Done when

- A staging Monitor BREACH produces a card in the Risk Control Desk chat.
- Tapping Ack marks the CRMP alert `ACKNOWLEDGED` and write-backs the Monitor ticket (with RM-02).
- Tapping a human-gated action opens maker/checker. Demo Messenger can remain as a debug console.

### If we skip

Operators keep a second inbox; Ack in Lark never reaches CRMP; SLA clocks lie.

---

## RM-02 — Real Monitor 2.0 webhook + ticket write-back

**Severity:** Critical · **Effort:** L · **People:** 2 backend · **Depends:** Monitor 2.0 API contract owner.

### Why

Today the catalogue is a seed. Demo sync pretends to pull 5 alerts. A live desk would diverge from Monitor within one shift.

### Today

[Monitor 2.0](/admin/monitor-2) is a seeded SQLite catalogue (`M2-MRG-014`, `M2-EQ-001`, tickets `TKT-88421`…). `POST /api/monitor` `ack_alert` / `update_ticket` / `sync_monitor2` hit local rows. `sync_monitor2` audits `pulled_alerts: 5` — no HTTP to `monitor.vantagemarkets.internal`. Flag `monitor2.sync_enabled` does not call out.

### Build

1. Inbound: Monitor posts warn/breach (indicator id, observed, ticket id, severity) → CRMP upserts `monitor_indicators` / `monitor_alerts` / `monitor_tickets` and triggers AI RCA.
2. Outbound: CRMP Ack, dismiss, close, assignee **PATCH the Monitor ticket**.
3. Replay / idempotency keys so a double-post does not duplicate AI analyses.
4. Staging contract tests against a Monitor sandbox.

### Done when

- Raising a sandbox Monitor breach creates CRMP alert + analysis within the SLA.
- Acknowledging in CRMP or Lark shows as acked on Monitor.
- CRMP never closes a BREACH/CRITICAL ticket by AI alone (Risk Owner policy).

### If we skip

Two ticket books; Monitor still paging after CRMP closed; AI analyses on stale seed rows.

---

## RM-03 — LLM primary RCA with tool-calling and eval harness

**Severity:** High · **Effort:** XL · **People:** 1 ML + 2 backend · **Depends:** prompt vault, spend caps, RM-02 live alarms for labels.

### Why

Heuristic `matchSkill` can fire with certainty 1.0 on wording overlap. That is unsafe once RM-09 can write.

### Today

`lib/ai/analyze.ts` matches skills (`matchSkill` in `lib/ai/skills.ts`) or retrieves RAG. Non-human steps are stored as `EXECUTED_MOCK`; human steps `AWAITING_HUMAN`. `POST /api/ai` analyze does not call a live model. Seeded analyses already look complete.

### Build

1. Primary RCA model with **tools**: indicator snapshot, related monitors, RAG `top_k`, market-intel hits, open tickets, macro calendar.
2. Skill path only when the matcher **and** the model agree.
3. Eval harness on labelled historic cases (copy concentration, LP reject, hot-wallet float, equity DD): hypothesis quality, evidence citation, unsafe-action rate.
4. Prompt versions live in [AI Admin](/admin/ai-admin) with maker/checker.

### Done when

- Held-out pack: skill-match precision ≥ agreed gate (start 80%).
- Unsafe irreversible suggestions without a human gate = 0.
- Every RCA cites at least one evidence-vault row. Challenger (RM-04) stays a **separate** process.

### If we skip

False-certain skills auto-queue halt/leverage once adapters exist; no way to regress quality.

---

## RM-04 — Challenger on a separate vendor or prompt

**Severity:** High · **Effort:** M · **People:** 1 ML · **Depends:** RM-03.

### Why

Today the “second AI” is another heuristic in the same codebase. A wording bug can fool both.

### Today

[AI Analyses](/admin/ai-analyses) already run a second-AI panel for BREACH/CRITICAL (`ai.second_opinion_severity`, default BREACH). `lib/ai/challenger.ts` is a second heuristic (co-signal checks, confidence cap). Table `ai_analysis_challenges` stores `AGREE` / `PARTIAL` / `DISAGREE` — populated by rules, not a vendor.

### Build

1. Independent model: different vendor **or** isolated endpoint + prompt. No shared tool-result cache with primary.
2. Keep verdicts `AGREE` / `PARTIAL` / `DISAGREE`. `DISAGREE` or `PARTIAL` **blocks** auto skill execute.
3. Log both model ids and token cost on the analysis (feeds RM-14).

### Done when

- Fault injection (primary claims skill certainty, feed is stale) yields `DISAGREE` or `PARTIAL` on 100% of injected cases.
- Risk Owner can filter analyses by verdict; spend appears on RM-14.

### If we skip

Correlated false certainty; halt proposals that nobody challenged.

---

## RM-05 — SSO + SCIM user provisioning

**Severity:** Critical · **Effort:** M · **People:** 1 backend + Security · **Depends:** corporate IdP (Okta / Entra ID). **UAT out of scope.**

### Why

Shared demo passwords fail segregation of duties. Anyone who knows `risk123` can act as Risk Owner and as Viewer.

### Today

`POST /api/auth/login` is email + password cookie session. Personas: `risk.owner@vantagemarkets.com` / `risk123` plus named platform owner (`yan123`). [Users](/admin/users) is a local directory seeded in `lib/db.ts`. Maker ≠ checker is an in-app flag, not IdP identity.

### Build

1. OIDC/SAML SSO. SCIM (or JIT) to create/disable users from the IdP.
2. Map IdP groups → CRMP roles (`RISK_OWNER`, `OPS_LEAD`, …). Retire demo passwords in staging/prod.
3. Maker ≠ checker enforced with **IdP identity**. Break-glass `SUPER_ADMIN` in the vault, dual-control to use.

### Done when

- A joiner in the Risk IdP group signs in with no local password.
- A leaver is disabled within the SCIM SLA.
- UAT can no longer log in with `risk123` on staging.

### If we skip

Password sharing; leavers retain `SUPER_ADMIN`; maker/checker is theatre.

---

## RM-06 — Postgres + multi-instance deploy

**Severity:** High · **Effort:** M · **People:** 1 SRE + 1 backend · **Depends:** managed Postgres, object storage for evidence blobs.

### Why

One SQLite file is fine for the demo. Concurrent writes, GitHub Pages, and failover are not.

### Today

Persistence is `platform/data/vantage_risk.db` via `better-sqlite3`. Static export on github.io cannot write it. `npm run db:reset` deletes the file. RAG uses SQLite FTS.

### Build

1. Postgres with WAL, backups, PITR. App becomes stateless (≥2 instances).
2. Migrate tables as-is first (alerts, analyses, spine, audit, RAG).
3. Health/readiness probes. Do not keep SQLite as a silent fallback in prod.

### Done when

- Kill one app instance during a detector run without lost spine events.
- Restore drill from backup meets RPO/RTO signed by System Admin.

### If we skip

Silent data loss on deploy; Pages demo diverges from “the” CRMP.

---

## RM-07 — Touch-first admin + messenger

**Severity:** Medium · **Effort:** S · **People:** 1 frontend · **Depends:** existing design tokens.

### Why

US-session on-call opens CRMP from a phone. Dense tables and clipped cards miss Ack.

### Today

Admin has a drawer and some `min-h-11` / safe-area padding. Messenger threads and dual-confirm sheets are still desktop-first.

### Build

1. 375px pass: login, home, alerts, messenger thread (ack/escalate/confirm), interventions approve/reject.
2. 44px targets; no horizontal clip of primary actions; sticky composer; language toggle reachable.
3. Messenger cards stack; evidence is a sheet.

### Done when

- UAT on an actual phone completes maker confirm without pinch-zoom.
- Automated viewport shots in CI (pairs with RM-12).

### If we skip

Night BREACH acked late because the button was off-canvas.

---

## RM-08 — Finish admin i18n (EN / 繁中)

**Severity:** Medium · **Effort:** M · **People:** 1 frontend + PM · **Depends:** message catalog; PM glossary of risk terms.

### Why

Risk on-call in HK/TW reads 繁中. Mixed chrome looks unfinished and hides severity words.

### Today

`useUiLocale` + cookie `crmp_ui_lang`, `t()` / `phrase()` cover most chrome. Remaining English is mostly IDs, emails, permission codes (intentional) plus some AI/evidence strings and docs tables. Keep `M2-MRG-014`, `SUPER_ADMIN` in Latin. Glossary: 違規 / 警告 / 危急.

### Build

1. Catalog every operator-visible string (AI summary templates, UAT chrome, docs tables).
2. Screenshot gate: toggle 繁中 on skills, alerts, messenger, settings.

### Done when

- A 繁中 sweep of the 15 highest-traffic pages has no leftover English **chrome**.
- Seed operational names overlay or are marked “code”.

### If we skip

Operators miss 危急 because a button is still English (codes may stay Latin).

---

## RM-09 — Real control adapters (halt / leverage / A-book / withdrawal pause)

**Severity:** Critical · **Effort:** L · **People:** 2 backend + Ops · **Depends:** trading/LP control bus; RM-05; kill-switch. **UAT out of scope.**

### Why

Today Approve only logs spine/audit. Treating `EXECUTED_MOCK` as containment is the most dangerous demo confusion.

### Today

[Human Intervention](/admin/interventions): `decideIntervention()` sets `EXECUTED_AFTER_APPROVAL` with **no broker call**. Non-human steps in `analyze.ts` are `EXECUTED_MOCK`. Actions in the catalogue: `suggest_symbol_halt`, `suggest_lp_disable`, `group_leverage_tighten`, `pause_new_copies`, `pause_large_withdrawals`, `suggest_abook_increase`. [AI Access Security](/admin/security/ai-access) already blocks halt / close-only for the AI role.

### Build

1. Per-action adapters with **dry-run** returning the exact control payload and affected symbols/accounts.
2. Live execute only after maker **and** checker (different SSO users).
3. Global and per-adapter kill-switches in Platform Settings. Never grant these permissions to an AI service role.

### Done when

- Staging dry-run for “halt stale symbols” shows the symbol list Risk Owner expects.
- Live execute on a **test book** is visible on the trading admin and fully audited.
- Kill-switch stops further lives within one request.

### If we skip

False sense of containment; or a later half-wired adapter fires without dual control.

---

## RM-10 — Evidence redaction + retention jobs

**Severity:** High · **Effort:** M · **People:** 1 backend + GRC · **Depends:** legal classification of the evidence vault.

### Why

Analyses can embed account counts, provider names, wallet ratios. Keeping them forever is a GRC finding.

### Today

`ai_analyses` stores summary + evidence snippets in SQLite. Messenger excerpts persist. No TTL, no automated redaction, no legal-hold flag.

### Build

1. Classify fields (public indicator vs client identifier vs staff PII). Redact logins, payment instruments, wallet addresses in the default UI.
2. Retention jobs (e.g. 90 days for WARN; longer for BREACH/CRITICAL / legal hold) + dry-run purge report.
3. Regulator export pack. Full payload only for authorised roles with a reason code.

### Done when

- GRC sample of 20 staging analyses has no raw client login or wallet in the default view.
- Retention dry-run lists purge candidates; audit records the purge.

### If we skip

KYC residue in RCA excerpts; no answer to a deletion request.

---

## RM-11 — Shadow-mode dashboard (AI suggest only)

**Severity:** Medium · **Effort:** S · **People:** 1 frontend + 1 backend · **Depends:** spine metrics; kill-switch for auto-execute.

### Why

Without a single view, leadership cannot tell demo mock executes from live containment.

### Today

`ai.skill_certainty_only` (default true) and `ai.maker_checker_required` exist, but there is **no** “we are in shadow” banner on [Daily Performance](/admin/dashboard) / [Risk Log](/admin/risk-log).

### Build

1. Shadow mode (or banner). Force auto skill execute off.
2. Dashboard: suggestions vs human decisions, time-to-ack, challenger `DISAGREE` rate, would-have-written counts (not sent).
3. Leave shadow = Risk Owner + System Admin, audited change request.

### Done when

- Staging default is shadow; a week of suggest-vs-act with zero RM-09 adapter fires.
- Leaving shadow is an audited change request.

### If we skip

Someone enables RM-09 while the desk still thinks it is a demo.

---

## RM-12 — CI UAT smoke on every PR

**Severity:** Medium · **Effort:** S · **People:** 1 QA + 1 backend · **Depends:** seed DB in CI.

### Why

The Risk Owner pack is long and manual. Regressions land between UAT windows.

### Today

[UAT Checklist](/admin/docs/uat) is `lib/docs/uat-cases.ts` (UAT-01…). No pipeline replays Critical cases on each PR.

### Build

Headless smoke: login personas, home stats, detectors run, alert ack, AI analysis exists, messenger ALERT+AI_REPORT, intervention queue, 繁中 title on skills, this roadmap renders. Fail the PR on assertion miss. Keep the human pack for RCA-quality judgement.

### Done when

- A deliberate break (e.g. skills page title) fails CI.
- Critical list runs in the agreed wall-clock budget on the CI runner.

### If we skip

UAT day rediscovers login 404s and empty analysis lists.

---

## RM-13 — Multi-brand / entity tenancy

**Severity:** Medium · **Effort:** XL · **People:** architecture + 2 backend · **Depends:** org/entity model; RM-05 and RM-06 first.

### Why

Leverage caps and disclosures differ by entity. One global role model will not pass a two-licence audit.

### Today

One seeded CRMP: mixed CFD + crypto. ASIC / FCA / VFSC notices are **reference sources**, not isolated books. Roles are global.

### Build

Tenant = legal entity (or brand). Isolated alerts, RAG, skill packs, Lark routing, audit export. Cross-entity exec view is read-only aggregation. Two UAT seeds (VFSC vs FCA).

### Done when

- A VFSC user cannot ack an FCA-entity ticket.
- Exec role can see both in a labelled aggregate.

### If we skip

Wrong-entity Ack; skill pack applies FCA leverage to a VFSC book.

---

## RM-14 — AI cost & latency SLO alerts

**Severity:** Medium · **Effort:** S · **People:** SRE · **Depends:** observability stack; pairs with RM-03.

### Why

Without cost/latency, a bad prompt is an unbounded vendor bill and a frozen desk.

### Today

Admin Home spine (`/admin`, `/admin/spine` redirects) has stage ticket counts and timestamps. No token cost, no p95 RCA latency, no $ cap alarm.

### Build

Metrics: RCA p50/p95, challenger latency, tokens in/out per model, $ per analysis, error rate. Example SLO: p95 RCA under 15s excluding human gate; daily AI $ cap. Alert Trading Infra + AI Detection Lab. Degrade to skill-only if the vendor is down.

### Done when

- A staging load of 50 concurrent alarms plots on the dashboard.
- Crossing the $ cap pages on-call and stops new non-CRITICAL calls.

### If we skip

Silent spend blow-up; RCA slower than the SLA with nobody paged.

---

## RM-15 — Scored market-intel sources (licensed feeds)

**Severity:** Medium · **Effort:** M · **People:** 1 data scientist + 1 backend · **Depends:** licensed news / official / social contracts.

### Why

Template headlines train the desk on fake catalysts. Indicator counts then lie.

### Today

[Market Intelligence](/admin/market-intel) rotates `EVENT_TEMPLATES` every five minutes (`lib/market-intel/scanner.ts`, Pages uses `demo-scan.ts`). Seeded `MARKET_INTEL_SOURCES` — findings can be synthetic. Indicator `M2-MKT-INTEL` counts hits. Findings carry article URLs into `oc_market_intelligence`.

### Build

1. Ingest contracted wires + official calendars + selected social.
2. Score by source type, corroboration count, asset hit, geography. Dedupe by fingerprint across 5-minute buckets.
3. Only WARN+ **corroborated** hits increment `M2-MKT-INTEL`.

### Done when

- A known CPI print is ingested from ≥2 licensed sources, deduped to one finding, scored High, and does not double-count the indicator.
- A single unverified social post does not breach.

### If we skip

Synthetic “NFP surprise” pages the desk; real prints are missed or double-counted.

---

## Traceability

| Roadmap | Related admin / docs |
|---|---|
| RM-01 | [Demo Messenger](/admin/messenger) · [Lark](/admin/lark) |
| RM-02 | [Monitor 2.0](/admin/monitor-2) · [Live Alerts](/admin/alerts) |
| RM-03 / RM-04 | [AI Analyses](/admin/ai-analyses) · [AI Admin](/admin/ai-admin) |
| RM-05 | [Users](/admin/users) · [Roles](/admin/roles) |
| RM-09 | [Human Intervention](/admin/interventions) · [AI Access Security](/admin/security/ai-access) |
| RM-11 | [Daily Performance](/admin/dashboard) · [Risk Log](/admin/risk-log) |
| RM-12 | [UAT Checklist](/admin/docs/uat) |
| RM-15 | [Market Intelligence](/admin/market-intel) |
| Budget / FTE | [Ecosystem Eval](/admin/docs/ecosystem) |
