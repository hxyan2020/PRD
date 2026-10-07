import { useCallback, useEffect, useState } from 'react'
import { TOTAL_DAYS } from '../data/curriculum'

const STORAGE_KEY = 'ownlab-progress-v1'

export interface ProgressState {
  completed: number[]
  notes: Record<number, string>
}

function load(): ProgressState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { completed: [], notes: {} }
    const parsed = JSON.parse(raw) as ProgressState
    return {
      completed: Array.isArray(parsed.completed) ? parsed.completed : [],
      notes: parsed.notes && typeof parsed.notes === 'object' ? parsed.notes : {},
    }
  } catch {
    return { completed: [], notes: {} }
  }
}

export function useProgress() {
  const [state, setState] = useState<ProgressState>({ completed: [], notes: {} })

  useEffect(() => {
    setState(load())
  }, [])

  const persist = useCallback((next: ProgressState) => {
    setState(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }, [])

  const isComplete = useCallback(
    (day: number) => state.completed.includes(day),
    [state.completed],
  )

  const toggleComplete = useCallback(
    (day: number) => {
      const exists = state.completed.includes(day)
      const completed = exists
        ? state.completed.filter((d) => d !== day)
        : [...state.completed, day].sort((a, b) => a - b)
      persist({ ...state, completed })
    },
    [persist, state],
  )

  const setNote = useCallback(
    (day: number, note: string) => {
      persist({ ...state, notes: { ...state.notes, [day]: note } })
    },
    [persist, state],
  )

  const reset = useCallback(() => {
    persist({ completed: [], notes: {} })
  }, [persist])

  const completedCount = state.completed.length
  const percent = Math.round((completedCount / TOTAL_DAYS) * 100)
  const nextDay =
    Array.from({ length: TOTAL_DAYS }, (_, i) => i + 1).find((d) => !state.completed.includes(d)) ??
    TOTAL_DAYS

  return {
    ...state,
    isComplete,
    toggleComplete,
    setNote,
    reset,
    completedCount,
    percent,
    nextDay,
    total: TOTAL_DAYS,
  }
}
