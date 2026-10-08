import type { CatalogItem } from "../types/catalog";

/** Resolve the mark image URL for a catalogue item (local SVG under site base). */
export function markUrl(item: CatalogItem): string | null {
  if (item.mark) {
    return `${import.meta.env.BASE_URL}${item.mark.replace(/^\//, "")}`;
  }
  // Convention path even if older catalog JSON lacks mark field
  return `${import.meta.env.BASE_URL}marks/${item.id}.svg`;
}
