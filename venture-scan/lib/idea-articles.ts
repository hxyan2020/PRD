import { DATA_SOURCES, type DataSource } from "./data-sources";
import manifestJson from "../public/idea-articles/manifest.json";

export type IdeaArticle = {
  id: string;
  title: string;
  /** Specific article URL (never a desk homepage). */
  url: string;
  sourceId: string;
  excerpt: string;
  imageFile: string;
  /** Public path without basePath, e.g. /idea-articles/slug/00.jpg */
  imagePath: string;
  imageKind: string;
  bytes: number;
};

export type IdeaArticleCard = IdeaArticle & {
  source: DataSource | null;
  sourceName: string;
};

const MANIFEST = manifestJson as Record<string, IdeaArticle[]>;

export function articlesForIdea(slug: string, limit = 6): IdeaArticle[] {
  const rows = MANIFEST[slug] ?? [];
  return rows.slice(0, limit);
}

export function articleCardsForIdea(slug: string, limit = 6): IdeaArticleCard[] {
  return articlesForIdea(slug, limit).map((article) => {
    const source = DATA_SOURCES.find((s) => s.id === article.sourceId) ?? null;
    return {
      ...article,
      source,
      sourceName: source?.name ?? article.sourceId,
    };
  });
}

export function ideaArticleCount(slug: string): number {
  return (MANIFEST[slug] ?? []).length;
}

export function ideaArticleManifestSize(): number {
  return Object.values(MANIFEST).reduce((n, rows) => n + rows.length, 0);
}

/** Flat list of article citations for Q&A / chatbot. */
export function articleCitationsForIdea(
  slug: string,
  limit = 3,
  t?: (key: "ideaChat.cite.articleDetail", vars?: Record<string, string | number>) => string,
) {
  return articleCardsForIdea(slug, limit).map((a) => ({
    id: a.id,
    label: a.title,
    url: a.url,
    detail: t
      ? t("ideaChat.cite.articleDetail", { source: a.sourceName })
      : `${a.sourceName} · article image embedded`,
    kind: "wire" as const,
  }));
}
