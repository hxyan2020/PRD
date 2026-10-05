# CRMP User Guide

**Document ID:** CRMP-UG-001 · **Audience:** anyone who opens the admin desk  
**Languages:** English (this page) · [繁體中文](/admin/docs/user-guide?lang=zh-Hant)  
**Docs & platform owner:** demo platform owner (`haixiang.yan@hytechc.com`)

This handbook is written in everyday language. It covers **every page in the left menu**, plus login, language, unread numbers, and the public GitHub Pages snapshot.

---

## 1. What this desk is

Vantage **CRMP Admin** is the control room for CFD and crypto risk. Monitor 2.0 raises an alarm. This desk then:

1. Finds a matching skill playbook, or searches the RAG knowledge base if no skill is certain.  
2. On high severity (BREACH or CRITICAL), runs a **second, independent AI** that may agree, partly agree, or disagree.  
3. Puts the pack into a **Lark-style messenger** so you can show evidence, chat, escalate, dismiss, close, or send a control.  
4. Asks a human checker before irreversible controls go live.  
5. Writes the whole story into the **Audit Log** and the **home spine** (stage ticket counts — the dedicated Spine Log tab is gone).

You do not need to be an engineer to use it. Click the left menu, read the cards, and follow the buttons on the page.

**Permanent public demo:** [https://hxyan2020.github.io/PRD/crmp-admin/admin/](https://hxyan2020.github.io/PRD/crmp-admin/admin/)  
**Messenger demo:** [https://hxyan2020.github.io/PRD/crmp-admin/admin/messenger/](https://hxyan2020.github.io/PRD/crmp-admin/admin/messenger/)  
**Full URL list:** [URL Catalog](/admin/docs/urls)  
**Open programme issues / progress:** [Open Issues](/admin/docs/open-issues) · [Progress Tracker](/admin/docs/progress)

On GitHub Pages there is **no live `/api`**. You can still walk every screen. Buttons that would save to the server keep a copy in this browser instead. Live writes (real scans, dual-control applies, user create) belong on `localhost:3000`.

```mermaid
graph TD
  Monitor[Monitor 2.0 alarm] --> Desk[CRMP Admin]
  Desk --> AI[AI RCA plus second AI]
  AI --> Msg[Demo Messenger]
  Msg --> Human[Human intervention]
  Human --> Audit[Audit plus home spine]
```

---

## 2. Sign in, stay signed in, switch language

### 2.1 Open the login page

1. Click **Sign in** in the left pane (safest on GitHub Pages).  
2. Or open [`/admin/login`](/admin/login) (safest). The old [`/login`](/login) page still exists, but on GitHub Pages you must use `/PRD/crmp-admin/login/` or `/PRD/crmp-admin/admin/login/` — plain `github.io/login` is a 404.

The admin is public in this prototype. Sign in only when you want a **named role** (so maker/checker and permissions behave like production).

### 2.2 Accounts you can use

Click a **Quick fill demo role** button, or type the email and password, then **Sign in**.

| Who | Email | Password | Use this when |
|---|---|---|---|
| Platform Owner | `haixiang.yan@hytechc.com` | `yan123` | You are demo platform owner, the named owner of this desk and these docs |
| Risk Owner | `risk.owner@vantagemarkets.com` | `risk123` | Approving AI packs and checker steps |
| Risk Analyst | `risk.analyst@vantagemarkets.com` | `risk123` | Triage and messenger challenge |
| Ops Lead | `ops.lead@vantagemarkets.com` | `ops123` | Proposing halt / block / widen / pause-copy |
| AI Engineer | `ai.engineer@vantagemarkets.com` | `ai123` | Skills, RAG, detectors, AI Admin proposals |
| System Admin | `system.admin@vantagemarkets.com` | `sys123` | Users, settings, audit, AI access blocklist |
| Super Admin | `admin@vantagemarkets.com` | `admin123` | Full demo rights (still cannot self-approve AI Admin when dual control is on) |

After Sign in you land on **Admin Home**. The name stays in this browser (`crmp_demo_session_v1`). Refreshing the public Pages site does not drop you back to a blank guest. Click **Sign out** in the left pane to clear it.

```mermaid
graph TD
  Click[Click Sign in] --> Where{GitHub Pages snapshot?}
  Where -->|Yes| Demo[Save named persona in this browser]
  Where -->|No| Api[Server session cookie]
  Demo --> Home[Land on Admin Home]
  Api --> Home
```


### 2.3 Language

Use **EN / 繁中** (sidebar on desktop; header on a phone). The choice is stored in the `crmp_ui_lang` cookie. Every left-nav label, page title, and product doc can switch. Open a doc with `?lang=zh-Hant` if you want to share a Chinese link.

### 2.4 Phones

Tap the **hamburger** (Menu) to open the left nav. Messenger is list-first: tap a thread, then **Threads** to go back. Language sits in the header.

### 2.5 Selection AI chatbot

On any admin page, **select text** (or long-press on a phone). A teal sparkle icon appears next to the highlight. Tap it: a chat drawer explains that passage in this CRMP’s terms (Monitor vs mock Lark, EXECUTED_MOCK, who can approve, which page to open). You can keep asking follow-ups. It is read-only — it cannot approve an intervention or change settings. On GitHub Pages it uses the same grounded glossary (no live LLM required).

---

## 3. The left menu (groups and unread numbers)

The left pane is grouped so you are not staring at one long list:

| Group | What lives there |
|---|---|
| **Overview** | Admin Home (includes spine stage ticket counts) |
| **Monitor & risk** | Daily Performance → Monitor 2.0 → Live Alerts → Market Intelligence → Risk Log → Risk Domains |
| **AI & knowledge** | AI Skills → Knowledge Tree → RAG → AI Admin (AI Analyses list lives on Realtime Alert) |
| **Response** | Demo Messenger → Human Intervention → Escalation Routes → Lark |
| **Organisation** | BU and Teams → Users → Roles |
| **Platform** | Data Sources → Platform Settings → Audit Log → AI Access Security |
| **Docs** | User Guide → URL Catalog → UAT → PRD → TSD → Roadmap → Ecosystem → Open Issues → Progress Tracker |

The Vantage logo sits at the top. Your role badge (and **Public prototype** on GitHub Pages) sit under your name. Owner line: demo platform owner.

### Unread numbers

Some rows show a **teal badge** (Live Alerts, Demo Messenger, Market Intelligence, Human Intervention, Audit, Monitor 2.0, Risk Log).

- The number is **new things since you last opened that tab** in this browser.  
- Formula: `unread = max(0, (known total + extra bumps) − last seen)`.  
- Opening the page **clears** that badge for you (stored in `crmp_nav_seen_v1`).  
- When a scan, detector run, or AI simulate creates new work, the badge **goes up** (`crmp_nav_extra_v1`).  
- On GitHub Pages the first paint uses fallback totals so you still see numbers even if the snapshot database looks empty.

The badge is a nudge, not a lock. You can always open the page.

```mermaid
graph TD
  New[New scan simulate or alarm] --> Bump[Left-nav badge goes up]
  Bump --> Open[You open that tab]
  Open --> Zero[Badge goes to zero in this browser]
```

---

## 4. What each role does every day

### Risk Owner

1. Open [Live Alerts](/admin/alerts) and [AI Analyses](/admin/ai-analyses). Look for BREACH / CRITICAL.  
2. Open the dual-AI pack. If the second AI is `PARTIAL` or `DISAGREE`, do **not** approve an irreversible control yet.  
3. In [Demo Messenger](/admin/messenger): escalate, **Close (accept AI)**, or **Dismiss** a false alarm.  
4. On [Human Intervention](/admin/interventions), approve checker steps after Ops has maker-confirmed a control.  
5. Run the [UAT Checklist](/admin/docs/uat) when you sign off a release.

### Risk Analyst

1. Work the OPEN queue on Live Alerts.  
2. Open the AI analysis. Read summary, evidence, and second-AI verdict.  
3. In messenger, **Show evidence**, then type in **Chatbot** if you disagree or have extra context.  
4. Escalate to Risk Owner when the pack is ready.

### Ops Lead / Analyst

1. From messenger **Recommended actions**, pick block / halt / cut leverage / pre-widen / pause-copy.  
2. Click **Double-confirm…** then **Yes, send to Vantage admin**. You get an admin reference and a link.  
3. If the thread says checker is needed, wait for Risk Owner on Human Intervention.

### AI Engineer

1. Keep [AI Skills](/admin/skills), [RAG](/admin/rag), and [Detectors](/admin/detectors) healthy.  
2. Propose setting/model/skill/RAG changes on [AI Admin](/admin/ai-admin). You cannot approve your own change.  
3. Tune `ai.second_opinion_severity` (default BREACH) under AI Admin parameters or Platform Settings.

### System Admin

1. Users, roles, **BU and Teams**, grouped settings.  
2. Review [AI Access Security](/admin/security/ai-access) — pages, functions and fields AI must never touch (includes RAG write blocklist / `propose_rag`).  
3. Watch [Audit Log](/admin/audit) (CRMP / Vantage Markets Admin tabs + Roll back) and the **home spine** stage ticket counts on Admin Home (`/admin/spine` redirects here).

---

## 5. The main story: alarm → AI → chat → close

This is the path you will use most. Later sections explain every other page.

1. A detector or Monitor 2.0 indicator breaches.  
2. An **OPEN** alert appears on Live Alerts (and a ticket on Monitor 2.0).  
3. AI Analyses gets a pack: `SKILL_MATCH` if a playbook fits, otherwise `RAG_REASONING`. Every analysis also opens a **How to improve** panel (data source, dormant indicator health, missing reasoning, new skill pattern, tighten limit X→Y, manual response time) with a chatbot to pull data, add facts, challenge, and regenerate until you mark it satisfactory.  
4. If severity is BREACH or CRITICAL, a **Second AI** panel appears (`AGREE` / `PARTIAL` / `DISAGREE`).  
5. Click **Sync alerts** on Demo Messenger so the pack is a chat thread.  
6. **Show evidence** posts the vault into the thread. Chat if you challenge the story.  
7. **Escalate**, **Dismiss** (false alarm), or **Close (accept AI)**.  
8. For a control: pick a recommended action → double-confirm → checker if required.  
9. Confirm the same events in **Audit Log** and on the **home spine** (stage ticket counts).

**Demo shortcuts on Realtime Alert & Tracker** (localhost **grouped AI pipeline** panel + rank note): Analyze all open alarms, Simulate COPY breach (skill path), Simulate EQ drawdown (RAG path), Simulate CRITICAL (2nd AI challenge), Backfill 2nd AI challenges. `M2-*` codes are clickable **MonitorCode** chips with tooltips → Monitor 2.0.

**Decision rule:** `AGREE` may follow the playbook under policy. `PARTIAL` / `DISAGREE` means **needs human** — no irreversible control until a person has read both AIs.

```mermaid
graph TD
  Det[Detector or Monitor breach] --> Alert[OPEN alert]
  Alert --> Skill{Playbook certain?}
  Skill -->|Yes| SM[SKILL MATCH]
  Skill -->|No| RAG[RAG reasoning]
  SM --> Sev{BREACH or CRITICAL?}
  RAG --> Sev
  Sev -->|Yes| Second[Second AI]
  Sev -->|No| Msg[Demo Messenger]
  Second --> Msg
  Msg --> Act{What do you do?}
  Act -->|Close or dismiss| Done[Closed plus audit]
  Act -->|Send a control| Gate[Double confirm then checker]
  Gate --> Done
```

---

## 6. Overview

### 6.1 Admin Home — `/admin`

**What it is.** The landing page after login. A snapshot of how busy the desk is.

**What you see.**

- Owner card for **demo platform owner**. The whole card opens Sign in as platform owner.  
- A Lark-style messenger promo. The whole card opens the messenger demo (permanent GitHub Pages URL is on the card).  
- Clickable count cards: Users, Teams (opens **BU and Teams**), Data Sources, Risk Domains, Open Alerts, Open Tickets, Lark Channels, Escalation Routes. Each card jumps to that page.  
- **Jump to a page** tiles for Daily Performance, Market Intelligence, Monitor 2.0, Live Alerts, AI Skills, Knowledge Tree, Human Intervention, Messenger, Settings, User Guide, PRD.  
- Recent alerts. Each row opens that alarm on Live Alerts. **View all** lists every alarm.  
- **Integration spine** with **stage ticket counts** (Detect → Alarm → AI RCA → Skill → Human → Resolved → Dashboard). Each step opens the matching page. There is **no separate Spine Log tab** — `/admin/spine` redirects here.  
- Header shortcuts: Messenger, User Guide, Daily Performance.

**What to click.** Use the cards as a map. If Open Alerts is not zero, go there first.

**Good looks like.** Counts match the other pages. Cards are links, not dead tiles.

---

## 7. Monitor & risk

### 7.1 Daily Performance — `/admin/dashboard`

**What it is.** End-of-day CFD and crypto risk picture — the last stage of the spine.

**What you see.** Report date, WARN/BREACH counts for CFD and crypto, then metric cards (value, target, notes, health).

**What to click.** **Refresh** (localhost) rebuilds live metrics from `/api/dashboard`. On Pages the numbers are the seeded snapshot.

**Good looks like.** Both product columns present. Status badges are readable (HEALTHY / WARN / BREACH).

### 7.2 Risk Log Analytics — `/admin/risk-log`

**What it is.** The history book: closed tickets, what fired, how long humans took, money lost vs money prevented, and where loopholes cluster.

**What you see.**

- Summary tiles: open alerts, loss vs prevented vs exposure, average ack/resolve/handling minutes, SLA breaches, pending vs decided interventions.  
- **Historical charts (90 days)** on Overview / Historical charts — alerts & open book, loss vs prevented, handling latency. Days before the live demo window are backfilled so the series reads as a full quarter.  
- **Closed alerts & tickets** on Overview — the same tracker cards as Realtime Alert, but only after the ticket is closed: realtime status (ticket closed), AI analysis, AI/BU action logs, and the final solution mandated by AI or the business-unit POC.  
- Tables by category and by domain.  
- Loophole tags (repeat weak spots).  
- Chronological records (alert, ticket, outcome, USD).

**What to click.** Read the charts, then expand a closed card for the full pack. Filter / scan the tables. Open work still lives on Realtime Alert.

**Good looks like.** Charts span ~90 days (not a flat spike on one day). Closed cards show ticket-closed, an AI report, a BU/AI action log, and a mandated solution. Totals add up. Handling times are filled for closed work. Loophole tags are not empty on the seeded demo.

### 7.3 Market Intelligence — `/admin/market-intel`

**What it is.** A five-minute look at news, social, official and exchange posts that can move LP prices. Findings feed indicator `M2-MKT-INTEL` and a messenger outbox (Lark group `oc_market_intelligence` in production).

**What you see.** After the four summary cards: **past hour** and **past 24 hours** headline events, then a **sentiment barometer** for core Vantage CFD instruments (forex, metals/energy, indices, crypto). Tabs: **Findings**, **Messenger outbox**, **Sources**, **Scan log**. Cards show products and direction, region flags, impact (not “violation”), source **article URLs**, and timestamp. Scheduler on/off. Skill playbook link.

**What to click.**

1. Turn the feature on in Platform Settings (`market_intel.enabled`) if the desk looks idle.  
2. Read the pulse cards (hour / 24h) and the instrument barometer. Click a headline to jump to that finding; click a symbol to filter findings to that product.  
3. Click **Scan now**.  
4. Read new Findings, then the outbox, then the scan log.

**GitHub Pages:** there is no `/api`, so **Scan now** runs a **local demo scan** from the same event templates as the live scanner. New cards appear at once and are stored in this browser (`crmp_mi_demo_v1`). Real HTTP scrapes still belong on `localhost:3000`. You will **not** get a 405 error.

```mermaid
graph TD
  Scan[Scan now] --> Q{Public snapshot?}
  Q -->|Yes| Demo[Client demo scan]
  Q -->|No| Api[Live API scan]
  Demo --> Desk[Findings plus outbox]
  Api --> Desk
```

**Good looks like.** Scan finishes with a count. Findings, outbox and scan log all update. The Live Alerts / Market Intelligence unread badge may tick up.

### 7.4 Monitor 2.0 — `/admin/monitor-2`

**What it is.** The integration hub for the existing indicator platform. CRMP does not replace Monitor 2.0; it syncs from it.

**What you see.** Three tabs:

- **Indicators** — monitor id, name, domain, product, warn/breach thresholds, last value, open ticket count.  
- **Alerts** — the same events as Live Alerts, with Monitor ticket ids.  
- **Tickets** — case tracking, assignee, department, Lark message id.

A panel shows `monitor2.base_url` and **Sync now (prototype)**.

**What to click.** Sync on localhost to refresh mirrored tables. Acknowledge an OPEN alert. Update a ticket status. On Pages, treat this as a read-only catalogue.

**Good looks like.** Indicators EQ / MRG / COPY (and others) are present. Sync reports how many rows refreshed.

### 7.5 Detectors — `/admin/detectors`

**What it is.** Threshold watches that sit in front of Monitor. They are the first stage of the spine.

**What you see.** Each detector: code, product, domain, monitor id, warn/breach, comparator, enabled, last run, last status/value. A recent **runs** list (observed value, severity, linked alert and analysis).

**What to click.**

- **Run all** (localhost) samples every enabled detector. Warn/breach auto-raise alarms and kick AI RCA. Unread badges on Detectors, Live Alerts and AI Analyses go up.  
- **Enable / disable** a single detector.

**Good looks like.** A COPY-style detector can produce a BREACH. Disabled detectors do not fire. Runs appear in Spine as DETECT → ALARM.

### 7.6 Live Alerts — `/admin/alerts`

**What it is.** The operational queue: what is still open right now. Closed tickets leave this page and land in Risk Log Analytics.

**What you see.** Open cards only, sorted CRITICAL → BREACH → WARN, newest first. Each card: severity, status, product, domain, title, message, alert id, monitor id, observed value, ticket id, time. Expand for AI RCA, POC, gates, escalation and action log.

**What to click.** **Acknowledge** on an OPEN alert if you have operate rights. Then open AI Analyses or Messenger for the pack. Use **View closed alerts in Risk Log Analytics** to read tickets that already closed. The unread badge clears when you visit this page.

**Good looks like.** Only still-open items. Ack moves status to ACKNOWLEDGED. Closed work is not mixed into this queue.

### 7.7 Risk Domains — `/admin/risk-domains`

**What it is.** The catalogue of CFD and crypto risk areas — original domains plus **Firm-wide Systemic & Contagion (P0)**, **Third-party & Vendor Dependency (P3)**, and **Reputation & Client Communications (P3)**. Each domain breaks into concrete risk scenarios.

**What you see.** Coloured priority pills (**P0** rose, **P1** orange, **P2** amber, **P3** slate), code, product coverage, owner / supporting BUs, owned Monitor 2.0 indicator chips, and expandable scenarios with plain-English **How it works**, **Participants**, **Impacts**, plus primary and related Monitor 2.0 links.

**What to click.** Expand a scenario. Click any `M2-*` chip to jump to Monitor 2.0 anchored on that indicator.

**Good looks like.** Every domain has an owner. Every scenario lists at least one Monitor 2.0 indicator. Product coverage is CFD, Crypto, or both.

---

## 8. AI & knowledge

### 8.1 AI Analyses — merged into `/admin/alerts` (detail `/admin/ai-analyses/[id]`)

**What it is.** The RCA workbench is merged into **Realtime Alert & Tracker**. `/admin/ai-analyses` redirects there. Per-analysis evidence packs stay at `/admin/ai-analyses/[id]`.

**What you see on Realtime Alert.** A **grouped AI pipeline controls** panel (with rank/ordering note) and five working buttons, then open tracker cards. `M2-*` monitor ids are **MonitorCode** chips — hover for tooltip, click to open Monitor 2.0 anchored on that indicator. Expand a card for mode (`SKILL_MATCH` or `RAG_REASONING`), confidence, **2nd AI · verdict**, the **how to improve** panel (chatbot: Pull data / Add fact / Challenge / Regenerate / Mark satisfactory), and the action log.

**What to click (demo, localhost).**

- Analyze all open alarms — ensures every open alert has an AI pack (fast; reuses existing).  
- Simulate COPY breach — skill path + second AI.  
- Simulate EQ drawdown — forced RAG path; WARN usually skips second AI.  
- Simulate CRITICAL — margin skill + second AI.  
- Backfill 2nd AI challenges — attaches challenger rows to older high-severity packs.

**Good looks like.** All five buttons respond with a status line (not stuck disabled). Every analysis has a how-to-improve review. BREACH/CRITICAL get a second-AI badge. `PARTIAL` / `DISAGREE` sets needs-human.

### 8.2 AI Admin — `/admin/ai-admin`

**What it is.** Governance for AI, **not** the live RCA list. Maker proposes; a **different** person checks.

**Tabs / cards.**

| Tab | What you do |
|---|---|
| Overview | KPIs plus **first-line** and **second-line** AI Admin cards (models, confidence gate, RAG top-K, challenger) |
| Parameters | Draft `ai.*` / `ai.line1.*` / `ai.line2.*` settings. **Propose** does not apply yet |
| Maker / Checker | Pending change requests first. Approve or reject with a note. You cannot approve your own |
| Skills | Propose create/update/disable of a playbook. Applied only after approve |
| RAG | Propose create/update/retire via **`propose_rag`** (AI cannot write the corpus directly) |
| Training | Queue a recalibration run (becomes a TRAINING change request) |
| History | Accuracy snapshots (about 14 days) |

Header badges show whether you are Maker, Checker, or both. Risk Owner can be both, but **self-approve is still blocked**.

**Good looks like.** A proposed skill stays PENDING until another user approves. After approve it appears on AI Skills. Parameter values on the live desk do not move until APPROVED.

```mermaid
sequenceDiagram
  participant Maker
  participant API
  participant Checker
  Maker->>API: propose skill
  API-->>Maker: PENDING change request
  Maker->>API: approve own request
  API-->>Maker: blocked self-approve
  Checker->>API: approve
  API-->>Checker: skill is ACTIVE
```


### 8.3 AI Skills — `/admin/skills`

**What it is.** Playbooks in SKILL.md style: when to use, when not to, prechecks, steps, evidence, stop conditions, success criteria, thresholds and why, fault areas, escalation, BU corrections, past cases.

**What you see.** Search box. Two tabs: **Single-indicator skills** and **Linked timelines** (multi-indicator chains). Cards stay compact (code, name, product, domain, auto vs manual).

**What to click.** **Enter** opens `/admin/skills/{code}` — the full playbook page (not a tiny card). From there: back to skills, knowledge tree, AI analyses, risk log.

**Good looks like.** Enter never 404s for a seeded skill. Linked timelines show sequence, causes, linked skills.

### 8.4 Knowledge Tree — `/admin/knowledge-tree`

**What it is.** A picture of how knowledge hangs together: CRMP → risk domains → skill playbooks, with linked timelines and **RAG document leaves** (deep links into `/admin/rag?doc=`).

**What you see.**

- **Tree map** (default) or **Outline**.  
- Product filter: All / CFD / Crypto.  
- Trunk switch: Risk domains, Linked timelines, RAG corpus.  
- Click a **domain** to fan out its skills. Click a **skill** to fill the inspector.  
- **Enter** / **Enter full playbook** opens the SKILL.md page.  
- **RAG document leaves** open the RAG library on that doc. Docs are matched by tags and title; `MonitorCode` chips link to Monitor 2.0.

Domains wrap on two rows so labels stay readable. There is no sideways-only strip of ten tiny boxes.

```mermaid
graph TD
  Hub[CRMP knowledge tree] --> Dom[Risk domains]
  Dom --> Sk[Skill playbooks]
  Hub --> Ch[Linked timelines]
  Hub --> Rag[RAG document leaves]
  Sk --> Enter[Enter full SKILL.md]
  Rag --> Doc[Deep link RAG doc]
```

**Good looks like.** LP_HEDGE expands to hedge skills. RAG trunk groups documents by category and shows clickable leaves. Enter navigates; it is not a dead SVG link.

### 8.5 RAG Knowledge Base — `/admin/rag`

**What it is.** The internal corpus used when a skill is not certain: policies, products, entities, platforms.

**What you see.** Filter by category, search box, document cards (key, title, tags, status, excerpt). A **retrieve** box to try a query (top-K hits with scores). An **AI write block / human-gate** banner: pages and corpus fields AI cannot edit escalate to a human — humans with `rag.manage` write, or AI Admin **`propose_rag`** for maker-checker.

**What to click.** Retrieve with a phrase like “copy trading concentration gold margin” and confirm hits look relevant. Production-like creates should go through AI Admin `propose_rag`; this page is the corpus browser (and human write when permitted).

**Good looks like.** Retrieve returns ranked hits. Retired docs drop out of search. AI cannot POST/PATCH `/api/rag` as a service actor; blocked edits surface as a human gate.

### 8.6 Spine on Admin Home — `/admin` ( `/admin/spine` redirects )

**What it is.** The end-to-end tape lives on **Admin Home** as the integration spine with **stage ticket counts**: DETECT → ALARM → AI_RCA → SKILL_EXECUTE → HUMAN_INTERVENTION → RESOLVED → DASHBOARD. The dedicated **Spine Log** left-nav tab was removed.

**What you see.** Per-stage counts (open work + 24h activity) and latest event titles; each step links to the matching page.

**What to click.** Read-only orientation. After you run a detector or close a messenger thread, confirm matching stages move on localhost.

**Good looks like.** A COPY breach demo moves Detect / Alarm / AI RCA counts. No silent gaps on the happy path.

```mermaid
graph LR
  D[DETECT] --> A[ALARM]
  A --> R[AI RCA]
  R --> S[SKILL EXECUTE]
  S --> H[HUMAN INTERVENTION]
  H --> X[RESOLVED]
  X --> Dash[DASHBOARD]
```


---

## 9. Response

### 9.1 Human Intervention — `/admin/interventions`

**What it is.** The checker desk for runtime actions (not AI Admin config). Maker already asked for a control; you approve or reject.

**What you see.** Cards: action code, status, analysis, indicator, alert title/severity, skill step, requested time, and **actioner email** on samples. Pending items have a note box plus **Approve** and **Reject**.

**What to click.** Type a short reason. Approve to go live (prototype records the decision). Reject to stop. Both write spine + audit.

**Good looks like.** Pending count matches the home / AI Admin KPI. Decided rows show who (email) and when.

```mermaid
graph TD
  Pick[Pick a recommended action] --> Confirm{Double confirm?}
  Confirm -->|No| Stay[Stay in the thread]
  Confirm -->|Yes| Ref[Admin reference]
  Ref --> Need{Checker required?}
  Need -->|No| Live[Recorded as live]
  Need -->|Yes| Desk[Human Intervention]
  Desk -->|Approve or reject| Live
```


### 9.2 Demo Messenger — `/admin/messenger`

**What it is.** In-app Lark-style inbox. Production will use real Lark; this page proves the buttons and the audit trail.

**Layout.** Desktop: thread list + chat side by side. Phone: list → tap thread → **Threads** to go back.

**Toolbar.** **Sync alerts** pulls new Monitor alarms into threads.

**On an open thread you can:**

| Button | What it does |
|---|---|
| **Show evidence** | Posts the evidence vault and second-AI summary into the chat |
| **Chatbot** (type + Send) | Challenge the AI or add facts. Disagreement flags `needs_human` |
| **Escalate** | Moves Primary → Secondary → Risk Owner → Exec along the route |
| **Dismiss** | False alarm. Closes the thread and the alert |
| **Close (accept AI)** | Accepts the analysis and closes the ticket |
| **Recommended actions** | Block user, halt trading, cut max leverage, pre-widen spreads, pause copy joining |
| **Double-confirm…** then **Yes, send to Vantage admin** | Creates an admin reference + link (often Interventions) |
| **Checker approve (go live)** | When the system says a checker is required |
| **Open in admin** | Jumps to the matching admin page (must stay under `/PRD/crmp-admin/` on Pages) |

**Good looks like.** Sync creates threads. Evidence posts a vault, not an empty bubble. Escalate advances the path. Dismiss/Close change statuses. Double-confirm yields an admin_ref. Open in admin does not 404 on GitHub Pages.

Permanent URL: [https://hxyan2020.github.io/PRD/crmp-admin/admin/messenger/](https://hxyan2020.github.io/PRD/crmp-admin/admin/messenger/)

```mermaid
graph TD
  Sync[Sync alerts] --> Thread[Open a thread]
  Thread --> Ev[Show evidence]
  Thread --> Chat[Chatbot]
  Thread --> Esc[Escalate]
  Thread --> Dec{Accept the AI?}
  Dec -->|Yes| Close[Close]
  Dec -->|False alarm| Dismiss[Dismiss]
  Dec -->|Need a control| Rec[Recommended action]
  Rec --> DC[Double confirm]
  DC --> Admin[Admin ref]
```


### 9.3 Lark Integration — `/admin/lark`

**What it is.** Channel registry for severity-routed notify, on-call pages, and dual-control pings. Webhooks are mocked in the prototype.

**What you see.** Channel list (name, chat id, purpose, enabled). Lark-related settings (`lark.*`).

**What to click.** Enable/disable a channel if you have manage rights. Send a mock notify on localhost. On Pages, treat as a directory.

**Good looks like.** Market intel, risk, and AI lab channels exist. Disabled channels are not used by escalation routes.

### 9.4 Escalation Routes — `/admin/escalation`

**What it is.** Paths are defined by **dimensions** (severity, involved teams, risk scenario, pending time, need human intervention) with editable **coefficients**. Demo Messenger **Escalate** follows this map. Every alert gets a path: exact domain+severity → domain wild → **ESC-DEFAULT**. Each skill binds **one** route code; unbound skills fall back to ESC-DEFAULT. There is **no separate Path name column** — the route code plus dimensions identify the path.

**What you see.** Route code (including `ESC-DEFAULT`), dimension fields, coefficient editors, teams, channel, SLA, default flag, enabled.

**What to click.** Create/edit/disable if you have manage rights (localhost). Edit dimension coefficients. Confirm the catch-all default exists. On Skills, confirm each playbook binds exactly one path.

**Good looks like.** CRITICAL has a tighter SLA than WARN. Exotic / unmatched events still resolve via ESC-DEFAULT. Skills never show a free-text “路徑” column — only the bound route code.

```mermaid
graph LR
  P[Primary team] --> Sec[Secondary team]
  Sec --> RO[Risk Owner]
  RO --> Ex[Exec]
```


---

## 10. Organisation

### 10.1 BU and Teams — `/admin/departments` ( `/admin/teams` redirects here )

**Combined hub.** Risk Control, Operations, AI, and System BUs with nested on-call teams. Expand a BU for mandate / Owns / Accountable / Collaborates / Out of scope / Escalates to, plus team mission and rotation (editable when authorised). There is no separate Teams left-nav tab.

### 10.2 Roles & Permissions — `/admin/roles` (editable)

**Editable** RBAC matrix at `/admin/roles` (API: `GET/POST /api/roles`). Each role (Risk Owner, Analyst, Ops, AI Engineer, System Admin, Super Admin, Viewer, …) shows name, description, BU, permission chips (`monitor.read`, `ai.approve`, `settings.manage`, …), plus Owns / Day-to-day / Does not / Escalates to. Super Admin has `*`. Operators with `users.manage` can update roles; AI actors are blocked. Use this page to see why a button is missing for a persona.

### 10.3 Users — `/admin/users`

Directory of operators and demo personas, including **demo platform owner**. Columns: name, email, role, department, team, status, last login.

If you have `users.manage` (localhost): **Add user** (name, email, password, role, department, team) and toggle ACTIVE / DISABLED. On Pages, creating users is a demo no-op or browser-only.

**Good looks like.** demo platform owner is present as platform owner. Disabled users cannot be a live maker/checker in the localhost API.

---

## 11. Platform

### 11.1 Data Sources — `/admin/data-sources`

Registry of internal platforms and external verification feeds (category, name, type, status). Manage on localhost if you have `sources.manage`. This is the catalogue AI and detectors are allowed to name in evidence.

### 11.2 AI Access Security — `/admin/security/ai-access`

The **human-only** inventory. AI service accounts must never receive these pages, functions, fields or data (identity writes, secrets, dual-control approve, LP/wallet execute, role writes, session cookies).

**What you see.** Stats, the blocklist (target, reason, severity), allowed AI capabilities, and forbidden permission codes.

**Good looks like.** Approve paths, user/role writes, and trading execute are on the blocklist. The allowed list is narrow (read evidence, draft RCA, retrieve RAG).

### 11.3 Audit Log — `/admin/audit`

Two tabs:

| Tab | What it records |
|---|---|
| **CRMP logs** | All changes done inside this CRMP admin — alerts, AI, skills, escalation, interventions, messenger |
| **Vantage Markets Admin logs** | Changes on other admin pages — restrict user rights, pull transaction data, triggered Lark messages, received risk incident response by BU POC, settings / org / RAG |

Each row: time, actor, action, entity, details. Both tabs have a **Roll back** button — restores the before-state snapshot when available (`POST /api/audit/rollback`). Newest rows per plane.

### 11.4 Platform Settings — `/admin/settings`

Grouped flags (not one giant alphabetical dump):

| Group | Keys like |
|---|---|
| Platform identity | `platform.*`, `products.*` |
| Monitor 2.0 | `monitor2.*` |
| AI analysis | `ai.*` (RCA, confidence, second-opinion severity, maker/checker) |
| Market intelligence | `market_intel.*` (enabled, interval, Lark chat) |
| Messenger / Lark | `lark.*` |
| Escalation & SLA | `escalation.*`, `detectors.*` |

Edit a value and **Save**. Localhost writes SQLite. GitHub Pages stores the change in this browser only and says so.

---

## 12. Docs (in the left menu)

All of these toggle **EN / 繁中** like the rest of the desk.

| Page | Path | What it is |
|---|---|---|
| User Guide | `/admin/docs/user-guide` | This handbook |
| PRD | `/admin/docs/prd` | What we are building and why, with acceptance tests |
| TSD | `/admin/docs/tsd` | How it is built (architecture, APIs, data model) |
| UAT Checklist | `/admin/docs/uat` | Interactive 45-case sign-off (UAT-01 … UAT-45): why, steps, pass, evidence, screen coverage |
| Ecosystem Eval | `/admin/docs/ecosystem` | People, budget bands, phases, risks to adopt CRMP for real |
| Improvement Roadmap | `/admin/docs/roadmap` | RM-01…15 cards: today / build / done-when / skip risk |
| Open Issues | `/admin/docs/open-issues` | Programme checklist: ETA, responsible BU, dependencies (tentative → 2027) |
| Progress Tracker | `/admin/docs/progress` | Interactive board: X=issues, Y=timeline now→end-2027 |
| URL Catalog | `/admin/docs/urls` | Every admin page, API, and table, plus the public Pages URLs |

On UAT: walk cases in order. Do not skip Critical predecessors. Tick Pass/Fail on the board; coverage chips show which screens each case hits.

---

## 13. Safety habits (do these every time)

1. Open AI Access Security once per release and confirm the blocklist still matches “humans only”.  
2. Never give a production AI service account those rights.  
3. Treat messenger **Dismiss** and **Close** as real decisions — they are audited.  
4. For BREACH/CRITICAL, keep primary + second AI on screen before any irreversible control.  
5. After a control, check **Audit Log** and the **home spine** for the same ids.  
6. Maker and checker must be **two different people** on AI Admin and on designated controls.

---

## 14. Quick map of every left-nav page

| Group | Page | You come here to… |
|---|---|---|
| Overview | Admin Home | See counts; home spine stage ticket counts; click every card and alert row |
| Monitor & risk | Daily Performance | Day-end CFD + crypto metrics |
| Monitor & risk | Monitor 2.0 | Indicators, alerts, tickets; sync from upstream; M2-* deep links |
| Monitor & risk | Live Alerts | Ack the open queue; grouped AI pipeline; MonitorCode tooltips |
| Monitor & risk | Market Intelligence | Scan news/social; read findings and outbox |
| Monitor & risk | Risk Log Analytics | 90-day charts, closed packs, loss vs prevented, loopholes |
| Monitor & risk | Risk Domains | P0–P3 scenarios hooked to Monitor 2.0 |
| AI & knowledge | AI Skills | Browse playbooks; Enter the full SKILL.md; one escalation bind |
| AI & knowledge | Knowledge Tree | Domains, skills, RAG document leaves + deep links |
| AI & knowledge | RAG Knowledge Base | Search / retrieve; AI write blocked — `propose_rag` |
| AI & knowledge | AI Admin | First/second-line cards; propose/approve models, params, skills, RAG |
| Response | Demo Messenger | Evidence, chat, escalate, dismiss, close, controls |
| Response | Human Intervention | Checker approve/reject; actioner email on samples |
| Response | Escalation Routes | Dimensions × coefficients; ESC-DEFAULT; skill binds one path; no Path name column |
| Response | Lark Integration | Channel registry |
| Organisation | BU and Teams | Combined BU RACI + nested on-call teams (`/admin/departments`) |
| Organisation | Users | Directory, including demo platform owner / haixiang.yan@hytechc.com |
| Organisation | Roles & Permissions | Editable RBAC (`/api/roles`) |
| Platform | Data Sources | Internal + external registry |
| Platform | Platform Settings | Grouped flags |
| Platform | Audit Log | CRMP vs Vantage Markets Admin tabs + Roll back |
| Platform | AI Access Security | Human-only pages/functions/fields |
| Docs | User Guide / URLs / UAT / PRD / TSD / Roadmap / Ecosystem / Open Issues / Progress | Product and operator documents |

---

## 15. Document control

| Ver | Date | Notes |
|---|---|---|
| 1.0 | 2026-10-01 | Operator handbook |
| 1.3 | 2026-10-04 | All admin screens, public Scan demo, demo platform owner, login on Pages |
| 1.5 | 2026-10-04 | Flowcharts for login, unread, RCA path, messenger, maker/checker, intel scan, knowledge tree, spine |
| 1.6 | 2026-10-05 | Spine on home; BU and Teams; AI line1/2; propose_rag; ESC-DEFAULT; Open Issues / Progress |
| 1.7 | 2026-10-05 | Audit CRMP / Vantage Markets Admin tabs + Roll back; editable Roles; escalation dimensions × coefficients |

**Owner:** demo platform owner (`haixiang.yan@hytechc.com`)
