import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { Painting } from '../types'
import { useI18n } from '../i18n/I18nContext'
import { optionLabel, optionLabels } from '../lib/optionLabels'
import { displayImageUrl, imageCandidates } from '../lib/images'
import { CountryFlags } from './CountryFlags'
import { SafeImage } from './SafeImage'
import './PaintingCard.css'

export function PaintingCard({
  painting,
  collected = false,
}: {
  painting: Painting
  collected?: boolean
}) {
  const { t, lang } = useI18n()
  const genre = optionLabels(lang, painting.genre)
  const country = optionLabel(lang, painting.painterCountry)
  const [hidden, setHidden] = useState(false)
  const candidates = imageCandidates(painting)
  const primary = displayImageUrl(painting)

  // Hide cards that cannot show any image — better than empty `#—` placeholders.
  if (hidden || !primary) return null

  const rankLabel =
    painting.rank > 0
      ? `#${painting.rank}`
      : painting.discovered
        ? t('discoveredBadge')
        : '#—'

  return (
    <Link to={`/painting/${painting.id}`} className="painting-card">
      <div className="painting-card-media">
        <SafeImage
          src={primary}
          candidates={candidates.slice(1)}
          alt={painting.name}
          loading="lazy"
          decoding="async"
          onAllFailed={() => setHidden(true)}
        />
        {painting.lostOrDestroyed ? <span className="lost-badge">{t('lostDestroyed')}</span> : null}
        {collected ? <span className="collected-badge">{t('collected')}</span> : null}
        <span className={`rank-badge${painting.rank > 0 ? '' : ' rank-badge-soft'}`}>{rankLabel}</span>
      </div>
      <div className="painting-card-meta">
        <h2>{painting.name}</h2>
        <p>
          {painting.painter}
          <span>
            {painting.painterBirthYear}–{painting.painterDeathYear}
          </span>
        </p>
        <p className="country-line">
          <CountryFlags
            country={painting.painterCountry}
            displayName={country}
            label
            size="sm"
          />
        </p>
        <p className="genre">{genre}</p>
      </div>
    </Link>
  )
}
