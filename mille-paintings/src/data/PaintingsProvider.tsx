import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Painting, PaintingsPayload } from '../types'
import {
  addExtraPaintings,
  getExtraPaintings,
  getStats,
  markViewed,
  setExtraPaintings,
  toggleCollected,
  isCollected,
} from '../lib/storage'
import { hasDisplayableImageUrl } from '../lib/images'
import { repairExtraPaintings } from '../lib/discover'
import { useAuth } from './AuthProvider'

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
  const { user, ready: authReady, persistLibrary } = useAuth()
  const [status, setStatus] = useState<'loading' | 'error' | 'ready'>('loading')
  const [message, setMessage] = useState<string>()
  const [core, setCore] = useState<Painting[]>([])
  const [extras, setExtras] = useState<Painting[]>([])
  const [source, setSource] = useState<string>()
  const [stats, setStats] = useState(() => getStats())

  // Load core catalog once.
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
        setStatus('ready')
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

  // Reload per-user extras/stats when auth session changes.
  const reloadUserLibrary = useCallback(() => {
    const raw = getExtraPaintings().map((p) => ({ ...p, discovered: true }))
    // Drop empties immediately; repair blocked hosts asynchronously.
    const quick = raw.filter((p) => hasDisplayableImageUrl(p) || p.image || p.imageFull)
    setExtras(quick.filter((p) => hasDisplayableImageUrl(p)))
    setStats(getStats())

    const needsRepair = raw.some(
      (p) => !hasDisplayableImageUrl(p) && (Boolean(p.image) || Boolean(p.imageFull) || Boolean(p.name)),
    )
    if (!needsRepair && quick.length === raw.length) return

    void repairExtraPaintings(raw).then((fixed) => {
      setExtraPaintings(fixed)
      setExtras(fixed.map((p) => ({ ...p, discovered: true })))
      setStats(getStats())
    })
  }, [])

  useEffect(() => {
    if (!authReady) return
    reloadUserLibrary()
  }, [authReady, user?.id, reloadUserLibrary])

  useEffect(() => {
    const onAuth = () => reloadUserLibrary()
    window.addEventListener('mille:auth-changed', onAuth)
    return () => window.removeEventListener('mille:auth-changed', onAuth)
  }, [reloadUserLibrary])

  const paintings = useMemo(() => {
    const byId = new Map<string, Painting>()
    for (const p of core) byId.set(p.id, { ...p, discovered: false })
    for (const p of extras) {
      if (!byId.has(p.id)) byId.set(p.id, { ...p, discovered: true })
    }
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
      void persistLibrary()
    },
    toggleCollect: (id) => {
      toggleCollected(id)
      setStats(getStats())
      void persistLibrary()
      return isCollected(id)
    },
    collected: (id) => isCollected(id),
    mergeExtras: (items) => {
      const tagged = items
        .map((p) => ({ ...p, discovered: true }))
        .filter((p) => hasDisplayableImageUrl(p))
      const next = addExtraPaintings(tagged)
        .map((p) => ({ ...p, discovered: true }))
        .filter((p) => hasDisplayableImageUrl(p))
      setExtras(next)
      setStats(getStats())
      void persistLibrary()
    },
  }

  return <PaintingsContext.Provider value={value}>{children}</PaintingsContext.Provider>
}

export function usePaintingsStore() {
  const ctx = useContext(PaintingsContext)
  if (!ctx) throw new Error('usePaintingsStore requires PaintingsProvider')
  return ctx
}
