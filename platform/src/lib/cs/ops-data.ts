/**
 * Live CS/TR operational data: BUs, teams, POCs, escalation hops, parameters, sources, Lark.
 */
import type Database from "better-sqlite3";
import { getDb } from "@/lib/db";
import { escalationRouteForSkill } from "@/lib/ai/skill-escalation-map";
import { CS_SKILL_CODES } from "@/lib/cs/skills";
import {
  CS_BU_CODES,
  CS_FOLLOWUP_CAP_DEFAULT,
  CS_INTAKE_DEMO_TOKEN,
  CS_ROUTE_CODES,
  CS_ROUTE_HOPS,
  CS_SETTING_SEED,
  CS_SOURCE_SPECS,
  CS_TEAM_SPECS,
} from "@/lib/cs/params";

export type CsOpsSetting = { key: string; value: string; description: string | null };
export type CsOpsMember = { email: string; name: string; role_code: string };
export type CsOpsTeam = {
  id: number | null;
  name: string;
  department_code: string;
  mission: string | null;
  lark_chat_id: string | null;
  on_call_rotation: string | null;
  member_count: number;
  members: CsOpsMember[];
};
export type CsOpsBu = {
  code: string;
  name: string;
  mandate: string | null;
  team_count: number;
  user_count: number;
};
export type CsOpsPoc = {
  email: string;
  name: string;
  role_code: string;
  department_code: string | null;
  team_name: string | null;
};
export type CsOpsHop = { step: number; team: string; poc_role: string; sla_minutes: number };
export type CsOpsRoute = {
  route_code: string;
  name: string;
  domain_code: string | null;
  severity: string | null;
  sla_minutes: number | null;
  primary_team: string | null;
  secondary_team: string | null;
  lark_channel: string | null;
  risk_scenario: string | null;
  hops: CsOpsHop[];
  skills: string[];
};
export type CsOpsSource = {
  name: string;
  category: string;
  url: string | null;
  owner_department: string | null;
  status: string | null;
  notes: string | null;
};
export type CsOpsLark = {
  name: string;
  chat_id: string;
  purpose: string | null;
  department_code: string | null;
  enabled: number;
};
export type CsOpsParams = {
  followup_cap: number;
  wait_sla_minutes: number;
  id_verify_sla_minutes: number;
  tr_sla_minutes: number;
  risk_sla_minutes: number;
  intake_token: string;
  mailbox_support: string;
  mailbox_complaints: string;
  lark_cs: string;
  lark_kyc: string;
  lark_tr: string;
};
export type CsOpsContract = {
  generated_at: string;
  bus: CsOpsBu[];
  teams: CsOpsTeam[];
  pocs: CsOpsPoc[];
  routes: CsOpsRoute[];
  settings: CsOpsSetting[];
  sources: CsOpsSource[];
  lark: CsOpsLark[];
  params: CsOpsParams;
  skill_binds: Array<{ skill_code: string; route_code: string }>;
};

function settingMap(db: Database.Database): Map<string, string> {
  const rows = db
    .prepare(`SELECT key, value FROM platform_settings WHERE key LIKE 'cs.%'`)
    .all() as Array<{ key: string; value: string }>;
  return new Map(rows.map((r) => [r.key, r.value]));
}

export function getCsSetting(key: string, fallback = "", db: Database.Database = getDb()): string {
  try {
    const row = db.prepare(`SELECT value FROM platform_settings WHERE key = ?`).get(key) as { value: string } | undefined;
    if (row?.value != null && String(row.value).trim() !== "") return String(row.value);
  } catch {
    /* schema not ready */
  }
  const seed = CS_SETTING_SEED.find((s) => s.key === key);
  return seed?.value ?? fallback;
}

export function getCsFollowupCap(db: Database.Database = getDb()): number {
  const raw = Number(getCsSetting("cs.followup_cap", String(CS_FOLLOWUP_CAP_DEFAULT), db));
  if (!Number.isFinite(raw) || raw < 1) return CS_FOLLOWUP_CAP_DEFAULT;
  return Math.min(12, Math.floor(raw));
}

export function getCsIntakeToken(db: Database.Database = getDb()): string {
  return getCsSetting("cs.intake_token", CS_INTAKE_DEMO_TOKEN, db) || CS_INTAKE_DEMO_TOKEN;
}

export function getCsMailboxFrom(reason?: string, db: Database.Database = getDb()): string {
  if (reason === "complaint") return getCsSetting("cs.mailbox_complaints", "complaints@vantagemarkets.com", db);
  return getCsSetting("cs.mailbox_support", "support@vantagemarkets.com", db);
}

function numSetting(map: Map<string, string>, key: string, fallback: number): number {
  const n = Number(map.get(key) ?? fallback);
  return Number.isFinite(n) ? n : fallback;
}

const SKILL_BIND_LIST = [
  CS_SKILL_CODES.clarify,
  CS_SKILL_CODES.idVerify,
  CS_SKILL_CODES.accountFaq,
  CS_SKILL_CODES.execution,
  CS_SKILL_CODES.escalateRisk,
];

/** Live BU / team / escalation / parameter / source / Lark contract for CS/TR. */
export function getCsOpsContract(db: Database.Database = getDb()): CsOpsContract {
  const bus = db
    .prepare(
      `SELECT d.code, d.name, d.description AS mandate,
              (SELECT COUNT(*) FROM teams t WHERE t.department_code = d.code) AS team_count,
              (SELECT COUNT(*) FROM users u WHERE u.department_code = d.code) AS user_count
       FROM departments d
       WHERE d.code IN (${CS_BU_CODES.map(() => "?").join(",")})
       ORDER BY d.code`
    )
    .all(...CS_BU_CODES) as CsOpsBu[];

  const teamNames = CS_TEAM_SPECS.map((t) => t.name);
  const teamRows = db
    .prepare(
      `SELECT t.id, t.name, t.department_code, t.mission, t.lark_chat_id, t.on_call_rotation,
              (SELECT COUNT(*) FROM users u WHERE u.team_id = t.id) AS member_count
       FROM teams t
       WHERE t.name IN (${teamNames.map(() => "?").join(",")})
       ORDER BY t.department_code, t.name`
    )
    .all(...teamNames) as Array<CsOpsTeam & { id: number }>;

  const memberStmt = db.prepare(
    `SELECT email, name, role_code FROM users WHERE team_id = ? ORDER BY role_code, name`
  );
  const teams: CsOpsTeam[] = teamRows.map((t) => ({
    ...t,
    members: memberStmt.all(t.id) as CsOpsMember[],
  }));
  for (const spec of CS_TEAM_SPECS) {
    if (!teams.some((t) => t.name === spec.name)) {
      teams.push({
        id: null,
        name: spec.name,
        department_code: spec.department_code,
        mission: spec.mission,
        lark_chat_id: spec.lark_chat_id,
        on_call_rotation: spec.on_call_rotation,
        member_count: 0,
        members: [],
      });
    }
  }

  const pocs = db
    .prepare(
      `SELECT u.email, u.name, u.role_code, u.department_code, t.name AS team_name
       FROM users u
       LEFT JOIN teams t ON t.id = u.team_id
       WHERE u.department_code IN (${CS_BU_CODES.map(() => "?").join(",")})
       ORDER BY u.department_code, u.role_code, u.name`
    )
    .all(...CS_BU_CODES) as CsOpsPoc[];

  const skillBinds = SKILL_BIND_LIST.map((skill_code) => ({
    skill_code,
    route_code: escalationRouteForSkill(skill_code),
  }));
  const skillsByRoute = new Map<string, string[]>();
  for (const b of skillBinds) {
    const list = skillsByRoute.get(b.route_code) || [];
    list.push(b.skill_code);
    skillsByRoute.set(b.route_code, list);
  }

  const routeRows = db
    .prepare(
      `SELECT e.route_code, e.name, e.domain_code, e.severity, e.sla_minutes, e.risk_scenario,
              pt.name AS primary_team, st.name AS secondary_team, lc.name AS lark_channel
       FROM escalation_routes e
       LEFT JOIN teams pt ON pt.id = e.primary_team_id
       LEFT JOIN teams st ON st.id = e.secondary_team_id
       LEFT JOIN lark_channels lc ON lc.id = e.lark_channel_id
       WHERE e.route_code IN (${CS_ROUTE_CODES.map(() => "?").join(",")})
       ORDER BY e.route_code`
    )
    .all(...CS_ROUTE_CODES) as Array<Omit<CsOpsRoute, "hops" | "skills">>;

  const routes: CsOpsRoute[] = CS_ROUTE_CODES.map((code) => {
    const row = routeRows.find((r) => r.route_code === code);
    return {
      route_code: code,
      name: row?.name || code,
      domain_code: row?.domain_code || null,
      severity: row?.severity || null,
      sla_minutes: row?.sla_minutes ?? null,
      primary_team: row?.primary_team || null,
      secondary_team: row?.secondary_team || null,
      lark_channel: row?.lark_channel || null,
      risk_scenario: row?.risk_scenario || null,
      hops: CS_ROUTE_HOPS[code] || [],
      skills: skillsByRoute.get(code) || [],
    };
  });

  const settings = db
    .prepare(
      `SELECT key, value, description FROM platform_settings WHERE key LIKE 'cs.%' ORDER BY key`
    )
    .all() as CsOpsSetting[];
  if (!settings.length) {
    for (const s of CS_SETTING_SEED) settings.push({ key: s.key, value: s.value, description: s.description });
  }

  const sourceNames = CS_SOURCE_SPECS.map((s) => s.name);
  const sources = db
    .prepare(
      `SELECT name, category, url, owner_department, status, notes
       FROM data_sources
       WHERE name IN (${sourceNames.map(() => "?").join(",")})
          OR owner_department IN ('CUSTOMER_SERVICE','TRADING')
       ORDER BY owner_department, name`
    )
    .all(...sourceNames) as CsOpsSource[];

  const lark = db
    .prepare(
      `SELECT name, chat_id, purpose, department_code, enabled
       FROM lark_channels
       WHERE chat_id IN ('oc_cs_c1','oc_cs_kyc','oc_tr_dealing')
          OR department_code IN ('CUSTOMER_SERVICE','TRADING')
       ORDER BY department_code, name`
    )
    .all() as CsOpsLark[];

  const map = settingMap(db);
  const params: CsOpsParams = {
    followup_cap: numSetting(map, "cs.followup_cap", CS_FOLLOWUP_CAP_DEFAULT),
    wait_sla_minutes: numSetting(map, "cs.wait_sla_minutes", 30),
    id_verify_sla_minutes: numSetting(map, "cs.id_verify_sla_minutes", 60),
    tr_sla_minutes: numSetting(map, "cs.tr_sla_minutes", 15),
    risk_sla_minutes: numSetting(map, "cs.risk_sla_minutes", 10),
    intake_token: map.get("cs.intake_token") || CS_INTAKE_DEMO_TOKEN,
    mailbox_support: map.get("cs.mailbox_support") || "support@vantagemarkets.com",
    mailbox_complaints: map.get("cs.mailbox_complaints") || "complaints@vantagemarkets.com",
    lark_cs: map.get("cs.lark_cs") || "oc_cs_c1",
    lark_kyc: map.get("cs.lark_kyc") || "oc_cs_kyc",
    lark_tr: map.get("cs.lark_tr") || "oc_tr_dealing",
  };

  return {
    generated_at: new Date().toISOString(),
    bus,
    teams,
    pocs,
    routes,
    settings,
    sources,
    lark,
    params,
    skill_binds: skillBinds,
  };
}
