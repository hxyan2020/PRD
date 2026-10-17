import { NextRequest, NextResponse } from "next/server";
import { listIdeas } from "@/lib/db";
import { buildDailyRecommendation, dayKey } from "@/lib/match";
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
      { error: "Build a match profile first (skills, major, business, or domains)." },
      { status: 400 },
    );
  }

  const day =
    body &&
    typeof body === "object" &&
    typeof (body as { day?: unknown }).day === "string"
      ? ((body as { day: string }).day.slice(0, 10) || dayKey())
      : dayKey();

  const recommendation = buildDailyRecommendation(listIdeas(), profile, day);
  if (!recommendation) {
    return NextResponse.json({ error: "No ideas available to recommend." }, { status: 404 });
  }

  return NextResponse.json({
    day: recommendation.day,
    recommendation: {
      idea: recommendation.idea,
      match: recommendation.match,
    },
  });
}

function normalizeProfile(body: unknown): UserProfile | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;
  const profileBody =
    b.profile && typeof b.profile === "object"
      ? (b.profile as Record<string, unknown>)
      : b;

  const profile: UserProfile = {
    id: typeof profileBody.id === "string" && profileBody.id ? profileBody.id : "anonymous",
    displayName: typeof profileBody.displayName === "string" ? profileBody.displayName : "",
    skills: asStringList(profileBody.skills),
    major: typeof profileBody.major === "string" ? profileBody.major : "",
    currentBusiness:
      typeof profileBody.currentBusiness === "string" ? profileBody.currentBusiness : "",
    interestedDomains: asStringList(profileBody.interestedDomains),
    preferredMarkets: asStringList(profileBody.preferredMarkets),
    notes: typeof profileBody.notes === "string" ? profileBody.notes : "",
    updatedAt:
      typeof profileBody.updatedAt === "string"
        ? profileBody.updatedAt
        : new Date().toISOString(),
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
