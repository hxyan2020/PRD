/** Named platform / documentation owner shown across CRMP Admin. */
export const PLATFORM_OWNER = {
  name: "YAN Haixiang",
  email: "yan.haixiang@vantagemarkets.com",
  githubEmail: "hxyan.2015@gmail.com",
  password: "yan123",
  role_code: "SUPER_ADMIN" as const,
  department_code: "RISK_CONTROL" as const,
  titleEn: "Docs & platform owner",
  titleZh: "文件與平台負責人",
};

export function ownerLine(locale: "en" | "zh-Hant" = "en") {
  return locale === "zh-Hant"
    ? `${PLATFORM_OWNER.titleZh}：${PLATFORM_OWNER.name}`
    : `${PLATFORM_OWNER.titleEn}: ${PLATFORM_OWNER.name}`;
}

export function ownerBadgeLabel(locale: "en" | "zh-Hant" = "en") {
  return locale === "zh-Hant"
    ? `${PLATFORM_OWNER.titleZh} ${PLATFORM_OWNER.name}`
    : `${PLATFORM_OWNER.titleEn} ${PLATFORM_OWNER.name}`;
}
