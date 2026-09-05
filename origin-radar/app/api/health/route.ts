import { NextResponse } from "next/server";
import { CATALOG_AS_OF, stats } from "@/lib/catalog";
import { listSourced } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const s = stats();
  return NextResponse.json({
    ok: true,
    service: "origin-radar",
    asOf: CATALOG_AS_OF,
    signals: s.products,
    sourced: listSourced().length,
    time: new Date().toISOString(),
  });
}
