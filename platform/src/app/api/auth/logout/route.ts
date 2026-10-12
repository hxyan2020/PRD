import { NextResponse } from "next/server";
import { destroySession, getCurrentUser } from "@/lib/auth";
import { writeAudit } from "@/lib/db";

export async function POST() {
  const user = await getCurrentUser();
  if (user) {
    writeAudit(user, "LOGOUT", "user", String(user.id));
  }
  await destroySession();
  return NextResponse.json({ ok: true });
}
