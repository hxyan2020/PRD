import { NextResponse } from "next/server";
import { getCatalogueStats } from "@/lib/db";
import { ensureSeeded } from "@/lib/scanner";

export const dynamic = "force-dynamic";

export async function GET() {
  await ensureSeeded();
  const stats = await getCatalogueStats();
  return NextResponse.json(stats);
}
