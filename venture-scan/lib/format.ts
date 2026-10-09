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
    Israel: "🇮🇱",
    Sweden: "🇸🇪",
    Indonesia: "🇮🇩",
    China: "🇨🇳",
    Netherlands: "🇳🇱",
    Kenya: "🇰🇪",
    Mexico: "🇲🇽",
    UAE: "🇦🇪",
  };
  return flags[country] ?? "🌐";
}
