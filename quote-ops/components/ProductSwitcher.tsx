"use client";

import { useI18n } from "@/lib/i18n/context";
import { PRODUCTS, type ProductId } from "@/lib/kb/products";
import { useProduct } from "@/lib/product/context";

const ORDER: ProductId[] = ["cfd-broker", "v-exchange-perp"];

export function ProductSwitcher({ compact = false }: { compact?: boolean }) {
  const { locale, t } = useI18n();
  const { product, setProduct } = useProduct();

  return (
    <div
      className={`flex gap-0.5 rounded-md border border-line bg-white p-0.5 ${
        compact ? "text-[10px]" : "text-xs"
      }`}
      role="tablist"
      aria-label={t("产品线", "Product line")}
    >
      {ORDER.map((id) => {
        const def = PRODUCTS[id];
        const active = product === id;
        const label = locale === "zh-CN" ? def.shortZh : def.shortEn;
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => setProduct(id)}
            className={`rounded px-2 py-1 touch-manipulation ${
              active ? "bg-ink text-paper" : "text-mist hover:text-ink"
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
