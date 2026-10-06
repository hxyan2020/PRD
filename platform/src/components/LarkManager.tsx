"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { DeptBadge, SeverityBadge, StatusBadge } from "@/components/ui";
import { useT } from "@/hooks/useUiLocale";
import { isPublicSnapshot } from "@/lib/static-export";
import type { LarkCard } from "@/lib/lark/cards";

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
  cards: initialCards = [],
  canManage,
  canAct = false,
  staticMode = false,
}: {
  channels: Channel[];
  settings: Array<{ key: string; value: string; description: string | null }>;
  cards?: LarkCard[];
  canManage: boolean;
  canAct?: boolean;
  staticMode?: boolean;
}) {
  const router = useRouter();
  const { t, phrase, locale } = useT();
  const [msg, setMsg] = useState<string | null>(null);
  const [cards, setCards] = useState(initialCards);
  const [chatFilter, setChatFilter] = useState("ALL");
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    name: "",
    chat_id: "",
    purpose: "",
    department_code: "RISK_CONTROL",
    severity_min: "WARN",
    webhook_url: "",
  });

  async function testNotify(channelId: number, channelName: string) {
    setMsg(null);
    const res = await fetch("/api/lark", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "test_notify",
        channel_id: channelId,
        message: t("lark.testMsg"),
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMsg(data.error || t("lark.notifyFailed"));
      return;
    }
    setMsg(t("lark.logged", { name: channelName, note: data.note || t("lark.delivered") }));
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
      setMsg(data.error || t("common.failed"));
      return;
    }
    setMsg(t("lark.created", { id: data.id }));
    router.refresh();
  }

  async function cardAction(card: LarkCard, action: "ack" | "escalate" | "dismiss" | "close") {
    setMsg(null);
    if (staticMode || isPublicSnapshot()) {
      const nextStatus =
        action === "ack" ? "ACKED" : action === "escalate" ? "ESCALATED" : action === "dismiss" ? "DISMISSED" : "CLOSED";
      setCards((prev) =>
        prev.map((c) =>
          c.id === card.id || (card.thread_db_id && c.thread_db_id === card.thread_db_id)
            ? { ...c, status: nextStatus }
            : c
        )
      );
      setMsg(t("lark.cardMock", { action, title: card.title }));
      return;
    }
    setBusy(true);
    const res = await fetch("/api/lark", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: `card_${action}`, card_id: card.id }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setMsg(data.error || t("common.failed"));
      return;
    }
    if (Array.isArray(data.cards)) setCards(data.cards);
    setMsg(t("lark.cardDone", { action, title: card.title }));
    router.refresh();
  }

  const chats = useMemo(() => {
    const ids = Array.from(new Set(cards.map((c) => c.chat_id)));
    return ids;
  }, [cards]);
  const shown = cards.filter((c) => chatFilter === "ALL" || c.chat_id === chatFilter);
  const openN = cards.filter((c) => c.status === "OPEN" || c.status === "ACKED" || c.status === "ESCALATED").length;

  return (
    <div className="space-y-4">
      <div className="panel p-4 grid md:grid-cols-3 gap-3">
        {settings.map((s) => (
          <div key={s.key} className="rounded-xl border border-[var(--line)] p-3">
            <div className="text-xs uppercase tracking-wide text-[var(--muted)]">{s.key}</div>
            <div className="font-semibold mt-1 break-all">{s.value}</div>
            <div className="text-xs text-[var(--muted)] mt-1">{phrase(s.description)}</div>
          </div>
        ))}
      </div>

      {msg && (
        <div
          role="status"
          data-testid="lark-notify-status"
          className="text-sm bg-teal-50 border border-teal-200 text-teal-900 rounded-lg px-3 py-2 sticky top-[72px] z-20"
        >
          {msg}
        </div>
      )}

      <section className="panel p-4" data-testid="lark-messenger">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
          <div>
            <h3 className="font-semibold">{t("lark.messengerTitle")}</h3>
            <p className="mt-1 text-sm text-[var(--muted)]">{t("lark.messengerHint")}</p>
          </div>
          <span className="text-xs text-[var(--muted)]">
            {t("lark.openCards", { n: openN })} · mock
          </span>
        </div>
        <div className="mt-3 chip-scroller">
          <button
            type="button"
            className={`btn text-xs ${chatFilter === "ALL" ? "btn-primary" : ""}`}
            onClick={() => setChatFilter("ALL")}
          >
            {locale === "zh-Hant" ? "全部" : "All"}
          </button>
          {chats.map((id) => (
            <button
              key={id}
              type="button"
              className={`btn text-xs ${chatFilter === id ? "btn-primary" : ""}`}
              onClick={() => setChatFilter(id)}
            >
              {id}
            </button>
          ))}
        </div>
        {!shown.length ? (
          <p className="mt-3 text-sm text-[var(--muted)]">{t("lark.noCards")}</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {shown.map((card) => {
              const live = card.status === "OPEN" || card.status === "ACKED" || card.status === "ESCALATED";
              return (
                <li
                  key={card.id}
                  data-testid={`lark-card-${card.id}`}
                  className="rounded-xl border border-[var(--line)] p-3 space-y-2"
                >
                  <div className="flex flex-wrap items-center gap-1.5">
                    <StatusBadge value={card.kind} />
                    <SeverityBadge value={card.severity} />
                    <StatusBadge value={card.status} />
                    <span className="text-[11px] font-mono text-[var(--muted)] break-all">{card.chat_id}</span>
                  </div>
                  <div className="font-semibold break-word">{card.title}</div>
                  <pre className="text-xs text-[var(--muted)] whitespace-pre-wrap break-word font-sans">{card.body}</pre>
                  {card.thread_db_id ? (
                    <Link className="text-xs text-teal-800 underline" href="/admin/messenger">
                      {t("lark.openMessenger")}
                    </Link>
                  ) : null}
                  {canAct && live ? (
                    <div className="action-row">
                      <button
                        type="button"
                        className="btn text-xs"
                        data-testid={`lark-ack-${card.id}`}
                        disabled={busy || card.status === "ACKED"}
                        onClick={() => void cardAction(card, "ack")}
                      >
                        {t("common.acknowledge")}
                      </button>
                      <button
                        type="button"
                        className="btn text-xs"
                        data-testid={`lark-escalate-${card.id}`}
                        disabled={busy}
                        onClick={() => void cardAction(card, "escalate")}
                      >
                        {t("lark.escalate")}
                      </button>
                      <button
                        type="button"
                        className="btn text-xs"
                        data-testid={`lark-dismiss-${card.id}`}
                        disabled={busy}
                        onClick={() => void cardAction(card, "dismiss")}
                      >
                        {t("lark.dismiss")}
                      </button>
                      <button
                        type="button"
                        className="btn btn-primary text-xs"
                        data-testid={`lark-close-${card.id}`}
                        disabled={busy}
                        onClick={() => void cardAction(card, "close")}
                      >
                        {t("lark.close")}
                      </button>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {canManage && (
        <div className="panel p-4">
          <h3 className="font-semibold">{t("lark.add")}</h3>
          <div className="mt-3 grid md:grid-cols-3 gap-3">
            <div>
              <label className="label">{t("common.name")}</label>
              <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="label">{t("lark.chatId")}</label>
              <input
                className="input"
                value={form.chat_id}
                onChange={(e) => setForm({ ...form, chat_id: e.target.value })}
              />
            </div>
            <div>
              <label className="label">{t("lark.webhookUrl")}</label>
              <input
                className="input"
                value={form.webhook_url}
                onChange={(e) => setForm({ ...form, webhook_url: e.target.value })}
              />
            </div>
            <div className="md:col-span-3">
              <label className="label">{t("common.purpose")}</label>
              <input
                className="input"
                value={form.purpose}
                onChange={(e) => setForm({ ...form, purpose: e.target.value })}
              />
            </div>
          </div>
          <button className="btn btn-primary mt-3" onClick={create}>
            {t("lark.create")}
          </button>
        </div>
      )}

      <ul className="space-y-2 sm:hidden" data-testid="lark-mobile">
        {channels.map((c) => (
          <li key={c.id} className="panel p-3 space-y-2">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="font-semibold break-words">{phrase(c.name)}</div>
                <div className="text-xs text-[var(--muted)] break-all">{c.chat_id}</div>
              </div>
              <StatusBadge value={c.enabled ? "ACTIVE" : "DISABLED"} />
            </div>
            <p className="text-sm text-[var(--muted)] break-words">{phrase(c.purpose)}</p>
            <div className="flex flex-wrap gap-1.5">
              <DeptBadge code={c.department_code} />
              <SeverityBadge value={c.severity_min} />
            </div>
            <div className="text-xs break-all text-[var(--muted)]">{c.webhook_url ?? "—"}</div>
            {canManage && (
              <div className="action-row">
                <button
                  type="button"
                  className="btn text-xs"
                  data-testid={`lark-test-${c.id}`}
                  onClick={() => testNotify(c.id, c.name)}
                >
                  {t("lark.test")}
                </button>
                <button type="button" className="btn text-xs" onClick={() => toggle(c)}>
                  {c.enabled ? t("common.disable") : t("common.enable")}
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>

      <div className="panel table-wrap hidden sm:block overflow-x-auto">
        <table className="data">
          <thead>
            <tr>
              <th>{t("common.channel")}</th>
              <th>{t("common.department")}</th>
              <th>{t("lark.minSev")}</th>
              <th>{t("common.status")}</th>
              <th>{t("common.webhook")}</th>
              {canManage && <th>{t("common.actions")}</th>}
            </tr>
          </thead>
          <tbody>
            {channels.map((c) => (
              <tr key={c.id}>
                <td>
                  <div className="font-semibold">{phrase(c.name)}</div>
                  <div className="text-xs text-[var(--muted)]">{c.chat_id}</div>
                  <div className="text-sm mt-1">{phrase(c.purpose)}</div>
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
                    <button type="button" className="btn" data-testid={`lark-test-${c.id}`} onClick={() => testNotify(c.id, c.name)}>
                      {t("lark.test")}
                    </button>
                    <button type="button" className="btn" onClick={() => toggle(c)}>
                      {c.enabled ? t("common.disable") : t("common.enable")}
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
