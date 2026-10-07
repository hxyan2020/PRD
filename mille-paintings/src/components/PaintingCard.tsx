import { Link } from 'react-router-dom'
import type { Painting } from '../types'
import { useI18n } from '../i18n/I18nContext'
import { optionLabel, optionLabels } from '../lib/optionLabels'
import { displayImageUrl } from '../lib/images'
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

  return (
    <Link to={`/painting/${painting.id}`} className="painting-card">
      <div className="painting-card-media">
        <SafeImage
          src={displayImageUrl(painting)}
          fallbackSrc={painting.image}
          alt={painting.name}
          loading="lazy"
          decoding="async"
        />
        {painting.lostOrDestroyed ? <span className="lost-badge">{t('lostDestroyed')}</span> : null}
        {collected ? <span className="collected-badge">{t('collected')}</span> : null}
        <span className="rank-badge">#{painting.rank || '—'}</span>
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
