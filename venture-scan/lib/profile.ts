import type { UserProfile } from "./types";

export const PROFILE_STORAGE_KEY = "venturescan.profile.v1";

export function emptyProfile(): UserProfile {
  return {
    id: cryptoRandomId(),
    displayName: "",
    skills: [],
    major: "",
    currentBusiness: "",
    interestedDomains: [],
    preferredMarkets: [],
    notes: "",
    updatedAt: new Date().toISOString(),
  };
}

export function isProfileReady(profile: UserProfile | null | undefined): boolean {
  if (!profile) return false;
  return (
    profile.skills.length > 0 ||
    Boolean(profile.major.trim()) ||
    Boolean(profile.currentBusiness.trim()) ||
    profile.interestedDomains.length > 0
  );
}

export function parseListInput(raw: string): string[] {
  return raw
    .split(/[,;/|]+|\band\b/gi)
    .map((s) => s.trim())
    .filter(Boolean)
    .filter((v, i, arr) => arr.findIndex((x) => x.toLowerCase() === v.toLowerCase()) === i);
}

export function loadProfileFromStorage(): UserProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as UserProfile;
    if (!parsed || typeof parsed !== "object") return null;
    return {
      ...emptyProfile(),
      ...parsed,
      skills: Array.isArray(parsed.skills) ? parsed.skills : [],
      interestedDomains: Array.isArray(parsed.interestedDomains)
        ? parsed.interestedDomains
        : [],
      preferredMarkets: Array.isArray(parsed.preferredMarkets)
        ? parsed.preferredMarkets
        : [],
    };
  } catch {
    return null;
  }
}

export function saveProfileToStorage(profile: UserProfile): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    PROFILE_STORAGE_KEY,
    JSON.stringify({ ...profile, updatedAt: new Date().toISOString() }),
  );
}

export function clearProfileStorage(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(PROFILE_STORAGE_KEY);
}

function cryptoRandomId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `profile_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}
