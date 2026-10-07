import { useEffect } from 'react'
import type { Painting } from '../types'
import { useI18n } from '../i18n/I18nContext'
import './FullscreenViewer.css'

export function FullscreenViewer({
  painting,
  open,
  onClose,
}: {
  painting: Painting
  open: boolean
  onClose: () => void
}) {
  const { t } = useI18n()

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fs-viewer" role="dialog" aria-modal="true" aria-label={painting.name}>
      <button type="button" className="fs-close" onClick={onClose}>
        {t('exitFullscreen')}
      </button>
      <img src={painting.imageFull || painting.image} alt={painting.name} />
      <div className="fs-caption">
        <strong>{painting.name}</strong>
        <span>{painting.painter}</span>
      </div>
    </div>
  )
}
