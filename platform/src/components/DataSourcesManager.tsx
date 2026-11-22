"use client";

import { useMemo, useState } from "react";
import { DeptBadge, StatusBadge, Badge } from "@/components/ui";

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
      setMsg(data.error || "Create failed");
      return;
    }
    setMsg(`Added source #${data.id}`);
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
          <label className="label">Category</label>
          <select className="select" value={category} onChange={(e) => setCategory(e.target.value)}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1 min-w-[220px]">
          <label className="label">Search</label>
          <input
            className="input"
            placeholder="Name, URL, tag…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div className="text-sm text-[var(--muted)] pb-2">{filtered.length} sources</div>
      </div>

      {canManage && (
        <div className="panel p-4">
          <h3 className="font-semibold">Register data source</h3>
          <div className="mt-3 grid md:grid-cols-2 gap-3">
            <div>
              <label className="label">Name</label>
              <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="label">URL</label>
              <input className="input" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <label className="label">Description</label>
              <textarea
                className="textarea"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Category</label>
              <select
                className="select"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                {CATEGORIES.filter((c) => c !== "ALL").map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Owner department</label>
              <select
                className="select"
                value={form.owner_department}
                onChange={(e) => setForm({ ...form, owner_department: e.target.value })}
              >
                <option value="RISK_CONTROL">Risk Control</option>
                <option value="OPERATIONS">Operations</option>
                <option value="AI">AI</option>
                <option value="SYSTEM">System</option>
              </select>
            </div>
          </div>
          <div className="mt-3 flex gap-3 items-center">
            <button className="btn btn-primary" onClick={createSource}>
              Add to repository
            </button>
            {msg && <span className="text-sm text-[var(--muted)]">{msg}</span>}
          </div>
        </div>
      )}

      <div className="panel table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>Source</th>
              <th>Category</th>
              <th>Owner</th>
              <th>Auth / Cadence</th>
              <th>Status</th>
              <th>Tags</th>
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
                    <div className="text-xs text-[var(--muted)] mt-1">{s.description}</div>
                    {s.notes && <div className="text-xs mt-1 text-slate-600">Note: {s.notes}</div>}
                  </td>
                  <td>
                    <Badge className="bg-slate-100 text-slate-700 border-slate-200">{s.category}</Badge>
                  </td>
                  <td>
                    <DeptBadge code={s.owner_department} />
                  </td>
                  <td className="text-sm">
                    <div>{s.auth_type}</div>
                    <div className="text-xs text-[var(--muted)]">{s.refresh_cadence ?? "—"}</div>
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
                        {s.status === "ACTIVE" ? "Disable" : "Enable"}
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
