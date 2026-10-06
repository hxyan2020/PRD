# Vantage CRMP Plus (Prototype)

Upgraded **Centralised Risk Management Platform** — original CRMP Admin (Monitor → AI RCA → messenger → human gates → spine) plus **24/7 CS / TR intake** on one desk.

This phase delivers:
- Internal SQLite database (roles, teams, departments, users, data sources, Monitor 2.0 mirrors, Lark channels, escalation routes, audit log, settings)
- Admin UI with RBAC
- Data sources repository (internal + external)
- Team / role division across Risk Control, Operations, AI, System, Customer Service, Trading
- Monitor 2.0 integration hub (indicators, alerts, tickets)
- Lark messenger integration (channels, test notify, severity routing)
- Escalation routes with SLA + auto-actions + human gate
- CS / TR Desk: C1 live chat, web form, official email via public `/cs` and `POST /api/cs/intake`; AI follow-up until the client replies

## Quick start

```bash
cd platform
npm install
npm run dev
```

Open http://localhost:3000/admin

Permanent public URL for **this upgraded platform** (GitHub Pages): [https://hxyan2020.github.io/PRD/crmp-plus/admin/](https://hxyan2020.github.io/PRD/crmp-plus/admin/)

Lark-style messenger demo: [https://hxyan2020.github.io/PRD/crmp-plus/admin/messenger/](https://hxyan2020.github.io/PRD/crmp-plus/admin/messenger/)

CS / TR desk: [https://hxyan2020.github.io/PRD/crmp-plus/admin/cs-desk/](https://hxyan2020.github.io/PRD/crmp-plus/admin/cs-desk/)

CS client portal: [https://hxyan2020.github.io/PRD/crmp-plus/cs/](https://hxyan2020.github.io/PRD/crmp-plus/cs/)

**Original CRMP Admin (frozen, left intact):** [https://hxyan2020.github.io/PRD/crmp-admin/admin/](https://hxyan2020.github.io/PRD/crmp-admin/admin/)

The Pages snapshot is a static export of the admin UI (browseable without login). Local `npm run dev` still serves the live SQLite APIs at http://localhost:3000/admin. Future requirements apply only to CRMP Plus.

### Demo logins

| Persona | Email | Password |
|---|---|---|
| Risk Owner | risk.owner@vantagemarkets.com | risk123 |
| Ops Lead | ops.lead@vantagemarkets.com | ops123 |
| AI Engineer | ai.engineer@vantagemarkets.com | ai123 |
| System Admin | system.admin@vantagemarkets.com | sys123 |
| Super Admin | admin@vantagemarkets.com | admin123 |
| Viewer | viewer@vantagemarkets.com | view123 |

## Admin pages

- `/admin` — Dashboard
- `/admin/departments` — Department RACI
- `/admin/teams` — On-call teams + Lark chats
- `/admin/roles` — Permissions
- `/admin/users` — User management
- `/admin/risk-domains` — Domains under management
- `/admin/data-sources` — External/internal source registry
- `/admin/monitor-2` — Monitor 2.0 hub
- `/admin/lark` — Lark channels
- `/admin/escalation` — Escalation routes
- `/admin/alerts` — Live alert queue
- `/admin/audit` — Audit trail
- `/admin/settings` — Platform settings

## Data

SQLite file: `platform/data/vantage_risk.db` (created on first boot).

## AI analysis + RAG (this phase)

When Monitor 2.0 indicators alarm:
1. **Skill match (certainty)** — if indicator pattern + conditions match a playbook, AI auto-executes skill steps (mock actions + human gates).
2. **Otherwise** — retrieve from **RAG knowledge base** + external macro events, generate plausible explanations with evidence, mark `NEEDS_HUMAN`.

### New admin pages
- `/admin/ai-analyses` — analyses list, simulate alarm, backfill
- `/admin/ai-analyses/[id]` — explanations, evidence vault, skill run log
- `/admin/ai-admin` — AI control plane: parameters, training, accuracy/history, propose skills/RAG, **maker/checker** dual control
- `/admin/rag` — view / manage / retrieve Vantage business corpus
- `/admin/skills` — risk scenarios: indicator + thresholds (why), fault areas, escalation, BU corrections, past cases; linked multi-indicator timeline chains
- `/admin/market-intel` — **Market Intelligence**: 5-min scan of news/social/official sources affecting LP prices (forex, index, commodity, futures, crypto); pushes to Lark `oc_market_intelligence`; indicator `M2-MKT-INTEL` + skill `SKILL-MARKET-INTEL`
- `/admin/docs/tsd` — Technical Specification Design (EN + 繁中), including full **AI Admin management page** specs (`docs/TSD.md`)
- `/admin/security/ai-access` — **AI access blocklist**: pages / functions / fields / data stores blocked from AI; human-authorised only

**Maker / Checker:** AI Engineer proposes (`ai.propose` / `skills.manage` / `rag.manage`). Risk Owner checks (`ai.approve`). Proposer cannot approve their own change.

Auto-trigger also runs on **Monitor 2.0 Sync**.

## Semi-automated spine (finalised)

`Detectors → Alarm → AI RCA (skills / RAG evidence) → Human intervention → Spine logging → Daily performance dashboard`

| Stage | Page |
|---|---|
| Detectors | `/admin/detectors` |
| AI RCA | `/admin/ai-analyses` |
| Human gates | `/admin/interventions` |
| Spine log | `/admin/spine` |
| Daily dashboard (CFD + crypto) | `/admin/dashboard` |
| Risk log analytics | `/admin/risk-log` |

Run detectors to sample indicators, raise alarms, and auto-trigger AI. Approve pending actions in Human Intervention. Review CFD vs crypto metrics on Daily Performance.

## Risk Log & Alerts Analytics

`/admin/risk-log` shows:
- Alerts by risk domain / product / severity
- Chronological alert records with ack / resolve / human-gate durations
- Monetary **loss vs prevented** (and exposure) from `alert_impacts`
- Loophole-prone areas ranked by breach recurrence
- Unified timeline (alerts + interventions + spine)

## Still out of scope (production wiring)

Real Lark webhooks, live LP disable adapters, production SSO.
