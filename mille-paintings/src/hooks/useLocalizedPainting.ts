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

    // Snapshot fields for this effect run so id/lang-only deps stay stable
    // even when the parent rebuilds the painting object identity.
    const snapshot = painting
    let cancelled = false
    // Clear body copy while translating so English catalogue text is not shown
    // under a translated “About” heading.
    setLocalized({
      ...snapshot,
      intro: lang === 'en' ? snapshot.intro : '',
      anecdote: lang === 'en' ? snapshot.anecdote : '',
      localized: false,
    })

    if (lang === 'en') {
      setLoading(false)
      return
    }

    setLoading(true)
    localizePainting(snapshot, lang, (partial) => {
      if (!cancelled) setLocalized(partial)
    })
      .then((result) => {
        if (!cancelled) setLocalized(result)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [painting?.id, lang])

  return { painting: localized, loading }
}
