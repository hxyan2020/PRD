import fs from "fs";
import path from "path";

const DOCS_DIR = path.join(process.cwd(), "docs");

export type DocLocale = "en" | "zh-Hant";

export type DocId = "TSD" | "PRD" | "USER_GUIDE" | "UAT" | "ECOSYSTEM" | "ROADMAP";

const DOC_FILES: Record<DocId, { en: string; "zh-Hant": string }> = {
  TSD: { en: "TSD.md", "zh-Hant": "TSD.zh-Hant.md" },
  PRD: { en: "PRD.md", "zh-Hant": "PRD.zh-Hant.md" },
  USER_GUIDE: { en: "USER_GUIDE.md", "zh-Hant": "USER_GUIDE.zh-Hant.md" },
  UAT: { en: "UAT.md", "zh-Hant": "UAT.zh-Hant.md" },
  ECOSYSTEM: { en: "ECOSYSTEM.md", "zh-Hant": "ECOSYSTEM.zh-Hant.md" },
  ROADMAP: { en: "ROADMAP.md", "zh-Hant": "ROADMAP.zh-Hant.md" },
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

/** Minimal Markdown → HTML for TSD (headings, lists, tables, code, bold, links). */
export function markdownToHtml(md: string): string {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const out: string[] = [];
  let inCode = false;
  let inUl = false;
  let inOl = false;
  let inTable = false;
  let tableRows: string[][] = [];

  const closeLists = () => {
    if (inUl) {
      out.push("</ul>");
      inUl = false;
    }
    if (inOl) {
      out.push("</ol>");
      inOl = false;
    }
  };

  const flushTable = () => {
    if (!inTable) return;
    if (tableRows.length) {
      const [head, ...body] = tableRows;
      out.push('<div class="overflow-x-auto my-3"><table class="w-full text-sm border-collapse">');
      out.push("<thead><tr>");
      for (const c of head) out.push(`<th class="border border-[var(--line)] bg-slate-50 px-2 py-1.5 text-left">${inline(c)}</th>`);
      out.push("</tr></thead><tbody>");
      for (const row of body) {
        // skip markdown separator row |---|
        if (row.every((c) => /^:?-{2,}:?$/.test(c.trim()))) continue;
        out.push("<tr>");
        for (const c of row) out.push(`<td class="border border-[var(--line)] px-2 py-1.5 align-top">${inline(c)}</td>`);
        out.push("</tr>");
      }
      out.push("</tbody></table></div>");
    }
    tableRows = [];
    inTable = false;
  };

  const inline = (s: string) =>
    s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/`([^`]+)`/g, '<code class="rounded bg-slate-100 px-1 text-[0.9em]">$1</code>')
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a class="underline" href="$2">$1</a>');

  function mermaidToHtml(src: string): string {
    const nodes = new Map<string, string>();
    const order: string[] = [];
    const dirMatch = /^\s*(?:graph|flowchart)\s+(LR|RL|TD|TB|BT)/im.exec(src);
    const dir = dirMatch?.[1] || "TD";
    const isH = dir === "LR" || dir === "RL";
    for (const raw of src.split("\n")) {
      const line = raw.trim();
      if (!line || /^(graph|flowchart)\b/i.test(line)) continue;
      const nodeRe = /([A-Za-z0-9_]+)(?:\[([^\]]+)\]|\(([^\)]+)\))/g;
      let m: RegExpExecArray | null;
      while ((m = nodeRe.exec(line))) {
        const id = m[1];
        const label = m[2] || m[3] || id;
        if (!nodes.has(id)) order.push(id);
        nodes.set(id, label);
      }
      const edgeRe = /([A-Za-z0-9_]+)\s*-+>\s*([A-Za-z0-9_]+)/g;
      while ((m = edgeRe.exec(line))) {
        if (!nodes.has(m[1])) {
          order.push(m[1]);
          nodes.set(m[1], m[1]);
        }
        if (!nodes.has(m[2])) {
          order.push(m[2]);
          nodes.set(m[2], m[2]);
        }
      }
    }
    const arrow = isH ? "→" : "↓";
    const wrap = isH ? "doc-flow-h" : "doc-flow-v";
    const items = order
      .map((id, i) => {
        const node = `<div class="doc-flow-node">${inline(nodes.get(id) || id)}</div>`;
        if (i === order.length - 1) return node;
        return `${node}<div class="doc-flow-arrow" aria-hidden="true">${arrow}</div>`;
      })
      .join("");
    return `<div class="doc-flow ${wrap}">${items}</div>`;
  }

  let mermaidBuf: string[] | null = null;

  for (const raw of lines) {
    const line = raw;

    if (line.startsWith("```")) {
      flushTable();
      closeLists();
      if (!inCode && mermaidBuf === null) {
        const lang = line.slice(3).trim().toLowerCase();
        if (lang === "mermaid") {
          mermaidBuf = [];
        } else {
          inCode = true;
          out.push('<pre class="my-3 overflow-x-auto rounded-lg bg-slate-900 text-slate-100 p-3 text-xs"><code>');
        }
      } else if (mermaidBuf) {
        out.push(mermaidToHtml(mermaidBuf.join("\n")));
        mermaidBuf = null;
      } else {
        inCode = false;
        out.push("</code></pre>");
      }
      continue;
    }
    if (mermaidBuf) {
      mermaidBuf.push(line);
      continue;
    }
    if (inCode) {
      out.push(`${line.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}\n`);
      continue;
    }

    if (/^\|/.test(line) && /\|$/.test(line.trim()) || /^\|/.test(line)) {
      closeLists();
      const cells = line
        .trim()
        .replace(/^\|/, "")
        .replace(/\|$/, "")
        .split("|")
        .map((c) => c.trim());
      if (!inTable) inTable = true;
      tableRows.push(cells);
      continue;
    } else {
      flushTable();
    }

    if (/^---+$/.test(line.trim())) {
      closeLists();
      out.push('<hr class="my-6 border-[var(--line)]" />');
      continue;
    }

    const h = /^(#{1,4})\s+(.*)$/.exec(line);
    if (h) {
      closeLists();
      const level = h[1].length;
      const id = h[2]
        .toLowerCase()
        .replace(/[^a-z0-9\u4e00-\u9fff]+/gi, "-")
        .replace(/^-|-$/g, "");
      const cls =
        level === 1
          ? "font-[family-name:var(--font-display)] text-3xl mt-2 mb-4"
          : level === 2
            ? "font-[family-name:var(--font-display)] text-2xl mt-8 mb-3"
            : level === 3
              ? "text-lg font-semibold mt-6 mb-2"
              : "text-base font-semibold mt-4 mb-1";
      out.push(`<h${level} id="${id}" class="${cls}">${inline(h[2])}</h${level}>`);
      continue;
    }

    if (/^[-*]\s+/.test(line)) {
      if (inOl) {
        out.push("</ol>");
        inOl = false;
      }
      if (!inUl) {
        out.push('<ul class="list-disc pl-5 my-2 space-y-1 text-sm">');
        inUl = true;
      }
      out.push(`<li>${inline(line.replace(/^[-*]\s+/, ""))}</li>`);
      continue;
    }

    if (/^\d+\.\s+/.test(line)) {
      if (inUl) {
        out.push("</ul>");
        inUl = false;
      }
      if (!inOl) {
        out.push('<ol class="list-decimal pl-5 my-2 space-y-1 text-sm">');
        inOl = true;
      }
      out.push(`<li>${inline(line.replace(/^\d+\.\s+/, ""))}</li>`);
      continue;
    }

    closeLists();

    if (!line.trim()) {
      out.push("");
      continue;
    }

    out.push(`<p class="text-sm leading-relaxed my-2">${inline(line)}</p>`);
  }

  flushTable();
  closeLists();
  if (mermaidBuf) out.push(mermaidToHtml(mermaidBuf.join("\n")));
  if (inCode) out.push("</code></pre>");
  return out.join("\n");
}
