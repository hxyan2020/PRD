import { useEffect, useState } from 'react'
import { notebookStore } from './notebookStore'

export type NotebookEntryType = 'clip' | 'explanation'

export interface NotebookEntry {
  id: string
  createdAt: string
  type: NotebookEntryType
  selectedText: string
  explanation?: string
  sourceLabel?: string
  sourcePath?: string
  model?: string
}

export function useNotebook() {
  const [entries, setEntries] = useState<NotebookEntry[]>(() => notebookStore.get())

  useEffect(() => {
    return notebookStore.subscribe(setEntries)
  }, [])

  return {
    entries,
    count: entries.length,
    addClip: notebookStore.addClip,
    addExplanation: notebookStore.addExplanation,
    removeEntry: notebookStore.remove,
    clearAll: notebookStore.clear,
  }
}

export function formatTimestamp(iso: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(iso))
  } catch {
    return iso
  }
}
