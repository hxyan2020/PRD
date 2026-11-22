/** Resolve hosted official mark for an LP (seeded under /public/logos). */
export function lpLogoSrc(lp: { slug: string; logoUrl?: string; website?: string }): string {
  if (lp.logoUrl) return lp.logoUrl;
  return `/logos/${lp.slug}.png`;
}

export function lpInitials(name: string): string {
  const parts = name.trim().split(/[\s._-]+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase() || "?";
}
