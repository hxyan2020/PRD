import { NextResponse } from "next/server";
import { CATALOG_AS_OF, stats } from "@/lib/catalog";
import { listSourced, viewershipSummary } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const origin = new URL(req.url).origin;
  const s = stats();
  let sourced = 0;
  let views = { total: 0, paths: [] as { path: string; hits: number }[] };
  try {
    sourced = listSourced().length;
    views = viewershipSummary();
  } catch {
    sourced = -1;
  }
  return NextResponse.json({
    ok: true,
    owner: "HX",
    service: "origin-radar",
    asOf: CATALOG_AS_OF,
    publicUrl: origin,
    monitors: [
      { name: "health", url: `${origin}/api/health`, intervalSec: 60, expectOk: true },
      { name: "radar", url: `${origin}/`, intervalSec: 300, expectStatus: 200 },
      { name: "queue", url: `${origin}/queue`, intervalSec: 300, expectStatus: 200 },
    ],
    viewership: {
      ingest: `${origin}/api/hx/viewership`,
      report: `${origin}/api/hx/viewership`,
      total: views.total,
      top: views.paths.slice(0, 10),
    },
    signals: s.products,
    sourced,
    time: new Date().toISOString(),
  });
}
