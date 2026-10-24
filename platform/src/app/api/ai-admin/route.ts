import { NextResponse } from "next/server";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import {
  decideChangeRequest,
  getAiAdminOverview,
  listAiParams,
  listChangeRequests,
  listRagForAdmin,
  listSkillsForAdmin,
  listTrainingRuns,
  proposeChange,
  queueTrainingRun,
  submitFeedback,
} from "@/lib/ai/admin";
import { getDb } from "@/lib/db";

function canView(role: string) {
  return (
    hasPermission(role, "ai.admin") ||
    hasPermission(role, "ai.read") ||
    hasPermission(role, "skills.manage") ||
    hasPermission(role, "rag.manage")
  );
}

function canPropose(role: string) {
  return (
    hasPermission(role, "ai.propose") ||
    hasPermission(role, "skills.manage") ||
    hasPermission(role, "rag.manage") ||
    hasPermission(role, "settings.manage")
  );
}

function canApprove(role: string) {
  return (
    hasPermission(role, "ai.approve") ||
    hasPermission(role, "skills.approve") ||
    hasPermission(role, "rag.approve")
  );
}

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user || !canView(user.role_code)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const tab = new URL(req.url).searchParams.get("tab") || "overview";
  const status = new URL(req.url).searchParams.get("status") || undefined;

  if (tab === "params") {
    return NextResponse.json({ params: listAiParams() });
  }
  if (tab === "changes") {
    return NextResponse.json({
      changes: listChangeRequests(status),
      can_propose: canPropose(user.role_code),
      can_approve: canApprove(user.role_code),
    });
  }
  if (tab === "training") {
    return NextResponse.json({ runs: listTrainingRuns() });
  }
  if (tab === "skills") {
    return NextResponse.json({ skills: listSkillsForAdmin() });
  }
  if (tab === "rag") {
    return NextResponse.json({ documents: listRagForAdmin() });
  }

  return NextResponse.json({
    overview: getAiAdminOverview(),
    params: listAiParams(),
    changes: listChangeRequests(),
    training: listTrainingRuns(),
    skills: listSkillsForAdmin(),
    rag: listRagForAdmin(),
    roles: {
      can_propose: canPropose(user.role_code),
      can_approve: canApprove(user.role_code),
      can_manage_skills: hasPermission(user.role_code, "skills.manage"),
      can_manage_rag: hasPermission(user.role_code, "rag.manage"),
      user_id: user.id,
      role_code: user.role_code,
    },
  });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json().catch(() => ({}));
  const actor = { id: user.id, name: user.name, role_code: user.role_code };

  try {
    if (body.action === "propose") {
      if (!canPropose(user.role_code)) {
        return NextResponse.json({ error: "Forbidden — maker role required" }, { status: 403 });
      }
      const result = proposeChange({
        actor,
        entity_type: String(body.entity_type || ""),
        action: String(body.change_action || body.entity_action || "UPDATE"),
        title: String(body.title || "AI change request"),
        summary: String(body.summary || ""),
        payload: (body.payload || {}) as Record<string, unknown>,
        before: (body.before || null) as Record<string, unknown> | null,
      });
      return NextResponse.json({ ok: true, ...result });
    }

    if (body.action === "decide") {
      if (!canApprove(user.role_code)) {
        return NextResponse.json({ error: "Forbidden — checker role required" }, { status: 403 });
      }
      if (!body.id || !["APPROVED", "REJECTED"].includes(body.decision)) {
        return NextResponse.json({ error: "id and decision required" }, { status: 400 });
      }
      const result = decideChangeRequest({
        id: Number(body.id),
        decision: body.decision,
        note: body.note,
        actor,
      });
      return NextResponse.json(result);
    }

    if (body.action === "propose_param") {
      if (!canPropose(user.role_code)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      const key = String(body.key || "");
      const value = String(body.value ?? "");
      const before = getDb().prepare(`SELECT key, value FROM platform_settings WHERE key = ?`).get(key) as
        | { key: string; value: string }
        | undefined;
      const result = proposeChange({
        actor,
        entity_type: "PARAM",
        action: "UPDATE",
        title: `Update ${key} → ${value}`,
        summary: body.summary || `Propose changing ${key} from ${before?.value ?? "?"} to ${value}`,
        payload: { key, value },
        before: before || null,
      });
      return NextResponse.json({ ok: true, ...result });
    }

    if (body.action === "propose_skill") {
      if (!hasPermission(user.role_code, "skills.manage") && !hasPermission(user.role_code, "ai.propose")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      const changeAction = String(body.change_action || "CREATE");
      const result = proposeChange({
        actor,
        entity_type: "SKILL",
        action: changeAction,
        title: body.title || `${changeAction} skill`,
        summary: body.summary || "",
        payload: body.payload || {},
        before: body.before || null,
      });
      return NextResponse.json({ ok: true, ...result });
    }

    if (body.action === "propose_rag") {
      if (!hasPermission(user.role_code, "rag.manage") && !hasPermission(user.role_code, "ai.propose")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      const changeAction = String(body.change_action || "CREATE");
      const result = proposeChange({
        actor,
        entity_type: "RAG",
        action: changeAction,
        title: body.title || `${changeAction} RAG document`,
        summary: body.summary || "",
        payload: body.payload || {},
        before: body.before || null,
      });
      return NextResponse.json({ ok: true, ...result });
    }

    if (body.action === "queue_training") {
      if (!canPropose(user.role_code)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      const result = queueTrainingRun({
        actor,
        name: String(body.name || "Training run"),
        model_name: String(body.model_name || "crmp-skill-matcher-v1"),
        dataset_label: String(body.dataset_label || "live-window"),
        notes: body.notes,
      });
      return NextResponse.json({ ok: true, ...result });
    }

    if (body.action === "feedback") {
      if (!hasPermission(user.role_code, "ai.operate") && !hasPermission(user.role_code, "ai.admin")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      if (!body.analysis_id || !["CORRECT", "INCORRECT", "PARTIAL"].includes(body.label)) {
        return NextResponse.json({ error: "analysis_id and label required" }, { status: 400 });
      }
      const result = submitFeedback({
        analysisId: Number(body.analysis_id),
        label: body.label,
        note: body.note,
        actor,
      });
      return NextResponse.json({ ok: true, ...result });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
