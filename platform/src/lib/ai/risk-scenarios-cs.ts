import type { LinkedScenario, SkillScenario } from "@/lib/ai/scenario-types";

/**
 * Dedicated CS / TR SKILL.md playbooks.
 * Intake heuristics pick one of these codes; Knowledge Tree + RAG bind the rest.
 */
export const CS_SKILL_SCENARIOS: SkillScenario[] = [
  {
    code: "SKILL-CS-CLARIFY",
    name: "CS clarify thin or unclear client request",
    description:
      "24/7 CS playbook when C1 / form / email is too thin to act. Email the client, wait for a reply, never invent the ask.",
    indicator: {
      monitor_id: "M2-CS-UNCLEAR",
      name: "Unclear CS requests waiting (open)",
      product: "CFD+Crypto",
      domain: "CS_SERVICE",
      warn: 8,
      breach: 20,
      unit: "tickets",
      comparator: "gte",
      why: "A pile of unclear tickets means AI is guessing. Cap auto-mail at 3 and keep the case AWAITING_CLIENT until the client answers.",
    },
    related_indicators: ["M2-CS-ID", "M2-CS-FAQ", "M2-COMPLAINT"],
    conditions: { severity_in: ["WARN", "BREACH"], min_observed: 1 },
    fault_areas: [
      "One-line C1 chat (“help me ???”)",
      "Form submitted with empty details",
      "Client language mixed / no UID",
      "Screenshot promised but not attached",
    ],
    escalation: {
      sla_minutes: 30,
      route_code: "ESC-CS-24-7",
      path: [
        { after_minutes: 0, team: "CS 24/7 Desk", channel: "oc_cs_c1", action: "Auto EMAIL_OUT — ask what / when / UID" },
        { after_minutes: 30, team: "CS 24/7 Desk", channel: "oc_cs_c1", action: "Second follow-up if still WAITING" },
        { after_minutes: 90, team: "CS Lead", channel: "oc_cs_c1", action: "Human follow-up after 3-mail cap" },
      ],
    },
    corrections: [
      { action: "send_clarify_email", bu: "CUSTOMER_SERVICE", description: "Official mailbox asks for what happened, UID, screenshot, desired outcome" },
      { action: "hold_until_reply", bu: "CUSTOMER_SERVICE", description: "Keep AWAITING_CLIENT; block Resolve while WAITING" },
      { action: "cs_lead_human", bu: "CUSTOMER_SERVICE", description: "After 3 auto-mails, CS Lead follows up in person", requires_human: true },
    ],
    past_cases: [
      {
        case_id: "CASE-CS-CLARIFY-1001",
        date: "2026-10-06",
        outcome: "PREVENTED false close",
        summary: "Sofia Mendes ‘help me ???’ stayed AWAITING_CLIENT until UID + login error arrived; then SKILL-CS-ID-VERIFY.",
      },
    ],
    owner_department: "CUSTOMER_SERVICE",
    owner_role: "CS Lead / 24-7 Agent",
    auto_execute: false,
    when_to_use: [
      "Use when intake text is shorter than 48 characters, or contains help-me / ??? / 不清楚 / 不知道.",
      "Use on re-triage if the latest client reply is still too thin to choose CS FAQ vs TR vs ID.",
      "Trigger from CS/TR Desk AI triage — not from a Monitor 2.0 credit alarm.",
    ],
    when_not_to_use: [
      "Do not guess a swap rate, fill, or KYC outcome from a one-liner.",
      "Do not Resolve while a follow-up email is WAITING.",
      "Do not send a fourth automatic mail — that is CS Lead work.",
      "If the blob already names passport / KYC / cannot-login, use SKILL-CS-ID-VERIFY instead.",
    ],
    prechecks: [
      "Confirm the latest inbound (CLIENT / EMAIL_IN / FORM), not the original thin opener, is what you are scoring.",
      "Check followup_count — if already 3, stop auto-mail.",
      "If trading keywords (MT4/MT5 fill/slippage) are now present, switch to SKILL-TR-EXECUTION.",
    ],
    evidence_to_collect: [
      "Raw C1 / form / email body and channel_ref.",
      "EMAIL_OUT copy + WAITING follow-up row.",
      "Client EMAIL_IN when it arrives.",
      "Audit CS_FOLLOWUP_EMAIL / CS_CLIENT_REPLY.",
    ],
    stop_conditions: [
      "Stop auto-mail at 3. Hand to CS Lead.",
      "Stop this skill as soon as the latest reply is clear enough to pick another CS/TR skill.",
      "Abort if the client asked to close the ticket themselves.",
    ],
    success_criteria: [
      "Case stays AWAITING_CLIENT until a usable reply.",
      "Resolve blocked while WAITING.",
      "Looks like CASE-CS-CLARIFY-1001: no invented ask.",
    ],
    steps: [
      { action: "lark_notify", description: "Note CS 24/7 Desk that a clarify loop started", params: { channel: "oc_cs_c1" }, bu: "CUSTOMER_SERVICE" },
      { action: "send_clarify_email", description: "Send official EMAIL_OUT asking what / when / UID / screenshot", bu: "CUSTOMER_SERVICE" },
      { action: "hold_until_reply", description: "Wait for EMAIL_IN then re-triage", bu: "CUSTOMER_SERVICE" },
    ],
  },
  {
    code: "SKILL-CS-ID-VERIFY",
    name: "CS identity verification before account action",
    description:
      "KYC / passport / cannot-login / withdraw-blocked cases. Ask for ID + UID last four + selfie and hold ID_VERIFY until the client replies.",
    indicator: {
      monitor_id: "M2-CS-ID",
      name: "ID-verify CS queue (open)",
      product: "CFD+Crypto",
      domain: "CS_SERVICE",
      warn: 5,
      breach: 12,
      unit: "tickets",
      comparator: "gte",
      why: "Withdrawals, password resets and UID changes without ID are account-takeover paths. Queue depth ≥12 means the vault/process is blocked.",
    },
    related_indicators: ["M2-CS-UNCLEAR", "M2-WD-015", "M2-FRAUD-011"],
    conditions: { severity_in: ["WARN", "BREACH"], min_observed: 1 },
    fault_areas: [
      "Client cannot log in / withdraw until KYC",
      "Selfie does not match passport",
      "UID last four missing",
      "Shared-device multi-account cluster",
    ],
    escalation: {
      sla_minutes: 20,
      route_code: "ESC-CS-24-7",
      path: [
        { after_minutes: 0, team: "CS 24/7 Desk", channel: "oc_cs_c1", action: "EMAIL_OUT ID pack (passport, UID last four, selfie)" },
        { after_minutes: 20, team: "CS Lead", channel: "oc_cs_c1", action: "Review ID pack; fraud cluster if mismatch" },
        { after_minutes: 45, team: "Risk Control Desk", channel: "oc_risk_control_desk", action: "If fraud cluster, SKILL-CS-ESCALATE-RISK" },
      ],
    },
    corrections: [
      { action: "send_id_email", bu: "CUSTOMER_SERVICE", description: "Ask for passport/ID photo, UID last four, matching selfie" },
      { action: "hold_id_verify", bu: "CUSTOMER_SERVICE", description: "Status ID_VERIFY until EMAIL_IN" },
      { action: "fraud_cluster_check", bu: "RISK_CONTROL", description: "If selfie/device mismatch, escalate to Risk", requires_human: true },
    ],
    past_cases: [
      {
        case_id: "CASE-CS-ID-1001",
        date: "2026-10-06",
        outcome: "PREVENTED blind withdraw",
        summary: "Priya Shah stay-in ID_VERIFY until passport + 0088; no withdrawal action before ID.",
      },
    ],
    owner_department: "CUSTOMER_SERVICE",
    owner_role: "CS Lead",
    auto_execute: false,
    when_to_use: [
      "Use when the client mentions passport, ID card, KYC, verify my account, cannot login, 核身, 證件, or withdraw blocked pending identity.",
      "Prefer this over SKILL-CS-CLARIFY even if the text is short — ID is the ask.",
    ],
    when_not_to_use: [
      "Do not skip ID because the email looks familiar.",
      "Do not process a withdrawal, password reset, or UID change on this skill.",
      "Do not treat a trading-fill complaint as KYC — that is SKILL-TR-EXECUTION.",
    ],
    prechecks: [
      "Confirm status is ID_VERIFY after the first EMAIL_OUT.",
      "Check M2-FRAUD-011 if the same device/email cluster is already red.",
      "Never auto-approve ID in this prototype — human CS Lead marks the pack complete.",
    ],
    evidence_to_collect: [
      "ID EMAIL_OUT copy.",
      "Client EMAIL_IN (passport / UID last four / selfie note).",
      "UID on the request vs last-four in the reply.",
      "Audit CS_FOLLOWUP_EMAIL with reason need_id.",
    ],
    stop_conditions: [
      "Stop auto-mail at 3.",
      "If fraud cluster is BREACH, stop CS-only handling and run SKILL-CS-ESCALATE-RISK.",
      "If the client sent a clear non-ID question after ID is on file, switch to SKILL-CS-ACCOUNT-FAQ.",
    ],
    success_criteria: [
      "No account mutation before ID pack.",
      "ID_VERIFY until reply.",
      "Looks like CASE-CS-ID-1001.",
    ],
    steps: [
      { action: "send_id_email", description: "Ask for passport/ID, UID last four, selfie", bu: "CUSTOMER_SERVICE" },
      { action: "hold_id_verify", description: "Keep ID_VERIFY; block Resolve while WAITING", bu: "CUSTOMER_SERVICE" },
      {
        action: "flag_for_human_review",
        description: "CS Lead confirms ID pack or escalates fraud",
        requires_human: true,
        bu: "CUSTOMER_SERVICE",
      },
    ],
  },
  {
    code: "SKILL-CS-ACCOUNT-FAQ",
    name: "CS account / product FAQ (swap, hours, UID)",
    description:
      "Clear CS questions that CS can answer from RAG (swap, weekend triple, account type, trading hours) without TR tape or Risk controls.",
    indicator: {
      monitor_id: "M2-CS-FAQ",
      name: "Open CS FAQ / product questions",
      product: "CFD+Crypto",
      domain: "CS_SERVICE",
      warn: 40,
      breach: 80,
      unit: "tickets",
      comparator: "gte",
      why: "FAQ volume is staffing, not book risk. Breach means the RAG answers are stale or C1 is understaffed overnight.",
    },
    related_indicators: ["M2-CS-UNCLEAR", "M2-COMPLAINT", "M2-SWAP-027"],
    conditions: { severity_in: ["WARN", "BREACH", "INFO"], min_observed: 0 },
    fault_areas: [
      "Stale swap table in RAG",
      "Entity-specific hours not disclosed",
      "Client mixed XAUUSD vs XAUUSD247",
      "Weekend triple not explained",
    ],
    escalation: {
      sla_minutes: 45,
      route_code: "ESC-CS-24-7",
      path: [
        { after_minutes: 0, team: "CS 24/7 Desk", channel: "oc_cs_c1", action: "Answer from RAG (cs-swap-faq / accounts-pricing)" },
        { after_minutes: 45, team: "CS Lead", channel: "oc_cs_c1", action: "If RAG miss, propose_rag" },
      ],
    },
    corrections: [
      { action: "answer_from_rag", bu: "CUSTOMER_SERVICE", description: "Cite cs-swap-faq / accounts-pricing / xauusd247" },
      { action: "propose_rag_update", bu: "AI", description: "If the answer is missing, propose_rag maker-checker", requires_human: true },
    ],
    past_cases: [
      {
        case_id: "CASE-CS-FAQ-1001",
        date: "2026-10-06",
        outcome: "RESOLVED",
        summary: "Liam Okafor XAUUSD overnight swap — RAG weekend-triple cited; no TR tape needed.",
      },
    ],
    owner_department: "CUSTOMER_SERVICE",
    owner_role: "CS Agent",
    auto_execute: false,
    when_to_use: [
      "Use when the ask is clear and is about swap, hours, account type, UID lookup, or product rules — not fills, not KYC, not book risk.",
      "Seeded C1 ‘Swap on XAUUSD overnight’ is the canonical example.",
    ],
    when_not_to_use: [
      "Do not use for slippage / MT4 / MT5 / stop-out fills — SKILL-TR-EXECUTION.",
      "Do not use for passport / KYC — SKILL-CS-ID-VERIFY.",
      "Do not invent a swap rate that is not in RAG.",
    ],
    prechecks: [
      "Confirm UID is present (or asked).",
      "Retrieve cs-swap-faq and accounts-pricing before answering.",
      "If the client disputes the charged swap as a ledger error, consider Ops funding — not this FAQ skill alone.",
    ],
    evidence_to_collect: [
      "RAG hits (cs-swap-faq, accounts-pricing, xauusd247).",
      "UID and symbol named in the thread.",
      "Agent reply citing the document key.",
    ],
    stop_conditions: [
      "Stop FAQ handling if the client alleges mis-execution — hand to TR.",
      "Stop if they allege fraud / stolen account — ID then Risk.",
    ],
    success_criteria: [
      "Answer cites a RAG doc_key.",
      "No trading control armed.",
      "Looks like CASE-CS-FAQ-1001.",
    ],
    steps: [
      { action: "retrieve_rag", description: "Retrieve cs-swap-faq / accounts-pricing", bu: "AI" },
      { action: "answer_from_rag", description: "CS agent replies with cited product rule", bu: "CUSTOMER_SERVICE" },
    ],
  },
  {
    code: "SKILL-TR-EXECUTION",
    name: "TR dealing — fill, slippage, stop-out, MT4/MT5",
    description:
      "Execution complaints leave CS. TR reconstructs the tape (ticket, symbol, time, LP fill vs button). CS must not guess pips.",
    indicator: {
      monitor_id: "M2-TR-EXEC",
      name: "TR dealing queue (assigned)",
      product: "CFD+Crypto",
      domain: "TRADING_EXEC",
      warn: 10,
      breach: 25,
      unit: "tickets",
      comparator: "gte",
      why: "A growing TR queue after a vol spike often co-moves with M2-SLIP-021 / M2-LP-022. Desk staffing plus tape review, not CS copy-paste.",
    },
    related_indicators: ["M2-SLIP-021", "M2-LP-022", "M2-FEED-003", "M2-BRIDGE-LAT"],
    conditions: { severity_in: ["WARN", "BREACH"], min_observed: 1 },
    fault_areas: [
      "LP reject / partial fill",
      "Bridge latency vs button price",
      "Stale aggregator",
      "Stop-out on a gapped mark",
    ],
    escalation: {
      sla_minutes: 15,
      route_code: "ESC-TR-DEAL",
      path: [
        { after_minutes: 0, team: "TR Dealing Support", channel: "oc_tr_dealing", action: "Assign TR; pull ticket/symbol/time" },
        { after_minutes: 15, team: "TR Lead", channel: "oc_tr_dealing", action: "Tape vs LP" },
        { after_minutes: 30, team: "Risk Control Desk", channel: "oc_risk_control_desk", action: "If book-wide slippage, SKILL-CS-ESCALATE-RISK" },
      ],
    },
    corrections: [
      { action: "assign_tr", bu: "TRADING", description: "Desk=TR, status ASSIGNED_TR" },
      { action: "reconstruct_tape", bu: "TRADING", description: "Ticket, symbol, UTC time, button vs LP fill" },
      { action: "check_slip_monitors", bu: "RISK_CONTROL", description: "Correlate M2-SLIP-021 / M2-LP-022 — do not adjust the book from CS" },
    ],
    past_cases: [
      {
        case_id: "CASE-TR-EXEC-1001",
        date: "2026-10-06",
        outcome: "ASSIGNED_TR",
        summary: "Chen Wei EURUSD MT5 ticket 849201 — 2.1 pips worse than button; TR owns tape, CS does not quote a goodwill pip.",
      },
    ],
    owner_department: "TRADING",
    owner_role: "TR Lead / Dealer",
    auto_execute: false,
    when_to_use: [
      "Use when intake mentions order, fill, slippage, stop-out, MT4, MT5, execution, deal, spread, requote, 成交, 點差, 停損, 掛單.",
      "Use when CS clicks Assign to TR.",
    ],
    when_not_to_use: [
      "Do not let CS invent a fill price or goodwill adjustment.",
      "Do not halt a symbol or cut leverage from this skill — that is Risk Human Intervention.",
      "A swap-rate question is SKILL-CS-ACCOUNT-FAQ, not TR.",
    ],
    prechecks: [
      "Ticket number / symbol / UTC time present; if missing, one clarify mail then TR still owns it.",
      "Check M2-SLIP-021 and M2-LP-022 — if BREACH, this is also a book event (escalate Risk).",
      "Confirm desk=TR and assigned_to is TR Dealing Support.",
    ],
    evidence_to_collect: [
      "Client ticket / order id.",
      "Symbol and UTC timestamp.",
      "Button price vs fill (client claim).",
      "Related Monitor snapshots M2-SLIP-021 / M2-LP-022 / M2-FEED-003.",
    ],
    stop_conditions: [
      "If monitors show a book-wide reject storm, stop TR-only handling and escalate Risk.",
      "If the client only asked for the swap table, return to SKILL-CS-ACCOUNT-FAQ.",
    ],
    success_criteria: [
      "Desk is TR (ASSIGNED_TR).",
      "CS did not quote a pip adjustment.",
      "Looks like CASE-TR-EXEC-1001.",
    ],
    steps: [
      { action: "assign_tr", description: "Stamp desk=TR and ASSIGNED_TR", bu: "TRADING" },
      { action: "reconstruct_tape", description: "Collect ticket / symbol / time / claimed pips", bu: "TRADING" },
      {
        action: "flag_for_human_review",
        description: "If book-wide slippage, escalate to Risk",
        requires_human: true,
        bu: "RISK_CONTROL",
      },
    ],
  },
  {
    code: "SKILL-CS-ESCALATE-RISK",
    name: "CS/TR escalate book-risk onto the Risk spine",
    description:
      "Complaints that are really credit, fraud, wallet, or cascade risk leave CS/TR. Messenger + Human Intervention own the controls. CS/TR no longer handles it alone.",
    indicator: {
      monitor_id: "M2-CS-ESC",
      name: "CS/TR escalations onto Risk (open)",
      product: "CFD+Crypto",
      domain: "CS_SERVICE",
      warn: 3,
      breach: 8,
      unit: "tickets",
      comparator: "gte",
      why: "A burst of CS→Risk handoffs is a client-visible mirror of a book incident. ≥8 open means the spine is not absorbing complaints.",
    },
    related_indicators: ["M2-MRG-014", "M2-FRAUD-011", "M2-SLIP-021", "M2-CRYPTO-WALLET", "M2-COMPLAINT"],
    conditions: { severity_in: ["WARN", "BREACH"], min_observed: 1 },
    fault_areas: [
      "Stop-out cascade showing up as CS chat",
      "Account-takeover / fraud ring",
      "Hot-wallet / withdrawal freeze optics",
      "LP reject storm as ‘slippage complaints’",
    ],
    escalation: {
      sla_minutes: 10,
      route_code: "ESC-CS-RISK",
      path: [
        { after_minutes: 0, team: "CS 24/7 Desk", channel: "oc_cs_c1", action: "Mark ESCALATED_RISK; stop CS-only replies" },
        { after_minutes: 0, team: "Risk Control Desk", channel: "oc_risk_control_desk", action: "Open messenger / intervention spine" },
        { after_minutes: 15, team: "Exec Risk Bridge", channel: "oc_exec_risk_bridge", action: "If linked M2 BREACH still open" },
      ],
    },
    corrections: [
      { action: "escalate_risk", bu: "CUSTOMER_SERVICE", description: "Status ESCALATED_RISK; CS/TR stops solo handling" },
      { action: "open_spine", bu: "RISK_CONTROL", description: "Demo Messenger / Human Intervention — maker/checker for controls", requires_human: true },
    ],
    past_cases: [
      {
        case_id: "CASE-CS-ESC-1001",
        date: "2026-10-06",
        outcome: "ESCALATED_RISK",
        summary: "Client alleged stop-out cascade + stolen accounts; CS did not argue fills; Risk took messenger spine.",
      },
    ],
    owner_department: "RISK_CONTROL",
    owner_role: "Risk Owner / CS Lead",
    auto_execute: false,
    when_to_use: [
      "Use when CS/TR clicks Escalate to Risk, or when the complaint names fraud, hack, chargeback, margin cascade, wallet drain, or clustered stop-outs.",
      "Use when TR tape review shows book-wide LP rejects — not a single ticket.",
    ],
    when_not_to_use: [
      "Do not escalate a weekend-swap FAQ.",
      "Do not arm halt / leverage / withdrawal pause from CS — Human Intervention is the gate.",
      "Do not leave the client thread unanswered; the SYSTEM note must say Risk owns it.",
    ],
    prechecks: [
      "Named related Monitor (M2-MRG-014 / M2-FRAUD-011 / M2-SLIP-021 / M2-CRYPTO-WALLET) if any is already WARN.",
      "Confirm CS/TR has not promised a goodwill fill or withdrawal.",
    ],
    evidence_to_collect: [
      "CS request_id + last client body.",
      "ESCALATED_RISK system note.",
      "Linked alert_id / skill on the Risk spine if present.",
      "Audit CS_ESCALATE_RISK.",
    ],
    stop_conditions: [
      "CS/TR must not keep negotiating after ESCALATED_RISK.",
      "If Risk dismisses as a single-ticket fill, TR may resume SKILL-TR-EXECUTION.",
    ],
    success_criteria: [
      "Status ESCALATED_RISK.",
      "No CS-armed trading control.",
      "Looks like CASE-CS-ESC-1001.",
    ],
    steps: [
      { action: "escalate_risk", description: "Stamp ESCALATED_RISK and stop CS-only handling", bu: "CUSTOMER_SERVICE" },
      {
        action: "flag_for_human_review",
        description: "Risk Owner takes messenger / intervention",
        requires_human: true,
        bu: "RISK_CONTROL",
      },
    ],
  },
];

export const CS_LINKED_SCENARIOS: LinkedScenario[] = [
  {
    code: "CHAIN-CS-TR-INTAKE",
    name: "Unclear C1 → ID verify → TR tape → Risk spine",
    description:
      "Client 24/7 door: thin chat gets a clarify mail; identity pack if KYC; execution words go to TR; book-risk leaves CS/TR for messenger.",
    product: "CFD+Crypto",
    domain: "CS_SERVICE",
    severity: "WARN",
    sequence: [
      { t_minutes: 0, monitor_id: "M2-CS-UNCLEAR", severity: "WARN", signal: "Thin C1 / form lands; SKILL-CS-CLARIFY emails" },
      { t_minutes: 20, monitor_id: "M2-CS-ID", severity: "WARN", signal: "Reply still needs KYC; SKILL-CS-ID-VERIFY" },
      { t_minutes: 45, monitor_id: "M2-TR-EXEC", severity: "WARN", signal: "Fill/slippage words; SKILL-TR-EXECUTION" },
      { t_minutes: 70, monitor_id: "M2-CS-ESC", severity: "BREACH", signal: "Book-risk / fraud; SKILL-CS-ESCALATE-RISK" },
    ],
    causes: [
      "Overnight C1 understaffed",
      "Client mixes KYC + fill complaint in one thread",
      "Vol spike produces both FAQ and genuine LP rejects",
    ],
    escalation_plan: [
      { after_minutes: 0, team: "CS 24/7 Desk", channel: "oc_cs_c1", action: "Clarify / ID loop (cap 3)" },
      { after_minutes: 20, team: "TR Dealing Support", channel: "oc_tr_dealing", action: "Tape if execution words" },
      { after_minutes: 40, team: "Risk Control Desk", channel: "oc_risk_control_desk", action: "Spine if book-risk" },
    ],
    corrections: [
      { action: "send_clarify_email", bu: "CUSTOMER_SERVICE", description: "Do not invent the ask" },
      { action: "assign_tr", bu: "TRADING", description: "TR owns fills" },
      { action: "escalate_risk", bu: "RISK_CONTROL", description: "Messenger spine for controls", requires_human: true },
    ],
    linked_skills: [
      "SKILL-CS-CLARIFY",
      "SKILL-CS-ID-VERIFY",
      "SKILL-CS-ACCOUNT-FAQ",
      "SKILL-TR-EXECUTION",
      "SKILL-CS-ESCALATE-RISK",
    ],
    past_cases: [
      {
        case_id: "CASE-CS-CHAIN-1001",
        date: "2026-10-06",
        outcome: "CONTAINED",
        summary: "Seeded four-door walk: FAQ resolved, unclear waited, TR assigned, ID held — no CS-armed control.",
      },
    ],
  },
];
