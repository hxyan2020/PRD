import { useEffect, useState } from 'react'
import type { Painting, PaintingsPayload } from '../types'

type State =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; paintings: Painting[]; source: string; generatedAt: string }

let cache: PaintingsPayload | null = null

export function usePaintings(): State {
  const [state, setState] = useState<State>(() =>
    cache
      ? {
          status: 'ready',
          paintings: cache.paintings,
          source: cache.source,
          generatedAt: cache.generatedAt,
        }
      : { status: 'loading' },
  )

  useEffect(() => {
    if (cache) return
    let cancelled = false
    fetch('/data/paintings.json')
      .then((r) => {
        if (!r.ok) throw new Error(`Failed to load paintings (${r.status})`)
        return r.json() as Promise<PaintingsPayload>
      })
      .then((data) => {
        cache = data
        if (!cancelled) {
          setState({
            status: 'ready',
            paintings: data.paintings,
            source: data.source,
            generatedAt: data.generatedAt,
          })
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setState({
            status: 'error',
            message: err instanceof Error ? err.message : 'Failed to load',
          })
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  return state
}

export function getPaintingById(paintings: Painting[], id: string): Painting | undefined {
  return paintings.find((p) => p.id === id)
}
