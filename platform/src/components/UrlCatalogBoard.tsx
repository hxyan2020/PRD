"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui";
import { EnZh } from "@/components/EnZh";
import { Phrase } from "@/components/Phrase";
import type { UrlEntry } from "@/lib/docs/urls";
import { fetchDocOverlay, resetDocOverlay, saveDocOverlay } from "@/lib/docs/edit-client";
import { isPublicSnapshot } from "@/lib/static-export";
import { DocEditBar } from "@/components/DocEditBar";
import { useUiLocale } from "@/hooks/useUiLocale";

type UrlOverlay = Record<string, { title?: string; description?: string }>;

function catalogHref(path: string) {
  if (!path.startsWith("/")) return path;
  return path.replace("[id]", "1").replace("[code]", "SKILL-CS-CLARIFY");
}

const CATEGORY_ZH: Record<string, string> = {
  Public: "公開",
  "CS / TR": "CS／TR",
  Auth: "驗證",
  Home: "首頁",
  Risk: "風險",
  AI: "AI",
  Messenger: "Messenger",
  Org: "組織",
  System: "系統",
  Docs: "文件",
  API: "API",
  Data: "資料",
  "DB Tables": "資料表",
};

function parseOverlay(raw: string | null): UrlOverlay {
  if (!raw) return {};
  try {
    const v = JSON.parse(raw) as UrlOverlay;
    return v && typeof v === "object" ? v : {};
  } catch {
    return {};
  }
}

export function UrlCatalogBoard({ seed }: { seed: UrlEntry[] }) {
  const { locale } = useUiLocale();
  const zh = locale === "zh-Hant";
  const [overlay, setOverlay] = useState<UrlOverlay>({});
  const [draft, setDraft] = useState<UrlOverlay>({});
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const localOnly = isPublicSnapshot();

  useEffect(() => {
    let live = true;
    fetchDocOverlay("URLS", "overlay").then((raw) => {
      if (!live) return;
      const next = parseOverlay(raw);
      setOverlay(next);
      setDraft(next);
    });
    return () => {
      live = false;
    };
  }, []);

  const rows = useMemo(() => {
    const source = editing ? draft : overlay;
    return seed.map((u) => {
      const p = source[u.path];
      if (!p) return u;
      return { ...u, title: p.title ?? u.title, description: p.description ?? u.description };
    });
  }, [seed, overlay, draft, editing]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (u) =>
        u.title.toLowerCase().includes(q) ||
        u.path.toLowerCase().includes(q) ||
        u.description.toLowerCase().includes(q) ||
        u.category.toLowerCase().includes(q) ||
        (u.permission || "").toLowerCase().includes(q)
    );
  }, [rows, query]);

  const categories = useMemo(() => Array.from(new Set(filtered.map((u) => u.category))), [filtered]);

  async function save() {
    setBusy(true);
    const result = await saveDocOverlay("URLS", "overlay", JSON.stringify(draft));
    setBusy(false);
    if (!result.ok) {
      setMsg(result.error || (zh ? "儲存失敗" : "Save failed"));
      return;
    }
    setOverlay(draft);
    setEditing(false);
    setMsg(result.localOnly ? (zh ? "已儲存在這個瀏覽器" : "Saved in this browser") : zh ? "已儲存" : "Saved");
  }

  async function reset() {
    if (!window.confirm(zh ? "還原網址目錄文案為種子稿？" : "Reset URL catalog copy to the seed draft?")) return;
    setBusy(true);
    await resetDocOverlay("URLS", "overlay");
    setBusy(false);
    setOverlay({});
    setDraft({});
    setEditing(false);
    setMsg(zh ? "已還原種子稿" : "Restored seed draft");
  }

  function patch(path: string, field: "title" | "description", value: string) {
    setDraft((prev) => ({ ...prev, [path]: { ...prev[path], [field]: value } }));
  }

  const categoryLabel = (cat: string) => <EnZh en={cat} zh={CATEGORY_ZH[cat] || cat} />;

  return (
    <div className="space-y-6">
      <div className="panel p-3 sm:p-4 space-y-3">
        <label className="block">
          <span className="text-[10px] sm:text-xs uppercase tracking-[0.08em] text-[var(--muted)]">
            <EnZh en="Filter titles, paths, CS/TR, APIs…" zh="篩選名稱、路徑、CS／TR、API…" />
          </span>
          <input
            className="input w-full mt-1 min-h-9"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={zh ? "例如 /cs、CSR-XXXX、intake、SKILL-CS" : "e.g. /cs, CSR-XXXX, intake, SKILL-CS"}
            data-testid="url-catalog-filter"
          />
        </label>
        <DocEditBar
          zh={zh}
          editing={editing}
          busy={busy}
          dirty={editing && JSON.stringify(draft) !== JSON.stringify(overlay)}
          localOnly={localOnly}
          message={msg}
          onEdit={() => {
            setDraft(overlay);
            setEditing(true);
            setMsg(null);
          }}
          onCancel={() => {
            setDraft(overlay);
            setEditing(false);
          }}
          onSave={() => void save()}
          onReset={() => void reset()}
        />
      </div>

      {categories.length === 0 ? (
        <p className="panel p-4 text-sm text-[var(--muted)]">
          <EnZh en="No catalog rows match that filter." zh="沒有符合此篩選的目錄列。" />
        </p>
      ) : null}

      {categories.map((cat) => (
        <section
          key={cat}
          id={cat === "CS / TR" ? "url-cat-cs-tr" : undefined}
          className="panel p-4"
        >
          <h2 className="font-[family-name:var(--font-display)] text-lg">{categoryLabel(cat)}</h2>
          <ul className="mt-3 space-y-2 sm:hidden" data-testid={`url-cat-mobile-${cat}`}>
            {filtered
              .filter((u) => u.category === cat)
              .map((u) => (
                <li key={`${u.category}-${u.path}-m`} className="rounded-lg border border-[var(--line)] p-3 space-y-2">
                  <div className="font-semibold break-words">
                    {editing ? (
                      <input
                        className="input w-full min-h-9"
                        value={u.title}
                        onChange={(e) => patch(u.path, "title", e.target.value)}
                      />
                    ) : (
                      <Phrase>{u.title}</Phrase>
                    )}
                  </div>
                  <div>
                    {u.path.startsWith("/") ? (
                      <Link className="text-teal-800 underline break-all text-sm" href={catalogHref(u.path)}>
                        {u.path}
                      </Link>
                    ) : (
                      <code className="text-xs break-all">{u.path}</code>
                    )}
                  </div>
                  <div className="text-sm text-[var(--muted)] break-words">
                    {editing ? (
                      <textarea
                        className="input w-full min-h-16"
                        value={u.description}
                        onChange={(e) => patch(u.path, "description", e.target.value)}
                      />
                    ) : (
                      <Phrase>{u.description}</Phrase>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {u.path.startsWith("/") || u.category === "API" ? (
                      <Badge className="bg-teal-50 text-teal-900 border-teal-200">
                        <EnZh en="Public" zh="公開" />
                      </Badge>
                    ) : null}
                    {u.permission ? (
                      <Badge className="bg-slate-100 text-slate-700 border-slate-200">{u.permission}</Badge>
                    ) : null}
                  </div>
                </li>
              ))}
          </ul>
          <div className="mt-3 table-wrap hidden sm:block overflow-x-auto">
            <table className="data">
              <thead>
                <tr>
                  <th>
                    <EnZh en="Title" zh="名稱" />
                  </th>
                  <th>
                    <EnZh en="Path" zh="路徑" />
                  </th>
                  <th>
                    <EnZh en="Description" zh="說明" />
                  </th>
                  <th>
                    <EnZh en="Permission" zh="權限" />
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered
                  .filter((u) => u.category === cat)
                  .map((u) => (
                    <tr key={`${u.category}-${u.path}`}>
                      <td className="font-semibold">
                        {editing ? (
                          <input
                            className="input w-full min-h-9"
                            value={u.title}
                            onChange={(e) => patch(u.path, "title", e.target.value)}
                          />
                        ) : (
                          <Phrase>{u.title}</Phrase>
                        )}
                      </td>
                      <td>
                        {u.path.startsWith("/") ? (
                          <Link className="text-teal-800 underline break-all" href={catalogHref(u.path)}>
                            {u.path}
                          </Link>
                        ) : (
                          <code className="text-xs break-all">{u.path}</code>
                        )}
                      </td>
                      <td className="text-sm text-[var(--muted)]">
                        {editing ? (
                          <textarea
                            className="input w-full min-h-16"
                            value={u.description}
                            onChange={(e) => patch(u.path, "description", e.target.value)}
                          />
                        ) : (
                          <Phrase>{u.description}</Phrase>
                        )}
                      </td>
                      <td>
                        <div className="flex flex-wrap gap-1">
                          {u.path.startsWith("/") || u.category === "API" ? (
                            <Badge className="bg-teal-50 text-teal-900 border-teal-200">
                              <EnZh en="Public" zh="公開" />
                            </Badge>
                          ) : null}
                          {u.permission ? (
                            <Badge className="bg-slate-100 text-slate-700 border-slate-200">{u.permission}</Badge>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </div>
  );
}
