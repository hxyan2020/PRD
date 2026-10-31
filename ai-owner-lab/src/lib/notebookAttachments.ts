import { upload } from '@vercel/blob/client'
import { loadCachedAccountUser } from './notebookAccountSync'

export type NotebookAttachment = {
  id: string
  name: string
  size: number
  contentType: string
  pathname: string
  uploadedAt: string
}

const ACCEPT =
  '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.txt,.csv,.md,.rtf,.html,.htm,.png,.jpg,.jpeg,.gif,.webp,.svg,.heic,.mp3,.mp4,.mov,.json,text/html'

export const NOTEBOOK_FILE_ACCEPT = ACCEPT

export function isNotebookAttachment(value: unknown): value is NotebookAttachment {
  if (!value || typeof value !== 'object') return false
  const row = value as Partial<NotebookAttachment>
  return (
    typeof row.id === 'string' &&
    typeof row.name === 'string' &&
    typeof row.pathname === 'string' &&
    typeof row.size === 'number' &&
    typeof row.contentType === 'string'
  )
}

export function parseAttachments(raw: unknown): NotebookAttachment[] {
  if (!Array.isArray(raw)) return []
  return raw.filter(isNotebookAttachment)
}

export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

export function attachmentIconKind(name: string, contentType: string): string {
  const lower = name.toLowerCase()
  const type = contentType.toLowerCase()
  if (type.startsWith('image/') || /\.(png|jpe?g|gif|webp|svg|heic)$/.test(lower)) return 'image'
  if (type.includes('pdf') || lower.endsWith('.pdf')) return 'pdf'
  if (/\.(xlsx?|csv)$/.test(lower) || type.includes('sheet') || type.includes('excel')) return 'sheet'
  if (/\.(pptx?)$/.test(lower) || type.includes('presentation')) return 'slides'
  if (
    /\.(docx?|rtf|txt|md|html?)$/.test(lower) ||
    type.startsWith('text/') ||
    type.includes('html')
  ) {
    return 'doc'
  }
  if (lower.endsWith('.zip') || type.includes('zip')) return 'zip'
  return 'file'
}

function uid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `att-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function safeFileName(name: string): string {
  return name.replace(/[^\w.\- ()[\]]+/g, '_').slice(0, 180) || 'file'
}

function contentTypeForUpload(file: File): string {
  if (file.type) return file.type
  const lower = file.name.toLowerCase()
  if (lower.endsWith('.html') || lower.endsWith('.htm')) return 'text/html;charset=utf-8'
  return 'application/octet-stream'
}

/**
 * Multipart adds part-init round-trips. For typical phone photos (under ~16MB)
 * a single PUT is faster; keep multipart for very large files/zips.
 */
const MULTIPART_MIN_BYTES = 16 * 1024 * 1024

function normalizeUploadPct(percentage: number): number {
  if (!Number.isFinite(percentage)) return 0
  // Client reports 0–100; tolerate a 0–1 fraction just in case.
  const pct = percentage > 0 && percentage <= 1 ? percentage * 100 : percentage
  return Math.max(0, Math.min(100, Math.round(pct)))
}

export async function uploadNotebookFile(
  file: File,
  onProgress?: (pct: number) => void,
): Promise<NotebookAttachment> {
  const username = loadCachedAccountUser()
  if (!username) throw new Error('Sign in to upload files')

  const contentType = contentTypeForUpload(file)
  const pathname = `ownlab-accounts/${username}/files/${safeFileName(file.name)}`
  const useMultipart = file.size >= MULTIPART_MIN_BYTES
  // Token handshake has no byte progress — nudge off 0% so the UI is not frozen.
  onProgress?.(3)
  const result = await upload(pathname, file, {
    access: 'private',
    handleUploadUrl: `${window.location.origin}/api/blob/upload`,
    multipart: useMultipart,
    contentType,
    onUploadProgress: ({ percentage }) => {
      const raw = normalizeUploadPct(percentage)
      // Map network progress into 5–99 so the handshake phase stays visible.
      onProgress?.(Math.max(5, Math.min(99, raw)))
    },
  })
  onProgress?.(100)

  return {
    id: uid(),
    name: file.name,
    size: file.size,
    contentType: contentType || result.contentType || 'application/octet-stream',
    pathname: result.pathname,
    uploadedAt: new Date().toISOString(),
  }
}

export function notebookFileDownloadUrl(pathname: string): string {
  return `${window.location.origin}/api/blob/download?pathname=${encodeURIComponent(pathname)}`
}

function isHtmlAttachment(att: NotebookAttachment): boolean {
  const name = att.name.toLowerCase()
  const type = (att.contentType || '').toLowerCase()
  return name.endsWith('.html') || name.endsWith('.htm') || type.includes('html')
}

function triggerBrowserDownload(href: string, filename: string): void {
  const a = document.createElement('a')
  a.href = href
  a.download = filename
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  a.remove()
}

export async function downloadNotebookFile(att: NotebookAttachment): Promise<void> {
  // Ask the API for a short-lived signed Blob URL, then let the browser download
  // directly from storage (supports large files without buffering through the app).
  const res = await fetch(notebookFileDownloadUrl(att.pathname), {
    credentials: 'include',
    headers: { Accept: 'application/json' },
  })
  if (!res.ok) {
    let message = `Download failed (${res.status})`
    try {
      const body = (await res.json()) as { error?: string }
      if (body.error) message = body.error
    } catch {
      /* keep */
    }
    throw new Error(message)
  }
  const body = (await res.json()) as { url?: string }
  if (!body.url) throw new Error('Download URL missing')

  // HTML often opens in-tab if we only navigate to the signed URL. Prefer a
  // same-origin blob download so .html/.htm always save as a file.
  if (isHtmlAttachment(att)) {
    try {
      const fileRes = await fetch(body.url)
      if (!fileRes.ok) throw new Error(`Download failed (${fileRes.status})`)
      const blob = await fileRes.blob()
      const objectUrl = URL.createObjectURL(
        new Blob([blob], { type: att.contentType || 'text/html;charset=utf-8' }),
      )
      try {
        triggerBrowserDownload(objectUrl, att.name || 'note.html')
      } finally {
        window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000)
      }
      return
    } catch {
      /* fall through to signed download URL */
    }
  }

  triggerBrowserDownload(body.url, att.name)
}
