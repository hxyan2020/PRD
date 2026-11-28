import { NextRequest, NextResponse } from "next/server";
import { DAILY_SCAN_LABEL, runDailyScan } from "@/lib/scanner";

export const dynamic = "force-dynamic";

/**
 * Vercel Cron hits this daily at 23:00 UTC (07:00 Asia/Singapore).
 * Authorize with CRON_SECRET or SCAN_SECRET.
 */
export async function GET(req: NextRequest) {
  const configured =
    process.env.CRON_SECRET?.trim() || process.env.SCAN_SECRET?.trim() || "";
  const auth = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim() ?? "";
  const headerSecret = req.headers.get("x-scan-secret")?.trim() ?? "";

  if (configured) {
    if (auth !== configured && headerSecret !== configured) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  } else if (process.env.VERCEL) {
    return NextResponse.json({ error: "cron secret required" }, { status: 403 });
  }

  const result = await runDailyScan();
  return NextResponse.json({
    ok: true,
    schedule: DAILY_SCAN_LABEL,
    result,
  });
}
