import { Link } from 'react-router-dom'
import type { Painting } from '../types'
import { useI18n } from '../i18n/I18nContext'
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
  const { t } = useI18n()
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
          <CountryFlags country={painting.painterCountry} label size="sm" />
        </p>
        <p className="genre">{painting.genre}</p>
      </div>
    </Link>
  )
}
