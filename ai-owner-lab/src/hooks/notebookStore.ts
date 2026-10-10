import type { NotebookEntry } from './useNotebook'

const STORAGE_KEY = 'ownlab-notebook-v1'

type Listener = (entries: NotebookEntry[]) => void

const listeners = new Set<Listener>()

function read(): NotebookEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as NotebookEntry[]
    if (!Array.isArray(parsed)) return []
    return parsed.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
  } catch {
    return []
  }
}

function write(entries: NotebookEntry[]) {
  const sorted = [...entries].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sorted))
  listeners.forEach((listener) => listener(sorted))
}

function uid() {
  return `nb_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

export const notebookStore = {
  get: read,
  subscribe(listener: Listener) {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  },
  addClip(input: {
    selectedText: string
    sourceLabel?: string
    sourcePath?: string
  }) {
    const entry: NotebookEntry = {
      id: uid(),
      createdAt: new Date().toISOString(),
      type: 'clip',
      selectedText: input.selectedText.trim(),
      sourceLabel: input.sourceLabel,
      sourcePath: input.sourcePath,
    }
    write([entry, ...read()])
    return entry
  },
  addExplanation(input: {
    selectedText: string
    explanation: string
    sourceLabel?: string
    sourcePath?: string
    model?: string
  }) {
    const entry: NotebookEntry = {
      id: uid(),
      createdAt: new Date().toISOString(),
      type: 'explanation',
      selectedText: input.selectedText.trim(),
      explanation: input.explanation.trim(),
      sourceLabel: input.sourceLabel,
      sourcePath: input.sourcePath,
      model: input.model,
    }
    write([entry, ...read()])
    return entry
  },
  addNote(input: { text: string; title?: string }) {
    // Caller may pass sanitized HTML; empty check is done upstream via plain text.
    const text = input.text.trim()
    if (!text) return null
    const title = input.title?.trim() || undefined
    const entry: NotebookEntry = {
      id: uid(),
      createdAt: new Date().toISOString(),
      type: 'note',
      title,
      selectedText: text,
      sourceLabel: 'Notebook',
    }
    write([entry, ...read()])
    return entry
  },
  update(
    id: string,
    patch: {
      title?: string
      selectedText?: string
      explanation?: string
    },
  ) {
    const entries = read()
    const index = entries.findIndex((e) => e.id === id)
    if (index < 0) return null
    const current = entries[index]
    const selectedText =
      patch.selectedText !== undefined ? patch.selectedText.trim() : current.selectedText
    if (!selectedText) return null

    let explanation = current.explanation
    if (patch.explanation !== undefined) {
      const next = patch.explanation.trim()
      explanation = next || undefined
    }

    let title = current.title
    if (patch.title !== undefined) {
      const next = patch.title.trim()
      title = next || undefined
    }

    const updated: NotebookEntry = {
      ...current,
      title,
      selectedText,
      explanation: current.type === 'explanation' ? explanation ?? '' : explanation,
      updatedAt: new Date().toISOString(),
    }
    const next = [...entries]
    next[index] = updated
    write(next)
    return updated
  },
  remove(id: string) {
    write(read().filter((e) => e.id !== id))
  },
  clear() {
    write([])
  },
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key === STORAGE_KEY) {
      const entries = read()
      listeners.forEach((listener) => listener(entries))
    }
  })
}
