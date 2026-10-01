import { NextResponse } from "next/server";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { getRiskLogDashboard } from "@/lib/ai/risk-log";

export async function GET() {
  const user = await getCurrentUser();
  if (
    !user ||
    !(
      hasPermission(user.role_code, "monitor.read") ||
      hasPermission(user.role_code, "audit.read") ||
      hasPermission(user.role_code, "dashboard.read")
    )
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return NextResponse.json(getRiskLogDashboard());
}
