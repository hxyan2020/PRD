import { NextResponse } from "next/server";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { decideIntervention, listInterventions } from "@/lib/ai/intervention";

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (
    !user ||
    !(hasPermission(user.role_code, "intervene.operate") || hasPermission(user.role_code, "ai.read"))
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const status = new URL(req.url).searchParams.get("status") || undefined;
  return NextResponse.json({ interventions: listInterventions(status || undefined) });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role_code, "intervene.operate")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await req.json();
  if (!body.id || !["APPROVED", "REJECTED"].includes(body.decision)) {
    return NextResponse.json({ error: "id and decision required" }, { status: 400 });
  }
  try {
    const result = decideIntervention({
      interventionId: Number(body.id),
      decision: body.decision,
      note: body.note,
      actor: { id: user.id, name: user.name },
    });
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
