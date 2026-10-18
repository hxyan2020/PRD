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
  '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.txt,.csv,.md,.rtf,.png,.jpg,.jpeg,.gif,.webp,.svg,.heic,.mp3,.mp4,.mov,.json'

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
  if (/\.(docx?|rtf|txt|md)$/.test(lower) || type.startsWith('text/')) return 'doc'
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

export async function uploadNotebookFile(
  file: File,
  onProgress?: (pct: number) => void,
): Promise<NotebookAttachment> {
  const username = loadCachedAccountUser()
  if (!username) throw new Error('Sign in to upload files')

  const pathname = `ownlab-accounts/${username}/files/${safeFileName(file.name)}`
  const result = await upload(pathname, file, {
    access: 'private',
    handleUploadUrl: `${window.location.origin}/api/blob/upload`,
    multipart: true,
    contentType: file.type || 'application/octet-stream',
    onUploadProgress: ({ percentage }) => onProgress?.(percentage),
  })

  return {
    id: uid(),
    name: file.name,
    size: file.size,
    contentType: file.type || result.contentType || 'application/octet-stream',
    pathname: result.pathname,
    uploadedAt: new Date().toISOString(),
  }
}

export function notebookFileDownloadUrl(pathname: string): string {
  return `${window.location.origin}/api/blob/download?pathname=${encodeURIComponent(pathname)}`
}

export async function downloadNotebookFile(att: NotebookAttachment): Promise<void> {
  const res = await fetch(notebookFileDownloadUrl(att.pathname), { credentials: 'include' })
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
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = att.name
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
