# Platform Improvement Roadmap

**Document ID:** CRMP-RM-001  
**Version:** 1.1  
**Status:** Living backlog (post-prototype)  
**Basis:** Current CRMP Admin Control Plane (detectors → dual-AI RCA → Demo Messenger → spine; AI Admin; market intel; bilingual docs; responsive shell)  
**Companions:** [PRD](/admin/docs/prd) · [TSD](/admin/docs/tsd) · [Ecosystem](/admin/docs/ecosystem) · [UAT](/admin/docs/uat)

Effort is **relative engineering size**, not a calendar schedule. Calendar duration depends on staffing and external approvals.

| Effort | Meaning |
|---|---|
| **S** | Small vertical slice — one engineer can land without new vendors |
| **M** | Multi-module change — typically 1–2 engineers, limited external deps |
| **L** | Cross-team module — integration contracts, dual-control, staging |
| **XL** | Programme-sized — architecture, vendors, org change |

**Severity:** Critical (blocks production trust) · High (material risk/quality) · Medium (scale/UX) · Low (nice-to-have)

**Status vs today:** `Done` · `Partial` · `Open`

---

## Priority backlog

| ID | What it is | Why (gap vs today) | Effort | Human resources | Dependencies | Severity | Status | Notes |
|---|---|---|---|---|---|---|---|---|
| RM-01 | **Production Lark interactive cards** — card buttons call CRMP APIs (evidence, escalate, dismiss, close, recommend) | Operators will not live in in-app Demo Messenger long-term; Lark delivery is mocked | L | 2 FE + 1 BE + Lark app owner | Lark app approval; channel registry; audit contract | Critical | Open | Keep Demo Messenger as fallback / staging |
| RM-02 | **Monitor 2.0 webhook ingest + ticket write-back** | Alarms are simulated/seeded; dismiss/close do not close real Monitor tickets | L | 2 BE + Monitor API owner | Monitor API contract; idempotency keys | Critical | Open | Close the ops loop |
| RM-03 | **Production LLM primary RCA** with tool-calling + offline eval harness | Skill/RAG engines are heuristic stand-ins | XL | 1 ML eng + 2 BE + Risk Owner (eval) | Prompt vault; spend caps; gold set of cases | High | Open | Gate promote-to-live on eval scores |
| RM-04 | **Challenger model diversity** — separate vendor and/or prompt stack from primary | `crmp-challenger-v0` is independent heuristically but not vendor-diverse | M | 1 ML eng | RM-03; no shared prompt cache | High | Open | Required to reduce correlated failure |
| RM-05 | **SSO + SCIM** user/role provisioning | Demo email/password weakens SoD and audit | M | 1 BE + Security | Corporate IdP; role mapping | Critical | Open | Retire shared demo passwords |
| RM-06 | **Postgres + multi-instance deploy** (HA-ready) | SQLite single-node file; weak concurrent write | M | 1 SRE + 1 BE | Infra; migration from SQLite schema | High | Open | Prerequisite for real multi-user ops |
| RM-07 | **Native-grade mobile ops polish** — PWA / denser touch targets / offline read of open threads | Responsive drawer + messenger master-detail already shipped | S | 1 FE | Design tokens; RM-01 for Lark mobile | Medium | Partial | Web responsive = Partial Done |
| RM-08 | **Full admin UI i18n** (all boards EN / zh-Hant) | Docs + nav toggle exist; many board strings still English-first | M | 1 FE + PM (catalog) | Message catalog; screenshot UAT | Medium | Partial | Docs already bilingual |
| RM-09 | **Trading control bus adapters** (halt / leverage / widen / pause-copy / block) with **dry-run + kill-switch** | Controls produce mock admin refs / deep-links only | L | 2 BE + Ops + Risk Owner | Control bus API; dual-control policy | Critical | Open | Shadow mode first (RM-11) |
| RM-10 | **Evidence redaction & retention jobs** | Excerpts may hold PII; no automated retention | M | 1 BE + GRC/Legal | Retention policy; crypto at rest | High | Open | Legal sign-off before prod identifiers |
| RM-11 | **Shadow-mode dashboard** — AI suggest / notify only; no write side-effects | Needed before any write adapter go-live | S | 1 FE + 1 BE | Spine metrics; feature flags | Medium | Open | Exit criterion for Phase C |
| RM-12 | **Automated UAT smoke in CI** from seed DB | Interactive UAT board exists; not gated in CI | S | 1 QA + 1 BE | Seed fixtures; headless login | Medium | Open | Gate PRs on critical UAT-01…N |
| RM-13 | **Multi-brand / entity tenancy** | Single demo tenancy blocks group rollout | XL | Architect + 2 BE | Org model; data isolation tests | Medium | Open | After HA + SSO |
| RM-14 | **AI path cost / latency SLO alerts** | No production observability on RCA/challenger path | S | 1 SRE | APM; RM-03 spend meters | Medium | Open | Pair with model rollout |
| RM-15 | **Market-intel licensed sources + scoring** | Scanner is synthetic/heuristic | M | 1 DS + 1 BE | Vendor feeds; rate limits | Medium | Open | Cut noise before desk trust |
| RM-16 | **Bind AI access blocklist to service principals** | Blocklist is largely documentary in UI | M | 1 BE + Security | IAM roles; AI service accounts | Critical | Open | Enforce at authZ layer, not only UI |
| RM-17 | **Audit pack export** (JSON/PDF) for compliance reviews | Spine/audit UI exists; no export pack | S | 1 BE + 1 FE | Retention policy (RM-10) | High | Open | Needed for Risk Owner sign-off |
| RM-18 | **Skill authoring studio** — guided scenario_json editor + dry-run against historical alerts | Skills board exists; authoring is power-user JSON-heavy | M | 1 FE + 1 BE + AI Eng | Skill schema; sandbox DB | Medium | Open | Speeds playbook coverage |
| RM-19 | **Teams (or second messenger) adapter** | Corporate standard may not be Lark-only | L | 1 BE + 1 FE | RM-01 patterns; IT decision | Medium | Open | Abstract transport behind messenger domain |
| RM-20 | **False-alarm learning loop** — dismiss reasons → RAG / skill tuning queue | Dismiss closes thread; limited structured feedback into training | M | 1 ML + 1 BE | AI Admin training queue; UAT labels | High | Open | Improves precision over time |

---

## Suggested sequencing (waves)

### Wave A — Foundations (trust & deployability)
RM-05 SSO · RM-06 Postgres/HA · RM-16 blocklist enforcement · RM-02 Monitor write-back · RM-17 audit export

### Wave B — Operator channel & safety rails
RM-01 Lark cards · RM-11 shadow mode · RM-07 mobile polish · RM-12 CI UAT

### Wave C — Write path (only after Risk Owner accepts Wave B)
RM-09 control adapters + kill-switches · dry-run rehearsal · policy for BREACH/CRITICAL auto-close (default: **off**)

### Wave D — Model quality
RM-03 LLM RCA + eval · RM-04 diversified challenger · RM-14 SLOs · RM-20 dismiss→learn loop · RM-18 skill studio

### Wave E — Harden & scale
RM-08 full UI i18n · RM-10 redaction/retention · RM-15 market-intel sources · RM-13 multi-brand · RM-19 second messenger

---

## Already delivered in current prototype (do not re-fund)

| Capability | Where |
|---|---|
| Dual-AI challenger ≥ severity threshold | `/admin/ai-analyses`, `challenger.ts` |
| Demo Messenger triage actions | `/admin/messenger` |
| AI Admin maker/checker + blocklist UI | `/admin/ai-admin`, `/admin/security` |
| Market intel 5-min scan + outbox | `/admin/market-intel` |
| Bilingual docs (PRD/TSD/UG/UAT/Ecosystem/Roadmap) | `/admin/docs/*` |
| Responsive admin shell + messenger master-detail | `AdminShell`, `DemoMessenger` |
| Interactive UAT checklist | `/admin/docs/uat` |
| Spine + audit trail for core mutations | `/admin/spine`, `/admin/audit` |

---

## Document control

| Ver | Notes |
|---|---|
| 1.0 | Initial 15-item backlog |
| 1.1 | Refreshed against shipped prototype; added RM-16…20; status column; waves; removed stale “build mobile drawer” as greenfield |

**對應文件：** [繁體中文版](./ROADMAP.zh-Hant.md) · `/admin/docs/roadmap`
