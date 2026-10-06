import fs from "fs";
import path from "path";

const DOCS_DIR = path.join(process.cwd(), "docs");

export type DocLocale = "en" | "zh-Hant";

export type DocId =
  | "TSD"
  | "PRD"
  | "USER_GUIDE"
  | "AI_USE"
  | "UAT"
  | "ECOSYSTEM"
  | "ROADMAP"
  | "OPEN_ISSUES"
  | "PROGRESS";

export { markdownToHtml } from "./docs-markdown";

const DOC_FILES: Record<DocId, { en: string; "zh-Hant": string }> = {
  TSD: { en: "TSD.md", "zh-Hant": "TSD.zh-Hant.md" },
  PRD: { en: "PRD.md", "zh-Hant": "PRD.zh-Hant.md" },
  USER_GUIDE: { en: "USER_GUIDE.md", "zh-Hant": "USER_GUIDE.zh-Hant.md" },
  AI_USE: { en: "AI_USE.md", "zh-Hant": "AI_USE.zh-Hant.md" },
  UAT: { en: "UAT.md", "zh-Hant": "UAT.zh-Hant.md" },
  ECOSYSTEM: { en: "ECOSYSTEM.md", "zh-Hant": "ECOSYSTEM.zh-Hant.md" },
  ROADMAP: { en: "ROADMAP.md", "zh-Hant": "ROADMAP.zh-Hant.md" },
  OPEN_ISSUES: { en: "OPEN_ISSUES.md", "zh-Hant": "OPEN_ISSUES.zh-Hant.md" },
  PROGRESS: { en: "PROGRESS.md", "zh-Hant": "PROGRESS.zh-Hant.md" },
};

export function resolveDocLocale(raw?: string | null): DocLocale {
  const v = (raw || "en").toLowerCase();
  if (v === "zh-hant" || v === "zh-tw" || v === "zh" || v === "zh_hant") return "zh-Hant";
  return "en";
}

export function readDocMarkdown(docId: DocId, locale: DocLocale): string {
  const file = DOC_FILES[docId][locale];
  const full = path.join(DOCS_DIR, file);
  if (!fs.existsSync(full)) {
    return `# ${docId} missing\n\nExpected file at \`${file}\`.`;
  }
  return fs.readFileSync(full, "utf8");
}

export function readTsdMarkdown(locale: DocLocale): string {
  return readDocMarkdown("TSD", locale);
}
