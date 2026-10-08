"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Headphones, Mail, MessageCircle, Send } from "lucide-react";
import { VantageLogo } from "@/components/VantageLogo";
import { Badge, StatusBadge } from "@/components/ui";
import { useUiLocale } from "@/hooks/useUiLocale";
import { t, type UiLocale } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { isPublicSnapshot, publicApiPath } from "@/lib/static-export";
import { ownerLine } from "@/lib/platform-owner";

type Tab = "C1_LIVE_CHAT" | "WEB_FORM" | "OFFICIAL_EMAIL";

type ChatLine = { role: "client" | "system"; text: string };

type IntakePublic = {
  request_id: string;
  status: string;
  ai_clarity: string;
  skill_code: string | null;
  channel: string;
  channel_ref: string | null;
};

type IntakeResponse = {
  ok?: boolean;
  error?: string;
  mode?: string;
  continued?: boolean;
  closed_wait?: boolean;
  auto_email?: { to: string; subject: string; reason: string; status: string } | null;
  public?: IntakePublic | null;
  request?: { request_id: string; channel_ref: string | null; status: string };
};

const C1_REF_KEY = "crmp-cs-c1-ref";

function channelLabel(code: Tab, locale: UiLocale) {
  if (code === "C1_LIVE_CHAT") return locale === "zh-Hant" ? "C1 即時聊天" : "C1 live chat";
  if (code === "WEB_FORM") return locale === "zh-Hant" ? "提交表單" : "Submission form";
  return locale === "zh-Hant" ? "官方信箱" : "Official email";
}

export function CsClientPortal({ staticMode = false }: { staticMode?: boolean }) {
  const { locale, setLocale } = useUiLocale();
  const zh = locale === "zh-Hant";
  const snapshot = staticMode || (typeof window !== "undefined" && isPublicSnapshot());
  const [tab, setTab] = useState<Tab>("C1_LIVE_CHAT");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [uid, setUid] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [inReplyTo, setInReplyTo] = useState("");
  const [busy, setBusy] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [result, setResult] = useState<IntakeResponse | null>(null);
  const [chat, setChat] = useState<ChatLine[]>([]);
  const [c1Ref, setC1Ref] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return window.sessionStorage.getItem(C1_REF_KEY);
  });

  const tabs = useMemo(
    () =>
      [
        { code: "C1_LIVE_CHAT" as const, icon: MessageCircle },
        { code: "WEB_FORM" as const, icon: Send },
        { code: "OFFICIAL_EMAIL" as const, icon: Mail },
      ],
    []
  );

  async function postIntake(payload: Record<string, unknown>) {
    if (snapshot) {
      setStatusMsg(t("cs.portal.staticNote", locale));
      return null;
    }
    setBusy(true);
    setStatusMsg(null);
    try {
      const res = await fetch(publicApiPath("/api/cs/intake"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-cs-intake-token": "demo-c1",
        },
        body: JSON.stringify({ ...payload, portal: true, locale, mock_webhook: true }),
      });
      const data = (await res.json()) as IntakeResponse;
      if (!res.ok) {
        setStatusMsg(data.error || t("msg.actionFailed", locale));
        return null;
      }
      setResult(data);
      const pub = data.public;
      if (data.auto_email) {
        setStatusMsg(t("cs.portal.mailed", locale, { id: pub?.request_id || "" }));
      } else if (data.closed_wait) {
        setStatusMsg(t("cs.portal.replied", locale, { id: pub?.request_id || "" }));
      } else {
        setStatusMsg(t("cs.portal.received", locale, { id: pub?.request_id || "" }));
      }
      return data;
    } catch {
      setStatusMsg(t("cs.portal.failed", locale));
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function sendC1() {
    const text = message.trim();
    if (!text) return;
    setChat((prev) => [...prev, { role: "client", text }]);
    setMessage("");
    const data = await postIntake({
      channel: "C1_LIVE_CHAT",
      client_name: name || (zh ? "訪客" : "Visitor"),
      client_email: email || "visitor@client.example",
      client_uid: uid || null,
      subject: "C1 live chat",
      body: text,
      channel_ref: c1Ref,
    });
    const ref = data?.public?.channel_ref || data?.request?.channel_ref;
    if (ref && typeof window !== "undefined") {
      window.sessionStorage.setItem(C1_REF_KEY, ref);
      setC1Ref(ref);
    }
    if (data?.auto_email) {
      setChat((prev) => [
        ...prev,
        {
          role: "system",
          text: zh
            ? `AI 還不清楚或需要核身。已寄出官方信件（${data.auto_email?.subject}）。請回信或在此繼續說明。案件 ${data.public?.request_id}。`
            : `AI is unclear or needs ID. An official email was sent (${data.auto_email?.subject}). Reply to that mail or keep chatting. Ticket ${data.public?.request_id}.`,
        },
      ]);
    } else if (data?.public) {
      setChat((prev) => [
        ...prev,
        {
          role: "system",
          text: zh
            ? `已進件。狀態 ${data.public?.status} · 案件 ${data.public?.request_id}`
            : `Received. Status ${data.public?.status} · ticket ${data.public?.request_id}`,
        },
      ]);
    }
  }

  async function submitFormOrMail() {
    const text = message.trim();
    if (!text) return;
    await postIntake({
      channel: tab,
      client_name: name || (zh ? "客戶" : "Client"),
      client_email: email || "client@client.example",
      client_uid: uid || null,
      subject:
        subject.trim() ||
        (tab === "WEB_FORM" ? "Web form" : inReplyTo ? `Re: request ${inReplyTo}` : "Official email"),
      body: text,
      request_id: extractTicket(subject) || extractTicket(inReplyTo) || null,
      in_reply_to: inReplyTo.trim() || null,
      channel_ref: tab === "WEB_FORM" ? undefined : inReplyTo.trim() || undefined,
    });
    setMessage("");
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f4f7fb" }}>
      <header className="text-white px-4 sm:px-8 py-5" style={{ backgroundColor: "#044855" }}>
        <div className="max-w-3xl mx-auto flex flex-wrap items-start justify-between gap-3">
          <div>
            <VantageLogo inverted markClassName="h-12 w-12" />
            <h1 className="mt-3 font-[family-name:var(--font-display)] text-2xl sm:text-3xl">
              {t("cs.portal.title", locale)}
            </h1>
            <p className="mt-2 max-w-xl text-sm text-teal-50/90">{t("cs.portal.blurb", locale)}</p>
            <p className="mt-2 text-xs text-teal-100/80">{ownerLine(locale)}</p>
          </div>
          <div className="flex gap-1" role="group" aria-label={t("shell.language", locale)}>
            <button
              type="button"
              className={cn("btn !min-h-9 !px-3 text-xs", locale === "en" ? "btn-primary" : "bg-white/10 text-white border-white/20")}
              onClick={() => setLocale("en")}
            >
              English
            </button>
            <button
              type="button"
              className={cn("btn !min-h-9 !px-3 text-xs", locale === "zh-Hant" ? "btn-primary" : "bg-white/10 text-white border-white/20")}
              onClick={() => setLocale("zh-Hant")}
            >
              繁體中文
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-8 py-6 pb-[max(2rem,var(--safe-bottom))]">
        <div className="grid grid-cols-1 sm:flex sm:flex-wrap gap-2 mb-4">
          {tabs.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.code}
                type="button"
                data-testid={`cs-portal-tab-${item.code}`}
                className={cn("btn !min-h-11", tab === item.code ? "btn-primary" : "")}
                onClick={() => {
                  setTab(item.code);
                  setStatusMsg(null);
                }}
              >
                <Icon size={16} />
                {channelLabel(item.code, locale)}
              </button>
            );
          })}
        </div>

        <section className="panel p-4 sm:p-5 space-y-3">
          <p className="text-sm text-[var(--muted)]">{t(`cs.portal.hint.${tab}`, locale)}</p>
          <div className="grid sm:grid-cols-2 gap-3">
            <label className="text-sm">
              <span className="block text-xs uppercase tracking-wide text-[var(--muted)] mb-1">
                {t("cs.portal.name", locale)}
              </span>
              <input className="input w-full" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
            </label>
            <label className="text-sm">
              <span className="block text-xs uppercase tracking-wide text-[var(--muted)] mb-1">
                {t("cs.portal.email", locale)}
              </span>
              <input
                className="input w-full"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </label>
          </div>
          <label className="text-sm block">
            <span className="block text-xs uppercase tracking-wide text-[var(--muted)] mb-1">
              {t("cs.portal.uid", locale)}
            </span>
            <input className="input w-full" value={uid} onChange={(e) => setUid(e.target.value)} placeholder="880214" />
          </label>
          {tab !== "C1_LIVE_CHAT" ? (
            <label className="text-sm block">
              <span className="block text-xs uppercase tracking-wide text-[var(--muted)] mb-1">
                {t("cs.portal.subject", locale)}
              </span>
              <input
                className="input w-full"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder={t("cs.portal.subjectPh", locale)}
              />
            </label>
          ) : null}
          {tab === "OFFICIAL_EMAIL" ? (
            <label className="text-sm block">
              <span className="block text-xs uppercase tracking-wide text-[var(--muted)] mb-1">
                {t("cs.portal.inReply", locale)}
              </span>
              <input
                className="input w-full font-mono"
                value={inReplyTo}
                onChange={(e) => setInReplyTo(e.target.value)}
                placeholder="CSR-A1B2C3"
                data-testid="cs-portal-in-reply"
              />
            </label>
          ) : null}

          {tab === "C1_LIVE_CHAT" ? (
            <div className="rounded-xl border border-[var(--line)] bg-white min-h-[12rem] p-3 space-y-2" data-testid="cs-portal-c1-thread">
              {chat.length === 0 ? (
                <p className="text-sm text-[var(--muted)]">{t("cs.portal.chatEmpty", locale)}</p>
              ) : (
                chat.map((line, i) => (
                  <div
                    key={`${i}-${line.text.slice(0, 12)}`}
                    className={cn(
                      "rounded-xl border px-3 py-2 text-sm",
                      line.role === "client"
                        ? "ml-8 border-teal-200 bg-teal-50"
                        : "mr-8 border-amber-200 bg-amber-50"
                    )}
                  >
                    {line.text}
                  </div>
                ))
              )}
            </div>
          ) : null}

          <textarea
            className="textarea w-full text-sm"
            rows={tab === "C1_LIVE_CHAT" ? 3 : 5}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={t("cs.portal.messagePh", locale)}
            data-testid="cs-portal-message"
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="btn btn-primary !min-h-11"
              disabled={busy || !message.trim()}
              data-testid="cs-portal-submit"
              onClick={() => void (tab === "C1_LIVE_CHAT" ? sendC1() : submitFormOrMail())}
            >
              <Headphones size={16} />
              {tab === "C1_LIVE_CHAT" ? t("cs.portal.sendChat", locale) : t("cs.portal.submit", locale)}
            </button>
            {c1Ref && tab === "C1_LIVE_CHAT" ? (
              <span className="text-xs text-[var(--muted)] self-center font-mono">
                {zh ? "同一個 C1 對話" : "Same C1 thread"} · {c1Ref}
              </span>
            ) : null}
          </div>
        </section>

        {result?.public ? (
          <section className="panel p-4 sm:p-5 mt-4 space-y-2" data-testid="cs-portal-result">
            <div className="flex flex-wrap gap-2 items-center">
              <Badge className="bg-teal-50 text-teal-900 border-teal-200 font-mono">{result.public.request_id}</Badge>
              <StatusBadge value={result.public.status} />
              {result.public.skill_code ? (
                <Badge className="bg-slate-100 text-slate-700 border-slate-200 font-mono text-[11px]">
                  {result.public.skill_code.replace(/^SKILL-/, "")}
                </Badge>
              ) : null}
              {result.continued ? (
                <Badge className="bg-amber-50 text-amber-900 border-amber-200">
                  {t("cs.portal.continued", locale)}
                </Badge>
              ) : null}
            </div>
            <p className="text-sm">{t("cs.portal.resultHint", locale)}</p>
            {result.auto_email ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm">
                <div className="font-semibold">{t("cs.portal.waitingMail", locale)}</div>
                <p className="mt-1">{result.auto_email.subject}</p>
                <p className="text-xs text-[var(--muted)] mt-1">
                  {zh ? "寄至" : "To"} {result.auto_email.to} · {result.auto_email.reason}
                </p>
              </div>
            ) : null}
          </section>
        ) : null}

        {statusMsg ? (
          <div className="mt-3 text-sm bg-teal-50 border border-teal-200 text-teal-900 rounded-lg px-3 py-2">
            {statusMsg}
          </div>
        ) : null}

        <p className="mt-6 text-xs text-[var(--muted)]">
          POST /api/cs/intake · {t("cs.portal.apiHint", locale)}{" "}
          <Link className="underline" href="/admin/cs-desk">
            {t("home.csDeskCta", locale)}
          </Link>
        </p>
      </main>
    </div>
  );
}

function extractTicket(text: string): string | null {
  const m = String(text || "")
    .toUpperCase()
    .match(/\bCSR-[0-9A-F]{6}\b/);
  return m ? m[0] : null;
}
