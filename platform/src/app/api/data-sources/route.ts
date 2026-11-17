import { NextResponse } from "next/server";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { getDb, writeAudit } from "@/lib/db";

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role_code, "sources.read")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const incoming = new URL(req.url);
  const category = incoming.searchParams.get("category");
  const q = incoming.searchParams.get("q");

  let sql = `SELECT * FROM data_sources WHERE 1=1`;
  const params: string[] = [];
  if (category) {
    sql += ` AND category = ?`;
    params.push(category);
  }
  if (q) {
    sql += ` AND (name LIKE ? OR description LIKE ? OR url LIKE ? OR tags_json LIKE ?)`;
    const like = `%${q}%`;
    params.push(like, like, like, like);
  }
  sql += ` ORDER BY category, name`;
  const sources = getDb().prepare(sql).all(...params);
  return NextResponse.json({ sources });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role_code, "sources.manage")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await req.json();
  if (!body.name || !body.category || !body.url || !body.description || !body.owner_department) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }
  const info = getDb()
    .prepare(
      `INSERT INTO data_sources
        (name, category, url, description, owner_department, auth_type, refresh_cadence, status, tags_json, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      body.name,
      body.category,
      body.url,
      body.description,
      body.owner_department,
      body.auth_type || "NONE",
      body.refresh_cadence || null,
      body.status || "ACTIVE",
      JSON.stringify(body.tags || []),
      body.notes || null
    );
  writeAudit(user, "CREATE_DATA_SOURCE", "data_source", String(info.lastInsertRowid), body);
  return NextResponse.json({ ok: true, id: info.lastInsertRowid });
}

export async function PATCH(req: Request) {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role_code, "sources.manage")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await req.json();
  if (!body.id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const db = getDb();
  const prev = db
    .prepare(`SELECT id, status, notes, refresh_cadence FROM data_sources WHERE id = ?`)
    .get(body.id) as
    | { id: number; status: string; notes: string | null; refresh_cadence: string | null }
    | undefined;
  if (!prev) return NextResponse.json({ error: "Not found" }, { status: 404 });
  db.prepare(
    `UPDATE data_sources SET
       status = COALESCE(?, status),
       notes = COALESCE(?, notes),
       refresh_cadence = COALESCE(?, refresh_cadence),
       updated_at = datetime('now')
     WHERE id = ?`
  ).run(body.status ?? null, body.notes ?? null, body.refresh_cadence ?? null, body.id);
  writeAudit(user, "UPDATE_DATA_SOURCE", "data_source", String(body.id), {
    before: { status: prev.status, notes: prev.notes, refresh_cadence: prev.refresh_cadence },
    after: {
      status: body.status ?? prev.status,
      notes: body.notes ?? prev.notes,
      refresh_cadence: body.refresh_cadence ?? prev.refresh_cadence,
    },
    ...body,
  });
  return NextResponse.json({ ok: true });
}
