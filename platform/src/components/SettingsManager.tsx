"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Setting = {
  key: string;
  value: string;
  description: string | null;
  updated_at: string;
};

export function SettingsManager({ settings }: { settings: Setting[] }) {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(settings.map((s) => [s.key, s.value]))
  );
  const [msg, setMsg] = useState<string | null>(null);

  async function save(key: string) {
    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, value: values[key] }),
    });
    if (!res.ok) {
      const data = await res.json();
      setMsg(data.error || "Save failed");
      return;
    }
    setMsg(`Saved ${key}`);
    router.refresh();
  }

  return (
    <div className="space-y-3">
      {msg && <div className="text-sm bg-teal-50 border border-teal-200 text-teal-900 rounded-lg px-3 py-2">{msg}</div>}
      {settings.map((s) => (
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
    </div>
  );
}
