import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import {
  getCollectionItem,
  listCollection,
  removeCollectionItem,
  upsertCollectionItem,
} from "@/lib/collections";
import { getIdeaBySlug } from "@/lib/db";
import { scoreIdeaAgainstProfile } from "@/lib/match";
import { ensureSeeded } from "@/lib/scanner";
import type { IdeaMatch, UserProfile } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Login required." }, { status: 401 });

  const slug = req.nextUrl.searchParams.get("slug");
  if (slug) {
    const item = getCollectionItem(user.id, slug);
    return NextResponse.json({ item: item ?? null });
  }

  return NextResponse.json({ items: listCollection(user.id) });
}

export async function POST(req: NextRequest) {
  ensureSeeded();
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Login required." }, { status: 401 });

  const body = await req.json().catch(() => null);
  const slug = typeof body?.slug === "string" ? body.slug : "";
  if (!slug) return NextResponse.json({ error: "Idea slug is required." }, { status: 400 });

  const idea = getIdeaBySlug(slug);
  if (!idea) return NextResponse.json({ error: "Idea not found." }, { status: 404 });

  let match: IdeaMatch | null =
    body?.match && typeof body.match === "object" ? (body.match as IdeaMatch) : null;
  let profileSnapshot: UserProfile | null =
    body?.profile && typeof body.profile === "object" ? (body.profile as UserProfile) : null;

  if (!match && profileSnapshot) {
    match = scoreIdeaAgainstProfile(idea, profileSnapshot);
  }

  const note = typeof body?.note === "string" ? body.note : undefined;
  const item = upsertCollectionItem({
    userId: user.id,
    idea,
    match,
    profileSnapshot,
    note,
  });

  return NextResponse.json({ item });
}

export async function DELETE(req: NextRequest) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Login required." }, { status: 401 });

  const body = await req.json().catch(() => null);
  const slug =
    typeof body?.slug === "string"
      ? body.slug
      : (req.nextUrl.searchParams.get("slug") ?? "");
  if (!slug) return NextResponse.json({ error: "Idea slug is required." }, { status: 400 });

  const removed = removeCollectionItem(user.id, slug);
  return NextResponse.json({ removed });
}
