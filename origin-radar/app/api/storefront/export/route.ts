import { NextRequest, NextResponse } from "next/server";
import { listSourced } from "@/lib/db";
import { toShopifyCsv, toStorefrontJson } from "@/lib/shopify-export";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const format = req.nextUrl.searchParams.get("format") ?? "json";
  const products = listSourced();
  if (format === "shopify") {
    const csv = toShopifyCsv(products);
    return new NextResponse(csv, {
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": 'attachment; filename="origin-radar-shopify.csv"',
      },
    });
  }
  return NextResponse.json(toStorefrontJson(products));
}
