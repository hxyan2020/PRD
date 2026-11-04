import { NextResponse } from "next/server";
import { CATALOG_AS_OF, getProducts } from "@/lib/catalog";

export async function POST() {
  const products = getProducts();
  return NextResponse.json({
    asOf: CATALOG_AS_OF,
    refreshed: new Date().toISOString(),
    count: products.length,
    note: "Live 1688 / TikTok / Xiaohongshu connectors are adapter-ready. This pass re-scores the research snapshot.",
  });
}
