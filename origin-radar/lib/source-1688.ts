import { createHmac } from "node:crypto";
import type { ScoredProduct } from "./types";

export interface LiveOffer {
  offerId: string;
  titleZh?: string;
  priceCny?: number;
  images?: string[];
  url: string;
  note: string;
}

/**
 * Official 1688 open platform (alibaba.product.get) when credentials exist.
 * Public HTML is typically captcha-walled without an app key.
 */
export async function fetchLiveOffer(product: ScoredProduct): Promise<LiveOffer | null> {
  const key = process.env.ALIBABA_1688_APP_KEY;
  const secret = process.env.ALIBABA_1688_APP_SECRET;
  const token = process.env.ALIBABA_1688_ACCESS_TOKEN;
  const offerId = process.env[`OFFER_${product.slug.replace(/-/g, "_").toUpperCase()}`];
  if (!key || !secret || !token || !offerId) return null;

  try {
    const timestamp = new Date().toISOString().replace("T", " ").slice(0, 19);
    const params: Record<string, string> = {
      app_key: key,
      method: "alibaba.product.get",
      timestamp,
      v: "2.0",
      format: "json",
      access_token: token,
      productId: offerId,
    };
    const signBase = Object.keys(params)
      .sort()
      .map((k) => `${k}${params[k]}`)
      .join("");
    const sign = createHmac("md5", secret).update(signBase).digest("hex").toUpperCase();
    const body = new URLSearchParams({ ...params, sign });
    const res = await fetch("https://gw.open.1688.com/openapi/param2/1/com.alibaba.product/alibaba.product.get", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body,
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as {
      result?: { productID?: string; subject?: string; imageUrl?: string; detailPage?: string };
    };
    const r = json.result;
    if (!r) return null;
    return {
      offerId: String(r.productID ?? offerId),
      titleZh: r.subject,
      images: r.imageUrl ? [r.imageUrl] : [],
      url: r.detailPage ?? `https://detail.1688.com/offer/${offerId}.html`,
      note: "Live 1688 alibaba.product.get",
    };
  } catch {
    return null;
  }
}
