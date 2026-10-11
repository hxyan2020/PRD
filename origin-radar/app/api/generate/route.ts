import { NextRequest, NextResponse } from "next/server";
import { generateListing } from "@/lib/generate";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const body = (await req.json()) as { slug?: string };
  if (!body.slug) return NextResponse.json({ error: "slug required" }, { status: 400 });
  try {
    const result = await generateListing(body.slug);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Generate failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
