/** Named platform / documentation owner shown across CRMP Plus. */
export const PLATFORM_OWNER = {
  name: "demo platform owner",
  email: "haixiang.yan@hytechc.com",
  /** Login alias (GitHub / Cursor chip) — not shown on the owner card. */
  githubEmail: "hxyan.2015@gmail.com",
  password: "yan123",
  role_code: "SUPER_ADMIN" as const,
  department_code: "RISK_CONTROL" as const,
  titleEn: "Demo platform owner",
  titleZh: "示範平台負責人",
};

/** Previous primary emails still accepted at login and migrated in SQLite. */
export const FORMER_OWNER_EMAILS = ["yan.haixiang@vantagemarkets.com"] as const;

export function ownerEmails(): string[] {
  const set = new Set<string>([
    PLATFORM_OWNER.email.toLowerCase(),
    PLATFORM_OWNER.githubEmail.toLowerCase(),
    ...FORMER_OWNER_EMAILS.map((e) => e.toLowerCase()),
  ]);
  return [...set];
}

export function ownerLine(locale: "en" | "zh-Hant" = "en") {
  const title = locale === "zh-Hant" ? PLATFORM_OWNER.titleZh : PLATFORM_OWNER.titleEn;
  return `${title} · ${PLATFORM_OWNER.email}`;
}

export function ownerBadgeLabel(locale: "en" | "zh-Hant" = "en") {
  return locale === "zh-Hant" ? PLATFORM_OWNER.titleZh : PLATFORM_OWNER.titleEn;
}
