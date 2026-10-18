/**
 * Build a standalone, copy-friendly HTML document of notebook notes.
 * Images stay embedded as data URLs so they travel with the file and can be
 * saved / copied from the browser.
 */

import type { NotebookCategory, NotebookEntry } from '../hooks/useNotebook'
import { htmlToPlainText, renderNoteHtml, sanitizeHtml } from './sanitizeHtml'

export type PublicHtmlOptions = {
  title?: string
  lang?: 'en' | 'zh'
  generatedAt?: string
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function formatWhen(iso: string, lang: 'en' | 'zh'): string {
  try {
    return new Intl.DateTimeFormat(lang === 'zh' ? 'zh-CN' : undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(iso))
  } catch {
    return iso
  }
}

function noteHeading(entry: NotebookEntry): string {
  const title = entry.title?.trim()
  if (title) return title
  const plain = htmlToPlainText(entry.selectedText).replace(/\s+/g, ' ').trim()
  if (plain) return plain.slice(0, 80) + (plain.length > 80 ? '…' : '')
  if (/<img\b/i.test(entry.selectedText)) return 'Image note'
  return 'Untitled note'
}

/** Enrich note HTML: keep images, add save links under each image for easy copy/download. */
export function enrichNoteHtmlForCopy(html: string): string {
  if (typeof document === 'undefined') return sanitizeHtml(html)
  const template = document.createElement('template')
  template.innerHTML = renderNoteHtml(html)
  let imageIndex = 0
  template.content.querySelectorAll('img').forEach((img) => {
    imageIndex += 1
    const src = img.getAttribute('src') || ''
    img.setAttribute('loading', 'eager')
    img.setAttribute('decoding', 'sync')
    img.setAttribute('draggable', 'true')
    img.style.maxWidth = '100%'
    img.style.height = 'auto'
    img.style.display = 'block'
    img.style.margin = '0.75rem 0'
    img.style.borderRadius = '6px'
    img.style.cursor = 'zoom-in'
    img.setAttribute('alt', img.getAttribute('alt') || `Note image ${imageIndex}`)

    if (!src) return
    const wrap = document.createElement('figure')
    wrap.className = 'ownlab-export-figure'
    wrap.style.margin = '1rem 0'
    img.replaceWith(wrap)
    wrap.appendChild(img)

    const actions = document.createElement('figcaption')
    actions.className = 'ownlab-export-img-actions'
    const link = document.createElement('a')
    link.href = src
    link.download = `ownlab-note-image-${imageIndex}.${guessExt(src)}`
    link.textContent = `Save image ${imageIndex}`
    link.setAttribute('target', '_blank')
    link.setAttribute('rel', 'noreferrer')
    actions.appendChild(link)
    const hint = document.createElement('span')
    hint.textContent = ' · right-click image → Copy image'
    hint.style.opacity = '0.7'
    actions.appendChild(hint)
    wrap.appendChild(actions)
  })
  return template.innerHTML
}

function guessExt(src: string): string {
  const match = /^data:image\/([\w+.-]+);/i.exec(src)
  if (!match) return 'png'
  const raw = match[1].toLowerCase()
  if (raw === 'jpeg') return 'jpg'
  if (raw === 'svg+xml') return 'svg'
  return raw.replace(/[^a-z0-9]/g, '') || 'png'
}

function categoryNames(
  entry: NotebookEntry,
  categories: NotebookCategory[],
): string[] {
  const map = new Map(categories.map((c) => [c.id, c.name]))
  return (entry.categoryIds ?? []).map((id) => map.get(id) || id).filter(Boolean)
}

/**
 * Fully self-contained HTML document (inline CSS, embedded images).
 * Safe to host publicly, email, or open offline.
 */
export function buildPublicNotesHtml(
  entries: NotebookEntry[],
  categories: NotebookCategory[] = [],
  options: PublicHtmlOptions = {},
): string {
  const lang = options.lang ?? 'en'
  const title = options.title ?? (lang === 'zh' ? 'OWNLAB 笔记导出' : 'OWNLAB notes export')
  const generatedAt = options.generatedAt ?? new Date().toISOString()
  const sorted = [...entries].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )

  const articles = sorted
    .map((entry, index) => {
      const heading = escapeHtml(noteHeading(entry))
      const when = escapeHtml(formatWhen(entry.updatedAt || entry.createdAt, lang))
      const cats = categoryNames(entry, categories)
        .map((name) => `<span class="tag">${escapeHtml(name)}</span>`)
        .join('')
      const body = enrichNoteHtmlForCopy(entry.selectedText)
      const explanation = entry.explanation?.trim()
        ? `<div class="explanation"><h3>${lang === 'zh' ? '讲解' : 'Explanation'}</h3>${enrichNoteHtmlForCopy(entry.explanation)}</div>`
        : ''
      return `
<article class="note" id="note-${escapeHtml(entry.id)}">
  <header>
    <p class="meta"><span class="index">#${sorted.length - index}</span> · <time datetime="${escapeHtml(entry.createdAt)}">${when}</time>${cats ? ` · ${cats}` : ''}</p>
    <h2>${heading}</h2>
  </header>
  <div class="body">${body}</div>
  ${explanation}
</article>`
    })
    .join('\n')

  const countLabel =
    lang === 'zh' ? `${sorted.length} 条笔记` : `${sorted.length} note${sorted.length === 1 ? '' : 's'}`

  return `<!doctype html>
<html lang="${lang === 'zh' ? 'zh-CN' : 'en'}">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(title)}</title>
<style>
  :root {
    color-scheme: light;
    --ink: #1a2332;
    --muted: #5c6b7a;
    --line: #d7dee7;
    --bg: #f6f3ee;
    --card: #fffdf9;
    --accent: #0f6e6a;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    font: 17px/1.55 "Figtree", "Segoe UI", "PingFang SC", "Noto Sans SC", sans-serif;
    color: var(--ink);
    background:
      radial-gradient(1200px 600px at 10% -10%, #d9efe8 0%, transparent 55%),
      radial-gradient(900px 500px at 100% 0%, #f0e6d8 0%, transparent 50%),
      var(--bg);
  }
  .wrap { max-width: 820px; margin: 0 auto; padding: 2rem 1.25rem 4rem; }
  header.page h1 {
    font-family: "Bricolage Grotesque", Georgia, serif;
    font-size: clamp(1.8rem, 4vw, 2.4rem);
    margin: 0 0 0.35rem;
    letter-spacing: -0.02em;
  }
  header.page p { margin: 0.25rem 0; color: var(--muted); }
  .toolbar {
    position: sticky; top: 0; z-index: 5;
    display: flex; flex-wrap: wrap; gap: 0.5rem;
    padding: 0.75rem 0; margin: 1rem 0 1.5rem;
    background: color-mix(in srgb, var(--bg) 88%, transparent);
    backdrop-filter: blur(8px);
    border-bottom: 1px solid var(--line);
  }
  .toolbar button, .toolbar a.button {
    appearance: none; border: 1px solid var(--line); background: var(--card);
    color: var(--ink); border-radius: 8px; padding: 0.55rem 0.9rem;
    font: inherit; font-weight: 600; cursor: pointer; text-decoration: none;
  }
  .toolbar button.primary { background: var(--accent); color: #fff; border-color: var(--accent); }
  .toolbar button:hover, .toolbar a.button:hover { filter: brightness(0.98); }
  .note {
    background: var(--card);
    border: 1px solid var(--line);
    border-radius: 14px;
    padding: 1.25rem 1.35rem 1.5rem;
    margin: 0 0 1.25rem;
    user-select: text;
    -webkit-user-select: text;
  }
  .note h2 { margin: 0.2rem 0 0.8rem; font-size: 1.25rem; line-height: 1.3; }
  .meta { margin: 0; color: var(--muted); font-size: 0.92rem; }
  .tag {
    display: inline-block; padding: 0.1rem 0.45rem; margin-right: 0.25rem;
    border-radius: 999px; background: #e7f3f1; color: var(--accent); font-size: 0.8rem;
  }
  .body :is(p, ul, ol, pre, table) { margin: 0.65rem 0; }
  .body img { max-width: 100%; height: auto; }
  .ownlab-export-img-actions { font-size: 0.85rem; color: var(--muted); margin-top: 0.25rem; }
  .ownlab-export-img-actions a { color: var(--accent); font-weight: 600; }
  .explanation { margin-top: 1rem; padding-top: 0.75rem; border-top: 1px dashed var(--line); }
  .explanation h3 { margin: 0 0 0.4rem; font-size: 0.95rem; color: var(--muted); text-transform: uppercase; letter-spacing: 0.04em; }
  pre, code {
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    font-size: 0.92em;
  }
  pre {
    overflow: auto; padding: 0.85rem 1rem; border-radius: 10px;
    background: #15202b; color: #e7eef7;
  }
  table { border-collapse: collapse; width: 100%; }
  th, td { border: 1px solid var(--line); padding: 0.4rem 0.55rem; }
  footer.page { margin-top: 2rem; color: var(--muted); font-size: 0.9rem; }
  @media print {
    body { background: #fff; }
    .toolbar { display: none; }
    .note { break-inside: avoid; box-shadow: none; }
  }
</style>
</head>
<body>
  <div class="wrap">
    <header class="page">
      <h1>${escapeHtml(title)}</h1>
      <p>${escapeHtml(countLabel)} · ${escapeHtml(formatWhen(generatedAt, lang))}</p>
      <p>${lang === 'zh'
        ? '可选中文字复制；图片可右键“复制图片”，或点“Save image”下载。'
        : 'Select text to copy. Right-click images → Copy image, or use Save image under each picture.'}</p>
    </header>
    <div class="toolbar">
      <button type="button" class="primary" id="copy-all">${lang === 'zh' ? '复制全部文字' : 'Copy all text'}</button>
      <button type="button" id="select-all">${lang === 'zh' ? '全选内容' : 'Select all content'}</button>
      <a class="button" href="#notes">${lang === 'zh' ? '跳到笔记' : 'Jump to notes'}</a>
    </div>
    <main id="notes">
${articles || `<p>${lang === 'zh' ? '没有笔记。' : 'No notes.'}</p>`}
    </main>
    <footer class="page">OWNLAB · ${escapeHtml(title)}</footer>
  </div>
<script>
(function () {
  var notes = document.getElementById('notes');
  document.getElementById('select-all')?.addEventListener('click', function () {
    var range = document.createRange();
    range.selectNodeContents(notes);
    var sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  });
  document.getElementById('copy-all')?.addEventListener('click', async function () {
    var btn = this;
    try {
      var html = notes.innerHTML;
      var text = notes.innerText;
      if (navigator.clipboard && window.ClipboardItem) {
        await navigator.clipboard.write([
          new ClipboardItem({
            'text/html': new Blob([html], { type: 'text/html' }),
            'text/plain': new Blob([text], { type: 'text/plain' }),
          }),
        ]);
      } else {
        await navigator.clipboard.writeText(text);
      }
      btn.textContent = ${JSON.stringify(lang === 'zh' ? '已复制' : 'Copied')};
    } catch (err) {
      var range = document.createRange();
      range.selectNodeContents(notes);
      var sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
      document.execCommand('copy');
      btn.textContent = ${JSON.stringify(lang === 'zh' ? '已复制' : 'Copied')};
    }
    setTimeout(function () {
      btn.textContent = ${JSON.stringify(lang === 'zh' ? '复制全部文字' : 'Copy all text')};
    }, 1600);
  });
})();
</script>
</body>
</html>
`
}

/** Download a standalone HTML file in the browser. */
export function downloadPublicNotesHtml(html: string, filename?: string) {
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download =
    filename || `ownlab-notes-${new Date().toISOString().slice(0, 10)}.html`
  a.click()
  URL.revokeObjectURL(url)
}

/** Open the HTML in a new tab for immediate copy / print. */
export function openPublicNotesHtml(html: string) {
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const win = window.open(url, '_blank', 'noopener,noreferrer')
  if (!win) {
    // Popup blocked — fall back to same-tab navigation via temporary link.
    const a = document.createElement('a')
    a.href = url
    a.target = '_blank'
    a.rel = 'noopener noreferrer'
    a.click()
  }
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
}
