# CRMP Open Issues

**Document ID:** CRMP-OI-001 · **Interactive board:** [/admin/docs/open-issues](/admin/docs/open-issues) · **Progress twin:** [/admin/docs/progress](/admin/docs/progress)

Tentative open-issue checklist for the CRMP admin / control-plane programme. Assumptions are explicit:

1. **Monitor 2.0** is still adding indicators — CRMP syncs; it does not own the registry.  
2. **CRMP** is in **initial design** for production scope (prototype desk already ships).  
3. **Tech details** and **resource planning** remain open (see Ecosystem Eval bands).

Statuses: **Planned · Started · WIP · Delayed · UAT · Go live · BAU**. Responsible BU and dependencies are on every row. ETAs are tentative through **end-2027**.

---

## Summary

| ID | Pri | Area | BU | Status | Tentative ETA | Title |
|---|---|---|---|---|---|---|
| OI-01 | P0 | Monitor | Monitor | WIP | 2027-Q2 | Monitor 2.0 indicator expansion |
| OI-02 | P0 | Product | Product | Started | 2027-Q1 | CRMP control-plane — initial design freeze |
| OI-03 | P0 | System | System | Planned | 2027-Q1 | Tech architecture & resource plan |
| OI-04 | P1 | AI | AI | WIP | 2027-Q3 | Production LLM RCA + independent challenger |
| OI-05 | P1 | AI | AI | Started | 2027-Q1 | Knowledge tree + RAG corpus governance |
| OI-06 | P0 | System | System | Planned | 2027-Q2 | SSO / IdP + SCIM |
| OI-07 | P0 | Ops | Ops | Planned | 2027-Q4 | Real control adapters |
| OI-08 | P1 | Ops | Ops | Planned | 2027-Q2 | Production Lark interactive cards |
| OI-09 | P1 | RO | Risk Owner | Started | 2026-Q4 / 2027-Q1 | Risk Owner UAT exit + policy thresholds |
| OI-10 | P2 | Pricing | Pricing | Planned | 2027-Q3 | LP / pricing feed contracts |
| OI-11 | P2 | Platform | System | WIP | 2026-Q4 | Admin UX polish — mobile + docs parity |
| OI-12 | P1 | GRC | GRC | Planned | 2027-Q4 | Evidence retention, redaction & audit export |
| OI-13 | P1 | Monitor | Monitor | Delayed | 2027-Q3 | Bidirectional Monitor ticket write-back |
| OI-14 | P2 | AI | AI | UAT | 2026-10 / 11 | Prototype AI desk features — UAT window |
| OI-15 | P3 | Product | All | BAU | Ongoing → 2027-12 | Docs & URL catalog keep pace with admin |

Source of truth for the interactive checklist: `platform/src/lib/docs/open-issues.ts`.

---

## Detail checklist

### OI-01 — Monitor 2.0 indicator expansion
- [ ] Keep `M2-*` tooltip / deep-link contract stable as new indicators arrive  
- [ ] Sync API tolerates additive registry changes without CRMP fork  
- **BU:** Monitor · **Depends:** Monitor roadmap; naming; sync contract · **ETA:** 2027-Q2 (ongoing)

### OI-02 — CRMP control-plane initial design freeze
- [ ] Workshops: spine stages, BU RACI, dual-control write path, BAU vs pilot surfaces  
- [ ] Design freeze signed by Risk Owner + Platform Owner  
- **BU:** Product · **Depends:** Ecosystem phases A–B · **ETA:** 2027-Q1 (tentative)

### OI-03 — Tech architecture & resource plan
- [ ] Postgres/HA, IdP, secrets, APM target architecture  
- [ ] FTE / budget re-estimate vs Ecosystem bands and SOWs  
- **BU:** System · **Depends:** OI-02 · **ETA:** 2027-Q1 planning pack

### OI-04 — Production LLM RCA + independent challenger
- [ ] Vendor-separated primary LLM + challenger; eval harness; cost/latency SLOs  
- [ ] Preserve RAG AI-write blocklist (`propose_rag` only)  
- **BU:** AI · **Depends:** RM-03/04; prompt vault · **ETA:** 2027-Q3 UAT

### OI-05 — Knowledge tree + RAG corpus governance
- [ ] Corpus ownership SLAs; retire cadence; skill↔doc binds at scale  
- [ ] Maker-checker throughput for `propose_rag`  
- **BU:** AI · **Depends:** rag.manage staffing · **ETA:** 2027-Q1 BAU hygiene

### OI-06 — SSO / IdP + SCIM
- [ ] Corporate login; kill shared demo passwords  
- [ ] Preserve maker ≠ checker for AI Admin and interventions (actioner email already on samples)  
- **BU:** System · **Depends:** Okta/Entra; OI-03 · **ETA:** 2027-Q2 go live

### OI-07 — Real control adapters
- [ ] Dry-run then checker against trading/LP bus; global kill-switch  
- [ ] Gate on shadow false-alarm acceptance; use ESC-DEFAULT + skill binds  
- **BU:** Ops · **Depends:** control bus; OI-04 · **ETA:** 2027-Q4 (gated)

### OI-08 — Production Lark interactive cards
- [ ] Ack / Escalate / Approve from Lark cards → CRMP APIs  
- [ ] Keep Demo Messenger for UAT / fallback  
- **BU:** Ops · **Depends:** Lark app approval · **ETA:** 2027-Q2 UAT

### OI-09 — Risk Owner UAT exit + policy thresholds
- [ ] Execute interactive UAT pack; formal sign-off cadence  
- [ ] Accept second-AI severity policy + ESC-DEFAULT catch-all  
- **BU:** Risk Owner · **Depends:** UAT-01…45; BU and Teams RACI · **ETA:** 2026-Q4 / 2027-Q1

### OI-10 — LP / pricing feed contracts
- [ ] Licensed news / LP pricing for Market Intel + margin scenarios  
- **BU:** Pricing · **Depends:** vendor RFPs; Data Sources · **ETA:** 2027-Q3

### OI-11 — Admin UX polish
- [x] Nav drawer, messenger list→thread, mobile card lists (Monitor 2.0 / Escalation / Data Sources / Risk Log / Audit / Users / Open Issues)  
- [x] Realtime Alert & Tracker filter toolbar 2-col on phone  
- [ ] Confirm-sheet 375px pass + remaining wide boards (Lark / Market Intel / AI Admin)  
- [ ] Docs parity BAU with each nav ship  
- **BU:** System · **Depends:** docs owner; FE · **ETA:** 2026-Q4 BAU

### OI-12 — Evidence retention & audit export
- [ ] Retention jobs, redaction, auditor export beyond Audit Log (CRMP / Vantage Markets Admin plane split + Roll back) + home spine counts  
- [x] Prototype audit plane split: CRMP logs vs Vantage Markets Admin logs; `POST /api/audit/rollback` when before-state snapshot exists  
- **BU:** GRC · **Depends:** Legal; OI-06; Postgres · **ETA:** 2027-Q4

### OI-13 — Bidirectional Monitor ticket write-back *(delayed)*
- [ ] Ack/dismiss/close on Realtime Alert & Tracker PATCHes upstream Monitor tickets (today: local SQLite only; `sync_monitor2` audits `pulled_alerts: 5` — no live HTTP)  
- **BU:** Monitor · **Depends:** Monitor write API; OI-01 · **ETA:** 2027-Q3 (slipped)

### OI-14 — Prototype AI desk features — UAT window
- [x] Realtime Alert & Tracker (AI Analyses list → `/admin/alerts`) · Detectors merged into Monitor 2.0  
- [x] First/second-line AI Admin · grouped pipeline + rank note · intervention actioner email  
- [x] RAG `propose_rag` human-gate · ESC-DEFAULT + dimension coefficients + skill binds · knowledge-tree RAG leaves · MonitorCode tooltips  
- [x] Editable Roles (`/admin/roles` · `/api/roles`) · audit plane split + Roll back  
- [ ] Formal UAT sign-off (OI-09)  
- **BU:** AI · **ETA:** 2026-10 / 11 UAT

### OI-15 — Docs & URL catalog BAU
- [ ] Keep User Guide / PRD / TSD / UAT / Roadmap / Ecosystem / Open Issues / Progress / URLs aligned with nav (Realtime Alert & Tracker naming; Detectors → Monitor 2.0; AI Analyses list redirect; no Spine Log tab; BU and Teams; Risk Domains P0–P3; Risk Log 90d; audit CRMP / Vantage Markets Admin tabs + Roll back)  
- **BU:** All · **ETA:** Ongoing → 2027-12

---

## Document control

| Ver | Date | Notes |
|---|---|---|
| 1.0 | 2026-10-05 | Initial open-issues pack wired into admin docs |
| 1.1 | 2026-10-05 | Audit plane split + rollback; editable Roles; escalation dimensions noted |
| 1.2 | 2026-10-05 | Nav truth: Realtime Alert & Tracker; Detectors→Monitor 2.0; OI-11 mobile cards; OI-13 local-only ack; Ecosystem v1.8 aligned |

**Owner:** demo platform owner (`haixiang.yan@hytechc.com`) · **中文:** [OPEN_ISSUES.zh-Hant.md](./OPEN_ISSUES.zh-Hant.md)
