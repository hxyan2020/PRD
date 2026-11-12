import { NextResponse } from "next/server";
import { listSourced, sourcedSlugMap } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    products: listSourced(),
    slugs: sourcedSlugMap(),
  });
}
