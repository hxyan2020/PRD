import { NextRequest, NextResponse } from "next/server";
import { listIdeas } from "@/lib/db";
import { rankIdeasForProfile } from "@/lib/match";
import { ensureSeeded } from "@/lib/scanner";
import type { UserProfile } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  ensureSeeded();
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const profile = normalizeProfile(body);
  if (!profile) {
    return NextResponse.json(
      { error: "Profile requires skills, major, currentBusiness, or interestedDomains" },
      { status: 400 },
    );
  }

  const ideas = listIdeas();
  const matches = rankIdeasForProfile(ideas, profile);
  const bySlug = Object.fromEntries(matches.map((m) => [m.slug, m]));

  return NextResponse.json({
    profile,
    matches,
    ideas: ideas.map((idea) => ({
      ...idea,
      match: bySlug[idea.slug] ?? null,
    })),
  });
}

function normalizeProfile(body: unknown): UserProfile | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;
  const profile: UserProfile = {
    id: typeof b.id === "string" && b.id ? b.id : "anonymous",
    displayName: typeof b.displayName === "string" ? b.displayName : "",
    skills: asStringList(b.skills),
    major: typeof b.major === "string" ? b.major : "",
    currentBusiness: typeof b.currentBusiness === "string" ? b.currentBusiness : "",
    interestedDomains: asStringList(b.interestedDomains),
    preferredMarkets: asStringList(b.preferredMarkets),
    notes: typeof b.notes === "string" ? b.notes : "",
    updatedAt:
      typeof b.updatedAt === "string" ? b.updatedAt : new Date().toISOString(),
  };

  const ready =
    profile.skills.length > 0 ||
    profile.major.trim() ||
    profile.currentBusiness.trim() ||
    profile.interestedDomains.length > 0;
  return ready ? profile : null;
}

function asStringList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .filter((v): v is string => typeof v === "string")
      .map((v) => v.trim())
      .filter(Boolean);
  }
  if (typeof value === "string") {
    return value
      .split(/[,;/|]+/)
      .map((v) => v.trim())
      .filter(Boolean);
  }
  return [];
}
