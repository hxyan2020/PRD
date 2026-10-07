import { useEffect, useMemo, useState } from 'react'
import { useI18n } from '../i18n/I18nContext'
import {
  localizePaintingLabelsBatch,
  withStaticLabels,
  type LocalizedPainting,
} from '../lib/localizePainting'
import type { Painting } from '../types'

/**
 * Batch-localize a list of paintings for gallery/home/collection cards.
 * Applies static genre/country labels immediately, then Wikidata names.
 */
export function useLocalizedPaintings(paintings: Painting[]): {
  paintings: LocalizedPainting[]
  loading: boolean
} {
  const { lang } = useI18n()
  const idsKey = useMemo(() => paintings.map((p) => p.id).join('|'), [paintings])
  const [localized, setLocalized] = useState<LocalizedPainting[]>(() =>
    paintings.map((p) => withStaticLabels(p, lang)),
  )
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    const snapshot = paintings
    setLocalized(snapshot.map((p) => withStaticLabels(p, lang)))

    if (lang === 'en' || !snapshot.length) {
      setLoading(false)
      return
    }

    setLoading(true)
    localizePaintingLabelsBatch(snapshot, lang)
      .then((result) => {
        if (!cancelled) setLocalized(result)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
    // idsKey tracks painting identity/order; paintings array may be new each render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey, lang])

  return { paintings: localized, loading }
}
