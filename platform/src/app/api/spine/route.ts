import { NextResponse } from "next/server";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { listSpineEvents, spineStageCounts } from "@/lib/ai/spine";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role_code, "spine.read")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const db = getDb();
  return NextResponse.json({
    events: listSpineEvents(db, 150),
    stage_counts: spineStageCounts(db, 24),
  });
}
