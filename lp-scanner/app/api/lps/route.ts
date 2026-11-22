import { NextRequest, NextResponse } from "next/server";
import { getIdentity } from "../../../cursor/identity";
import { deleteLp, insertLp, listLps, updateLp } from "@/lib/db";
import type { LpRecord } from "@/lib/types";

export const dynamic = "force-dynamic";

async function assertCanWrite(request: Request): Promise<Response | null> {
  const identity = await getIdentity(request);
  // Verified includes the local simulated viewer from cursor/identity.dev.ts.
  if (identity.verified) return null;
  if (!process.env.CURSOR_APP_ID && !process.env.VERCEL) return null;
  return NextResponse.json({ error: "unauthorized" }, { status: 401 });
}

export async function GET() {
  const lps = await listLps();
  return NextResponse.json({ lps });
}

export async function POST(request: NextRequest) {
  const denied = await assertCanWrite(request);
  if (denied) return denied;
  const body = (await request.json()) as Partial<LpRecord> & { name: string };
  if (!body.name?.trim()) {
    return NextResponse.json({ error: "name required" }, { status: 400 });
  }
  const now = new Date().toISOString();
  const id =
    body.id ||
    body.slug ||
    body.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  const lp: LpRecord = {
    id,
    slug: body.slug || id,
    name: body.name.trim(),
    aliases: body.aliases ?? [],
    category: body.category ?? "traditional",
    usedByVantage: body.usedByVantage ?? false,
    regions: body.regions ?? ["Global"],
    hours: body.hours ?? "24/5",
    assetClasses: body.assetClasses ?? ["fx"],
    products: body.products ?? [],
    costTier: body.costTier ?? "negotiated",
    pricingQuality: body.pricingQuality ?? 3,
    latencyProfile: body.latencyProfile ?? "medium",
    regulation: body.regulation ?? ["Unverified"],
    strengths: body.strengths ?? [],
    weaknesses: body.weaknesses ?? [],
    bestFor: body.bestFor ?? [],
    website: body.website,
    notes: body.notes ?? "",
    kbBodyEn: body.kbBodyEn ?? "",
    kbBodyZh: body.kbBodyZh ?? "",
    scoreHints: body.scoreHints ?? {
      gold: 50,
      fxMajors: 50,
      indices: 50,
      oil: 50,
      crypto: 50,
      asia: 50,
    },
    updatedAt: now,
  };
  await insertLp(lp);
  return NextResponse.json({ lp });
}

export async function PUT(request: NextRequest) {
  const denied = await assertCanWrite(request);
  if (denied) return denied;
  const body = (await request.json()) as Partial<LpRecord> & { id: string };
  if (!body.id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const lp = await updateLp(body.id, body);
  if (!lp) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ lp });
}

export async function DELETE(request: NextRequest) {
  const denied = await assertCanWrite(request);
  if (denied) return denied;
  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await deleteLp(id);
  return NextResponse.json({ ok: true });
}
