import type Database from "better-sqlite3";

export type EscalationCoefficients = {
  severity: number;
  involved_teams: number;
  risk_scenario: number;
  pending_time: number;
  need_human_intervention: number;
};

export const DEFAULT_ESCALATION_COEFFICIENTS: EscalationCoefficients = {
  severity: 1.0,
  involved_teams: 1.0,
  risk_scenario: 1.0,
  pending_time: 1.0,
  need_human_intervention: 1.0,
};

export const DEFAULT_ROUTE_CODE = "ESC-DEFAULT";

export type MatchedEscalationRoute = {
  id: number;
  route_code: string;
  name: string;
  domain_code: string;
  severity: string;
  sla_minutes: number;
  auto_actions_json: string;
  requires_human: number;
  primary_team: string;
  secondary_team: string | null;
  lark_channel: string | null;
  lark_chat_id: string | null;
  is_default: number;
  coefficients_json: string;
  match_kind: "exact" | "domain_wild" | "default";
};

function parseDefaultSla(db: Database.Database): number {
  try {
    const row = db
      .prepare(`SELECT value FROM platform_settings WHERE key = 'escalation.default_sla_minutes'`)
      .get() as { value: string } | undefined;
    const n = Number(row?.value);
    return Number.isFinite(n) && n > 0 ? n : 30;
  } catch {
    return 30;
  }
}

function rowSelect() {
  return `SELECT r.id, COALESCE(NULLIF(r.route_code, ''), 'ESC-' || r.id) AS route_code,
            r.name, r.domain_code, r.severity, r.sla_minutes, r.auto_actions_json, r.requires_human,
            COALESCE(r.is_default, 0) AS is_default,
            COALESCE(r.coefficients_json, '{}') AS coefficients_json,
            t1.name AS primary_team, t2.name AS secondary_team, c.name AS lark_channel, c.chat_id AS lark_chat_id
     FROM escalation_routes r
     JOIN teams t1 ON t1.id = r.primary_team_id
     LEFT JOIN teams t2 ON t2.id = r.secondary_team_id
     LEFT JOIN lark_channels c ON c.id = r.lark_channel_id
     WHERE r.enabled = 1`;
}

function withSla(
  row: Omit<MatchedEscalationRoute, "match_kind">,
  kind: MatchedEscalationRoute["match_kind"],
  defaultSla: number
): MatchedEscalationRoute {
  return {
    ...row,
    sla_minutes: row.sla_minutes > 0 ? row.sla_minutes : defaultSla,
    match_kind: kind,
  };
}

/**
 * Match order: exact domain+severity → domain with wild severity → ESC-DEFAULT catch-all.
 * Every alert MUST get a path (exotic / unmatched → default). Never returns null.
 * When SLA is missing/zero, use escalation.default_sla_minutes.
 */
export function matchEscalationRoute(
  db: Database.Database,
  domainCode: string,
  severity: string
): MatchedEscalationRoute {
  const defaultSla = parseDefaultSla(db);
  const select = rowSelect();
  const domain = (domainCode || "").trim() || "UNKNOWN";
  const sev = (severity || "").trim() || "WARN";

  const exact = db
    .prepare(`${select} AND r.domain_code = ? AND upper(r.severity) = upper(?) ORDER BY r.id LIMIT 1`)
    .get(domain, sev) as Omit<MatchedEscalationRoute, "match_kind"> | undefined;
  if (exact) return withSla(exact, "exact", defaultSla);

  const domainWild = db
    .prepare(
      `${select} AND r.domain_code = ? AND (r.severity = '*' OR upper(r.severity) = 'ANY' OR upper(r.severity) = 'DEFAULT')
       ORDER BY r.id LIMIT 1`
    )
    .get(domain) as Omit<MatchedEscalationRoute, "match_kind"> | undefined;
  if (domainWild) return withSla(domainWild, "domain_wild", defaultSla);

  // Prefer enabled default; if someone disabled ESC-DEFAULT, still use it so no event is pathless.
  const fallback = db
    .prepare(
      `SELECT r.id, COALESCE(NULLIF(r.route_code, ''), ?) AS route_code,
              r.name, r.domain_code, r.severity, r.sla_minutes, r.auto_actions_json, r.requires_human,
              COALESCE(r.is_default, 0) AS is_default,
              COALESCE(r.coefficients_json, '{}') AS coefficients_json,
              t1.name AS primary_team, t2.name AS secondary_team, c.name AS lark_channel, c.chat_id AS lark_chat_id
       FROM escalation_routes r
       JOIN teams t1 ON t1.id = r.primary_team_id
       LEFT JOIN teams t2 ON t2.id = r.secondary_team_id
       LEFT JOIN lark_channels c ON c.id = r.lark_channel_id
       WHERE r.is_default = 1 OR r.domain_code = '*' OR r.domain_code = 'DEFAULT' OR r.route_code = ?
       ORDER BY CASE WHEN r.is_default = 1 AND r.enabled = 1 THEN 0
                     WHEN r.route_code = ? AND r.enabled = 1 THEN 1
                     WHEN r.is_default = 1 THEN 2
                     ELSE 3 END, r.id
       LIMIT 1`
    )
    .get(DEFAULT_ROUTE_CODE, DEFAULT_ROUTE_CODE, DEFAULT_ROUTE_CODE) as
    | Omit<MatchedEscalationRoute, "match_kind">
    | undefined;
  if (fallback) return withSla(fallback, "default", defaultSla);

  // Last resort synthetic path — must never leave an event without escalation.
  const anyTeam = db.prepare(`SELECT name FROM teams ORDER BY id LIMIT 1`).get() as { name: string } | undefined;
  return {
    id: 0,
    route_code: DEFAULT_ROUTE_CODE,
    name: "Default catch-all (exotic / unmatched)",
    domain_code: "*",
    severity: "ANY",
    sla_minutes: defaultSla,
    auto_actions_json: JSON.stringify(["create_ticket", "lark_notify", "ai_rca"]),
    requires_human: 1,
    primary_team: anyTeam?.name || "Risk Control Desk",
    secondary_team: null,
    lark_channel: "Risk Desk",
    lark_chat_id: "oc_risk_control_desk",
    is_default: 1,
    coefficients_json: JSON.stringify(DEFAULT_ESCALATION_COEFFICIENTS),
    match_kind: "default",
  };
}

export function parseCoefficients(raw: string | null | undefined): EscalationCoefficients {
  try {
    const v = JSON.parse(raw || "{}") as Partial<EscalationCoefficients>;
    return {
      severity: Number(v.severity ?? DEFAULT_ESCALATION_COEFFICIENTS.severity),
      involved_teams: Number(v.involved_teams ?? DEFAULT_ESCALATION_COEFFICIENTS.involved_teams),
      risk_scenario: Number(v.risk_scenario ?? DEFAULT_ESCALATION_COEFFICIENTS.risk_scenario),
      pending_time: Number(v.pending_time ?? DEFAULT_ESCALATION_COEFFICIENTS.pending_time),
      need_human_intervention: Number(
        v.need_human_intervention ?? DEFAULT_ESCALATION_COEFFICIENTS.need_human_intervention
      ),
    };
  } catch {
    return { ...DEFAULT_ESCALATION_COEFFICIENTS };
  }
}

export function getDefaultRouteCode(db: Database.Database): string {
  try {
    const setting = db
      .prepare(`SELECT value FROM platform_settings WHERE key = 'escalation.default_route_code'`)
      .get() as { value: string } | undefined;
    if (setting?.value) return setting.value;
  } catch {
    /* ignore */
  }
  const row = db
    .prepare(
      `SELECT COALESCE(NULLIF(route_code, ''), ?) AS code FROM escalation_routes
       WHERE enabled = 1 AND (is_default = 1 OR domain_code = '*' OR route_code = ?)
       ORDER BY is_default DESC LIMIT 1`
    )
    .get(DEFAULT_ROUTE_CODE, DEFAULT_ROUTE_CODE) as { code: string } | undefined;
  return row?.code || DEFAULT_ROUTE_CODE;
}
