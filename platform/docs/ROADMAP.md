# Platform Improvement Roadmap

**Document ID:** CRMP-RM-001 · Prioritised backlog after the current CRMP prototype  
**Audience:** Risk Owner, Platform Owner, engineering, GRC  
**How to read:** the table is the scan view. Each `RM-xx` section below states **today’s prototype behaviour**, **what to build**, and **done-when** so UAT can tell demo from production.

This prototype already walks the spine **Monitor alarm → AI RCA (skill / RAG) → second-AI challenge → messenger → maker/checker → audit/spine**. Items here close the gaps that would fail a live desk: mocked Lark, seeded Monitor, heuristic AI, SQLite, shared demo passwords, and logged-only “executions”.

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

**Today.** [Demo Messenger](/admin/messenger) is an in-app Lark-style inbox. [Lark Integration](/admin/lark) stores channels (`oc_risk_control_desk`, …) with **mock** webhook URLs. `POST /api/lark` `test_notify` writes an audit row and returns `mock: true` — nothing is posted to Lark.

**Build.** Register a real Lark app. Map each CRMP channel `chat_id` to a live chat. Post **card messages** for ALERT / AI_REPORT / ESCALATION with buttons: Acknowledge, Escalate, Dismiss (false positive), Close (accept AI), Confirm action (maker), Checker approve. Each button calls a CRMP API with the operator’s SSO identity, then updates spine + audit.

**Done when.** A BREACH on a staging Monitor indicator produces a card in the Risk Control Desk chat; tapping Ack marks the CRMP alert `ACKNOWLEDGED` and write-backs the Monitor ticket (with RM-02); tapping a human-gated action opens maker/checker, not a silent execute. Demo Messenger can remain as a debug console.

---

## RM-02 — Real Monitor 2.0 webhook + ticket write-back

**Severity:** Critical · **Effort:** L · **People:** 2 backend · **Depends:** Monitor 2.0 API contract owner.

**Today.** [Monitor 2.0](/admin/monitor-2) is a seeded SQLite catalogue (`M2-MRG-014`, `M2-EQ-001`, …). Sync / Ack / ticket Progress are prototype POSTs against local rows. There is no inbound webhook and no call to `monitor.vantagemarkets.internal`.

**Build.** Inbound: Monitor posts warn/breach payloads (indicator id, observed, ticket id, severity) → CRMP upserts `monitor_indicators` / `monitor_alerts` / `monitor_tickets` and triggers AI RCA. Outbound: CRMP Ack, dismiss, close, and assignee changes **PATCH the Monitor ticket**. Replay/idempotency keys so a double-post does not duplicate AI analyses. Staging contract tests against a Monitor sandbox.

**Done when.** Raising a sandbox Monitor breach creates CRMP alert + analysis within the SLA; acknowledging in CRMP or Lark shows as acked on Monitor; CRMP never closes a BREACH/CRITICAL ticket by AI alone (Risk Owner policy).

---

## RM-03 — LLM primary RCA with tool-calling and eval harness

**Severity:** High · **Effort:** XL · **People:** 1 ML + 2 backend · **Depends:** prompt vault, spend caps, RM-02 live alarms for training labels.

**Today.** `lib/ai/analyze.ts` **matches skills heuristically** (`matchSkill`) or retrieves RAG. Skill steps are stored as `EXECUTED_MOCK` / `AWAITING_HUMAN`. Confidence can hit 1.0 on a skill hit. No live model, no tools, no offline eval set.

**Build.** Primary RCA model with **tools**: fetch indicator snapshot, related monitors, RAG `top_k`, market-intel hits, open tickets, macro calendar. Skill path only when the matcher **and** the model agree. Eval harness: labelled historic cases (copy concentration, LP reject, hot-wallet float, equity DD) scored for hypothesis quality, evidence citation, and unsafe-action rate. Prompt versions live in AI Admin with maker/checker.

**Done when.** On a held-out pack, skill-match precision ≥ agreed gate (start 80%), unsafe irreversible suggestions without a human gate = 0, and every RCA cites at least one evidence vault row. Challenger (RM-04) stays a **separate** process.

---

## RM-04 — Challenger model diversity

**Severity:** High · **Effort:** M · **People:** 1 ML · **Depends:** RM-03.

**Today.** [AI Analyses](/admin/ai-analyses) already run a second-AI panel for BREACH/CRITICAL (`ai.second_opinion_severity`). The challenger in `lib/ai/challenger.ts` is a **second heuristic** (co-signal checks, confidence cap). Same codebase, no second vendor, no isolated prompt cache.

**Build.** Independent model (different vendor **or** isolated endpoint + prompt). No shared tool-result cache with primary. Verdicts stay `AGREE` / `PARTIAL` / `DISAGREE`. `DISAGREE` or `PARTIAL` **blocks** auto skill execute and forces Human Intervention. Log both model ids and token cost on the analysis.

**Done when.** A staging fault-injection (primary claims skill certainty, feed is stale) yields challenger `DISAGREE` or `PARTIAL` 100% of injected cases; Risk Owner can filter analyses by verdict; spend appears on RM-14.

---

## RM-05 — SSO + SCIM user provisioning

**Severity:** Critical · **Effort:** M · **People:** 1 backend + Security · **Depends:** corporate IdP (Okta / Entra ID).

**Today.** Login is **demo personas** (`risk.owner@…` / `risk123`, plus named platform owner). Sessions are cookies. [Users](/admin/users) is a local directory. Shared passwords fail SoD and audit.

**Build.** OIDC/SAML SSO. SCIM (or JIT) to create/disable users from the IdP. Map IdP groups → CRMP roles (`RISK_OWNER`, `OPS_LEAD`, …). Retire demo passwords in staging/prod. Maker ≠ checker enforced with **IdP identity**, not just an in-app flag. Break-glass `SUPER_ADMIN` in the vault, dual-control to use.

**Done when.** A joiner in the Risk IdP group can sign in with no local password; a leaver is disabled within the SCIM SLA; UAT can no longer log in with `risk123` on staging.

---

## RM-06 — Postgres + multi-instance deploy

**Severity:** High · **Effort:** M · **People:** 1 SRE + 1 backend · **Depends:** managed Postgres, object storage for evidence blobs.

**Today.** Persistence is **one SQLite file** (`platform/data/vantage_risk.db`, `better-sqlite3`). Fine for the demo; no HA, weak concurrent writes, GitHub Pages has no writable DB.

**Build.** Postgres (WAL, backups, PITR). App becomes stateless (≥2 instances). Migrate tables as-is first (alerts, analyses, spine, audit, RAG FTS alternative). Health/readiness probes. Do not keep SQLite as a silent fallback in prod.

**Done when.** Kill one app instance during a detector run without lost spine events; restore drill from backup meets RPO/RTO signed by System Admin.

---

## RM-07 — Mobile nav drawer + touch-first messenger

**Severity:** Medium · **Effort:** S · **People:** 1 frontend · **Depends:** existing design tokens.

**Today.** Admin has a **drawer** and some `min-h-11` / safe-area padding, but dense tables, messenger threads, and dual-confirm sheets still fight thumbs. Risk on-call will open CRMP from a phone during US session.

**Build.** 375px pass on: login, home, alerts, messenger thread (ack/escalate/confirm), interventions approve/reject. 44px targets, no horizontal clip of primary actions, sticky composer, language toggle reachable. Messenger cards stack; evidence is a sheet not a tiny column.

**Done when.** UAT on an actual phone: open a BREACH thread, ack, open a human-gated action, complete maker confirm without pinch-zoom. Automated viewport shots in CI (pairs with RM-12).

---

## RM-08 — Finish admin i18n (EN / 繁中)

**Severity:** Medium · **Effort:** M · **People:** 1 frontend + PM · **Depends:** message catalog; PM review of risk terms.

**Today.** Shell, page titles, badges, and a large phrase map cover most chrome. Remaining English is mostly **IDs, emails, permission codes** (intentional) plus some long evidence/AI narrative strings and a few docs tables.

**Build.** Catalog every operator-visible string (including AI summary templates, UAT case chrome, roadmap/docs tables). Keep codes (`M2-MRG-014`, `SUPER_ADMIN`) in Latin. PM glossary: 违規 / 警告 / 危急 stay consistent. Screenshot gate: toggle 繁中 on skills, alerts, messenger, settings.

**Done when.** A 繁中 sweep of the 15 highest-traffic pages has no leftover English **chrome** (titles, buttons, empty states, errors). Seed operational names either overlay or are marked “code”.

---

## RM-09 — Intervention adapters (halt / leverage / block) with dry-run

**Severity:** Critical · **Effort:** L · **People:** 2 backend + Ops · **Depends:** Vantage trading/LP control bus; RM-05 identities; kill-switch.

**Today.** [Human Intervention](/admin/interventions) queues skill steps with `requires_human`. Approve logs spine/audit and marks executed — **no call** to LP disable, symbol halt, group leverage, copier cap, or withdrawal pause. Code stores `EXECUTED_MOCK`.

**Build.** Per-action adapters: `suggest_symbol_halt`, `suggest_lp_disable`, `group_leverage_tighten`, `pause_new_copies`, `pause_large_withdrawals`, `suggest_abook_increase`, … **Dry-run** returns the exact control payload and affected symbols/accounts. Live execute only after maker **and** checker (different SSO users). Global and per-adapter kill-switches in Platform Settings. Never grant these permissions to an AI service role ([AI Access Security](/admin/security/ai-access)).

**Done when.** Staging dry-run for “halt stale symbols” shows the symbol list Risk Owner expects; live execute on a **test book** is visible on the trading admin and fully audited; kill-switch stops further lives within one request.

---

## RM-10 — Evidence redaction and retention jobs

**Severity:** High · **Effort:** M · **People:** 1 backend + GRC · **Depends:** legal classification of evidence vault.

**Today.** Analyses store explanations, evidence snippets, and messenger excerpts in SQLite. They can include account counts, provider names, and wallet ratios. No TTL, no automated redaction, no legal hold flag.

**Build.** Classify fields (public indicator vs client identifier vs staff PII). Redact account logins, payment instruments, wallet addresses in default UI; full payload only for authorised roles with reason codes. Retention jobs: e.g. 90 days for WARN evidence, longer for BREACH/CRITICAL / legal hold. Export pack for regulators.

**Done when.** A GRC sample of 20 analysis records in staging has no raw client login or wallet address in the default view; a retention dry-run report lists what would be purged; audit records the purge.

---

## RM-11 — Shadow-mode dashboard (AI suggest only)

**Severity:** Medium · **Effort:** S · **People:** 1 frontend + 1 backend · **Depends:** spine metrics; kill-switch for auto-execute.

**Today.** `ai.skill_certainty_only` and maker/checker exist, but there is **no single view** that says “we are in shadow: AI suggested X, humans did Y, writes were off”. Easy to confuse demo mock executes with live containment.

**Build.** A Daily Performance / Risk Log mode (or banner) **Shadow**. Auto skill execute forced off. Dashboard: suggestions vs human decisions, time-to-ack, challenger disagreement rate, would-have-written actions (counted, not sent). One click to leave shadow requires Risk Owner + System Admin (dual control).

**Done when.** Staging default is shadow; a Risk Owner can show leadership a week of suggest-vs-act without any RM-09 adapter firing; leaving shadow is an audited change request.

---

## RM-12 — Automated UAT smoke in CI

**Severity:** Medium · **Effort:** S · **People:** 1 QA + 1 backend · **Depends:** seed DB in CI.

**Today.** [UAT Checklist](/admin/docs/uat) is a long **manual** pack (UAT-01… ) for the Risk Owner. No pipeline replays Critical cases on each PR.

**Build.** Headless smoke on Critical/High cases: login personas, home stats, detectors run, alert ack, AI analysis exists, messenger thread has ALERT+AI_REPORT, intervention queue, 繁中 title on skills, roadmap renders. Fail the PR on assertion miss. Keep the human UAT pack for judgement calls (RCA quality).

**Done when.** A deliberate break (e.g. skills page title) fails CI; Critical list runs in the agreed wall-clock budget on the CI runner.

---

## RM-13 — Multi-brand / entity tenancy

**Severity:** Medium · **Effort:** XL · **People:** architecture + 2 backend · **Depends:** org/entity model; later phase.

**Today.** One seeded CRMP: mixed CFD + crypto, entity notices (ASIC/FCA/VFSC) are **reference sources**, not isolated books. Roles are global.

**Build.** Tenant = legal entity (or brand). Isolated alerts, RAG, skill packs (leverage caps differ by entity), Lark routing, and audit export. Cross-entity exec view is read-only aggregation. Do not start until RM-05/RM-06 exist.

**Done when.** A VFSC user cannot ack an FCA-entity ticket; exec role can see both in a labelled aggregate; UAT has two seeds.

---

## RM-14 — Cost / latency SLO alerts on the AI path

**Severity:** Medium · **Effort:** S · **People:** SRE · **Depends:** observability stack; pairs with RM-03.

**Today.** Spine timestamps exist; no token cost, no p95 RCA latency, no budget alarm. A runaway prompt loop would be invisible.

**Build.** Metrics: RCA latency p50/p95, challenger latency, tokens in/out per model, $ per analysis, error rate. SLOs e.g. p95 RCA under 15s (ex. human gate), daily AI $ cap. Alert to Trading Infra + AI Detection Lab. Kill-switch to degrade to skill-only if the vendor is down.

**Done when.** A staging load of 50 concurrent alarms plots on the dashboard; crossing the $ cap pages on-call and stops new non-CRITICAL calls.

---

## RM-15 — Richer market-intel source scoring

**Severity:** Medium · **Effort:** M · **People:** 1 data scientist + 1 backend · **Depends:** licensed news / official / social contracts.

**Today.** [Market Intelligence](/admin/market-intel) runs a **5-minute heuristic scanner** (`EVENT_TEMPLATES`, seeded sources). Findings can be synthetic. Indicator `M2-MKT-INTEL` counts hits. No source trust score, no de-duplication across wires, no licence audit.

**Build.** Ingest contracted wires + official calendars + selected social. Score by source type, corroboration count, asset hit, geography. Dedupe by fingerprint across 5-minute buckets. Only WARN+ **corroborated** hits increment `M2-MKT-INTEL`. Push format stays (i)–(vi) into `oc_market_intelligence`.

**Done when.** A known CPI print is ingested from ≥2 licensed sources, deduped to one finding, scored High, and does not double-count the indicator; a single unverified social post does not breach.

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
