import manifestJson from "../public/idea-photos/manifest.json";

export type IdeaPhoto = {
  id: string;
  file: string;
  /** Public path without basePath, e.g. /idea-photos/slug/00.jpg */
  imagePath: string;
  kind: string;
  caption: string;
  sourceUrl: string | null;
  sourceLabel: string;
  bytes: number;
};

const MANIFEST = manifestJson as Record<string, IdeaPhoto[]>;

/** Return 1–9 album photos for an idea (empty if none extracted yet). */
export function photosForIdea(slug: string, limit = 9): IdeaPhoto[] {
  const rows = MANIFEST[slug] ?? [];
  return rows.slice(0, Math.min(9, Math.max(0, limit)));
}

export function ideaPhotoCount(slug: string): number {
  return (MANIFEST[slug] ?? []).length;
}

export function ideaPhotoManifestSize(): number {
  return Object.values(MANIFEST).reduce((n, rows) => n + rows.length, 0);
}

export function ideaPhotoCoverage(): { total: number; withPhotos: number } {
  const slugs = Object.keys(MANIFEST);
  return {
    total: slugs.length,
    withPhotos: slugs.filter((s) => (MANIFEST[s] ?? []).length >= 1).length,
  };
}
