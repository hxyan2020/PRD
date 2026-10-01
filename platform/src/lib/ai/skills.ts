import type Database from "better-sqlite3";
import { LINKED_SCENARIOS, SKILL_SCENARIOS } from "@/lib/ai/risk-scenarios-catalog";
import type { SkillScenario } from "@/lib/ai/scenario-types";

export function ensureSkillScenarioColumns(db: Database.Database) {
  const cols = db.prepare(`PRAGMA table_info(ai_skills)`).all() as Array<{ name: string }>;
  if (!cols.some((c) => c.name === "scenario_json")) {
    db.exec(`ALTER TABLE ai_skills ADD COLUMN scenario_json TEXT NOT NULL DEFAULT '{}'`);
  }
  db.exec(`
    CREATE TABLE IF NOT EXISTS risk_scenario_chains (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      product TEXT NOT NULL,
      domain TEXT NOT NULL,
      severity TEXT NOT NULL,
      sequence_json TEXT NOT NULL,
      causes_json TEXT NOT NULL,
      escalation_json TEXT NOT NULL,
      corrections_json TEXT NOT NULL,
      linked_skills_json TEXT NOT NULL,
      past_cases_json TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'ACTIVE',
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
}

export function seedSkillsIfEmpty(db: Database.Database) {
  ensureSkillScenarioColumns(db);

  const upsert = db.prepare(
    `INSERT INTO ai_skills
      (code, name, description, indicator_patterns_json, conditions_json, certainty_required, steps_json, auto_execute, owner_department, scenario_json, status)
     VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?, ?, 'ACTIVE')
     ON CONFLICT(code) DO UPDATE SET
       name = excluded.name,
       description = excluded.description,
       indicator_patterns_json = excluded.indicator_patterns_json,
       conditions_json = excluded.conditions_json,
       steps_json = excluded.steps_json,
       auto_execute = excluded.auto_execute,
       owner_department = excluded.owner_department,
       scenario_json = excluded.scenario_json,
       status = 'ACTIVE'`
  );

  for (const s of SKILL_SCENARIOS) {
    upsert.run(
      s.code,
      s.name,
      s.description,
      JSON.stringify([s.indicator.monitor_id]),
      JSON.stringify(s.conditions),
      JSON.stringify(s.steps),
      s.auto_execute === false ? 0 : 1,
      s.owner_department,
      JSON.stringify(s)
    );
  }

  const upsertChain = db.prepare(
    `INSERT INTO risk_scenario_chains
      (code, name, description, product, domain, severity, sequence_json, causes_json, escalation_json, corrections_json, linked_skills_json, past_cases_json, status, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', datetime('now'))
     ON CONFLICT(code) DO UPDATE SET
       name = excluded.name,
       description = excluded.description,
       product = excluded.product,
       domain = excluded.domain,
       severity = excluded.severity,
       sequence_json = excluded.sequence_json,
       causes_json = excluded.causes_json,
       escalation_json = excluded.escalation_json,
       corrections_json = excluded.corrections_json,
       linked_skills_json = excluded.linked_skills_json,
       past_cases_json = excluded.past_cases_json,
       status = 'ACTIVE',
       updated_at = datetime('now')`
  );

  for (const c of LINKED_SCENARIOS) {
    upsertChain.run(
      c.code,
      c.name,
      c.description,
      c.product,
      c.domain,
      c.severity,
      JSON.stringify(c.sequence),
      JSON.stringify(c.causes),
      JSON.stringify(c.escalation_plan),
      JSON.stringify(c.corrections),
      JSON.stringify(c.linked_skills),
      JSON.stringify(c.past_cases)
    );
  }
}

export function listSkillScenarios(db: Database.Database) {
  ensureSkillScenarioColumns(db);
  return db
    .prepare(`SELECT * FROM ai_skills WHERE status='ACTIVE' ORDER BY code`)
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
    status: string;
    scenario_json: string;
  }>;
}

export function listLinkedScenarios(db: Database.Database) {
  ensureSkillScenarioColumns(db);
  return db
    .prepare(`SELECT * FROM risk_scenario_chains WHERE status='ACTIVE' ORDER BY severity DESC, code`)
    .all() as Array<{
    id: number;
    code: string;
    name: string;
    description: string;
    product: string;
    domain: string;
    severity: string;
    sequence_json: string;
    causes_json: string;
    escalation_json: string;
    corrections_json: string;
    linked_skills_json: string;
    past_cases_json: string;
  }>;
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

    const cond = JSON.parse(skill.conditions_json) as SkillScenario["conditions"];
    if (cond.severity_in && !cond.severity_in.includes(severity)) continue;
    if (observed != null && cond.min_observed != null && observed < cond.min_observed) continue;
    if (observed != null && cond.max_observed != null && observed > cond.max_observed) continue;

    return { skill, certainty: true };
  }
  return null;
}
