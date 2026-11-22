"use client";

import type { ReactNode } from "react";
import { I18nProvider } from "@/lib/i18n/context";
import { ProductProvider } from "@/lib/product/context";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <I18nProvider>
      <ProductProvider>{children}</ProductProvider>
    </I18nProvider>
  );
}
