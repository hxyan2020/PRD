# Vantage Ecosystem Adoption Evaluation

**Document ID:** CRMP-ECO-001 · Prototype → Production readiness assessment

## 1. Executive view
The CRMP prototype proves the spine (Monitor → AI RCA → second opinion → messenger → intervention → audit). Production adoption into the existing Vantage ecosystem needs shared identity, real LP/trading adapters, hardened AI governance, and a phased rollout — not a big-bang rewrite.

## 2. Foundations required
| Foundation | Why | Maturity needed |
|---|---|---|
| SSO / IdP (Okta/Azure AD) + SCIM | Replace prototype passwords; join Risk/Ops directories | Production |
| Monitor 2.0 bidirectional API | Alarm ingest + ticket status write-back | Production |
| LP / bridge / trading control bus | Real halt, leverage, widen, pause-copy | Production with dual-control |
| Lark (or Teams) app + interactive cards | Replace demo messenger | Production |
| Secrets vault + env isolation | Webhooks, model keys, DB creds | Production |
| Observability (metrics/traces/logs) | Spine SLOs, AI latency, false-alarm rate | Production |
| Data residency & retention policy | Client identifiers in evidence vault | Legal sign-off |
| Maker/checker + SoD in IAM | AI Admin + interventions | Production |

## 3. Personnel (indicative)
| Role | FTE (pilot → scale) | Responsibility |
|---|---|---|
| Product Manager (Risk Platforms) | 1 → 1 | Scope, UAT, stakeholder alignment |
| Risk Owner (business) | 0.3 → 0.5 | Policy, acceptance, escalation authority |
| Engineering lead | 1 → 1 | Architecture, adapters |
| Full-stack engineers | 2 → 4 | Admin, messenger, APIs |
| Data / ML engineer | 1 → 2 | RAG, challenger models, eval harness |
| SRE / Platform | 0.5 → 1 | Deploy, secrets, observability |
| Security / GRC | 0.3 → 0.5 | Blocklist, access reviews, audit |
| QA / UAT facilitator | 0.5 → 1 | UAT pack execution |
| Ops liaison | 0.3 → 0.5 | Control runbooks |

## 4. Budget bands (indicative, USD, not a quote)
| Phase | Scope | Band |
|---|---|---|
| A — Harden prototype | Auth, hosting, audit export, UAT | $80k–$150k |
| B — Ecosystem connect | Monitor API, Lark cards, read-only LP feeds | $250k–$450k |
| C — Controlled write path | Dual-control trading actions + DR | $400k–$700k |
| D — Model ops | Eval, challenger A/B, drift monitors | $150k–$300k / year run |

*Figures are planning envelopes for executive discussion; finance must re-estimate against vendor SOWs.*

## 5. Timeline phases (effort-based, not calendar promises)
1. **Foundation lock** — SSO, environments, data classification, RACI.
2. **Read path production** — Live alarms + dual-AI RCA + messenger notify (no auto-trade).
3. **Supervised write path** — Maker/checker interventions to Vantage admin adapters.
4. **Optimisation** — Challenger quality, market intel precision, cost controls.

## 6. Shortcomings of current prototype
- Heuristic AI (not production LLM/tool-calling with eval gates).
- SQLite single-node persistence.
- Mock Lark delivery.
- Sidebar UX weak on small phones without drawer.
- Limited multi-entity / multi-brand tenancy.

## 7. Precautions
- Never grant AI service principals rights on blocklisted fields/pages.
- Keep irreversible controls human-gated; challenger disagreement ⇒ mandatory review.
- Separate maker/checker identities in IAM, not only app logic.
- Run shadow mode (notify-only) before enabling write adapters.
- Define kill-switch for auto skill execution and market-intel pushes.
- Legal review before storing client identifiers in evidence excerpts.
EOF

