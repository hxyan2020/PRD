import type { GoForwardStrategy, SocialPlatform } from "./types";

export function formatMoney(usd?: number): string {
  if (usd == null) return "—";
  if (usd >= 1_000_000_000) return `$${(usd / 1_000_000_000).toFixed(1)}B`;
  if (usd >= 1_000_000) return `$${(usd / 1_000_000).toFixed(1)}M`;
  if (usd >= 1_000) return `$${(usd / 1_000).toFixed(0)}K`;
  return `$${usd}`;
}

export function strategyLabel(strategy: GoForwardStrategy): string {
  const map: Record<GoForwardStrategy, string> = {
    localize_asia: "Localize for Asian markets",
    new_age_group: "Retarget a different age group",
    partner_founders: "Ask founding team for cooperation",
    franchise_local: "Franchise in your city / country",
    license_tech: "License the underlying tech",
    vertical_spinout: "Spin out a vertical niche",
    b2b_pivot: "Offer as B2B to incumbents",
  };
  return map[strategy];
}

export function socialLabel(platform: SocialPlatform): string {
  const map: Record<SocialPlatform, string> = {
    x: "X",
    instagram: "Instagram",
    xiaohongshu: "Xiaohongshu",
    linkedin: "LinkedIn",
    tiktok: "TikTok",
    youtube: "YouTube",
  };
  return map[platform];
}

export function countryFlag(country: string): string {
  const flags: Record<string, string> = {
    "United States": "🇺🇸",
    "United Kingdom": "🇬🇧",
    Singapore: "🇸🇬",
    Germany: "🇩🇪",
    India: "🇮🇳",
    Japan: "🇯🇵",
    Brazil: "🇧🇷",
    Canada: "🇨🇦",
    France: "🇫🇷",
    Nigeria: "🇳🇬",
    "South Korea": "🇰🇷",
    Australia: "🇦🇺",
    "New Zealand": "🇳🇿",
    Israel: "🇮🇱",
    Sweden: "🇸🇪",
    Denmark: "🇩🇰",
    Finland: "🇫🇮",
    Norway: "🇳🇴",
    Iceland: "🇮🇸",
    Indonesia: "🇮🇩",
    China: "🇨🇳",
    "Hong Kong": "🇭🇰",
    Taiwan: "🇹🇼",
    Netherlands: "🇳🇱",
    Kenya: "🇰🇪",
    Mexico: "🇲🇽",
    UAE: "🇦🇪",
    "United Arab Emirates": "🇦🇪",
    Spain: "🇪🇸",
    Italy: "🇮🇹",
    Portugal: "🇵🇹",
    Poland: "🇵🇱",
    Belgium: "🇧🇪",
    Switzerland: "🇨🇭",
    Austria: "🇦🇹",
    Morocco: "🇲🇦",
    Senegal: "🇸🇳",
    "South Africa": "🇿🇦",
    Egypt: "🇪🇬",
    Ghana: "🇬🇭",
    Rwanda: "🇷🇼",
    "Saudi Arabia": "🇸🇦",
    Jordan: "🇯🇴",
    Lebanon: "🇱🇧",
    Colombia: "🇨🇴",
    Chile: "🇨🇱",
    Argentina: "🇦🇷",
    Peru: "🇵🇪",
    Uruguay: "🇺🇾",
    Turkey: "🇹🇷",
    Romania: "🇷🇴",
    Bulgaria: "🇧🇬",
    Greece: "🇬🇷",
    Vietnam: "🇻🇳",
    Thailand: "🇹🇭",
    Malaysia: "🇲🇾",
    Philippines: "🇵🇭",
  };
  return flags[country] ?? "🌐";
}

export function relativeTime(iso: string, now = Date.now()): string {
  const ageMs = now - new Date(iso).getTime();
  if (!Number.isFinite(ageMs)) return "—";
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (ageMs < minute) return "just now";
  if (ageMs < hour) return `${Math.floor(ageMs / minute)}m ago`;
  if (ageMs < day) return `${Math.floor(ageMs / hour)}h ago`;
  if (ageMs < 30 * day) return `${Math.floor(ageMs / day)}d ago`;
  return new Date(iso).toISOString().slice(0, 10);
}
