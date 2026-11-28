import { NextResponse } from "next/server";
import { getActor, isOpenAccess } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const actor = await getActor(request);
  const localDev = !process.env.CURSOR_APP_ID && !process.env.VERCEL;
  const openAccess = isOpenAccess();
  // Open access (default) or local smoke/dev: treat as writable admin.
  const canWrite = openAccess || localDev || actor.isAdmin;
  return NextResponse.json({
    ...actor,
    isAdmin: canWrite,
    role: canWrite ? "admin" : actor.role,
    localDev,
    openAccess,
    canWrite,
  });
}
