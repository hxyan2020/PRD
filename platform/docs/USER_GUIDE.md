# CRMP User Guide

**Audience:** Risk Owner, Analyst, Ops, AI Engineer, System Admin

## 1. Sign in
1. Open `/login`.
2. Use seeded accounts (e.g. `risk.owner@vantagemarkets.com` / `risk123`, `admin@vantagemarkets.com` / `admin123`).
3. Land on Admin Home.

## 2. Triage an alarm
1. **Live Alerts** or **Monitor 2.0** — find OPEN items.
2. **AI Analyses** — open the linked RCA.
3. Read primary explanations + evidence vault.
4. If severity ≥ BREACH, review **Second AI challenger** (critique / improvements / alternatives).
5. If challenger is `PARTIAL`/`DISAGREE`, treat as needs-human before irreversible controls.

## 3. Demo Messenger workflow
1. Open **Demo Messenger** (`/admin/messenger`).
2. Select a thread (auto-synced from alerts).
3. Inline actions:
   - **Show evidence** — pulls vault + challenger summary into chat.
   - **Chatbot** — challenge the report or add context (disagreement flags human review).
   - **Escalate** — advance predefined path (Primary → Secondary → Risk Owner → Exec).
   - **Dismiss** — false alarm; closes alert.
   - **Close** — accept AI; closes ticket.
4. Under the AI report, pick a recommended action (block account, halt symbol, …).
5. **Double-confirm** → mock Vantage admin ref + link; Checker step if required.

## 4. AI Admin (makers & checkers)
1. Open **AI Admin**.
2. Propose setting/model/policy change (maker).
3. Different user with checker permission approves/rejects.
4. Never self-approve.

## 5. Market Intelligence
1. Open **Market Intelligence**.
2. Run scan or wait for 5-minute scheduler.
3. Review findings + messenger outbox cards (format i–vi).

## 6. Safety
- Consult **AI Access Security** for human-only surfaces.
- All messenger/admin actions write **Audit Log** and often **Spine Log**.
EOF

