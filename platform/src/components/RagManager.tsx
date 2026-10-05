"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge, StatusBadge } from "@/components/ui";
import { useT } from "@/hooks/useUiLocale";

type Doc = {
  id: number;
  doc_key: string;
  title: string;
  category: string;
  product_scope: string;
  content: string;
  source_ref: string | null;
  tags_json: string;
  status: string;
  score?: number;
};

export function RagManager({
  initialDocs,
  categories,
  canManage,
  highlightDocKey,
}: {
  initialDocs: Doc[];
  categories: string[];
  canManage: boolean;
  highlightDocKey?: string | null;
}) {
  const router = useRouter();
  const { t } = useT();
  const [docs, setDocs] = useState(initialDocs);
  const [category, setCategory] = useState("ALL");
  const [q, setQ] = useState(highlightDocKey || "");
  const [retrieveQ, setRetrieveQ] = useState("copy trading concentration gold margin");
  const [hits, setHits] = useState<Doc[] | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [focusKey, setFocusKey] = useState(highlightDocKey || "");

  useEffect(() => {
    if (!highlightDocKey) return;
    setFocusKey(highlightDocKey);
    setQ(highlightDocKey);
    const el = document.getElementById(`rag-doc-${highlightDocKey}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [highlightDocKey]);
  const [form, setForm] = useState({
    doc_key: "",
    title: "",
    category: "RISK_POLICY",
    product_scope: "CFD+CRYPTO",
    content: "",
    source_ref: "",
    tags: "",
  });
  const [editId, setEditId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState("");

  const filtered = useMemo(() => {
    return docs.filter((d) => {
      if (category !== "ALL" && d.category !== category) return false;
      if (!q) return true;
      const hay = `${d.title} ${d.content} ${d.tags_json} ${d.doc_key}`.toLowerCase();
      return hay.includes(q.toLowerCase());
    });
  }, [docs, category, q]);

  async function refresh() {
    const res = await fetch("/api/rag");
    const data = await res.json();
    setDocs(data.documents);
  }

  async function retrieve() {
    const res = await fetch(`/api/rag?mode=retrieve&q=${encodeURIComponent(retrieveQ)}&limit=6`);
    const data = await res.json();
    setHits(data.hits);
  }

  async function createDoc() {
    setMsg(null);
    const res = await fetch("/api/rag", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        tags: form.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMsg(data.error || t("rag.createFailed"));
      return;
    }
    setMsg(t("rag.created", { id: data.id }));
    setForm({ ...form, doc_key: "", title: "", content: "", source_ref: "", tags: "" });
    await refresh();
    router.refresh();
  }

  async function saveEdit(id: number) {
    await fetch("/api/rag", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, content: editContent }),
    });
    setEditId(null);
    await refresh();
  }

  async function toggleStatus(d: Doc) {
    await fetch("/api/rag", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: d.id, status: d.status === "ACTIVE" ? "INACTIVE" : "ACTIVE" }),
    });
    await refresh();
  }

  async function reindex() {
    await fetch("/api/rag", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reindex" }),
    });
    setMsg(t("rag.reindexed"));
  }

  return (
    <div className="space-y-4">
      <div className="panel p-4 border-amber-200 bg-amber-50/50">
        <div className="text-xs uppercase tracking-[0.12em] text-amber-950">
          {t("rag.aiBlockTitle")}
        </div>
        <p className="text-sm mt-1 text-amber-950">{t("rag.aiBlockBody")}</p>
        <div className="mt-2 flex flex-wrap gap-2 text-xs">
          <Badge className="bg-rose-50 text-rose-900 border-rose-200">PAGE-RAG · PROPOSE_ONLY</Badge>
          <Badge className="bg-rose-50 text-rose-900 border-rose-200">FN-RAG-WRITE · FORBIDDEN</Badge>
          <a className="underline text-amber-950" href="/admin/ai-admin">
            {t("rag.aiAdminLink")}
          </a>
          <a className="underline text-amber-950" href="/admin/security/ai-access">
            {t("rag.securityLink")}
          </a>
        </div>
      </div>

      <div className="panel p-4">
        <h3 className="font-semibold">{t("rag.retrieve")}</h3>
        <p className="text-sm text-[var(--muted)] mt-1">{t("rag.intro")}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <input className="input flex-1 min-w-[240px]" value={retrieveQ} onChange={(e) => setRetrieveQ(e.target.value)} />
          <button type="button" className="btn btn-primary" onClick={retrieve}>
            {t("rag.go")}
          </button>
          {canManage && (
            <button type="button" className="btn" onClick={reindex}>
              {t("rag.reindex")}
            </button>
          )}
        </div>
        {hits && (
          <div className="mt-3 space-y-2">
            {hits.map((h) => (
              <div key={h.id} className="rounded-xl border border-[var(--line)] p-3">
                <div className="flex flex-wrap gap-2 items-center">
                  <div className="font-semibold">{h.title}</div>
                  <Badge className="bg-teal-50 text-teal-900 border-teal-200">{h.category}</Badge>
                  <Badge className="bg-slate-100 text-slate-700 border-slate-200">
                    {t("common.score")} {(h.score ?? 0).toFixed(2)}
                  </Badge>
                </div>
                <p className="text-sm text-[var(--muted)] mt-1">{h.content.slice(0, 280)}…</p>
                {h.source_ref && (
                  <a className="text-xs text-teal-800" href={h.source_ref} target="_blank" rel="noreferrer">
                    {h.source_ref}
                  </a>
                )}
              </div>
            ))}
            {!hits.length && <div className="text-sm text-[var(--muted)]">{t("rag.noHits")}</div>}
          </div>
        )}
      </div>

      {msg && <div className="text-sm bg-teal-50 border border-teal-200 text-teal-900 rounded-lg px-3 py-2">{msg}</div>}

      {canManage && (
        <div className="panel p-4">
          <h3 className="font-semibold">{t("rag.add")}</h3>
          <div className="mt-3 grid md:grid-cols-2 gap-3">
            <div>
              <label className="label">{t("rag.docKey")}</label>
              <input className="input" value={form.doc_key} onChange={(e) => setForm({ ...form, doc_key: e.target.value })} />
            </div>
            <div>
              <label className="label">{t("common.title")}</label>
              <input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div>
              <label className="label">{t("common.category")}</label>
              <input className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
            </div>
            <div>
              <label className="label">{t("common.tags")}</label>
              <input className="input" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <label className="label">{t("rag.sourceRef")}</label>
              <input
                className="input"
                value={form.source_ref}
                onChange={(e) => setForm({ ...form, source_ref: e.target.value })}
              />
            </div>
            <div className="md:col-span-2">
              <label className="label">{t("common.content")}</label>
              <textarea
                className="textarea"
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
              />
            </div>
          </div>
          <button type="button" className="btn btn-primary mt-3" onClick={createDoc}>
            {t("rag.publish")}
          </button>
        </div>
      )}

      <div className="panel p-4 flex flex-wrap gap-3 items-end">
        <div className="min-w-[160px]">
          <label className="label">{t("common.category")}</label>
          <select className="select" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="ALL">ALL</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="label">{t("common.filter")}</label>
          <input className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("rag.searchPh")} />
        </div>
        <div className="text-sm text-[var(--muted)] pb-2">{t("common.docs", { n: filtered.length })}</div>
      </div>

      <div className="space-y-3">
        {filtered.map((d) => {
          const tags = JSON.parse(d.tags_json || "[]") as string[];
          const focused = focusKey === d.doc_key;
          return (
            <article
              key={d.id}
              id={`rag-doc-${d.doc_key}`}
              className={`panel p-4 ${focused ? "ring-2 ring-teal-500 border-teal-300" : ""}`}
              data-testid={focused ? "rag-doc-highlight" : undefined}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap gap-2 items-center">
                    <h3 className="font-semibold text-lg">{d.title}</h3>
                    <Badge className="bg-teal-50 text-teal-900 border-teal-200">{d.category}</Badge>
                    <Badge className="bg-slate-100 text-slate-700 border-slate-200">{d.product_scope}</Badge>
                    <StatusBadge value={d.status} />
                    {focused ? (
                      <Badge className="bg-amber-50 text-amber-950 border-amber-200">
                        {t("rag.fromTree")}
                      </Badge>
                    ) : null}
                  </div>
                  <div className="text-xs text-[var(--muted)] mt-1">
                    {d.doc_key}
                    {d.source_ref ? ` · ${d.source_ref}` : ""}
                  </div>
                </div>
                {canManage && (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="btn"
                      onClick={() => {
                        setEditId(d.id);
                        setEditContent(d.content);
                      }}
                    >
                      {t("common.edit")}
                    </button>
                    <button type="button" className="btn" onClick={() => toggleStatus(d)}>
                      {d.status === "ACTIVE" ? t("common.disable") : t("common.enable")}
                    </button>
                  </div>
                )}
              </div>
              {editId === d.id ? (
                <div className="mt-3">
                  <textarea className="textarea" value={editContent} onChange={(e) => setEditContent(e.target.value)} />
                  <div className="mt-2 flex gap-2">
                    <button type="button" className="btn btn-primary" onClick={() => saveEdit(d.id)}>
                      {t("common.save")}
                    </button>
                    <button type="button" className="btn" onClick={() => setEditId(null)}>
                      {t("common.cancel")}
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-sm mt-3 leading-relaxed text-slate-700 whitespace-pre-wrap">{d.content}</p>
              )}
              <div className="mt-3 flex flex-wrap gap-1">
                {tags.map((t) => (
                  <Badge key={t} className="bg-orange-50 text-orange-900 border-orange-200">
                    {t}
                  </Badge>
                ))}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
