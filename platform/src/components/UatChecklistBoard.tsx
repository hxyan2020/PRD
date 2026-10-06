"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge, SeverityBadge } from "@/components/ui";
import {
  CS_TR_UAT_CATALOGUE,
  UAT_CASES,
  isCsTrUatCase,
  uatCoverage,
  uatCsTrSummary,
  uatSummary,
  type UatCopy,
  type UatSeverity,
} from "@/lib/docs/uat-cases";
import { fetchDocOverlay, resetDocOverlay, saveDocOverlay } from "@/lib/docs/edit-client";
import { isPublicSnapshot } from "@/lib/static-export";
import { DocEditBar } from "@/components/DocEditBar";

type UatPatch = {
  bu?: string;
  dependency?: string;
  en?: Partial<UatCopy>;
  zh?: Partial<UatCopy>;
};
  type UatFilter = "ALL" | "CS_TR" | UatSeverity;

function sevClass(s: UatSeverity) {
  if (s === "Critical") return "bg-rose-50 text-rose-900 border-rose-200";
  if (s === "High") return "bg-orange-50 text-orange-900 border-orange-200";
  if (s === "Medium") return "bg-amber-50 text-amber-900 border-amber-200";
  return "bg-slate-100 text-slate-700 border-slate-200";
}

function formatClock(min: number) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `T+${h}:${String(m).padStart(2, "0")}`;
}

function mergeCopy(base: UatCopy, patch?: Partial<UatCopy>): UatCopy {
  if (!patch) return base;
  return {
    title: patch.title ?? base.title,
    why: patch.why ?? base.why,
    objective: patch.objective ?? base.objective,
    steps: patch.steps ?? base.steps,
    pass: patch.pass ?? base.pass,
    evidence: patch.evidence ?? base.evidence,
  };
}

function parseOverlay(raw: string | null): UatOverlay {
  if (!raw) return {};
  try {
    const v = JSON.parse(raw) as UatOverlay;
    return v && typeof v === "object" ? v : {};
  } catch {
    return {};
  }
}

export function UatChecklistBoard({ lang }: { lang: "en" | "zh-Hant" }) {
  const zh = lang === "zh-Hant";
  const summary = uatSummary();
  const [filter, setFilter] = useState<UatFilter>("ALL");
  const csTr = uatCsTrSummary();
  const [openId, setOpenId] = useState<string | null>(UAT_CASES[0]?.id ?? null);
  const [results, setResults] = useState<Record<string, "PASS" | "FAIL" | "WAIVE" | "">>({});
  const [overlay, setOverlay] = useState<UatOverlay>({});
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<UatOverlay>({});
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const localOnly = isPublicSnapshot();

  useEffect(() => {
    let live = true;
    fetchDocOverlay("UAT", "overlay").then((raw) => {
      if (!live) return;
      const next = parseOverlay(raw);
      setOverlay(next);
      setDraft(next);
    });
    return () => {
      live = false;
    };
  }, []);

  const cases = useMemo(() => {
    const source = editing ? draft : overlay;
    const merged = UAT_CASES.map((c) => {
      const p = source[c.id];
      if (!p) return c;
      return {
        ...c,
        bu: p.bu ?? c.bu,
        dependency: p.dependency ?? c.dependency,
        en: mergeCopy(c.en, p.en),
        zh: mergeCopy(c.zh, p.zh),
      };
    });
    if (filter === "ALL") return merged;
    if (filter === "CS_TR") return merged.filter((c) => isCsTrUatCase(c));
    return merged.filter((c) => c.severity === filter);
  }, [filter, overlay, draft, editing]);

  const tallies = useMemo(() => {
    let pass = 0;
    let fail = 0;
    let waive = 0;
    for (const c of UAT_CASES) {
      const r = results[c.id];
      if (r === "PASS") pass += 1;
      else if (r === "FAIL") fail += 1;
      else if (r === "WAIVE") waive += 1;
    }
    return { pass, fail, waive, unset: UAT_CASES.length - pass - fail - waive };
  }, [results]);

  function patchCase(id: string, field: keyof UatCopy | "bu" | "dependency", value: string | string[]) {
    setDraft((prev) => {
      const cur = prev[id] ? { ...prev[id] } : {};
      if (field === "bu" || field === "dependency") {
        cur[field] = String(value);
      } else {
        const loc = zh ? { ...(cur.zh || {}) } : { ...(cur.en || {}) };
        (loc as Record<string, unknown>)[field] = value;
        if (zh) cur.zh = loc;
        else cur.en = loc;
      }
      return { ...prev, [id]: cur };
    });
  }

  async function save() {
    setBusy(true);
    const body = JSON.stringify(draft);
    const result = await saveDocOverlay("UAT", "overlay", body);
    setBusy(false);
    if (!result.ok) {
      setMsg(result.error || (zh ? "儲存失敗" : "Save failed"));
      return;
    }
    setOverlay(draft);
    setEditing(false);
    setMsg(result.localOnly ? (zh ? "已儲存在這個瀏覽器" : "Saved in this browser") : zh ? "已儲存" : "Saved");
  }

  async function reset() {
    if (!window.confirm(zh ? "還原全部 UAT 文案為種子稿？" : "Reset all UAT copy to the seed draft?")) return;
    setBusy(true);
    await resetDocOverlay("UAT", "overlay");
    setBusy(false);
    setOverlay({});
    setDraft({});
    setEditing(false);
    setMsg(zh ? "已還原種子稿" : "Restored seed draft");
  }

  return (
    <div className="space-y-4">
      <div className="panel p-3 sm:p-4">
        <DocEditBar
          zh={zh}
          editing={editing}
          busy={busy}
          dirty={editing && JSON.stringify(draft) !== JSON.stringify(overlay)}
          localOnly={localOnly}
          message={msg}
          onEdit={() => {
            setDraft(overlay);
            setEditing(true);
            setMsg(null);
          }}
          onCancel={() => {
            setDraft(overlay);
            setEditing(false);
          }}
          onSave={() => void save()}
          onReset={() => void reset()}
        />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        <div className="panel p-3">
          <div className="text-[10px] uppercase text-[var(--muted)]">{zh ? "案例數" : "Cases"}</div>
          <div className="font-semibold text-lg tabular-nums">{summary.count}</div>
        </div>
        <div className="panel p-3">
          <div className="text-[10px] uppercase text-[var(--muted)]">{zh ? "建議時窗" : "Suggested window"}</div>
          <div className="font-semibold text-lg tabular-nums">~{Math.ceil(summary.windowEndMin / 60)}h</div>
        </div>
        <div className="panel p-3">
          <div className="text-[10px] uppercase text-[var(--muted)]">{zh ? "危急／高" : "Critical / High"}</div>
          <div className="font-semibold text-lg tabular-nums">
            {summary.bySev.Critical} / {summary.bySev.High}
          </div>
        </div>
        <div className="panel p-3">
          <div className="text-[10px] uppercase text-[var(--muted)]">{zh ? "本機記錄" : "Local tally"}</div>
          <div className="text-sm mt-1 break-word">
            PASS {tallies.pass} · FAIL {tallies.fail} · WAIVE {tallies.waive} · — {tallies.unset}
          </div>
        </div>
      </div>

      <div className="panel p-3 sm:p-4">
        <p className="text-sm text-[var(--muted)]">
          {zh
            ? "請依序執行。這是風險負責人帶著證據走完整張管理桌與 Lark 風格 Messenger 的白話劇本，不是開發自測。Critical 前置未通過前勿跳號。退出：Critical 全過；High 豁免≤2 且需書面接受。CS／TR 目錄篩出大門、等待迴圈、儀表板、日誌與配套資料。"
            : "Execute in sequence. This is the Risk Owner script for the whole admin desk and the Lark-style messenger — written in plain English, not a developer smoke test. Do not skip ahead of failed Critical predecessors. Exit: all Critical Pass; ≤2 High waivers with written acceptance. The CS/TR filter isolates the door, wait loop, dashboard, log and supporting data."}
        </p>
        <div className="mt-3 action-row">
          {(["ALL", "CS_TR", "Critical", "High", "Medium", "Low"] as const).map((f) => (
            <button
              key={f}
              type="button"
              className={`btn text-xs ${filter === f ? "btn-primary" : ""}`}
              onClick={() => setFilter(f)}
            >
              {f === "ALL" ? (zh ? "全部" : "All") : f === "CS_TR" ? (zh ? "CS／TR" : "CS/TR") : f}
            </button>
          ))}
        </div>
      </div>

      <section className="panel p-3 sm:p-4" data-testid="uat-cs-catalogue">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
          <div>
            <h3 className="font-semibold">{zh ? "CS／TR 功能目錄" : "CS/TR feature catalogue"}</h3>
            <p className="mt-1 text-xs text-[var(--muted)]">
              {zh
                ? `主案 ${csTr.primary} · 支援 ${csTr.support} · 共 ${csTr.total}。點列跳到該案。這份目錄對應大門、劇本、儀表板、日誌與配套資料，不是再加一堆編號。`
                : `Primary ${csTr.primary} · support ${csTr.support} · ${csTr.total} total. Click a row to jump to that case. This is the feature catalogue for the door, playbooks, dashboard, log and supporting data — not extra numbered cases.`}
            </p>
          </div>
          <Badge className="bg-teal-50 text-teal-900 border-teal-200">v2.7</Badge>
        </div>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-xs min-w-[36rem]">
            <thead>
              <tr className="text-left text-[var(--muted)] border-b border-[var(--line)]">
                <th className="py-1.5 pr-2 font-medium">{zh ? "案號" : "Case"}</th>
                <th className="py-1.5 pr-2 font-medium">{zh ? "種類" : "Kind"}</th>
                <th className="py-1.5 pr-2 font-medium">{zh ? "功能" : "Feature"}</th>
                <th className="py-1.5 pr-2 font-medium">{zh ? "畫面" : "Screens"}</th>
                <th className="py-1.5 font-medium">FR</th>
              </tr>
            </thead>
            <tbody>
              {CS_TR_UAT_CATALOGUE.map((row) => (
                <tr key={row.id} className="border-b border-[var(--line)] last:border-0">
                  <td className="py-1.5 pr-2 align-top">
                    <button
                      type="button"
                      className="font-mono text-teal-800 underline-offset-2 hover:underline"
                      onClick={() => {
                        setFilter("CS_TR");
                        setOpenId(row.id);
                        requestAnimationFrame(() =>
                          document.getElementById(row.id)?.scrollIntoView({ behavior: "smooth", block: "start" })
                        );
                      }}
                    >
                      {row.id}
                    </button>
                  </td>
                  <td className="py-1.5 pr-2 align-top">
                    <Badge
                      className={
                        row.kind === "primary"
                          ? "bg-teal-50 text-teal-900 border-teal-200"
                          : "bg-slate-100 text-slate-700 border-slate-200"
                      }
                    >
                      {row.kind === "primary" ? (zh ? "主案" : "primary") : zh ? "支援" : "support"}
                    </Badge>
                  </td>
                  <td className="py-1.5 pr-2 align-top break-word">{zh ? row.featureZh : row.featureEn}</td>
                  <td className="py-1.5 pr-2 align-top text-[var(--muted)] break-word">
                    {zh ? row.screensZh : row.screensEn}
                  </td>
                  <td className="py-1.5 align-top font-mono">{row.fr}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="space-y-3">
        {cases.map((c) => {
          const copy = zh ? c.zh : c.en;
          const open = openId === c.id;
          const result = results[c.id] || "";
          return (
            <article key={c.id} id={c.id} className="panel p-3 sm:p-4 min-w-0 scroll-mt-20">
              <button
                type="button"
                className="w-full text-left"
                onClick={() => setOpenId(open ? null : c.id)}
                aria-expanded={open}
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex flex-wrap gap-1.5 items-center">
                      <Badge className="bg-slate-100 text-slate-700 border-slate-200">
                        #{String(c.seq).padStart(2, "0")}
                      </Badge>
                      <Badge className="bg-orange-50 text-orange-900 border-orange-200">{c.id}</Badge>
                      <Badge className={sevClass(c.severity)}>{c.severity}</Badge>
                      <Badge className="bg-teal-50 text-teal-900 border-teal-200">
                        {formatClock(c.t_start_min)} · {c.duration_min}m
                      </Badge>
                      {isCsTrUatCase(c) ? (
                        <Badge className="bg-cyan-50 text-cyan-900 border-cyan-200">CS/TR</Badge>
                      ) : null}
                      {result ? (
                        <Badge
                          className={
                            result === "PASS"
                              ? "bg-emerald-50 text-emerald-900 border-emerald-200"
                              : result === "FAIL"
                                ? "bg-rose-50 text-rose-900 border-rose-200"
                                : "bg-amber-50 text-amber-900 border-amber-200"
                          }
                        >
                          {result}
                        </Badge>
                      ) : null}
                    </div>
                    <h2 className="mt-2 font-semibold text-base sm:text-lg break-word">{copy.title}</h2>
                    <p className="text-sm text-[var(--muted)] mt-1 break-word">{copy.objective}</p>
                    <div className="text-xs text-[var(--muted)] mt-2 break-word">
                      <strong>{zh ? "負責 BU" : "BU"}:</strong> {c.bu}
                      {" · "}
                      <strong>{zh ? "依賴" : "Depends"}:</strong> {c.dependency}
                      {" · "}
                      <strong>{zh ? "涵蓋" : "Covers"}:</strong> {c.covers.join(" · ")}
                    </div>
                  </div>
                  <span className="text-xs text-[var(--muted)] shrink-0">
                    {open ? (zh ? "收合" : "Collapse") : zh ? "展開步驟" : "Expand steps"}
                  </span>
                </div>
              </button>

              {open && (
                <div className="mt-4 border-t border-[var(--line)] pt-3 space-y-3">
                  {editing ? (
                    <div className="space-y-3 text-sm">
                      <label className="block">
                        <span className="text-xs uppercase text-[var(--muted)]">{zh ? "標題" : "Title"}</span>
                        <input
                          className="input mt-1 w-full"
                          value={copy.title}
                          onChange={(e) => patchCase(c.id, "title", e.target.value)}
                        />
                      </label>
                      <label className="block">
                        <span className="text-xs uppercase text-[var(--muted)]">{zh ? "目標" : "Objective"}</span>
                        <textarea
                          className="input mt-1 w-full min-h-20"
                          value={copy.objective}
                          onChange={(e) => patchCase(c.id, "objective", e.target.value)}
                        />
                      </label>
                      <div className="grid sm:grid-cols-2 gap-3">
                        <label className="block">
                          <span className="text-xs uppercase text-[var(--muted)]">BU</span>
                          <input
                            className="input mt-1 w-full"
                            value={c.bu}
                            onChange={(e) => patchCase(c.id, "bu", e.target.value)}
                          />
                        </label>
                        <label className="block">
                          <span className="text-xs uppercase text-[var(--muted)]">{zh ? "依賴" : "Depends"}</span>
                          <input
                            className="input mt-1 w-full"
                            value={c.dependency}
                            onChange={(e) => patchCase(c.id, "dependency", e.target.value)}
                          />
                        </label>
                      </div>
                      <label className="block">
                        <span className="text-xs uppercase text-[var(--muted)]">{zh ? "為何要測" : "Why this test"}</span>
                        <textarea
                          className="input mt-1 w-full min-h-20"
                          value={copy.why}
                          onChange={(e) => patchCase(c.id, "why", e.target.value)}
                        />
                      </label>
                      <label className="block">
                        <span className="text-xs uppercase text-[var(--muted)]">
                          {zh ? "步驟（一行一步）" : "Steps (one per line)"}
                        </span>
                        <textarea
                          className="input mt-1 w-full min-h-36"
                          value={copy.steps.join("\n")}
                          onChange={(e) => patchCase(c.id, "steps", e.target.value.split("\n"))}
                        />
                      </label>
                      <div className="grid md:grid-cols-2 gap-3">
                        <label className="block">
                          <span className="text-xs uppercase text-[var(--muted)]">{zh ? "通過標準" : "Pass threshold"}</span>
                          <textarea
                            className="input mt-1 w-full min-h-20"
                            value={copy.pass}
                            onChange={(e) => patchCase(c.id, "pass", e.target.value)}
                          />
                        </label>
                        <label className="block">
                          <span className="text-xs uppercase text-[var(--muted)]">{zh ? "應留證據" : "Evidence"}</span>
                          <textarea
                            className="input mt-1 w-full min-h-20"
                            value={copy.evidence}
                            onChange={(e) => patchCase(c.id, "evidence", e.target.value)}
                          />
                        </label>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="rounded-xl border border-teal-200 bg-teal-50/60 p-3 text-sm">
                        <div className="text-xs uppercase text-teal-800">{zh ? "為何要測" : "Why this test"}</div>
                        <p className="mt-1 break-word">{copy.why}</p>
                      </div>
                      <div>
                        <div className="text-xs uppercase text-[var(--muted)]">{zh ? "逐步步驟" : "Step by step"}</div>
                        <ol className="mt-2 list-decimal pl-5 space-y-1.5 text-sm">
                          {copy.steps.map((s, i) => (
                            <li key={i} className="break-word">
                              {s}
                            </li>
                          ))}
                        </ol>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <div className="rounded-xl border border-[var(--line)] p-3">
                          <div className="text-xs uppercase text-[var(--muted)]">{zh ? "通過標準" : "Pass threshold"}</div>
                          <p className="mt-1 break-word">{copy.pass}</p>
                        </div>
                        <div className="rounded-xl border border-[var(--line)] p-3">
                          <div className="text-xs uppercase text-[var(--muted)]">{zh ? "應留證據" : "Evidence to keep"}</div>
                          <p className="mt-1 break-word">{copy.evidence}</p>
                        </div>
                      </div>
                    </>
                  )}
                  <div className="action-row">
                    {(["PASS", "FAIL", "WAIVE", ""] as const).map((r) => (
                      <button
                        key={r || "clear"}
                        type="button"
                        className={`btn text-xs ${result === r && r ? "btn-primary" : ""}`}
                        onClick={() => setResults((prev) => ({ ...prev, [c.id]: r }))}
                      >
                        {r === "" ? (zh ? "清除" : "Clear") : r}
                      </button>
                    ))}
                  </div>
                  <div className="text-xs text-[var(--muted)]">
                    {zh
                      ? "結果僅存於此瀏覽器工作階段，方便現場勾選；正式簽核請記入稽核備註。"
                      : "Tally is session-local for live execution; formal sign-off belongs in Audit notes."}
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </div>

      <section className="panel p-3 sm:p-4 text-sm">
        <h3 className="font-semibold">{zh ? "畫面涵蓋" : "Screen coverage"}</h3>
        <p className="mt-1 text-xs text-[var(--muted)]">
          {zh
            ? "每個管理頁與 Messenger 主要動作都應對得到至少一案。若你新加了功能，請補案。"
            : "Every admin page and the main messenger actions map to at least one case. If you add a feature, add a case."}
        </p>
        <div className="mt-3 grid sm:grid-cols-2 gap-2">
          {uatCoverage().map((row) => (
            <div key={row.screen} className="rounded-lg border border-[var(--line)] px-3 py-2 text-xs">
              <div className="font-semibold text-[var(--ink)]">{row.screen}</div>
              <div className="text-[var(--muted)] mt-0.5 break-word">{row.ids.join(", ")}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="panel p-3 sm:p-4 text-sm">
        <h3 className="font-semibold">{zh ? "退出標準" : "Exit criteria"}</h3>
        <ul className="mt-2 list-disc pl-5 space-y-1 text-[var(--muted)]">
          <li>{zh ? "所有 Critical 必須 Pass。" : "All Critical cases must Pass."}</li>
          <li>
            {zh
              ? "High 未通過不超過 2 項，且須風險負責人書面風險接受（WAIVE）。"
              : "At most 2 High cases deferred, each with written Risk Owner acceptance (WAIVE)."}
          </li>
          <li>
            {zh
              ? "UAT 視窗內 BREACH／CRITICAL 樣本 100% 附第二 AI（UAT-19）。"
              : "100% of BREACH/CRITICAL samples in the window have second AI (UAT-19)."}
          </li>
          <li>
            {zh
              ? "CS／TR 主案（UAT-25、46、47、48、50、51、52）必須 Pass；支援案（17／22／27–29／36–40）須證明新畫面仍被點到。"
              : "CS/TR primary cases (UAT-25, 46, 47, 48, 50, 51, 52) must Pass; support cases (17 / 22 / 27–29 / 36–40) must still hit the new surfaces."}
          </li>
          <li>
            {zh
              ? `${summary.lastId} 簽核完成（ACCEPT／ACCEPT WITH WAIVERS／REJECT）。`
              : `${summary.lastId} sign-off completed (ACCEPT / ACCEPT WITH WAIVERS / REJECT).`}
          </li>
        </ul>
        <div className="mt-3 flex flex-wrap gap-2">
          <SeverityBadge value="CRITICAL" />
          <span className="text-xs text-[var(--muted)]">
            {zh ? "對應案例嚴重度 Critical" : "Maps to case severity Critical"}
          </span>
        </div>
      </section>
    </div>
  );
}
