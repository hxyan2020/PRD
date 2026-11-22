import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createCase, listCases, updateCaseStatus } from "@/lib/db";
import type { InvestigationCase, Severity } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const cases = await listCases();
  return NextResponse.json(cases);
}

export async function POST(req: Request) {
  const admin = await requireAdmin(req);
  if (admin instanceof Response) return admin;

  let body: {
    title?: string;
    symbol?: string;
    severity?: Severity;
    notes?: string;
    skillId?: string;
    riskIds?: number[];
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  const title = body.title?.trim() ?? "";
  if (!title || title.length > 300) {
    return NextResponse.json({ error: "title required" }, { status: 400 });
  }
  const created = await createCase({
    title,
    symbol: body.symbol?.slice(0, 32),
    severity: body.severity,
    notes: body.notes?.slice(0, 4000),
    skillId: body.skillId,
    riskIds: body.riskIds?.slice(0, 40),
  });
  return NextResponse.json(created, { status: 201 });
}

export async function PATCH(req: Request) {
  const admin = await requireAdmin(req);
  if (admin instanceof Response) return admin;

  let body: { id?: string; status?: InvestigationCase["status"]; notes?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  if (!body.id || !body.status) {
    return NextResponse.json({ error: "id and status required" }, { status: 400 });
  }
  if (!["open", "monitoring", "resolved"].includes(body.status)) {
    return NextResponse.json({ error: "invalid status" }, { status: 400 });
  }
  const updated = await updateCaseStatus(body.id, body.status, body.notes);
  if (!updated) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(updated);
}
