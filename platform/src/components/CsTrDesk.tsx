"use client";

import { useMemo, useState } from "react";
import { AdminLink } from "@/components/AdminLink";
import { Badge, StatusBadge } from "@/components/ui";
import { useUiLocale } from "@/hooks/useUiLocale";
import { phrase, t, type UiLocale } from "@/lib/i18n";
import { bumpNavBadge } from "@/lib/nav-badges";
import { Headphones, Send, TableProperties } from "lucide-react";
import type { CsOpsContract } from "@/lib/cs/ops-data";

type RequestRow = {
  id: number;
  request_id: string;
  channel: string;
  desk: string;
  category: string;
  client_name: string;
  client_email: string;
  client_uid: string | null;
  subject: string;
  status: string;
  ai_clarity: string;
  followup_count: number;
  assigned_to: string | null;
  assigned_bu: string | null;
  skill_code: string | null;
  updated_at: string;
};

type Msg = {
  id: number;
  msg_id: string;
  kind: string;
  sender: string;
  body: string;
  created_at: string;
};

type Follow = {
  id: number;
  email_to: string;
  subject: string;
  reason: string;
  status: string;
  sent_at: string;
  replied_at: string | null;
};

type Channel = { code: string; name: string; kind: string; description: string; enabled: number };

type Pack = { messages: Msg[]; followups: Follow[] };

function channelLabel(code: string, locale: UiLocale) {
  if (code === "C1_LIVE_CHAT") return locale === "zh-Hant" ? "C1 即時聊天" : "C1 live chat";
  if (code === "WEB_FORM") return locale === "zh-Hant" ? "提交表單" : "Submission form";
  if (code === "OFFICIAL_EMAIL") return locale === "zh-Hant" ? "官方信箱" : "Official email";
  return code;
}

function skillShort(code: string | null | undefined) {
  if (!code) return "";
  return code.replace(/^SKILL-/, "");
}

function clarityLabel(v: string, locale: UiLocale) {
  if (v === "need_id") return locale === "zh-Hant" ? "需核身" : "Need ID";
  if (v === "unclear") return locale === "zh-Hant" ? "不清楚" : "Unclear";
  return locale === "zh-Hant" ? "清楚" : "Clear";
}

export function CsTrDesk({
  initialRequests,
  initialChannels,
  initialCatalog,
  ops,
  staticMode = false,
  canOperate = false,
}: {
  initialRequests: RequestRow[];
  initialChannels: Channel[];
  initialCatalog: Record<number, Pack>;
  ops?: CsOpsContract;
  staticMode?: boolean;
  canOperate?: boolean;
}) {
  const { locale } = useUiLocale();
  const zh = locale === "zh-Hant";
  const [requests, setRequests] = useState(initialRequests);
  const [catalog, setCatalog] = useState(initialCatalog);
  const [activeId, setActiveId] = useState<number | null>(initialRequests[0]?.id ?? null);
  const [busy, setBusy] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [simBody, setSimBody] = useState("");
  const [deskFilter, setDeskFilter] = useState<"ALL" | "CS" | "TR">("ALL");

  const active = useMemo(() => requests.find((r) => r.id === activeId) || null, [requests, activeId]);
  const pack = activeId ? catalog[activeId] : undefined;
  const shown = requests.filter((r) => deskFilter === "ALL" || r.desk === deskFilter);

  async function run(action: string, extra: Record<string, unknown> = {}) {
    if (!canOperate && !staticMode) {
      setStatusMsg(t("cs.needOperate", locale));
      return;
    }
    setBusy(true);
    setStatusMsg(null);
    try {
      if (staticMode) {
        setStatusMsg(t("cs.staticNote", locale));
        return;
      }
      const res = await fetch("/api/cs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, request_id: activeId, ...extra }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatusMsg(data.error || t("msg.actionFailed", locale));
        return;
      }
      if (data.inbox?.requests) {
        setRequests(data.inbox.requests);
        setCatalog(data.inbox.catalog || catalog);
        if (data.request?.id) setActiveId(data.request.id);
      } else if (data.request) {
        setRequests((prev) => prev.map((r) => (r.id === data.request.id ? data.request : r)));
        setCatalog((prev) => ({
          ...prev,
          [data.request.id]: { messages: data.messages || [], followups: data.followups || [] },
        }));
      }
      setReply("");
      setSimBody("");
      setStatusMsg(t("msg.actionDone", locale, { action }));
      bumpNavBadge("/admin/cs-desk", 1);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      {ops ? (
        <div className="mb-3 flex flex-wrap items-center gap-2 text-xs" data-testid="cs-desk-ops">
          <AdminLink href="/admin/cs-data" className="btn !min-h-9 text-xs inline-flex items-center gap-1">
            <TableProperties className="h-3.5 w-3.5" aria-hidden />
            {t("cs.data.open", locale)}
          </AdminLink>
          <span className="rounded-full border border-[var(--line)] px-2 py-1">
            {t("cs.data.cap", locale)} {ops.params.followup_cap}
          </span>
          <span className="rounded-full border border-[var(--line)] px-2 py-1 font-mono">
            {ops.routes.map((r) => r.route_code).join(" · ")}
          </span>
          <span className="rounded-full border border-[var(--line)] px-2 py-1">{ops.teams.map((x) => x.name).join(" · ")}</span>
        </div>
      ) : null}
    <div className="grid lg:grid-cols-[minmax(240px,320px)_minmax(0,1fr)] gap-3 sm:gap-4">
      <section className="panel p-3 flex flex-col min-h-0">
        <div className="flex items-center gap-2 mb-2">
          <Headphones size={16} className="text-teal-800" />
          <h2 className="font-semibold text-sm">{t("cs.inbox", locale)}</h2>
        </div>
        <div className="flex flex-wrap gap-1 mb-2">
          {(["ALL", "CS", "TR"] as const).map((d) => (
            <button
              key={d}
              type="button"
              className={`btn !min-h-9 !px-2 text-xs ${deskFilter === d ? "btn-primary" : ""}`}
              onClick={() => setDeskFilter(d)}
            >
              {d === "ALL" ? (zh ? "全部" : "All") : d}
            </button>
          ))}
        </div>
        <div className="space-y-2 overflow-auto flex-1 min-h-[12rem]">
          {shown.map((row) => (
            <button
              key={row.id}
              type="button"
              onClick={() => setActiveId(row.id)}
              data-testid={`cs-req-${row.id}`}
              className={`w-full text-left rounded-xl border px-3 py-2.5 min-h-16 ${
                activeId === row.id ? "border-teal-400 bg-teal-50" : "border-[var(--line)] hover:bg-slate-50"
              }`}
            >
              <div className="flex flex-wrap gap-1.5 items-center">
                <Badge className="bg-slate-100 text-slate-700 border-slate-200">{row.desk}</Badge>
                <StatusBadge value={row.status} />
                <Badge className="bg-orange-50 text-orange-900 border-orange-200">{channelLabel(row.channel, locale)}</Badge>
                {row.skill_code ? (
                  <Badge className="bg-teal-50 text-teal-900 border-teal-200 font-mono text-[10px]">
                    {skillShort(row.skill_code)}
                  </Badge>
                ) : null}
              </div>
              <div className="mt-1 text-sm font-semibold line-clamp-2">{phrase(row.subject, locale)}</div>
              <div className="text-[11px] text-[var(--muted)] mt-0.5">
                {row.client_name} · {clarityLabel(row.ai_clarity, locale)}
              </div>
            </button>
          ))}
          {!shown.length ? <p className="text-sm text-[var(--muted)] p-2">{t("cs.empty", locale)}</p> : null}
        </div>
      </section>

      <section className="panel p-3 sm:p-4 flex flex-col min-h-0">
        {active ? (
          <>
            <div className="border-b border-[var(--line)] pb-2 mb-2">
              <div className="flex flex-wrap gap-1.5 items-center">
                <Badge className="bg-teal-50 text-teal-900 border-teal-200">{active.desk}</Badge>
                <StatusBadge value={active.status} />
                <Badge className="bg-slate-100 text-slate-700 border-slate-200">{channelLabel(active.channel, locale)}</Badge>
                <Badge className="bg-violet-50 text-violet-900 border-violet-200">
                  {clarityLabel(active.ai_clarity, locale)}
                </Badge>
                {active.skill_code ? (
                  <AdminLink
                    href={`/admin/skills/${encodeURIComponent(active.skill_code)}`}
                    className="inline-flex"
                  >
                    <Badge
                      data-testid="cs-skill-chip"
                      className="bg-teal-50 text-teal-900 border-teal-300 font-mono text-[11px] hover:bg-teal-100"
                    >
                      {t("cs.skill", locale)} {skillShort(active.skill_code)}
                    </Badge>
                  </AdminLink>
                ) : null}
                <span className="text-xs text-[var(--muted)] font-mono">{active.request_id}</span>
              </div>
              <h2 className="mt-2 font-[family-name:var(--font-display)] text-lg">{phrase(active.subject, locale)}</h2>
              <p className="text-xs text-[var(--muted)] mt-1">
                {active.client_name} · {active.client_email}
                {active.client_uid ? ` · UID ${active.client_uid}` : ""}
                {active.assigned_bu ? ` · ${t("cs.data.buChip", locale)} ${active.assigned_bu}` : ""}
                {active.assigned_to ? ` · ${active.assigned_to}` : ""}
              </p>
              <div className="mt-3 flex flex-wrap gap-2" data-testid="cs-actions">
                <button type="button" className="btn" disabled={busy} onClick={() => void run("triage")}>
                  {t("cs.triage", locale)}
                </button>
                <button type="button" className="btn" disabled={busy} onClick={() => void run("followup", { reason: "unclear" })}>
                  {t("cs.askMore", locale)}
                </button>
                <button
                  type="button"
                  className="btn"
                  disabled={busy}
                  onClick={() => void run("followup", { reason: "need_id" })}
                >
                  {t("cs.askId", locale)}
                </button>
                <button type="button" className="btn" disabled={busy} onClick={() => void run("assign_tr")}>
                  {t("cs.assignTr", locale)}
                </button>
                <button
                  type="button"
                  className="btn border-rose-300 bg-rose-50 text-rose-950"
                  disabled={busy}
                  onClick={() => void run("escalate_risk")}
                >
                  {t("cs.escalateRisk", locale)}
                </button>
                <button type="button" className="btn btn-primary" disabled={busy} onClick={() => void run("resolve")}>
                  {t("cs.resolve", locale)}
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto space-y-2 min-h-[12rem]">
              {(pack?.messages || []).map((m) => (
                <div
                  key={m.msg_id}
                  className={`rounded-xl border px-3 py-2 text-sm ${
                    m.kind === "EMAIL_OUT"
                      ? "border-amber-200 bg-amber-50/70"
                      : m.kind === "AI"
                        ? "border-teal-200 bg-teal-50/60"
                        : m.kind === "AGENT"
                          ? "ml-auto border-teal-200 bg-teal-50 max-w-[95%]"
                          : "border-[var(--line)] bg-white"
                  }`}
                >
                  <div className="flex flex-wrap gap-2 text-xs text-[var(--muted)]">
                    <Badge className="bg-slate-100 text-slate-700 border-slate-200">{m.kind}</Badge>
                    <span className="font-semibold text-[var(--ink)]">{m.sender}</span>
                    <span>{m.created_at}</span>
                  </div>
                  <pre className="mt-2 whitespace-pre-wrap font-sans text-sm">{phrase(m.body, locale)}</pre>
                </div>
              ))}
              {(pack?.followups || []).filter((f) => f.status === "WAITING").map((f) => (
                <div key={f.id} className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-sm">
                  <div className="font-semibold">{t("cs.waitingReply", locale)}</div>
                  <p className="text-[var(--muted)] mt-1">{phrase(f.subject, locale)}</p>
                  <p className="text-xs mt-1">
                    {zh ? "寄至" : "To"} {f.email_to} · {f.reason}
                  </p>
                  <button
                    type="button"
                    className="btn btn-primary mt-2"
                    disabled={busy}
                    onClick={() =>
                      void run("client_reply", {
                        text:
                          f.reason === "need_id"
                            ? "Here is my passport photo and UID last four 0088. Selfie attached."
                            : "Account UID 771902. I cannot log in since yesterday 22:00 UTC. Screenshot of the error is attached. Please reset KYC.",
                      })
                    }
                  >
                    {t("cs.simulateReply", locale)}
                  </button>
                </div>
              ))}
            </div>

            <form
              className="mt-2 border-t border-[var(--line)] pt-2 flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (!reply.trim()) return;
                void run("reply", { text: reply.trim() });
              }}
            >
              <input
                className="input flex-1 !rounded-xl !min-h-11"
                placeholder={t("cs.replyPh", locale)}
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                disabled={busy}
              />
              <button type="submit" className="btn btn-primary !min-h-11" disabled={busy || !reply.trim()}>
                <Send size={16} />
              </button>
            </form>
          </>
        ) : (
          <p className="text-sm text-[var(--muted)] p-2">{t("cs.select", locale)}</p>
        )}

        <div className="mt-3 border-t border-[var(--line)] pt-3 space-y-2">
          <div className="text-[10px] uppercase tracking-[0.12em] text-[var(--muted)]">{t("cs.simulate", locale)}</div>
          <p className="text-[11px] text-[var(--muted)]">{t("cs.simulateHint", locale)}</p>
          <textarea
            className="textarea text-sm"
            rows={2}
            value={simBody}
            onChange={(e) => setSimBody(e.target.value)}
            placeholder={t("cs.simPh", locale)}
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="btn"
              disabled={busy}
              data-testid="cs-sim-c1"
              onClick={() => void run("simulate_c1", { body: simBody || undefined, subject: "C1 live chat" })}
            >
              {t("cs.simC1", locale)}
            </button>
            <button
              type="button"
              className="btn"
              disabled={busy}
              onClick={() => void run("simulate_form", { body: simBody || undefined, subject: "Web form" })}
            >
              {t("cs.simForm", locale)}
            </button>
            <button
              type="button"
              className="btn"
              disabled={busy}
              onClick={() => void run("simulate_email", { body: simBody || undefined, subject: "Official email" })}
            >
              {t("cs.simEmail", locale)}
            </button>
          </div>
          <div className="text-[11px] text-[var(--muted)] flex flex-wrap gap-3 items-center">
            POST /api/cs/intake · header x-cs-intake-token: demo-c1
            <a className="underline text-teal-800" href="/cs">
              {t("cs.portalLink", locale)}
            </a>
          </div>
        </div>
        {statusMsg ? (
          <div className="mt-2 text-xs bg-teal-50 border border-teal-200 text-teal-900 rounded-lg px-3 py-2">{statusMsg}</div>
        ) : null}
      </section>
    </div>
    </div>
  );
}
