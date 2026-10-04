import { markdownToHtml, readDocMarkdown, type DocId } from "@/lib/docs";
import { DocArticleView } from "@/components/DocArticleView";

export function DocArticlePage({ docId }: { docId: DocId; langParam?: string | null }) {
  const htmlEn = markdownToHtml(readDocMarkdown(docId, "en"));
  const htmlZh = markdownToHtml(readDocMarkdown(docId, "zh-Hant"));
  return <DocArticleView docId={docId} htmlEn={htmlEn} htmlZh={htmlZh} />;
}
