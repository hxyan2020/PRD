import { NextResponse } from "next/server";
import { getCurrentUser, rolePermissions } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ user: null, public: true });
  return NextResponse.json({
    user,
    permissions: rolePermissions(user.role_code),
  });
}
