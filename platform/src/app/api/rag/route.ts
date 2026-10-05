import { NextResponse } from "next/server";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { getDb, writeAudit } from "@/lib/db";
import { listRagDocuments, retrieveRag, upsertRagDocument } from "@/lib/ai/rag";
import { reindexRagFts } from "@/lib/ai/seed-rag";
import { isAiServiceActor } from "@/lib/security/ai-access-blocklist";

/**
 * RAG write gate (FN-RAG-WRITE / PAGE-RAG):
 * AI service actors cannot create / update / retire / reindex.
 * Escalate to a human with rag.manage, or propose via AI Admin maker-checker (propose_rag).
 * Human operators with rag.manage remain allowed in this prototype.
 */
function rejectAiRagWrite(user: Awaited<ReturnType<typeof getCurrentUser>>, req: Request) {
  if (!isAiServiceActor(user, req)) return null;
  return NextResponse.json(
    {
      error:
        "AI cannot mutate RAG directly. Escalate to a human with rag.manage, or open a maker-checker propose_rag change request on /admin/ai-admin.",
      blocklist: ["PAGE-RAG", "FN-RAG-WRITE"],
      escalate_to: "/admin/ai-admin",
      ai_may: "PROPOSE_ONLY",
    },
    { status: 403 }
  );
}

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role_code, "rag.read")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const url = new URL(req.url);
  const q = url.searchParams.get("q") || undefined;
  const category = url.searchParams.get("category") || undefined;
  const mode = url.searchParams.get("mode") || "list";

  if (mode === "retrieve" && q) {
    const hits = retrieveRag(getDb(), q, Number(url.searchParams.get("limit") || 8));
    return NextResponse.json({ hits, query: q });
  }

  const docs = listRagDocuments(getDb(), { q, category });
  const categories = getDb()
    .prepare(`SELECT DISTINCT category FROM rag_documents ORDER BY category`)
    .all() as Array<{ category: string }>;
  return NextResponse.json({ documents: docs, categories: categories.map((c) => c.category) });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role_code, "rag.manage")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const blocked = rejectAiRagWrite(user, req);
  if (blocked) return blocked;

  const body = await req.json();

  if (body.action === "reindex") {
    reindexRagFts(getDb());
    writeAudit(user, "RAG_REINDEX", "rag", "all");
    return NextResponse.json({ ok: true });
  }

  if (!body.doc_key || !body.title || !body.content || !body.category) {
    return NextResponse.json({ error: "doc_key, title, category, content required" }, { status: 400 });
  }

  const id = upsertRagDocument(getDb(), {
    doc_key: body.doc_key,
    title: body.title,
    category: body.category,
    product_scope: body.product_scope || "CFD+CRYPTO",
    content: body.content,
    source_ref: body.source_ref,
    tags: body.tags || [],
    status: body.status || "ACTIVE",
  });
  writeAudit(user, "RAG_CREATE", "rag_document", String(id), { doc_key: body.doc_key });
  return NextResponse.json({ ok: true, id });
}

export async function PATCH(req: Request) {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role_code, "rag.manage")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const blocked = rejectAiRagWrite(user, req);
  if (blocked) return blocked;

  const body = await req.json();
  if (!body.id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const existing = getDb()
    .prepare(`SELECT * FROM rag_documents WHERE id = ?`)
    .get(body.id) as
    | {
        id: number;
        doc_key: string;
        title: string;
        category: string;
        product_scope: string;
        content: string;
        source_ref: string | null;
        tags_json: string;
        status: string;
      }
    | undefined;
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const after = {
    title: body.title ?? existing.title,
    category: body.category ?? existing.category,
    product_scope: body.product_scope ?? existing.product_scope,
    content: body.content ?? existing.content,
    source_ref: body.source_ref ?? existing.source_ref ?? undefined,
    tags: body.tags ?? (JSON.parse(existing.tags_json) as string[]),
    status: body.status ?? existing.status,
  };
  upsertRagDocument(getDb(), {
    id: existing.id,
    doc_key: existing.doc_key,
    ...after,
  });
  writeAudit(user, "RAG_UPDATE", "rag_document", String(body.id), {
    before: {
      title: existing.title,
      category: existing.category,
      product_scope: existing.product_scope,
      content: existing.content,
      source_ref: existing.source_ref,
      tags: JSON.parse(existing.tags_json) as string[],
      status: existing.status,
    },
    after,
    ...body,
  });
  return NextResponse.json({ ok: true });
}
