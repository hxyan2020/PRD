import { loadCachedAccountUser } from './notebookAccountSync'
import { notebookFileDownloadUrl, uploadNotebookFile } from './notebookAttachments'

const ACCEPTED = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'])

export function isAllowedImageMime(type: string): boolean {
  return ACCEPTED.has(type.toLowerCase())
}

export function isBlobImageSrc(src: string): boolean {
  try {
    const url = new URL(src, typeof window !== 'undefined' ? window.location.origin : 'https://ownlab.local')
    return url.pathname === '/api/blob/download' && url.searchParams.has('pathname')
  } catch {
    return false
  }
}

export function blobPathnameFromSrc(src: string): string | null {
  try {
    const url = new URL(src, typeof window !== 'undefined' ? window.location.origin : 'https://ownlab.local')
    if (url.pathname !== '/api/blob/download') return null
    return url.searchParams.get('pathname')
  } catch {
    return null
  }
}

export function notebookInlineImageSrc(pathname: string): string {
  // Relative same-origin URL so <img> sends the session cookie and the API redirects
  // to a short-lived signed Blob URL (full original resolution).
  return `/api/blob/download?pathname=${encodeURIComponent(pathname)}&redirect=1`
}

export function isSafeImageSrc(src: string): boolean {
  const value = src.trim()
  if (!value) return false
  if (/^data:image\/(png|jpe?g|gif|webp);base64,[a-z0-9+/=\s]+$/i.test(value)) return true
  if (/^https:\/\//i.test(value) && !/[\s"']/.test(value) && !/javascript:/i.test(value)) {
    return true
  }
  // Same-origin private Blob images (session cookie + redirect to signed URL).
  if (isBlobImageSrc(value)) return true
  return false
}

function blobToDataUrl(
  blob: Blob,
  onProgress?: (pct: number) => void,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onprogress = (e) => {
      if (!e.lengthComputable || e.total <= 0) return
      onProgress?.(Math.min(99, Math.round((e.loaded / e.total) * 100)))
    }
    reader.onload = () => {
      onProgress?.(100)
      resolve(String(reader.result || ''))
    }
    reader.onerror = () => reject(new Error('Could not encode image'))
    onProgress?.(0)
    reader.readAsDataURL(blob)
  })
}

function extForMime(mime: string): string {
  const type = mime.toLowerCase()
  if (type.includes('png')) return 'png'
  if (type.includes('webp')) return 'webp'
  if (type.includes('gif')) return 'gif'
  if (type.includes('jpeg') || type.includes('jpg')) return 'jpg'
  return 'img'
}

function asImageFile(file: Blob): File {
  if (file instanceof File && file.name) return file
  const mime = (file.type || 'image/png').toLowerCase()
  const name = `note-image-${Date.now()}.${extForMime(mime)}`
  return new File([file], name, { type: mime })
}

function createProgressReporter(onProgress?: (pct: number) => void): {
  report: (pct: number) => void
  startHeartbeat: () => void
  stop: () => void
} {
  let current = 0
  let heartbeat: ReturnType<typeof setInterval> | null = null
  const report = (pct: number) => {
    const next = Math.max(current, Math.min(100, Math.round(pct)))
    if (next === current && next !== 0) return
    current = next
    onProgress?.(current)
  }
  return {
    report,
    startHeartbeat: () => {
      if (!onProgress || heartbeat) return
      // Keep the bar moving when FileReader/network is quiet between events.
      heartbeat = setInterval(() => {
        if (current < 90) report(current + 1)
      }, 100)
    },
    stop: () => {
      if (heartbeat) {
        clearInterval(heartbeat)
        heartbeat = null
      }
    },
  }
}

/**
 * Store a notebook image at full resolution (no downscale / quality crush).
 * Prefer private Vercel Blob when signed in so large pastes have no practical size limit;
 * otherwise embed the original bytes as a data URL.
 * `onProgress` receives 0–100 for upload / local encode.
 */
export async function fileToNoteImageDataUrl(
  file: Blob,
  onProgress?: (pct: number) => void,
): Promise<string> {
  const mime = (file.type || '').toLowerCase()
  if (!isAllowedImageMime(mime)) {
    throw new Error('Unsupported image type')
  }

  const progress = createProgressReporter(onProgress)
  progress.report(0)
  progress.startHeartbeat()

  try {
    // Signed-in: store original bytes on private Blob (no practical size / resolution cap).
    if (loadCachedAccountUser()) {
      try {
        const uploaded = await uploadNotebookFile(asImageFile(file), (pct) => {
          progress.report(pct)
        })
        progress.report(100)
        return notebookInlineImageSrc(uploaded.pathname)
      } catch {
        // Fall through to local data URL when upload is unavailable.
      }
    }

    // Keep original bytes — never canvas-resize or recompress.
    return await blobToDataUrl(file, (pct) => progress.report(pct))
  } finally {
    progress.stop()
  }
}

export function guessImageFilename(src: string, fallback = 'ownlab-image'): string {
  const pathname = blobPathnameFromSrc(src)
  if (pathname) {
    const base = pathname.split('/').pop() || fallback
    return base.replace(/-[A-Za-z0-9]{10,}(?=\.[^.]+$)/, '') || fallback
  }
  const match = /^data:image\/([\w+.-]+);/i.exec(src)
  const ext = match?.[1]?.toLowerCase().replace('jpeg', 'jpg') || 'png'
  return `${fallback}.${ext}`
}

/** Download the full-resolution image (data URL, https, or private Blob). */
export async function downloadNoteImage(src: string, filename?: string): Promise<void> {
  const name = filename || guessImageFilename(src)
  const pathname = blobPathnameFromSrc(src)

  if (pathname) {
    const res = await fetch(notebookFileDownloadUrl(pathname), {
      credentials: 'include',
      headers: { Accept: 'application/json' },
    })
    if (!res.ok) throw new Error(`Download failed (${res.status})`)
    const body = (await res.json()) as { url?: string }
    if (!body.url) throw new Error('Download URL missing')
    const fileRes = await fetch(body.url)
    if (!fileRes.ok) throw new Error(`Download failed (${fileRes.status})`)
    const blob = await fileRes.blob()
    const objectUrl = URL.createObjectURL(blob)
    try {
      triggerDownload(objectUrl, name)
    } finally {
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000)
    }
    return
  }

  if (src.startsWith('data:')) {
    triggerDownload(src, name)
    return
  }

  const fileRes = await fetch(src, { credentials: 'include' })
  if (!fileRes.ok) throw new Error(`Download failed (${fileRes.status})`)
  const blob = await fileRes.blob()
  const objectUrl = URL.createObjectURL(blob)
  try {
    triggerDownload(objectUrl, name)
  } finally {
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000)
  }
}

function triggerDownload(href: string, filename: string): void {
  const a = document.createElement('a')
  a.href = href
  a.download = filename
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  a.remove()
}
