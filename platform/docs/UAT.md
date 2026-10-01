# CRMP UAT Pack — Risk Owner

**Document ID:** CRMP-UAT-001 · Execute in sequence. Record pass/fail in Audit notes.

| Seq | Case | Steps | Responsible BU | Dependency | Severity | Pass threshold |
|---|---|---|---|---|---|---|
| 01 | Login & RBAC | Sign in as Risk Owner; confirm Admin Home loads; Viewer cannot open AI Admin | System | Seeded users | Critical | Correct role gates |
| 02 | Monitor sync | Open Monitor 2.0; confirm indicators present (EQ/MRG/COPY) | Risk | DB seed | Critical | ≥1 indicator each domain |
| 03 | Skill RCA | AI Analyses → Simulate COPY breach | AI + Risk | Skills seeded | Critical | Mode=SKILL_MATCH, evidence SKILL+MONITOR |
| 04 | Second AI | Open BREACH/CRITICAL analysis detail | AI + Risk | Challenger schema | Critical | Panel shows verdict + ≥1 HIGH improvement |
| 05 | WARN no challenge | Simulate EQ WARN | AI | Severity setting BREACH | High | No challenge row / panel "Not run" |
| 06 | RAG path | Force uncertain indicator or EQ path without skill | AI | RAG corpus | High | Mode=RAG_REASONING, needs_human possible |
| 07 | Messenger evidence | Messenger → Show evidence | Risk | Thread linked to analysis | High | Evidence messages appear + admin link |
| 08 | Messenger challenge chat | Type disagreement in chatbot | Risk | Open thread | High | needs_human flagged; bot acknowledges |
| 09 | Escalate | Click Escalate twice | Risk | Escalation routes | High | Step advances; path text shows next team |
| 10 | Dismiss false alarm | Dismiss on test WARN thread | Risk | Open thread | Medium | Thread DISMISSED; alert CLOSED |
| 11 | Close accept AI | Close on challenged BREACH after review | Risk Owner | Dual-AI pack | Critical | Thread CLOSED; evidence retained |
| 12 | Recommend + confirm | Propose Block account → double confirm | Ops + Risk | Interventions page | Critical | Admin ref created; checker note if required |
| 13 | AI Admin maker/checker | Maker proposes setting; different Checker approves | AI + Risk Owner | ai.admin perms | Critical | Self-approve blocked; change applied only after checker |
| 14 | Market intel scan | Run scan; open messenger outbox | Risk | market_intel.enabled | Medium | ≥1 finding or empty-scan logged |
| 15 | AI access blocklist | Open AI Access Security; spot-check users.password blocked | System | Blocklist seed | High | Human-only items listed with reasons |
| 16 | Audit & Spine | Perform actions 07–12; verify Audit + Spine entries | System | Prior cases | High | Matching events within 1 minute |
| 17 | Docs bilingual | Open PRD/TSD/User Guide; toggle zh-Hant | All | Docs files | Low | Both languages render |
| 18 | Mobile smoke | Resize to 390px; open Messenger + AI detail | All | Responsive CSS | Medium | Nav usable; panels stack; no horizontal clip on primary CTAs |

## Exit criteria
- All **Critical** cases Pass.
- No more than 2 **High** deferred with written risk acceptance by Risk Owner.
- Dual-AI attached on 100% of BREACH/CRITICAL samples in the UAT window.
EOF

