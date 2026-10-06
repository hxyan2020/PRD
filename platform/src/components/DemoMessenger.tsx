"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ChevronDown, ChevronRight, Send, Sparkles } from "lucide-react";
import { Badge, SeverityBadge, StatusBadge } from "@/components/ui";
import { VantageMark } from "@/components/VantageLogo";
import { AdminLink } from "@/components/AdminLink";
import { useUiLocale } from "@/hooks/useUiLocale";
import { t, phrase, type UiLocale } from "@/lib/i18n";
import { bumpNavBadge } from "@/lib/nav-badges";
import { THINKING_ACTIONS, thinkingSteps } from "@/lib/messenger/thinking";

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

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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
  priority?: "critical" | "control" | "soft";
  permission?: string;
};

type MessengerCaps = {
  roleCode: string;
  canEvidence: boolean;
  canEscalate: boolean;
  canTriage: boolean;
  canIntervene: boolean;
  canSoftControl: boolean;
};

const ACTION_PRIORITY: Record<string, "critical" | "control" | "soft"> = {
  BLOCK_ACCOUNT: "critical",
  HALT_SYMBOL: "critical",
  CUT_LEVERAGE: "control",
  PAUSE_COPY: "control",
  WIDEN_SPREAD: "soft",
};

type InboxPack = {
  messages: Message[];
  pending: Pending[];
  recommended_actions: Recommended[];
};

type LiveThink = {
  steps: string[];
  visible: number;
};

function stamp() {
  return new Date().toISOString().replace("T", " ").slice(0, 19);
}

let msgSeq = 0;

function makeMessage(kind: string, sender: string, body: string, meta: Record<string, unknown> = {}): Message {
  const now = Date.now();
  msgSeq += 1;
  return {
    id: now + msgSeq,
    msg_id: `${kind === "THINKING" ? "THINK" : "MSG"}-DEMO-${now}-${msgSeq}`,
    kind,
    sender,
    body,
    meta_json: JSON.stringify(meta),
    created_at: stamp(),
  };
}

function ThinkingCard({
  steps,
  visible,
  running,
  elapsedMs,
  expanded,
  onToggle,
  locale,
}: {
  steps: string[];
  visible: number;
  running: boolean;
  elapsedMs?: number;
  expanded?: boolean;
  onToggle?: () => void;
  locale: UiLocale;
}) {
  const shown = running ? steps.slice(0, Math.max(visible, 0)) : steps;
  const seconds = Math.max(1, Math.round((elapsedMs || 0) / 1000));
  return (
    <div className="rounded-xl border border-teal-200 bg-gradient-to-b from-teal-50 to-white px-3 py-2 text-sm max-w-full sm:max-w-[95%]">
      <button
        type="button"
        className="flex w-full items-center gap-2 text-left min-h-11"
        onClick={running ? undefined : onToggle}
        aria-expanded={running ? true : Boolean(expanded)}
        aria-label={running ? t("msg.thinking", locale) : expanded ? t("msg.hideThoughts", locale) : t("msg.showThoughts", locale)}
      >
        {running ? (
          <span className="flex gap-1 shrink-0" aria-hidden>
            <span className="think-dot" />
            <span className="think-dot" />
            <span className="think-dot" />
          </span>
        ) : expanded ? (
          <ChevronDown size={16} className="shrink-0 text-teal-800" />
        ) : (
          <ChevronRight size={16} className="shrink-0 text-teal-800" />
        )}
        <Sparkles size={14} className="shrink-0 text-teal-800" />
        <span className="font-semibold text-teal-950">
          {running ? t("msg.thinking", locale) : t("msg.thoughtFor", locale, { s: seconds })}
        </span>
      </button>
      {(running || expanded) && shown.length > 0 && (
        <ol className="mt-1.5 mb-1 space-y-1.5 pl-0.5">
          {shown.map((step, i) => {
            const current = running && i === visible - 1;
            const done = !running || i < visible - 1;
            return (
              <li key={`${i}-${step}`} className="think-step flex gap-2 text-[13px] leading-snug text-slate-700">
                <span className={`mt-0.5 shrink-0 ${done ? "text-teal-700" : "text-teal-500"}`}>{done ? "✓" : "›"}</span>
                <span>
                  {step}
                  {current ? <span className="think-cursor" /> : null}
                </span>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

export function DemoMessenger({
  initialThreads,
  initialCatalog = {},
  staticMode = false,
  caps,
}: {
  initialThreads: Thread[];
  initialCatalog?: Record<number, InboxPack>;
  staticMode?: boolean;
  caps?: MessengerCaps;
}) {
  const router = useRouter();
  const { locale } = useUiLocale();
  const capabilities: MessengerCaps = caps || {
    roleCode: staticMode ? "PUBLIC_GUEST" : "VIEWER",
    canEvidence: true,
    canEscalate: staticMode,
    canTriage: staticMode,
    canIntervene: staticMode,
    canSoftControl: staticMode,
  };
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
  const [liveThink, setLiveThink] = useState<LiveThink | null>(null);
  const [openThoughts, setOpenThoughts] = useState<Record<string, boolean>>({});

  const packRef = useRef({ messages, pending, recommended, activeId });
  packRef.current = { messages, pending, recommended, activeId };
  const runGen = useRef(0);
  const lockRef = useRef(false);
  const listRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const active = useMemo(() => threads.find((row) => row.id === activeId) || null, [threads, activeId]);

  const visibleRecommended = useMemo(() => {
    return recommended.filter((a) => {
      const priority = a.priority || ACTION_PRIORITY[a.code] || "soft";
      if (priority === "critical" || priority === "control") return capabilities.canIntervene;
      if (priority === "soft") return capabilities.canSoftControl || capabilities.canIntervene;
      return false;
    });
  }, [recommended, capabilities.canIntervene, capabilities.canSoftControl]);

  const recommendedGroups = useMemo(() => {
    const groups: Record<"critical" | "control" | "soft", Recommended[]> = {
      critical: [],
      control: [],
      soft: [],
    };
    for (const a of visibleRecommended) {
      const priority = a.priority || ACTION_PRIORITY[a.code] || "soft";
      groups[priority].push(a);
    }
    return groups;
  }, [visibleRecommended]);

  useEffect(() => {
    runGen.current += 1;
    setLiveThink(null);
  }, [activeId]);

  useEffect(() => {
    const node = listRef.current;
    if (!node) return;
    const scroll = () => {
      node.scrollTop = node.scrollHeight;
    };
    scroll();
    const frame = window.requestAnimationFrame(scroll);
    const timer = window.setTimeout(scroll, 80);
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timer);
    };
  }, [messages, liveThink, pending, statusMsg]);

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
      setStatusMsg(data.error || t("msg.failedThread", locale));
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

  function commitPack(nextMessages: Message[], nextPending: Pending[], extra: { status?: string } = {}) {
    const id = packRef.current.activeId;
    if (!id) return;
    packRef.current = {
      ...packRef.current,
      messages: nextMessages,
      pending: nextPending,
    };
    setMessages(nextMessages);
    setPending(nextPending);
    setThreads((prev) =>
      prev.map((thread) =>
        thread.id === id
          ? {
              ...thread,
              last_body: nextMessages[nextMessages.length - 1]?.body || thread.last_body,
              message_count: nextMessages.filter((m) => m.kind !== "THINKING").length,
              status: extra.status || thread.status,
            }
          : thread
      )
    );
    setCatalog((prev) => ({
      ...prev,
      [id]: {
        messages: nextMessages,
        pending: nextPending,
        recommended_actions: packRef.current.recommended,
      },
    }));
  }

  function appendLocal(
    kind: string,
    sender: string,
    body: string,
    extra: { status?: string; action_code?: string; meta?: Record<string, unknown> } = {}
  ) {
    if (!packRef.current.activeId) return;
    const msg = makeMessage(kind, sender, body, extra.meta || {});
    const nextMessages = [...packRef.current.messages, msg];
    let nextPending = packRef.current.pending;
    if (kind === "ACTION_PROPOSAL") {
      const code = extra.action_code || "WIDEN_SPREAD";
      nextPending = [
        ...packRef.current.pending,
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
    }
    commitPack(nextMessages, nextPending, extra);
  }

  async function playThinking(action: string, extra: Record<string, unknown> = {}) {
    const gen = runGen.current;
    const steps = thinkingSteps(action, locale, extra);
    const startedAt = Date.now();
    setLiveThink({ steps, visible: 0 });
    await sleep(180);
    for (let i = 0; i < steps.length; i += 1) {
      if (gen !== runGen.current) return null;
      setLiveThink({ steps, visible: i + 1 });
      await sleep(500 + i * 70);
    }
    await sleep(260);
    if (gen !== runGen.current) return null;
    const elapsedMs = Date.now() - startedAt;
    setLiveThink(null);
    return { steps, elapsedMs };
  }

  function mergeThought(serverMsgs: Message[], thought: Message, action: string, prev: Message[]) {
    const durable = prev.filter((m) => m.kind !== "THINKING" && !String(m.msg_id).startsWith("MSG-DEMO-"));
    const prevIds = new Set(durable.map((m) => m.msg_id));
    const firstNew = serverMsgs.findIndex((m) => !prevIds.has(m.msg_id));
    const insertAt = firstNew === -1 ? serverMsgs.length : firstNew;
    const olderThoughts = prev.filter((m) => m.kind === "THINKING" && m.msg_id !== thought.msg_id);
    let merged: Message[];
    if (action === "chat") {
      const head = serverMsgs.slice(0, insertAt);
      const tail = serverMsgs.slice(insertAt);
      const userMsg = tail[0];
      merged = [...head, ...(userMsg ? [userMsg] : []), thought, ...tail.slice(userMsg ? 1 : 0)];
    } else {
      merged = [...serverMsgs.slice(0, insertAt), thought, ...serverMsgs.slice(insertAt)];
    }
    const idx = merged.findIndex((m) => m.msg_id === thought.msg_id);
    if (idx >= 0 && olderThoughts.length) {
      return [...merged.slice(0, idx), ...olderThoughts, ...merged.slice(idx)];
    }
    return merged;
  }

  async function run(action: string, extra: Record<string, unknown> = {}) {
    if (!activeId && action !== "sync") return;
    if (lockRef.current && action !== "sync") return;
    if (action === "chat" && !String(extra.text || "").trim()) return;

    const gen = runGen.current;
    lockRef.current = true;
    setBusy(true);
    setStatusMsg(null);

    let thought: { steps: string[]; elapsedMs: number } | null = null;
    try {
      if (THINKING_ACTIONS.has(action)) {
        if (action === "chat") {
          appendLocal(
            "USER",
            locale === "zh-Hant" ? "公開訪客" : "Public visitor",
            String(extra.text || "").trim()
          );
          setChat("");
        }
        thought = await playThinking(action, extra);
        if (!thought || gen !== runGen.current) return;
        appendLocal("THINKING", locale === "zh-Hant" ? "CRMP AI" : "CRMP AI", thought.steps.join("\n"), {
          meta: { elapsed_ms: thought.elapsedMs, action, steps: thought.steps },
        });
      }

      if (staticMode) {
        const zh = locale === "zh-Hant";
        const actorVisitor = zh ? "公開訪客" : "Public visitor";
        const actorEvidence = zh ? "證據庫" : "Evidence Vault";
        const actorEscalation = zh ? "升級引擎" : "Escalation Engine";
        const actorAdvisor = zh ? "動作顧問" : "Action Advisor";
        const actorBot = zh ? "CRMP 聊天機器人" : "CRMP Chatbot";
        if (action === "sync") {
          setStatusMsg(t("msg.synced", locale, { n: 0 }));
          return;
        }
        if (action === "show_evidence") {
          appendLocal(
            "EVIDENCE",
            actorEvidence,
            zh
              ? "📎 證據包（示範）\n• [MONITOR] 128 帳戶保證金使用率 >90%\n• [BOOK] 跟單權益集中度 31%\n• [RAG] 先前美盤開盤違規劇本"
              : "📎 Evidence pack (demo)\n• [MONITOR] Margin utilisation >90% for 128 accounts\n• [BOOK] Copy-equity concentration 31%\n• [RAG] Prior US-open breach playbook"
          );
        } else if (action === "escalate") {
          appendLocal(
            "ESCALATION",
            actorEscalation,
            zh
              ? "⬆️ 已升級至風險負責人（步驟 2/4）\n頻道：風險控管台 · SLA 15 分鐘\n路徑：風險控管台 → 信貸與客戶風險 → 風險負責人 → 高管風險橋"
              : "⬆️ Escalated to Risk Owner (step 2/4)\nChannel: Risk Control Desk · SLA 15m\nPath: Risk Control Desk → Credit & Client Risk → Risk Owner → Exec Risk Bridge"
          );
        } else if (action === "dismiss") {
          appendLocal(
            "SYSTEM",
            actorVisitor,
            zh ? "❎ 已排除為誤報。警報已關閉。" : "❎ Dismissed as false alarm. Alert closed.",
            { status: "DISMISSED" }
          );
        } else if (action === "close") {
          appendLocal(
            "SYSTEM",
            actorVisitor,
            zh ? "✅ 已結案 — 接受 AI 分析。" : "✅ Closed — AI analysis accepted.",
            { status: "CLOSED" }
          );
        } else if (action === "chat") {
          appendLocal(
            "CHATBOT",
            actorBot,
            zh
              ? "💬 已記錄。已附加至示範執行緒供風險台審閱。"
              : "💬 Noted. Attached to the demo thread for Risk Desk review."
          );
        } else if (action === "recommend") {
          const code = String(extra.action_code || "WIDEN_SPREAD");
          appendLocal(
            "ACTION_PROPOSAL",
            actorAdvisor,
            zh
              ? `⚙️ 建議：${code}\n送至 Vantage Markets 管理後台前請雙重確認。`
              : `⚙️ Proposed: ${code}\nPlease double-confirm before sending to Vantage Markets admin.`,
            { action_code: code }
          );
        } else if (action !== "sync") {
          appendLocal(
            "SYSTEM",
            "Messenger",
            zh
              ? `示範動作 ${action} 已記錄（靜態快照 — 無即時 Lark API）。`
              : `Demo action ${action} recorded (static snapshot — no live Lark API).`
          );
        }
        setStatusMsg(t("msg.actionDone", locale, { action }));
        setConfirmId(null);
        if (action === "escalate" || action === "sync") bumpNavBadge("/admin/messenger", 1);
        if (action === "confirm_action") bumpNavBadge("/admin/interventions", 1);
        return;
      }

      const snapshot = packRef.current.messages;
      const localThought = [...snapshot].reverse().find((m) => m.kind === "THINKING");
      const res = await fetch("/api/messenger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, thread_id: activeId, ...extra }),
      });
      const data = await res.json();
      if (gen !== runGen.current) return;
      if (!res.ok) {
        setStatusMsg(data.error || t("msg.actionFailed", locale));
        return;
      }
      if (action === "sync") {
        setThreads(data.threads || []);
        setStatusMsg(t("msg.synced", locale, { n: data.synced ?? 0 }));
        bumpNavBadge("/admin/messenger", Number(data.synced) || 1);
        router.refresh();
        return;
      }
      const serverMsgs: Message[] = data.messages || [];
      const nextMessages =
        thought && localThought ? mergeThought(serverMsgs, localThought, action, snapshot) : serverMsgs;
      setMessages(nextMessages);
      setPending(data.pending || []);
      setRecommended(data.recommended_actions || []);
      setConfirmId(null);
      setChat("");
      const listRes = await fetch("/api/messenger");
      const listData = await listRes.json();
      if (gen !== runGen.current) return;
      if (listRes.ok) setThreads(listData.threads || []);
      setStatusMsg(t("msg.actionDone", locale, { action }));
      if (action === "escalate") bumpNavBadge("/admin/messenger", 1);
      if (action === "confirm_action") bumpNavBadge("/admin/interventions", 1);
    } finally {
      lockRef.current = false;
      setBusy(false);
    }
  }

  useEffect(() => {
    if (activeId && !loaded) {
      void loadThread(activeId, { openPane: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId, loaded]);

  return (
    <div className="messenger-shell grid lg:grid-cols-[minmax(240px,300px)_minmax(0,1fr)] gap-3 sm:gap-4">
      <section
        className={`panel p-3 flex flex-col min-h-0 ${
          mobilePane === "thread" ? "hidden lg:flex" : "flex"
        }`}
      >
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 min-w-0">
            <VantageMark className="h-7 w-7" />
            <h2 className="font-semibold text-sm sm:text-base">{t("msg.channels", locale)}</h2>
          </div>
          <button type="button" className="btn text-xs !min-h-11" disabled={busy} onClick={() => void run("sync")}>
            {t("msg.sync", locale)}
          </button>
        </div>
        <div className="space-y-2 overflow-auto flex-1 min-h-0 -mx-1 px-1 overscroll-contain">
          {threads.map((row) => (
            <button
              key={row.id}
              type="button"
              onClick={() => void loadThread(row.id)}
              className={`w-full text-left rounded-xl border px-3 py-2.5 transition min-h-16 ${
                activeId === row.id ? "border-teal-400 bg-teal-50" : "border-[var(--line)] hover:bg-slate-50"
              }`}
            >
              <div className="flex flex-wrap gap-1.5 items-center">
                <SeverityBadge value={row.severity} />
                <StatusBadge value={row.status} />
              </div>
              <div className="mt-1 text-sm font-semibold line-clamp-2 break-word">{phrase(row.title, locale)}</div>
              <div className="text-[11px] text-[var(--muted)] mt-0.5">
                {row.channel_name} · {row.message_count} msgs
              </div>
            </button>
          ))}
          {!threads.length && <p className="text-sm text-[var(--muted)] p-2">{t("msg.empty", locale)}</p>}
        </div>
      </section>

      <section
        className={`panel p-3 sm:p-4 flex flex-col min-h-0 ${
          mobilePane === "list" ? "hidden lg:flex" : "flex"
        }`}
      >
        {active ? (
          <>
            <div className="border-b border-[var(--line)] pb-2 mb-2 shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <button
                  type="button"
                  className="btn !min-h-11 !px-2.5 lg:hidden shrink-0"
                  onClick={() => setMobilePane("list")}
                >
                  <ArrowLeft size={16} />
                  <span className="sr-only">{t("msg.threads", locale)}</span>
                </button>
                <div className="flex flex-wrap gap-1.5 items-center min-w-0">
                  <SeverityBadge value={active.severity} />
                  <StatusBadge value={active.status} />
                  <span className="hidden sm:inline-flex">
                    <Badge className="bg-slate-100 text-slate-700 border-slate-200">{active.channel_name}</Badge>
                  </span>
                  <span className="hidden sm:inline-flex">
                    <Badge className="bg-orange-50 text-orange-900 border-orange-200">{active.thread_id}</Badge>
                  </span>
                </div>
              </div>
              <h2 className="mt-2 font-[family-name:var(--font-display)] text-base sm:text-xl break-word line-clamp-2">
                {phrase(active.title, locale)}
              </h2>
              {active.status === "OPEN" ? (
                <div className="mt-3 space-y-2" data-testid="msg-triage-actions">
                  <div className="text-[10px] uppercase tracking-[0.12em] text-[var(--muted)]">
                    {t("msg.triagePrimary", locale)}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {capabilities.canTriage ? (
                      <button
                        type="button"
                        className="btn btn-primary !min-h-11"
                        disabled={busy}
                        onClick={() => void run("close")}
                        data-testid="msg-btn-close"
                      >
                        {t("msg.close", locale)}
                      </button>
                    ) : null}
                    {capabilities.canEscalate ? (
                      <button
                        type="button"
                        className="btn !min-h-11 border-rose-300 bg-rose-50 text-rose-950 hover:bg-rose-100"
                        disabled={busy}
                        onClick={() => void run("escalate")}
                        title={t("msg.escalateHint", locale)}
                        data-testid="msg-btn-escalate"
                      >
                        {t("msg.escalate", locale)}
                      </button>
                    ) : (
                      <p className="text-xs text-rose-800 self-center">{t("msg.escalateHint", locale)}</p>
                    )}
                  </div>
                  <div className="text-[10px] uppercase tracking-[0.12em] text-[var(--muted)] pt-1">
                    {t("msg.triageSecondary", locale)}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {capabilities.canEvidence ? (
                      <button
                        type="button"
                        className="btn"
                        disabled={busy}
                        onClick={() => void run("show_evidence")}
                        data-testid="msg-btn-evidence"
                      >
                        {t("msg.showEvidence", locale)}
                      </button>
                    ) : null}
                    {capabilities.canTriage ? (
                      <button
                        type="button"
                        className="btn text-[var(--muted)]"
                        disabled={busy}
                        onClick={() => void run("dismiss")}
                        data-testid="msg-btn-dismiss"
                      >
                        {t("msg.dismiss", locale)}
                      </button>
                    ) : null}
                  </div>
                  <p className="text-[11px] text-[var(--muted)] leading-snug">{t("msg.rankNote", locale)}</p>
                </div>
              ) : null}
            </div>

            <div ref={listRef} className="flex-1 overflow-auto space-y-3 pr-0.5 overscroll-contain min-h-[12rem]">
              {messages.map((m) => {
                if (m.kind === "THINKING") {
                  const meta = JSON.parse(m.meta_json || "{}") as {
                    elapsed_ms?: number;
                    steps?: string[];
                  };
                  const steps = Array.isArray(meta.steps) && meta.steps.length ? meta.steps : m.body.split("\n").filter(Boolean);
                  const expanded = Boolean(openThoughts[m.msg_id]);
                  return (
                    <ThinkingCard
                      key={m.msg_id}
                      steps={steps}
                      visible={steps.length}
                      running={false}
                      elapsedMs={meta.elapsed_ms}
                      expanded={expanded}
                      onToggle={() => setOpenThoughts((prev) => ({ ...prev, [m.msg_id]: !prev[m.msg_id] }))}
                      locale={locale}
                    />
                  );
                }
                const meta = JSON.parse(m.meta_json || "{}") as Record<string, unknown>;
                const isUser = m.kind === "USER";
                return (
                  <div
                    key={m.msg_id}
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
                      {phrase(m.body, locale)}
                    </pre>
                    {typeof meta.admin_url === "string" ? (
                      <AdminLink className="inline-block mt-2 text-teal-800 text-xs underline" href={String(meta.admin_url)}>
                        {t("msg.openInAdmin", locale)}
                      </AdminLink>
                    ) : null}
                  </div>
                );
              })}
              {liveThink ? (
                <ThinkingCard
                  steps={liveThink.steps}
                  visible={liveThink.visible}
                  running
                  locale={locale}
                />
              ) : null}
              <div ref={bottomRef} className="h-px w-full shrink-0" />
            </div>

            {active.status === "OPEN" && (
              <div className="mt-2 border-t border-[var(--line)] pt-2 space-y-2 shrink-0 bg-[var(--panel)] pb-[max(0.35rem,var(--safe-bottom))]">
                <div data-testid="msg-recommended-actions">
                  <div className="flex flex-wrap items-baseline justify-between gap-2 mb-2">
                    <div className="text-xs uppercase tracking-[0.1em] text-[var(--muted)]">
                      {t("msg.recommended", locale)}
                    </div>
                    <div className="text-[10px] text-[var(--muted)]">{capabilities.roleCode}</div>
                  </div>
                  <p className="text-[11px] text-[var(--muted)] mb-2 leading-snug">{t("msg.rankNote", locale)}</p>
                  {(
                    [
                      ["critical", "msg.groupCritical"],
                      ["control", "msg.groupControl"],
                      ["soft", "msg.groupSoft"],
                    ] as const
                  ).map(([key, labelKey]) => {
                    const items = recommendedGroups[key];
                    if (!items.length) return null;
                    return (
                      <div key={key} className="mb-2">
                        <div className="text-[10px] uppercase tracking-[0.12em] text-[var(--muted)] mb-1">
                          {t(labelKey, locale)}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {items.map((a, idx) => {
                            const loc = localizeAction(a.code, a.label, a.description, locale);
                            const cls =
                              key === "critical" && idx === 0
                                ? "btn btn-primary"
                                : key === "critical"
                                  ? "btn border-rose-300 bg-rose-50 text-rose-950"
                                  : "btn";
                            return (
                              <button
                                key={a.code}
                                type="button"
                                className={`${cls} text-xs`}
                                disabled={busy}
                                title={loc.description}
                                onClick={() => void run("recommend", { action_code: a.code })}
                                data-testid={`msg-rec-${a.code}`}
                              >
                                {loc.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                  {!visibleRecommended.length ? (
                    <p className="text-xs text-rose-800">{t("msg.escalateHint", locale)}</p>
                  ) : null}
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
                              onClick={() => void run("checker_approve", { pending_id: p.id })}
                            >
                              {t("msg.checkerApprove", locale)}
                            </button>
                            <AdminLink className="btn" href={detail.admin_path || "/admin/interventions"}>
                              {t("msg.openAdmin", locale)}
                            </AdminLink>
                          </>
                        ) : confirmId === p.id ? (
                          <>
                            <button
                              type="button"
                              className="btn btn-primary"
                              disabled={busy}
                              onClick={() => void run("confirm_action", { pending_id: p.id })}
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
                              onClick={() => void run("cancel_action", { pending_id: p.id })}
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
                  className="flex gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!chat.trim()) return;
                    void run("chat", { text: chat.trim() });
                  }}
                >
                  <input
                    className="input flex-1 !rounded-xl !min-h-11"
                    placeholder={t("msg.chatPlaceholder", locale)}
                    value={chat}
                    onChange={(e) => setChat(e.target.value)}
                    disabled={busy}
                  />
                  <button
                    type="submit"
                    className="btn btn-primary shrink-0 !min-h-11 !px-3 sm:!px-4"
                    disabled={busy || !chat.trim()}
                    aria-label={t("msg.send", locale)}
                  >
                    <Send size={16} className="sm:hidden" aria-hidden />
                    <span className="hidden sm:inline">{t("msg.send", locale)}</span>
                  </button>
                </form>
              </div>
            )}

            {statusMsg && (
              <div className="mt-2 text-xs sm:text-sm bg-teal-50 border border-teal-200 text-teal-900 rounded-lg px-3 py-2 break-word shrink-0 line-clamp-2">
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
