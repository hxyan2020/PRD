import { NextResponse } from "next/server";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { runDetectors } from "@/lib/ai/run-detectors";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role_code, "detectors.read")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const detectors = getDb().prepare(`SELECT * FROM detectors ORDER BY product, code`).all();
  const runs = getDb()
    .prepare(
      `SELECT r.*, d.code AS detector_code
       FROM detector_runs r
       JOIN detectors d ON d.id = r.detector_id
       ORDER BY r.id DESC LIMIT 50`
    )
    .all();
  return NextResponse.json({ detectors, runs });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role_code, "detectors.operate")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await req.json().catch(() => ({}));
  if (body.action === "toggle") {
    getDb().prepare(`UPDATE detectors SET enabled = ? WHERE id = ?`).run(body.enabled ? 1 : 0, body.id);
    return NextResponse.json({ ok: true });
  }
  const results = runDetectors({
    raiseAlarms: body.raiseAlarms !== false,
    actor: user.name,
  });
  return NextResponse.json({ ok: true, results });
}
