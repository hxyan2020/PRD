import { NextResponse } from "next/server";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import {
  discoveryPendingCount,
  listDiscoveryCandidates,
  listDiscoveryReviews,
  listDiscoveryScans,
  reviewDiscoveryCandidate,
  runDiscoveryParallel,
  type DiscoveryReviewAction,
} from "@/lib/ai/discovery";
import {
  analyseDiscoveryCandidate,
  disableDiscoveryOpenAi,
  enableDiscoveryOpenAi,
  getDiscoveryAiStatus,
} from "@/lib/ai/discovery-analyse";
import { getDb, writeAudit } from "@/lib/db";
import { RISK_DISCOVERY_NOTEBOOK } from "@/lib/ai/discovery-links";

function canView(role: string) {
  return (
    hasPermission(role, "monitor.read") ||
    hasPermission(role, "ai.read") ||
    hasPermission(role, "skills.read") ||
    hasPermission(role, "ai.admin")
  );
}

function canOperate(role: string) {
  return (
    hasPermission(role, "monitor.operate") ||
    hasPermission(role, "detectors.operate") ||
    hasPermission(role, "ai.operate")
  );
}

function canReview(role: string) {
  return (
    hasPermission(role, "ai.approve") ||
    hasPermission(role, "skills.approve") ||
    role === "RISK_OWNER" ||
    role === "SUPER_ADMIN"
  );
}

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user || !canView(user.role_code)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const status = new URL(req.url).searchParams.get("status") || undefined;
  const settings = getDb()
    .prepare(`SELECT key, value, description FROM platform_settings WHERE key LIKE 'discovery.%' ORDER BY key`)
    .all();
  return NextResponse.json({
    candidates: listDiscoveryCandidates(status || undefined, 100),
    scans: listDiscoveryScans(40),
    reviews: listDiscoveryReviews(40),
    pending_count: discoveryPendingCount(),
    settings,
    ai_status: getDiscoveryAiStatus(),
    notebook: RISK_DISCOVERY_NOTEBOOK,
    roles: {
      can_operate: canOperate(user.role_code),
      can_review: canReview(user.role_code),
      user_id: user.id,
      role_code: user.role_code,
      user_name: user.name,
    },
  });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json().catch(() => ({}));
  const actor = { id: user.id, name: user.name, role_code: user.role_code };

  try {
    if (body.action === "scan_now") {
      if (!canOperate(user.role_code)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      return NextResponse.json(runDiscoveryParallel({ actor: user.name, trigger: "MANUAL" }));
    }

    if (body.action === "connect_openai") {
      if (!canOperate(user.role_code) && !canReview(user.role_code)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      const model = String(body.model || "gpt-4.1-mini");
      const status = enableDiscoveryOpenAi(model);
      writeAudit(user, "DISCOVERY_CONNECT_OPENAI", "risk_discovery", "ai_mode", {
        mode: status.mode,
        model: status.model,
        key_configured: status.key_configured,
      });
      return NextResponse.json({ ok: true, status });
    }

    if (body.action === "disconnect_openai") {
      if (!canOperate(user.role_code) && !canReview(user.role_code)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      const status = disableDiscoveryOpenAi();
      writeAudit(user, "DISCOVERY_DISCONNECT_OPENAI", "risk_discovery", "ai_mode", {
        mode: status.mode,
      });
      return NextResponse.json({ ok: true, status });
    }

    if (body.action === "analyse") {
      if (!canOperate(user.role_code) && !canReview(user.role_code) && !hasPermission(user.role_code, "ai.read")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      const candidateId = String(body.candidate_id || "");
      const row = listDiscoveryCandidates(undefined, 200).find(
        (c) => (c as { candidate_id: string }).candidate_id === candidateId
      ) as
        | {
            candidate_id: string;
            method: string;
            scenario: string;
            proposed_indicator: string;
            proposed_dimension: string;
            score: number;
            evidence_json: string;
            window_start: string | null;
            window_end: string | null;
          }
        | undefined;
      if (!row) return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
      const localeRaw = String(body.locale || "en");
      const locale = localeRaw === "zh-Hant" ? "zh-Hant" : "en";
      const suggestion = await analyseDiscoveryCandidate({
        candidate: row,
        followup: body.followup ? String(body.followup) : undefined,
        locale,
      });
      writeAudit(user, "DISCOVERY_ANALYSE", "risk_discovery", candidateId, {
        method: row.method,
        analysis_source: suggestion.analysis_source,
        priority: suggestion.priority,
        confidence: suggestion.confidence,
        followup: Boolean(body.followup),
        locale,
      });
      return NextResponse.json({ ok: true, suggestion, ai_status: getDiscoveryAiStatus() });
    }

    if (body.action === "review") {
      if (!canReview(user.role_code)) {
        return NextResponse.json({ error: "Forbidden — Risk Owner / checker role required" }, { status: 403 });
      }
      const action = String(body.review_action || "") as DiscoveryReviewAction;
      const allowed: DiscoveryReviewAction[] = [
        "APPROVE_FOR_VALIDATION",
        "APPROVE_FOR_MONITORING",
        "ASK_MORE_INFO",
        "DISMISS",
      ];
      if (!allowed.includes(action)) {
        return NextResponse.json({ error: "Invalid review_action" }, { status: 400 });
      }
      if (!body.candidate_id) {
        return NextResponse.json({ error: "candidate_id required" }, { status: 400 });
      }

      const result = reviewDiscoveryCandidate({
        candidate_id: String(body.candidate_id),
        action,
        comment: body.comment ? String(body.comment) : undefined,
        actor: body.reviewer_name
          ? { ...actor, name: String(body.reviewer_name) }
          : actor,
      });

      // Notebook parity: Ask more info returns a fresh AI suggestion (never an approval).
      let suggestion = null;
      if (action === "ASK_MORE_INFO") {
        const row = listDiscoveryCandidates(undefined, 200).find(
          (c) => (c as { candidate_id: string }).candidate_id === String(body.candidate_id)
        ) as
          | {
              candidate_id: string;
              method: string;
              scenario: string;
              proposed_indicator: string;
              proposed_dimension: string;
              score: number;
              evidence_json: string;
              window_start: string | null;
              window_end: string | null;
            }
          | undefined;
        if (row) {
          const localeRaw = String(body.locale || "en");
          const locale = localeRaw === "zh-Hant" ? "zh-Hant" : "en";
          suggestion = await analyseDiscoveryCandidate({
            candidate: row,
            followup: body.comment
              ? String(body.comment)
              : locale === "zh-Hant"
                ? "請補充證據與驗證計畫"
                : "Provide additional evidence and validation plan",
            locale,
          });
        }
      }

      return NextResponse.json({ ...result, suggestion });
    }

    if (body.action === "toggle_enabled") {
      if (!canOperate(user.role_code) && !hasPermission(user.role_code, "settings.manage")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      const before = getDb()
        .prepare(`SELECT value FROM platform_settings WHERE key = 'discovery.enabled'`)
        .get() as { value: string } | undefined;
      const value = body.enabled ? "true" : "false";
      getDb()
        .prepare(
          `INSERT INTO platform_settings (key, value, description) VALUES ('discovery.enabled', ?, 'Enable unknown-risk discovery lane')
           ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')`
        )
        .run(value);
      writeAudit(user, "DISCOVERY_TOGGLE_ENABLED", "platform_settings", "discovery.enabled", {
        before: { value: before?.value ?? null },
        after: { value },
        enabled: !!body.enabled,
      });
      return NextResponse.json({ ok: true, enabled: !!body.enabled });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
