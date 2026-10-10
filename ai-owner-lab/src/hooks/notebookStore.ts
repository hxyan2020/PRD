import type { NotebookCategory, NotebookEntry, TrashedNotebookEntry } from './useNotebook'

const STORAGE_KEY = 'ownlab-notebook-v1'
const TRASH_STORAGE_KEY = 'ownlab-notebook-trash-v1'
const CATEGORY_STORAGE_KEY = 'ownlab-notebook-categories-v1'

type EntryListener = (entries: NotebookEntry[]) => void
type TrashListener = (trash: TrashedNotebookEntry[]) => void
type CategoryListener = (categories: NotebookCategory[]) => void

const entryListeners = new Set<EntryListener>()
const trashListeners = new Set<TrashListener>()
const categoryListeners = new Set<CategoryListener>()

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
  entryListeners.forEach((listener) => listener(sorted))
}

function readTrash(): TrashedNotebookEntry[] {
  try {
    const raw = localStorage.getItem(TRASH_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as TrashedNotebookEntry[]
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter(
        (e) =>
          e &&
          typeof e.id === 'string' &&
          typeof e.selectedText === 'string' &&
          typeof e.deletedAt === 'string',
      )
      .sort((a, b) => new Date(b.deletedAt).getTime() - new Date(a.deletedAt).getTime())
  } catch {
    return []
  }
}

function writeTrash(trash: TrashedNotebookEntry[]) {
  const sorted = [...trash].sort(
    (a, b) => new Date(b.deletedAt).getTime() - new Date(a.deletedAt).getTime(),
  )
  localStorage.setItem(TRASH_STORAGE_KEY, JSON.stringify(sorted))
  trashListeners.forEach((listener) => listener(sorted))
}

function readCategories(): NotebookCategory[] {
  try {
    const raw = localStorage.getItem(CATEGORY_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as NotebookCategory[]
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter((c) => c && typeof c.id === 'string' && typeof c.name === 'string')
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }))
  } catch {
    return []
  }
}

function writeCategories(categories: NotebookCategory[]) {
  const sorted = [...categories].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }),
  )
  localStorage.setItem(CATEGORY_STORAGE_KEY, JSON.stringify(sorted))
  categoryListeners.forEach((listener) => listener(sorted))
}

function uid(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

function normalizeCategoryIds(ids: string[] | undefined): string[] | undefined {
  if (!ids?.length) return undefined
  const unique = [...new Set(ids.filter(Boolean))]
  return unique.length ? unique : undefined
}

export const notebookStore = {
  get: read,
  getTrash: readTrash,
  getCategories: readCategories,
  subscribe(listener: EntryListener) {
    entryListeners.add(listener)
    return () => {
      entryListeners.delete(listener)
    }
  },
  subscribeTrash(listener: TrashListener) {
    trashListeners.add(listener)
    return () => {
      trashListeners.delete(listener)
    }
  },
  subscribeCategories(listener: CategoryListener) {
    categoryListeners.add(listener)
    return () => {
      categoryListeners.delete(listener)
    }
  },
  addClip(input: {
    selectedText: string
    sourceLabel?: string
    sourcePath?: string
    categoryIds?: string[]
  }) {
    const entry: NotebookEntry = {
      id: uid('nb'),
      createdAt: new Date().toISOString(),
      type: 'clip',
      selectedText: input.selectedText.trim(),
      categoryIds: normalizeCategoryIds(input.categoryIds),
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
    categoryIds?: string[]
  }) {
    const entry: NotebookEntry = {
      id: uid('nb'),
      createdAt: new Date().toISOString(),
      type: 'explanation',
      selectedText: input.selectedText.trim(),
      explanation: input.explanation.trim(),
      categoryIds: normalizeCategoryIds(input.categoryIds),
      sourceLabel: input.sourceLabel,
      sourcePath: input.sourcePath,
      model: input.model,
    }
    write([entry, ...read()])
    return entry
  },
  addNote(input: { text: string; title?: string; categoryIds?: string[] }) {
    const text = input.text.trim()
    if (!text) return null
    const title = input.title?.trim() || undefined
    const entry: NotebookEntry = {
      id: uid('nb'),
      createdAt: new Date().toISOString(),
      type: 'note',
      title,
      selectedText: text,
      categoryIds: normalizeCategoryIds(input.categoryIds),
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
      categoryIds?: string[]
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

    const categoryIds =
      patch.categoryIds !== undefined
        ? normalizeCategoryIds(patch.categoryIds)
        : current.categoryIds

    const updated: NotebookEntry = {
      ...current,
      title,
      selectedText,
      categoryIds,
      explanation: current.type === 'explanation' ? explanation ?? '' : explanation,
      updatedAt: new Date().toISOString(),
    }
    const next = [...entries]
    next[index] = updated
    write(next)
    return updated
  },
  remove(id: string) {
    const entries = read()
    const entry = entries.find((e) => e.id === id)
    if (!entry) return null
    const deletedAt = new Date().toISOString()
    const trashed: TrashedNotebookEntry = { ...entry, deletedAt }
    // Keep forever — never auto-purge. Replace any prior trash copy of same id.
    writeTrash([trashed, ...readTrash().filter((e) => e.id !== id)])
    write(entries.filter((e) => e.id !== id))
    return trashed
  },
  restore(id: string) {
    const trash = readTrash()
    const index = trash.findIndex((e) => e.id === id)
    if (index < 0) return null
    const trashed = trash[index]
    const restored: NotebookEntry = {
      id: trashed.id,
      createdAt: trashed.createdAt,
      updatedAt: new Date().toISOString(),
      type: trashed.type,
      title: trashed.title,
      selectedText: trashed.selectedText,
      explanation: trashed.explanation,
      categoryIds: trashed.categoryIds,
      sourceLabel: trashed.sourceLabel,
      sourcePath: trashed.sourcePath,
      model: trashed.model,
    }
    writeTrash(trash.filter((e) => e.id !== id))
    // If an active note somehow shares the id, keep the restored content under a new id.
    const active = read()
    if (active.some((e) => e.id === restored.id)) {
      restored.id = uid('nb')
    }
    write([restored, ...active])
    return restored
  },
  clear() {
    // Soft-clear: move every note into the dustbin so nothing is lost.
    const now = new Date().toISOString()
    const moving = read().map((entry) => ({ ...entry, deletedAt: now }))
    if (moving.length) {
      const keep = readTrash().filter((t) => !moving.some((m) => m.id === t.id))
      writeTrash([...moving, ...keep])
    }
    write([])
  },
  addCategory(name: string) {
    const trimmed = name.trim()
    if (!trimmed) return null
    const existing = readCategories()
    if (existing.some((c) => c.name.toLowerCase() === trimmed.toLowerCase())) {
      return existing.find((c) => c.name.toLowerCase() === trimmed.toLowerCase()) ?? null
    }
    const category: NotebookCategory = {
      id: uid('cat'),
      name: trimmed,
      createdAt: new Date().toISOString(),
    }
    writeCategories([...existing, category])
    return category
  },
  renameCategory(id: string, name: string) {
    const trimmed = name.trim()
    if (!trimmed) return null
    const categories = readCategories()
    const index = categories.findIndex((c) => c.id === id)
    if (index < 0) return null
    if (
      categories.some((c) => c.id !== id && c.name.toLowerCase() === trimmed.toLowerCase())
    ) {
      return null
    }
    const updated = { ...categories[index], name: trimmed }
    const next = [...categories]
    next[index] = updated
    writeCategories(next)
    return updated
  },
  removeCategory(id: string) {
    writeCategories(readCategories().filter((c) => c.id !== id))
    // Detach from notes that used this category.
    const entries = read()
    let changed = false
    const next = entries.map((entry) => {
      if (!entry.categoryIds?.includes(id)) return entry
      changed = true
      return {
        ...entry,
        categoryIds: normalizeCategoryIds(entry.categoryIds.filter((cid) => cid !== id)),
        updatedAt: new Date().toISOString(),
      }
    })
    if (changed) write(next)
  },
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key === STORAGE_KEY) {
      const entries = read()
      entryListeners.forEach((listener) => listener(entries))
    }
    if (event.key === TRASH_STORAGE_KEY) {
      const trash = readTrash()
      trashListeners.forEach((listener) => listener(trash))
    }
    if (event.key === CATEGORY_STORAGE_KEY) {
      const categories = readCategories()
      categoryListeners.forEach((listener) => listener(categories))
    }
  })
}
