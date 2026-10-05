# CRMP UAT Pack — Risk Owner

**Document ID:** CRMP-UAT-001 · **Interactive demo:** [/admin/docs/uat](/admin/docs/uat)

In plain English: this is not a developer smoke test. It is the Risk Owner script for walking the whole admin desk and the Lark-style messenger, with evidence.

Execute **in sequence**. Critical predecessors must Pass before later Critical cases. Record PASS / FAIL / WAIVE plus evidence in Audit notes. The on-page tally lives only in this browser session; formal sign-off is the last case.

## Timing model
- `T+0` = Risk Owner starts UAT session.
- Each case has a suggested start offset and duration.
- Full pack suggested window ≈ **9 hours** (45 cases).

## Coverage

Messenger (inbox, evidence, chatbot challenge, escalate, false alarm, close, recommended controls, sync, closed-thread persistence) plus every left-nav admin screen: Home, Daily Performance, Risk Log, Monitor 2.0, Market Intelligence, Detectors, Live Alerts, Risk Domains, AI Analyses, AI Admin, Skills, Knowledge Tree, RAG, Human Intervention, Lark, Escalation Routes, BU and Teams / Roles / Users, Data Sources, AI Access, Audit, Platform Settings, User Guide / PRD / TSD / UAT / Ecosystem / Roadmap / Open Issues / Progress / URL Catalog, login, and unread badges.

```mermaid
graph TD
  Login[UAT-01 login] --> Mon[Monitor plus detectors]
  Mon --> AI[Skill then second AI]
  AI --> Msg[Messenger loop]
  Msg --> Gate[Checker plus audit]
  Gate --> Docs[Docs and remaining screens]
```


## Summary matrix

| Seq | ID | T+ start | Dur | Severity | Responsible BU | Dependency | Title | Covers |
|---|---|---|---|---|---|---|---|---|
| 01 | UAT-01 | 0m | 12m | Critical | System + Risk Owner | Seeded users; app running | Sign in and check who is allowed to do what | Admin Home, Login, Roles |
| 02 | UAT-02 | 12m | 10m | Critical | Risk | UAT-01; Monitor indicators seeded | Monitor 2.0 indicators that feed the demo alarms | Monitor 2.0, Live Alerts |
| 03 | UAT-03 | 22m | 15m | Critical | AI + Risk | UAT-02; AI skills seeded | Run a skill playbook on a copy-trading breach | AI Analyses, AI Skills |
| 04 | UAT-04 | 37m | 15m | Critical | AI + Risk Owner | UAT-03 or any BREACH/CRITICAL analysis | Second AI challenges the first AI on serious alarms | AI Analyses |
| 05 | UAT-05 | 52m | 10m | High | AI | UAT-02; default second-AI threshold = BREACH | A WARN-only case must not call the second AI | AI Analyses |
| 06 | UAT-06 | 62m | 12m | High | AI + Risk | RAG corpus seeded | When no skill fits, the AI reasons from the knowledge base | AI Analyses, RAG Knowledge Base |
| 07 | UAT-07 | 74m | 12m | High | Risk | UAT-03/04; Demo Messenger | Messenger — pull the evidence pack into the chat | Demo Messenger, AI Analyses |
| 08 | UAT-08 | 86m | 10m | High | Risk Analyst + Risk Owner | UAT-07; open messenger thread | Messenger — argue with the bot in the same thread | Demo Messenger, AI Analyses |
| 09 | UAT-09 | 96m | 10m | High | Risk | Escalation routes seeded; open thread | Messenger — escalate up the decision chain | Demo Messenger, Escalation Routes |
| 10 | UAT-10 | 106m | 8m | Medium | Risk | Separate OPEN WARN thread (do not use the Critical sample) | Messenger — dismiss a false alarm | Demo Messenger, Live Alerts |
| 11 | UAT-11 | 114m | 10m | Critical | Risk Owner | UAT-04 dual-AI pack reviewed on a BREACH thread | Messenger — close the case after accepting the AI pack | Demo Messenger, AI Analyses |
| 12 | UAT-12 | 124m | 15m | Critical | Ops + Risk Owner | OPEN thread; Human Intervention page | Messenger — propose a control, double-check, then send to admin | Demo Messenger, Human Intervention |
| 13 | UAT-13 | 139m | 20m | Critical | AI Engineer + Risk Owner | Two distinct users with ai.admin / checker capability | AI Admin — the person who proposes a change cannot approve it | AI Admin, Users, Audit Log |
| 14 | UAT-14 | 159m | 12m | Medium | Risk + AI | market_intel.enabled=true | Market Intelligence — Scan now must finish (including on GitHub Pages) | Market Intelligence, Demo Messenger |
| 15 | UAT-15 | 171m | 10m | High | System + Security | AI access blocklist seeded | AI must not be allowed near human-only data | AI Access Security |
| 16 | UAT-16 | 181m | 15m | High | System | UAT-07 through UAT-12 performed | Audit Log and Spine tell the same story as messenger | Audit Log, Admin Home spine |
| 17 | UAT-17 | 196m | 10m | Low | All | Docs published under /admin/docs/* | English and Traditional Chinese documentation both render | User Guide, PRD, TSD, UAT Checklist, Ecosystem Eval |
| 18 | UAT-18 | 206m | 15m | Medium | All | Responsive admin shell | Phone-width smoke test (~390px) | Admin Home, Demo Messenger, AI Analyses |
| 19 | UAT-19 | 221m | 10m | Medium | Risk Owner | UAT-04 samples in window | Every serious analysis in this UAT window has a second AI | AI Analyses |
| 20 | UAT-20 | 231m | 12m | High | Risk + AI | Skills catalog seeded | Skill cards stay short; Enter opens the full playbook | AI Skills |
| 21 | UAT-21 | 243m | 8m | High | Risk | UAT-07; public Pages URL | Messenger “Open in admin” lands on a real analysis | Demo Messenger, AI Analyses |
| 22 | UAT-22 | 251m | 8m | Medium | All | Left nav shell | Unread counts on the left pane (messenger-style) | Admin Home, Live Alerts, Demo Messenger, Market Intelligence |
| 23 | UAT-23 | 259m | 10m | Medium | AI + Risk | RAG + skills seeded | Knowledge tree shows how domains, skills and documents connect | Knowledge Tree, AI Skills, RAG Knowledge Base |
| 24 | UAT-24 | 269m | 12m | High | All | EN / 繁中 toggle in shell | Traditional Chinese covers chrome, messenger, skills and docs | Admin Home, Demo Messenger, AI Skills, UAT Checklist |
| 25 | UAT-25 | 281m | 8m | Medium | System | URL catalog | URL catalog lists the public pages (including new ones) | URL Catalog, AI Skills, Knowledge Tree, Demo Messenger |
| 26 | UAT-26 | 289m | 12m | Medium | Risk + System | Messenger + alerts + spine | Tell the messenger loop out loud, in plain English | Demo Messenger, Admin Home spine, Audit Log, AI Analyses |
| 27 | UAT-27 | 301m | 10m | Medium | System + Risk Owner | UAT-01 | Admin Home — cards, shortcuts and platform owner | Admin Home, Daily Performance, Users, URL Catalog |
| 28 | UAT-28 | 311m | 10m | Medium | Risk | UAT-01; daily dashboard seeded | Daily Performance — CFD and Crypto desk numbers | Daily Performance |
| 29 | UAT-29 | 321m | 10m | Medium | Risk | UAT-02 | Risk Log Analytics — what actually moved P&L / clients | Risk Log Analytics |
| 30 | UAT-30 | 331m | 10m | High | Risk | UAT-02; Live Alerts list | Live Alerts — read the queue and acknowledge one | Live Alerts |
| 31 | UAT-31 | 341m | 12m | High | Risk + AI | UAT-02; detectors seeded | Detectors — run the pack and see WARN/BREACH land | Detectors, Live Alerts, AI Analyses |
| 32 | UAT-32 | 353m | 8m | Low | Risk | UAT-01 | Risk domains catalogue with P0–P3 scenarios | Risk Domains |
| 33 | UAT-33 | 361m | 12m | High | Risk | UAT-07 | Messenger inbox — channels, kinds and Sync | Demo Messenger |
| 34 | UAT-34 | 373m | 12m | High | Ops + Risk | UAT-12; OPEN thread with recommended actions | Messenger — other recommended actions and cancel | Demo Messenger, Human Intervention |
| 35 | UAT-35 | 385m | 10m | High | Ops + Risk Owner | UAT-12 or UAT-34 | Human Intervention queue (the admin side of messenger controls) | Human Intervention |
| 36 | UAT-36 | 395m | 10m | Medium | System + Risk | UAT-01; lark channels seeded | Lark Integration — channels vs the in-app messenger demo | Lark Integration, Demo Messenger |
| 37 | UAT-37 | 405m | 8m | Medium | Risk | UAT-09 | Escalation routes registry | Escalation Routes |
| 38 | UAT-38 | 413m | 15m | Medium | System + Risk Owner | UAT-01 | Organisation — departments, teams, users and roles | BU and Teams, Users, Roles & Permissions |
| 39 | UAT-39 | 428m | 8m | Low | System | UAT-01 | Data sources registry (internal and external) | Data Sources |
| 40 | UAT-40 | 436m | 10m | Medium | System | UAT-01; settings.manage or read | Platform settings are grouped (not a flat dump) | Platform Settings |
| 41 | UAT-41 | 446m | 10m | Medium | AI + Risk | UAT-06; RAG seeded | RAG Knowledge Base — browse the corpus the AI cites | RAG Knowledge Base |
| 42 | UAT-42 | 456m | 8m | Low | All | Docs published | Improvement roadmap is readable | Improvement Roadmap |
| 43 | UAT-43 | 464m | 10m | Critical | System + Platform owner | Public snapshot or local login | Public snapshot — Sign in works and stays on demo platform owner | Login, Admin Home |
| 44 | UAT-44 | 474m | 10m | High | Risk + System | UAT-11 or UAT-10 | Messenger — closed threads stay closed after refresh | Demo Messenger |
| 45 | UAT-45 | 484m | 15m | Critical | Risk Owner | UAT-01–44 results recorded | Risk Owner exit sign-off | UAT Checklist, Audit Log |

## Cases (step by step)

### UAT-01 — Sign in and check who is allowed to do what

- **Severity:** Critical · **BU:** System + Risk Owner · **Depends:** Seeded users; app running · **Window:** T+0m / 12m
- **Covers:** Admin Home, Login, Roles
- **Why:** If the wrong person can open AI Admin or a Risk Owner cannot get in, the rest of UAT is unsafe.
- **Goal:** Prove the Risk Owner can enter admin, and a read-only Viewer cannot open privileged screens.

**Steps**

1. Open the Sign in page from the left pane (or go to /login). On the public GitHub Pages snapshot the address is /PRD/crmp-admin/login/ — it must not be a 404.
2. Sign in as risk.owner@vantagemarkets.com with password risk123. You should land on Admin Home, not an error page.
3. Look at the left pane: your name and role RISK_OWNER (or similar) should show. Department cards / RACI should be visible on Home.
4. Sign out. Sign in as viewer@vantagemarkets.com with password view123.
5. Try to open AI Admin from the left pane or by typing /admin/ai-admin. You should be sent away or told you are not allowed — you must not see the maker/checker form.
6. Sign back in as the Risk Owner (or Super Admin if your session was delegated) before the next cases.

**Pass:** Risk Owner reaches Admin Home. Viewer cannot operate AI Admin. Login page never 404s.
**Evidence:** Screenshot of Admin Home while signed in as Risk Owner, plus Viewer denied; Audit LOGIN rows if you are on localhost.

### UAT-02 — Monitor 2.0 indicators that feed the demo alarms

- **Severity:** Critical · **BU:** Risk · **Depends:** UAT-01; Monitor indicators seeded · **Window:** T+12m / 10m
- **Covers:** Monitor 2.0, Live Alerts
- **Why:** Messenger and AI RCA are useless if the underlying CFD/Crypto indicators are missing.
- **Goal:** Confirm the demo desk has the equity, margin and copy-trading indicators, and that Live Alerts actually lists alarms.

**Steps**

1. Open Monitor 2.0 from the left pane (Monitor & risk group).
2. Find these codes (search on the page or scroll): M2-EQ-001 (equity/drawdown), M2-MRG-014 (margin), M2-COPY-009 (copy concentration). Note the product (CFD or Crypto) and risk domain next to each.
3. Open Live Alerts. You should see a list of cards with severity (CRITICAL / BREACH / WARN), status (OPEN and so on), and a Monitor ticket id.
4. Write down how many OPEN (or ACKNOWLEDGED) alerts you see. That number is your baseline for later cases.

**Pass:** At least one indicator each for equity, margin and copy concentration. Live Alerts page loads with real rows.
**Evidence:** The three indicator IDs in your notes; baseline open-alert count.

### UAT-03 — Run a skill playbook on a copy-trading breach

- **Severity:** Critical · **BU:** AI + Risk · **Depends:** UAT-02; AI skills seeded · **Window:** T+22m / 15m
- **Covers:** AI Analyses, AI Skills
- **Why:** When we already know the failure pattern, the first AI should follow the written skill — not invent a story. Every new analysis also needs a how-to-improve review you can argue with.
- **Goal:** Prove the COPY breach simulation uses the matching skill playbook, stores evidence, and opens an improvement chatbot.

**Steps**

1. Open AI Analyses.
2. Click “Simulate COPY breach (skill path)”. Wait until a new analysis opens (or the list refreshes with a new row).
3. On the detail page, the mode badge should say SKILL_MATCH (this means “we used a known playbook”, not free-form guessing). Confidence should look certain (around 100%).
4. Scroll to Evidence vault. You must see at least a SKILL row (which playbook ran) and a MONITOR row (the alarm snapshot).
5. Find the panel **AI analysis — how to improve**. It must list items such as add a data source, check a dormant indicator, missing reasoning, a new skill pattern, tighten limit X→Y, and/or faster manual response. Evidence vault should also have an IMPROVEMENT row.
6. In the chatbot: **Pull data**, then **Add fact** (e.g. feed was stale 9 minutes), **Challenge reasoning**, **Regenerate**, and confirm the plan updates. You may **Mark satisfactory** when done.
7. Copy the analysis id from the title (looks like ANL-…). You will paste it into messenger and audit cases later.

**Pass:** Mode is SKILL_MATCH; evidence includes SKILL, MONITOR and IMPROVEMENT; how-to-improve chatbot can pull/add/challenge/regenerate; analysis id is written in your notes.
**Evidence:** analysis id; screenshot of the mode badge, evidence types, and the how-to-improve chatbot.

### UAT-04 — Second AI challenges the first AI on serious alarms

- **Severity:** Critical · **BU:** AI + Risk Owner · **Depends:** UAT-03 or any BREACH/CRITICAL analysis · **Window:** T+37m / 15m
- **Covers:** AI Analyses
- **Why:** One model can be over-confident. On BREACH or CRITICAL we need an independent second opinion before a human accepts the story.
- **Goal:** Open a high-severity analysis and confirm the challenger panel, verdict, and at least one high-priority improvement are present.

**Steps**

1. Stay on AI Analyses. Open a BREACH or CRITICAL row (or click Simulate CRITICAL if you need a fresh one).
2. In the list, the row should show a “2nd AI” badge with a verdict such as AGREE, PARTIAL or DISAGREE.
3. On the detail page find the panel titled Second AI challenger (model name crmp-challenger-v0).
4. Read it in plain language: what it likes, what it doubts, and the suggested improvements. If the verdict is PARTIAL or DISAGREE, it should say a human must review (needs_human).
5. Evidence vault must contain a CHALLENGER row so the debate is stored, not only shown on screen.

**Pass:** Challenger panel is visible with a verdict; at least one HIGH improvement; CHALLENGER evidence row exists.
**Evidence:** challenge id and verdict; screenshot of the improvements list.

### UAT-05 — A WARN-only case must not call the second AI

- **Severity:** High · **BU:** AI · **Depends:** UAT-02; default second-AI threshold = BREACH · **Window:** T+52m / 10m
- **Covers:** AI Analyses
- **Why:** Second AI costs time. It should stay quiet on ordinary warnings so operators are not flooded.
- **Goal:** Simulate a WARN equity/drawdown path and confirm the challenger did not run.

**Steps**

1. On AI Analyses click “Simulate EQ drawdown (RAG path)” (WARN).
2. Open the new analysis.
3. The Second AI panel should say it was not run (or there is no 2nd AI verdict badge).
4. Evidence vault should not have a CHALLENGER row for this WARN-only sample.

**Pass:** No challenger row on the WARN sample while the threshold is still BREACH.
**Evidence:** analysis id; screenshot of the “Not run” challenger panel.

### UAT-06 — When no skill fits, the AI reasons from the knowledge base

- **Severity:** High · **BU:** AI + Risk · **Depends:** RAG corpus seeded · **Window:** T+62m / 12m
- **Covers:** AI Analyses, RAG Knowledge Base
- **Why:** Not every alarm has a canned playbook. The desk still needs a readable explanation plus sources.
- **Goal:** Run the RAG path and confirm the analysis is marked RAG_REASONING with at least one explanation and some evidence.

**Steps**

1. Use the EQ WARN / RAG simulate button, or open an analysis whose indicator has no certain skill match.
2. Confirm the mode badge is RAG_REASONING (meaning “we retrieved documents and reasoned”, not a skill hit).
3. Read at least one explanation / hypothesis in ordinary language.
4. Evidence vault is not empty — expect MONITOR and/or EXTERNAL/RAG document rows. Optionally open RAG Knowledge Base and confirm those document titles exist.

**Pass:** Mode RAG_REASONING; at least one explanation; evidence present.
**Evidence:** analysis id; mode badge; evidence list screenshot.

### UAT-07 — Messenger — pull the evidence pack into the chat

- **Severity:** High · **BU:** Risk · **Depends:** UAT-03/04; Demo Messenger · **Window:** T+74m / 12m
- **Covers:** Demo Messenger, AI Analyses
- **Why:** Risk staff should not have to leave the conversation to see why the AI said what it said.
- **Goal:** From Demo Messenger, put the evidence vault into the same thread and prove the admin link works.

**Steps**

1. Open Demo Messenger (left pane → Response). On GitHub Pages the URL is /PRD/crmp-admin/admin/messenger/.
2. The left column is the inbox. You should already see seeded chats. If it is empty, click Sync alerts and wait until at least one OPEN thread appears.
3. Click a serious (BREACH/CRITICAL) thread. In the transcript you should see coloured bubbles: ALERT (the alarm), often AI_REPORT (the first AI write-up), sometimes ESCALATION.
4. Click Show evidence. A new EVIDENCE bubble must appear in the same thread within about 10 seconds.
5. Read that bubble: it should list vault lines (monitor snapshot, RAG, or external). Click Open in admin — it must open the matching AI analysis, not a 404, and not drop the /PRD/crmp-admin prefix on Pages.

**Pass:** EVIDENCE message appears; Open in admin shows the matching analysis pack.
**Evidence:** thread id; screenshot of the EVIDENCE bubble and the analysis page it opened.

### UAT-08 — Messenger — argue with the bot in the same thread

- **Severity:** High · **BU:** Risk Analyst + Risk Owner · **Depends:** UAT-07; open messenger thread · **Window:** T+86m / 10m
- **Covers:** Demo Messenger, AI Analyses
- **Why:** Operators must be able to say “I disagree” without opening a separate ticket system.
- **Goal:** Type a challenge in the composer and confirm the bot replies and flags the case for a human.

**Steps**

1. Stay in the same OPEN thread.
2. In the chat box at the bottom type exactly this idea in your own words, e.g. “I disagree with the AI — please review feed integrity”. Click Send.
3. Your message appears on the right (USER). A CHATBOT reply should appear underneath, acknowledging the challenge.
4. If the thread is linked to an analysis, open that analysis (Open in admin) and confirm it is flagged for human review (needs_human, or explicit “human review” wording).

**Pass:** USER + CHATBOT pair recorded; linked analysis asks for human review.
**Evidence:** Screenshot of the USER/CHATBOT pair; analysis human-review state.

### UAT-09 — Messenger — escalate up the decision chain

- **Severity:** High · **BU:** Risk · **Depends:** Escalation routes seeded; open thread · **Window:** T+96m / 10m
- **Covers:** Demo Messenger, Escalation Routes
- **Why:** Serious cases must move to the next accountable team with a visible SLA, not a private phone call.
- **Goal:** Click Escalate twice and show that the step number, team and path text all move forward.

**Steps**

1. On an OPEN thread click Escalate.
2. A new ESCALATION bubble should name: which step you are on (for example 1 of 4), which team owns it now, the SLA (minutes), and the full path (desk → credit → Risk Owner → exec).
3. Click Escalate again. The step index must increase and the target team must change toward Risk Owner / Exec.
4. Optional: open Escalation Routes in the left pane and confirm the same path name exists as a configured route.

**Pass:** Two escalations produce increasing step numbers; path text names the next owners.
**Evidence:** Screenshots after step 1 and step 2; route name in notes.

### UAT-10 — Messenger — dismiss a false alarm

- **Severity:** Medium · **BU:** Risk · **Depends:** Separate OPEN WARN thread (do not use the Critical sample) · **Window:** T+106m / 8m
- **Covers:** Demo Messenger, Live Alerts
- **Why:** Noise must be closable in one click, with an audit trail, so real breaches are not buried.
- **Goal:** On a disposable WARN thread, dismiss it as a false alarm and confirm the chat and the linked alert both close.

**Steps**

1. Pick a different OPEN WARN thread — not the BREACH you still need for later cases.
2. Click Dismiss (false alarm).
3. The thread status badge becomes DISMISSED. The action buttons (Show evidence, Escalate, Dismiss, Close) should disable.
4. If you are on localhost, open Live Alerts and confirm the linked alarm is CLOSED (or equivalent). On the public snapshot, the SYSTEM bubble saying the alert closed is enough.

**Pass:** Thread DISMISSED; linked alert closed or SYSTEM message says so; action audited on localhost.
**Evidence:** thread id before/after; Audit MESSENGER_DISMISS on localhost.

### UAT-11 — Messenger — close the case after accepting the AI pack

- **Severity:** Critical · **BU:** Risk Owner · **Depends:** UAT-04 dual-AI pack reviewed on a BREACH thread · **Window:** T+114m / 10m
- **Covers:** Demo Messenger, AI Analyses
- **Why:** The Risk Owner needs a clean “we accept this explanation” button that does not delete the evidence.
- **Goal:** Close a reviewed BREACH thread and confirm the AI analysis still holds the challenger pack.

**Steps**

1. Open a BREACH thread whose dual-AI pack you already read (not the dismissed WARN).
2. Click Close (accept AI).
3. Status becomes CLOSED. Buttons for evidence/escalate/dismiss/close disable.
4. Click Open in admin (or reopen the analysis from AI Analyses). Evidence vault and the second-AI panel must still be there — closing the chat must not wipe the science pack.

**Pass:** Thread CLOSED; analysis evidence retained; localhost Audit shows MESSENGER_CLOSE.
**Evidence:** thread id; analysis detail still showing the challenger panel.

### UAT-12 — Messenger — propose a control, double-check, then send to admin

- **Severity:** Critical · **BU:** Ops + Risk Owner · **Depends:** OPEN thread; Human Intervention page · **Window:** T+124m / 15m
- **Covers:** Demo Messenger, Human Intervention
- **Why:** Freezing an account is dangerous. The chat must ask “are you sure?” and may need a second person (checker) before anything is sent to Vantage admin.
- **Goal:** From Recommended actions, block an account with a two-step confirm and follow the checker path when the system asks.

**Steps**

1. Open (or Sync) an OPEN thread that still shows Recommended actions at the bottom: Block user account, Halt trading, Cut max leverage, and similar.
2. Click Block user account. A proposal card appears (ACTION_PROPOSAL / “Confirm …”).
3. Click Double-confirm… then Yes, send to Vantage admin. You should get an ACTION_RESULT with an admin reference number and a link to Human Intervention.
4. If the card says a checker is needed, either click Checker approve (demo) or Open admin and finish it on Human Intervention.
5. Open Human Intervention from the left pane and find the same reference. Prototype note: a simulated admin_ref is acceptable; a real freeze is out of scope.

**Pass:** Admin ref created; confirm gate shown before send; checker follow-up when required.
**Evidence:** admin_ref; screenshots of proposal → confirm → result.

### UAT-13 — AI Admin — the person who proposes a change cannot approve it

- **Severity:** Critical · **BU:** AI Engineer + Risk Owner · **Depends:** Two distinct users with ai.admin / checker capability · **Window:** T+139m / 20m
- **Covers:** AI Admin, Users, Audit Log
- **Why:** A single engineer must not silently retune models or thresholds that drive live RCA.
- **Goal:** Propose a harmless setting as Maker, fail to self-approve, then approve as a different Checker.

**Steps**

1. Sign in as the AI Engineer (ai.engineer@vantagemarkets.com / ai123) if that seed user exists; otherwise use a second admin account.
2. Open AI Admin. Propose a harmless change (for example a comment on a model row, or a threshold you will revert).
3. Try to approve the same change while still that user. The UI must refuse.
4. Sign in as a different checker-capable user (Risk Owner or Super Admin).
5. Approve the pending change. Confirm it applies only after that second approval.
6. On localhost, open Audit Log and find both the propose and the approve rows (two different actors).

**Pass:** Self-approve blocked; distinct checker succeeds; audit shows maker and checker.
**Evidence:** Change request id; Audit entries for propose + approve.

### UAT-14 — Market Intelligence — Scan now must finish (including on GitHub Pages)

- **Severity:** Medium · **BU:** Risk + AI · **Depends:** market_intel.enabled=true · **Window:** T+159m / 12m
- **Covers:** Market Intelligence, Demo Messenger
- **Why:** The 5-minute news scan is how LP-moving headlines reach messenger. A stuck “Failed” button hides risk.
- **Goal:** Click Scan now and get either a scan id (localhost) or a clear read-only snapshot message (Pages) — never a blank failure.

**Steps**

1. Open Market Intelligence.
2. Confirm the pulse panel: a past-hour headline, a past-24h headline, and sentiment bars for core Vantage instruments (EURUSD, XAUUSD, NAS100, BTCUSD and the rest of the desk book).
3. Click Scan now.
4. On localhost: a success line with a scan_id should appear even if zero new findings (duplicates in the 5-minute bucket are OK). If a source times out, the scan still finishes or shows a plain-English error — not a silent fail.
5. On the GitHub Pages snapshot: Scan now must explain that the snapshot is read-only and still show seeded findings. It must not sit on HTTP 405/404 from a missing /api. Pulse windows may be anchored to the latest finding if the snapshot is older than 24h.
6. Open the Findings tab and the Messenger outbox tab. Cards should still render (headline, product, impact — not “violation”). Each card shows a region flag, timestamp, and source **article** URLs (not a channel homepage). Clicking a pulse headline should jump to that finding.

**Pass:** Scan produces a scan_id locally, or a clear snapshot message on Pages; the board never stays on “Failed”.
**Evidence:** scan_id or snapshot message; screenshot of findings or the empty-scan log.

### UAT-15 — AI must not be allowed near human-only data

- **Severity:** High · **BU:** System + Security · **Depends:** AI access blocklist seeded · **Window:** T+171m / 10m
- **Covers:** AI Access Security
- **Why:** Passwords, HR fields and similar must stay on a blocklist so a future agent cannot read them.
- **Goal:** Review the AI Access Security page and confirm pages, functions and fields each list human-only items with a reason.

**Steps**

1. Open AI Access Security (Platform group).
2. Look at the three sections: pages, functions, fields.
3. Search or scan for a sensitive example such as users.password (or equivalent).
4. Every blocked item should have a short reason in plain English (why AI is denied).
5. Record that production IAM must not grant these to any AI identity.

**Pass:** Blocklist UI lists human-only items with reason text; at least one sensitive field example is present.
**Evidence:** Screenshot of blocklist rows; counts of page/function/field items.

### UAT-16 — Audit Log and Spine tell the same story as messenger

- **Severity:** High · **BU:** System · **Depends:** UAT-07 through UAT-12 performed · **Window:** T+181m / 15m
- **Covers:** Audit Log, Admin Home spine
- **Why:** If chat actions vanish from the audit trail, we cannot reconstruct a decision after the fact.
- **Goal:** Match at least one escalate and one control-confirm from messenger to Spine and/or Audit.

**Steps**

1. Open Audit Log. Look for recent rows whose action looks like MESSENGER_* or AI_* (escalate, dismiss, close, confirm).
2. Open Spine Log. Look for stages such as AI_RCA, ESCALATION, INTERVENTION.
3. Pick one messenger escalate and one “send to admin” confirm from earlier cases. Find matching timestamps (within about one minute) and reference ids.
4. You should be able to explain in one sentence: “this chat action became that spine/audit row”.

**Pass:** At least one escalate and one control confirm visible in Audit and/or Spine with matching refs.
**Evidence:** Event ids; screenshot pair Audit + Spine.

### UAT-17 — English and Traditional Chinese documentation both render

- **Severity:** Low · **BU:** All · **Depends:** Docs published under /admin/docs/* · **Window:** T+196m / 10m
- **Covers:** User Guide, PRD, TSD, UAT Checklist, Ecosystem Eval
- **Why:** The Hong Kong desk must be able to run UAT and read the handbook in 繁中.
- **Goal:** Toggle EN / 繁體中文 on User Guide, PRD, TSD, Ecosystem Eval and this UAT page without 404s.

**Steps**

1. Open User Guide. Use the English / 繁體中文 buttons on the article (and the left-pane EN / 繁中 if you want chrome translated too).
2. Repeat for PRD, TSD, Ecosystem Eval, and this UAT page.
3. Body text must actually switch — not only the page title. A missing-file stub fails the case.

**Pass:** Both languages render for each listed doc; no missing-file stub.
**Evidence:** Tick-list of URLs tested in EN and ZH.

### UAT-18 — Phone-width smoke test (~390px)

- **Severity:** Medium · **BU:** All · **Depends:** Responsive admin shell · **Window:** T+206m / 15m
- **Covers:** Admin Home, Demo Messenger, AI Analyses
- **Why:** On-call staff will open messenger from a phone. Overflow or a broken drawer makes the desk unusable.
- **Goal:** At about 390px width, open the menu, use messenger list→thread→back, and read an AI analysis.

**Steps**

1. Resize the browser to about 390px wide (or use device emulation).
2. On Admin Home, tap the hamburger. The left drawer opens. The page itself must not scroll sideways.
3. Open Demo Messenger. You should see the thread list first. Open a thread, then tap Threads (back) to return to the list.
4. Open an AI analysis detail. The second-AI sections should stack vertically. Primary buttons must still be tappable.

**Pass:** Drawer works; messenger master-detail works; no document-level horizontal overflow.
**Evidence:** Mobile screenshots of drawer, messenger list, messenger thread, AI detail.

### UAT-19 — Every serious analysis in this UAT window has a second AI

- **Severity:** Medium · **BU:** Risk Owner · **Depends:** UAT-04 samples in window · **Window:** T+221m / 10m
- **Covers:** AI Analyses
- **Why:** A single unchallenged BREACH is an exit-criteria miss, even if yesterday’s samples were fine.
- **Goal:** Count BREACH/CRITICAL analyses created during UAT and prove each has a challenger verdict (backfill allowed).

**Steps**

1. On AI Analyses, list items with severity BREACH or CRITICAL that you created (or that appeared) during this sitting.
2. Each row must show a 2nd AI badge that is not “pending”.
3. If any are pending, click Backfill 2nd AI challenges, wait, and re-check.

**Pass:** 100% of BREACH/CRITICAL samples in the UAT window have a challenger verdict.
**Evidence:** Count of BREACH/CRITICAL vs challenged count.

### UAT-20 — Skill cards stay short; Enter opens the full playbook

- **Severity:** High · **BU:** Risk + AI · **Depends:** Skills catalog seeded · **Window:** T+231m / 12m
- **Covers:** AI Skills
- **Why:** A wall of SKILL.md on every card is unreadable. Operators need a compact list plus a real handbook page.
- **Goal:** From AI Skills, Enter two skills and read when-to-use, prechecks, evidence, stop and success.

**Steps**

1. Open AI Skills. Cards should still show the linked indicator, thresholds, fault areas and escalation — not the full essay.
2. Find SKILL-ABOOK-RATIO (A-book ratio drift). Click Enter (do not rely on expand-in-place alone).
3. On the detail page read: When to use, When not to use, Prechecks, Playbook steps, Evidence, Stop conditions, Success criteria, and a worked example.
4. Go back to the list and Enter a second skill (for example SKILL-MARGIN-SPIKE).

**Pass:** Enter navigates to /admin/skills/{code}/; both skills show the full playbook sections; the list stays usable.
**Evidence:** Screenshot of a card plus two detail pages.

### UAT-21 — Messenger “Open in admin” lands on a real analysis

- **Severity:** High · **BU:** Risk · **Depends:** UAT-07; public Pages URL · **Window:** T+243m / 8m
- **Covers:** Demo Messenger, AI Analyses
- **Why:** A 404 here is how the public snapshot broke last time — the operator cannot see RCA or the second AI.
- **Goal:** From a BREACH thread, follow Open in admin and see explanations, evidence and the challenger.

**Steps**

1. In Demo Messenger open a BREACH thread.
2. Click Open in admin (or the analysis link inside the ALERT / AI_REPORT bubble).
3. The address must be under /admin/ai-analyses/{id}/ (on Pages: /PRD/crmp-admin/admin/ai-analyses/{id}/).
4. Explanations, Evidence vault and the 2nd AI panel must render. An empty “snapshot missing” page fails unless you used a fake id.

**Pass:** No 404; analysis pack visible; Pages URL keeps the /PRD/crmp-admin prefix.
**Evidence:** URL-bar screenshot plus analysis detail.

### UAT-22 — Unread counts on the left pane (messenger-style)

- **Severity:** Medium · **BU:** All · **Depends:** Left nav shell · **Window:** T+251m / 8m
- **Covers:** Admin Home, Live Alerts, Demo Messenger, Market Intelligence
- **Why:** Operators should see “something new happened” without opening every tab.
- **Goal:** Show rose badges on tabs with new/open work; opening a tab clears only that tab’s number.

**Steps**

1. Hard-refresh Admin Home, or use a private window, so previous “I already saw this” marks are empty.
2. Rose numbers should appear next to Live Alerts, AI Analyses, Demo Messenger, Market Intelligence and other tabs that have open work.
3. Open Live Alerts — that badge drops to zero. Other badges stay.
4. Open Demo Messenger — that badge drops to zero.
5. Go away and come back: cleared badges stay at zero unless a new Scan / Analyse / Sync created more work.

**Pass:** Badges match open/new work; viewing a tab clears that tab only.
**Evidence:** Before/after screenshots of the left pane.

### UAT-23 — Knowledge tree shows how domains, skills and documents connect

- **Severity:** Medium · **BU:** AI + Risk · **Depends:** RAG + skills seeded · **Window:** T+259m / 10m
- **Covers:** Knowledge Tree, AI Skills, RAG Knowledge Base
- **Why:** A flat skill list hides whether COPY, margin and LP hedge knowledge actually link together.
- **Goal:** Open the tree, expand a domain, Enter a skill, and follow a RAG document into the library.

**Steps**

1. Open Knowledge Tree from the left pane (AI & knowledge).
2. Confirm counts for domains, skills, linked timelines and RAG docs are non-zero.
3. Expand a domain (for example LP_HEDGE) and click a skill code. It must open the full playbook (same as UAT-20).
4. Click a RAG document link and land on RAG Knowledge Base (or a document in it).

**Pass:** Tree renders; skill links open playbooks; RAG links open the library.
**Evidence:** Screenshot of the tree plus the destination playbook.

### UAT-24 — Traditional Chinese covers chrome, messenger, skills and docs

- **Severity:** High · **BU:** All · **Depends:** EN / 繁中 toggle in shell · **Window:** T+269m / 12m
- **Covers:** Admin Home, Demo Messenger, AI Skills, UAT Checklist
- **Why:** Switching to 繁中 used to translate only the login screen. Operators need the whole desk.
- **Goal:** Click 繁中 and walk Home, Alerts, Skills, Messenger, Market Intelligence, Knowledge Tree, UAT and PRD.

**Steps**

1. Click 繁中 in the left pane.
2. Walk Admin Home, Live Alerts, AI Skills, a skill Enter page, Demo Messenger, Market Intelligence, Knowledge Tree, this UAT page and PRD.
3. Titles, subtitles and primary buttons should be Traditional Chinese.
4. On docs, click 繁體中文 if a second toggle exists; the markdown body must switch.
5. Switch back to EN. English returns without a refresh loop.

**Pass:** No page stays fully English while 繁中 is selected, except raw monitor IDs, codes and seeded event titles.
**Evidence:** Screenshot pair EN vs 繁中 on Home, Skills, Messenger, a doc.

### UAT-25 — URL catalog lists the public pages (including new ones)

- **Severity:** Medium · **BU:** System · **Depends:** URL catalog · **Window:** T+281m / 8m
- **Covers:** URL Catalog, AI Skills, Knowledge Tree, Demo Messenger
- **Why:** Operators should not have to guess paths for skill detail, knowledge tree or messenger.
- **Goal:** From the URL catalog, find Skills, skill playbook detail, Knowledge Tree, Demo Messenger and Market Intel.

**Steps**

1. Open URL Catalog (Docs group).
2. Find rows for AI Skills, Skill playbook detail (/admin/skills/[code]), Knowledge Tree, Demo Messenger, Market Intelligence.
3. Open a skill detail by replacing [code] with SKILL-ABOOK-RATIO, or use AI Skills → Enter.
4. Confirm the catalog still states the public GitHub Pages origin (hxyan2020.github.io/PRD/crmp-admin).

**Pass:** New routes are listed and reachable; Pages origin is visible.
**Evidence:** Catalog rows screenshot.

### UAT-26 — Tell the messenger loop out loud, in plain English

- **Severity:** Medium · **BU:** Risk + System · **Depends:** Messenger + alerts + spine · **Window:** T+289m / 12m
- **Covers:** Demo Messenger, Admin Home spine, Audit Log, AI Analyses
- **Why:** If a Risk Owner cannot narrate alarm → inbox → AI pack → control → audit, the demo is only a screenshot.
- **Goal:** Using only the seeded demo, point at each bubble and then find the same case on Spine and Audit.

**Steps**

1. Start at Demo Messenger. Point at the ALERT bubble and say which Monitor indicator fired (code or name).
2. Point at the AI_REPORT bubble. Open it in admin. Say whether this was a skill playbook or RAG reasoning.
3. If BREACH/CRITICAL, point at the 2nd AI verdict (AGREE / DISAGREE / MIXED).
4. Run Show evidence, then Escalate once. On a disposable WARN you may Dismiss; on a reviewed BREACH you may Close.
5. Open Spine Log and Audit Log and find the matching events. Describe them in ordinary language, not only raw codes.

**Pass:** Operator can explain the loop without Lark API credentials; spine/audit show the same case.
**Evidence:** Notes of thread id, analysis id, spine event ids.

### UAT-27 — Admin Home — cards, shortcuts and platform owner

- **Severity:** Medium · **BU:** System + Risk Owner · **Depends:** UAT-01 · **Window:** T+301m / 10m
- **Covers:** Admin Home, Daily Performance, Users, URL Catalog
- **Why:** Home is the map of the desk. Dead cards and a missing owner make the prototype look unowned.
- **Goal:** Click through Home stats and confirm they open the right pages; owner line names demo platform owner.

**Steps**

1. Open Admin Home.
2. Read the platform owner line (demo platform owner / haixiang.yan@hytechc.com) on the home panel and in the left-pane footer.
3. Click these stat cards and confirm the destination: Users, Teams, Data Sources, Risk Domains, Open Alerts (Live Alerts), Open Tickets (Monitor 2.0), Lark channels, Escalation routes.
4. Click a department card (should open that team’s working page), a recent-alert row (Live Alerts, that alarm highlighted), and a jump tile. Header shortcuts: Demo Messenger, User Guide, Daily Performance. None should 404.
5. If you are still a public visitor, the guest banner and Sign in control should be visible; after login they should change.

**Pass:** Every Home card/shortcut that claims a page actually opens it; owner attribution is visible.
**Evidence:** Screenshot of Home plus one card destination; owner line visible.

### UAT-28 — Daily Performance — CFD and Crypto desk numbers

- **Severity:** Medium · **BU:** Risk · **Depends:** UAT-01; daily dashboard seeded · **Window:** T+311m / 10m
- **Covers:** Daily Performance
- **Why:** The morning meeting needs yesterday’s CFD vs Crypto health in one place, not a spreadsheet.
- **Goal:** Open Daily Performance and confirm a report date, CFD block, Crypto block and a short summary exist.

**Steps**

1. Open Daily Performance from the left pane (or the Home shortcut).
2. Note the report date at the top. It must be a real date, not blank.
3. Confirm two product blocks: CFD and Crypto. Each should list metrics (value, target or status such as OK/WARN/BREACH).
4. Read the summary counts of WARN/BREACH per product. They should match the colour of the metric rows at a glance.
5. On localhost, if a Refresh control exists, click it once and confirm the page still renders (Pages may explain read-only).

**Pass:** Report date present; CFD and Crypto sections populated; summary counts visible.
**Evidence:** Screenshot of Daily Performance with both product blocks.

### UAT-29 — Risk Log Analytics — what actually moved P&L / clients

- **Severity:** Medium · **BU:** Risk · **Depends:** UAT-02 · **Window:** T+321m / 10m
- **Covers:** Risk Log Analytics
- **Why:** Alarms without impact are noise. This page is where we judge whether a breach hurt anyone — and read the closed tracker pack, with a full-quarter historical view.
- **Goal:** Open Risk Log Analytics Overview and confirm 90-day historical charts (backfilled), closed-ticket cards (status, AI analysis, BU/AI action log, mandated solution), plus impact rows with product/domain context.

**Steps**

1. Open Risk Log Analytics (Overview).
2. You should see summary tiles, **historical charts spanning ~90 days** (alerts/open book, loss vs prevented, handling latency — not a flat single-day spike), domain bars, and a Closed alerts & tickets list — not a blank white page.
3. Optionally open the Historical charts tab and confirm the same series.
4. Expand one closed card. Write down: ticket-closed status, the AI analysis summary, at least one AI or BU action-log line, and the mandated final solution (who mandated it).
5. Confirm the same alert id is not still sitting on Realtime Alert as an open card.

**Pass:** Overview shows ~90-day charts plus closed tracker cards with ticket-closed + AI + action log + mandated solution; at least one card can be explained in plain English.
**Evidence:** Screenshot of Risk Log Overview showing historical charts and one closed card expanded.

### UAT-30 — Live Alerts — read the queue and acknowledge one

- **Severity:** High · **BU:** Risk · **Depends:** UAT-02; Live Alerts list · **Window:** T+331m / 10m
- **Covers:** Live Alerts
- **Why:** The operational queue is not messenger. Someone on the desk must be able to ack an alarm in admin.
- **Goal:** Find an OPEN alert, read its Monitor id and ticket, and acknowledge it (localhost) or explain why Pages is read-only.

**Steps**

1. Open Live Alerts. Confirm only still-open cards show, with severity, status, product, domain, Monitor id, ticket id and a short message. Closed tickets must not appear here.
2. Find an OPEN row. Read the message out loud: what broke, and which indicator.
3. Confirm a button/link “View closed alerts in Risk Log Analytics” is visible and opens `/admin/risk-log`.
4. On localhost, click Acknowledge. After refresh the status should become ACKNOWLEDGED (or similar) and the button should disappear for that row.
5. On the GitHub Pages snapshot, Acknowledge may not persist (no API). Pass if the button is present for operators and the list still shows seeded OPEN alarms; fail if the page is empty or mixes in closed tickets.

**Pass:** Open-only queue is readable. Closed-log button reaches Risk Log. Localhost ack changes status. Pages still shows seeded open alerts.
**Evidence:** Screenshot before/after ack (localhost) or the seeded queue (Pages).

### UAT-31 — Detectors — run the pack and see WARN/BREACH land

- **Severity:** High · **BU:** Risk + AI · **Depends:** UAT-02; detectors seeded · **Window:** T+341m / 12m
- **Covers:** Detectors, Live Alerts, AI Analyses
- **Why:** Detectors are the scheduled rules behind Monitor. If “Run all” does nothing, the demo cannot create fresh work.
- **Goal:** Open Detectors, run all, and confirm last-run status plus a new alert and/or analysis when a rule fires.

**Steps**

1. Open Detectors. You should see a table of rules (code, product, last status, last run time).
2. On localhost click Run all detectors. Wait until the page refreshes or a success line appears.
3. At least some rows should show last status OK, WARN or BREACH — not all blank.
4. If any WARN/BREACH fired, open Live Alerts and/or AI Analyses and look for a matching new row. The left-nav unread badge on those tabs may also tick up.
5. On Pages, Run all may be demo/read-only. Pass if the registry is populated and the control explains itself; fail if the page is empty.

**Pass:** Detector registry populated; localhost run completes; WARN/BREACH (if any) show up downstream.
**Evidence:** Screenshot of detector table plus a downstream alert/analysis if one fired.

### UAT-32 — Risk domains catalogue with P0–P3 scenarios

- **Severity:** Low · **BU:** Risk · **Depends:** UAT-01 · **Window:** T+353m / 8m
- **Covers:** Risk Domains
- **Why:** Every alarm is tagged with a domain. Domains must break into concrete scenarios hooked to Monitor 2.0 indicators — otherwise RACI and telemetry are fiction.
- **Goal:** Open Risk Domains; confirm P0–P3 colours, detailed scenarios, and Monitor 2.0 indicator links.

**Steps**

1. Open Risk Domains.
2. Confirm domains include the original set plus SYSTEMIC_FIRM (P0), THIRD_PARTY_VENDOR (P3), REPUTATION_COMMS (P3).
3. Confirm priority pills use distinct colours: P0 rose, P1 orange, P2 amber, P3 slate.
4. Expand one scenario under Credit & Client Risk (e.g. margin utilisation). Read How it works, Participants, Impacts.
5. Click a primary indicator chip (e.g. M2-MRG-014) and confirm it opens Monitor 2.0 anchored to that monitor.
6. From Home, the Risk Domains stat card should land here.

**Pass:** ≥13 domains with owners; scenarios show P0–P3 colours; every expanded scenario lists Monitor 2.0 chips that navigate correctly.
**Evidence:** Screenshot of an expanded scenario with coloured priority and indicator chips.

### UAT-33 — Messenger inbox — channels, kinds and Sync

- **Severity:** High · **BU:** Risk · **Depends:** UAT-07 · **Window:** T+361m / 12m
- **Covers:** Demo Messenger
- **Why:** The first 10 seconds in messenger decide whether this feels like Lark or like a random log dump.
- **Goal:** Show a working inbox: multiple threads, severity/status chips, channel names, ALERT/AI_REPORT/ESCALATION bubbles, and Sync.

**Steps**

1. Open Demo Messenger. Left column lists threads. Each row should show a severity chip, a status chip (OPEN/CLOSED/…), a title, a channel name (for example Risk Control Desk) and a message count.
2. Click two different threads. The right pane title and channel badge must change.
3. In at least one transcript, point to an ALERT bubble, an AI_REPORT bubble, and (if present) an ESCALATION bubble. Say in one sentence what each colour means.
4. Click Sync alerts. You should get a status line such as “Synced N new alert(s)…” or a calm “nothing new”. The list must not wipe existing threads.
5. If the list was empty before Sync, it must not stay empty after Sync on localhost (seeded alerts exist).

**Pass:** Inbox looks like a messenger: chips, channels, at least two thread kinds, Sync does not destroy history.
**Evidence:** Screenshot of the inbox plus one open transcript showing ALERT and AI_REPORT.

### UAT-34 — Messenger — other recommended actions and cancel

- **Severity:** High · **BU:** Ops + Risk · **Depends:** UAT-12; OPEN thread with recommended actions · **Window:** T+373m / 12m
- **Covers:** Demo Messenger, Human Intervention
- **Why:** Block account is not the only lever. Halt, leverage, spread and copy-pause must be visible, and a mistaken proposal must be cancellable.
- **Goal:** Propose Halt trading or Cut max leverage, cancel one proposal, and confirm a second proposal can still be double-confirmed.

**Steps**

1. On an OPEN thread, look at Recommended actions. You should see more than one button: Block user account, Halt trading (symbol), Cut max leverage, Pre-widen spreads, Pause copy joining — whichever the skill attached.
2. Click Halt trading (symbol) or Cut max leverage. A confirm card appears. Click Cancel (do not send). The card should disappear or show cancelled; no admin_ref is created.
3. Click a different action. This time proceed through Double-confirm… and Yes, send to Vantage admin (or Checker approve if asked).
4. Human Intervention should list the sent control, not the cancelled one.

**Pass:** At least two distinct recommended actions are offered; cancel does not send; a second action can still be confirmed.
**Evidence:** Screenshot of the recommended-action row plus cancel vs sent cards.

### UAT-35 — Human Intervention queue (the admin side of messenger controls)

- **Severity:** High · **BU:** Ops + Risk Owner · **Depends:** UAT-12 or UAT-34 · **Window:** T+385m / 10m
- **Covers:** Human Intervention
- **Why:** Checker and Ops need a dedicated queue, not only the chat card, when several controls are in flight.
- **Goal:** Open Human Intervention and find the control you sent from messenger, with status and a way to act.

**Steps**

1. Open Human Intervention from the left pane (Response group).
2. The list should show proposed or pending controls (account block, halt, leverage, …) with status such as PENDING, AWAITING_CHECKER, AWAITING_HUMAN.
3. Find the admin_ref or action from UAT-12/34. Confirm the same account/symbol/leverage detail is visible.
4. If a checker action is still open and you are allowed, complete or reject it. On Pages, read-only rows still count as Pass if the queue is populated.

**Pass:** Queue shows messenger-originated controls; at least one row matches a chat admin_ref.
**Evidence:** Screenshot of Human Intervention with the matching reference highlighted.

### UAT-36 — Lark Integration — channels vs the in-app messenger demo

- **Severity:** Medium · **BU:** System + Risk · **Depends:** UAT-01; lark channels seeded · **Window:** T+395m / 10m
- **Covers:** Lark Integration, Demo Messenger
- **Why:** Demo Messenger is the in-browser Lark. The Lark Integration page is where real channel names, webhooks and on/off live.
- **Goal:** Open Lark Integration, list enabled channels, and explain how they relate to the messenger inbox channel names.

**Steps**

1. Open Lark Integration (Response group).
2. You should see named channels (for example Risk Control Desk, oc_market_intelligence) with purpose, department, minimum severity and enabled flag.
3. Match at least one channel name to a thread’s channel badge in Demo Messenger.
4. Read the Lark settings block (webhook / app id placeholders). On localhost, Test notify may send a simulated ping; on Pages it should fail gracefully, not 404 the whole page.
5. Write one sentence: “Demo Messenger is the UI; this page is the channel directory for when real Lark is wired.”

**Pass:** At least three channels listed; one name matches messenger; the page does not crash on Pages.
**Evidence:** Screenshot of channel table plus a matching messenger badge.

### UAT-37 — Escalation routes registry

- **Severity:** Medium · **BU:** Risk · **Depends:** UAT-09 · **Window:** T+405m / 8m
- **Covers:** Escalation Routes
- **Why:** Messenger Escalate is only trustworthy if the path is a configured object with SLA, not free text.
- **Goal:** Open Escalation Routes and confirm named paths, steps, teams and SLAs that match what Escalate printed.

**Steps**

1. Open Escalation Routes.
2. Find a enabled route used by the demo (often a four-step path ending at Risk Owner / Exec).
3. Write down: route name, step count, first team, last team, SLA minutes.
4. Compare with the ESCALATION bubble from UAT-09. Names should match in spirit (desk → credit → owner → exec).

**Pass:** At least one enabled multi-step route with SLA; matches the messenger escalate text.
**Evidence:** Screenshot of the route plus the messenger ESCALATION bubble.

### UAT-38 — Organisation — departments, teams, users and roles

- **Severity:** Medium · **BU:** System + Risk Owner · **Depends:** UAT-01 · **Window:** T+413m / 15m
- **Covers:** BU and Teams, Users, Roles & Permissions
- **Why:** RACI, on-call and RBAC all come from these four pages. Empty org data makes Home counts a lie.
- **Goal:** Walk Departments → Teams → Users → Roles and confirm seeded people, including the Risk Owner and a Viewer.

**Steps**

1. Open Departments. Each department should have a code, name and a one-line responsibility (the RACI you saw on Home).
2. Open Teams. Confirm teams belong to departments and list members or a count.
3. Open Users. Find risk.owner@vantagemarkets.com and viewer@vantagemarkets.com (and, if present, haixiang.yan@hytechc.com). Roles must differ.
4. Open Roles & Permissions. Confirm RISK_OWNER can enter admin and VIEWER cannot operate AI Admin — this is the policy behind UAT-01.
5. Home Users/Teams counts should match what you just counted (allowing for seed size).

**Pass:** Four org pages populated; Risk Owner and Viewer exist with different roles; Home counts are in the same ballpark.
**Evidence:** Screenshots of Users and Roles highlighting the two test accounts.

### UAT-39 — Data sources registry (internal and external)

- **Severity:** Low · **BU:** System · **Depends:** UAT-01 · **Window:** T+428m / 8m
- **Covers:** Data Sources
- **Why:** Market intel, Monitor and RAG all claim sources. This page is the inventory.
- **Goal:** Open Data Sources and confirm named feeds with type (internal/external) and a status.

**Steps**

1. Open Data Sources (or click the Home card).
2. The list should include both internal systems (Monitor 2.0, trading DB) and external/public sources used by Market Intelligence.
3. Pick one internal and one external row. Write name, type and whether it is enabled.
4. A totally empty registry fails — Home advertised a non-zero count.

**Pass:** Non-empty registry with at least one internal and one external source.
**Evidence:** Screenshot of the source list with two rows marked.

### UAT-40 — Platform settings are grouped (not a flat dump)

- **Severity:** Medium · **BU:** System · **Depends:** UAT-01; settings.manage or read · **Window:** T+436m / 10m
- **Covers:** Platform Settings
- **Why:** A single alphabetical list of keys is how operators miss lark.* vs ai.* vs monitor2.*.
- **Goal:** Open Platform Settings and confirm logical groups such as Platform identity, Monitor 2.0, AI analysis, Market intelligence, Messenger/Lark, Escalation & SLA.

**Steps**

1. Open Platform Settings.
2. You should see section headings, not one undifferentiated table. Expected groups include Platform identity, Monitor 2.0, AI analysis, Market intelligence, Messenger / Lark, Escalation & SLA.
3. Inside AI analysis, find the second-AI severity threshold (ai.second_opinion_severity). It should be BREACH unless someone changed it in UAT-13 — that is the switch behind UAT-05.
4. Do not save a production-unsafe value. If you change anything, revert it.

**Pass:** Settings render in named groups; second-AI threshold key is findable.
**Evidence:** Screenshot of the grouped settings page with the AI section visible.

### UAT-41 — RAG Knowledge Base — browse the corpus the AI cites

- **Severity:** Medium · **BU:** AI + Risk · **Depends:** UAT-06; RAG seeded · **Window:** T+446m / 10m
- **Covers:** RAG Knowledge Base
- **Why:** If evidence says “see document X” but the library is empty, the RCA is theatre.
- **Goal:** Open RAG Knowledge Base, find at least two documents, and open one body or summary.

**Steps**

1. Open RAG Knowledge Base (AI & knowledge).
2. You should see a list or cards of documents (policies, playbooks, market notes).
3. Open one document (or expand it). Confirm a title and some body/summary text, not only a filename.
4. If search exists, search for a word you saw in a UAT-06 evidence row and confirm a hit or a clear no-results state.

**Pass:** At least two documents visible; one opens with readable text.
**Evidence:** Screenshot of the library plus one open document.

### UAT-42 — Improvement roadmap is readable

- **Severity:** Low · **BU:** All · **Depends:** Docs published · **Window:** T+456m / 8m
- **Covers:** Improvement Roadmap
- **Why:** UAT should know what is prototype vs later (live Lark webhooks, write adapters, HA).
- **Goal:** Open Improvement Roadmap and confirm phased items in plain English (and 繁中 if toggled).

**Steps**

1. Open Improvement Roadmap (Docs group). Counts should show 15 items and Critical / High tallies.
2. The scan list is expandable cards RM-01…RM-15 — each collapsed line says what operators get, plus effort and severity.
3. Expand RM-01 (Lark cards): Why, Today’s prototype (mock webhooks, POST /api/lark mock:true), What to build, Done when, If we skip, and links to Demo Messenger / Lark.
4. Expand RM-09: it must be tagged UAT out of scope (EXECUTED_MOCK — no live trading-bus write). Same for RM-05 (SSO).

**Pass:** Roadmap page renders with at least one phase and one out-of-scope note.
**Evidence:** Screenshot of the roadmap.

### UAT-43 — Public snapshot — Sign in works and stays on demo platform owner

- **Severity:** Critical · **BU:** System + Platform owner · **Depends:** Public snapshot or local login · **Window:** T+464m / 10m
- **Covers:** Login, Admin Home
- **Why:** The live github.io Sign in used to 404. The platform owner must be able to stay logged in on the snapshot.
- **Goal:** From the public guest banner, Sign in without 404 and remain signed in as demo platform owner after a refresh.

**Steps**

1. If you are on https://hxyan2020.github.io/PRD/crmp-admin/admin/, confirm the left pane says Public visitor / PUBLIC_GUEST before login.
2. Click Sign in. You must land on a Sign in form under /PRD/crmp-admin/login/ — never github.io/login and never 404.
3. Sign in as haixiang.yan@hytechc.com / yan123 (platform owner). Admin Home should show demo platform owner, not Public visitor.
4. Refresh the page. You should still be demo platform owner (demo session persist). Navigate to Demo Messenger and back; the name must not reset to guest.
5. On localhost the same accounts should work against the live API; a 401 with a readable error is a Fail.

**Pass:** Sign in URL is basePath-safe; session shows demo platform owner and survives refresh on the snapshot.
**Evidence:** URL-bar screenshot of /login plus Home showing demo platform owner after refresh.

### UAT-44 — Messenger — closed threads stay closed after refresh

- **Severity:** High · **BU:** Risk + System · **Depends:** UAT-11 or UAT-10 · **Window:** T+474m / 10m
- **Covers:** Demo Messenger
- **Why:** A chat that re-opens itself after reload is not a messenger; operators will duplicate Dismiss/Close.
- **Goal:** After Dismiss or Close, refresh (localhost) or switch threads and come back; status and disabled buttons must persist in the demo catalogue.

**Steps**

1. Use a thread you already Dismissed or Closed.
2. Confirm Show evidence / Escalate / Dismiss / Close are disabled, and Recommended actions / composer are hidden.
3. Click another thread, then click this one again. Status must still be DISMISSED or CLOSED.
4. On localhost, reload the browser. The same thread should still be closed (database). On Pages, the in-memory demo may reset after a full reload — note that as a snapshot limitation, but in-session switching must still persist.
5. Sync alerts must not resurrect the closed thread as a duplicate OPEN copy of the same alarm (one OPEN per alert is enough).

**Pass:** Closed/dismissed state survives thread switching; localhost survives reload; Sync does not clone a closed case.
**Evidence:** Screenshot of the disabled toolbar on a CLOSED thread after switching away and back.

### UAT-45 — Risk Owner exit sign-off

- **Severity:** Critical · **BU:** Risk Owner · **Depends:** UAT-01–44 results recorded · **Window:** T+484m / 15m
- **Covers:** UAT Checklist, Audit Log
- **Why:** UAT is not finished until someone accountable writes ACCEPT, ACCEPT WITH WAIVERS, or REJECT.
- **Goal:** Tally Critical/High results against the exit rules and file a signed decision.

**Steps**

1. Count Critical cases (including login, dual-AI, messenger close, maker≠checker, public Sign in). All must be Pass.
2. Count High cases. At most two may be WAIVE, each with a written sentence of risk acceptance.
3. Confirm dual-AI coverage (UAT-19), skill Enter (UAT-20), messenger evidence (UAT-07), and public Sign in (UAT-43) passed.
4. Record the overall decision: ACCEPT / ACCEPT WITH WAIVERS / REJECT, with today’s date and the name demo platform owner (or the delegated Risk Owner).
5. File the evidence pack link in Audit notes / share with PM. Session PASS/FAIL buttons on this page are only a live tally — they are not the sign-off.

**Pass:** Signed decision recorded; Critical 100% Pass; High waivers ≤2 if any.
**Evidence:** Sign-off note with date, Risk Owner name, waiver list (if any).

## Exit criteria

1. All **Critical** cases Pass.
2. At most **2 High** waived with written Risk Owner acceptance.
3. **100%** BREACH/CRITICAL samples in the UAT window have second-AI challenge (UAT-19).
4. **UAT-45** sign-off filed (ACCEPT / ACCEPT WITH WAIVERS / REJECT).
