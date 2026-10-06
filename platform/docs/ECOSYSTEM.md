# Vantage Ecosystem Adoption Evaluation

**Document ID:** CRMP-ECO-001 · **Version:** 1.8 · **Status:** Executive planning pack · **Scope:** CFD + Crypto CRMP prototype → production

## 1. Executive view

The CRMP demo already proves an end-to-end spine:

**Monitor 2.0 alarm → Realtime Alert & Tracker → AI RCA (skill/RAG) → independent second-AI challenge → messenger actions → maker/checker intervention → audit (CRMP / Vantage Markets Admin plane split + Roll back) + home spine stage counts.**

Programme gaps and tentative ETAs live in [Open Issues](/admin/docs/open-issues) and [Progress Tracker](/admin/docs/progress) (Monitor still adding indicators; CRMP initial design; tech/resource plan open). Platform owner: demo platform owner / `haixiang.yan@hytechc.com`.

Fully implementing this into the **existing Vantage Markets ecosystem** is not a rewrite of trading platforms. It is a **control-plane product** that must plug into identity, Monitor 2.0, Lark, LP/bridge controls, and admin dual-control — with shadow mode first and write paths last.

| Roll-up | Indicative |
|---|---|
| One-time build (Phases A–C) | **~$730k – $1.3M USD** |
| Ongoing model/ops (Phase D / year) | **~$150k – $300k USD** |
| Core team at steady state | **~7–11 FTE** (plus part-time Risk Owner / GRC / Ops) |
| Delivery shape | **4 phases** — foundations → read path → supervised write → model ops |

*Planning envelopes only — not a vendor quote. Finance must re-estimate against SOWs and in-house capacity.*

---

## 2. Foundations required

| # | Foundation | Why it is required | Current prototype | Target maturity |
|---|---|---|---|---|
| F1 | **SSO / IdP + SCIM** (Okta / Azure AD) | Join corporate directories; kill shared demo passwords; enable SoD | Local email/password users | Production |
| F2 | **Monitor 2.0 bidirectional API** | Live alarm ingest into Realtime Alert & Tracker + ticket ack/close write-back | Seeded SQLite Monitor registry + open queue on `/admin/alerts`; local simulate/sync only (no live Monitor HTTP) | Production |
| F3 | **LP / bridge / trading control bus** | Real halt, leverage cut, widen, pause-copy, block account | Deep-links + mock admin refs | Production + dual-control |
| F4 | **Lark (or Teams) interactive app** | Replace demo messenger; card actions → CRMP APIs | In-app Demo Messenger + outbox mock | Production |
| F5 | **Secrets vault + env isolation** | Webhooks, model keys, DB, LP credentials | Env/local files | Production |
| F6 | **Managed DB + HA deploy** | Multi-instance, backups, DR | SQLite single file | Postgres + HA |
| F7 | **Observability** (metrics/traces/logs) | Spine SLOs, AI latency, false-alarm rate, cost | Console + home spine stage counts | Production APM |
| F8 | **Data residency & retention** | Evidence vault may hold client identifiers | No formal retention | Legal policy + jobs |
| F9 | **IAM maker ≠ checker** | AI Admin + irreversible interventions | App-level maker/checker | IAM + app |
| F10 | **AI access blocklist enforcement** | Human-only pages/functions/fields stay human-only | Documented blocklist UI | Runtime enforcement on AI principals |
| F11 | **Market-intel feed contracts** | 5-min scan needs licensed/news APIs | Heuristic scanner | Vendor feeds + scoring |
| F12 | **Kill-switches** | Disable auto-skills, intel push, write adapters instantly | Settings flags (partial) | Global + per-adapter |

### Integration map (target)

1. Monitor 2.0 → CRMP Realtime Alert & Tracker (`/admin/alerts`) → dual-AI pack  
2. CRMP → Lark cards (notify + inline actions)  
3. Human confirm → Vantage admin / control bus (maker) → Checker approve  
4. Status write-back → Monitor ticket + Audit (CRMP / Vantage Markets Admin) + home spine stage counts  

---

## 3. Personnel required

| Role | Pilot FTE | Scale FTE | Primary ownership |
|---|---|---|---|
| **Product Manager** (Risk Platforms) | 1.0 | 1.0 | Scope, prioritisation, stakeholder alignment, UAT exit |
| **Risk Owner** (business) | 0.3 | 0.5 | Policy thresholds, accept/reject AI, escalation authority |
| **Engineering Lead / Architect** | 1.0 | 1.0 | Ecosystem adapters, tenancy, DR design |
| **Full-stack engineers** | 2.0 | 3–4 | Admin UI, messenger, APIs, Monitor/Lark clients |
| **Backend / integration engineer** | 1.0 | 1–2 | Control bus, dual-control workflows |
| **Data / ML engineer** | 1.0 | 1–2 | RAG, primary LLM, **independent challenger**, eval harness |
| **SRE / Platform** | 0.5 | 1.0 | Deploy, secrets, observability, HA |
| **Security / GRC** | 0.3 | 0.5 | Blocklist, access reviews, audit evidence packs |
| **QA / UAT facilitator** | 0.5 | 1.0 | Execute Risk Owner UAT pack; regression |
| **Ops liaison** | 0.3 | 0.5 | Runbooks for halt / block / widen |
| **Compliance / Legal** (part-time) | 0.1 | 0.2 | Retention, client data in evidence, AI disclosures |

**Pilot core (approx):** PM + Eng lead + 2 full-stack + 1 ML + 0.5 SRE + 0.5 QA + part-time Risk Owner ≈ **6–7 FTE equivalent**.

---

## 4. Budget (indicative USD)

| Phase | Scope | Band | Notes |
|---|---|---|---|
| **A — Harden prototype** | SSO spike or staging auth, hosting, audit export, UAT facilitation, basic observability | **$80k – $150k** | Make demo deployable & reviewable |
| **B — Ecosystem connect (read path)** | Monitor API → Realtime Alert stream, Lark interactive cards, read-only LP/inventory feeds, Postgres migration | **$250k – $450k** | Notify-only; no auto-trade |
| **C — Supervised write path** | Dual-control adapters (block/halt/leverage/widen/pause-copy), DR, kill-switches | **$400k – $700k** | Highest risk; gated go-live |
| **D — Model ops (annual)** | Eval harness, challenger diversity, drift/cost monitors, feed licences | **$150k – $300k / yr** | Run-rate after B/C |

| Total | Band |
|---|---|
| **Build A+B+C** | **$730k – $1.3M** |
| **Year-1 all-in (build mid + D mid)** | **≈ $1.0M – $1.5M** |

Exclusions: major LP vendor licence changes, full multi-brand tenancy programme, replacing Monitor 2.0 itself.

---

## 5. Timeline (phased — effort shape, not calendar promises)

Cloud agents and vendors should plan by **dependency phase**, not by fixed week counts:

### Phase A — Foundation lock
- RACI (Risk / Ops / AI / System) signed  
- Data classification for evidence vault  
- Environments (dev/stage/prod) + secrets  
- UAT pack baseline with Risk Owner  

### Phase B — Read-path production
- Live Monitor alarms into **Realtime Alert & Tracker**  
- Dual-AI RCA (primary + **independent challenger**) on BREACH/CRITICAL  
- Lark notify + “open in admin” (actions may still deep-link)  
- Shadow dashboard: AI suggests, humans act outside write bus  

### Phase C — Supervised write path
- Maker confirm in messenger/admin → control bus  
- Checker approval for irreversible controls  
- Ticket write-back + full audit (CRMP / Vantage Markets Admin planes) / home spine  
- Kill-switch drills  

### Phase D — Optimisation
- Challenger model diversity (separate vendor/prompt)  
- Market-intel precision / cost SLOs  
- Multi-entity readiness if required  

**Suggested sequencing rule:** do not start Phase C write adapters until Phase B false-alarm and challenger-disagreement workflows are accepted by Risk Owner.

---

## 6. Shortcomings of the current prototype

| Area | Shortcoming | Production impact |
|---|---|---|
| AI | Heuristic skill/RAG/challenger — not production LLM + tool-calling with eval gates | Wrong RCA confidence if scaled as-is |
| Data | SQLite single-node file | No HA / weak concurrent write |
| Messenger | In-app demo; Lark delivery mocked | Operators won’t live in CRMP-only chat long-term |
| Controls | Admin refs / deep-links, not real trading bus | Cannot rely on for true risk containment |
| Monitor | Seeded registry + local sync; Detectors merged into Monitor 2.0 UI; open queue is Realtime Alert & Tracker | Live desk would diverge without bidirectional API |
| Identity | Demo passwords | Failed SoD / audit |
| Tenancy | Limited multi-brand / entity isolation | Blocks group-wide rollout |
| Intel | Synthetic/heuristic market scan | Needs licensed sources + scoring |
| Enforcement | AI blocklist is largely documentary in UI | Must bind to AI service principals |
| Mobile | Responsive card lists on Monitor 2.0 / Escalation / Data Sources / Risk Log / Audit; confirm sheets still desktop-first | OK for web responsive ops, not native-app grade |

---

## 7. Precautions

1. **Never** grant AI service principals rights on blocklisted pages/functions/fields (`/admin/security/ai-access`).  
2. Irreversible controls stay **human-gated**; second-AI `PARTIAL` / `DISAGREE` ⇒ mandatory human review.  
3. Maker/checker identities must be separated in **IAM**, not only in application logic.  
4. Run **shadow mode** (notify-only) before enabling any write adapter.  
5. Define and test **kill-switches** for auto skill execution, market-intel push, and each write adapter.  
6. Legal review before persisting client identifiers in evidence excerpts; set retention + redaction jobs.  
7. Cap AI spend and latency with SLOs; challenger must remain an **independent** decision path (no shared prompt cache with primary).  
8. Change-control: AI Admin setting changes always require a distinct checker.  
9. Do not auto-close Monitor tickets from AI alone on BREACH/CRITICAL without Risk Owner policy.  
10. Rehearse escalation path (Primary → Secondary → Risk Owner → Exec) in UAT before go-live.

---

## 8. Decision checklist for leadership

- [ ] Approve Phase A budget band and name PM + Eng lead  
- [ ] Confirm Monitor 2.0 API contract owner  
- [ ] Confirm Lark vs Teams as corporate messenger  
- [ ] Appoint Risk Owner for UAT exit criteria  
- [ ] Agree shadow-mode duration before Phase C  
- [ ] Security sign-off on AI blocklist + SoD model  
- [ ] Legal sign-off on evidence retention  

**Demo links:** this page · [Open Issues](/admin/docs/open-issues) · [Progress Tracker](/admin/docs/progress) · [URL Catalog](/admin/docs/urls) · [UAT Checklist](/admin/docs/uat) · [Improvement Roadmap](/admin/docs/roadmap) · [Demo Messenger](/admin/messenger)

---

## 9. Document control

| Ver | Date | Notes |
|---|---|---|
| 1.7 | 2026-10-05 | Audit CRMP / Vantage Markets Admin + Roll back; home spine; Open Issues / Progress links |
| 1.8 | 2026-10-05 | Nav truth: Realtime Alert & Tracker; Detectors→Monitor 2.0; F2/Phase B/Monitor shortcoming; mobile card lists; demo links |

**Owner:** demo platform owner (`haixiang.yan@hytechc.com`)
