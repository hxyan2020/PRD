import { getDb, writeAudit } from "@/lib/db";
import { analyzeAlert, raiseMonitorAlarm } from "@/lib/ai/analyze";
import { logSpineEvent, type SpineStage } from "@/lib/ai/spine";
import { decideIntervention } from "@/lib/ai/intervention";
import { messengerAction, syncNewAlertsToMessenger } from "@/lib/messenger/demo";
import { FOREX_COMPANION_CASES, FOREX_INCIDENT_1028 } from "@/lib/demo/forex-incident-1028";
import type { UiLocale } from "@/lib/i18n";

export type DummySpineMode = "single" | "group";

export type DummyTemplate = {
  key: string;
  monitor_id: string;
  severity: string;
  observed_value: number;
  prefer_rag: boolean;
  action_code: string;
  title: string;
  message: string;
};

const fx = FOREX_INCIDENT_1028;
const staleCompanion = FOREX_COMPANION_CASES.find((c) => c.id === "STALE-FEED-LIQ")!;
const hedgeCompanion = FOREX_COMPANION_CASES.find((c) => c.id === "LP-HEDGE-GAP")!;

/** Forex CFD pack first so home dummy spine walks the same INC-1028 book. */
export const DUMMY_SPINE_TEMPLATES: DummyTemplate[] = [
  {
    key: "lp-quote",
    monitor_id: fx.primary_monitor_id,
    severity: "BREACH",
    observed_value: 5.2,
    prefer_rag: false,
    action_code: "DISABLE_LP",
    title: `DUMMY · ${fx.incident_id} LP reject / quote delay`,
    message: `Home dummy: ${fx.lp} ${fx.symbol} reject rate / quote age rising — same book as ${fx.incident_id}. Walk DETECT→Messenger→close.`,
  },
  {
    key: "feed-stale",
    monitor_id: staleCompanion.primary_monitor_id,
    severity: "WARN",
    observed_value: 8,
    prefer_rag: true,
    action_code: "WIDEN_SPREAD",
    title: `DUMMY · ${fx.incident_id} stale quotes`,
    message: `Home dummy: stale-quote symbols climbing on the ${fx.symbol} book (companion ${staleCompanion.id}). RAG path + human review.`,
  },
  {
    key: "hedge-gap",
    monitor_id: "M2-HEDGE-007",
    severity: "BREACH",
    observed_value: 68,
    prefer_rag: false,
    action_code: "INCREASE_ABOOK",
    title: `DUMMY · ${fx.incident_id} hedge coverage gap`,
    message: `Home dummy: hedge coverage slipped while LP rejects rise — companion ${hedgeCompanion.chain_code} on the same CFD book as ${fx.incident_id}.`,
  },
];

export const DUMMY_HOME_STAGES: SpineStage[] = [
  "DETECT",
  "ALARM",
  "AI_RCA",
  "SKILL_EXECUTE",
  "HUMAN_INTERVENTION",
  "RESOLVED",
  "DASHBOARD",
];

export type DummySpineRun = {
  key: string;
  alert_id: string;
  alert_db_id: number;
  ticket_id: string;
  analysis_id: string | null;
  analysis_db_id: number | null;
  analysis_mode: string | null;
  thread_id: string | null;
  thread_db_id: number | null;
  action_code: string;
  stages: SpineStage[];
  closed: boolean;
};

const MAKER_EMAIL = "risk.analyst@vantagemarkets.com";
const CHECKER_EMAIL = "risk.owner@vantagemarkets.com";
const MAKER_FALLBACK = "Priya Nair";
const CHECKER_FALLBACK = "Alex Chen";

function userByEmail(email: string, fallbackName: string) {
  const db = getDb();
  const row = db
    .prepare(`SELECT id, name FROM users WHERE email = ?`)
    .get(email) as { id: number; name: string } | undefined;
  return { id: row?.id ?? 1, name: row?.name || fallbackName };
}

const CHAT_NOTE: Record<UiLocale, string> = {
  en: "Dummy home run: accepting the AI pack and walking maker/checker through to closure.",
  "zh-Hant": "虛擬首頁演練：接受 AI 包，並以 Maker／Checker 走完至結案。",
};

const INTERVENTION_NOTE: Record<UiLocale, string> = {
  en: "Dummy home run — Risk Owner auto-approved after messenger maker/checker.",
  "zh-Hant": "虛擬首頁演練 — 風險負責人已在 Messenger Maker／Checker 後自動核准。",
};

function markStage(stages: SpineStage[], stage: SpineStage) {
  if (!stages.includes(stage)) stages.push(stage);
}

function walkOne(tpl: DummyTemplate, locale: UiLocale): DummySpineRun {
  const db = getDb();
  const stages: SpineStage[] = [];
  const maker = userByEmail(MAKER_EMAIL, MAKER_FALLBACK);
  const checker = userByEmail(CHECKER_EMAIL, CHECKER_FALLBACK);

  logSpineEvent({
    stage: "DETECT",
    title: `DUMMY detect ${tpl.monitor_id} → ${tpl.severity}`,
    product: "CFD",
    ref_type: "detector",
    ref_id: tpl.monitor_id,
    severity: tpl.severity,
    detail: { dummy: true, template: tpl.key, observed: tpl.observed_value },
    actor: "home-dummy",
  });
  markStage(stages, "DETECT");

  const raised = raiseMonitorAlarm({
    monitor_id: tpl.monitor_id,
    severity: tpl.severity,
    title: tpl.title,
    message: tpl.message,
    observed_value: tpl.observed_value,
  });

  logSpineEvent({
    stage: "ALARM",
    title: `DUMMY alarm ${raised.alert_id} (${tpl.monitor_id})`,
    product: raised.product,
    ref_type: "monitor_alert",
    ref_id: raised.alert_id,
    severity: raised.severity,
    detail: { dummy: true, ticket_id: raised.ticket_id },
    actor: "home-dummy",
  });
  markStage(stages, "ALARM");

  const bundle = analyzeAlert(raised.alert_db_id, { force: true, prefer_rag: tpl.prefer_rag });
  const analysis = bundle?.analysis as
    | { id: number; analysis_id: string; mode: string }
    | undefined
    | null;
  if (analysis) {
    markStage(stages, "AI_RCA");
    if (String(analysis.mode).includes("SKILL") || tpl.prefer_rag === false) {
      markStage(stages, "SKILL_EXECUTE");
    } else {
      markStage(stages, "SKILL_EXECUTE");
    }
  }

  syncNewAlertsToMessenger(8);
  const thread = db
    .prepare(
      `SELECT id, thread_id FROM messenger_threads WHERE alert_id = ? ORDER BY id DESC LIMIT 1`
    )
    .get(raised.alert_db_id) as { id: number; thread_id: string } | undefined;

  if (thread) {
    messengerAction({
      thread_id: thread.id,
      action: "show_evidence",
      user_name: maker.name,
      locale,
    });
    messengerAction({
      thread_id: thread.id,
      action: "chat",
      user_name: maker.name,
      text: CHAT_NOTE[locale] || CHAT_NOTE.en,
      locale,
    });
    messengerAction({
      thread_id: thread.id,
      action: "escalate",
      user_name: maker.name,
      locale,
    });
    messengerAction({
      thread_id: thread.id,
      action: "escalate",
      user_name: maker.name,
      locale,
    });
    markStage(stages, "HUMAN_INTERVENTION");

    const recommended = messengerAction({
      thread_id: thread.id,
      action: "recommend",
      user_name: maker.name,
      action_code: tpl.action_code,
      locale,
    });
    const pending = (recommended?.pending || []) as Array<{ id: number; status: string }>;
    const awaiting = pending.find((p) => p.status === "AWAITING_CONFIRM") ?? pending[0];
    if (awaiting?.id) {
      messengerAction({
        thread_id: thread.id,
        action: "confirm_action",
        user_name: maker.name,
        pending_id: awaiting.id,
        locale,
      });
      const afterConfirm = db
        .prepare(`SELECT status FROM messenger_pending_actions WHERE id = ?`)
        .get(awaiting.id) as { status: string } | undefined;
      if (afterConfirm?.status === "AWAITING_CHECKER") {
        messengerAction({
          thread_id: thread.id,
          action: "checker_approve",
          user_name: checker.name,
          pending_id: awaiting.id,
          locale,
        });
      }
    }
  }

  if (analysis?.id) {
    const pendingInt = db
      .prepare(
        `SELECT id FROM interventions WHERE analysis_id = ? AND status = 'PENDING' ORDER BY id DESC`
      )
      .all(analysis.id) as Array<{ id: number }>;
    for (const row of pendingInt) {
      try {
        decideIntervention({
          interventionId: row.id,
          decision: "APPROVED",
          note: INTERVENTION_NOTE[locale] || INTERVENTION_NOTE.en,
          actor: checker,
        });
        markStage(stages, "HUMAN_INTERVENTION");
        markStage(stages, "RESOLVED");
      } catch {
        /* already decided or missing join */
      }
    }
  }

  if (thread) {
    messengerAction({
      thread_id: thread.id,
      action: "close",
      user_name: checker.name,
      locale,
    });
  } else {
    db.prepare(`UPDATE monitor_alerts SET status = 'CLOSED' WHERE id = ?`).run(raised.alert_db_id);
  }

  db.prepare(
    `UPDATE monitor_tickets SET status = 'RESOLVED', updated_at = datetime('now') WHERE alert_id = ? OR ticket_id = ?`
  ).run(raised.alert_db_id, raised.ticket_id);

  if (!stages.includes("RESOLVED")) {
    logSpineEvent({
      stage: "RESOLVED",
      title: `DUMMY closed ${raised.alert_id}`,
      product: raised.product,
      ref_type: "monitor_alert",
      ref_id: raised.alert_id,
      severity: "INFO",
      detail: { dummy: true, ticket_id: raised.ticket_id },
      actor: checker.name,
    });
    markStage(stages, "RESOLVED");
  }

  logSpineEvent({
    stage: "DASHBOARD",
    title: `DUMMY outcome rolled to desk board (${raised.alert_id})`,
    product: raised.product,
    ref_type: "monitor_alert",
    ref_id: raised.alert_id,
    severity: "INFO",
    detail: { dummy: true },
    actor: "home-dummy",
  });
  markStage(stages, "DASHBOARD");

  writeAudit({ name: "Home dummy" }, "DUMMY_SPINE_RUN", "monitor_alert", raised.alert_id, {
    template: tpl.key,
    ticket_id: raised.ticket_id,
    analysis_id: analysis?.analysis_id ?? null,
    thread_id: thread?.thread_id ?? null,
    action_code: tpl.action_code,
    stages,
  });

  return {
    key: tpl.key,
    alert_id: raised.alert_id,
    alert_db_id: raised.alert_db_id,
    ticket_id: raised.ticket_id,
    analysis_id: analysis?.analysis_id ?? null,
    analysis_db_id: analysis?.id ?? null,
    analysis_mode: analysis?.mode ?? null,
    thread_id: thread?.thread_id ?? null,
    thread_db_id: thread?.id ?? null,
    action_code: tpl.action_code,
    stages,
    closed: true,
  };
}

export function runDummyAlertDemo(input: { mode?: DummySpineMode; locale?: UiLocale } = {}) {
  const mode: DummySpineMode = input.mode === "group" ? "group" : "single";
  const locale: UiLocale = input.locale === "zh-Hant" ? "zh-Hant" : "en";
  const templates = mode === "group" ? DUMMY_SPINE_TEMPLATES : [DUMMY_SPINE_TEMPLATES[0]];
  const runs: DummySpineRun[] = [];
  const errors: string[] = [];

  for (const tpl of templates) {
    try {
      runs.push(walkOne(tpl, locale));
    } catch (e) {
      errors.push(`${tpl.key}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  if (!runs.length) {
    throw new Error(errors.join("; ") || "Dummy spine produced no alerts");
  }

  writeAudit({ name: "Home dummy" }, "DUMMY_SPINE_RUN", "dummy_spine", mode, {
    mode,
    alert_ids: runs.map((r) => r.alert_id),
    errors,
    count: runs.length,
  });

  return {
    ok: true as const,
    mode,
    runs,
    errors,
    highlight_stages: DUMMY_HOME_STAGES,
  };
}
