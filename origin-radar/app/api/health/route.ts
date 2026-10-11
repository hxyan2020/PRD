import { NextResponse } from "next/server";
import { CATALOG_AS_OF, stats } from "@/lib/catalog";
import { listSourced } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const s = stats();
  let sourced: number | null = null;
  try {
    sourced = listSourced().length;
  } catch {
    sourced = null;
  }
  return NextResponse.json({
    ok: true,
    service: "origin-radar",
    owner: "HX",
    asOf: CATALOG_AS_OF,
    signals: s.products,
    sourced,
    time: new Date().toISOString(),
    checks: {
      catalog: s.products > 0,
      sqlite: sourced != null,
    },
  });
}
