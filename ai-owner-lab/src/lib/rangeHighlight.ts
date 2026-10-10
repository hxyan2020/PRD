/** Highlight every text run intersecting a Range — works across list items / rows. */

export function getTextNodesInRange(range: Range): Text[] {
  const root = range.commonAncestorContainer
  const walkerRoot =
    root.nodeType === Node.ELEMENT_NODE ? (root as Element) : root.parentElement
  if (!walkerRoot) return []

  const nodes: Text[] = []
  const walker = document.createTreeWalker(walkerRoot, NodeFilter.SHOW_TEXT)
  let node = walker.nextNode()
  while (node) {
    const text = node as Text
    if (textLength(text) > 0 && rangeIntersectsNode(range, text)) {
      nodes.push(text)
    }
    node = walker.nextNode()
  }

  // Single-text-node selections may not be under an Element walker root that's large enough.
  if (
    !nodes.length &&
    range.startContainer.nodeType === Node.TEXT_NODE &&
    range.startContainer === range.endContainer
  ) {
    nodes.push(range.startContainer as Text)
  }
  return nodes
}

function textLength(node: Text): number {
  return (node.nodeValue || '').replace(/\u200b/g, '').length
}

function rangeIntersectsNode(range: Range, node: Node): boolean {
  try {
    const nodeRange = document.createRange()
    nodeRange.selectNodeContents(node)
    // start of range is before end of node AND end of range is after start of node
    return (
      range.compareBoundaryPoints(Range.END_TO_START, nodeRange) < 0 &&
      range.compareBoundaryPoints(Range.START_TO_END, nodeRange) > 0
    )
  } catch {
    return false
  }
}

function clipRangeToTextNode(range: Range, text: Text): Range {
  const clipped = document.createRange()
  const start =
    text === range.startContainer ? range.startOffset : 0
  const end =
    text === range.endContainer ? range.endOffset : (text.nodeValue || '').length
  clipped.setStart(text, Math.min(start, (text.nodeValue || '').length))
  clipped.setEnd(text, Math.min(end, (text.nodeValue || '').length))
  return clipped
}

export function highlightRange(range: Range, color: string): boolean {
  if (range.collapsed) return false
  const texts = getTextNodesInRange(range)
  if (!texts.length) return false

  const marks: HTMLElement[] = []
  // Process from the end so earlier offsets stay valid.
  for (const text of [...texts].reverse()) {
    const piece = clipRangeToTextNode(range, text)
    if (piece.collapsed) continue
    const mark = document.createElement('mark')
    mark.style.backgroundColor = color
    mark.style.color = 'inherit'
    try {
      piece.surroundContents(mark)
      marks.push(mark)
    } catch {
      const fragment = piece.extractContents()
      if (!fragment.textContent) continue
      mark.appendChild(fragment)
      piece.insertNode(mark)
      marks.push(mark)
    }
  }

  if (!marks.length) return false

  // Collapse nested marks created by re-highlighting.
  const roots = new Set(
    marks
      .map((m) => m.closest('.rte-editor, .notebook-quote') || m.parentElement)
      .filter(Boolean) as Element[],
  )
  for (const root of roots) {
    root.querySelectorAll('mark mark').forEach((inner) => {
      const parent = inner.parentElement
      if (!parent) return
      while (inner.firstChild) parent.insertBefore(inner.firstChild, inner)
      inner.remove()
    })
  }

  const selection = window.getSelection()
  selection?.removeAllRanges()
  if (marks.length) {
    const restore = document.createRange()
    restore.setStartBefore(marks[marks.length - 1])
    restore.setEndAfter(marks[0])
    try {
      selection?.addRange(restore)
    } catch {
      /* ignore */
    }
  }
  return true
}

export function clearHighlightInRange(range: Range, editorRoot?: Element | null) {
  const root =
    editorRoot ||
    (range.commonAncestorContainer.nodeType === Node.ELEMENT_NODE
      ? (range.commonAncestorContainer as Element)
      : range.commonAncestorContainer.parentElement)
  if (!root) return

  const scope = root.closest('.rte-editor, .notebook-quote') || root
  const marks = [...scope.querySelectorAll('mark')]
  for (const mark of marks) {
    if (!rangeIntersectsNode(range, mark) && !range.intersectsNode?.(mark)) continue
    const parent = mark.parentNode
    if (!parent) continue
    while (mark.firstChild) parent.insertBefore(mark.firstChild, mark)
    parent.removeChild(mark)
    parent.normalize?.()
  }

  // Also unwrap legacy span highlights from execCommand backColor/hiliteColor.
  const spans = [...scope.querySelectorAll('span[style*="background"]')]
  for (const span of spans) {
    if (!rangeIntersectsNode(range, span)) continue
    const style = (span.getAttribute('style') || '').toLowerCase()
    if (!/background(-color)?\s*:/.test(style)) continue
    const parent = span.parentNode
    if (!parent) continue
    while (span.firstChild) parent.insertBefore(span.firstChild, span)
    parent.removeChild(span)
    parent.normalize?.()
  }
}
