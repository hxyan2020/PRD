import { NextResponse } from "next/server";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { getDb, writeAudit } from "@/lib/db";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role_code, "users.read")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const users = getDb()
    .prepare(
      `SELECT u.id, u.email, u.name, u.role_code, u.department_code, u.team_id, u.status,
              u.last_login_at, u.created_at, t.name AS team_name
       FROM users u
       LEFT JOIN teams t ON t.id = u.team_id
       ORDER BY u.id`
    )
    .all();
  return NextResponse.json({ users });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role_code, "users.manage")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await req.json();
  const { email, name, password, role_code, department_code, team_id } = body;
  if (!email || !name || !password || !role_code) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }
  try {
    const info = getDb()
      .prepare(
        `INSERT INTO users (email, name, password, role_code, department_code, team_id)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
      .run(email, name, password, role_code, department_code || null, team_id || null);
    writeAudit(user, "CREATE_USER", "user", String(info.lastInsertRowid), {
      after: { email, role_code, department_code: department_code || null, team_id: team_id || null },
      email,
      role_code,
    });
    return NextResponse.json({ ok: true, id: info.lastInsertRowid });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}

export async function PATCH(req: Request) {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role_code, "users.manage")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await req.json();
  const { id, status, role_code, team_id, department_code } = body;
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const db = getDb();
  const prev = db
    .prepare(
      `SELECT id, email, name, role_code, department_code, team_id, status FROM users WHERE id = ?`
    )
    .get(id) as
    | {
        id: number;
        email: string;
        name: string;
        role_code: string;
        department_code: string | null;
        team_id: number | null;
        status: string;
      }
    | undefined;
  if (!prev) return NextResponse.json({ error: "Not found" }, { status: 404 });
  db.prepare(
    `UPDATE users SET
       status = COALESCE(?, status),
       role_code = COALESCE(?, role_code),
       team_id = COALESCE(?, team_id),
       department_code = COALESCE(?, department_code)
     WHERE id = ?`
  ).run(status ?? null, role_code ?? null, team_id ?? null, department_code ?? null, id);
  const after = {
    status: status ?? prev.status,
    role_code: role_code ?? prev.role_code,
    team_id: team_id ?? prev.team_id,
    department_code: department_code ?? prev.department_code,
  };
  writeAudit(user, "UPDATE_USER", "user", String(id), {
    before: {
      status: prev.status,
      role_code: prev.role_code,
      team_id: prev.team_id,
      department_code: prev.department_code,
    },
    after,
    ...body,
  });
  return NextResponse.json({ ok: true });
}
