/** Nature mega-shelves that use species photos + always-visible names. */
export const NATURE_CATEGORY_IDS = [
  "trees",
  "flowers",
  "animals",
  "birds",
  "mushrooms",
] as const;

export type NatureCategoryId = (typeof NATURE_CATEGORY_IDS)[number];

export function isNatureCategory(categoryId: string): boolean {
  return (NATURE_CATEGORY_IDS as readonly string[]).includes(categoryId);
}
