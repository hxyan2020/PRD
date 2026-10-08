import { NextResponse } from "next/server";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { getDb, writeAudit } from "@/lib/db";
import { isAiServiceActor } from "@/lib/security/ai-access-blocklist";
import { ALL_PERMISSIONS } from "@/lib/permissions-catalog";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role_code, "users.read")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const roles = getDb().prepare(`SELECT * FROM roles ORDER BY id`).all();
  return NextResponse.json({ roles, catalog: ALL_PERMISSIONS });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role_code, "users.manage")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (isAiServiceActor(user, req)) {
    return NextResponse.json(
      { error: "AI service actors cannot edit roles — escalate to a human with users.manage." },
      { status: 403 }
    );
  }

  const body = await req.json();
  const db = getDb();

  if (body.action !== "update_role") {
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }
  if (!body.id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const prev = db
    .prepare(`SELECT id, code, name, description, department_code, permissions_json FROM roles WHERE id = ?`)
    .get(body.id) as
    | {
        id: number;
        code: string;
        name: string;
        description: string;
        department_code: string | null;
        permissions_json: string;
      }
    | undefined;
  if (!prev) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let permissions: string[] | null = null;
  if (Array.isArray(body.permissions)) {
    const catalog = new Set(ALL_PERMISSIONS);
    permissions = (body.permissions as string[])
      .map((p) => String(p).trim())
      .filter((p) => catalog.has(p) || p === "*");
    // Wildcard alone means full access
    if (permissions.includes("*")) permissions = ["*"];
    permissions = Array.from(new Set(permissions)).sort((a, b) => {
      if (a === "*") return -1;
      if (b === "*") return 1;
      return a.localeCompare(b);
    });
  }

  const name = typeof body.name === "string" && body.name.trim() ? body.name.trim() : prev.name;
  const description =
    typeof body.description === "string" ? body.description.trim() : prev.description;
  const department_code =
    body.department_code === undefined
      ? prev.department_code
      : body.department_code
        ? String(body.department_code)
        : null;

  db.prepare(
    `UPDATE roles
     SET name = ?,
         description = ?,
         department_code = ?,
         permissions_json = COALESCE(?, permissions_json)
     WHERE id = ?`
  ).run(
    name,
    description,
    department_code,
    permissions ? JSON.stringify(permissions) : null,
    body.id
  );

  writeAudit(user, "UPDATE_ROLE", "role", prev.code, {
    before: {
      name: prev.name,
      description: prev.description,
      department_code: prev.department_code,
      permissions_json: prev.permissions_json,
    },
    after: {
      name,
      description,
      department_code,
      permissions: permissions ?? JSON.parse(prev.permissions_json),
    },
  });

  return NextResponse.json({ ok: true });
}
