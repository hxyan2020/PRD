import { NextResponse } from "next/server";
import { getActor } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const actor = await getActor(request);
  const localDev = !process.env.CURSOR_APP_ID && !process.env.VERCEL;
  // Local smoke/dev: treat as admin. Published hosts use real allowlist / team admin.
  const isAdmin = localDev ? true : actor.isAdmin;
  return NextResponse.json({
    ...actor,
    isAdmin,
    role: isAdmin ? "admin" : actor.role,
    localDev,
    canWrite: isAdmin,
  });
}
