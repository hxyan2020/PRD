import { FACTORY_EXTRAS } from "./factory-packs";
import type { ScoredProduct } from "./types";

export function sellofferSearchUrl(keywords: string): string {
  return `https://s.1688.com/selloffer/offer_search.htm?keywords=${encodeURIComponent(keywords)}`;
}

export function companySearchUrl(keywords: string): string {
  return `https://s.1688.com/company_search.htm?keywords=${encodeURIComponent(keywords)}`;
}

export function alibabaProductSearchUrl(text: string): string {
  return `https://www.alibaba.com/trade/search?IndexArea=product_en&SearchText=${encodeURIComponent(text)}`;
}

export function alibabaSupplierSearchUrl(text: string): string {
  return `https://www.alibaba.com/trade/search?IndexArea=company_en&SearchText=${encodeURIComponent(text)}`;
}

export function pddSearchUrl(keywords: string): string {
  return `https://mobile.yangkeduo.com/search_result.html?search_key=${encodeURIComponent(keywords)}`;
}

export type FactoryLinkKind = "sku" | "mill" | "alibaba-sku" | "alibaba-mill";

export interface FactoryOutboundLink {
  kind: FactoryLinkKind;
  label: string;
  href: string;
  hint: string;
}

/** 1688 selloffer query: specific SKU plus mill name, not a generic category. */
export function skuSearchKeywords(
  product: { name: string; nameZh: string },
  vendorZh?: string,
): string {
  return [product.nameZh || product.name, vendorZh].filter(Boolean).join(" ");
}

export function millSearchKeywords(vendorZh?: string, vendor?: string, fallback = ""): string {
  return vendorZh || vendor || fallback;
}

export function factoryOutboundLinks(product: ScoredProduct): FactoryOutboundLink[] {
  const extras = FACTORY_EXTRAS[product.slug];
  const vendor = extras?.vendor;
  const vendorZh = extras?.vendorZh;
  const millKw = millSearchKeywords(vendorZh, vendor, product.factory[0]?.cluster ?? product.nameZh);
  const skuKw = skuSearchKeywords(product, vendorZh);
  const alibabaSku = [product.name, vendor].filter(Boolean).join(" ");
  return [
    {
      kind: "sku",
      label: "This SKU on 1688",
      href: sellofferSearchUrl(skuKw),
      hint: skuKw,
    },
    {
      kind: "mill",
      label: "Mill on 1688",
      href: companySearchUrl(millKw),
      hint: millKw,
    },
    {
      kind: "alibaba-sku",
      label: "This SKU on Alibaba",
      href: alibabaProductSearchUrl(alibabaSku),
      hint: alibabaSku,
    },
    {
      kind: "alibaba-mill",
      label: "Mill on Alibaba",
      href: alibabaSupplierSearchUrl(vendor || millKw),
      hint: vendor || millKw,
    },
  ];
}

export function primaryFactoryHref(product: ScoredProduct): string {
  return factoryOutboundLinks(product)[0]?.href ?? product.factory[0]?.searchUrl ?? "#";
}

/** Point each factory row at mill + SKU search instead of a category keyword dump. */
export function attachFactorySearchUrls(product: ScoredProduct): ScoredProduct {
  const extras = FACTORY_EXTRAS[product.slug];
  if (!extras) return product;
  const skuKw = skuSearchKeywords(product, extras.vendorZh);
  const millKw = millSearchKeywords(extras.vendorZh, extras.vendor);
  return {
    ...product,
    factory: product.factory.map((f) => {
      if (f.platform === "1688") return { ...f, searchUrl: sellofferSearchUrl(skuKw) };
      if (f.platform === "alibaba") {
        return { ...f, searchUrl: alibabaProductSearchUrl(`${product.name} ${extras.vendor}`) };
      }
      if (f.platform === "pinduoduo") return { ...f, searchUrl: pddSearchUrl(skuKw) };
      return { ...f, searchUrl: companySearchUrl(millKw) };
    }),
  };
}
