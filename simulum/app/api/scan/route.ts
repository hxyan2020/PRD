import { NextRequest, NextResponse } from "next/server";
import { runWorldwideScan } from "@/lib/scanner";

export const dynamic = "force-dynamic";

/**
 * Manual scan trigger. Requires SCAN_SECRET when set (production).
 * Without a secret in local/dev, allows a non-forced throttled scan only.
 */
export async function POST(req: NextRequest) {
  const configured = process.env.SCAN_SECRET?.trim() ?? "";
  const provided = req.headers.get("x-scan-secret")?.trim() ?? "";

  if (configured) {
    if (!provided || provided !== configured) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  } else if (process.env.DATABASE_URL) {
    // Published app without secret: refuse public write trigger
    return NextResponse.json(
      { error: "scan trigger disabled" },
      { status: 403 },
    );
  }

  const body = (await req.json().catch(() => ({}))) as { force?: boolean };
  const force = Boolean(body.force) && Boolean(configured);
  const result = await runWorldwideScan({
    force,
    source: "api-scan",
  });

  if (!result) {
    return NextResponse.json({
      ok: true,
      skipped: true,
      reason: "cooldown",
    });
  }

  return NextResponse.json({ ok: true, result });
}
