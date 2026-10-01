"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DeptBadge, SeverityBadge, StatusBadge } from "@/components/ui";

type Channel = {
  id: number;
  name: string;
  chat_id: string;
  purpose: string;
  department_code: string | null;
  severity_min: string;
  enabled: number;
  webhook_url: string | null;
};

export function LarkManager({
  channels,
  settings,
  canManage,
}: {
  channels: Channel[];
  settings: Array<{ key: string; value: string; description: string | null }>;
  canManage: boolean;
}) {
  const router = useRouter();
  const [msg, setMsg] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    chat_id: "",
    purpose: "",
    department_code: "RISK_CONTROL",
    severity_min: "WARN",
    webhook_url: "",
  });

  async function testNotify(channelId: number) {
    const res = await fetch("/api/lark", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "test_notify",
        channel_id: channelId,
        message: "CRMP prototype test notification",
      }),
    });
    const data = await res.json();
    setMsg(data.note || "Sent");
  }

  async function toggle(channel: Channel) {
    await fetch("/api/lark", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "toggle_channel", channel_id: channel.id, enabled: !channel.enabled }),
    });
    router.refresh();
  }

  async function create() {
    const res = await fetch("/api/lark", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create_channel", ...form }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMsg(data.error || "Failed");
      return;
    }
    setMsg(`Channel #${data.id} created`);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="panel p-4 grid md:grid-cols-3 gap-3">
        {settings.map((s) => (
          <div key={s.key} className="rounded-xl border border-[var(--line)] p-3">
            <div className="text-xs uppercase tracking-wide text-[var(--muted)]">{s.key}</div>
            <div className="font-semibold mt-1 break-all">{s.value}</div>
            <div className="text-xs text-[var(--muted)] mt-1">{s.description}</div>
          </div>
        ))}
      </div>

      {msg && <div className="text-sm bg-teal-50 border border-teal-200 text-teal-900 rounded-lg px-3 py-2">{msg}</div>}

      {canManage && (
        <div className="panel p-4">
          <h3 className="font-semibold">Add Lark channel</h3>
          <div className="mt-3 grid md:grid-cols-3 gap-3">
            <div>
              <label className="label">Name</label>
              <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="label">Chat ID</label>
              <input
                className="input"
                value={form.chat_id}
                onChange={(e) => setForm({ ...form, chat_id: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Webhook URL</label>
              <input
                className="input"
                value={form.webhook_url}
                onChange={(e) => setForm({ ...form, webhook_url: e.target.value })}
              />
            </div>
            <div className="md:col-span-3">
              <label className="label">Purpose</label>
              <input
                className="input"
                value={form.purpose}
                onChange={(e) => setForm({ ...form, purpose: e.target.value })}
              />
            </div>
          </div>
          <button className="btn btn-primary mt-3" onClick={create}>
            Create channel
          </button>
        </div>
      )}

      <div className="panel table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>Channel</th>
              <th>Department</th>
              <th>Min severity</th>
              <th>Status</th>
              <th>Webhook</th>
              {canManage && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {channels.map((c) => (
              <tr key={c.id}>
                <td>
                  <div className="font-semibold">{c.name}</div>
                  <div className="text-xs text-[var(--muted)]">{c.chat_id}</div>
                  <div className="text-sm mt-1">{c.purpose}</div>
                </td>
                <td>
                  <DeptBadge code={c.department_code} />
                </td>
                <td>
                  <SeverityBadge value={c.severity_min} />
                </td>
                <td>
                  <StatusBadge value={c.enabled ? "ACTIVE" : "DISABLED"} />
                </td>
                <td className="text-xs break-all max-w-[220px]">{c.webhook_url ?? "—"}</td>
                {canManage && (
                  <td className="space-x-1 whitespace-nowrap">
                    <button className="btn" onClick={() => testNotify(c.id)}>
                      Test notify
                    </button>
                    <button className="btn" onClick={() => toggle(c)}>
                      {c.enabled ? "Disable" : "Enable"}
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
