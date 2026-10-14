import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import {
  closeWaitWindowAsSingle,
  getAggregationBoardPack,
  injectRelatedAlert,
  listAggregationSessions,
  startAggregationSession,
} from "@/lib/indicator-aggregation";

function canRead(role: string) {
  return (
    hasPermission(role, "monitor.read") ||
    hasPermission(role, "skills.read") ||
    hasPermission(role, "ai.read")
  );
}

function canOperate(role: string) {
  return (
    hasPermission(role, "monitor.operate") ||
    hasPermission(role, "ai.operate") ||
    hasPermission(role, "skills.manage") ||
    hasPermission(role, "ai.admin")
  );
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user || !canRead(user.role_code)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return NextResponse.json(getAggregationBoardPack());
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !canOperate(user.role_code)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const action = String(body.action || "");
  const actor = { id: user.id, name: user.name };

  try {
    if (action === "start") {
      const session = startAggregationSession({
        trigger_monitor: String(body.trigger_monitor || "M2-COPY-009"),
        trigger_severity: String(body.trigger_severity || "BREACH"),
        actor,
      });
      return NextResponse.json({
        session,
        sessions: listAggregationSessions(),
        message: "Aggregation session started",
        message_zh: "已開始聚合工作階段",
      });
    }

    if (action === "inject_related") {
      const session = injectRelatedAlert({
        session_id: String(body.session_id || ""),
        related_monitor: String(body.related_monitor || ""),
        severity: String(body.severity || "BREACH"),
        actor,
      });
      return NextResponse.json({
        session,
        sessions: listAggregationSessions(),
        message: "Related alert aggregated — ready for RO as aggregate",
        message_zh: "已匯入關聯告警並聚合 — 可供 RO 按聚合指標處理",
      });
    }

    if (action === "close_window") {
      const session = closeWaitWindowAsSingle({
        session_id: String(body.session_id || ""),
        actor,
      });
      return NextResponse.json({
        session,
        sessions: listAggregationSessions(),
        message: "Wait window closed — RO handles as single indicator",
        message_zh: "等待視窗已結束 — RO 按單一指標處理",
      });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
