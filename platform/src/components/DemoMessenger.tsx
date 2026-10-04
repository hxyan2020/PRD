"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Badge, SeverityBadge, StatusBadge } from "@/components/ui";
import { useUiLocale } from "@/hooks/useUiLocale";
import { t, type UiLocale } from "@/lib/i18n";

const ACTION_I18N: Record<string, { en: string; "zh-Hant": string; descEn: string; descZh: string }> = {
  BLOCK_ACCOUNT: {
    en: "Block user account",
    "zh-Hant": "封鎖使用者帳戶",
    descEn: "Freeze login and new orders for flagged account(s).",
    descZh: "凍結標註帳戶之登入與新訂單。",
  },
  HALT_SYMBOL: {
    en: "Halt trading (symbol)",
    "zh-Hant": "暫停交易（商品）",
    descEn: "Temporarily disable new exposure on the stressed symbol.",
    descZh: "暫時停用受壓商品之新曝險。",
  },
  CUT_LEVERAGE: {
    en: "Cut max leverage",
    "zh-Hant": "調降最大槓桿",
    descEn: "Reduce leverage for affected cohort / instrument.",
    descZh: "降低受影響族群／商品槓桿。",
  },
  WIDEN_SPREAD: {
    en: "Pre-widen spreads",
    "zh-Hant": "預先擴大點差",
    descEn: "Widen LP quotes ahead of expected volatility.",
    descZh: "在預期波動前擴大 LP 報價點差。",
  },
  PAUSE_COPY: {
    en: "Pause copy joining",
    "zh-Hant": "暫停跟單加入",
    descEn: "Stop new copiers joining the concentrated provider.",
    descZh: "停止新跟單者加入過度集中之提供者。",
  },
};

function localizeAction(code: string, label: string, description: string, locale: UiLocale) {
  const hit = ACTION_I18N[code];
  if (!hit) return { label, description };
  return {
    label: hit[locale],
    description: locale === "zh-Hant" ? hit.descZh : hit.descEn,
  };
}

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

type InboxPack = {
  messages: Message[];
  pending: Pending[];
  recommended_actions: Recommended[];
};

export function DemoMessenger({
  initialThreads,
  initialCatalog = {},
  staticMode = false,
}: {
  initialThreads: Thread[];
  initialCatalog?: Record<number, InboxPack>;
  staticMode?: boolean;
}) {
  const router = useRouter();
  const { locale } = useUiLocale();
  const [threads, setThreads] = useState(initialThreads);
  const [catalog, setCatalog] = useState<Record<number, InboxPack>>(initialCatalog);
  const [activeId, setActiveId] = useState<number | null>(initialThreads[0]?.id ?? null);
  const firstPack = initialThreads[0] ? initialCatalog[initialThreads[0].id] : undefined;
  const [messages, setMessages] = useState<Message[]>(firstPack?.messages || []);
  const [pending, setPending] = useState<Pending[]>(firstPack?.pending || []);
  const [recommended, setRecommended] = useState<Recommended[]>(firstPack?.recommended_actions || []);
  const [chat, setChat] = useState("");
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(Boolean(firstPack?.messages?.length));
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [mobilePane, setMobilePane] = useState<"list" | "thread">("list");

  const active = useMemo(() => threads.find((t) => t.id === activeId) || null, [threads, activeId]);

  function applyPack(id: number, pack: InboxPack, opts: { openPane?: boolean } = {}) {
    setActiveId(id);
    setMessages(pack.messages || []);
    setPending(pack.pending || []);
    setRecommended(pack.recommended_actions || []);
    setLoaded(true);
    setConfirmId(null);
    if (opts.openPane !== false) setMobilePane("thread");
  }

  async function loadThread(id: number, opts: { openPane?: boolean } = {}) {
    if (staticMode && catalog[id]) {
      applyPack(id, catalog[id], opts);
      return;
    }
    setBusy(true);
    setStatusMsg(null);
    const res = await fetch(`/api/messenger?id=${id}`);
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      if (catalog[id]) {
        applyPack(id, catalog[id], opts);
        return;
      }
      setStatusMsg(data.error || "Failed to load thread");
      return;
    }
    applyPack(
      id,
      {
        messages: data.messages || [],
        pending: data.pending || [],
        recommended_actions: data.recommended_actions || [],
      },
      opts
    );
  }

  function appendLocal(
    kind: string,
    sender: string,
    body: string,
    extra: { status?: string; action_code?: string } = {}
  ) {
    if (!activeId) return;
    const msg: Message = {
      id: Date.now(),
      msg_id: `MSG-DEMO-${Date.now()}`,
      kind,
      sender,
      body,
      meta_json: "{}",
      created_at: new Date().toISOString().replace("T", " ").slice(0, 19),
    };
    const nextMessages = [...messages, msg];
    let nextPending = pending;
    setMessages(nextMessages);
    setThreads((prev) =>
      prev.map((thread) =>
        thread.id === activeId
          ? {
              ...thread,
              last_body: body,
              message_count: thread.message_count + 1,
              status: extra.status || thread.status,
            }
          : thread
      )
    );
    if (kind === "ACTION_PROPOSAL") {
      const code = extra.action_code || "WIDEN_SPREAD";
      nextPending = [
        ...pending,
        {
          id: Date.now(),
          action_code: code,
          status: "AWAITING_CONFIRM",
          detail_json: JSON.stringify({
            label: code,
            description: body,
            admin_path: "/admin/interventions",
          }),
        },
      ];
      setPending(nextPending);
    }
    setCatalog((prev) => ({
      ...prev,
      [activeId]: {
        messages: nextMessages,
        pending: nextPending,
        recommended_actions: recommended,
      },
    }));
  }

  async function run(action: string, extra: Record<string, unknown> = {}) {
    if (!activeId && action !== "sync") return;
    if (staticMode) {
      if (action === "sync") {
        setStatusMsg(t("msg.synced", locale, { n: 0 }));
        return;
      }
      if (action === "show_evidence") {
        appendLocal(
          "EVIDENCE",
          "Evidence Vault",
          "📎 Evidence pack (demo)\n• [MONITOR] Margin utilisation >90% for 128 accounts\n• [BOOK] Copy-equity concentration 31%\n• [RAG] Prior US-open breach playbook"
        );
      } else if (action === "escalate") {
        appendLocal(
          "ESCALATION",
          "Escalation Engine",
          "⬆️ Escalated to Risk Owner (step 2/4)\nChannel: Risk Control Desk · SLA 15m\nPath: Risk Control Desk → Credit & Client Risk → Risk Owner → Exec Risk Bridge"
        );
      } else if (action === "dismiss") {
        appendLocal("SYSTEM", "Public visitor", "❎ Dismissed as false alarm. Alert closed.", { status: "DISMISSED" });
      } else if (action === "close") {
        appendLocal("SYSTEM", "Public visitor", "✅ Closed — AI analysis accepted.", { status: "CLOSED" });
      } else if (action === "chat") {
        const text = String(extra.text || "").trim();
        if (!text) return;
        const now = Date.now();
        const userMsg: Message = {
          id: now,
          msg_id: `MSG-DEMO-${now}`,
          kind: "USER",
          sender: "Public visitor",
          body: text,
          meta_json: "{}",
          created_at: new Date().toISOString().replace("T", " ").slice(0, 19),
        };
        const botMsg: Message = {
          ...userMsg,
          id: now + 1,
          msg_id: `MSG-DEMO-${now + 1}`,
          kind: "CHATBOT",
          sender: "CRMP Chatbot",
          body: "💬 Noted. Attached to the demo thread for Risk Desk review.",
        };
        const nextMessages = [...messages, userMsg, botMsg];
        setMessages(nextMessages);
        setThreads((prev) =>
          prev.map((thread) =>
            thread.id === activeId
              ? { ...thread, last_body: botMsg.body, message_count: thread.message_count + 2 }
              : thread
          )
        );
        setCatalog((prev) => ({
          ...prev,
          [activeId]: { messages: nextMessages, pending, recommended_actions: recommended },
        }));
        setChat("");
      } else if (action === "recommend") {
        appendLocal(
          "ACTION_PROPOSAL",
          "Action Advisor",
          `⚙️ Proposed: ${String(extra.action_code || "WIDEN_SPREAD")}\nPlease double-confirm before sending to Vantage Markets admin.`,
          { action_code: String(extra.action_code || "WIDEN_SPREAD") }
        );
      } else {
        appendLocal("SYSTEM", "Messenger", `Demo action ${action} recorded (static snapshot — no live Lark API).`);
      }
      setStatusMsg(t("msg.actionDone", locale, { action }));
      setConfirmId(null);
      return;
    }
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
      setStatusMsg(t("msg.synced", locale, { n: data.synced ?? 0 }));
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
    setStatusMsg(t("msg.actionDone", locale, { action }));
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
          <h2 className="font-semibold text-sm sm:text-base">{t("msg.channels", locale)}</h2>
          <button type="button" className="btn text-xs !min-h-9" disabled={busy} onClick={() => run("sync")}>
            {t("msg.sync", locale)}
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
          {!threads.length && <p className="text-sm text-[var(--muted)] p-2">{t("msg.empty", locale)}</p>}
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
                  <ArrowLeft size={14} /> {t("msg.threads", locale)}
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
                  {t("msg.showEvidence", locale)}
                </button>
                <button
                  type="button"
                  className="btn"
                  disabled={busy || active.status !== "OPEN"}
                  onClick={() => run("escalate")}
                >
                  {t("msg.escalate", locale)}
                </button>
                <button
                  type="button"
                  className="btn"
                  disabled={busy || active.status !== "OPEN"}
                  onClick={() => run("dismiss")}
                >
                  {t("msg.dismiss", locale)}
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={busy || active.status !== "OPEN"}
                  onClick={() => run("close")}
                >
                  {t("msg.close", locale)}
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
                        {t("msg.openInAdmin", locale)}
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
                    {t("msg.recommended", locale)}
                  </div>
                  <div className="action-row">
                    {recommended.map((a) => {
                      const loc = localizeAction(a.code, a.label, a.description, locale);
                      return (
                        <button
                          key={a.code}
                          type="button"
                          className="btn text-xs"
                          disabled={busy}
                          title={loc.description}
                          onClick={() => run("recommend", { action_code: a.code })}
                        >
                          {loc.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {pending.map((p) => {
                  const detail = JSON.parse(p.detail_json || "{}") as Recommended;
                  const loc = localizeAction(
                    p.action_code,
                    detail.label || p.action_code,
                    detail.description || "",
                    locale
                  );
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
                        {awaitingChecker ? t("msg.checkerNeeded", locale) : t("msg.confirm", locale)} {loc.label}
                      </div>
                      <p className="text-[var(--muted)] mt-1 break-word">{loc.description}</p>
                      <div className="mt-2 action-row">
                        {awaitingChecker ? (
                          <>
                            <button
                              type="button"
                              className="btn btn-primary"
                              disabled={busy}
                              onClick={() => run("checker_approve", { pending_id: p.id })}
                            >
                              {t("msg.checkerApprove", locale)}
                            </button>
                            <a className="btn" href={detail.admin_path || "/admin/interventions"}>
                              {t("msg.openAdmin", locale)}
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
                              {t("msg.yesAdmin", locale)}
                            </button>
                            <button type="button" className="btn" disabled={busy} onClick={() => setConfirmId(null)}>
                              {t("msg.noBack", locale)}
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
                              {t("msg.doubleConfirm", locale)}
                            </button>
                            <button
                              type="button"
                              className="btn"
                              disabled={busy}
                              onClick={() => run("cancel_action", { pending_id: p.id })}
                            >
                              {t("msg.cancel", locale)}
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
                    placeholder={t("msg.chatPlaceholder", locale)}
                    value={chat}
                    onChange={(e) => setChat(e.target.value)}
                    disabled={busy}
                  />
                  <button type="submit" className="btn btn-primary sm:w-auto w-full" disabled={busy || !chat.trim()}>
                    {t("msg.send", locale)}
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
          <p className="text-[var(--muted)] text-sm p-2">{t("msg.select", locale)}</p>
        )}
      </section>
    </div>
  );
}
