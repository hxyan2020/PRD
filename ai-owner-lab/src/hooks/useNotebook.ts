import { useEffect, useState } from 'react'
import { notebookStore } from './notebookStore'

export type NotebookEntryType = 'clip' | 'explanation' | 'note'

export interface NotebookCategory {
  id: string
  name: string
  createdAt: string
}

export interface NotebookEntry {
  id: string
  createdAt: string
  updatedAt?: string
  type: NotebookEntryType
  title?: string
  selectedText: string
  explanation?: string
  categoryIds?: string[]
  sourceLabel?: string
  sourcePath?: string
  model?: string
}

export interface TrashedNotebookEntry extends NotebookEntry {
  deletedAt: string
}

export function useNotebook() {
  const [entries, setEntries] = useState<NotebookEntry[]>(() => notebookStore.get())
  const [trash, setTrash] = useState<TrashedNotebookEntry[]>(() => notebookStore.getTrash())
  const [categories, setCategories] = useState<NotebookCategory[]>(() =>
    notebookStore.getCategories(),
  )

  useEffect(() => {
    const unsubEntries = notebookStore.subscribe(setEntries)
    const unsubTrash = notebookStore.subscribeTrash(setTrash)
    const unsubCategories = notebookStore.subscribeCategories(setCategories)
    return () => {
      unsubEntries()
      unsubTrash()
      unsubCategories()
    }
  }, [])

  return {
    entries,
    trash,
    categories,
    count: entries.length,
    trashCount: trash.length,
    addClip: notebookStore.addClip,
    addExplanation: notebookStore.addExplanation,
    addNote: notebookStore.addNote,
    updateEntry: notebookStore.update,
    removeEntry: notebookStore.remove,
    restoreEntry: notebookStore.restore,
    addCategory: notebookStore.addCategory,
    renameCategory: notebookStore.renameCategory,
    removeCategory: notebookStore.removeCategory,
  }
}

export function formatTimestamp(iso: string, lang?: 'en' | 'zh'): string {
  try {
    const locale = lang === 'zh' ? 'zh-CN' : undefined
    return new Intl.DateTimeFormat(locale, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(iso))
  } catch {
    return iso
  }
}
