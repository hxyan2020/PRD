"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n/context";
import { useProduct } from "@/lib/product/context";

export function MobileBottomNav() {
  const pathname = usePathname();
  const { locale, t } = useI18n();
  const { product } = useProduct();
  const [canWrite, setCanWrite] = useState(true);
  const isPerp = product === "v-exchange-perp";

  useEffect(() => {
    void fetch("/api/me")
      .then((r) => r.json())
      .then((d: { isAdmin?: boolean; canWrite?: boolean }) =>
        setCanWrite(!!(d.canWrite ?? d.isAdmin)),
      )
      .catch(() => setCanWrite(true));
  }, []);

  const items = [
    { href: "/", zh: "检索", en: "Ask" },
    { href: "/tree", zh: "知识树", en: "Tree" },
    isPerp
      ? { href: "/kb/ve-alarm-catalog", zh: "告警", en: "Alarms" }
      : { href: "/risks", zh: "风险", en: "Risks" },
    isPerp
      ? { href: "/kb/ve-pricing-engine", zh: "定价", en: "Pricing" }
      : { href: "/pipeline", zh: "链路", en: "Pipe" },
    ...(canWrite ? [{ href: "/admin", zh: "管理", en: "Admin" }] : []),
  ];

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line/80 bg-paper/95 pb-[env(safe-area-inset-bottom)] backdrop-blur sm:hidden"
      aria-label={t("移动端快捷导航", "Mobile shortcuts")}
    >
      <div className="mx-auto flex max-w-6xl items-stretch">
        {items.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
          const activeCls = isPerp
            ? "bg-teal-700 text-white shadow-[inset_0_2px_0_0_#99f6e4]"
            : "bg-ink text-paper shadow-[inset_0_2px_0_0_#fff]";
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex min-h-12 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-0.5 text-[11px] touch-manipulation ${
                active ? activeCls : "text-ink-2"
              }`}
            >
              <span className="max-w-full truncate font-medium">
                {locale === "zh-CN" ? item.zh : item.en}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
