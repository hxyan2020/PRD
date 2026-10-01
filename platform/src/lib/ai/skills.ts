import type Database from "better-sqlite3";

type SkillStep = {
  action: string;
  description: string;
  params?: Record<string, unknown>;
  requires_human?: boolean;
};

type SkillDef = {
  code: string;
  name: string;
  description: string;
  indicator_patterns: string[];
  conditions: {
    severity_in?: string[];
    min_observed?: number;
    max_observed?: number;
    status_in?: string[];
  };
  steps: SkillStep[];
  owner_department: string;
  auto_execute?: boolean;
};

const SKILLS: SkillDef[] = [
  {
    code: "SKILL-MARGIN-SPIKE",
    name: "Margin utilisation spike playbook",
    description:
      "Known credit-risk path when many accounts exceed 90% margin utilisation. Verify feed/copy cluster, then notify Credit desk.",
    indicator_patterns: ["M2-MRG-014"],
    conditions: { severity_in: ["BREACH"], min_observed: 100 },
    owner_department: "RISK_CONTROL",
    steps: [
      {
        action: "lark_notify",
        description: "Notify Credit & Client Risk",
        params: { channel: "oc_credit_client_risk" },
      },
      {
        action: "check_copy_overlap",
        description: "Check whether margin spike overlaps top copy providers (dummy)",
      },
      {
        action: "flag_for_human_review",
        description: "If not explained by macro calendar, consider group leverage tighten",
        requires_human: true,
      },
    ],
  },
  {
    code: "SKILL-COPY-CONCENTRATION",
    name: "Copy provider concentration breach",
    description:
      "Known issue when a single signal provider exceeds copier equity concentration breach threshold. Clear path: cap new copies, notify Risk Desk, open investigation.",
    indicator_patterns: ["M2-COPY-009"],
    conditions: { severity_in: ["BREACH"], min_observed: 25 },
    owner_department: "RISK_CONTROL",
    steps: [
      {
        action: "lark_notify",
        description: "Notify Credit & Client Risk Lark channel",
        params: { channel: "oc_credit_client_risk", template: "copy_concentration" },
      },
      {
        action: "suggest_copier_cap",
        description: "Propose temporary 20% per-provider copier equity cap",
        params: { cap_pct: 20 },
      },
      {
        action: "pause_new_copies",
        description: "Pause new copy allocations to the top provider (dry-run in prototype)",
        params: { mode: "top_provider_only" },
        requires_human: true,
      },
      {
        action: "flag_for_human_review",
        description: "Require Risk Owner confirmation before lifting cap",
      },
    ],
  },
  {
    code: "SKILL-CRYPTO-HOT-WALLET",
    name: "Hot wallet float elevated",
    description:
      "Known custody control when hot wallet float exceeds warn. Path: cold sweep + Lark notify System/Crypto risk.",
    indicator_patterns: ["M2-CRYPTO-WALLET"],
    conditions: { severity_in: ["WARN", "BREACH"], min_observed: 15 },
    owner_department: "SYSTEM",
    steps: [
      {
        action: "lark_notify",
        description: "Notify Crypto Exchange Risk + Trading Infra",
        params: { channel: "oc_crypto_exchange_risk" },
      },
      {
        action: "suggest_cold_wallet_sweep",
        description: "Recommend cold sweep to bring float under 12%",
        params: { target_float_pct: 12 },
      },
      {
        action: "flag_for_human_review",
        description: "Human must approve withdrawal pause if float >= 25%",
        requires_human: true,
      },
    ],
  },
  {
    code: "SKILL-LP-REJECT-STORM",
    name: "LP reject rate storm",
    description:
      "Known infra/liquidity path when LP reject rate breaches. Page infra, consider LP disable.",
    indicator_patterns: ["M2-LP-022"],
    conditions: { severity_in: ["BREACH", "CRITICAL"], min_observed: 5 },
    owner_department: "SYSTEM",
    steps: [
      { action: "lark_notify", description: "Page Trading Infra P1", params: { channel: "oc_trading_infra" } },
      {
        action: "suggest_lp_disable",
        description: "Propose disable of top rejecting LP endpoint",
        requires_human: true,
      },
      { action: "check_bridge_health", description: "Run oneZero bridge health checklist (dummy)" },
    ],
  },
  {
    code: "SKILL-HEDGE-COVERAGE",
    name: "Hedge coverage below target",
    description:
      "Known book risk when hedge coverage < warn. Align A-book routing and inventory.",
    indicator_patterns: ["M2-HEDGE-007"],
    conditions: { severity_in: ["WARN", "BREACH"], max_observed: 85 },
    owner_department: "RISK_CONTROL",
    // Note: max_observed means coverage is at or below threshold — we'll treat observed <= max
    steps: [
      { action: "lark_notify", description: "Notify Risk Control Desk", params: { channel: "oc_risk_control_desk" } },
      {
        action: "suggest_abook_increase",
        description: "Propose increasing A-book ratio on top toxic symbols",
      },
      { action: "flag_for_human_review", description: "Risk Analyst validates inventory skew", requires_human: true },
    ],
  },
  {
    code: "SKILL-FRAUD-CLUSTER",
    name: "Multi-account fraud cluster",
    description:
      "Known abuse path when multi-account cluster score breaches. Ops KYC linkage + bonus freeze.",
    indicator_patterns: ["M2-FRAUD-011"],
    conditions: { severity_in: ["BREACH"], min_observed: 0.85 },
    owner_department: "OPERATIONS",
    steps: [
      { action: "lark_notify", description: "Notify Ops War Room", params: { channel: "oc_ops_funding_recon" } },
      {
        action: "suggest_bonus_freeze",
        description: "Freeze promo/bonus payouts for cluster accounts",
        requires_human: true,
      },
      { action: "flag_for_human_review", description: "Ops Lead reviews KYC linkage before bans" },
    ],
  },
  {
    code: "SKILL-XAU247-EXPOSURE",
    name: "XAUUSD247 net exposure near limit",
    description:
      "Known product control when 24/7 gold net exposure approaches hard limit. Close-only preparedness.",
    indicator_patterns: ["M2-XAU-247"],
    conditions: { severity_in: ["WARN", "BREACH"], min_observed: 10000 },
    owner_department: "RISK_CONTROL",
    steps: [
      { action: "lark_notify", description: "Notify Risk Control Desk", params: { channel: "oc_risk_control_desk" } },
      {
        action: "suggest_close_only_prepare",
        description: "Prepare close-only mode messaging for approaching 15k net lots",
      },
      { action: "flag_for_human_review", description: "Confirm weekend promo not amplifying exposure", requires_human: true },
    ],
  },
];

export function seedSkillsIfEmpty(db: Database.Database) {
  const upsert = db.prepare(
    `INSERT INTO ai_skills
      (code, name, description, indicator_patterns_json, conditions_json, certainty_required, steps_json, auto_execute, owner_department)
     VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?)
     ON CONFLICT(code) DO UPDATE SET
       name = excluded.name,
       description = excluded.description,
       indicator_patterns_json = excluded.indicator_patterns_json,
       conditions_json = excluded.conditions_json,
       steps_json = excluded.steps_json,
       auto_execute = excluded.auto_execute,
       owner_department = excluded.owner_department,
       status = 'ACTIVE'`
  );

  for (const s of SKILLS) {
    upsert.run(
      s.code,
      s.name,
      s.description,
      JSON.stringify(s.indicator_patterns),
      JSON.stringify(s.conditions),
      JSON.stringify(s.steps),
      s.auto_execute === false ? 0 : 1,
      s.owner_department
    );
  }
}

export function matchSkill(
  db: Database.Database,
  monitorId: string,
  severity: string,
  observed: number | null
): { skill: Record<string, unknown>; certainty: true } | null {
  const skills = db
    .prepare(`SELECT * FROM ai_skills WHERE status = 'ACTIVE'`)
    .all() as Array<{
    id: number;
    code: string;
    name: string;
    description: string;
    indicator_patterns_json: string;
    conditions_json: string;
    steps_json: string;
    auto_execute: number;
    owner_department: string;
  }>;

  for (const skill of skills) {
    const patterns = JSON.parse(skill.indicator_patterns_json) as string[];
    const matched = patterns.some((p) => {
      if (p.endsWith("*")) return monitorId.startsWith(p.slice(0, -1));
      return p === monitorId;
    });
    if (!matched) continue;

    const cond = JSON.parse(skill.conditions_json) as SkillDef["conditions"];
    if (cond.severity_in && !cond.severity_in.includes(severity)) continue;
    if (observed != null && cond.min_observed != null && observed < cond.min_observed) continue;
    if (observed != null && cond.max_observed != null && observed > cond.max_observed) continue;

    // All hard conditions matched → treat as known issue with certainty
    return { skill, certainty: true };
  }
  return null;
}
