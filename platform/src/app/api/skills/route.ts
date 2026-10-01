import { NextResponse } from "next/server";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { getDb } from "@/lib/db";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role_code, "skills.read")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const skills = getDb().prepare(`SELECT * FROM ai_skills ORDER BY code`).all();
  return NextResponse.json({ skills });
}
