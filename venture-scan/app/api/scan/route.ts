import { NextResponse } from "next/server";
import { latestScanRun } from "@/lib/db";
import { runScan } from "@/lib/scanner";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const latest = latestScanRun();
  return NextResponse.json({ latest: latest ?? null });
}

export async function POST() {
  const result = runScan({ source: "manual-rescan" });
  return NextResponse.json(result);
}
