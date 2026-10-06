/**
 * Public site identity for this upgraded CRMP platform.
 *
 * Original CRMP Admin stays frozen at `/PRD/crmp-admin/`.
 * Future requirements for this desk land only on CRMP Plus (`/PRD/crmp-plus/`).
 */

export const PAGES_HOST = "https://hxyan2020.github.io";

/** GitHub Pages folder for this upgraded platform. */
export const PLATFORM_SLUG = "crmp-plus";

/** Frozen original CRMP Admin snapshot — do not publish this codebase there. */
export const ORIGINAL_CRMP_SLUG = "crmp-admin";

export const DEFAULT_BASE_PATH = `/PRD/${PLATFORM_SLUG}`;
export const ORIGINAL_CRMP_BASE_PATH = `/PRD/${ORIGINAL_CRMP_SLUG}`;

export const PLATFORM_NAME_EN = "CRMP Plus";
export const PLATFORM_NAME_ZH = "CRMP Plus";
export const PLATFORM_TITLE_EN = "Vantage CRMP Plus";
export const PLATFORM_TITLE_ZH = "Vantage CRMP Plus";

export const PUBLIC_ADMIN_ORIGIN = `${PAGES_HOST}${DEFAULT_BASE_PATH}`;
export const PUBLIC_ADMIN_URL = `${PUBLIC_ADMIN_ORIGIN}/admin/`;
export const PUBLIC_MESSENGER_URL = `${PUBLIC_ADMIN_ORIGIN}/admin/messenger/`;
export const PUBLIC_CS_DESK_URL = `${PUBLIC_ADMIN_ORIGIN}/admin/cs-desk/`;
export const PUBLIC_CS_DASHBOARD_URL = `${PUBLIC_ADMIN_ORIGIN}/admin/cs-dashboard/`;
export const PUBLIC_CS_LOG_URL = `${PUBLIC_ADMIN_ORIGIN}/admin/cs-log/`;
export const PUBLIC_CS_DATA_URL = `${PUBLIC_ADMIN_ORIGIN}/admin/cs-data/`;
export const PUBLIC_CS_PORTAL_URL = `${PUBLIC_ADMIN_ORIGIN}/cs/`;

export const ORIGINAL_CRMP_ORIGIN = `${PAGES_HOST}${ORIGINAL_CRMP_BASE_PATH}`;
export const ORIGINAL_CRMP_ADMIN_URL = `${ORIGINAL_CRMP_ORIGIN}/admin/`;
export const ORIGINAL_CRMP_MESSENGER_URL = `${ORIGINAL_CRMP_ORIGIN}/admin/messenger/`;

export function isPlatformBasePath(pathname: string) {
  return pathname.includes(DEFAULT_BASE_PATH) || pathname.includes(ORIGINAL_CRMP_BASE_PATH);
}
