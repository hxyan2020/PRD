import { NextRequest, NextResponse } from "next/server";
import { listEvidence } from "@/lib/db";
import { ensureSeeded } from "@/lib/scanner";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  await ensureSeeded();
  const category = req.nextUrl.searchParams.get("category") ?? undefined;
  const limit = Number(req.nextUrl.searchParams.get("limit") ?? "48");
  const offset = Number(req.nextUrl.searchParams.get("offset") ?? "0");
  const evidence = await listEvidence({
    categorySlug: category,
    limit: Number.isFinite(limit) ? limit : 48,
    offset: Number.isFinite(offset) ? offset : 0,
  });
  return NextResponse.json({ evidence });
}
