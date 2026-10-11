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
import { getDb } from "@/lib/db";

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
    roles: {
      can_operate: canOperate(user.role_code),
      can_review: canReview(user.role_code),
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
    if (body.action === "scan_now") {
      if (!canOperate(user.role_code)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      const result = runDiscoveryParallel({ actor: user.name, trigger: "MANUAL" });
      return NextResponse.json(result);
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
        actor,
      });
      return NextResponse.json(result);
    }

    if (body.action === "toggle_enabled") {
      if (!canOperate(user.role_code) && !hasPermission(user.role_code, "settings.manage")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      const value = body.enabled ? "true" : "false";
      getDb()
        .prepare(
          `INSERT INTO platform_settings (key, value, description) VALUES ('discovery.enabled', ?, 'Enable unknown-risk discovery lane')
           ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')`
        )
        .run(value);
      return NextResponse.json({ ok: true, enabled: !!body.enabled });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
