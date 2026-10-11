import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import type { Painting } from '../types'
import { useI18n } from '../i18n/I18nContext'
import { imageCandidates, viewerImageUrl, VIEWER_IMAGE_WIDTH } from '../lib/images'
import { SafeImage } from './SafeImage'
import './FullscreenViewer.css'

export function FullscreenViewer({
  painting,
  open,
  onClose,
  collected = false,
  onCollect,
  onSurprise,
}: {
  painting: Painting
  open: boolean
  onClose: () => void
  collected?: boolean
  onCollect?: () => void
  onSurprise?: () => void
}) {
  const { t } = useI18n()
  const preferred = viewerImageUrl(painting)
  const candidates = imageCandidates(painting, VIEWER_IMAGE_WIDTH)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'c' || e.key === 'C') onCollect?.()
      if (e.key === 's' || e.key === 'S') onSurprise?.()
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onClose, onCollect, onSurprise])

  if (!open) return null

  return createPortal(
    <div className="fs-viewer" role="dialog" aria-modal="true" aria-label={painting.name}>
      <button type="button" className="fs-close" onClick={onClose}>
        {t('exitFullscreen')}
      </button>
      {preferred ? (
        <SafeImage
          key={painting.id}
          src={preferred}
          candidates={candidates}
          alt={painting.name}
        />
      ) : null}
      <div className="fs-bar">
        <div className="fs-caption">
          <strong>{painting.name}</strong>
          <span>
            {painting.painter} ({painting.painterBirthYear}–{painting.painterDeathYear})
          </span>
        </div>
        {(onCollect || onSurprise) && (
          <div className="fs-actions">
            {onCollect ? (
              <button type="button" className={`btn ghost ${collected ? 'active' : ''}`} onClick={onCollect}>
                {collected ? t('collected') : t('collect')}
              </button>
            ) : null}
            {onSurprise ? (
              <button type="button" className="btn primary" onClick={onSurprise}>
                {t('surpriseMe')}
              </button>
            ) : null}
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}
