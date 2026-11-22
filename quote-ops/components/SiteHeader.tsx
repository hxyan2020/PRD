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

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  const items = NAV.filter((n) => n.href !== "/admin" || isAdmin);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-line/80 bg-paper/95 pt-[env(safe-area-inset-top)] backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-2 px-3 py-3 sm:gap-3 sm:px-6">
          <Link href="/" className="min-w-0 shrink">
            <span className="font-display text-xl tracking-tight text-ink sm:text-2xl">QuoteOps</span>
            <span className="ml-2 hidden text-[10px] uppercase tracking-[0.16em] text-mist md:inline">
              {t("报价小队知识库", "Pricing Squad KB")}
            </span>
          </Link>

          <button
            type="button"
            className="ml-auto inline-flex h-10 w-10 items-center justify-center rounded-lg border border-line text-base sm:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="site-nav"
            aria-label={open ? t("关闭菜单", "Close menu") : t("打开菜单", "Open menu")}
          >
            {open ? "✕" : "☰"}
          </button>

          {/* Desktop nav stays in-header */}
          <nav className="ml-auto hidden items-center gap-0.5 sm:flex sm:flex-wrap">
            {items.map((item) => {
              const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-md px-2.5 py-1.5 text-sm ${
                    active ? "bg-ink text-paper" : "text-ink-2 hover:bg-line/50"
                  }`}
                >
                  {locale === "zh-CN" ? item.zh : item.en}
                </Link>
              );
            })}
            {roleReady && (
              <span
                className={`ml-2 rounded-md border px-2 py-1 text-[10px] uppercase tracking-wide ${
                  isAdmin ? "border-sea/40 bg-sea-soft/50 text-sea" : "border-line bg-paper text-mist"
                }`}
              >
                {isAdmin ? t("管理员", "Admin") : t("只读", "Read-only")}
              </span>
            )}
            <div className="ml-2 flex gap-1 rounded-md border border-line bg-white p-0.5 text-xs">
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

      {/* Mobile drawer outside blurred header so position:fixed covers the viewport */}
      {open && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-ink/45 sm:hidden"
          aria-label={t("关闭菜单", "Close menu")}
          onClick={() => setOpen(false)}
        />
      )}
      <nav
        id="site-nav"
        className={`${
          open ? "flex" : "hidden"
        } fixed inset-x-0 bottom-0 top-[calc(3.4rem+env(safe-area-inset-top))] z-50 max-h-[calc(100dvh-3.4rem-env(safe-area-inset-top))] flex-col gap-1 overflow-auto border-t border-line bg-paper p-3 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:hidden`}
      >
        {items.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={`rounded-lg px-3 py-3 text-base touch-manipulation ${
                active ? "bg-ink text-paper" : "text-ink-2 hover:bg-line/50"
              }`}
            >
              {locale === "zh-CN" ? item.zh : item.en}
            </Link>
          );
        })}
        {roleReady && (
          <span
            className={`mt-2 w-fit rounded-md border px-2 py-1.5 text-[10px] uppercase tracking-wide ${
              isAdmin ? "border-sea/40 bg-sea-soft/50 text-sea" : "border-line bg-paper text-mist"
            }`}
          >
            {isAdmin ? t("管理员", "Admin") : t("只读", "Read-only")}
          </span>
        )}
        <div className="mt-2 flex gap-1 rounded-lg border border-line bg-white p-1 text-sm">
          <button
            type="button"
            className={`min-h-10 flex-1 rounded-md px-3 py-2 touch-manipulation ${
              locale === "zh-CN" ? "bg-ink text-paper" : "text-mist"
            }`}
            onClick={() => setLocale("zh-CN")}
          >
            中文
          </button>
          <button
            type="button"
            className={`min-h-10 flex-1 rounded-md px-3 py-2 touch-manipulation ${
              locale === "en" ? "bg-ink text-paper" : "text-mist"
            }`}
            onClick={() => setLocale("en")}
          >
            EN
          </button>
        </div>
      </nav>
    </>
  );
}
