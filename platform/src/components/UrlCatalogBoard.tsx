"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui";
import { EnZh } from "@/components/EnZh";
import type { UrlEntry } from "@/lib/docs/urls";
import { fetchDocOverlay, resetDocOverlay, saveDocOverlay } from "@/lib/docs/edit-client";
import { isPublicSnapshot } from "@/lib/static-export";
import { DocEditBar } from "@/components/DocEditBar";
import { useUiLocale } from "@/hooks/useUiLocale";

type UrlOverlay = Record<string, { title?: string; description?: string }>;

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

  const categories = useMemo(() => Array.from(new Set(rows.map((u) => u.category))), [rows]);

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

  const categoryLabel = (cat: string) => (
    <EnZh
      en={cat}
      zh={
        (
          {
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
          } as Record<string, string>
        )[cat] || cat
      }
    />
  );

  return (
    <div className="space-y-6">
      <div className="panel p-3 sm:p-4">
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

      {categories.map((cat) => (
        <section key={cat} className="panel p-4">
          <h2 className="font-[family-name:var(--font-display)] text-lg">{categoryLabel(cat)}</h2>
          <div className="mt-3 table-wrap">
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
                {rows
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
                          u.title
                        )}
                      </td>
                      <td>
                        {u.path.startsWith("/") ? (
                          <Link
                            className="text-teal-800 underline break-all"
                            href={u.path.includes("[") ? u.path.replace("[id]", "1").replace("[code]", "SKILL-ABOOK-RATIO") : u.path}
                          >
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
                          u.description
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
