import type { MessageKey } from "./i18n/messages";
import type { GoForwardStrategy, SocialPlatform } from "./types";

export function formatMoney(usd?: number): string {
  if (usd == null) return "—";
  if (usd >= 1_000_000_000) return `$${(usd / 1_000_000_000).toFixed(1)}B`;
  if (usd >= 1_000_000) return `$${(usd / 1_000_000).toFixed(1)}M`;
  if (usd >= 1_000) return `$${(usd / 1_000).toFixed(0)}K`;
  return `$${usd}`;
}

export function strategyMessageKey(strategy: GoForwardStrategy): MessageKey {
  const map: Record<GoForwardStrategy, MessageKey> = {
    localize_asia: "strategy.localize_asia",
    new_age_group: "strategy.new_age_group",
    partner_founders: "strategy.partner_founders",
    franchise_local: "strategy.franchise_local",
    license_tech: "strategy.license_tech",
    vertical_spinout: "strategy.vertical_spinout",
    b2b_pivot: "strategy.b2b_pivot",
  };
  return map[strategy];
}

/** English fallback for non-UI contexts (Q&A, tests). Prefer strategyMessageKey + t() in UI. */
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

export function relativeTime(
  iso: string,
  now = Date.now(),
  t?: (key: MessageKey, vars?: Record<string, string | number>) => string,
): string {
  const ageMs = now - new Date(iso).getTime();
  if (!Number.isFinite(ageMs)) return "—";
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (ageMs < minute) return t ? t("time.justNow") : "just now";
  if (ageMs < hour) {
    const count = Math.floor(ageMs / minute);
    return t ? t("time.minutesAgo", { count }) : `${count}m ago`;
  }
  if (ageMs < day) {
    const count = Math.floor(ageMs / hour);
    return t ? t("time.hoursAgo", { count }) : `${count}h ago`;
  }
  if (ageMs < 30 * day) {
    const count = Math.floor(ageMs / day);
    return t ? t("time.daysAgo", { count }) : `${count}d ago`;
  }
  return new Date(iso).toISOString().slice(0, 10);
}
