import { NextRequest, NextResponse } from "next/server";
import { distinctValues, listIdeas } from "@/lib/db";
import { ensureSeeded } from "@/lib/scanner";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  ensureSeeded();
  const { searchParams } = req.nextUrl;
  const q = searchParams.get("q") ?? undefined;
  const industry = searchParams.get("industry") ?? undefined;
  const sector = searchParams.get("sector") ?? undefined;
  const country = searchParams.get("country") ?? undefined;
  const fundraisingParam = searchParams.get("fundraising");
  const fundraising =
    fundraisingParam === "yes" || fundraisingParam === "no" || fundraisingParam === "all"
      ? fundraisingParam
      : "all";

  const ideas = listIdeas({ q, industry, sector, country, fundraising });

  return NextResponse.json({
    ideas,
    meta: {
      count: ideas.length,
      industries: distinctValues("industry"),
      sectors: distinctValues("sector"),
      countries: distinctValues("team_country"),
    },
  });
}
