import { useEffect, useState } from 'react'
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
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
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

  return (
    <div
      className="note-image-lightbox"
      role="dialog"
      aria-modal="true"
      aria-label={t('editorImageFullscreen')}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="note-image-lightbox-panel">
        <div className="note-image-lightbox-toolbar">
          <button type="button" className="btn primary" onClick={onClose}>
            {t('closeNote')}
          </button>
          <button type="button" className="btn ghost" disabled={busy} onClick={() => void onDownload()}>
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
    </div>
  )
}
