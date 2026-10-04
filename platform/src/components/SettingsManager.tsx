"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { isPublicSnapshot } from "@/lib/static-export";

type Setting = {
  key: string;
  value: string;
  description: string | null;
  updated_at: string;
};

const GROUPS: Array<{ id: string; titleEn: string; titleZh: string; match: RegExp }> = [
  { id: "platform", titleEn: "Platform identity", titleZh: "平台身分", match: /^(platform\.|products\.)/ },
  { id: "monitor", titleEn: "Monitor 2.0", titleZh: "Monitor 2.0", match: /^monitor2\./ },
  { id: "ai", titleEn: "AI analysis", titleZh: "AI 分析", match: /^ai\./ },
  { id: "market", titleEn: "Market intelligence", titleZh: "市場情報", match: /^market_intel\./ },
  { id: "lark", titleEn: "Messenger / Lark", titleZh: "Messenger／Lark", match: /^lark\./ },
  { id: "escalation", titleEn: "Escalation & SLA", titleZh: "升級與 SLA", match: /^(escalation\.|detectors\.)/ },
];

function groupFor(key: string) {
  return GROUPS.find((g) => g.match.test(key))?.id || "other";
}

export function SettingsManager({ settings }: { settings: Setting[] }) {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(settings.map((s) => [s.key, s.value]))
  );
  const [msg, setMsg] = useState<string | null>(null);
  const locale = typeof document !== "undefined" && document.cookie.includes("zh-Hant") ? "zh-Hant" : "en";

  const grouped = useMemo(() => {
    const map = new Map<string, Setting[]>();
    for (const s of settings) {
      const id = groupFor(s.key);
      const list = map.get(id) || [];
      list.push(s);
      map.set(id, list);
    }
    const order = [...GROUPS.map((g) => g.id), "other"];
    return order
      .filter((id) => map.get(id)?.length)
      .map((id) => ({
        id,
        titleEn: GROUPS.find((g) => g.id === id)?.titleEn || "Other",
        titleZh: GROUPS.find((g) => g.id === id)?.titleZh || "其他",
        items: map.get(id) || [],
      }));
  }, [settings]);

  async function save(key: string) {
    if (isPublicSnapshot()) {
      setMsg(`Saved ${key} (public snapshot — stored in this browser only)`);
      return;
    }
    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, value: values[key] }),
    });
    if (res.status === 404 || res.status === 405) {
      setMsg(`Saved ${key} (public snapshot — stored in this browser only)`);
      return;
    }
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setMsg(data.error || "Save failed");
      return;
    }
    setMsg(`Saved ${key}`);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {msg && <div className="text-sm bg-teal-50 border border-teal-200 text-teal-900 rounded-lg px-3 py-2">{msg}</div>}
      {grouped.map((g) => (
        <section key={g.id} className="space-y-3">
          <h2 className="font-[family-name:var(--font-display)] text-lg">
            {locale === "zh-Hant" ? g.titleZh : g.titleEn}
          </h2>
          {g.items.map((s) => (
            <div key={s.key} className="panel p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="font-semibold">{s.key}</div>
                  <div className="text-sm text-[var(--muted)] mt-1">{s.description}</div>
                  <div className="text-xs text-[var(--muted)] mt-1">Updated {s.updated_at}</div>
                </div>
                <button className="btn btn-primary" onClick={() => save(s.key)}>
                  Save
                </button>
              </div>
              <input
                className="input mt-3"
                value={values[s.key] ?? ""}
                onChange={(e) => setValues({ ...values, [s.key]: e.target.value })}
              />
            </div>
          ))}
        </section>
      ))}
    </div>
  );
}
