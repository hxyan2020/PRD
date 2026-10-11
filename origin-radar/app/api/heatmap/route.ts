import { NextRequest, NextResponse } from "next/server";
import { getProduct, getProducts } from "@/lib/catalog";

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug");
  const product = slug ? getProduct(slug) : getProducts()[0];
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({
    keyword: product.search.keyword,
    related: product.search.related,
    globalIndex: product.search.globalIndex,
    risingPct: product.search.risingPct,
    sparkline: product.search.sparkline,
    byCountry: product.search.byCountry,
  });
}
