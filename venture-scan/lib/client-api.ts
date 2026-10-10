import { withBase, isStaticMode } from "./base-path";
import { catalogIdeas } from "./catalog";
import { buildDailyRecommendation, rankIdeasForProfile } from "./match";
import { isProfileReady } from "./profile";
import type { CollectionItem, IdeaMatch, StartupIdea, UserProfile } from "./types";

const COLLECTION_KEY = "venturescan.collection.v1";
const USERS_KEY = "venturescan.users.v1";
const SESSION_KEY = "venturescan.session.v1";

export async function fetchIdeas(): Promise<StartupIdea[]> {
  if (isStaticMode()) return catalogIdeas();
  try {
    const res = await fetch(withBase("/api/ideas"));
    if (!res.ok) throw new Error("ideas failed");
    const data = await res.json();
    return data.ideas as StartupIdea[];
  } catch {
    return catalogIdeas();
  }
}

export async function matchProfile(profile: UserProfile): Promise<{
  matches: IdeaMatch[];
  ideas: (StartupIdea & { match: IdeaMatch })[];
}> {
  if (!isStaticMode()) {
    try {
      const res = await fetch(withBase("/api/match"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      if (res.ok) {
        const data = await res.json();
        return {
          matches: data.matches,
          ideas: data.ideas,
        };
      }
    } catch {
      // fall through to local
    }
  }

  const ideas = catalogIdeas();
  const matches = rankIdeasForProfile(ideas, profile);
  const bySlug = Object.fromEntries(matches.map((m) => [m.slug, m]));
  return {
    matches,
    ideas: ideas.map((idea) => ({ ...idea, match: bySlug[idea.slug]! })),
  };
}

export async function fetchDaily(profile: UserProfile): Promise<{
  day: string;
  idea: StartupIdea;
  match: IdeaMatch;
} | null> {
  if (!isProfileReady(profile)) return null;

  if (!isStaticMode()) {
    try {
      const res = await fetch(withBase("/api/daily"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile }),
      });
      if (res.ok) {
        const data = await res.json();
        return {
          day: data.day,
          idea: data.recommendation.idea,
          match: data.recommendation.match,
        };
      }
    } catch {
      // fall through
    }
  }

  const daily = buildDailyRecommendation(catalogIdeas(), profile);
  if (!daily) return null;
  return { day: daily.day, idea: daily.idea, match: daily.match };
}

type LocalUser = { id: string; email: string; password: string; createdAt: string };

function readUsers(): LocalUser[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(USERS_KEY) || "[]") as LocalUser[];
  } catch {
    return [];
  }
}

function writeUsers(users: LocalUser[]) {
  window.localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export async function authMe(): Promise<{ id: string; email: string } | null> {
  if (isStaticMode()) {
    if (typeof window === "undefined") return null;
    try {
      const raw = window.localStorage.getItem(SESSION_KEY);
      return raw ? (JSON.parse(raw) as { id: string; email: string }) : null;
    } catch {
      return null;
    }
  }
  try {
    const res = await fetch(withBase("/api/auth/me"));
    const data = await res.json();
    return data.user ?? null;
  } catch {
    return null;
  }
}

export async function authRegister(
  email: string,
  password: string,
): Promise<{ user?: { id: string; email: string }; error?: string }> {
  if (isStaticMode()) {
    const normalized = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
      return { error: "Enter a valid email address." };
    }
    if (password.length < 8) return { error: "Password must be at least 8 characters." };
    const users = readUsers();
    if (users.some((u) => u.email === normalized)) {
      return { error: "An account with that email already exists." };
    }
    const user = {
      id: crypto.randomUUID(),
      email: normalized,
      password,
      createdAt: new Date().toISOString(),
    };
    users.push(user);
    writeUsers(users);
    const publicUser = { id: user.id, email: user.email };
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(publicUser));
    return { user: publicUser };
  }
  const res = await fetch(withBase("/api/auth/register"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) return { error: data.error || "Request failed" };
  return { user: data.user };
}

export async function authLogin(
  email: string,
  password: string,
): Promise<{ user?: { id: string; email: string }; error?: string }> {
  if (isStaticMode()) {
    const user = readUsers().find(
      (u) => u.email === email.trim().toLowerCase() && u.password === password,
    );
    if (!user) return { error: "Invalid email or password." };
    const publicUser = { id: user.id, email: user.email };
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(publicUser));
    return { user: publicUser };
  }
  const res = await fetch(withBase("/api/auth/login"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) return { error: data.error || "Request failed" };
  return { user: data.user };
}

export async function authLogout(): Promise<void> {
  if (isStaticMode()) {
    window.localStorage.removeItem(SESSION_KEY);
    return;
  }
  await fetch(withBase("/api/auth/logout"), { method: "POST" });
}

function readCollection(userId: string): CollectionItem[] {
  if (typeof window === "undefined") return [];
  try {
    const all = JSON.parse(window.localStorage.getItem(COLLECTION_KEY) || "{}") as Record<
      string,
      CollectionItem[]
    >;
    return all[userId] ?? [];
  } catch {
    return [];
  }
}

function writeCollection(userId: string, items: CollectionItem[]) {
  const all = JSON.parse(window.localStorage.getItem(COLLECTION_KEY) || "{}") as Record<
    string,
    CollectionItem[]
  >;
  all[userId] = items;
  window.localStorage.setItem(COLLECTION_KEY, JSON.stringify(all));
}

export async function listUserCollection(): Promise<
  { items?: CollectionItem[]; error?: string; status?: number }
> {
  if (isStaticMode()) {
    const user = await authMe();
    if (!user) return { error: "Login required.", status: 401 };
    return { items: readCollection(user.id) };
  }
  const res = await fetch(withBase("/api/collection"));
  const data = await res.json();
  if (!res.ok) return { error: data.error, status: res.status };
  return { items: data.items };
}

export async function getCollectedSlug(
  slug: string,
): Promise<CollectionItem | null> {
  if (isStaticMode()) {
    const user = await authMe();
    if (!user) return null;
    return readCollection(user.id).find((i) => i.ideaSlug === slug) ?? null;
  }
  const res = await fetch(withBase(`/api/collection?slug=${encodeURIComponent(slug)}`));
  if (!res.ok) return null;
  const data = await res.json();
  return data.item ?? null;
}

export async function saveToCollection(input: {
  idea: StartupIdea;
  match?: IdeaMatch | null;
  profile?: UserProfile | null;
}): Promise<{ item?: CollectionItem; error?: string }> {
  if (isStaticMode()) {
    const user = await authMe();
    if (!user) return { error: "Login required." };
    const items = readCollection(user.id);
    const now = new Date().toISOString();
    const existing = items.find((i) => i.ideaSlug === input.idea.slug);
    const item: CollectionItem = {
      id: existing?.id ?? crypto.randomUUID(),
      userId: user.id,
      ideaSlug: input.idea.slug,
      idea: input.idea,
      match: input.match ?? existing?.match ?? null,
      profileSnapshot: input.profile ?? existing?.profileSnapshot ?? null,
      note: existing?.note ?? "",
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };
    const next = [item, ...items.filter((i) => i.ideaSlug !== input.idea.slug)];
    writeCollection(user.id, next);
    return { item };
  }
  const res = await fetch(withBase("/api/collection"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      slug: input.idea.slug,
      match: input.match ?? undefined,
      profile: input.profile ?? undefined,
    }),
  });
  const data = await res.json();
  if (!res.ok) return { error: data.error || "Could not save" };
  return { item: data.item };
}

export async function removeFromCollection(slug: string): Promise<{ error?: string }> {
  if (isStaticMode()) {
    const user = await authMe();
    if (!user) return { error: "Login required." };
    writeCollection(
      user.id,
      readCollection(user.id).filter((i) => i.ideaSlug !== slug),
    );
    return {};
  }
  const res = await fetch(withBase("/api/collection"), {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ slug }),
  });
  const data = await res.json();
  if (!res.ok) return { error: data.error || "Could not remove" };
  return {};
}

export async function runScanClient(): Promise<{
  inserted: number;
  updated: number;
  total: number;
} | null> {
  if (isStaticMode()) {
    const ideas = catalogIdeas();
    return { inserted: 0, updated: ideas.length, total: ideas.length };
  }
  try {
    const res = await fetch(withBase("/api/scan"), { method: "POST" });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}
