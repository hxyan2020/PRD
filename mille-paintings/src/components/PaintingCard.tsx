import { Link } from 'react-router-dom'
import type { Painting } from '../types'
import { displayImageUrl } from '../lib/images'
import { SafeImage } from './SafeImage'
import './PaintingCard.css'

export function PaintingCard({ painting }: { painting: Painting }) {
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
        {painting.lostOrDestroyed ? <span className="lost-badge">Lost / Destroyed</span> : null}
        <span className="rank-badge">#{painting.rank}</span>
      </div>
      <div className="painting-card-meta">
        <h2>{painting.name}</h2>
        <p>
          {painting.painter}
          <span>
            {painting.painterBirthYear}–{painting.painterDeathYear}
          </span>
        </p>
        <p className="genre">{painting.genre}</p>
      </div>
    </Link>
  )
}
