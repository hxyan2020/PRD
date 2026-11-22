import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import {
  appendToNode,
  deleteNode,
  getNode,
  listMedia,
  listRevisions,
  nodeToMarkdown,
  publishNode,
  updateNode,
} from "@/lib/kb/repo";
import type { KbNodeInput } from "@/lib/kb/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(request: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const url = new URL(request.url);
  const node = await getNode(id);
  if (!node) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (url.searchParams.get("markdown") === "1") {
    const locale = url.searchParams.get("locale") === "en" ? "en" : "zh-CN";
    return NextResponse.json({
      markdown: nodeToMarkdown(node, locale),
      node: { id: node.id, slug: node.slug, titleZh: node.titleZh, titleEn: node.titleEn },
    });
  }
  if (url.searchParams.get("revisions") === "1") {
    const revisions = await listRevisions(node.id);
    return NextResponse.json({ node, revisions });
  }
  const media = await listMedia(node.id);
  return NextResponse.json({ node, media });
}

export async function PUT(request: Request, ctx: Ctx) {
  const admin = await requireAdmin(request);
  if (admin instanceof Response) return admin;
  const { id } = await ctx.params;
  const body = (await request.json()) as Partial<KbNodeInput> & {
    action?: "publish" | "append";
    appendZh?: string;
    appendEn?: string;
  };
  if (body.action === "publish") {
    const node = await publishNode(id, admin);
    if (!node) return NextResponse.json({ error: "not found" }, { status: 404 });
    return NextResponse.json({ node });
  }
  if (body.action === "append") {
    const node = await appendToNode(id, body.appendZh || "", body.appendEn || "", admin);
    if (!node) return NextResponse.json({ error: "not found" }, { status: 404 });
    return NextResponse.json({ node });
  }
  const node = await updateNode(id, body, admin);
  if (!node) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ node });
}

export async function DELETE(request: Request, ctx: Ctx) {
  const admin = await requireAdmin(request);
  if (admin instanceof Response) return admin;
  const { id } = await ctx.params;
  try {
    const ok = await deleteNode(id, admin);
    if (!ok) return NextResponse.json({ error: "not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof Error && e.message === "folder_not_empty") {
      return NextResponse.json({ error: "folder_not_empty" }, { status: 409 });
    }
    throw e;
  }
}
