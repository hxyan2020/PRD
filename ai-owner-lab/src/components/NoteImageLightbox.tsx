import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useLanguage } from '../i18n/LanguageContext'
import { downloadNoteImage, guessImageFilename } from '../lib/noteImage'

type Props = {
  src: string
  alt?: string
  onClose: () => void
}

export function NoteImageLightbox({ src, alt, onClose }: Props) {
  const { t } = useLanguage()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      e.preventDefault()
      e.stopImmediatePropagation()
      onClose()
    }
    // Capture phase so Escape closes the lightbox before the note reader.
    window.addEventListener('keydown', onKey, true)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey, true)
      document.body.style.overflow = prev
    }
  }, [onClose])

  async function onDownload() {
    setBusy(true)
    setError(null)
    try {
      await downloadNoteImage(src, guessImageFilename(src, 'ownlab-image'))
    } catch (err) {
      setError(err instanceof Error ? err.message : t('editorImageDownloadFailed'))
    } finally {
      setBusy(false)
    }
  }

  if (typeof document === 'undefined') return null

  return createPortal(
    <div
      className="note-image-lightbox"
      role="dialog"
      aria-modal="true"
      aria-label={t('editorImageFullscreen')}
      onClick={(e) => {
        // Backdrop or empty stage dismisses; image click does not.
        const target = e.target as HTMLElement
        if (target === e.currentTarget || target.classList.contains('note-image-lightbox-stage')) {
          onClose()
        }
      }}
    >
      <div className="note-image-lightbox-panel">
        <div className="note-image-lightbox-toolbar">
          <button
            type="button"
            className="btn primary note-image-lightbox-close"
            onClick={onClose}
            aria-label={t('closeNote')}
          >
            {t('closeNote')}
          </button>
          <button type="button" className="btn ghost note-image-lightbox-download" disabled={busy} onClick={() => void onDownload()}>
            {busy ? t('editorImageDownloading') : t('editorImageDownload')}
          </button>
        </div>
        {error ? (
          <p className="note-image-lightbox-error" role="alert">
            {error}
          </p>
        ) : null}
        <div className="note-image-lightbox-stage">
          <img src={src} alt={alt || ''} />
        </div>
      </div>
    </div>,
    document.body,
  )
}
