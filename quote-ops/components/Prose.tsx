"use client";

import { renderMarkdown } from "@/lib/kb/format";

export function Prose({ markdown }: { markdown: string }) {
  const html = renderMarkdown(markdown);
  return (
    <div
      className="prose-kb"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

export function PageHero({
  eyebrow,
  title,
  summary,
  meta,
}: {
  eyebrow?: string;
  title: string;
  summary?: string;
  meta?: React.ReactNode;
}) {
  return (
    <header className="border-b border-line/80 pb-5">
      {eyebrow && (
        <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.2em] text-sea">{eyebrow}</p>
      )}
      <h1 className="font-display text-3xl leading-tight text-ink sm:text-4xl">{title}</h1>
      {summary && (
        <p className="mt-3 max-w-3xl text-base leading-relaxed text-mist sm:text-[17px]">{summary}</p>
      )}
      {meta && <div className="mt-4 flex flex-wrap gap-2 text-xs text-mist">{meta}</div>}
    </header>
  );
}
