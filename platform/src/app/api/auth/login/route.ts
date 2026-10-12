import { NextResponse } from "next/server";
import { createSession, loginWithCredentials } from "@/lib/auth";
import { writeAudit } from "@/lib/db";

export async function POST(req: Request) {
  const body = await req.json();
  const email = String(body.email ?? "").trim();
  const password = String(body.password ?? "");
  if (!email || !password) {
    return NextResponse.json({ error: "Email and password required" }, { status: 400 });
  }
  const user = loginWithCredentials(email, password);
  if (!user) {
    writeAudit(null, "LOGIN_FAILED", "user", email.toLowerCase(), {
      email: email.toLowerCase(),
      reason: "invalid_credentials",
    });
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }
  await createSession(user.id);
  return NextResponse.json({
    ok: true,
    user: { id: user.id, email: user.email, name: user.name, role_code: user.role_code },
  });
}
