import { NextResponse } from "next/server";
import { loadBriefing } from "@/lib/loadData";

export const dynamic = "force-dynamic";

export async function GET() {
  const briefing = await loadBriefing();
  if (!briefing) {
    return NextResponse.json({ error: "No scan yet" }, { status: 404 });
  }
  return NextResponse.json(briefing);
}
