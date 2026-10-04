/** Named platform / documentation owner shown across CRMP Admin. */
export const PLATFORM_OWNER = {
  name: "YAN Haixiang",
  email: "yan.haixiang@vantagemarkets.com",
  password: "yan123",
  role_code: "SUPER_ADMIN" as const,
  department_code: "RISK_CONTROL" as const,
  titleEn: "Platform owner",
  titleZh: "平台負責人",
};

export function ownerLine(locale: "en" | "zh-Hant" = "en") {
  return locale === "zh-Hant"
    ? `文件與平台負責人：${PLATFORM_OWNER.name}`
    : `Docs & platform owner: ${PLATFORM_OWNER.name}`;
}
