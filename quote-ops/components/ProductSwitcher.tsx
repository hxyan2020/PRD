"use client";

import { useI18n } from "@/lib/i18n/context";
import { PRODUCTS, type ProductId } from "@/lib/kb/products";
import { useProduct } from "@/lib/product/context";

const ORDER: ProductId[] = ["cfd-broker", "v-exchange-perp"];

export function ProductSwitcher({
  compact = false,
  variant = "light",
  fullWidth = false,
}: {
  compact?: boolean;
  /** On dark hero backgrounds */
  variant?: "light" | "dark";
  /** Stretch both options equally (mobile) */
  fullWidth?: boolean;
}) {
  const { locale, t } = useI18n();
  const { product, setProduct } = useProduct();
  const dark = variant === "dark";

  return (
    <div
      className={`${fullWidth ? "flex w-full" : "inline-flex max-w-full"} gap-0.5 rounded-lg border p-0.5 ${
        compact ? "text-[10px]" : "text-xs"
      } ${dark ? "border-white/20 bg-black/25" : "border-line bg-white"}`}
      role="tablist"
      aria-label={t("产品线：CFD 经纪商 / V Exchange 永续交易所", "Product: CFD Broker / V Exchange Perp")}
    >
      {ORDER.map((id) => {
        const def = PRODUCTS[id];
        const active = product === id;
        const label = locale === "zh-CN" ? def.switchZh : def.switchEn;
        const shortMobile =
          id === "v-exchange-perp"
            ? locale === "zh-CN"
              ? "永续"
              : "Perp"
            : locale === "zh-CN"
              ? "CFD"
              : "CFD";
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
              fullWidth ? "min-h-10 flex-1 text-center text-xs sm:min-h-0 sm:text-[inherit]" : ""
            } ${
              active
                ? activeCls
                : dark
                  ? "text-paper/70 hover:bg-white/10 hover:text-paper"
                  : "text-mist hover:bg-line/40 hover:text-ink"
            }`}
          >
            <span className={fullWidth ? "sm:hidden" : "hidden"}>{shortMobile}</span>
            <span className={fullWidth ? "hidden sm:inline" : undefined}>{label}</span>
          </button>
        );
      })}
    </div>
  );
}
