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
            t1.name AS primary_team, t2.name AS secondary_team, c.name AS lark_channel
     FROM escalation_routes r
     JOIN teams t1 ON t1.id = r.primary_team_id
     LEFT JOIN teams t2 ON t2.id = r.secondary_team_id
     LEFT JOIN lark_channels c ON c.id = r.lark_channel_id
     WHERE r.enabled = 1`;
}

/**
 * Match order: exact domain+severity → domain with wild severity → default route.
 * Every alert must get a path. When SLA is missing/zero, use escalation.default_sla_minutes.
 */
export function matchEscalationRoute(
  db: Database.Database,
  domainCode: string,
  severity: string
): MatchedEscalationRoute | null {
  const defaultSla = parseDefaultSla(db);
  const select = rowSelect();

  const exact = db
    .prepare(`${select} AND r.domain_code = ? AND upper(r.severity) = upper(?) ORDER BY r.id LIMIT 1`)
    .get(domainCode, severity) as Omit<MatchedEscalationRoute, "match_kind"> | undefined;
  if (exact) {
    return {
      ...exact,
      sla_minutes: exact.sla_minutes > 0 ? exact.sla_minutes : defaultSla,
      match_kind: "exact",
    };
  }

  const domainWild = db
    .prepare(
      `${select} AND r.domain_code = ? AND (r.severity = '*' OR upper(r.severity) = 'ANY' OR upper(r.severity) = 'DEFAULT')
       ORDER BY r.id LIMIT 1`
    )
    .get(domainCode) as Omit<MatchedEscalationRoute, "match_kind"> | undefined;
  if (domainWild) {
    return {
      ...domainWild,
      sla_minutes: domainWild.sla_minutes > 0 ? domainWild.sla_minutes : defaultSla,
      match_kind: "domain_wild",
    };
  }

  const fallback = db
    .prepare(
      `${select} AND (r.is_default = 1 OR r.domain_code = '*' OR r.domain_code = 'DEFAULT' OR r.route_code = ?)
       ORDER BY CASE WHEN r.is_default = 1 THEN 0 WHEN r.route_code = ? THEN 1 ELSE 2 END, r.id
       LIMIT 1`
    )
    .get(DEFAULT_ROUTE_CODE, DEFAULT_ROUTE_CODE) as Omit<MatchedEscalationRoute, "match_kind"> | undefined;
  if (fallback) {
    return {
      ...fallback,
      sla_minutes: fallback.sla_minutes > 0 ? fallback.sla_minutes : defaultSla,
      match_kind: "default",
    };
  }

  return null;
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
