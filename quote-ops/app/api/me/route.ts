import { NextResponse } from "next/server";
import { getActor } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const actor = await getActor(request);
  const localAdmin = !process.env.CURSOR_APP_ID && !process.env.VERCEL;
  return NextResponse.json({
    ...actor,
    isAdmin: localAdmin ? true : actor.isAdmin,
    localDev: localAdmin,
  });
}
