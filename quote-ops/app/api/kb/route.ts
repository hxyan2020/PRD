import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import {
  createNode,
  getTree,
  listNodes,
  suggestInsert,
} from "@/lib/kb/repo";
import type { KbKind, KbNodeInput } from "@/lib/kb/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const mode = url.searchParams.get("mode");
  if (mode === "tree") {
    const tree = await getTree();
    return NextResponse.json({ tree });
  }
  const nodes = await listNodes({
    kind: (url.searchParams.get("kind") as KbKind) || undefined,
    status: url.searchParams.get("status") || undefined,
    q: url.searchParams.get("q") || undefined,
    sort: (url.searchParams.get("sort") as "updated" | "created" | "title" | "sort") || "updated",
    order: (url.searchParams.get("order") as "asc" | "desc") || "desc",
  });
  return NextResponse.json({ nodes });
}

export async function POST(request: Request) {
  const admin = await requireAdmin(request);
  if (admin instanceof Response) return admin;
  const body = (await request.json()) as KbNodeInput & {
    action?: "suggest";
  };
  if (body.action === "suggest") {
    const nodes = await listNodes();
    const suggestions = suggestInsert(nodes, {
      titleZh: body.titleZh || "",
      titleEn: body.titleEn,
      bodyZh: body.bodyZh,
      tags: body.tags,
      kind: body.kind,
    });
    return NextResponse.json({ suggestions });
  }
  if (!body.kind) {
    return NextResponse.json({ error: "kind required" }, { status: 400 });
  }
  if (!body.titleZh?.trim() && !body.titleEn?.trim()) {
    return NextResponse.json({ error: "titleZh or titleEn required" }, { status: 400 });
  }
  const node = await createNode(
    {
      ...body,
      titleZh: body.titleZh?.trim() || "",
      titleEn: body.titleEn?.trim() || "",
    },
    admin,
  );
  return NextResponse.json({ node }, { status: 201 });
}
