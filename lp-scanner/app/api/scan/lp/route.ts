import { NextRequest, NextResponse } from "next/server";
import { listLps } from "@/lib/db";
import { researchLp } from "@/lib/research";
import type { Locale } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  const locale = (request.nextUrl.searchParams.get("locale") as Locale) || "en";
  if (!q) return NextResponse.json({ error: "q required" }, { status: 400 });
  const lps = await listLps();
  const result = await researchLp(lps, q, locale);
  return NextResponse.json(result);
}
