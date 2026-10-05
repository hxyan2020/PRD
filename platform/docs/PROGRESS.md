# CRMP Progress Tracker

**Document ID:** CRMP-PT-001 · **Interactive board:** [/admin/docs/progress](/admin/docs/progress) · **Open issues:** [/admin/docs/open-issues](/admin/docs/open-issues)

Progress view of every open issue (**X = issue row**, **Y = timeline now → end-2027**). Each bar is labelled with status and responsible **BU**.

Statuses: Planned · Started · WIP · Delayed · UAT · Go live · BAU.

Shipped desk facts tracked as BAU (not separate bars): audit plane split (**CRMP logs** / **Vantage Markets Admin logs** + Roll back), editable Roles, escalation dimensions × coefficients + ESC-DEFAULT, home spine stage ticket counts (Spine Log tab removed), BU and Teams combined, **Realtime Alert & Tracker** left-nav naming (`/admin/alerts`), Detectors merged into **Monitor 2.0** (`/admin/detectors` redirect).

```mermaid
gantt
  title CRMP open issues (tentative)
  dateFormat YYYY-MM
  axisFormat %y-%m
  section Monitor
  OI-01 Indicator expansion           :active, 2026-10, 2027-06
  OI-13 Ticket write-back (delayed)   :crit, 2027-01, 2027-09
  section Product
  OI-02 Design freeze                 :active, 2026-10, 2027-03
  OI-15 Docs BAU                      :2026-10, 2027-12
  section System
  OI-03 Tech + resource plan          :2026-11, 2027-04
  OI-06 SSO SCIM                      :2026-12, 2027-06
  OI-11 UX polish                     :active, 2026-10, 2026-12
  section AI
  OI-14 Prototype UAT                 :active, 2026-10, 2026-11
  OI-05 RAG governance                :active, 2026-10, 2027-02
  OI-04 LLM + challenger              :active, 2026-10, 2027-07
  section Ops
  OI-08 Lark cards                    :2026-11, 2027-04
  OI-07 Control adapters              :2027-01, 2027-10
  section RO Pricing GRC
  OI-09 UAT exit                      :active, 2026-10, 2027-01
  OI-10 LP pricing feeds              :2027-02, 2027-09
  OI-12 Evidence retention            :2027-03, 2027-12
```

Interactive SVG/table: `/admin/docs/progress` (data: `platform/src/lib/docs/open-issues.ts`).

| Ver | Date | Notes |
|---|---|---|
| 1.0 | 2026-10-05 | Progress tracker wired into admin docs |
| 1.1 | 2026-10-05 | Note audit plane split + Roles / escalation desk facts as BAU |
| 1.2 | 2026-10-05 | BAU note: Realtime Alert & Tracker; Detectors→Monitor 2.0; OI-11/13/14 detail sync with Ecosystem v1.8 |

**Owner:** demo platform owner (`haixiang.yan@hytechc.com`) · **中文:** [PROGRESS.zh-Hant.md](./PROGRESS.zh-Hant.md)
