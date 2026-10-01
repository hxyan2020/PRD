# Vantage CRMP Admin (Prototype)

Centralised Risk Management Platform — **Admin Control Plane** for Vantage Markets.

This phase delivers:
- Internal SQLite database (roles, teams, departments, users, data sources, Monitor 2.0 mirrors, Lark channels, escalation routes, audit log, settings)
- Admin UI with RBAC
- Data sources repository (internal + external)
- Team / role division across Risk Control, Operations, AI, System
- Monitor 2.0 integration hub (indicators, alerts, tickets)
- Lark messenger integration (channels, test notify, severity routing)
- Escalation routes with SLA + auto-actions + human gate

## Quick start

```bash
cd platform
npm install
npm run dev
```

Open http://localhost:3000

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
- `/admin/rag` — view / manage / retrieve Vantage business corpus
- `/admin/skills` — dummy playbooks mapped to indicators

Auto-trigger also runs on **Monitor 2.0 Sync**.

## Next phase

Daily performance dashboard, live detectors over CFD + crypto exchange, real Lark/LP action adapters.
