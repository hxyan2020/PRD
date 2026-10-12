import type { Catalog, CatalogCategory, CatalogItem } from "../types/catalog";

let cached: Catalog | null = null;

export async function loadCatalog(): Promise<Catalog> {
  if (cached) return cached;
  const res = await fetch(`${import.meta.env.BASE_URL}data/catalog.json`);
  if (!res.ok) throw new Error(`Failed to load catalogue (${res.status})`);
  cached = (await res.json()) as Catalog;
  return cached;
}

export function clearCatalogCache() {
  cached = null;
}

export function getCategory(
  catalog: Catalog,
  categoryId: string,
): CatalogCategory | undefined {
  return catalog.categories.find((c) => c.id === categoryId);
}

export function itemsForCategory(
  catalog: Catalog,
  categoryId: string,
): CatalogItem[] {
  return catalog.items
    .filter((it) => it.categoryId === categoryId && it.status !== "removed")
    .sort((a, b) => a.sort - b.sort || a.name.localeCompare(b.name));
}

export function findItem(
  catalog: Catalog,
  itemId: string,
): CatalogItem | undefined {
  return catalog.items.find((it) => it.id === itemId);
}

export function searchItems(
  catalog: Catalog,
  query: string,
  categoryIds?: string[],
): CatalogItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return catalog.items.filter((it) => {
    if (it.status === "removed") return false;
    if (categoryIds?.length && !categoryIds.includes(it.categoryId)) return false;
    const hay = [it.name, ...it.aliases, ...it.tags, it.origin ?? ""]
      .join(" ")
      .toLowerCase();
    return hay.includes(q);
  });
}

export function coverGradient(hue: number, unlocked: boolean): string {
  if (!unlocked) {
    return `linear-gradient(145deg, hsl(${hue} 6% 28%), hsl(${hue} 4% 14%))`;
  }
  return `linear-gradient(145deg, hsl(${hue} 72% 52%), hsl(${(hue + 48) % 360} 68% 38%), hsl(${(hue + 20) % 360} 55% 28%))`;
}
