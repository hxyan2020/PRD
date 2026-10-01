import { NextResponse } from "next/server";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { getDailyDashboard, refreshTodayPerformance } from "@/lib/ai/daily";

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role_code, "dashboard.read")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const date = new URL(req.url).searchParams.get("date") || undefined;
  return NextResponse.json(getDailyDashboard(date));
}

export async function POST() {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role_code, "dashboard.read")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const result = refreshTodayPerformance();
  return NextResponse.json({ ok: true, ...result, dashboard: getDailyDashboard() });
}
