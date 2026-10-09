import type { DataSource } from "./data-sources";
import manifestJson from "../public/source-media/manifest.json";

export type SourceMediaEntry = {
  id: string;
  name: string;
  file: string;
  kind: "og" | "icon" | "favicon" | "logo-fallback" | string;
  bytes: number;
  imageUrl?: string | null;
  contentType?: string | null;
};

const MANIFEST = manifestJson as Record<string, SourceMediaEntry>;

/** Public path (without basePath) for a source's extracted media tile. */
export function sourceMediaPublicPath(sourceId: string): string | null {
  const entry = MANIFEST[sourceId];
  if (entry?.file) return `/source-media/${entry.file}`;
  return `/logos/${sourceId}.png`;
}

export function sourceMediaEntry(sourceId: string): SourceMediaEntry | null {
  return MANIFEST[sourceId] ?? null;
}

export type IdeaSourceMediaItem = {
  source: DataSource;
  mediaPath: string;
  mediaKind: string;
};

/** Pair related sources with their extracted brand/OG images for dossier galleries. */
export function attachMediaToSources(sources: DataSource[]): IdeaSourceMediaItem[] {
  return sources.map((source) => {
    const entry = sourceMediaEntry(source.id);
    return {
      source,
      mediaPath: sourceMediaPublicPath(source.id) ?? `/logos/${source.id}.png`,
      mediaKind: entry?.kind ?? "logo-fallback",
    };
  });
}

export function sourceMediaManifestSize(): number {
  return Object.keys(MANIFEST).length;
}
