import { useEffect, useState } from 'react'
import { useI18n } from '../i18n/I18nContext'
import { localizePainting, type LocalizedPainting } from '../lib/localizePainting'
import type { Painting } from '../types'

/** Return painting fields localized to the active UI language (Wikidata + Wikipedia). */
export function useLocalizedPainting(painting: Painting | null | undefined): {
  painting: LocalizedPainting | null
  loading: boolean
} {
  const { lang } = useI18n()
  const [localized, setLocalized] = useState<LocalizedPainting | null>(
    painting ? { ...painting, localized: false } : null,
  )
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!painting) {
      setLocalized(null)
      setLoading(false)
      return
    }

    let cancelled = false
    setLocalized({ ...painting, localized: false })

    if (lang === 'en') {
      setLoading(false)
      return
    }

    setLoading(true)
    localizePainting(painting, lang)
      .then((result) => {
        if (!cancelled) setLocalized(result)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [painting, painting?.id, lang])

  return { painting: localized, loading }
}
