import { NextRequest, NextResponse } from "next/server";
import { filterProducts } from "@/lib/catalog";
import type { RegionId } from "@/lib/types";
import type { SortKey } from "@/lib/catalog";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const region = (searchParams.get("region") ?? "all") as RegionId | "all";
  const gap = (searchParams.get("gap") ?? "all") as "all" | "whitespace" | "exists";
  const category = searchParams.get("category") ?? "all";
  const sort = (searchParams.get("sort") ?? "score") as SortKey;
  const query = searchParams.get("q") ?? "";
  const products = filterProducts({ query, region, gap, category, sort });
  return NextResponse.json({ count: products.length, products });
}
