import { NextResponse } from "next/server";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { getAiPerformanceEval } from "@/lib/ai/admin";

function canView(role: string) {
  return (
    hasPermission(role, "ai.admin") ||
    hasPermission(role, "ai.read") ||
    hasPermission(role, "skills.manage") ||
    hasPermission(role, "rag.manage")
  );
}

/** Read-only AI performance evaluation payload (KPIs, challenger, feedback, training). */
export async function GET() {
  const user = await getCurrentUser();
  if (!user || !canView(user.role_code)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return NextResponse.json({ eval: getAiPerformanceEval() });
}
