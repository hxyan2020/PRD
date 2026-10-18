import { useRef, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { useLanguage } from '../i18n/LanguageContext'
import {
  attachmentIconKind,
  downloadNotebookFile,
  formatFileSize,
  NOTEBOOK_FILE_ACCEPT,
  uploadNotebookFile,
  type NotebookAttachment,
} from '../lib/notebookAttachments'

type Props = {
  attachments: NotebookAttachment[]
  onChange: (next: NotebookAttachment[]) => void | Promise<void>
  /** When false, hide upload control (read-only list + download). */
  canUpload?: boolean
  compact?: boolean
}

export function NoteAttachments({
  attachments,
  onChange,
  canUpload = true,
  compact = false,
}: Props) {
  const { t } = useLanguage()
  const { username } = useAuth()
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  async function onPick(files: FileList | null) {
    if (!files?.length) return
    if (!username) {
      setError(t('attachNeedSignIn'))
      return
    }
    setBusy(true)
    setError(null)
    try {
      const uploaded: NotebookAttachment[] = []
      for (const file of Array.from(files)) {
        setProgress(0)
        const att = await uploadNotebookFile(file, (pct) => setProgress(pct))
        uploaded.push(att)
      }
      await onChange([...attachments, ...uploaded])
    } catch (err) {
      setError(err instanceof Error ? err.message : t('attachFailed'))
    } finally {
      setBusy(false)
      setProgress(null)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  async function onDownload(att: NotebookAttachment) {
    setDownloadingId(att.id)
    setError(null)
    try {
      await downloadNotebookFile(att)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('attachDownloadFailed'))
    } finally {
      setDownloadingId(null)
    }
  }

  async function onRemove(id: string) {
    await onChange(attachments.filter((a) => a.id !== id))
  }

  return (
    <div className={`note-attachments${compact ? ' compact' : ''}`}>
      {!compact ? (
        <div className="note-attachments-head">
          <span className="notebook-field-label">{t('attachTitle')}</span>
          {canUpload ? (
            <button
              type="button"
              className="btn ghost"
              disabled={busy}
              onClick={() => {
                if (!username) {
                  setError(t('attachNeedSignIn'))
                  return
                }
                inputRef.current?.click()
              }}
            >
              {busy
                ? progress != null
                  ? t('attachUploading', { pct: Math.round(progress) })
                  : t('attachWorking')
                : t('attachAdd')}
            </button>
          ) : null}
        </div>
      ) : canUpload ? (
        <button
          type="button"
          className="btn ghost note-attach-compact-btn"
          disabled={busy}
          onClick={() => {
            if (!username) {
              setError(t('attachNeedSignIn'))
              return
            }
            inputRef.current?.click()
          }}
        >
          {busy
            ? progress != null
              ? t('attachUploading', { pct: Math.round(progress) })
              : t('attachWorking')
            : t('attachAdd')}
        </button>
      ) : null}

      <input
        ref={inputRef}
        type="file"
        multiple
        accept={NOTEBOOK_FILE_ACCEPT}
        className="sr-only"
        onChange={(e) => void onPick(e.target.files)}
      />

      {!compact ? <p className="note-attachments-hint">{t('attachHint')}</p> : null}

      {attachments.length > 0 ? (
        <ul className="note-attachments-list">
          {attachments.map((att) => (
            <li key={att.id} className={`note-att kind-${attachmentIconKind(att.name, att.contentType)}`}>
              <div className="note-att-meta">
                <span className="note-att-name" title={att.name}>
                  {att.name}
                </span>
                <span className="note-att-size">{formatFileSize(att.size)}</span>
              </div>
              <div className="note-att-actions">
                <button
                  type="button"
                  className="btn ghost"
                  disabled={downloadingId === att.id}
                  onClick={() => void onDownload(att)}
                >
                  {downloadingId === att.id ? t('attachDownloading') : t('attachDownload')}
                </button>
                {canUpload ? (
                  <button type="button" className="btn ghost" onClick={() => void onRemove(att.id)}>
                    {t('attachRemove')}
                  </button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      ) : !compact ? (
        <p className="note-attachments-empty">{t('attachEmpty')}</p>
      ) : null}

      {error ? (
        <p className="notebook-composer-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}
