/** Render mermaid flowchart / sequence blocks as inline SVG (no mermaid.js; works on GitHub Pages). */

let diagramSeq = 0;

type NodeShape = "rect" | "round" | "diamond";

type FlowNode = { id: string; label: string; shape: NodeShape };

type FlowEdge = { from: string; to: string; label: string };

function xml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function wrapLabel(label: string, max = 22): string[] {
  const clean = label.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return [clean];
  const words = clean.split(" ");
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w;
    if (next.length > max && cur) {
      lines.push(cur);
      cur = w;
    } else {
      cur = next;
    }
  }
  if (cur) lines.push(cur);
  return lines.slice(0, 4);
}

function parseFlowchart(src: string): { dir: "TD" | "LR"; nodes: FlowNode[]; edges: FlowEdge[] } {
  const dirMatch = /^\s*(?:graph|flowchart)\s+(LR|RL|TD|TB|BT)/im.exec(src);
  const rawDir = (dirMatch?.[1] || "TD").toUpperCase();
  const dir: "TD" | "LR" = rawDir === "LR" || rawDir === "RL" ? "LR" : "TD";
  const nodes = new Map<string, FlowNode>();
  const edges: FlowEdge[] = [];
  const order: string[] = [];

  const ensure = (id: string, label?: string, shape?: NodeShape) => {
    const existing = nodes.get(id);
    if (!existing) {
      order.push(id);
      nodes.set(id, { id, label: label || id, shape: shape || "rect" });
      return;
    }
    if (label) existing.label = label;
    if (shape) existing.shape = shape;
  };

  for (const raw of src.split("\n")) {
    const line = raw.trim();
    if (!line || /^(graph|flowchart)\b/i.test(line) || line.startsWith("%%")) continue;

    const nodeRe = /([A-Za-z][A-Za-z0-9_]*)\s*(?:\["([^"]+)"\]|\[([^\]]+)\]|\("([^"]+)"\)|\(([^)]+)\)|\{"([^"]+)"\}|\{([^}]+)\})/g;
    let m: RegExpExecArray | null;
    while ((m = nodeRe.exec(line))) {
      const id = m[1];
      const label = m[2] || m[3] || m[4] || m[5] || m[6] || m[7] || id;
      const shape: NodeShape = m[6] || m[7] ? "diamond" : m[4] || m[5] ? "round" : "rect";
      ensure(id, label, shape);
    }

    const edgeRe =
      /([A-Za-z][A-Za-z0-9_]*)\s*(?:--+|==+)\s*>\s*(?:\|([^|]+)\|)?\s*([A-Za-z][A-Za-z0-9_]*)/g;
    while ((m = edgeRe.exec(line))) {
      ensure(m[1]);
      ensure(m[3]);
      edges.push({ from: m[1], to: m[3], label: (m[2] || "").trim() });
    }
  }

  return { dir, nodes: order.map((id) => nodes.get(id)!), edges };
}

function rankNodes(nodes: FlowNode[], edges: FlowEdge[]) {
  const ids = nodes.map((n) => n.id);
  const preds = new Map<string, string[]>(ids.map((id) => [id, []]));
  const succs = new Map<string, string[]>(ids.map((id) => [id, []]));
  for (const e of edges) {
    if (!preds.has(e.to) || !succs.has(e.from)) continue;
    preds.get(e.to)!.push(e.from);
    succs.get(e.from)!.push(e.to);
  }
  const rank = new Map<string, number>(ids.map((id) => [id, 0]));
  for (let pass = 0; pass < ids.length + 2; pass++) {
    let changed = false;
    for (const id of ids) {
      const p = preds.get(id) || [];
      if (!p.length) continue;
      const next = 1 + Math.max(...p.map((x) => rank.get(x) ?? 0));
      if (next > (rank.get(id) ?? 0)) {
        rank.set(id, next);
        changed = true;
      }
    }
    if (!changed) break;
  }
  const byRank = new Map<number, string[]>();
  for (const id of ids) {
    const r = rank.get(id) ?? 0;
    const list = byRank.get(r) || [];
    list.push(id);
    byRank.set(r, list);
  }
  return { rank, byRank, succs };
}

function flowchartToSvg(src: string): string {
  const mid = `doc-arrow-${++diagramSeq}`;
  const { dir, nodes, edges } = parseFlowchart(src);
  if (!nodes.length) return `<div class="doc-diagram"><p class="text-sm text-[var(--muted)]">Empty diagram.</p></div>`;

  const isH = dir === "LR";
  const { rank, byRank } = rankNodes(nodes, edges);
  const maxRank = Math.max(...[...rank.values(), 0]);
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const linesOf = new Map(nodes.map((n) => [n.id, wrapLabel(n.label, n.shape === "diamond" ? 16 : 22)]));

  const sized = nodes.map((n) => {
    const lines = linesOf.get(n.id)!;
    const textW = Math.max(...lines.map((l) => l.length), 6) * 7.2 + 28;
    const w = Math.min(n.shape === "diamond" ? 200 : 230, Math.max(n.shape === "diamond" ? 110 : 96, textW));
    const h = Math.max(n.shape === "diamond" ? 52 : 36, 14 + lines.length * 16 + (n.shape === "diamond" ? 10 : 0));
    return { ...n, w, h, lines };
  });
  const sizedMap = new Map(sized.map((n) => [n.id, n]));

  const gapX = 36;
  const gapY = 56;
  const pad = 20;
  const rankWidths: number[] = [];
  const rankHeights: number[] = [];
  for (let r = 0; r <= maxRank; r++) {
    const ids = byRank.get(r) || [];
    const items = ids.map((id) => sizedMap.get(id)!);
    rankWidths[r] = items.reduce((s, n) => s + n.w, 0) + Math.max(0, items.length - 1) * gapX;
    rankHeights[r] = items.reduce((s, n) => Math.max(s, n.h), 0);
  }

  type Box = { x: number; y: number; w: number; h: number; cx: number; cy: number; shape: NodeShape; lines: string[] };
  const boxes = new Map<string, Box>();

  if (isH) {
    let x = pad;
    for (let r = 0; r <= maxRank; r++) {
      const ids = byRank.get(r) || [];
      const colW = Math.max(...ids.map((id) => sizedMap.get(id)!.w), 80);
      const totalH = ids.reduce((s, id) => s + sizedMap.get(id)!.h, 0) + Math.max(0, ids.length - 1) * 20;
      let y = pad + Math.max(0, (Math.max(...rankHeights) - totalH) / 2);
      for (const id of ids) {
        const n = sizedMap.get(id)!;
        boxes.set(id, {
          x,
          y,
          w: n.w,
          h: n.h,
          cx: x + n.w / 2,
          cy: y + n.h / 2,
          shape: n.shape,
          lines: n.lines,
        });
        y += n.h + 20;
      }
      x += colW + gapY;
    }
  } else {
    let y = pad;
    const canvasW = Math.max(...rankWidths, 280);
    for (let r = 0; r <= maxRank; r++) {
      const ids = byRank.get(r) || [];
      const rowW = rankWidths[r] || 0;
      let x = pad + Math.max(0, (canvasW - rowW) / 2);
      const rowH = rankHeights[r] || 40;
      for (const id of ids) {
        const n = sizedMap.get(id)!;
        boxes.set(id, {
          x,
          y: y + (rowH - n.h) / 2,
          w: n.w,
          h: n.h,
          cx: x + n.w / 2,
          cy: y + rowH / 2,
          shape: n.shape,
          lines: n.lines,
        });
        x += n.w + gapX;
      }
      y += rowH + gapY;
    }
  }

  let maxX = pad;
  let maxY = pad;
  for (const b of boxes.values()) {
    maxX = Math.max(maxX, b.x + b.w);
    maxY = Math.max(maxY, b.y + b.h);
  }
  const W = Math.ceil(maxX + pad);
  const H = Math.ceil(maxY + pad);

  const nodeSvg = sized
    .map((n) => {
      const b = boxes.get(n.id)!;
      const fill = n.shape === "diamond" ? "#fff7ed" : "#f0fdfa";
      const stroke = n.shape === "diamond" ? "#fdba74" : "#5eead4";
      const textFill = n.shape === "diamond" ? "#9a3412" : "#134e4a";
      let shapeEl: string;
      if (n.shape === "diamond") {
        const pts = `${b.cx},${b.y} ${b.x + b.w},${b.cy} ${b.cx},${b.y + b.h} ${b.x},${b.cy}`;
        shapeEl = `<polygon points="${pts}" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>`;
      } else if (n.shape === "round") {
        shapeEl = `<rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" rx="${b.h / 2}" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>`;
      } else {
        shapeEl = `<rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" rx="10" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>`;
      }
      const startY = b.cy - ((b.lines.length - 1) * 14) / 2 + 4;
      const text = b.lines
        .map(
          (ln, i) =>
            `<text x="${b.cx}" y="${startY + i * 14}" text-anchor="middle" font-size="12" font-weight="600" fill="${textFill}">${xml(ln)}</text>`
        )
        .join("");
      return `<g>${shapeEl}${text}</g>`;
    })
    .join("");

  const edgeSvg = edges
    .map((e) => {
      const a = boxes.get(e.from);
      const b = boxes.get(e.to);
      if (!a || !b) return "";
      let x1: number, y1: number, x2: number, y2: number;
      if (isH) {
        x1 = a.x + a.w;
        y1 = a.cy;
        x2 = b.x;
        y2 = b.cy;
      } else {
        x1 = a.cx;
        y1 = a.y + a.h;
        x2 = b.cx;
        y2 = b.y;
      }
      const mx = (x1 + x2) / 2;
      const my = (y1 + y2) / 2;
      const d = isH
        ? `M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`
        : `M ${x1} ${y1} C ${x1} ${my}, ${x2} ${my}, ${x2} ${y2}`;
      const label = e.label
        ? `<text x="${mx}" y="${my - 4}" text-anchor="middle" font-size="10" fill="#0f766e">${xml(e.label)}</text>`
        : "";
      return `<path d="${d}" fill="none" stroke="#0b6e6a" stroke-width="1.4" marker-end="url(#${mid})"/>${label}`;
    })
    .join("");

  return `<div class="doc-diagram"><svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Flowchart"><defs><marker id="${mid}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#0b6e6a"/></marker></defs>${edgeSvg}${nodeSvg}</svg></div>`;
}

type SeqMsg = { from: string; to: string; text: string; dashed: boolean };

function parseSequence(src: string): { actors: Array<{ id: string; label: string }>; messages: SeqMsg[] } {
  const actors: Array<{ id: string; label: string }> = [];
  const seen = new Map<string, string>();
  const messages: SeqMsg[] = [];
  const addActor = (id: string, label?: string) => {
    if (!seen.has(id)) {
      seen.set(id, label || id);
      actors.push({ id, label: label || id });
    } else if (label) {
      seen.set(id, label);
      const row = actors.find((a) => a.id === id);
      if (row) row.label = label;
    }
  };
  for (const raw of src.split("\n")) {
    const line = raw.trim();
    if (!line || /^sequenceDiagram\b/i.test(line) || line.startsWith("%%")) continue;
    const p = /^participant\s+(\S+)(?:\s+as\s+(.+))?$/i.exec(line);
    if (p) {
      addActor(p[1], p[2]?.trim());
      continue;
    }
    const msg = /^(\S+)\s*(-{1,2}>{1,2}|-{1,2}>>)\s*(\S+)\s*:\s*(.*)$/.exec(line);
    if (msg) {
      addActor(msg[1]);
      addActor(msg[3]);
      messages.push({ from: msg[1], to: msg[3], text: msg[4].trim(), dashed: msg[2].includes("--") });
    }
  }
  return { actors, messages };
}

function sequenceToSvg(src: string): string {
  const { actors, messages } = parseSequence(src);
  if (!actors.length) return `<div class="doc-diagram"><p class="text-sm text-[var(--muted)]">Empty sequence.</p></div>`;
  const mid = `doc-arrow-${++diagramSeq}`;
  const colW = 160;
  const padX = 36;
  const headH = 44;
  const rowH = 44;
  const W = Math.max(320, padX * 2 + actors.length * colW);
  const H = headH + 24 + messages.length * rowH + 36;
  const xOf = (id: string) => {
    const i = actors.findIndex((a) => a.id === id);
    return padX + i * colW + colW / 2;
  };
  const heads = actors
    .map((a) => {
      const x = xOf(a.id);
      const lines = wrapLabel(a.label, 16);
      const text = lines
        .map(
          (ln, i) =>
            `<text x="${x}" y="${22 + i * 13}" text-anchor="middle" font-size="12" font-weight="700" fill="#134e4a">${xml(ln)}</text>`
        )
        .join("");
      return `<rect x="${x - 62}" y="6" width="124" height="${headH - 8}" rx="10" fill="#f0fdfa" stroke="#5eead4" stroke-width="1.5"/>${text}<line x1="${x}" y1="${headH}" x2="${x}" y2="${H - 12}" stroke="#99f6e4" stroke-width="1.5"/>`;
    })
    .join("");
  const body = messages
    .map((m, i) => {
      const y = headH + 28 + i * rowH;
      const x1 = xOf(m.from);
      const x2 = xOf(m.to);
      const left = Math.min(x1, x2);
      const right = Math.max(x1, x2);
      const dash = m.dashed ? ` stroke-dasharray="5 4"` : "";
      const dir = x2 >= x1 ? 1 : -1;
      return `<line x1="${x1}" y1="${y}" x2="${x2 - 10 * dir}" y2="${y}" stroke="#0b6e6a" stroke-width="1.4"${dash} marker-end="url(#${mid})"/>
        <text x="${(left + right) / 2}" y="${y - 8}" text-anchor="middle" font-size="11" fill="#134e4a">${xml(m.text)}</text>`;
    })
    .join("");
  return `<div class="doc-diagram"><svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Sequence diagram"><defs><marker id="${mid}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#0b6e6a"/></marker></defs>${heads}${body}</svg></div>`;
}

export function mermaidToHtml(src: string): string {
  if (/^\s*sequenceDiagram\b/im.test(src)) return sequenceToSvg(src);
  return flowchartToSvg(src);
}
