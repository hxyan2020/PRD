"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  DEFAULT_PRODUCT,
  PRODUCTS,
  type ProductDef,
  type ProductId,
  isProductId,
} from "@/lib/kb/products";

const STORAGE_KEY = "quoteops.product";

type ProductCtx = {
  product: ProductId;
  setProduct: (id: ProductId) => void;
  def: ProductDef;
};

const Ctx = createContext<ProductCtx | null>(null);

export function ProductProvider({ children }: { children: ReactNode }) {
  const [product, setProductState] = useState<ProductId>(DEFAULT_PRODUCT);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (isProductId(raw)) setProductState(raw);
    } catch {
      /* ignore */
    }
  }, []);

  const setProduct = useCallback((id: ProductId) => {
    setProductState(id);
    try {
      window.localStorage.setItem(STORAGE_KEY, id);
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo<ProductCtx>(
    () => ({
      product,
      setProduct,
      def: PRODUCTS[product],
    }),
    [product, setProduct],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useProduct() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useProduct outside provider");
  return ctx;
}
