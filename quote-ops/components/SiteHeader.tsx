"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/lib/i18n/context";

const NAV = [
  { href: "/", zh: "RAG 问答", en: "RAG Desk" },
  { href: "/pipeline", zh: "报价链路", en: "Pipeline" },
  { href: "/risks", zh: "风险目录", en: "Risks" },
  { href: "/skills", zh: "技能库", en: "Skills" },
  { href: "/data", zh: "数据架构", en: "Data" },
  { href: "/knowledge", zh: "原则", en: "Principles" },
  { href: "/cases", zh: "排查案件", en: "Cases" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const { locale, setLocale, t } = useI18n();

  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-paper/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-3 py-3 sm:px-6">
        <Link href="/" className="group flex items-baseline gap-2">
          <span className="font-display text-2xl tracking-tight text-ink">QuoteOps</span>
          <span className="hidden text-xs uppercase tracking-[0.18em] text-mist sm:inline">
            {t("报价小队知识库", "Pricing Squad KB")}
          </span>
        </Link>
        <nav className="flex flex-1 flex-wrap gap-1 sm:justify-center">
          {NAV.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-md px-2.5 py-1.5 text-sm transition ${
                  active ? "bg-ink text-paper" : "text-ink-2 hover:bg-line/50"
                }`}
              >
                {locale === "zh-CN" ? item.zh : item.en}
              </Link>
            );
          })}
        </nav>
        <div className="flex gap-1 rounded-md border border-line bg-white p-0.5 text-xs">
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
      </div>
    </header>
  );
}
