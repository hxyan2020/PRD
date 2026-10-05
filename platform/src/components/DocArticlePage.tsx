import { readDocMarkdown, type DocId } from "@/lib/docs";
import { DocArticleView } from "@/components/DocArticleView";

export function DocArticlePage({ docId }: { docId: DocId; langParam?: string | null }) {
  return (
    <DocArticleView
      docId={docId}
      markdownEn={readDocMarkdown(docId, "en")}
      markdownZh={readDocMarkdown(docId, "zh-Hant")}
    />
  );
}
