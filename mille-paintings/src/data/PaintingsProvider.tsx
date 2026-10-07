import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Painting, PaintingsPayload } from '../types'
import { addExtraPaintings, getExtraPaintings, getStats, markViewed, toggleCollected, isCollected } from '../lib/storage'

type Ctx = {
  status: 'loading' | 'error' | 'ready'
  message?: string
  paintings: Painting[]
  coreCount: number
  source?: string
  stats: { viewed: number; collected: number; extras: number }
  refreshStats: () => void
  trackView: (id: string) => void
  toggleCollect: (id: string) => boolean
  collected: (id: string) => boolean
  mergeExtras: (items: Painting[]) => void
}

const PaintingsContext = createContext<Ctx | null>(null)

export function PaintingsProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<'loading' | 'error' | 'ready'>('loading')
  const [message, setMessage] = useState<string>()
  const [core, setCore] = useState<Painting[]>([])
  const [extras, setExtras] = useState<Painting[]>([])
  const [source, setSource] = useState<string>()
  const [stats, setStats] = useState(getStats())

  useEffect(() => {
    let cancelled = false
    fetch(`${import.meta.env.BASE_URL}data/paintings.json`)
      .then((r) => {
        if (!r.ok) throw new Error(`Failed to load paintings (${r.status})`)
        return r.json() as Promise<PaintingsPayload>
      })
      .then((data) => {
        if (cancelled) return
        setCore(data.paintings)
        setSource(data.source)
        setExtras(getExtraPaintings())
        setStatus('ready')
        setStats(getStats())
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setStatus('error')
          setMessage(err instanceof Error ? err.message : 'Failed to load')
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  const paintings = useMemo(() => {
    const byId = new Map<string, Painting>()
    for (const p of core) byId.set(p.id, p)
    for (const p of extras) if (!byId.has(p.id)) byId.set(p.id, p)
    return [...byId.values()].sort((a, b) => b.sitelinks - a.sitelinks)
  }, [core, extras])

  const value: Ctx = {
    status,
    message,
    paintings,
    coreCount: core.length,
    source,
    stats,
    refreshStats: () => setStats(getStats()),
    trackView: (id) => {
      markViewed(id)
      setStats(getStats())
    },
    toggleCollect: (id) => {
      toggleCollected(id)
      setStats(getStats())
      return isCollected(id)
    },
    collected: (id) => isCollected(id),
    mergeExtras: (items) => {
      const next = addExtraPaintings(items)
      setExtras(next)
      setStats(getStats())
    },
  }

  return <PaintingsContext.Provider value={value}>{children}</PaintingsContext.Provider>
}

export function usePaintingsStore() {
  const ctx = useContext(PaintingsContext)
  if (!ctx) throw new Error('usePaintingsStore requires PaintingsProvider')
  return ctx
}
