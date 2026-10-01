# CRMP Product Requirements Document

**Document ID:** CRMP-PRD-001 · **Status:** Prototype · **Products:** CFD + Crypto

## 1. Problem
Vantage Markets needs a centralised risk management plane that turns Monitor 2.0 alarms into explainable AI root-cause analysis, human-gated interventions, and messenger-native operations — without letting AI touch human-only controls.

## 2. Goals
1. Detect → Analyse → Challenge → Escalate → Intervene → Audit as one spine.
2. Auto-apply known skills when certain; otherwise RAG + human review.
3. For BREACH/CRITICAL, always run an independent second AI challenge.
4. Keep maker/checker on AI Admin configuration changes.
5. Surface market intelligence that can move LP prices every 5 minutes.

## 3. Non-goals (prototype)
- Live production Lark webhooks (mocked with audit/outbox).
- Real LLM vendor billing (heuristic engines stand in).
- Full MT4/MT5/LP write adapters (admin deep-links only).

## 4. Personas
| Persona | Needs |
|---|---|
| Risk Owner | UAT, accept/reject AI, escalate, approve irreversible controls |
| Risk Analyst | Triage alerts, challenge AI via messenger, attach context |
| Ops Lead | Execute halts / widen / pause copy after maker confirm |
| AI Engineer | Skills, RAG, detectors, second-opinion threshold |
| System Admin | Users, roles, AI access blocklist, settings |

## 5. Functional requirements
| ID | Requirement | Priority |
|---|---|---|
| FR-01 | Sync Monitor 2.0 indicators & raise alarms | P0 |
| FR-02 | Skill-match RCA with step execution log | P0 |
| FR-03 | RAG RCA with external macro evidence | P0 |
| FR-04 | Second-AI challenger ≥ BREACH | P0 |
| FR-05 | Demo messenger with evidence/chat/escalate/dismiss/close | P0 |
| FR-06 | Recommended controls with double-confirm → admin | P0 |
| FR-07 | AI Admin maker ≠ checker | P0 |
| FR-08 | AI access blocklist (pages/functions/fields) | P0 |
| FR-09 | Market intel 5-min scan + Lark card | P1 |
| FR-10 | Risk Log analytics | P1 |
| FR-11 | Bilingual docs (EN / zh-Hant) | P1 |
| FR-12 | Responsive admin (web + mobile) | P1 |

## 6. Acceptance criteria (summary)
- Simulating COPY BREACH yields skill RCA + second AI panel with improvements.
- WARN-only EQ path does not invoke challenger.
- Messenger escalate advances predefined path; dismiss/close update alert status.
- Confirming "Block user account" creates admin ref and checker follow-up when required.
- AI Admin change requires distinct checker approval.

## 7. Success metrics (pilot)
| Metric | Target |
|---|---|
| Mean time alarm → dual-AI pack | < 60s (prototype) |
| % BREACH+ with challenger attached | 100% |
| False-alarm dismissals logged | 100% audited |
| Human-only surfaces blocked from AI | 100% of blocklist |
EOF

