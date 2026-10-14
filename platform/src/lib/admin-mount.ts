/** Parallel admin mounts. Canonical desk stays at `/admin`; crypto desk at `/exchange`. */

export const ADMIN_MOUNT = "/admin" as const;
export const EXCHANGE_MOUNT = "/exchange" as const;

export type AdminMountBase = typeof ADMIN_MOUNT | typeof EXCHANGE_MOUNT;

/** Map a canonical `/admin…` path onto a mount (e.g. `/exchange/alerts`). */
export function toMountHref(adminHref: string, mount: AdminMountBase = EXCHANGE_MOUNT): string {
  if (!adminHref) return mount;
  if (adminHref === ADMIN_MOUNT || adminHref === `${ADMIN_MOUNT}/`) return mount;
  if (adminHref.startsWith(`${ADMIN_MOUNT}/`)) {
    return `${mount}${adminHref.slice(ADMIN_MOUNT.length)}`;
  }
  if (adminHref.startsWith(`${mount}/`) || adminHref === mount) return adminHref;
  return adminHref;
}

/** Map any mount path back to the canonical `/admin…` key (nav badges, i18n). */
export function toAdminHref(href: string): string {
  if (!href) return ADMIN_MOUNT;
  if (href === EXCHANGE_MOUNT || href === `${EXCHANGE_MOUNT}/`) return ADMIN_MOUNT;
  if (href.startsWith(`${EXCHANGE_MOUNT}/`)) {
    return `${ADMIN_MOUNT}${href.slice(EXCHANGE_MOUNT.length)}`;
  }
  return href;
}

/** Rewrite `/admin…` targets that appear inside the exchange mount. */
export function rewriteAdminTarget(href: string, mount: AdminMountBase = EXCHANGE_MOUNT): string {
  if (!href || /^(https?:|mailto:|tel:|#)/i.test(href)) return href;
  const path = href.startsWith("/") ? href : `/${href}`;
  if (path === ADMIN_MOUNT || path.startsWith(`${ADMIN_MOUNT}/`) || path.startsWith(`${ADMIN_MOUNT}?`)) {
    const q = path.indexOf("?");
    const hash = path.indexOf("#");
    let cut = path.length;
    if (q >= 0) cut = Math.min(cut, q);
    if (hash >= 0) cut = Math.min(cut, hash);
    const base = path.slice(0, cut);
    const rest = path.slice(cut);
    return `${toMountHref(base, mount)}${rest}`;
  }
  return href;
}
