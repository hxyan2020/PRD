"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n/context";

const NAV = [
  { href: "/", zh: "RAG", en: "RAG" },
  { href: "/tree", zh: "知识树", en: "Tree" },
  { href: "/pipeline", zh: "报价链路", en: "Pipeline" },
  { href: "/risks", zh: "风险", en: "Risks" },
  { href: "/skills", zh: "技能", en: "Skills" },
  { href: "/data", zh: "数据", en: "Data" },
  { href: "/knowledge", zh: "原则", en: "Principles" },
  { href: "/cases", zh: "案件", en: "Cases" },
  { href: "/admin", zh: "管理", en: "Admin" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const { locale, setLocale, t } = useI18n();
  const [open, setOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [roleReady, setRoleReady] = useState(false);

  useEffect(() => {
    void fetch("/api/me")
      .then((r) => r.json())
      .then((d: { isAdmin?: boolean }) => {
        setIsAdmin(!!d.isAdmin);
        setRoleReady(true);
      })
      .catch(() => {
        setIsAdmin(false);
        setRoleReady(true);
      });
  }, []);

  const items = NAV.filter((n) => n.href !== "/admin" || isAdmin);

  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-paper/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-2 px-3 py-3 sm:gap-3 sm:px-6">
        <Link href="/" className="shrink-0">
          <span className="font-display text-xl tracking-tight text-ink sm:text-2xl">QuoteOps</span>
          <span className="ml-2 hidden text-[10px] uppercase tracking-[0.16em] text-mist md:inline">
            {t("报价小队知识库", "Pricing Squad KB")}
          </span>
        </Link>

        <button
          type="button"
          className="ml-auto rounded-md border border-line px-2 py-1 text-xs sm:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="menu"
        >
          {open ? "✕" : "☰"}
        </button>

        <nav
          className={`${
            open ? "flex" : "hidden"
          } absolute left-0 right-0 top-full max-h-[70vh] flex-col gap-1 overflow-auto border-b border-line bg-paper p-3 sm:static sm:ml-auto sm:flex sm:max-h-none sm:flex-row sm:flex-wrap sm:items-center sm:gap-0.5 sm:overflow-visible sm:border-0 sm:bg-transparent sm:p-0`}
        >
          {items.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`rounded-md px-2.5 py-2 text-sm sm:py-1.5 ${
                  active ? "bg-ink text-paper" : "text-ink-2 hover:bg-line/50"
                }`}
              >
                {locale === "zh-CN" ? item.zh : item.en}
              </Link>
            );
          })}
          {roleReady && (
            <span
              className={`mt-2 rounded-md border px-2 py-1 text-[10px] uppercase tracking-wide sm:mt-0 sm:ml-2 ${
                isAdmin
                  ? "border-sea/40 bg-sea-soft/50 text-sea"
                  : "border-line bg-paper text-mist"
              }`}
              title={
                isAdmin
                  ? t("管理员可编辑知识库", "Admin can edit the knowledge base")
                  : t("只读访客", "Read-only viewer")
              }
            >
              {isAdmin ? t("管理员", "Admin") : t("只读", "Read-only")}
            </span>
          )}
          <div className="mt-2 flex gap-1 rounded-md border border-line bg-white p-0.5 text-xs sm:mt-0 sm:ml-2">
            <button
              type="button"
              className={`rounded px-2 py-1 ${locale === "zh-CN" ? "bg-ink text-paper" : "text-mist"}`}
              onClick={() => setLocale("zh-CN")}
            >
              中文
            </button>
            <button
              type="button"
              className={`rounded px-2 py-1 ${locale === "en" ? "bg-ink text-paper" : "text-mist"}`}
              onClick={() => setLocale("en")}
            >
              EN
            </button>
          </div>
        </nav>
      </div>
    </header>
  );
}
