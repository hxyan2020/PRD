"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatTs } from "@/lib/kb/format";
import { useI18n } from "@/lib/i18n/context";
import type { KbNode } from "@/lib/kb/types";

/** Compact admin search/sort on the home page. */
export function HomeAdminStrip() {
  const { locale, t } = useI18n();
  const [isAdmin, setIsAdmin] = useState(false);
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("updated");
  const [nodes, setNodes] = useState<KbNode[]>([]);

  useEffect(() => {
    void fetch("/api/me")
      .then((r) => r.json())
      .then((d: { isAdmin?: boolean }) => setIsAdmin(!!d.isAdmin));
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    const tmr = setTimeout(() => {
      void fetch(`/api/kb?q=${encodeURIComponent(q)}&sort=${sort}&order=desc`)
        .then((r) => r.json())
        .then((d: { nodes: KbNode[] }) => setNodes((d.nodes || []).slice(0, 8)));
    }, 200);
    return () => clearTimeout(tmr);
  }, [isAdmin, q, sort]);

  if (!isAdmin) return null;

  return (
    <section className="rounded-2xl border border-ink/10 bg-white/85 p-4 sm:p-5 animate-rise">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="font-display text-lg text-ink">{t("管理员快速检索", "Admin quick search")}</h2>
        <Link href="/admin" className="ml-auto text-xs text-sea hover:underline">
          {t("新增 / 编辑 / Lark 导入", "Create / edit / Lark import")} →
        </Link>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <input
          className="field min-w-[200px] flex-1"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t("关键字查询标题/正文/标签…", "Search title/body/tags…")}
        />
        <select className="field w-auto" value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="updated">{t("按最近更改", "By updated")}</option>
          <option value="created">{t("按创建时间", "By created")}</option>
          <option value="title">{t("按标题", "By title")}</option>
        </select>
      </div>
      <ul className="mt-3 divide-y divide-line/70">
        {nodes.map((n) => (
          <li key={n.id} className="flex flex-wrap items-baseline gap-2 py-2 text-sm">
            <Link href={`/kb/${n.slug}`} className="font-medium text-ink hover:text-sea">
              {locale === "zh-CN" ? n.titleZh : n.titleEn || n.titleZh}
            </Link>
            <span className="font-mono text-[10px] text-mist">{n.kind}</span>
            <span className="text-[11px] text-mist">
              {formatTs(n.updatedAt, locale)}
            </span>
          </li>
        ))}
        {nodes.length === 0 && (
          <li className="py-3 text-sm text-mist">{t("无匹配", "No matches")}</li>
        )}
      </ul>
    </section>
  );
}
