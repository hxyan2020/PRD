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
