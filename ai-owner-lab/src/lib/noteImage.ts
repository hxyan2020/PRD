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

/**
 * Progress follows real upload/encode bytes only.
 * Never invent a high fake %, which used to stall at ~90% while the network finished.
 */
function createProgressReporter(onProgress?: (pct: number) => void): {
  report: (pct: number) => void
} {
  let current = -1
  return {
    report: (pct: number) => {
      const next = Math.max(0, Math.min(100, Math.round(pct)))
      if (next === current) return
      current = next
      onProgress?.(current)
    },
  }
}

/** Prefer instant local embed for typical phone photos; Blob only when large / needed. */
const BLOB_UPLOAD_MIN_BYTES = 3 * 1024 * 1024

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

  const signedIn = Boolean(loadCachedAccountUser())
  const preferBlob = signedIn && file.size >= BLOB_UPLOAD_MIN_BYTES

  // Signed-in large images: private Blob with live upload %.
  if (preferBlob) {
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
  // Small/medium photos stay local for snappy full-res insert.
  return blobToDataUrl(file, (pct) => progress.report(pct))
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

function mapDownloadError(err: unknown): Error {
  const message = err instanceof Error ? err.message : String(err || 'download failed')
  if (/load failed|failed to fetch|networkerror|network request failed/i.test(message)) {
    return new Error('Could not download this picture. Check sign-in and try again.')
  }
  return err instanceof Error ? err : new Error(message)
}

function dataUrlToBlob(dataUrl: string): Blob {
  const comma = dataUrl.indexOf(',')
  if (comma < 0) throw new Error('Invalid image data')
  const header = dataUrl.slice(0, comma)
  const data = dataUrl.slice(comma + 1)
  const mime = /data:([^;]+)/i.exec(header)?.[1] || 'application/octet-stream'
  const binary = atob(data)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
  return new Blob([bytes], { type: mime })
}

function triggerDownload(href: string, filename: string): void {
  const a = document.createElement('a')
  a.href = href
  a.download = filename
  a.rel = 'noopener'
  // iOS Safari often ignores programmatic downloads unless the node is in the DOM briefly.
  a.style.display = 'none'
  document.body.appendChild(a)
  a.click()
  a.remove()
}

async function saveBlobAsFile(blob: Blob, filename: string): Promise<void> {
  const objectUrl = URL.createObjectURL(blob)
  try {
    triggerDownload(objectUrl, filename)
  } finally {
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000)
  }
}

/** Same-origin Edge stream — avoids Safari failing on signed Blob CDN URLs. */
async function fetchPrivateBlobFile(pathname: string): Promise<Blob> {
  const proxyUrl = `/api/blob/content?pathname=${encodeURIComponent(pathname)}`
  try {
    const res = await fetch(proxyUrl, {
      credentials: 'include',
      cache: 'no-store',
    })
    if (res.status === 401) throw new Error('Sign in to download pictures')
    if (!res.ok) throw new Error(`Download failed (${res.status})`)
    return await res.blob()
  } catch (err) {
    // Older deploys without /api/blob/content — try JSON signed URL once.
    if (err instanceof Error && /Sign in/i.test(err.message)) throw err
    const res = await fetch(notebookFileDownloadUrl(pathname), {
      credentials: 'include',
      headers: { Accept: 'application/json' },
    })
    if (!res.ok) throw mapDownloadError(err)
    const body = (await res.json()) as { url?: string }
    if (!body.url) throw mapDownloadError(err)
    const fileRes = await fetch(body.url, { mode: 'cors', credentials: 'omit', cache: 'no-store' })
    if (!fileRes.ok) throw new Error(`Download failed (${fileRes.status})`)
    return fileRes.blob()
  }
}

/** Download the full-resolution image (data URL, https, or private Blob). */
export async function downloadNoteImage(src: string, filename?: string): Promise<void> {
  const name = filename || guessImageFilename(src)
  try {
    const pathname = blobPathnameFromSrc(src)
    if (pathname) {
      const blob = await fetchPrivateBlobFile(pathname)
      await saveBlobAsFile(blob, name)
      return
    }

    if (src.startsWith('data:')) {
      // iOS often refuses <a download> on huge data: URLs — convert to a Blob first.
      await saveBlobAsFile(dataUrlToBlob(src), name)
      return
    }

    const fileRes = await fetch(src, { credentials: 'include', cache: 'no-store' })
    if (!fileRes.ok) throw new Error(`Download failed (${fileRes.status})`)
    await saveBlobAsFile(await fileRes.blob(), name)
  } catch (err) {
    throw mapDownloadError(err)
  }
}

/** All safe image `src` values in note HTML (no card-preview limit). */
export function extractAllNoteImageSrcs(html: string): string[] {
  if (!html) return []
  const out: string[] = []
  const seen = new Set<string>()
  const re = /<img\b[^>]*\bsrc\s*=\s*(["'])(.*?)\1/gi
  let match: RegExpExecArray | null
  while ((match = re.exec(html))) {
    const src = (match[2] || '').trim()
    if (!src || seen.has(src) || !isSafeImageSrc(src)) continue
    seen.add(src)
    out.push(src)
  }
  return out
}

/**
 * Download every inline image in a note, one after another.
 * Sequential + short pause so iOS does not coalesce/block multi-downloads.
 */
export async function downloadAllNoteImages(
  html: string,
  options?: { onProgress?: (done: number, total: number) => void },
): Promise<{ total: number; failed: number }> {
  const srcs = extractAllNoteImageSrcs(html)
  if (srcs.length === 0) return { total: 0, failed: 0 }
  let failed = 0
  for (let i = 0; i < srcs.length; i += 1) {
    const src = srcs[i]!
    options?.onProgress?.(i + 1, srcs.length)
    try {
      await downloadNoteImage(src, guessImageFilename(src, `ownlab-image-${i + 1}`))
    } catch {
      failed += 1
    }
    if (i < srcs.length - 1) {
      await new Promise<void>((resolve) => {
        window.setTimeout(resolve, 450)
      })
    }
  }
  return { total: srcs.length, failed }
}
