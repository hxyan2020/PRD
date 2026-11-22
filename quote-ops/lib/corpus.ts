import type { KnowledgeChunk } from "@/lib/types";
import type { KbNode } from "@/lib/kb/types";
import { listNodes } from "@/lib/kb/repo";

export function nodeToChunk(n: KbNode): KnowledgeChunk {
  return {
    id: n.id,
    title: n.titleEn || n.titleZh,
    titleZh: n.titleZh || n.titleEn,
    section: n.kind,
    sectionZh: n.kind,
    kind:
      n.kind === "risk"
        ? "risk"
        : n.kind === "skill"
          ? "skill"
          : n.kind === "pipeline"
            ? "pipeline"
            : n.kind === "database"
              ? "database"
              : n.kind === "folder"
                ? "article"
                : "article",
    body: `${n.summaryEn}\n\n${n.bodyEn}`,
    bodyZh: `${n.summaryZh}\n\n${n.bodyZh}`,
    tags: [...n.tags, n.kind, n.slug, n.status],
    href: n.kind === "folder" ? `/tree#${n.id}` : `/kb/${n.slug}`,
  };
}

export async function buildCorpusAsync(): Promise<KnowledgeChunk[]> {
  const nodes = await listNodes({ status: "published" });
  return nodes.filter((n) => n.kind !== "folder" || n.bodyZh || n.summaryZh).map(nodeToChunk);
}

/** Sync fallback used only in unit tests that import static corpus helpers. */
export function buildCorpus(): KnowledgeChunk[] {
  // Tests still cover retrieve() via buildCorpusAsync path after API change;
  // keep a minimal sync stub for backward compatibility.
  return [];
}
