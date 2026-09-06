import { NextRequest, NextResponse } from "next/server";
import { getDeskSnapshot, setDeskAction, type DeskActionKind } from "@/lib/db";
import { todayKey } from "@/lib/desk";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ACTIONS = new Set<DeskActionKind>(["collect", "discard", "restore", "uncollect"]);

export async function GET() {
  const day = todayKey();
  return NextResponse.json({ day, ...getDeskSnapshot(day) });
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as { slug?: string; action?: DeskActionKind };
  if (!body.slug || !body.action || !ACTIONS.has(body.action)) {
    return NextResponse.json({ error: "slug and action required" }, { status: 400 });
  }
  const day = todayKey();
  const snap = setDeskAction(body.slug, body.action, day);
  return NextResponse.json({ day, ...snap });
}
