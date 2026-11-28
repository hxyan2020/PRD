import { NextResponse } from "next/server";
import { getProduct } from "@/lib/catalog";

export async function GET(_req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const product = getProduct(slug);
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(product);
}
