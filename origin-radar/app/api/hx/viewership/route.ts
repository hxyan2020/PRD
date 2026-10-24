import { NextRequest, NextResponse } from "next/server";
import { recordView, viewershipSummary } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json({ ok: true, owner: "HX", ...viewershipSummary() });
  } catch (err) {
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : "db" }, { status: 503 });
  }
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as { path?: string };
  const pathName = body.path || req.nextUrl.searchParams.get("path") || "/";
  try {
    const row = recordView(pathName);
    return NextResponse.json({ ok: true, owner: "HX", ...row });
  } catch (err) {
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : "db" }, { status: 503 });
  }
}
