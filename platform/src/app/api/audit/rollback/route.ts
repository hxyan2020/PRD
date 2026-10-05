import { NextResponse } from "next/server";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { getDb, writeAudit } from "@/lib/db";
import { auditBeforeState, canRollbackAudit, parseAuditDetails } from "@/lib/audit";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const auditId = Number(body.audit_id);
  if (!Number.isFinite(auditId)) {
    return NextResponse.json({ error: "audit_id required" }, { status: 400 });
  }

  const db = getDb();
  const row = db.prepare(`SELECT * FROM audit_logs WHERE id = ?`).get(auditId) as
    | {
        id: number;
        action: string;
        entity_type: string;
        entity_id: string | null;
        details_json: string;
      }
    | undefined;
  if (!row) return NextResponse.json({ error: "Audit row not found" }, { status: 404 });

  const details = parseAuditDetails(row.details_json);
  if (!canRollbackAudit(row.action, details)) {
    return NextResponse.json(
      { error: "Rollback unavailable — missing before-state or action is not reversible" },
      { status: 400 }
    );
  }
  const before = auditBeforeState(details)!;

  switch (row.action) {
    case "UPDATE_SETTING": {
      if (!hasPermission(user.role_code, "settings.manage")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      const key = row.entity_id;
      if (!key || before.value === undefined) {
        return NextResponse.json({ error: "Invalid before-state" }, { status: 400 });
      }
      const current = db
        .prepare(`SELECT value FROM platform_settings WHERE key = ?`)
        .get(key) as { value: string } | undefined;
      db.prepare(
        `UPDATE platform_settings SET value = ?, updated_at = datetime('now'), updated_by = ? WHERE key = ?`
      ).run(String(before.value), user.id, key);
      writeAudit(user, "ROLLBACK_SETTING", "platform_settings", key, {
        rollback_of: auditId,
        before: current ? { value: current.value } : null,
        after: { value: before.value },
      });
      return NextResponse.json({ ok: true });
    }

    case "TOGGLE_ESCALATION_ROUTE": {
      if (!hasPermission(user.role_code, "escalation.manage")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      const id = Number(row.entity_id);
      if (!Number.isFinite(id) || before.enabled === undefined) {
        return NextResponse.json({ error: "Invalid before-state" }, { status: 400 });
      }
      const current = db
        .prepare(`SELECT enabled FROM escalation_routes WHERE id = ?`)
        .get(id) as { enabled: number } | undefined;
      db.prepare(`UPDATE escalation_routes SET enabled = ? WHERE id = ?`).run(Number(before.enabled), id);
      writeAudit(user, "ROLLBACK_ESCALATION_TOGGLE", "escalation_route", String(id), {
        rollback_of: auditId,
        before: current ? { enabled: current.enabled } : null,
        after: { enabled: before.enabled },
      });
      return NextResponse.json({ ok: true });
    }

    case "UPDATE_ESCALATION_ROUTE": {
      if (!hasPermission(user.role_code, "escalation.manage")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      const id = Number(row.entity_id);
      if (!Number.isFinite(id)) return NextResponse.json({ error: "Invalid entity" }, { status: 400 });
      const current = db
        .prepare(
          `SELECT coefficients_json, risk_scenario, involved_teams_json, pending_minutes_threshold
           FROM escalation_routes WHERE id = ?`
        )
        .get(id);
      db.prepare(
        `UPDATE escalation_routes
         SET coefficients_json = COALESCE(?, coefficients_json),
             risk_scenario = ?,
             involved_teams_json = ?,
             pending_minutes_threshold = ?
         WHERE id = ?`
      ).run(
        (before.coefficients_json as string) ?? null,
        (before.risk_scenario as string | null) ?? null,
        (before.involved_teams_json as string | null) ?? null,
        (before.pending_minutes_threshold as number | null) ?? null,
        id
      );
      writeAudit(user, "ROLLBACK_ESCALATION_UPDATE", "escalation_route", String(id), {
        rollback_of: auditId,
        before: current ?? null,
        after: before,
      });
      return NextResponse.json({ ok: true });
    }

    case "UPDATE_USER": {
      if (!hasPermission(user.role_code, "users.manage")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      const id = Number(row.entity_id);
      if (!Number.isFinite(id)) return NextResponse.json({ error: "Invalid entity" }, { status: 400 });
      const current = db
        .prepare(`SELECT status, role_code, team_id, department_code FROM users WHERE id = ?`)
        .get(id);
      db.prepare(
        `UPDATE users SET status = ?, role_code = ?, team_id = ?, department_code = ? WHERE id = ?`
      ).run(
        (before.status as string) ?? null,
        (before.role_code as string) ?? null,
        (before.team_id as number | null) ?? null,
        (before.department_code as string | null) ?? null,
        id
      );
      writeAudit(user, "ROLLBACK_USER", "user", String(id), {
        rollback_of: auditId,
        before: current ?? null,
        after: before,
        plane: "vantage",
      });
      return NextResponse.json({ ok: true });
    }

    case "UPDATE_ROLE": {
      if (!hasPermission(user.role_code, "users.manage")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      const id = Number(row.entity_id);
      const code = row.entity_id;
      const prev = Number.isFinite(id)
        ? (db
            .prepare(`SELECT id, code, name, description, department_code, permissions_json FROM roles WHERE id = ?`)
            .get(id) as
            | {
                id: number;
                code: string;
                name: string;
                description: string;
                department_code: string | null;
                permissions_json: string;
              }
            | undefined)
        : (db
            .prepare(`SELECT id, code, name, description, department_code, permissions_json FROM roles WHERE code = ?`)
            .get(code) as
            | {
                id: number;
                code: string;
                name: string;
                description: string;
                department_code: string | null;
                permissions_json: string;
              }
            | undefined);
      if (!prev) return NextResponse.json({ error: "Role not found" }, { status: 404 });
      db.prepare(
        `UPDATE roles
         SET name = COALESCE(?, name),
             description = COALESCE(?, description),
             department_code = ?,
             permissions_json = COALESCE(?, permissions_json)
         WHERE id = ?`
      ).run(
        (before.name as string) ?? null,
        (before.description as string) ?? null,
        (before.department_code as string | null) ?? null,
        (before.permissions_json as string) ??
          (Array.isArray(before.permissions) ? JSON.stringify(before.permissions) : null),
        prev.id
      );
      writeAudit(user, "ROLLBACK_ROLE", "role", prev.code, {
        rollback_of: auditId,
        before: {
          name: prev.name,
          description: prev.description,
          department_code: prev.department_code,
          permissions_json: prev.permissions_json,
        },
        after: before,
        plane: "vantage",
      });
      return NextResponse.json({ ok: true });
    }

    case "UPDATE_THRESHOLDS": {
      if (!hasPermission(user.role_code, "monitor.operate")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      const monitorId = row.entity_id;
      const indicatorId = Number(details.indicator_id);
      if (!monitorId || !Number.isFinite(indicatorId)) {
        return NextResponse.json({ error: "Invalid entity" }, { status: 400 });
      }
      const warn = Number(before.threshold_warn);
      const breach = Number(before.threshold_breach);
      const current = db
        .prepare(`SELECT threshold_warn, threshold_breach FROM monitor_indicators WHERE id = ?`)
        .get(indicatorId);
      db.prepare(
        `UPDATE monitor_indicators SET threshold_warn = ?, threshold_breach = ? WHERE id = ?`
      ).run(warn, breach, indicatorId);
      db.prepare(
        `UPDATE detectors SET warn_threshold = ?, breach_threshold = ? WHERE monitor_id = ?`
      ).run(warn, breach, monitorId);
      writeAudit(user, "ROLLBACK_THRESHOLDS", "monitor_indicator", monitorId, {
        rollback_of: auditId,
        indicator_id: indicatorId,
        before: current ?? null,
        after: { threshold_warn: warn, threshold_breach: breach },
      });
      return NextResponse.json({ ok: true });
    }

    case "PAUSE_INDICATOR":
    case "RESUME_INDICATOR": {
      if (!hasPermission(user.role_code, "monitor.operate")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      const monitorId = row.entity_id;
      const indicatorId = Number(details.indicator_id);
      if (!monitorId || !Number.isFinite(indicatorId) || before.paused === undefined) {
        return NextResponse.json({ error: "Invalid before-state" }, { status: 400 });
      }
      const paused = Number(before.paused);
      const current = db
        .prepare(`SELECT paused FROM monitor_indicators WHERE id = ?`)
        .get(indicatorId) as { paused: number } | undefined;
      db.prepare(`UPDATE monitor_indicators SET paused = ? WHERE id = ?`).run(paused, indicatorId);
      db.prepare(`UPDATE detectors SET enabled = ? WHERE monitor_id = ?`).run(paused ? 0 : 1, monitorId);
      writeAudit(user, "ROLLBACK_INDICATOR_PAUSE", "monitor_indicator", monitorId, {
        rollback_of: auditId,
        indicator_id: indicatorId,
        before: current ? { paused: current.paused } : null,
        after: { paused },
      });
      return NextResponse.json({ ok: true });
    }

    case "TOGGLE_LARK_CHANNEL": {
      if (!hasPermission(user.role_code, "lark.manage")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      const id = Number(row.entity_id);
      if (!Number.isFinite(id) || before.enabled === undefined) {
        return NextResponse.json({ error: "Invalid before-state" }, { status: 400 });
      }
      const current = db
        .prepare(`SELECT enabled FROM lark_channels WHERE id = ?`)
        .get(id) as { enabled: number } | undefined;
      db.prepare(`UPDATE lark_channels SET enabled = ? WHERE id = ?`).run(Number(before.enabled), id);
      writeAudit(user, "ROLLBACK_LARK_TOGGLE", "lark_channel", String(id), {
        rollback_of: auditId,
        before: current ? { enabled: current.enabled } : null,
        after: { enabled: before.enabled },
      });
      return NextResponse.json({ ok: true });
    }

    case "UPDATE_DATA_SOURCE": {
      if (!hasPermission(user.role_code, "sources.manage")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      const id = Number(row.entity_id);
      if (!Number.isFinite(id)) return NextResponse.json({ error: "Invalid entity" }, { status: 400 });
      const current = db
        .prepare(`SELECT status, notes, refresh_cadence FROM data_sources WHERE id = ?`)
        .get(id);
      db.prepare(
        `UPDATE data_sources
         SET status = ?, notes = ?, refresh_cadence = ?, updated_at = datetime('now')
         WHERE id = ?`
      ).run(
        (before.status as string) ?? null,
        (before.notes as string | null) ?? null,
        (before.refresh_cadence as string | null) ?? null,
        id
      );
      writeAudit(user, "ROLLBACK_DATA_SOURCE", "data_source", String(id), {
        rollback_of: auditId,
        before: current ?? null,
        after: before,
      });
      return NextResponse.json({ ok: true });
    }

    case "UPDATE_TEAM": {
      if (!hasPermission(user.role_code, "teams.manage")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      const id = Number(row.entity_id);
      if (!Number.isFinite(id)) return NextResponse.json({ error: "Invalid entity" }, { status: 400 });
      const current = db
        .prepare(`SELECT mission, on_call_rotation FROM teams WHERE id = ?`)
        .get(id);
      db.prepare(`UPDATE teams SET mission = ?, on_call_rotation = ? WHERE id = ?`).run(
        (before.mission as string | null) ?? null,
        (before.on_call_rotation as string | null) ?? null,
        id
      );
      writeAudit(user, "ROLLBACK_TEAM", "team", String(id), {
        rollback_of: auditId,
        before: current ?? null,
        after: before,
      });
      return NextResponse.json({ ok: true });
    }

    case "RAG_UPDATE": {
      if (!hasPermission(user.role_code, "rag.manage")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      const { upsertRagDocument } = await import("@/lib/ai/rag");
      const id = Number(row.entity_id);
      if (!Number.isFinite(id)) return NextResponse.json({ error: "Invalid entity" }, { status: 400 });
      const existing = db.prepare(`SELECT * FROM rag_documents WHERE id = ?`).get(id) as
        | { id: number; doc_key: string }
        | undefined;
      if (!existing) return NextResponse.json({ error: "Document not found" }, { status: 404 });
      upsertRagDocument(db, {
        id: existing.id,
        doc_key: existing.doc_key,
        title: String(before.title ?? ""),
        category: String(before.category ?? ""),
        product_scope: String(before.product_scope ?? "CFD+CRYPTO"),
        content: String(before.content ?? ""),
        source_ref: (before.source_ref as string | null) ?? undefined,
        tags: Array.isArray(before.tags) ? (before.tags as string[]) : [],
        status: String(before.status ?? "ACTIVE"),
      });
      writeAudit(user, "ROLLBACK_RAG", "rag_document", String(id), {
        rollback_of: auditId,
        after: before,
      });
      return NextResponse.json({ ok: true });
    }

    default:
      return NextResponse.json({ error: "Unsupported rollback" }, { status: 400 });
  }
}
