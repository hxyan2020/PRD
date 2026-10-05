#!/usr/bin/env python3
"""Build docs/risk-handbook/index.html from en.md + zh-CN.md.

Visual maps (HTML/CSS) always render. Mermaid is a local UMD extra, not a CDN.
"""
from __future__ import annotations

import html
import pathlib
import re

import markdown

ROOT = pathlib.Path(__file__).resolve().parent
EN_MD = ROOT / "en.md"
ZH_MD = ROOT / "zh-CN.md"
VIS_EN = ROOT / "visuals-en.html"
VIS_ZH = ROOT / "visuals-zh.html"
OUT = ROOT / "index.html"

FENCE = re.compile(r"```mermaid\n(.*?)```", re.S)
SUBGRAPH = re.compile(r"(subgraph\s+\S+\s*)\[(?!\")([^\]]+)\]")
NODE_BR = re.compile(r"(\b[A-Za-z][\w-]*)\[(?!\")([^\]\n]+)\]")
NODE_BRACES = re.compile(r"(\b[A-Za-z][\w-]*)\{(?!\")([^\}\n]+)\}")
EDGE_LABEL = re.compile(r"\|(?!\")([^|\n]+)\|")
NODE_LABEL = re.compile(r"[A-Za-z][\w-]*\[(?:\"([^\"]+)\"|([^\]]+))\]")
SEQ_AS = re.compile(r"((?:actor|participant)\s+\S+\s+as\s+)(.+)")
SEQ_ALIAS = re.compile(r"(?:actor|participant)\s+\S+\s+as\s+\"?([^\n\"]+)\"?")


def quote_mermaid(src: str) -> str:
    kind = src.strip().splitlines()[0].strip() if src.strip() else ""
    if kind.startswith("sequenceDiagram"):
        def quote_as(m: re.Match[str]) -> str:
            alias = m.group(2).strip()
            if alias.startswith('"'):
                return m.group(0)
            return f'{m.group(1)}"{alias}"'

        return SEQ_AS.sub(quote_as, src)

    src = SUBGRAPH.sub(lambda m: f'{m.group(1)}["{m.group(2)}"]', src)
    src = NODE_BR.sub(lambda m: f'{m.group(1)}["{m.group(2)}"]', src)
    src = NODE_BRACES.sub(lambda m: f'{m.group(1)}{{"{m.group(2)}"}}', src)

    def quote_edge(m: re.Match[str]) -> str:
        label = m.group(1)
        if any(ch in label for ch in "/+?:&"):
            return f'|"{label}"|'
        return m.group(0)

    return EDGE_LABEL.sub(quote_edge, src)


def mermaid_fallback_board(src: str) -> str:
    labels: list[str] = []
    seen: set[str] = set()

    def add(text: str) -> None:
        text = text.replace("<br/>", " ").replace("<br>", " ")
        text = re.sub(r"\s+", " ", text).strip()
        if text and text not in seen:
            seen.add(text)
            labels.append(text)

    for m in NODE_LABEL.finditer(src):
        add(m.group(1) or m.group(2) or "")
    if not labels:
        for m in SEQ_ALIAS.finditer(src):
            add(m.group(1))
    if not labels:
        return ""
    parts = []
    for i, label in enumerate(labels):
        if i:
            parts.append('<span class="arrow">→</span>')
        klass = "node"
        low = label.lower()
        if "phase 2" in low or "blocked" in low or "dormant" in low or "未开" in label or "阻断" in label:
            klass += " off"
        parts.append(f'<div class="{klass}">{html.escape(label)}</div>')
    return (
        '<div class="board mermaid-fallback" aria-hidden="false">'
        '<div class="board-title">Diagram (always on)</div>'
        f'<div class="flow-row">{"".join(parts)}</div>'
        "</div>"
    )


def convert_mermaid_fences(md: str) -> str:
    def repl(m: re.Match[str]) -> str:
        src = quote_mermaid(m.group(1).strip("\n"))
        fallback = mermaid_fallback_board(src)
        return (
            f'{fallback}\n<div class="viz"><div class="mermaid">\n{src}\n</div></div>\n'
        )

    return FENCE.sub(repl, md)


def inject_visuals(md: str, visuals: str) -> str:
    visuals = visuals.strip()
    if "class=\"visual-maps\"" in md:
        md = re.sub(
            r"<section class=\"visual-maps\"[\s\S]*?</section>",
            visuals,
            md,
            count=1,
        )
        return md
    # After TOC block (first --- after the TOC heading) insert the maps so they
    # sit above Phase 1 tables — first thing after contents.
    marker = "\n---\n\n## Phase 1"
    alt = "\n---\n\n## Phase 1"
    if marker in md:
        return md.replace(marker, "\n\n" + visuals + "\n\n---\n\n## Phase 1", 1)
    if "## Phase 1" in md:
        return md.replace("## Phase 1", visuals + "\n\n## Phase 1", 1)
    return visuals + "\n\n" + md


def add_toc_item(md: str, title: str, anchor: str) -> str:
    line = f"0. [{title}](#{anchor})"
    if f"](#{anchor})" in md:
        return md
    md = re.sub(
        r"(## (?:Table of contents|目录)\n\n)",
        rf"\1{line}\n",
        md,
        count=1,
    )
    return md


def md_to_html(text: str) -> str:
    return markdown.markdown(
        text,
        extensions=["tables", "fenced_code", "sane_lists", "nl2br"],
    )


def wrap_tables(html_body: str) -> str:
    return re.sub(
        r"<table>",
        '<div class="table-wrap"><table>',
        html_body,
    ).replace("</table>", "</table></div>")


PAGES = "https://hxyan2020.github.io/PRD/risk-handbook"
GLOBAL_HASHES = {"hero-viz", "en", "zh", "zh-CN", "tab-en", "tab-zh", "panel-en", "panel-zh"}

SOP_TOKEN = (
    r"(?:SOP-)?(?:G0[1-6]|RM-0[1-7]|SP-0[1-5]|MG-0[1-6]|PF-0[1-8]|"
    r"ME-0[1-5]|RE-0[1-5]|WA-0[1-6]|LD-0[1-8]|CP-0[1-4]|TS-0[1-4]|"
    r"MM-0[1-3]|ENG-0[1-4]|ACC-0[1-4])"
)
KRI_TOKEN = r"(?:SP|MG|PF|PL|PM)-K\d{2}"
SEC_FALLBACK = {
    "6.1": "sop-g01",
    "6.2": "sop-g02",
    "6.3": "sop-g03",
    "6.4": "sop-g04",
    "6.5": "sop-g05",
    "6.6": "sop-g06",
}


def github_slug(text: str) -> str:
    """GitHub-style heading slug: drop punctuation, each space becomes '-'."""
    text = re.sub(r"<[^>]+>", "", text)
    text = html.unescape(text).strip().lower()
    out: list[str] = []
    for ch in text:
        if ch.isspace():
            out.append("-")
        elif ch == "_" or ch == "-" or ch.isalnum():
            out.append(ch)
    return "".join(out).strip("-")


def sop_id(token: str) -> str:
    t = token.upper().replace("SOP-", "")
    if t.startswith("G"):
        return "sop-" + t.lower()
    return t.lower()


def section_id(num: str) -> str:
    return "sec-" + num.lower().replace(".", "-")


def admin_href(path: str) -> str:
    path = path.strip().rstrip("*").rstrip("/")
    if not path.startswith("/admin"):
        return ""
    return f"{PAGES}{path}/"


def _split_protected(html_body: str, pattern: str):
    parts: list[tuple[bool, str]] = []
    last = 0
    for m in re.finditer(pattern, html_body, flags=re.I | re.S):
        if m.start() > last:
            parts.append((False, html_body[last:m.start()]))
        parts.append((True, m.group(0)))
        last = m.end()
    if last < len(html_body):
        parts.append((False, html_body[last:]))
    return parts


def map_outside(html_body: str, skip_re: str, fn) -> str:
    out = []
    for protected, chunk in _split_protected(html_body, skip_re):
        out.append(chunk if protected else fn(chunk))
    return "".join(out)


def add_heading_ids(html_body: str, prefix: str) -> tuple[str, set[str]]:
    ids: set[str] = set()

    def claim(raw: str) -> str:
        ident = f"{prefix}-{raw}"
        if ident not in ids:
            ids.add(ident)
            return ident
        n = 2
        while f"{ident}-{n}" in ids:
            n += 1
        ids.add(f"{ident}-{n}")
        return f"{ident}-{n}"

    def heading2(m: re.Match[str]) -> str:
        level, inner = m.group(1), m.group(2)
        plain = html.unescape(re.sub(r"<[^>]+>", "", inner))
        aliases: list[str] = []
        slug = github_slug(plain)
        if slug:
            aliases.append(claim(slug))
        sm = re.match(r"\s*(\d+(?:\.\d+[a-z]?)*)(?:\.\s|\s|$)", plain)
        if sm and sm.group(1):
            aliases.append(claim(section_id(sm.group(1))))
        for tok in re.findall(SOP_TOKEN, plain, flags=re.I):
            aliases.append(claim(sop_id(tok)))
        for tok in re.findall(KRI_TOKEN, plain, flags=re.I):
            aliases.append(claim(tok.lower()))
        for tok in re.findall(r"\bS(?:[1-9]|1[0-2])\b", plain, flags=re.I):
            aliases.append(claim(tok.lower()))
        seen: list[str] = []
        for a in aliases:
            if a not in seen:
                seen.append(a)
        if not seen:
            return m.group(0)
        primary = seen[0]
        spans = "".join(
            f'<span class="alias" id="{html.escape(a, quote=True)}"></span>'
            for a in seen[1:]
        )
        return f'<h{level} id="{html.escape(primary, quote=True)}">{spans}{inner}</h{level}>'

    html_body = re.sub(r"<h([1-6])>(.*?)</h\1>", heading2, html_body, flags=re.S)

    def prefix_id(m: re.Match[str]) -> str:
        ident = m.group(1)
        if ident in GLOBAL_HASHES:
            ids.add(ident)
            return m.group(0)
        if ident.startswith(f"{prefix}-"):
            ids.add(ident)
            return m.group(0)
        new = claim(ident)
        return f'id="{html.escape(new, quote=True)}"'

    html_body = re.sub(r'\bid="([^"]+)"', prefix_id, html_body)
    return html_body, ids


def add_cell_ids(html_body: str, prefix: str, ids: set[str]) -> str:
    def maybe(token: str, inner: str, original: str) -> str:
        ident = f"{prefix}-{token.lower()}"
        if ident in ids:
            return original
        ids.add(ident)
        return f'<td id="{ident}">{inner}</td>'

    def kri_cell(m: re.Match[str]) -> str:
        token = m.group(2)
        inner = f"{m.group(1) or ''}{token}{m.group(3) or ''}"
        return maybe(token, inner, m.group(0))

    html_body = re.sub(
        rf"<td>(<strong>)?({KRI_TOKEN})(</strong>)?</td>",
        kri_cell,
        html_body,
        flags=re.I,
    )

    def fam_cell(m: re.Match[str]) -> str:
        token = m.group(2)
        inner = f"{m.group(1) or ''}{token}{m.group(3) or ''}"
        return maybe(token, inner, m.group(0))

    html_body = re.sub(
        r"<td>(<strong>)?(S(?:[1-9]|1[0-2]))(</strong>)?</td>",
        fam_cell,
        html_body,
        flags=re.I,
    )
    return html_body


def link_admin_code(html_body: str) -> str:
    def one_code(m: re.Match[str]) -> str:
        inner = m.group(1)
        if "<a " in inner:
            return m.group(0)
        pieces = []
        last = 0
        for pm in re.finditer(r"/admin/[a-z0-9/*._-]*", inner, flags=re.I):
            pieces.append(inner[last:pm.start()])
            href = admin_href(pm.group(0))
            if href:
                pieces.append(
                    f'<a class="ext" href="{html.escape(href, quote=True)}" target="_blank" rel="noopener">{pm.group(0)}</a>'
                )
            else:
                pieces.append(pm.group(0))
            last = pm.end()
        if not last:
            return m.group(0)
        pieces.append(inner[last:])
        return "<code>" + "".join(pieces) + "</code>"

    return re.sub(r"<code>(.*?)</code>", one_code, html_body, flags=re.S)


def link_bare_urls(chunk: str) -> str:
    def url(m: re.Match[str]) -> str:
        raw = m.group(0)
        trail = ""
        while raw and raw[-1] in ".,;:)]":
            trail = raw[-1] + trail
            raw = raw[:-1]
        extra = ""
        if "hxyan2020.github.io" not in raw and "github.com/hxyan2020" not in raw:
            extra = ' target="_blank" rel="noopener"'
        return f'<a class="ext" href="{html.escape(raw, quote=True)}"{extra}>{raw}</a>{trail}'

    return re.sub(r"https?://[^\s<>\"']+", url, chunk)


def link_xrefs(chunk: str, prefix: str, ids: set[str]) -> str:
    def has(raw: str) -> str | None:
        ident = f"{prefix}-{raw}"
        return ident if ident in ids else None

    def wrap(label: str, ident: str) -> str:
        return f'<a class="xref" href="#{html.escape(ident, quote=True)}">{label}</a>'

    def sop(m: re.Match[str]) -> str:
        ident = has(sop_id(m.group(0)))
        return wrap(m.group(0), ident) if ident else m.group(0)

    chunk = re.sub(rf"\b{SOP_TOKEN}\b", sop, chunk)

    def kri(m: re.Match[str]) -> str:
        token = m.group(1)
        rest = m.group(2) or ""
        ident = has(token.lower())
        out = wrap(token, ident) if ident else token
        base = token[: token.upper().rfind("K") + 1]
        for part in rest.split("/")[1:]:
            digits = re.search(r"\d{2}", part)
            if not digits:
                out += "/" + part
                continue
            other = base + digits.group(0)
            oid = has(other.lower())
            piece = "/" + part
            out += wrap(piece, oid) if oid else piece
        return out

    chunk = re.sub(rf"\b({KRI_TOKEN})((?:/K?\d{{2}})*)", kri, chunk, flags=re.I)

    def resolve_section(num: str) -> str | None:
        ident = has(section_id(num))
        if not ident and num in SEC_FALLBACK:
            ident = has(SEC_FALLBACK[num])
        if not ident and "." in num:
            ident = has(section_id(num.split(".")[0]))
        return ident

    def section(m: re.Match[str]) -> str:
        ident = resolve_section(m.group(1))
        return wrap(m.group(0), ident) if ident else m.group(0)

    chunk = re.sub(
        r"§{1,2}(\d+(?:\.\d+[a-z]?)*)(?:\s*[–-]\s*§{0,2}\d+(?:\.\d+[a-z]?)*)?",
        section,
        chunk,
    )

    def family(m: re.Match[str]) -> str:
        ident = has(m.group(0).lower())
        return wrap(m.group(0), ident) if ident else m.group(0)

    chunk = re.sub(r"\bS(?:[1-9]|1[0-2])\b", family, chunk)
    return chunk


SKIP_XREF = (
    r"(<a\b[^>]*>.*?</a>|<pre\b[^>]*>.*?</pre>|<code\b[^>]*>.*?</code>|"
    r"<h[1-6][^>]*>.*?</h[1-6]>|<script\b[^>]*>.*?</script>|"
    r"<div class=\"mermaid\"[^>]*>.*?</div>|<div class=\"viz\"[^>]*>.*?</div>|"
    r"<[^>]+>)"
)
SKIP_URL = (
    r"(<a\b[^>]*>.*?</a>|<pre\b[^>]*>.*?</pre>|<script\b[^>]*>.*?</script>|"
    r"<div class=\"mermaid\"[^>]*>.*?</div>|<div class=\"viz\"[^>]*>.*?</div>|"
    r"<[^>]+>)"
)


def rewrite_hash_hrefs(html_body: str, prefix: str, ids: set[str]) -> str:
    def href(m: re.Match[str]) -> str:
        target = m.group(1)
        if target in GLOBAL_HASHES or target.startswith(f"{prefix}-"):
            return m.group(0)
        prefixed = f"{prefix}-{target}"
        if prefixed in ids:
            return f'href="#{prefixed}"'
        return m.group(0)

    return re.sub(r'href="#([^"]+)"', href, html_body)


def decorate_panel(html_body: str, prefix: str) -> str:
    html_body, ids = add_heading_ids(html_body, prefix)
    html_body = add_cell_ids(html_body, prefix, ids)
    html_body = link_admin_code(html_body)
    html_body = map_outside(html_body, SKIP_URL, link_bare_urls)
    html_body = map_outside(
        html_body, SKIP_XREF, lambda chunk: link_xrefs(chunk, prefix, ids)
    )
    html_body = rewrite_hash_hrefs(html_body, prefix, ids)
    return html_body


CSS = r"""
    :root {
      --bg: #f3f0ea;
      --ink: #1c1916;
      --muted: #5b564e;
      --line: #d8d0c4;
      --tab: #ebe6dc;
      --tab-active: #ffffff;
      --accent: #3f5348;
      --panel: #ffffff;
      --phase1: #eef0eb;
      --phase2: #f2ebe3;
      --sage: #dce4db;
      --sage-line: #8f9d90;
      --kraft: #eadfc8;
      --kraft-line: #b09a72;
      --rose: #e6d6d2;
      --rose-line: #b08f88;
      --slate: #dce2e6;
      --slate-line: #8e9aa3;
      --paper: #f2eee6;
      --paper-line: #c9c1b4;
    }
    * { box-sizing: border-box; }
    html { scroll-behavior: smooth; }
    body {
      margin: 0;
      font-family: "Source Serif 4", "Iowan Old Style", Palatino, "Songti SC", "Noto Serif SC", Georgia, serif;
      color: var(--ink);
      background:
        radial-gradient(1100px 480px at 8% -8%, #e8e4db 0%, transparent 55%),
        radial-gradient(900px 420px at 100% 0%, #ebe4d8 0%, transparent 50%),
        var(--bg);
      line-height: 1.62;
    }
    .shell { max-width: 1160px; margin: 0 auto; padding: 20px 18px 72px; }
    header.top {
      display: flex; flex-wrap: wrap; gap: 12px 24px;
      align-items: end; justify-content: space-between; margin-bottom: 14px;
    }
    header.top h1 { font-size: 1.32rem; margin: 0; max-width: 42rem; }
    header.top p { margin: 6px 0 0; color: var(--muted); font-size: 0.92rem; }
    header.top a { color: var(--accent); }
    .md-links { display: flex; gap: 8px; flex-wrap: wrap; font-family: ui-monospace, Menlo, Consolas, monospace; font-size: 0.76rem; }
    .md-links a {
      color: var(--accent); text-decoration: none; border: 1px solid var(--line);
      background: var(--panel); padding: 6px 10px; border-radius: 6px;
    }
    .md-links a:hover { border-color: var(--accent); }
    .jump-viz { font-weight: 650; }
    .tabs {
      display: flex; gap: 4px; border-bottom: 1px solid var(--line);
      position: sticky; top: 0; z-index: 20; background: linear-gradient(var(--bg), var(--bg) 70%, transparent);
      padding-top: 6px;
    }
    .tabs button {
      appearance: none; border: 1px solid transparent; border-bottom: none;
      background: var(--tab); color: var(--muted); padding: 12px 18px;
      font: inherit; font-size: 0.95rem; cursor: pointer;
      border-radius: 10px 10px 0 0; touch-action: manipulation;
    }
    .tabs button[aria-selected="true"] {
      background: var(--tab-active); color: var(--ink); border-color: var(--line);
      font-weight: 650;
    }
    .panel {
      display: none; background: var(--panel); border: 1px solid var(--line);
      border-radius: 0 12px 12px 12px; padding: 28px 30px 48px;
      box-shadow: 0 12px 36px rgba(28,25,22,0.05);
    }
    .panel.active { display: block; }
    .panel h1 { font-size: 1.7rem; margin-top: 0; line-height: 1.25; }
    .panel h2 {
      font-size: 1.32rem; margin-top: 2.1rem; padding: 0.55rem 0 0.15rem 0.75rem;
      border-left: 4px solid var(--accent); border-top: 0; background: linear-gradient(90deg, #efece5, transparent 70%);
    }
    .panel h3 { font-size: 1.08rem; margin-top: 1.5rem; color: #3a433d; }
    .panel h4, .panel h5 { font-size: 1rem; margin-top: 1.2rem; }
    .panel p { max-width: 78ch; }
    .table-wrap { overflow-x: auto; margin: 0.85rem 0 1.25rem; border: 1px solid var(--line); border-radius: 8px; }
    .panel table { border-collapse: collapse; width: 100%; font-size: 0.86rem; margin: 0; display: table; }
    .panel th, .panel td { border-bottom: 1px solid var(--line); border-right: 1px solid #efe8dc; padding: 7px 9px; vertical-align: top; text-align: left; }
    .panel tr:last-child td { border-bottom: 0; }
    .panel th { background: #f6f0e6; font-weight: 650; position: sticky; top: 0; }
    .panel tr:nth-child(even) td { background: #fbfaf7; }
    .panel code {
      font-family: ui-monospace, Menlo, Consolas, monospace; font-size: 0.84em;
      background: #f3efe6; padding: 0.12em 0.38em; border-radius: 4px;
    }
    .panel pre {
      background: #1e2430; color: #e8eef7; padding: 12px 14px; border-radius: 8px;
      overflow-x: auto; font-size: 0.82rem;
    }
    .panel pre code { background: transparent; color: inherit; padding: 0; }
    .panel blockquote {
      margin: 1rem 0; padding: 0.55rem 0.9rem; border-left: 4px solid var(--accent);
      background: var(--phase1); color: #1f2933; border-radius: 0 8px 8px 0;
    }
    .panel hr { border: 0; border-top: 1px solid var(--line); margin: 1.6rem 0; }
    .panel ul, .panel ol { padding-left: 1.25rem; }
    .panel li { margin: 0.22rem 0; }
    .panel a { color: var(--accent); text-underline-offset: 2px; }
    .panel a.xref { font-weight: 600; }
    .panel a.ext { word-break: break-word; }
    .panel a:hover { color: #2a3b34; }
    .alias { display: block; position: relative; top: -8px; height: 0; overflow: hidden; }
    .panel h2, .panel h3, .panel h4, .panel h5, .panel td[id], .panel [id] { scroll-margin-top: 56px; }
    .viz {
      margin: 0.4rem 0 1.4rem; padding: 12px 10px 6px; background: #f6f3ee;
      border: 1px dashed #d0c8bb; border-radius: 10px; overflow-x: auto;
    }
    .viz .mermaid { display: flex; justify-content: center; min-height: 4px; }
    .viz svg { max-width: 100%; height: auto; }
    .legend {
      display: flex; flex-wrap: wrap; gap: 8px; margin: 0 0 1rem;
      font-size: 0.82rem;
    }
    .chip { border-radius: 999px; padding: 3px 10px; border: 1px solid var(--line); background: #fff; }
    .chip.p1 { background: var(--phase1); border-color: var(--sage-line); }
    .chip.p2 { background: var(--phase2); border-color: var(--kraft-line); }
    .chip.g { background: var(--sage); border-color: var(--sage-line); }
    .chip.a { background: var(--kraft); border-color: var(--kraft-line); }
    .chip.r { background: var(--rose); border-color: var(--rose-line); }
    .visual-maps { margin: 0.4rem 0 1.6rem; }
    .visual-maps h2 { margin-top: 0.4rem !important; }
    .lead-viz { max-width: 72ch; color: #3f3a34; }
    .board {
      margin: 0.85rem 0 1.1rem; padding: 14px 14px 16px;
      background: #f6f3ee; border: 1px solid #d0c8bb; border-radius: 12px;
    }
    .board-title {
      font-family: ui-sans-serif, system-ui, sans-serif;
      font-size: 0.92rem; font-weight: 700; color: #3a433d; margin: 0 0 10px;
    }
    .flow-row {
      display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin: 6px 0;
    }
    .node {
      background: var(--paper); border: 1px solid var(--paper-line); border-radius: 8px;
      padding: 8px 11px; font-size: 0.82rem; line-height: 1.35;
      font-family: ui-sans-serif, system-ui, "Noto Sans SC", sans-serif;
      max-width: 13.5rem; color: var(--ink);
    }
    .node small { display: block; margin-top: 4px; color: #3f3a34; font-weight: 400; }
    .node.off { background: var(--phase2); border-color: var(--kraft-line); color: #6b5e4e; text-decoration: line-through; }
    .node.red { background: var(--rose); border-color: var(--rose-line); color: #5c3f3a; }
    .node.amber { background: var(--kraft); border-color: var(--kraft-line); color: #5c4e32; }
    .node.green { background: var(--sage); border-color: var(--sage-line); color: #3a433d; }
    .node.navy { background: var(--slate); border-color: var(--slate-line); color: #3a4148; }
    .arrow {
      color: #44403c; font-weight: 700;
      font-family: ui-sans-serif, system-ui, sans-serif;
    }
    .arrow.down { display: block; text-align: center; font-size: 0.78rem; margin: 2px 0; }
    .lane {
      border: 1px dashed var(--sage-line); border-radius: 10px; padding: 10px; margin: 8px 0;
      background: #f4f3ef;
    }
    .lane.off { border-color: var(--kraft-line); background: var(--phase2); }
    .lane-label {
      font-family: ui-sans-serif, system-ui, sans-serif;
      font-size: 0.72rem; font-weight: 700; letter-spacing: 0.04em;
      text-transform: uppercase; color: #4a534c; margin-bottom: 6px;
    }
    .lane.off .lane-label { color: #6b5e4e; }
    .muted-note { margin: 6px 0 0; font-size: 0.8rem; color: var(--muted); }
    .stack { display: flex; flex-direction: column; align-items: stretch; gap: 6px; }
    .stack .node { max-width: none; }
    .viz-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .mermaid-fallback { margin: 1rem 0 0.35rem; }
    .mermaid-error { color: #9a3412; font-size: 0.8rem; }
    .viz:has(svg) + .mermaid-fallback, .mermaid-fallback + .viz:has(svg) { }
    .mermaid-fallback:has(+ .viz svg) { display: none; }
    .viz:not(:has(svg)) { display: none; }
    body.js-fail .viz { display: none; }
    body.js-fail .mermaid-fallback { display: block; }
    .hero-viz {
      margin: 0 0 14px; padding: 14px 16px 16px;
      background: var(--panel); border: 1px solid var(--paper-line); border-radius: 12px;
      box-shadow: 0 8px 24px rgba(28,25,22,0.05);
    }
    .hero-viz h2 { margin: 0 0 6px; font-size: 1.15rem; color: #3a433d; }
    .hero-viz .lead-viz { margin: 0 0 10px; }
    @media (max-width: 800px) {
      .viz-grid { grid-template-columns: 1fr; }
      .panel { padding: 16px 12px 28px; border-radius: 0 0 12px 12px; }
      .tabs button { flex: 1; text-align: center; padding: 12px 8px; }
      .panel h1 { font-size: 1.35rem; }
    }
"""

JS = r"""
  <script src="./vendor/mermaid.min.js" defer></script>
  <script>
    (function () {
      document.body.classList.add("js-ok");
      var tabs = document.querySelectorAll("[role='tab']");
      var panels = {
        en: document.getElementById("panel-en"),
        zh: document.getElementById("panel-zh")
      };
      var mermaidReady = false;
      function initMermaid() {
        if (typeof mermaid === "undefined") {
          document.body.classList.remove("js-ok");
          document.body.classList.add("js-fail");
          return false;
        }
        mermaid.initialize({
          startOnLoad: false,
          theme: "base",
          securityLevel: "loose",
          themeVariables: {
            fontFamily: "Georgia, Source Serif 4, Noto Serif SC, serif",
            primaryColor: "#dce4db",
            primaryTextColor: "#3a433d",
            primaryBorderColor: "#8f9d90",
            lineColor: "#6b6560",
            secondaryColor: "#eadfc8",
            tertiaryColor: "#f4f1ea"
          }
        });
        mermaidReady = true;
        return true;
      }
      async function draw(root) {
        if (!mermaidReady && typeof mermaid !== "undefined") initMermaid();
        if (!mermaidReady) return;
        var nodes = root.querySelectorAll(".mermaid:not([data-processed])");
        if (!nodes.length) return;
        for (var i = 0; i < nodes.length; i++) {
          try {
            await mermaid.run({ nodes: [nodes[i]] });
          } catch (err) {
            nodes[i].setAttribute("data-failed", "1");
          }
        }
      }
      function activate(key, hash) {
        tabs.forEach(function (t) {
          t.setAttribute("aria-selected", t.getAttribute("data-tab") === key ? "true" : "false");
        });
        Object.keys(panels).forEach(function (k) {
          var on = k === key;
          panels[k].classList.toggle("active", on);
          panels[k].hidden = !on;
        });
        try { localStorage.setItem("risk-handbook-tab", key); } catch (e) {}
        var next = hash || ("#" + key);
        if (history.replaceState) history.replaceState(null, "", next);
        setTimeout(function () { draw(panels[key]); }, 0);
      }
      function tabFromHash(h) {
        h = (h || "").replace(/^#/, "");
        if (h.indexOf("zh") === 0) return "zh";
        if (h.indexOf("en") === 0) return "en";
        return "";
      }
      document.querySelector(".tabs").addEventListener("click", function (ev) {
        var t = ev.target.closest("[role='tab']");
        if (!t) return;
        activate(t.getAttribute("data-tab"));
      });
      document.addEventListener("click", function (ev) {
        var a = ev.target.closest("a[href^='#']");
        if (!a) return;
        var id = a.getAttribute("href").slice(1);
        var tab = tabFromHash(id);
        if (tab) activate(tab, "#" + id);
        var el = document.getElementById(id);
        if (el) {
          ev.preventDefault();
          setTimeout(function () { el.scrollIntoView({ block: "start", behavior: "smooth" }); }, 0);
        }
      });
      var initial = "en";
      var hashTab = tabFromHash(location.hash);
      if (hashTab) initial = hashTab;
      else if (location.hash === "#zh-CN") initial = "zh";
      else {
        try {
          var saved = localStorage.getItem("risk-handbook-tab");
          if (saved === "en" || saved === "zh") initial = saved;
        } catch (e) {}
      }
      activate(initial, location.hash && location.hash.length > 1 ? location.hash : "#" + initial);
      if (location.hash && location.hash.length > 1) {
        var target = document.getElementById(location.hash.slice(1));
        if (target) setTimeout(function () { target.scrollIntoView({ block: "start" }); }, 50);
      }
      window.addEventListener("load", function () {
        try { initMermaid(); draw(panels[initial]); } catch (e) {
          document.body.classList.remove("js-ok");
          document.body.classList.add("js-fail");
        }
      });
    })();
  </script>
"""

TEMPLATE = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Crypto Exchange Risk Management Handbook / 加密货币交易所风险管理手册</title>
  <style>{css}</style>
</head>
<body>
  <div class="shell">
    <header class="top">
      <div>
        <h1>Crypto Exchange Risk Management — BU User Handbook</h1>
        <p>Finprime V-Exchange · 加密货币交易所风险管理 — 业务单元用户手册 · v2.3 · <a href="https://hxyan2020.github.io/PRD/risk-handbook/">public site</a> · <a href="https://hxyan2020.github.io/PRD/risk-handbook/urls.html">all URLs</a> · <a href="https://hxyan2020.github.io/PRD/risk-handbook/edit.html">edit EN / 简体中文</a></p>
      </div>
      <div class="md-links">
        <a class="jump-viz" href="#hero-viz">Visual maps 示意图</a>
        <a href="edit.html">Edit EN / 简体中文</a>
        <a href="en.md">en.md</a>
        <a href="zh-CN.md">zh-CN.md</a>
        <a href="urls.html">all URLs</a>
        <a href="admin/">admin URLs</a>
      </div>
    </header>
    <div class="legend">
      <span class="chip p1">Phase 1 = V-Exchange perps (green)</span>
      <span class="chip p2">Phase 2+ = documented, not live</span>
      <span class="chip g">Green</span>
      <span class="chip a">Amber</span>
      <span class="chip r">Red</span>
    </div>
    <section class="hero-viz" id="hero-viz" aria-label="Phase 1 visual map">
      <h2>Diagram / 示意图 — Finprime V-Exchange Phase 1</h2>
      <p class="lead-viz">Always visible above the language tabs. Green = live now (永续合约 · 永续账户 · 撮合/风控/清结算). Amber strikethrough = Phase 2+ only.</p>
      <div class="lane">
        <div class="lane-label">Live / 当前开通 — 2B broker · institution · MM · 2C via broker · perps only</div>
        <div class="flow-row">
          <div class="node">2C user 终端用户</div>
          <span class="arrow">→</span>
          <div class="node">Broker 接入<small>Vantage / 白标</small></div>
          <span class="arrow">→</span>
          <div class="node">KYC · Open Account</div>
          <span class="arrow">→</span>
          <div class="node green">Perp Account<small>USD/USDT</small></div>
          <span class="arrow">→</span>
          <div class="node green">Matching + Risk + Clearing</div>
        </div>
        <div class="flow-row">
          <div class="node">Institution 机构直连<small>API only</small></div>
          <div class="node">MM 做市商接入</div>
          <span class="muted-note">2B offline open · same green perp stack</span>
        </div>
      </div>
      <div class="lane off">
        <div class="lane-label">Phase 2+ — not live / 未投产</div>
        <div class="flow-row">
          <div class="node off">Spot 现货</div>
          <div class="node off">USD Margin 逐仓+全仓</div>
          <div class="node off">Cross-ccy / 组合保证金</div>
          <div class="node off">Options 期权</div>
          <div class="node off">Wealth 理财</div>
          <div class="node off">Public 2C signup</div>
        </div>
      </div>
      <p class="muted-note">Funding rails: user deposit → MT account / X-fund → USD/USDT transfer into Perp Account. More maps sit at the top of each language tab.</p>
    </section>
    <div class="tabs" role="tablist" aria-label="Handbook language">
      <button type="button" role="tab" id="tab-en" aria-controls="panel-en" aria-selected="true" data-tab="en">English</button>
      <button type="button" role="tab" id="tab-zh" aria-controls="panel-zh" aria-selected="false" data-tab="zh">简体中文</button>
    </div>
    <article class="panel active" role="tabpanel" id="panel-en" aria-labelledby="tab-en" lang="en">
{en}
    </article>
    <article class="panel" role="tabpanel" id="panel-zh" aria-labelledby="tab-zh" lang="zh-CN" hidden>
{zh}
    </article>
  </div>
{js}
</body>
</html>
"""


def quote_source_file(path: pathlib.Path) -> None:
    text = path.read_text(encoding="utf-8")

    def repl(m: re.Match[str]) -> str:
        return "```mermaid\n" + quote_mermaid(m.group(1).strip("\n")) + "\n```"

    new = FENCE.sub(repl, text)
    if new != text:
        path.write_text(new, encoding="utf-8")


def bump_version(path: pathlib.Path, note: str) -> None:
    text = path.read_text(encoding="utf-8")
    text = text.replace("**Version:** 1.7", "**Version:** 1.8")
    text = text.replace("**版本：** 1.7", "**版本：** 1.8")
    text = re.sub(r"\| Version \| 1\.7[^\n]*", f"| Version | 1.8 — {note}", text)
    text = re.sub(r"\| 版本 \| 1\.7[^\n]*", f"| 版本 | 1.8 — {note}", text)
    path.write_text(text, encoding="utf-8")


def render_lang(
    md_path: pathlib.Path,
    vis_path: pathlib.Path,
    toc_title: str,
    anchor: str,
    prefix: str,
) -> str:
    md = md_path.read_text(encoding="utf-8")
    vis = vis_path.read_text(encoding="utf-8")
    md = add_toc_item(md, toc_title, anchor)
    md = inject_visuals(md, vis)
    md = convert_mermaid_fences(md)
    body = wrap_tables(md_to_html(md))
    return decorate_panel(body, prefix)


def main() -> None:
    quote_source_file(EN_MD)
    quote_source_file(ZH_MD)
    en = render_lang(EN_MD, VIS_EN, "Visual maps", "visual-maps", "en")
    zh = render_lang(ZH_MD, VIS_ZH, "示意图", "visual-maps-zh", "zh")
    OUT.write_text(TEMPLATE.format(css=CSS, js=JS, en=en, zh=zh), encoding="utf-8")
    print(f"wrote {OUT} ({OUT.stat().st_size} bytes)")


if __name__ == "__main__":
    main()
