"use client";

import { useMemo, useState } from "react";
import { DeptBadge, StatusBadge, Badge } from "@/components/ui";
import { useT } from "@/hooks/useUiLocale";
import { deptLabelI18n } from "@/lib/i18n";

type Source = {
  id: number;
  name: string;
  category: string;
  url: string;
  description: string;
  owner_department: string;
  auth_type: string;
  refresh_cadence: string | null;
  status: string;
  tags_json: string;
  notes: string | null;
};

const CATEGORIES = [
  "ALL",
  "INTERNAL_PLATFORM",
  "MARKET_DATA",
  "CRYPTO",
  "LP_LIQUIDITY",
  "NEWS_MACRO",
  "REGULATORY",
  "MESSAGING",
  "REFERENCE",
];

export function DataSourcesManager({
  initialSources,
  canManage,
}: {
  initialSources: Source[];
  canManage: boolean;
}) {
  const [sources, setSources] = useState(initialSources);
  const { t, locale, phrase } = useT();
  const [category, setCategory] = useState("ALL");
  const [q, setQ] = useState("");
  const [form, setForm] = useState({
    name: "",
    category: "REFERENCE",
    url: "",
    description: "",
    owner_department: "RISK_CONTROL",
    auth_type: "NONE",
    refresh_cadence: "On-demand",
    notes: "",
  });
  const [msg, setMsg] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return sources.filter((s) => {
      if (category !== "ALL" && s.category !== category) return false;
      if (!q) return true;
      const hay = `${s.name} ${s.description} ${s.url} ${s.tags_json}`.toLowerCase();
      return hay.includes(q.toLowerCase());
    });
  }, [sources, category, q]);

  async function refresh() {
    const params = new URLSearchParams();
    const res = await fetch(`/api/data-sources?${params.toString()}`);
    const data = await res.json();
    setSources(data.sources);
  }

  async function createSource() {
    setMsg(null);
    const res = await fetch("/api/data-sources", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) {
      setMsg(data.error || t("rag.createFailed"));
      return;
    }
    setMsg(t("src.created", { id: data.id }));
    setForm({ ...form, name: "", url: "", description: "", notes: "" });
    await refresh();
  }

  async function toggleStatus(s: Source) {
    await fetch("/api/data-sources", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: s.id, status: s.status === "ACTIVE" ? "INACTIVE" : "ACTIVE" }),
    });
    await refresh();
  }

  return (
    <div className="space-y-4">
      <div className="panel p-4 flex flex-wrap gap-3 items-end">
        <div className="min-w-[180px]">
          <label className="label">{t("common.category")}</label>
          <select className="select" value={category} onChange={(e) => setCategory(e.target.value)}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c === "ALL" ? t("common.all") : phrase(c)}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1 min-w-0 basis-full sm:basis-auto sm:min-w-[12rem]">
          <label className="label">{t("common.search")}</label>
          <input
            className="input"
            placeholder={t("src.searchPh")}
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div className="text-sm text-[var(--muted)] pb-2">{t("common.sourcesCount", { n: filtered.length })}</div>
      </div>

      {canManage && (
        <div className="panel p-4">
          <h3 className="font-semibold">{t("src.register")}</h3>
          <div className="mt-3 grid md:grid-cols-2 gap-3">
            <div>
              <label className="label">{t("common.name")}</label>
              <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="label">{t("src.url")}</label>
              <input className="input" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <label className="label">{t("src.description")}</label>
              <textarea
                className="textarea"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div>
              <label className="label">{t("common.category")}</label>
              <select
                className="select"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                {CATEGORIES.filter((c) => c !== "ALL").map((c) => (
                  <option key={c} value={c}>
                    {phrase(c)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">{t("common.department")}</label>
              <select
                className="select"
                value={form.owner_department}
                onChange={(e) => setForm({ ...form, owner_department: e.target.value })}
              >
                <option value="RISK_CONTROL">{deptLabelI18n("RISK_CONTROL", locale)}</option>
                <option value="OPERATIONS">{deptLabelI18n("OPERATIONS", locale)}</option>
                <option value="AI">{deptLabelI18n("AI", locale)}</option>
                <option value="SYSTEM">{deptLabelI18n("SYSTEM", locale)}</option>
                <option value="CUSTOMER_SERVICE">{deptLabelI18n("CUSTOMER_SERVICE", locale)}</option>
                <option value="TRADING">{deptLabelI18n("TRADING", locale)}</option>
              </select>
            </div>
          </div>
          <div className="mt-3 flex gap-3 items-center">
            <button className="btn btn-primary" onClick={createSource}>
              {t("src.add")}
            </button>
            {msg && <span className="text-sm text-[var(--muted)]">{msg}</span>}
          </div>
        </div>
      )}

      <ul className="space-y-2 sm:hidden" data-testid="data-sources-mobile">
        {filtered.map((s) => {
          const tags = JSON.parse(s.tags_json || "[]") as string[];
          return (
            <li key={s.id} className="panel p-3 space-y-2">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="font-semibold break-words">{s.name}</div>
                  <a className="text-xs text-teal-800 break-all" href={s.url} target="_blank" rel="noreferrer">
                    {s.url}
                  </a>
                </div>
                <StatusBadge value={s.status} />
              </div>
              <p className="text-xs text-[var(--muted)]">{phrase(s.description)}</p>
              {s.notes ? (
                <p className="text-xs text-slate-600">
                  {t("src.note")}: {phrase(s.notes)}
                </p>
              ) : null}
              <div className="flex flex-wrap gap-1.5">
                <Badge className="bg-slate-100 text-slate-700 border-slate-200">{phrase(s.category)}</Badge>
                <DeptBadge code={s.owner_department} />
              </div>
              <div className="text-xs text-[var(--muted)]">
                {phrase(s.auth_type)}
                {s.refresh_cadence ? ` · ${phrase(s.refresh_cadence)}` : ""}
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {tags.map((tag) => (
                    <Badge key={tag} className="bg-teal-50 text-teal-900 border-teal-200">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
              {canManage && (
                <button type="button" className="btn text-xs w-full sm:w-auto" onClick={() => toggleStatus(s)}>
                  {s.status === "ACTIVE" ? t("common.disable") : t("common.enable")}
                </button>
              )}
            </li>
          );
        })}
      </ul>

      <div className="panel table-wrap hidden sm:block overflow-x-auto">
        <table className="data">
          <thead>
            <tr>
              <th>{t("common.source")}</th>
              <th>{t("common.category")}</th>
              <th>{t("common.owner")}</th>
              <th>{t("src.authCadence")}</th>
              <th>{t("common.status")}</th>
              <th>{t("common.tags")}</th>
              {canManage && <th />}
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => {
              const tags = JSON.parse(s.tags_json || "[]") as string[];
              return (
                <tr key={s.id}>
                  <td className="min-w-[260px]">
                    <div className="font-semibold">{s.name}</div>
                    <a className="text-xs text-teal-800 break-all" href={s.url} target="_blank" rel="noreferrer">
                      {s.url}
                    </a>
                    <div className="text-xs text-[var(--muted)] mt-1">{phrase(s.description)}</div>
                    {s.notes && <div className="text-xs mt-1 text-slate-600">{t("src.note")}: {phrase(s.notes)}</div>}
                  </td>
                  <td>
                    <Badge className="bg-slate-100 text-slate-700 border-slate-200">{phrase(s.category)}</Badge>
                  </td>
                  <td>
                    <DeptBadge code={s.owner_department} />
                  </td>
                  <td className="text-sm">
                    <div>{phrase(s.auth_type)}</div>
                    <div className="text-xs text-[var(--muted)]">{s.refresh_cadence ? phrase(s.refresh_cadence) : "—"}</div>
                  </td>
                  <td>
                    <StatusBadge value={s.status} />
                  </td>
                  <td>
                    <div className="flex flex-wrap gap-1">
                      {tags.map((t) => (
                        <Badge key={t} className="bg-teal-50 text-teal-900 border-teal-200">
                          {t}
                        </Badge>
                      ))}
                    </div>
                  </td>
                  {canManage && (
                    <td>
                      <button className="btn" onClick={() => toggleStatus(s)}>
                        {s.status === "ACTIVE" ? t("common.disable") : t("common.enable")}
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
