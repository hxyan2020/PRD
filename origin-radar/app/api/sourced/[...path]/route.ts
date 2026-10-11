import { NextResponse } from "next/server";
import { readSourcedFile } from "@/lib/sourced-fs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ path: string[] }> },
) {
  const { path: parts } = await ctx.params;
  const file = await readSourcedFile(parts ?? []);
  if (!file) return new NextResponse("Not found", { status: 404 });
  return new NextResponse(new Uint8Array(file.body), {
    headers: {
      "content-type": file.contentType,
      "cache-control": "public, max-age=86400",
    },
  });
}
