import { randomBytes } from "crypto";
import type Database from "better-sqlite3";
import { getDb, writeAudit } from "@/lib/db";
import { logSpineEvent } from "@/lib/ai/spine";
import {
  applyImprovementTurn,
  classifyImproveIntent,
  type ImprovementChatResult,
  type ImprovementFact,
  type ImprovementItem,
  type ImprovementKind,
  type ImprovementReview,
  type ImprovementReviewStatus,
  type PulledDatum,
} from "@/lib/ai/improvement-model";

export type {
  ImprovementChatMessage,
  ImprovementChatResult,
  ImprovementFact,
  ImprovementItem,
  ImprovementKind,
  ImprovementPriority,
  ImprovementReview,
  ImprovementReviewStatus,
  PulledDatum,
} from "@/lib/ai/improvement-model";
export { applyImprovementTurn, classifyImproveIntent } from "@/lib/ai/improvement-model";

const SUGGESTED_SOURCES: Record<string, Array<{ name: string; why: string }>> = {
  CREDIT_CLIENT: [
    {
      name: "Signal-provider Telegram / Discord chatter",
      why: "Copy-cascade RCA needs the provider’s public signal stream, not only internal copy-graph share.",
    },
  ],
  MARKET_PRICING: [
    {
      name: "LP last-look reject tape",
      why: "Stale-quote vs toxic-flow diagnosis needs reject timestamps beside the client quote.",
    },
  ],
  LIQUIDITY_HEDGE: [
    {
      name: "Prime-of-prime fill-quality timeseries",
      why: "Hedge-coverage RCA is weak without per-LP fill ratio at the alarm minute.",
    },
  ],
  CRYPTO_EXCHANGE: [
    {
      name: "Mempool / on-chain confirmation lag",
      why: "Wallet-float and withdrawal-queue RCA should see chain congestion, not only hot-wallet %.",
    },
  ],
  OPERATIONAL_PROCESS: [
    {
      name: "Client complaint / NPS stream",
      why: "Ops-process alarms need the inbound ticket language, not only internal status codes.",
    },
  ],
  FRAUD_ABUSE: [
    {
      name: "Device-fingerprint cluster feed",
      why: "Bonus / wash patterns need device graph, not account ids alone.",
    },
  ],
  PLATFORM_TECH: [
    {
      name: "Bridge worker heartbeat (oneZero / MT)",
      why: "Infra RCA should prove the worker was alive at T0, not infer it from the alarm.",
    },
  ],
  REGULATORY_ENTITY: [
    {
      name: "Entity leverage-pack changelog",
      why: "Limit RCA needs the last ASIC/FCA/VFSC pack publish time.",
    },
  ],
  MODEL_AI: [
    {
      name: "Skill-matcher feature log",
      why: "When reasoning is thin, the matcher input vector should be an evidence row.",
    },
  ],
};

function newReviewId() {
  return `IMP-${randomBytes(3).toString("hex").toUpperCase()}`;
}

function parseJson<T>(raw: string | null | undefined, fallback: T): T {
  try {
    return JSON.parse(raw || "") as T;
  } catch {
    return fallback;
  }
}

function minutesBetween(from: string | null | undefined, to: string | null | undefined): number | null {
  if (!from) return null;
  const a = Date.parse(String(from).replace(" ", "T") + (String(from).includes("Z") ? "" : "Z"));
  const b = to
    ? Date.parse(String(to).replace(" ", "T") + (String(to).includes("Z") ? "" : "Z"))
    : Date.now();
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  return Math.max(0, Math.round((b - a) / 60000));
}

function niceNumber(n: number): string {
  if (!Number.isFinite(n)) return String(n);
  const abs = Math.abs(n);
  if (abs >= 100) return String(Math.round(n));
  if (abs >= 10) return String(Math.round(n * 10) / 10);
  return String(Math.round(n * 100) / 100);
}

export function ensureImprovementSchema(db: Database.Database = getDb()) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS ai_improvement_reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      analysis_id INTEGER NOT NULL UNIQUE,
      review_id TEXT NOT NULL UNIQUE,
      summary TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'OPEN',
      items_json TEXT NOT NULL DEFAULT '[]',
      facts_json TEXT NOT NULL DEFAULT '[]',
      chat_json TEXT NOT NULL DEFAULT '[]',
      pulled_json TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (analysis_id) REFERENCES ai_analyses(id)
    );
  `);
}

function rowToReview(row: {
  id: number;
  analysis_id: number;
  review_id: string;
  summary: string;
  status: string;
  items_json: string;
  facts_json: string;
  chat_json: string;
  pulled_json: string;
  created_at: string;
  updated_at: string;
}): ImprovementReview {
  return {
    id: row.id,
    analysis_id: row.analysis_id,
    review_id: row.review_id,
    summary: row.summary,
    status: (row.status as ImprovementReviewStatus) || "OPEN",
    items: parseJson<ImprovementItem[]>(row.items_json, []),
    facts: parseJson<ImprovementFact[]>(row.facts_json, []),
    chat: parseJson<ImprovementChatMessage[]>(row.chat_json, []),
    pulled: parseJson<PulledDatum[]>(row.pulled_json, []),
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export function getImprovementForAnalysis(analysisDbId: number): ImprovementReview | null {
  ensureImprovementSchema();
  const row = getDb()
    .prepare(`SELECT * FROM ai_improvement_reviews WHERE analysis_id = ?`)
    .get(analysisDbId) as
    | {
        id: number;
        analysis_id: number;
        review_id: string;
        summary: string;
        status: string;
        items_json: string;
        facts_json: string;
        chat_json: string;
        pulled_json: string;
        created_at: string;
        updated_at: string;
      }
    | undefined;
  return row ? rowToReview(row) : null;
}

function persistReview(review: ImprovementReview, meta?: { analysisCode?: string; product?: string }) {
  const db = getDb();
  ensureImprovementSchema(db);
  db.prepare(
    `INSERT INTO ai_improvement_reviews
      (analysis_id, review_id, summary, status, items_json, facts_json, chat_json, pulled_json, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
     ON CONFLICT(analysis_id) DO UPDATE SET
       review_id = excluded.review_id,
       summary = excluded.summary,
       status = excluded.status,
       items_json = excluded.items_json,
       facts_json = excluded.facts_json,
       chat_json = excluded.chat_json,
       pulled_json = excluded.pulled_json,
       updated_at = datetime('now')`
  ).run(
    review.analysis_id,
    review.review_id,
    review.summary,
    review.status,
    JSON.stringify(review.items),
    JSON.stringify(review.facts),
    JSON.stringify(review.chat),
    JSON.stringify(review.pulled)
  );

  const saved = getImprovementForAnalysis(review.analysis_id);
  if (!saved) return review;

  const existingEv = db
    .prepare(
      `SELECT id FROM ai_analysis_evidence WHERE analysis_id = ? AND evidence_type = 'IMPROVEMENT' LIMIT 1`
    )
    .get(review.analysis_id) as { id: number } | undefined;
  const excerpt = `${saved.summary}\n\n${saved.items
    .map((i) => `• [${i.priority}] ${i.kind}: ${i.recommendation}`)
    .join("\n")}`;
  if (existingEv) {
    db.prepare(`UPDATE ai_analysis_evidence SET title = ?, excerpt = ?, score = ? WHERE id = ?`).run(
      `How to improve — ${saved.status}`,
      excerpt.slice(0, 1800),
      saved.items.filter((i) => i.priority === "HIGH").length ? 0.9 : 0.7,
      existingEv.id
    );
  } else {
    db.prepare(
      `INSERT INTO ai_analysis_evidence (analysis_id, evidence_type, ref_id, title, excerpt, url, score)
       VALUES (?, 'IMPROVEMENT', ?, ?, ?, NULL, ?)`
    ).run(
      review.analysis_id,
      saved.review_id,
      `How to improve — ${saved.status}`,
      excerpt.slice(0, 1800),
      saved.items.filter((i) => i.priority === "HIGH").length ? 0.9 : 0.7
    );
  }

  writeAudit({ name: "AI Improve" }, "AI_IMPROVEMENT_REVIEW", "ai_analysis", meta?.analysisCode || String(review.analysis_id), {
    review_id: saved.review_id,
    status: saved.status,
    items: saved.items.length,
  });
  logSpineEvent({
    stage: "AI_RCA",
    title: `Improvement review ${saved.review_id} (${saved.status})`,
    product: meta?.product || "CFD+CRYPTO",
    ref_type: "analysis",
    ref_id: meta?.analysisCode || String(review.analysis_id),
    severity: "INFO",
    detail: { items: saved.items.length, status: saved.status },
    actor: "ai-improve",
  });
  return saved;
}

function pullLiveSnapshot(analysisDbId: number): PulledDatum[] {
  const db = getDb();
  const row = db
    .prepare(
      `SELECT a.analysis_id, a.mode, a.confidence, a.summary, a.explanations_json,
              al.alert_id, al.severity, al.title, al.message, al.observed_value, al.status AS alert_status,
              al.created_at, al.acknowledged_at,
              i.monitor_id, i.name AS indicator_name, i.domain_code, i.product, i.paused,
              i.threshold_warn, i.threshold_breach, i.unit, i.last_value, i.last_checked_at, i.status AS ind_status
       FROM ai_analyses a
       JOIN monitor_alerts al ON al.id = a.alert_id
       JOIN monitor_indicators i ON i.id = al.indicator_id
       WHERE a.id = ?`
    )
    .get(analysisDbId) as
    | {
        analysis_id: string;
        mode: string;
        confidence: number;
        alert_id: string;
        severity: string;
        title: string;
        observed_value: number | null;
        alert_status: string;
        created_at: string;
        acknowledged_at: string | null;
        monitor_id: string;
        indicator_name: string;
        domain_code: string;
        product: string;
        paused: number;
        threshold_warn: number | null;
        threshold_breach: number | null;
        unit: string | null;
        last_value: number | null;
        last_checked_at: string | null;
        ind_status: string;
      }
    | undefined;
  if (!row) return [];

  const sla = db
    .prepare(
      `SELECT r.sla_minutes FROM escalation_routes r
       WHERE r.enabled = 1 AND r.domain_code = ?
       ORDER BY CASE r.severity WHEN ? THEN 0 WHEN 'CRITICAL' THEN 1 ELSE 2 END
       LIMIT 1`
    )
    .get(row.domain_code, row.severity) as { sla_minutes: number } | undefined;

  const dormant = db
    .prepare(
      `SELECT monitor_id, name, paused, status, last_checked_at
       FROM monitor_indicators
       WHERE domain_code = ?
       ORDER BY CASE WHEN COALESCE(paused,0)=1 THEN 0 ELSE 1 END, COALESCE(last_checked_at, '') ASC
       LIMIT 4`
    )
    .all(row.domain_code) as Array<{
    monitor_id: string;
    name: string;
    paused: number;
    status: string;
    last_checked_at: string | null;
  }>;

  const sources = db
    .prepare(`SELECT name, category, status FROM data_sources ORDER BY id LIMIT 12`)
    .all() as Array<{ name: string; category: string; status: string }>;

  const ackMins = minutesBetween(row.created_at, row.acknowledged_at);
  const openMins = minutesBetween(row.created_at, null);

  const pulled: PulledDatum[] = [
    { label: "Alert", value: `${row.alert_id} · ${row.severity} · ${row.alert_status}` },
    { label: "Indicator", value: `${row.monitor_id} ${row.indicator_name} (${row.ind_status}${row.paused ? ", PAUSED" : ""})` },
    {
      label: "Observed vs limits",
      value: `${row.observed_value ?? "n/a"}${row.unit ?? ""} vs warn ${row.threshold_warn ?? "—"} / breach ${row.threshold_breach ?? "—"}`,
    },
    { label: "Last checked", value: row.last_checked_at || "never" },
    { label: "Ack latency", value: row.acknowledged_at ? `${ackMins ?? "?"} min` : `still open ${openMins ?? "?"} min` },
    { label: "SLA", value: sla ? `${sla.sla_minutes} min` : "no route" },
    {
      label: "Sibling health",
      value: dormant
        .map((d) => `${d.monitor_id}${d.paused ? " PAUSED" : ""} ${d.status} @ ${d.last_checked_at || "never"}`)
        .join(" · "),
    },
    {
      label: "Data sources",
      value: sources.map((s) => `${s.name} (${s.status})`).join("; "),
    },
  ];
  return pulled;
}

function generateItems(
  analysisDbId: number,
  opts: { extraFacts?: ImprovementFact[]; skipKinds?: ImprovementKind[] } = {}
): { items: ImprovementItem[]; summary: string; pulled: PulledDatum[] } {
  const db = getDb();
  const ctx = db
    .prepare(
      `SELECT a.id, a.analysis_id, a.mode, a.confidence, a.summary, a.explanations_json, a.actions_taken_json,
              al.alert_id, al.severity, al.title, al.message, al.observed_value, al.status AS alert_status,
              al.created_at, al.acknowledged_at,
              i.monitor_id, i.name AS indicator_name, i.domain_code, i.product, i.paused,
              i.threshold_warn, i.threshold_breach, i.unit, i.last_value, i.last_checked_at, i.status AS ind_status
       FROM ai_analyses a
       JOIN monitor_alerts al ON al.id = a.alert_id
       JOIN monitor_indicators i ON i.id = al.indicator_id
       WHERE a.id = ?`
    )
    .get(analysisDbId) as
    | {
        analysis_id: string;
        mode: string;
        confidence: number;
        summary: string;
        explanations_json: string;
        alert_id: string;
        severity: string;
        title: string;
        message: string;
        observed_value: number | null;
        alert_status: string;
        created_at: string;
        acknowledged_at: string | null;
        monitor_id: string;
        indicator_name: string;
        domain_code: string;
        product: string;
        paused: number;
        threshold_warn: number | null;
        threshold_breach: number | null;
        unit: string | null;
        last_checked_at: string | null;
        ind_status: string;
      }
    | undefined;

  if (!ctx) {
    return {
      items: [],
      summary: "No analysis context — cannot propose improvements.",
      pulled: [],
    };
  }

  const skip = new Set(opts.skipKinds || []);
  const explanations = parseJson<Array<Record<string, unknown>>>(ctx.explanations_json, []);
  const evidenceTypes = (
    db
      .prepare(`SELECT DISTINCT evidence_type AS t FROM ai_analysis_evidence WHERE analysis_id = ?`)
      .all(analysisDbId) as Array<{ t: string }>
  ).map((r) => r.t);
  const ragHits = (
    db
      .prepare(
        `SELECT title, excerpt FROM ai_analysis_evidence
         WHERE analysis_id = ? AND evidence_type = 'INTERNAL_RAG' ORDER BY score DESC LIMIT 2`
      )
      .all(analysisDbId) as Array<{ title: string; excerpt: string }>
  );
  const existingSources = (
    db.prepare(`SELECT name, status FROM data_sources`).all() as Array<{ name: string; status: string }>
  ).map((s) => s.name.toLowerCase());
  const inactiveSources = (
    db
      .prepare(`SELECT name, status FROM data_sources WHERE UPPER(status) NOT IN ('ACTIVE','OK','HEALTHY')`)
      .all() as Array<{ name: string; status: string }>
  );
  const siblings = db
    .prepare(
      `SELECT monitor_id, name, paused, status, last_checked_at
       FROM monitor_indicators
       WHERE domain_code = ? AND monitor_id != ?
       ORDER BY CASE WHEN COALESCE(paused,0)=1 THEN 0 ELSE 1 END, COALESCE(last_checked_at,'') ASC
       LIMIT 6`
    )
    .all(ctx.domain_code, ctx.monitor_id) as Array<{
    monitor_id: string;
    name: string;
    paused: number;
    status: string;
    last_checked_at: string | null;
  }>;
  const sla = db
    .prepare(
      `SELECT r.sla_minutes, t.name AS team
       FROM escalation_routes r
       JOIN teams t ON t.id = r.primary_team_id
       WHERE r.enabled = 1 AND r.domain_code = ?
       ORDER BY CASE r.severity WHEN ? THEN 0 WHEN 'CRITICAL' THEN 1 ELSE 2 END
       LIMIT 1`
    )
    .get(ctx.domain_code, ctx.severity) as { sla_minutes: number; team: string } | undefined;

  const items: ImprovementItem[] = [];
  const factText = (opts.extraFacts || []).map((f) => f.text).join(" ").toLowerCase();
  let n = 1;
  const add = (item: Omit<ImprovementItem, "id" | "status">) => {
    if (skip.has(item.kind)) return;
    if (items.some((x) => x.kind === item.kind)) return;
    items.push({ ...item, id: `I${n++}`, status: "OPEN" });
  };

  // DATA_SOURCE
  const suggestions = SUGGESTED_SOURCES[ctx.domain_code] || [
    {
      name: "Market Intelligence headline snapshot",
      why: "RCA should cite the hour-window headline that co-moved with this alarm.",
    },
  ];
  const missing = suggestions.find((s) => !existingSources.some((n) => n.includes(s.name.toLowerCase().slice(0, 12))));
  const inactive = inactiveSources[0];
  if (missing) {
    add({
      kind: "DATA_SOURCE",
      title: `Add data source: ${missing.name}`,
      recommendation: `Register “${missing.name}” on Data Sources and pull it into the next RCA for ${ctx.monitor_id}.`,
      rationale: missing.why,
      priority: ctx.severity === "CRITICAL" || ctx.severity === "BREACH" ? "HIGH" : "MEDIUM",
    });
  } else if (inactive) {
    add({
      kind: "DATA_SOURCE",
      title: `Restore ${inactive.name} (${inactive.status})`,
      recommendation: `Source “${inactive.name}” is ${inactive.status}. Health-check it before trusting this RCA.`,
      rationale: "An unhealthy source in the registry is as bad as a missing one — the desk may be reasoning on a stale feed.",
      priority: "HIGH",
    });
  } else {
    add({
      kind: "DATA_SOURCE",
      title: "Bind Market Intelligence into this RCA",
      recommendation: `Attach the current MI hour/24h card for ${ctx.product} as EXTERNAL evidence on ${ctx.alert_id}.`,
      rationale: "Internal indicator alone cannot prove whether the move was book-specific or tape-wide.",
      priority: "MEDIUM",
    });
  }

  // INDICATOR_HEALTH
  const staleHours = 6;
  const dormant = siblings.find((s) => {
    if (s.paused) return true;
    if (!s.last_checked_at) return true;
    const mins = minutesBetween(s.last_checked_at, null);
    return mins != null && mins > staleHours * 60;
  });
  const selfStale =
    ctx.paused ||
    !ctx.last_checked_at ||
    (minutesBetween(ctx.last_checked_at, null) ?? 0) > staleHours * 60;
  const healthTarget = selfStale
    ? { monitor_id: ctx.monitor_id, name: ctx.indicator_name, paused: ctx.paused, last_checked_at: ctx.last_checked_at, status: ctx.ind_status }
    : dormant || siblings[0];
  if (healthTarget) {
    const pausedBit = healthTarget.paused ? "paused" : "unchecked";
    add({
      kind: "INDICATOR_HEALTH",
      title: `${healthTarget.monitor_id} looks ${pausedBit} — check health`,
      recommendation: `Open Monitor 2.0 for ${healthTarget.monitor_id} (${healthTarget.name}). Confirm sampling is live, resume if paused, and do not reuse a dormant reading in RCA.`,
      rationale: `${healthTarget.monitor_id} last_checked=${healthTarget.last_checked_at || "never"}; paused=${healthTarget.paused ? "yes" : "no"}; status=${healthTarget.status}. A dormant sibling in ${ctx.domain_code} can hide a co-moving cause.`,
      priority: healthTarget.paused || selfStale ? "HIGH" : "MEDIUM",
    });
  }

  // REASONING_GAP
  const thin = explanations.filter((e) => String(e.rationale || "").trim().length < 80);
  const skillCertain = ctx.mode === "SKILL_MATCH" && ctx.confidence >= 0.99;
  const noExternal = !evidenceTypes.includes("EXTERNAL") && !evidenceTypes.includes("CHALLENGER");
  if (skillCertain) {
    add({
      kind: "REASONING_GAP",
      title: "Skill match claimed certainty without a differential",
      recommendation: `Write a second hypothesis that would falsify ${ctx.monitor_id} skill certainty (feed stale, LP reject, copy cascade) before accepting the playbook as complete RCA.`,
      rationale: `${ctx.analysis_id} is SKILL_MATCH @ ${(ctx.confidence * 100).toFixed(0)}% with ${explanations.length} explanation(s). Certainty without a ruled-out alternative is a reasoning gap.`,
      priority: "HIGH",
    });
  } else if (thin.length || !explanations.length) {
    add({
      kind: "REASONING_GAP",
      title: "Rationale is too thin to act on",
      recommendation: "Expand each hypothesis with the observed value, the threshold it crossed, and one piece of co-evidence (macro, LP, or wallet).",
      rationale: thin.length
        ? `${thin.length} explanation(s) have rationale under 80 characters.`
        : "No explanations stored.",
      priority: "HIGH",
    });
  } else if (noExternal) {
    add({
      kind: "REASONING_GAP",
      title: "No external co-signal in the vault",
      recommendation: `Pull a macro/MI snapshot into evidence for ${ctx.alert_id} so the story is not only ${ctx.monitor_id}.`,
      rationale: `Evidence types on this pack: ${evidenceTypes.join(", ") || "none"}.`,
      priority: "MEDIUM",
    });
  } else {
    add({
      kind: "REASONING_GAP",
      title: "Spell out what would change the conclusion",
      recommendation: "Add a one-line ‘we would reverse this RCA if …’ so the next reviewer can challenge it.",
      rationale: ctx.summary.slice(0, 220),
      priority: "LOW",
    });
  }

  // SKILL_PATTERN
  if (ctx.mode === "RAG_REASONING") {
    const seed = ragHits[0]?.title || ctx.title;
    add({
      kind: "SKILL_PATTERN",
      title: `New skill candidate from this pattern`,
      recommendation: `Draft a skill for ${ctx.monitor_id} + ${ctx.severity} when observed is around ${ctx.observed_value ?? "n/a"}${ctx.unit ?? ""}. Seed it from “${seed}”, then send it through AI Admin maker/checker.`,
      rationale:
        ragHits[0]?.excerpt?.slice(0, 240) ||
        "RAG path fired — this combination is repeating enough to become a playbook instead of a free-form story.",
      priority: "MEDIUM",
    });
  } else {
    add({
      kind: "SKILL_PATTERN",
      title: "Tighten the existing skill’s trigger window",
      recommendation: `Add a variant of the matched skill that fires on ${ctx.monitor_id} WARN (not only ${ctx.severity}) so the desk rehearses the same steps earlier.`,
      rationale: `Observed ${ctx.observed_value ?? "n/a"}${ctx.unit ?? ""} already sat past warn ${ctx.threshold_warn ?? "—"}. A WARN-entry skill prevents the first action from being the breach playbook.`,
      priority: "MEDIUM",
    });
  }

  // THRESHOLD X → Y
  const warn = ctx.threshold_warn;
  const breach = ctx.threshold_breach;
  const obs = ctx.observed_value;
  if (warn != null && breach != null) {
    const gte = obs == null ? true : obs >= warn || obs >= breach;
    const newWarn = gte ? Number(niceNumber(warn * 0.8)) : Number(niceNumber(warn * 1.1));
    const newBreach = gte ? Number(niceNumber(breach * 0.8)) : Number(niceNumber(breach * 1.1));
    const from = `${niceNumber(warn)}/${niceNumber(breach)}${ctx.unit ?? ""}`;
    const to = `${niceNumber(newWarn)}/${niceNumber(newBreach)}${ctx.unit ?? ""}`;
    add({
      kind: "THRESHOLD",
      title: `Tighten ${ctx.monitor_id} limits from ${from} to ${to}`,
      recommendation: `Propose warn/breach ${from} → ${to} on Monitor 2.0 (maker/checker). Observed ${obs ?? "n/a"}${ctx.unit ?? ""} ${gte ? "already sat past the current band" : "is approaching the band"}.`,
      rationale: gte
        ? "Once a live alarm prints beyond breach, the next cycle should trip earlier — not wait for the same X again."
        : "Headroom is thin; a slightly tighter warn gives the desk a rehearsal lap.",
      priority: gte && (ctx.severity === "BREACH" || ctx.severity === "CRITICAL") ? "HIGH" : "MEDIUM",
      from,
      to,
    });
  } else {
    add({
      kind: "THRESHOLD",
      title: `Publish numeric limits for ${ctx.monitor_id}`,
      recommendation: "This indicator has no warn/breach pair. Set both before the next sample so AI can compare observed vs X/Y.",
      rationale: "A limit that lives only in a detector comment cannot be challenged or tightened.",
      priority: "HIGH",
    });
  }

  // RESPONSE_TIME
  const slaMin = sla?.sla_minutes ?? 15;
  const ackMins = minutesBetween(ctx.created_at, ctx.acknowledged_at);
  const openMins = minutesBetween(ctx.created_at, null) ?? 0;
  const lag = ackMins ?? openMins;
  const late = lag > slaMin;
  add({
    kind: "RESPONSE_TIME",
    title: late
      ? `Manual response missed ${slaMin}m SLA (${lag}m)`
      : `Protect ${slaMin}m SLA — current lag ${lag}m`,
    recommendation: late
      ? `Ack/page ${sla?.team || "the primary desk"} inside ${Math.max(5, Math.round(slaMin / 2))} minutes. This pack sat ${lag}m (SLA ${slaMin}m). Put the on-call on the Realtime Alert hash, not only Lark.`
      : `Keep first-human ack under ${slaMin}m. Page ${sla?.team || "Risk Control"} at warn, not only at breach, so the copy/margin follow-through is already staffed.`,
    rationale: ctx.acknowledged_at
      ? `Alert ${ctx.alert_id} raised ${ctx.created_at}, acknowledged after ${ackMins}m.`
      : `Alert ${ctx.alert_id} still ${ctx.alert_status}; ${openMins}m since raise.`,
    priority: late ? "HIGH" : "MEDIUM",
    from: `${lag}m`,
    to: `${Math.max(5, Math.round(slaMin / 2))}m`,
  });

  if (factText) {
    for (const item of items) {
      if (factText.includes(item.kind.toLowerCase().replace("_", " ")) || factText.includes(item.id.toLowerCase())) {
        item.priority = item.priority === "LOW" ? "MEDIUM" : "HIGH";
        item.rationale = `${item.rationale} Human fact applied: “${(opts.extraFacts || [])[0]?.text || factText}”.`;
      }
    }
  }

  const high = items.filter((i) => i.priority === "HIGH").length;
  const summary = `How to improve ${ctx.alert_id} / ${ctx.analysis_id}: ${items.length} action(s), ${high} high-priority — data source, indicator health, reasoning, skill pattern, limit ${items.find((i) => i.kind === "THRESHOLD")?.from || "X"}→${items.find((i) => i.kind === "THRESHOLD")?.to || "Y"}, and manual response time.`;
  return { items: items.slice(0, 6), summary, pulled: pullLiveSnapshot(analysisDbId) };
}

export function reviewAnalysisIfNeeded(
  analysisDbId: number,
  opts: { force?: boolean } = {}
): ImprovementReview | null {
  const db = getDb();
  ensureImprovementSchema(db);
  const existing = getImprovementForAnalysis(analysisDbId);
  if (existing && !opts.force) return existing;

  const meta = db
    .prepare(
      `SELECT a.analysis_id, i.product FROM ai_analyses a
       JOIN monitor_alerts al ON al.id = a.alert_id
       JOIN monitor_indicators i ON i.id = al.indicator_id
       WHERE a.id = ?`
    )
    .get(analysisDbId) as { analysis_id: string; product: string } | undefined;
  if (!meta) return null;

  const facts = existing?.facts || [];
  const skipKinds = (existing?.items || []).filter((i) => i.status === "DISMISSED").map((i) => i.kind);
  const generated = generateItems(analysisDbId, { extraFacts: facts, skipKinds });
  const review: ImprovementReview = {
    analysis_id: analysisDbId,
    review_id: existing?.review_id || newReviewId(),
    summary: generated.summary,
    status: "OPEN",
    items: generated.items,
    facts,
    chat: existing?.chat || [],
    pulled: generated.pulled,
  };
  if (opts.force && existing) {
    review.status = "OPEN";
    review.chat = existing.chat;
  }
  return persistReview(review, { analysisCode: meta.analysis_id, product: meta.product });
}

export function backfillImprovements(limit = 80) {
  ensureImprovementSchema();
  const rows = getDb()
    .prepare(
      `SELECT a.id
       FROM ai_analyses a
       LEFT JOIN ai_improvement_reviews r ON r.analysis_id = a.id
       WHERE r.id IS NULL
       ORDER BY a.id DESC
       LIMIT ?`
    )
    .all(limit) as Array<{ id: number }>;
  const out: ImprovementReview[] = [];
  for (const r of rows) {
    const review = reviewAnalysisIfNeeded(r.id);
    if (review) out.push(review);
  }
  return out;
}

export function handleImprovementChat(
  analysisDbId: number,
  message: string,
  locale: "en" | "zh-Hant" = "en"
): ImprovementChatResult {
  const current = reviewAnalysisIfNeeded(analysisDbId);
  if (!current) {
    const empty: ImprovementReview = {
      analysis_id: analysisDbId,
      review_id: "IMP-NONE",
      summary: "No analysis to improve.",
      status: "OPEN",
      items: [],
      facts: [],
      chat: [],
      pulled: [],
    };
    return {
      reply: locale === "zh-Hant" ? "找不到分析，無法改進。" : "No analysis found to improve.",
      review: empty,
      suggestions: [],
    };
  }

  const intent = classifyImproveIntent(message);
  let live: { pulled?: PulledDatum[]; regenerated?: ImprovementReview } | undefined;
  if (intent === "pull") {
    live = { pulled: pullLiveSnapshot(analysisDbId) };
  } else if (intent === "regenerate") {
    const rebuilt = reviewAnalysisIfNeeded(analysisDbId, { force: true });
    if (rebuilt) live = { regenerated: rebuilt, pulled: rebuilt.pulled };
  }

  const result = applyImprovementTurn(current, message, locale, live);
  const meta = getDb()
    .prepare(
      `SELECT a.analysis_id, i.product FROM ai_analyses a
       JOIN monitor_alerts al ON al.id = a.alert_id
       JOIN monitor_indicators i ON i.id = al.indicator_id
       WHERE a.id = ?`
    )
    .get(analysisDbId) as { analysis_id: string; product: string } | undefined;
  persistReview(result.review, { analysisCode: meta?.analysis_id, product: meta?.product });
  return { ...result, review: getImprovementForAnalysis(analysisDbId) || result.review };
}

export function addImprovementFact(analysisDbId: number, text: string, locale: "en" | "zh-Hant" = "en") {
  return handleImprovementChat(analysisDbId, `Add fact: ${text}`, locale);
}

export function markImprovementSatisfied(analysisDbId: number, locale: "en" | "zh-Hant" = "en") {
  return handleImprovementChat(analysisDbId, "This solution is satisfactory", locale);
}
