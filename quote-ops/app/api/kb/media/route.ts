import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { addMedia } from "@/lib/kb/repo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const admin = await requireAdmin(request);
  if (admin instanceof Response) return admin;
  const body = (await request.json()) as {
    nodeId?: string;
    name?: string;
    mime?: string;
    dataUrl?: string;
  };
  if (!body.name || !body.dataUrl || !body.mime) {
    return NextResponse.json({ error: "name, mime, dataUrl required" }, { status: 400 });
  }
  try {
    const media = await addMedia({
      nodeId: body.nodeId,
      name: body.name,
      mime: body.mime,
      dataUrl: body.dataUrl,
      actor: admin,
    });
    return NextResponse.json({ media }, { status: 201 });
  } catch (e) {
    if (e instanceof Error && e.message === "file_too_large") {
      return NextResponse.json({ error: "file_too_large", max: "≈2MB" }, { status: 413 });
    }
    throw e;
  }
}
