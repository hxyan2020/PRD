import { NextResponse } from "next/server";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { listSimulatedTables, runReadOnlySql, SAMPLE_QUERIES } from "@/lib/sql-explorer";

function forbidden() {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role_code, "admin.access")) return forbidden();

  const url = new URL(req.url);
  const action = url.searchParams.get("action") || "catalog";

  if (action === "samples") {
    return NextResponse.json({ samples: SAMPLE_QUERIES });
  }

  const tables = listSimulatedTables(getDb());
  return NextResponse.json({
    db: "platform/data/vantage_risk.db",
    readOnly: true,
    tableCount: tables.length,
    tables,
    samples: SAMPLE_QUERIES,
  });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role_code, "admin.access")) return forbidden();

  let body: { sql?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    const result = runReadOnlySql(String(body.sql || ""), getDb());
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Query failed";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
