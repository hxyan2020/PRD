# CRMP UAT Pack — Risk Owner

**Document ID:** CRMP-UAT-001 · **Interactive demo:** [/admin/docs/uat](/admin/docs/uat)

Execute **in sequence**. Critical predecessors must Pass before later Critical cases. Record PASS / FAIL / WAIVE plus evidence in Audit notes.

## Timing model
- `T+0` = Risk Owner starts UAT session.
- Each case has suggested start offset and duration.
- Full pack suggested window ≈ **4 hours** (20 cases).

## Summary matrix

| Seq | ID | T+ start | Dur | Severity | Responsible BU | Dependency | Title |
|---|---|---|---|---|---|---|---|
| 01 | UAT-01 | 0m | 10m | Critical | System + Risk Owner | Seeded users | Login & RBAC gate |
| 02 | UAT-02 | 10m | 10m | Critical | Risk | UAT-01 | Monitor 2.0 indicator registry |
| 03 | UAT-03 | 20m | 15m | Critical | AI + Risk | UAT-02 | Skill-path RCA on COPY breach |
| 04 | UAT-04 | 35m | 15m | Critical | AI + Risk Owner | UAT-03 | Independent second-AI challenger |
| 05 | UAT-05 | 50m | 10m | High | AI | Threshold=BREACH | WARN path does not invoke challenger |
| 06 | UAT-06 | 60m | 15m | High | AI + Risk | RAG corpus | RAG reasoning path |
| 07 | UAT-07 | 75m | 10m | High | Risk | Messenger + analysis | Messenger — show evidence |
| 08 | UAT-08 | 85m | 10m | High | Risk Analyst + Owner | UAT-07 | Messenger — chatbot challenge |
| 09 | UAT-09 | 95m | 10m | High | Risk | Escalation routes | Messenger — escalate path |
| 10 | UAT-10 | 105m | 8m | Medium | Risk | Disposable WARN thread | Messenger — dismiss false alarm |
| 11 | UAT-11 | 115m | 10m | Critical | Risk Owner | Dual-AI reviewed | Messenger — close accept AI |
| 12 | UAT-12 | 125m | 15m | Critical | Ops + Risk Owner | Interventions | Recommended control + double confirm + checker |
| 13 | UAT-13 | 140m | 20m | Critical | AI + Risk Owner | Two distinct users | AI Admin maker ≠ checker |
| 14 | UAT-14 | 160m | 15m | Medium | Risk + AI | market_intel.enabled | Market Intelligence 5-minute scan |
| 15 | UAT-15 | 175m | 10m | High | System + Security | Blocklist seed | AI access blocklist review |
| 16 | UAT-16 | 185m | 15m | High | System | UAT-07–12 | Audit Log & Spine correlation |
| 17 | UAT-17 | 200m | 10m | Low | All | Docs published | Bilingual documentation toggle |
| 18 | UAT-18 | 210m | 15m | Medium | All | Responsive shell | Mobile smoke (≈390px) |
| 19 | UAT-19 | 225m | 10m | Medium | Risk Owner | UAT-04 samples | Dual-AI coverage gate |
| 20 | UAT-20 | 235m | 15m | Critical | Risk Owner | UAT-01–19 | Risk Owner exit sign-off |

Detailed step-by-step, pass thresholds, and evidence requirements are on the interactive page (expand each case).

## Exit criteria
1. All **Critical** cases Pass.  
2. At most **2 High** waived with written Risk Owner acceptance.  
3. **100%** BREACH/CRITICAL samples in the UAT window have second-AI challenge (UAT-19).  
4. **UAT-20** sign-off filed (ACCEPT / ACCEPT WITH WAIVERS / REJECT).
