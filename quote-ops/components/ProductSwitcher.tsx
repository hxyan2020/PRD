"use client";

import { useI18n } from "@/lib/i18n/context";
import { PRODUCTS, type ProductId } from "@/lib/kb/products";
import { useProduct } from "@/lib/product/context";

const ORDER: ProductId[] = ["cfd-broker", "v-exchange-perp"];

export function ProductSwitcher({
  compact = false,
  variant = "light",
}: {
  compact?: boolean;
  /** On dark hero backgrounds */
  variant?: "light" | "dark";
}) {
  const { locale, t } = useI18n();
  const { product, setProduct } = useProduct();
  const dark = variant === "dark";

  return (
    <div
      className={`inline-flex max-w-full gap-0.5 rounded-lg border p-0.5 ${
        compact ? "text-[10px]" : "text-xs"
      } ${dark ? "border-white/20 bg-black/25" : "border-line bg-white"}`}
      role="tablist"
      aria-label={t("产品线：CFD 经纪商 / V Exchange 永续交易所", "Product: CFD Broker / V Exchange Perp")}
    >
      {ORDER.map((id) => {
        const def = PRODUCTS[id];
        const active = product === id;
        const label = locale === "zh-CN" ? def.switchZh : def.switchEn;
        const activeCls =
          id === "v-exchange-perp"
            ? "bg-teal-700 text-white"
            : "bg-copper text-white";
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={active}
            title={locale === "zh-CN" ? def.brandZh : def.brandEn}
            onClick={() => setProduct(id)}
            className={`rounded-md px-2.5 py-1.5 touch-manipulation whitespace-nowrap ${
              active
                ? activeCls
                : dark
                  ? "text-paper/70 hover:bg-white/10 hover:text-paper"
                  : "text-mist hover:bg-line/40 hover:text-ink"
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
