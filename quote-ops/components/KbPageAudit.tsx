"use client";

import { useCallback, useEffect, useState } from "react";
import { formatTs } from "@/lib/kb/format";
import { useI18n } from "@/lib/i18n/context";
import type { KbRevision } from "@/lib/kb/types";

const ACTION_ZH: Record<string, string> = {
  seed: "系统种子",
  create: "新建",
  update: "编辑",
  append: "追加",
  delete: "删除",
  "publish+bilingual-mirror": "发布并生成双语",
  publish: "发布",
};

const ACTION_EN: Record<string, string> = {
  seed: "System seed",
  create: "Create",
  update: "Update",
  append: "Append",
  delete: "Delete",
  "publish+bilingual-mirror": "Publish + bilingual",
  publish: "Publish",
};

type Props = {
  nodeId: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
  /** Auto-expand the log once. */
  defaultOpen?: boolean;
};

export function KbPageAudit({
  nodeId,
  createdAt,
  updatedAt,
  createdBy,
  updatedBy,
  defaultOpen = false,
}: Props) {
  const { locale, t } = useI18n();
  const [open, setOpen] = useState(defaultOpen);
  const [revisions, setRevisions] = useState<KbRevision[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/kb/${encodeURIComponent(nodeId)}?revisions=1`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { revisions: KbRevision[] };
      setRevisions(data.revisions || []);
      setLoaded(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "failed");
    } finally {
      setLoading(false);
    }
  }, [nodeId]);

  useEffect(() => {
    if (defaultOpen) void load();
  }, [defaultOpen, load]);

  async function toggle() {
    if (!open && !loaded) await load();
    setOpen((v) => !v);
  }

  function actionLabel(action: string) {
    return locale === "zh-CN"
      ? ACTION_ZH[action] || action
      : ACTION_EN[action] || action;
  }

  return (
    <section className="rounded-xl border border-line bg-white/90 p-4">
      <div className="flex flex-wrap gap-2 text-xs text-mist">
        <span className="rounded border border-line bg-paper px-2 py-1">
          {t("创建时间", "Created")}{" "}
          <time dateTime={createdAt} className="font-medium text-ink">
            {formatTs(createdAt, locale)}
          </time>
        </span>
        <span className="rounded border border-line bg-paper px-2 py-1">
          {t("最近更改", "Last updated")}{" "}
          <time dateTime={updatedAt} className="font-medium text-ink">
            {formatTs(updatedAt, locale)}
          </time>
        </span>
        <span className="rounded border border-line bg-paper px-2 py-1">
          {t("创建人", "Created by")}{" "}
          <span className="font-medium text-ink">{createdBy || "—"}</span>
        </span>
        <span className="rounded border border-line bg-paper px-2 py-1">
          {t("最近操作人", "Last editor")}{" "}
          <span className="font-medium text-ink">{updatedBy || createdBy || "—"}</span>
        </span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => void toggle()}
          className="min-h-10 rounded-lg border border-ink/20 bg-ink px-3 py-2 text-xs text-paper touch-manipulation sm:min-h-0"
        >
          {open
            ? t("收起编辑记录", "Collapse edit log")
            : t("完整编辑记录与操作人日志", "Full edit history & operator log")}
          {loaded ? ` (${revisions.length})` : ""}
        </button>
        {loading && <span className="text-xs text-mist">{t("加载中…", "Loading…")}</span>}
        {error && <span className="text-xs text-danger">{error}</span>}
      </div>

      {open && (
        <div className="mt-3 space-y-2">
          <h2 className="font-display text-lg text-ink">
            {t("完整编辑记录", "Full edit log")}
          </h2>
          <p className="text-xs text-mist">
            {t(
              "按时间倒序；含操作类型、时间、操作人与备注。快照保留当时标题状态。",
              "Newest first: action, time, operator, note. Snapshot keeps the title at that moment.",
            )}
          </p>
          <ul className="space-y-2">
            {revisions.map((r) => {
              const snap = r.snapshot as { titleZh?: string; titleEn?: string; status?: string };
              const snapTitle =
                locale === "zh-CN"
                  ? snap.titleZh || snap.titleEn
                  : snap.titleEn || snap.titleZh;
              return (
                <li key={r.id} className="rounded-lg border border-line/80 bg-paper/60 px-3 py-2.5">
                  <div className="flex flex-wrap items-baseline gap-2 text-sm">
                    <span className="rounded bg-sea-soft/60 px-1.5 py-0.5 font-mono text-[11px] text-sea">
                      {actionLabel(r.action)}
                    </span>
                    <time dateTime={r.createdAt} className="text-xs text-mist">
                      {formatTs(r.createdAt, locale)}
                    </time>
                  </div>
                  <p className="mt-1 text-xs text-ink-2">
                    <span className="text-mist">{t("操作人", "Operator")} · </span>
                    {r.actorEmail || r.actorName || r.actorSub || "—"}
                    {r.note ? (
                      <>
                        <span className="text-mist"> · {t("备注", "Note")} · </span>
                        {r.note}
                      </>
                    ) : null}
                  </p>
                  {(snapTitle || snap.status) && (
                    <p className="mt-1 font-mono text-[11px] text-mist">
                      {snapTitle ? `「${snapTitle}」` : ""}
                      {snap.status ? ` · ${snap.status}` : ""}
                    </p>
                  )}
                </li>
              );
            })}
            {revisions.length === 0 && !loading && (
              <li className="rounded-lg border border-dashed border-line px-3 py-4 text-sm text-mist">
                {t("暂无修订记录", "No revision records yet")}
              </li>
            )}
          </ul>
        </div>
      )}
    </section>
  );
}
