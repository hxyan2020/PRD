import { NextResponse } from "next/server";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { getDb, writeAudit } from "@/lib/db";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role_code, "teams.read")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const db = getDb();
  const departments = db.prepare(`SELECT * FROM departments ORDER BY id`).all();
  const teams = db
    .prepare(
      `SELECT t.*,
              (SELECT COUNT(*) FROM users u WHERE u.team_id = t.id) AS member_count
       FROM teams t
       ORDER BY t.department_code, t.name`
    )
    .all();
  return NextResponse.json({ departments, teams });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role_code, "teams.manage")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await req.json();
  const db = getDb();

  if (body.action === "update_team") {
    if (!body.id) return NextResponse.json({ error: "id required" }, { status: 400 });
    db.prepare(
      `UPDATE teams
       SET mission = COALESCE(?, mission),
           on_call_rotation = COALESCE(?, on_call_rotation)
       WHERE id = ?`
    ).run(body.mission ?? null, body.on_call_rotation ?? null, body.id);
    writeAudit(user, "UPDATE_TEAM", "team", String(body.id), body);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
