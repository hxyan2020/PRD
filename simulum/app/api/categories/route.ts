import { NextResponse } from "next/server";
import { listCategories } from "@/lib/db";
import { ensureSeeded } from "@/lib/scanner";

export const dynamic = "force-dynamic";

export async function GET() {
  await ensureSeeded();
  const categories = await listCategories();
  return NextResponse.json({ categories });
}
