import type { CatalogItem } from "../types/catalog";
import { isNatureCategory } from "./nature";

function resolveAsset(path: string): string {
  if (
    path.startsWith("data:") ||
    path.startsWith("https://") ||
    path.startsWith("http://") ||
    path.startsWith("blob:")
  ) {
    return path;
  }
  return `${import.meta.env.BASE_URL}${path.replace(/^\//, "")}`;
}

/** Resolve the mark image URL for a catalogue item (local SVG, remote, or data URL). */
export function markUrl(item: CatalogItem): string | null {
  if (item.mark) return resolveAsset(item.mark);
  // Convention path even if older catalog JSON lacks mark field
  return `${import.meta.env.BASE_URL}marks/${item.id}.svg`;
}

/**
 * Resolve realistic cover photo URL.
 * Nature shelves also try the conventional covers/{id}.jpg path so newly
 * fetched species photos appear before the next catalog rewrite.
 */
export function coverUrl(item: CatalogItem): string | null {
  if (item.cover) return resolveAsset(item.cover);
  if (isNatureCategory(item.categoryId)) {
    return `${import.meta.env.BASE_URL}covers/${item.id}.jpg`;
  }
  return null;
}
