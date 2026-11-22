"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PageHero, Prose } from "@/components/Prose";
import { formatTs } from "@/lib/kb/format";
import { useI18n } from "@/lib/i18n/context";
import type { KbNode, KbRevision } from "@/lib/kb/types";

export function KbReader({ slug }: { slug: string }) {
  const { locale, t } = useI18n();
  const [node, setNode] = useState<KbNode | null>(null);
  const [revisions, setRevisions] = useState<KbRevision[]>([]);
  const [showMd, setShowMd] = useState(false);
  const [markdown, setMarkdown] = useState("");
  const [copied, setCopied] = useState(false);
  const [showLog, setShowLog] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const [res, me] = await Promise.all([
          fetch(`/api/kb/${encodeURIComponent(slug)}`),
          fetch("/api/me"),
        ]);
        if (!res.ok) throw new Error(res.status === 404 ? "not found" : `HTTP ${res.status}`);
        const data = (await res.json()) as { node: KbNode };
        setNode(data.node);
        const meData = (await me.json()) as { isAdmin?: boolean };
        setIsAdmin(!!meData.isAdmin);
      } catch (e) {
        setError(e instanceof Error ? e.message : "failed");
      }
    })();
  }, [slug]);

  async function loadMd() {
    if (!node) return;
    const res = await fetch(
      `/api/kb/${node.id}?markdown=1&locale=${locale === "en" ? "en" : "zh-CN"}`,
    );
    const data = (await res.json()) as { markdown: string };
    setMarkdown(data.markdown);
    setShowMd(true);
  }

  async function loadLog() {
    if (!node) return;
    const res = await fetch(`/api/kb/${node.id}?revisions=1`);
    const data = (await res.json()) as { revisions: KbRevision[] };
    setRevisions(data.revisions || []);
    setShowLog(true);
  }

  async function copyMd() {
    if (!markdown) await loadMd();
    const text =
      markdown ||
      (
        await (
          await fetch(`/api/kb/${node!.id}?markdown=1&locale=${locale === "en" ? "en" : "zh-CN"}`)
        ).json()
      ).markdown;
    await navigator.clipboard.writeText(text);
    setMarkdown(text);
    setShowMd(true);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  if (error) {
    return (
      <div className="rounded-xl border border-danger/30 bg-red-50 p-6 text-danger">
        {error} · <Link href="/tree">{t("返回知识树", "Back to tree")}</Link>
      </div>
    );
  }
  if (!node) {
    return <p className="text-sm text-mist">{t("加载中…", "Loading…")}</p>;
  }

  const title = locale === "zh-CN" ? node.titleZh : node.titleEn || node.titleZh;
  const summary = locale === "zh-CN" ? node.summaryZh : node.summaryEn || node.summaryZh;
  const body = locale === "zh-CN" ? node.bodyZh : node.bodyEn || node.bodyZh;

  return (
    <article className="animate-rise space-y-6">
      <div className="flex flex-wrap gap-3 text-xs">
        <Link href="/tree" className="text-sea hover:underline">
          ← {t("知识树", "Tree")}
        </Link>
        {isAdmin && (
          <Link href="/admin" className="text-mist hover:underline">
            {t("去管理台编辑", "Edit in admin")}
          </Link>
        )}
      </div>

      <PageHero
        eyebrow={`${node.kind} · ${node.status}`}
        title={title}
        summary={summary}
        meta={
          <>
            <span className="rounded border border-line bg-white px-2 py-1">
              {t("创建", "Created")} {formatTs(node.createdAt, locale)}
            </span>
            <span className="rounded border border-line bg-white px-2 py-1">
              {t("最近更改", "Updated")} {formatTs(node.updatedAt, locale)}
            </span>
            <span className="rounded border border-line bg-white px-2 py-1">
              {t("操作人", "By")} {node.updatedBy || node.createdBy || "—"}
            </span>
            {node.tags.slice(0, 6).map((tag) => (
              <span key={tag} className="rounded border border-line bg-paper px-2 py-1">
                {tag}
              </span>
            ))}
          </>
        }
      />

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void loadMd()}
          className="rounded-lg border border-line bg-white px-3 py-2 text-xs"
        >
          {t("展开 Agent 可读 Markdown", "Expand agent Markdown")}
        </button>
        <button
          type="button"
          onClick={() => void copyMd()}
          className="rounded-lg bg-ink px-3 py-2 text-xs text-paper"
        >
          {copied ? t("已复制", "Copied") : t("一键复制 Markdown", "Copy Markdown")}
        </button>
        <button
          type="button"
          onClick={() => void loadLog()}
          className="rounded-lg border border-line bg-white px-3 py-2 text-xs"
        >
          {t("编辑记录", "Edit history")}
        </button>
      </div>

      {showMd && (
        <div className="rounded-xl border border-ink/20 bg-ink p-4">
          <div className="mb-2 flex items-center justify-between text-xs text-paper/60">
            <span>agent.md · {node.slug}</span>
            <button type="button" className="text-sea-soft" onClick={() => setShowMd(false)}>
              {t("收起", "Collapse")}
            </button>
          </div>
          <pre className="max-h-[420px] overflow-auto whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-sea-soft">
            {markdown}
          </pre>
        </div>
      )}

      {showLog && (
        <div className="rounded-xl border border-line bg-white/90 p-4">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-display text-lg">{t("完整编辑记录", "Full edit log")}</h2>
            <button type="button" className="text-xs text-mist" onClick={() => setShowLog(false)}>
              {t("收起", "Collapse")}
            </button>
          </div>
          <ul className="space-y-2 text-sm">
            {revisions.map((r) => (
              <li key={r.id} className="rounded-lg border border-line/70 px-3 py-2">
                <div className="flex flex-wrap gap-2 text-xs text-mist">
                  <span className="font-mono text-sea">{r.action}</span>
                  <span>{formatTs(r.createdAt, locale)}</span>
                  <span>{r.actorEmail || r.actorName || r.actorSub || "—"}</span>
                  {r.note && <span>· {r.note}</span>}
                </div>
              </li>
            ))}
            {revisions.length === 0 && (
              <li className="text-mist">{t("暂无修订（种子内容无人工编辑记录）", "No revisions yet")}</li>
            )}
          </ul>
        </div>
      )}

      <section className="rounded-2xl border border-line bg-white/90 p-5 sm:p-8">
        <Prose markdown={body || summary || t("（暂无正文）", "(Empty body)")} />
      </section>
    </article>
  );
}
