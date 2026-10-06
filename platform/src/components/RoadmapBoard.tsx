"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui";
import { useUiLocale } from "@/hooks/useUiLocale";
import {
  ROADMAP_ITEMS,
  ROADMAP_PHASES,
  roadmapSummary,
  type RoadmapCopy,
  type RoadmapItem,
  type RoadmapPhase,
  type RoadmapSeverity,
} from "@/lib/docs/roadmap-items";
import { fetchDocOverlay, resetDocOverlay, saveDocOverlay } from "@/lib/docs/edit-client";
import { isPublicSnapshot } from "@/lib/static-export";
import { DocEditBar } from "@/components/DocEditBar";

function sevClass(s: RoadmapSeverity) {
  if (s === "Critical") return "bg-rose-50 text-rose-900 border-rose-200";
  if (s === "High") return "bg-orange-50 text-orange-900 border-orange-200";
  return "bg-amber-50 text-amber-900 border-amber-200";
}

function effortClass(e: RoadmapItem["effort"]) {
  if (e === "XL" || e === "L") return "bg-slate-800 text-white border-slate-800";
  if (e === "M") return "bg-slate-200 text-slate-800 border-slate-300";
  return "bg-slate-100 text-slate-700 border-slate-200";
}

type RoadmapPatch = {
  peopleEn?: string;
  peopleZh?: string;
  dependsEn?: string;
  dependsZh?: string;
  en?: Partial<RoadmapCopy>;
  zh?: Partial<RoadmapCopy>;
};
type RoadmapOverlay = Record<string, RoadmapPatch>;

function mergeCopy(base: RoadmapCopy, patch?: Partial<RoadmapCopy>): RoadmapCopy {
  if (!patch) return base;
  return {
    title: patch.title ?? base.title,
    operatorGets: patch.operatorGets ?? base.operatorGets,
    why: patch.why ?? base.why,
    today: patch.today ?? base.today,
    todayFacts: patch.todayFacts ?? base.todayFacts,
    build: patch.build ?? base.build,
    doneWhen: patch.doneWhen ?? base.doneWhen,
    skipRisk: patch.skipRisk ?? base.skipRisk,
  };
}

function parseOverlay(raw: string | null): RoadmapOverlay {
  if (!raw) return {};
  try {
    const v = JSON.parse(raw) as RoadmapOverlay;
    return v && typeof v === "object" ? v : {};
  } catch {
    return {};
  }
}

export function RoadmapBoard() {
  const { locale } = useUiLocale();
  const zh = locale === "zh-Hant";
  const summary = roadmapSummary();
  const [sevFilter, setSevFilter] = useState<"ALL" | RoadmapSeverity>("ALL");
  const [phaseFilter, setPhaseFilter] = useState<"ALL" | RoadmapPhase>("ALL");
  const [openId, setOpenId] = useState<string | null>(ROADMAP_ITEMS[0]?.id ?? null);
  const [overlay, setOverlay] = useState<RoadmapOverlay>({});
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<RoadmapOverlay>({});
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const localOnly = isPublicSnapshot();

  useEffect(() => {
    let live = true;
    fetchDocOverlay("ROADMAP", "overlay").then((raw) => {
      if (!live) return;
      const next = parseOverlay(raw);
      setOverlay(next);
      setDraft(next);
    });
    return () => {
      live = false;
    };
  }, []);

  const items = useMemo(() => {
    const source = editing ? draft : overlay;
    return ROADMAP_ITEMS.map((item) => {
      const p = source[item.id];
      if (!p) return item;
      return {
        ...item,
        peopleEn: p.peopleEn ?? item.peopleEn,
        peopleZh: p.peopleZh ?? item.peopleZh,
        dependsEn: p.dependsEn ?? item.dependsEn,
        dependsZh: p.dependsZh ?? item.dependsZh,
        en: mergeCopy(item.en, p.en),
        zh: mergeCopy(item.zh, p.zh),
      };
    }).filter((item) => {
      if (sevFilter !== "ALL" && item.severity !== sevFilter) return false;
      if (phaseFilter !== "ALL" && item.phase !== phaseFilter) return false;
      return true;
    });
  }, [sevFilter, phaseFilter, overlay, draft, editing]);

  function patchItem(id: string, field: keyof RoadmapCopy | "people" | "depends", value: string | string[]) {
    setDraft((prev) => {
      const cur = prev[id] ? { ...prev[id] } : {};
      if (field === "people") {
        if (zh) cur.peopleZh = String(value);
        else cur.peopleEn = String(value);
      } else if (field === "depends") {
        if (zh) cur.dependsZh = String(value);
        else cur.dependsEn = String(value);
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
    const result = await saveDocOverlay("ROADMAP", "overlay", JSON.stringify(draft));
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
    if (!window.confirm(zh ? "還原全部路線圖文案為種子稿？" : "Reset all roadmap copy to the seed draft?")) return;
    setBusy(true);
    await resetDocOverlay("ROADMAP", "overlay");
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
          <div className="text-[10px] uppercase text-[var(--muted)]">{zh ? "項目" : "Items"}</div>
          <div className="font-semibold text-lg tabular-nums">{summary.count}</div>
        </div>
        <div className="panel p-3">
          <div className="text-[10px] uppercase text-[var(--muted)]">{zh ? "危急／高" : "Critical / High"}</div>
          <div className="font-semibold text-lg tabular-nums">
            {summary.bySev.Critical} / {summary.bySev.High}
          </div>
        </div>
        <div className="panel p-3">
          <div className="text-[10px] uppercase text-[var(--muted)]">{zh ? "工期" : "Effort mix"}</div>
          <div className="text-sm mt-1 tabular-nums">
            S {summary.byEffort.S} · M {summary.byEffort.M} · L {summary.byEffort.L} · XL {summary.byEffort.XL}
          </div>
        </div>
        <div className="panel p-3">
          <div className="text-[10px] uppercase text-[var(--muted)]">{zh ? "本輪 UAT 範圍外" : "Out of this UAT"}</div>
          <div className="font-semibold text-lg tabular-nums">{summary.outOfScope}</div>
          <div className="text-[11px] text-[var(--muted)] mt-0.5">RM-05 · RM-09</div>
        </div>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3 sm:p-4 text-sm">
        <div className="text-xs uppercase text-amber-900">{zh ? "本輪 UAT 不要當 Fail" : "Do not Fail this UAT window"}</div>
        <p className="mt-1 break-word">
          {zh
            ? "真實交易匯流排寫入（RM-09）、正式 IdP（RM-05）、以及取代 Monitor 2.0 本身，列後期工作。原型已能走通：Monitor 警報 → AI 根因 → 第二 AI → Messenger → Maker／Checker → 稽核。"
            : "Live trading-bus writes (RM-09), production IdP (RM-05), and replacing Monitor 2.0 itself are later work. This prototype already walks Monitor alarm → AI RCA → second AI → messenger → maker/checker → audit."}
        </p>
      </div>

      <section className="panel p-3 sm:p-4">
        <h2 className="font-semibold text-base">{zh ? "建議順序" : "Suggested sequencing"}</h2>
        <p className="text-xs text-[var(--muted)] mt-1">
          {zh
            ? "規則：在 B 階段誤報與挑戰者 DISAGREE 流程被接受前，不要打開 RM-09 寫入適配。"
            : "Rule: do not enable RM-09 write adapters until Phase-B false alarms and challenger DISAGREE handling are accepted."}
        </p>
        <ol className="mt-3 space-y-2">
          {ROADMAP_PHASES.map((phase) => (
            <li key={phase.id}>
              <button
                type="button"
                className={`w-full text-left rounded-lg border px-3 py-2 text-sm ${
                  phaseFilter === phase.id ? "border-teal-300 bg-teal-50/70" : "border-[var(--line)]"
                }`}
                onClick={() => setPhaseFilter(phaseFilter === phase.id ? "ALL" : phase.id)}
              >
                <span className="font-semibold tabular-nums mr-2">{phase.order}.</span>
                {zh ? phase.zh : phase.en}
                <span className="block sm:inline sm:ml-2 text-xs text-[var(--muted)]">{phase.ids.join(" · ")}</span>
              </button>
            </li>
          ))}
        </ol>
      </section>

      <div className="panel p-3 sm:p-4">
        <p className="text-sm text-[var(--muted)]">
          {zh
            ? "展開每一項可看到：今日原型（含檔案／API）、要做什麼、完成標準、不做的風險。不是一句口號。"
            : "Expand each item for today’s prototype (files / APIs), what to build, done-when, and skip risk — not a one-line slogan."}
        </p>
        <div className="mt-3 action-row">
          {(["ALL", "Critical", "High", "Medium"] as const).map((f) => (
            <button
              key={f}
              type="button"
              className={`btn text-xs ${sevFilter === f ? "btn-primary" : ""}`}
              onClick={() => setSevFilter(f)}
            >
              {f === "ALL" ? (zh ? "全部嚴重度" : "All severity") : f}
            </button>
          ))}
          {phaseFilter !== "ALL" ? (
            <button type="button" className="btn text-xs" onClick={() => setPhaseFilter("ALL")}>
              {zh ? "清除階段篩選" : "Clear phase filter"}
            </button>
          ) : null}
        </div>
      </div>

      <div className="space-y-3">
        {items.map((item) => {
          const copy = zh ? item.zh : item.en;
          const open = openId === item.id;
          return (
            <article key={item.id} id={item.id.toLowerCase()} className="panel p-3 sm:p-4 min-w-0">
              <button
                type="button"
                className="w-full text-left"
                onClick={() => setOpenId(open ? null : item.id)}
                aria-expanded={open}
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex flex-wrap gap-1.5 items-center">
                      <Badge className="bg-teal-50 text-teal-900 border-teal-200">{item.id}</Badge>
                      <Badge className={sevClass(item.severity)}>{item.severity}</Badge>
                      <Badge className={effortClass(item.effort)}>
                        {zh ? "工期" : "Effort"} {item.effort}
                      </Badge>
                      {item.uatOutOfScope ? (
                        <Badge className="bg-amber-50 text-amber-900 border-amber-200">
                          {zh ? "UAT 範圍外" : "UAT out of scope"}
                        </Badge>
                      ) : null}
                    </div>
                    <h2 className="mt-2 font-semibold text-base sm:text-lg break-word">{copy.title}</h2>
                    <p className="text-sm text-[var(--muted)] mt-1 break-word">{copy.operatorGets}</p>
                    <div className="text-xs text-[var(--muted)] mt-2 break-word">
                      <strong>{zh ? "人力" : "People"}:</strong> {zh ? item.peopleZh : item.peopleEn}
                      {" · "}
                      <strong>{zh ? "依賴" : "Depends"}:</strong> {zh ? item.dependsZh : item.dependsEn}
                    </div>
                  </div>
                  <span className="text-xs text-[var(--muted)] shrink-0">
                    {open ? (zh ? "收合" : "Collapse") : zh ? "展開細節" : "Expand detail"}
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
                          onChange={(e) => patchItem(item.id, "title", e.target.value)}
                        />
                      </label>
                      <label className="block">
                        <span className="text-xs uppercase text-[var(--muted)]">{zh ? "值班得到什麼" : "Operator gets"}</span>
                        <textarea
                          className="input mt-1 w-full min-h-20"
                          value={copy.operatorGets}
                          onChange={(e) => patchItem(item.id, "operatorGets", e.target.value)}
                        />
                      </label>
                      <div className="grid sm:grid-cols-2 gap-3">
                        <label className="block">
                          <span className="text-xs uppercase text-[var(--muted)]">{zh ? "人力" : "People"}</span>
                          <input
                            className="input mt-1 w-full"
                            value={zh ? item.peopleZh : item.peopleEn}
                            onChange={(e) => patchItem(item.id, "people", e.target.value)}
                          />
                        </label>
                        <label className="block">
                          <span className="text-xs uppercase text-[var(--muted)]">{zh ? "依賴" : "Depends"}</span>
                          <input
                            className="input mt-1 w-full"
                            value={zh ? item.dependsZh : item.dependsEn}
                            onChange={(e) => patchItem(item.id, "depends", e.target.value)}
                          />
                        </label>
                      </div>
                      <label className="block">
                        <span className="text-xs uppercase text-[var(--muted)]">{zh ? "為何要做" : "Why"}</span>
                        <textarea
                          className="input mt-1 w-full min-h-20"
                          value={copy.why}
                          onChange={(e) => patchItem(item.id, "why", e.target.value)}
                        />
                      </label>
                      <label className="block">
                        <span className="text-xs uppercase text-[var(--muted)]">{zh ? "今日原型" : "Today"}</span>
                        <textarea
                          className="input mt-1 w-full min-h-20"
                          value={copy.today}
                          onChange={(e) => patchItem(item.id, "today", e.target.value)}
                        />
                      </label>
                      <label className="block">
                        <span className="text-xs uppercase text-[var(--muted)]">{zh ? "今日事實（一行一點）" : "Today facts (one per line)"}</span>
                        <textarea
                          className="input mt-1 w-full min-h-24"
                          value={copy.todayFacts.join("\n")}
                          onChange={(e) => patchItem(item.id, "todayFacts", e.target.value.split("\n"))}
                        />
                      </label>
                      <label className="block">
                        <span className="text-xs uppercase text-[var(--muted)]">{zh ? "要做什麼（一行一步）" : "What to build (one per line)"}</span>
                        <textarea
                          className="input mt-1 w-full min-h-28"
                          value={copy.build.join("\n")}
                          onChange={(e) => patchItem(item.id, "build", e.target.value.split("\n"))}
                        />
                      </label>
                      <label className="block">
                        <span className="text-xs uppercase text-[var(--muted)]">{zh ? "完成標準（一行一點）" : "Done when (one per line)"}</span>
                        <textarea
                          className="input mt-1 w-full min-h-24"
                          value={copy.doneWhen.join("\n")}
                          onChange={(e) => patchItem(item.id, "doneWhen", e.target.value.split("\n"))}
                        />
                      </label>
                      <label className="block">
                        <span className="text-xs uppercase text-[var(--muted)]">{zh ? "不做的風險" : "If we skip"}</span>
                        <textarea
                          className="input mt-1 w-full min-h-20"
                          value={copy.skipRisk}
                          onChange={(e) => patchItem(item.id, "skipRisk", e.target.value)}
                        />
                      </label>
                    </div>
                  ) : (
                    <>
                      <div className="rounded-xl border border-teal-200 bg-teal-50/60 p-3 text-sm">
                        <div className="text-xs uppercase text-teal-800">{zh ? "為何要做" : "Why this item"}</div>
                        <p className="mt-1 break-word">{copy.why}</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <div className="rounded-xl border border-[var(--line)] p-3">
                          <div className="text-xs uppercase text-[var(--muted)]">{zh ? "今日原型" : "Today’s prototype"}</div>
                          <p className="mt-1 break-word">{copy.today}</p>
                          <ul className="mt-2 list-disc pl-5 space-y-1 text-[var(--muted)]">
                            {copy.todayFacts.map((fact) => (
                              <li key={fact} className="break-word">
                                {fact}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="rounded-xl border border-[var(--line)] p-3">
                          <div className="text-xs uppercase text-[var(--muted)]">{zh ? "要做什麼" : "What to build"}</div>
                          <ol className="mt-2 list-decimal pl-5 space-y-1">
                            {copy.build.map((step) => (
                              <li key={step} className="break-word">
                                {step}
                              </li>
                            ))}
                          </ol>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3">
                          <div className="text-xs uppercase text-emerald-900">{zh ? "完成標準" : "Done when"}</div>
                          <ul className="mt-2 list-disc pl-5 space-y-1">
                            {copy.doneWhen.map((d) => (
                              <li key={d} className="break-word">
                                {d}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-3">
                          <div className="text-xs uppercase text-rose-900">{zh ? "不做的風險" : "If we skip"}</div>
                          <p className="mt-1 break-word">{copy.skipRisk}</p>
                        </div>
                      </div>
                    </>
                  )}

                  <div>
                    <div className="text-xs uppercase text-[var(--muted)]">{zh ? "相關畫面" : "Related screens"}</div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {item.screens.map((s) => (
                        <Link key={s.href} href={s.href} className="btn text-xs">
                          {zh ? s.zh : s.en}
                        </Link>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs uppercase text-[var(--muted)]">{zh ? "本原型落點" : "Where in this prototype"}</div>
                    <ul className="mt-2 space-y-1">
                      {item.codebase.map((line) => (
                        <li key={line}>
                          <code className="text-xs rounded bg-slate-100 px-1.5 py-0.5 break-word">{line}</code>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-[var(--muted)]">{zh ? "沒有符合篩選的項目。" : "No items match this filter."}</p>
      ) : null}

      <p className="text-xs text-[var(--muted)]">
        {zh
          ? "工期鍵：S 一個垂直切片 · M 多日模組 · L 跨團隊 · XL 計畫級。完整 Markdown 仍在 docs/ROADMAP.md。"
          : "Effort: S = one vertical slice · M = multi-day module · L = cross-team · XL = programme-sized. Markdown twin: docs/ROADMAP.md."}
      </p>
    </div>
  );
}
