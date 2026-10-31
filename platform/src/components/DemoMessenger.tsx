"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Badge, SeverityBadge, StatusBadge } from "@/components/ui";

type Thread = {
  id: number;
  thread_id: string;
  channel_name: string;
  title: string;
  severity: string;
  status: string;
  message_count: number;
  last_body: string | null;
  updated_at: string;
};

type Message = {
  id: number;
  msg_id: string;
  kind: string;
  sender: string;
  body: string;
  meta_json: string;
  created_at: string;
};

type Pending = {
  id: number;
  action_code: string;
  status: string;
  detail_json: string;
};

type Recommended = {
  code: string;
  label: string;
  description: string;
  admin_path: string;
  needs_checker: boolean;
};

export function DemoMessenger({ initialThreads }: { initialThreads: Thread[] }) {
  const router = useRouter();
  const [threads, setThreads] = useState(initialThreads);
  const [activeId, setActiveId] = useState<number | null>(initialThreads[0]?.id ?? null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [pending, setPending] = useState<Pending[]>([]);
  const [recommended, setRecommended] = useState<Recommended[]>([]);
  const [chat, setChat] = useState("");
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [mobilePane, setMobilePane] = useState<"list" | "thread">("list");

  const active = useMemo(() => threads.find((t) => t.id === activeId) || null, [threads, activeId]);

  async function loadThread(id: number, opts: { openPane?: boolean } = {}) {
    setBusy(true);
    setStatusMsg(null);
    const res = await fetch(`/api/messenger?id=${id}`);
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setStatusMsg(data.error || "Failed to load thread");
      return;
    }
    setActiveId(id);
    setMessages(data.messages || []);
    setPending(data.pending || []);
    setRecommended(data.recommended_actions || []);
    setLoaded(true);
    setConfirmId(null);
    if (opts.openPane !== false) setMobilePane("thread");
  }

  async function run(action: string, extra: Record<string, unknown> = {}) {
    if (!activeId && action !== "sync") return;
    setBusy(true);
    setStatusMsg(null);
    const res = await fetch("/api/messenger", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, thread_id: activeId, ...extra }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setStatusMsg(data.error || "Action failed");
      return;
    }
    if (action === "sync") {
      setThreads(data.threads || []);
      setStatusMsg(`Synced ${data.synced} new alert(s) into messenger`);
      router.refresh();
      return;
    }
    setMessages(data.messages || []);
    setPending(data.pending || []);
    setRecommended(data.recommended_actions || []);
    setConfirmId(null);
    setChat("");
    const listRes = await fetch("/api/messenger");
    const listData = await listRes.json();
    if (listRes.ok) setThreads(listData.threads || []);
    setStatusMsg(`Action ${action} completed`);
  }

  useEffect(() => {
    if (activeId && !loaded) {
      void loadThread(activeId, { openPane: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId, loaded]);

  return (
    <div className="grid lg:grid-cols-[300px_minmax(0,1fr)] gap-3 sm:gap-4">
      <section
        className={`panel p-3 flex flex-col min-h-[60vh] lg:min-h-[70vh] ${
          mobilePane === "thread" ? "hidden lg:flex" : "flex"
        }`}
      >
        <div className="flex items-center justify-between gap-2 mb-3">
          <h2 className="font-semibold text-sm sm:text-base">Channels / threads</h2>
          <button type="button" className="btn text-xs !min-h-9" disabled={busy} onClick={() => run("sync")}>
            Sync alerts
          </button>
        </div>
        <div className="space-y-2 overflow-auto flex-1 -mx-1 px-1">
          {threads.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => void loadThread(t.id)}
              className={`w-full text-left rounded-xl border px-3 py-2.5 transition min-h-16 ${
                activeId === t.id ? "border-teal-400 bg-teal-50" : "border-[var(--line)] hover:bg-slate-50"
              }`}
            >
              <div className="flex flex-wrap gap-1.5 items-center">
                <SeverityBadge value={t.severity} />
                <StatusBadge value={t.status} />
              </div>
              <div className="mt-1 text-sm font-semibold line-clamp-2 break-word">{t.title}</div>
              <div className="text-[11px] text-[var(--muted)] mt-0.5">
                {t.channel_name} · {t.message_count} msgs
              </div>
            </button>
          ))}
          {!threads.length && <p className="text-sm text-[var(--muted)] p-2">No threads yet. Sync alerts.</p>}
        </div>
      </section>

      <section
        className={`panel p-3 sm:p-4 flex flex-col min-h-[70vh] lg:min-h-[70vh] ${
          mobilePane === "list" ? "hidden lg:flex" : "flex"
        }`}
      >
        {active ? (
          <>
            <div className="border-b border-[var(--line)] pb-3 mb-3">
              <div className="lg:hidden mb-2">
                <button
                  type="button"
                  className="btn !min-h-9 text-xs"
                  onClick={() => setMobilePane("list")}
                >
                  <ArrowLeft size={14} /> Threads
                </button>
              </div>
              <div className="flex flex-wrap gap-2 items-center">
                <SeverityBadge value={active.severity} />
                <StatusBadge value={active.status} />
                <Badge className="bg-slate-100 text-slate-700 border-slate-200">{active.channel_name}</Badge>
                <Badge className="bg-orange-50 text-orange-900 border-orange-200">{active.thread_id}</Badge>
              </div>
              <h2 className="mt-2 font-[family-name:var(--font-display)] text-lg sm:text-xl break-word">
                {active.title}
              </h2>
              <div className="mt-3 action-row">
                <button
                  type="button"
                  className="btn"
                  disabled={busy || active.status !== "OPEN"}
                  onClick={() => run("show_evidence")}
                >
                  Show evidence
                </button>
                <button
                  type="button"
                  className="btn"
                  disabled={busy || active.status !== "OPEN"}
                  onClick={() => run("escalate")}
                >
                  Escalate
                </button>
                <button
                  type="button"
                  className="btn"
                  disabled={busy || active.status !== "OPEN"}
                  onClick={() => run("dismiss")}
                >
                  Dismiss
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={busy || active.status !== "OPEN"}
                  onClick={() => run("close")}
                >
                  Close (accept AI)
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto space-y-3 pr-0.5 overscroll-contain">
              {messages.map((m) => {
                const meta = JSON.parse(m.meta_json || "{}") as Record<string, unknown>;
                const isUser = m.kind === "USER";
                return (
                  <div
                    key={m.id}
                    className={`rounded-xl border px-3 py-2 text-sm max-w-full sm:max-w-[95%] ${
                      isUser
                        ? "ml-auto border-teal-200 bg-teal-50"
                        : m.kind === "AI_REPORT"
                          ? "border-amber-200 bg-amber-50/60"
                          : m.kind === "ESCALATION"
                            ? "border-rose-200 bg-rose-50/50"
                            : "border-[var(--line)] bg-white"
                    }`}
                  >
                    <div className="flex flex-wrap gap-2 items-center text-xs text-[var(--muted)]">
                      <Badge className="bg-slate-100 text-slate-700 border-slate-200">{m.kind}</Badge>
                      <span className="font-semibold text-[var(--ink)]">{m.sender}</span>
                      <span className="break-word">{m.created_at}</span>
                    </div>
                    <pre className="mt-2 whitespace-pre-wrap font-sans text-sm text-slate-800 break-word">
                      {m.body}
                    </pre>
                    {typeof meta.admin_url === "string" ? (
                      <a className="inline-block mt-2 text-teal-800 text-xs underline" href={String(meta.admin_url)}>
                        Open in admin →
                      </a>
                    ) : null}
                  </div>
                );
              })}
            </div>

            {active.status === "OPEN" && (
              <div className="mt-4 border-t border-[var(--line)] pt-3 space-y-3 sticky bottom-0 bg-[var(--panel)] pb-[max(0.25rem,var(--safe-bottom))]">
                <div>
                  <div className="text-xs uppercase tracking-[0.1em] text-[var(--muted)] mb-2">
                    Recommended actions
                  </div>
                  <div className="action-row">
                    {recommended.map((a) => (
                      <button
                        key={a.code}
                        type="button"
                        className="btn text-xs"
                        disabled={busy}
                        title={a.description}
                        onClick={() => run("recommend", { action_code: a.code })}
                      >
                        {a.label}
                      </button>
                    ))}
                  </div>
                </div>

                {pending.map((p) => {
                  const detail = JSON.parse(p.detail_json || "{}") as Recommended;
                  const awaitingChecker = p.status === "AWAITING_CHECKER";
                  return (
                    <div
                      key={p.id}
                      className={`rounded-xl border px-3 py-2 text-sm ${
                        awaitingChecker
                          ? "border-violet-300 bg-violet-50"
                          : "border-amber-300 bg-amber-50"
                      }`}
                    >
                      <div className="font-semibold">
                        {awaitingChecker ? "Checker approval needed: " : "Confirm: "}
                        {detail.label || p.action_code}
                      </div>
                      <p className="text-[var(--muted)] mt-1 break-word">{detail.description}</p>
                      <div className="mt-2 action-row">
                        {awaitingChecker ? (
                          <>
                            <button
                              type="button"
                              className="btn btn-primary"
                              disabled={busy}
                              onClick={() => run("checker_approve", { pending_id: p.id })}
                            >
                              Checker approve (go live)
                            </button>
                            <a className="btn" href={detail.admin_path || "/admin/interventions"}>
                              Open admin
                            </a>
                          </>
                        ) : confirmId === p.id ? (
                          <>
                            <button
                              type="button"
                              className="btn btn-primary"
                              disabled={busy}
                              onClick={() => run("confirm_action", { pending_id: p.id })}
                            >
                              Yes, send to Vantage admin
                            </button>
                            <button type="button" className="btn" disabled={busy} onClick={() => setConfirmId(null)}>
                              No, go back
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              className="btn btn-primary"
                              disabled={busy}
                              onClick={() => setConfirmId(p.id)}
                            >
                              Double-confirm…
                            </button>
                            <button
                              type="button"
                              className="btn"
                              disabled={busy}
                              onClick={() => run("cancel_action", { pending_id: p.id })}
                            >
                              Cancel
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}

                <form
                  className="flex flex-col sm:flex-row gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!chat.trim()) return;
                    void run("chat", { text: chat.trim() });
                  }}
                >
                  <input
                    className="input flex-1 !rounded-xl"
                    placeholder="Challenge the AI report or add info…"
                    value={chat}
                    onChange={(e) => setChat(e.target.value)}
                    disabled={busy}
                  />
                  <button type="submit" className="btn btn-primary sm:w-auto w-full" disabled={busy || !chat.trim()}>
                    Send
                  </button>
                </form>
              </div>
            )}

            {statusMsg && (
              <div className="mt-3 text-sm bg-teal-50 border border-teal-200 text-teal-900 rounded-lg px-3 py-2 break-word">
                {statusMsg}
              </div>
            )}
          </>
        ) : (
          <p className="text-[var(--muted)] text-sm p-2">Select a thread to open the demo messenger.</p>
        )}
      </section>
    </div>
  );
}
