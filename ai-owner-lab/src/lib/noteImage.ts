import { loadCachedAccountUser } from './notebookAccountSync'
import { notebookFileDownloadUrl, uploadNotebookFile } from './notebookAttachments'

const ACCEPTED = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'])

/** In-flight note image uploads — cloud sync waits so blob: previews are not pushed. */
const pendingNoteImageUploads = new Set<Promise<unknown>>()

export function trackNoteImageUpload<T>(promise: Promise<T>): Promise<T> {
  pendingNoteImageUploads.add(promise)
  void promise.finally(() => {
    pendingNoteImageUploads.delete(promise)
  })
  return promise
}

export async function awaitPendingNoteImageUploads(): Promise<void> {
  while (pendingNoteImageUploads.size > 0) {
    await Promise.allSettled([...pendingNoteImageUploads])
  }
}

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
  // Temporary optimistic previews while a full-res Blob upload finishes.
  if (/^blob:/i.test(value)) return true
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

/**
 * Only hit the network for larger images. Sub‑1MB photos encode to a data URL
 * in milliseconds; Blob upload was waiting on a serverless token handshake so
 * even a 473KB image looked “stuck” at a few percent.
 * `compactInlineImagesForCloud` still offloads embedded data: URLs before sync
 * so cloud save stays under the 4.5MB serverless limit.
 */
const BLOB_UPLOAD_MIN_BYTES = 1024 * 1024

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

  // Large signed-in images: private Blob (never base64 — that freezes on 10MB+).
  if (preferBlob) {
    const uploaded = await uploadNotebookFile(asImageFile(file), (pct) => {
      progress.report(pct)
    })
    progress.report(100)
    return notebookInlineImageSrc(uploaded.pathname)
  }

  // Keep original bytes — never canvas-resize or recompress.
  // Sub‑1MB photos stay local for snappy full-res insert.
  return blobToDataUrl(file, (pct) => progress.report(pct))
}

/**
 * Instant local preview URL for optimistic insert (revoked by the caller after swap).
 */
export function createNoteImagePreviewUrl(file: Blob): string {
  return URL.createObjectURL(file)
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
  if (/sign in/i.test(message)) {
    return new Error('Sign in to download pictures')
  }
  if (/load failed|failed to fetch|networkerror|network request failed/i.test(message)) {
    return new Error('Could not download this picture. Check sign-in and try again.')
  }
  return err instanceof Error ? err : new Error(message)
}

function decodeHtmlAttr(value: string): string {
  return value
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#0*39;/g, "'")
    .replace(/&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
}

function dataUrlToBlob(dataUrl: string): Blob {
  const comma = dataUrl.indexOf(',')
  if (comma < 0) throw new Error('Invalid image data')
  const header = dataUrl.slice(0, comma)
  // Base64 in note HTML sometimes includes whitespace / newlines.
  const data = dataUrl.slice(comma + 1).replace(/\s/g, '')
  const mime = /data:([^;]+)/i.exec(header)?.[1] || 'application/octet-stream'
  try {
    const binary = atob(data)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
    return new Blob([bytes], { type: mime })
  } catch {
    throw new Error('Invalid image data')
  }
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

function u16(n: number): Uint8Array {
  const out = new Uint8Array(2)
  out[0] = n & 0xff
  out[1] = (n >>> 8) & 0xff
  return out
}

function u32(n: number): Uint8Array {
  const out = new Uint8Array(4)
  out[0] = n & 0xff
  out[1] = (n >>> 8) & 0xff
  out[2] = (n >>> 16) & 0xff
  out[3] = (n >>> 24) & 0xff
  return out
}

/** CRC-32 for store-method ZIP (no compression). */
function crc32(data: Uint8Array): number {
  let crc = 0xffffffff
  for (let i = 0; i < data.length; i += 1) {
    crc ^= data[i]!
    for (let j = 0; j < 8; j += 1) {
      const mask = -(crc & 1)
      crc = (crc >>> 1) ^ (0xedb88320 & mask)
    }
  }
  return (crc ^ 0xffffffff) >>> 0
}

function buildZipStore(files: Array<{ name: string; data: Uint8Array }>): Blob {
  const locals: Uint8Array[] = []
  const centrals: Uint8Array[] = []
  let offset = 0
  for (const file of files) {
    const nameBytes = new TextEncoder().encode(file.name)
    const crc = crc32(file.data)
    const local = new Uint8Array(30 + nameBytes.length + file.data.length)
    local.set([0x50, 0x4b, 0x03, 0x04], 0)
    local.set(u16(20), 4)
    local.set(u16(0), 6)
    local.set(u16(0), 8)
    local.set(u16(0), 10)
    local.set(u16(0), 12)
    local.set(u32(crc), 14)
    local.set(u32(file.data.length), 18)
    local.set(u32(file.data.length), 22)
    local.set(u16(nameBytes.length), 26)
    local.set(u16(0), 28)
    local.set(nameBytes, 30)
    local.set(file.data, 30 + nameBytes.length)
    locals.push(local)

    const central = new Uint8Array(46 + nameBytes.length)
    central.set([0x50, 0x4b, 0x01, 0x02], 0)
    central.set(u16(20), 4)
    central.set(u16(20), 6)
    central.set(u16(0), 8)
    central.set(u16(0), 10)
    central.set(u16(0), 12)
    central.set(u16(0), 14)
    central.set(u32(crc), 16)
    central.set(u32(file.data.length), 20)
    central.set(u32(file.data.length), 24)
    central.set(u16(nameBytes.length), 28)
    central.set(u16(0), 30)
    central.set(u16(0), 32)
    central.set(u16(0), 34)
    central.set(u16(0), 36)
    central.set(u32(0), 38)
    central.set(u32(offset), 42)
    central.set(nameBytes, 46)
    centrals.push(central)
    offset += local.length
  }

  const centralSize = centrals.reduce((sum, part) => sum + part.length, 0)
  const end = new Uint8Array(22)
  end.set([0x50, 0x4b, 0x05, 0x06], 0)
  end.set(u16(0), 4)
  end.set(u16(0), 6)
  end.set(u16(files.length), 8)
  end.set(u16(files.length), 10)
  end.set(u32(centralSize), 12)
  end.set(u32(offset), 16)
  end.set(u16(0), 20)

  return new Blob(
    [...locals, ...centrals, end] as unknown as BlobPart[],
    { type: 'application/zip' },
  )
}

function preferMobileShareSheet(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent || ''
  if (/iPhone|iPad|iPod/i.test(ua)) return true
  // iPadOS desktop UA still has touch.
  if (/Macintosh/i.test(ua) && typeof document !== 'undefined' && 'ontouchend' in document) {
    return true
  }
  return /Android/i.test(ua)
}

async function shareOrDownloadFiles(
  files: Array<{ blob: Blob; name: string }>,
): Promise<'shared' | 'zip' | 'files'> {
  const shareFiles = files.map(
    ({ blob, name }) => new File([blob], name, { type: blob.type || 'application/octet-stream' }),
  )
  const nav = navigator as Navigator & {
    canShare?: (data?: ShareData) => boolean
    share?: (data?: ShareData) => Promise<void>
  }
  const tryShare = files.length > 1 || preferMobileShareSheet()
  if (
    tryShare &&
    shareFiles.length > 0 &&
    typeof nav.canShare === 'function' &&
    typeof nav.share === 'function'
  ) {
    try {
      if (nav.canShare({ files: shareFiles })) {
        await nav.share({ files: shareFiles, title: 'OWNLAB images' })
        return 'shared'
      }
    } catch (err) {
      // User cancel should not count as failure.
      if (err instanceof DOMException && err.name === 'AbortError') return 'shared'
    }
  }

  if (files.length > 1) {
    const zipBlob = buildZipStore(
      await Promise.all(
        files.map(async ({ blob, name }) => ({
          name,
          data: new Uint8Array(await blob.arrayBuffer()),
        })),
      ),
    )
    await saveBlobAsFile(zipBlob, `ownlab-images-${files.length}.zip`)
    return 'zip'
  }

  await saveBlobAsFile(files[0]!.blob, files[0]!.name)
  return 'files'
}

/** Same-origin Edge stream — avoids Safari failing on signed Blob CDN URLs. */
async function fetchPrivateBlobFile(pathname: string): Promise<Blob> {
  const proxyUrl = `/api/blob/content?pathname=${encodeURIComponent(pathname)}`
  const proxyRes = await fetch(proxyUrl, {
    credentials: 'include',
    cache: 'no-store',
  })
  if (proxyRes.status === 401) throw new Error('Sign in to download pictures')
  if (proxyRes.ok) return proxyRes.blob()

  // Fall back to JSON signed URL (older deploys / transient proxy errors).
  const res = await fetch(notebookFileDownloadUrl(pathname), {
    credentials: 'include',
    headers: { Accept: 'application/json' },
  })
  if (res.status === 401) throw new Error('Sign in to download pictures')
  if (!res.ok) throw new Error(`Download failed (${proxyRes.status || res.status})`)
  const body = (await res.json()) as { url?: string }
  if (!body.url) throw new Error(`Download failed (${proxyRes.status || res.status})`)
  const fileRes = await fetch(body.url, { mode: 'cors', credentials: 'omit', cache: 'no-store' })
  if (!fileRes.ok) throw new Error(`Download failed (${fileRes.status})`)
  return fileRes.blob()
}

async function resolveImageBlob(src: string): Promise<Blob> {
  const pathname = blobPathnameFromSrc(src)
  if (pathname) return fetchPrivateBlobFile(pathname)

  if (src.startsWith('data:')) return dataUrlToBlob(src)

  if (/^blob:/i.test(src)) {
    const res = await fetch(src)
    if (!res.ok) throw new Error('Image preview expired — open the picture again')
    return res.blob()
  }

  // Prefer cookie for same-origin private images; omit for CDN/CORS hosts.
  try {
    const withCreds = await fetch(src, { credentials: 'include', cache: 'no-store' })
    if (withCreds.ok) return withCreds.blob()
  } catch {
    /* try without credentials */
  }
  const bare = await fetch(src, { credentials: 'omit', mode: 'cors', cache: 'no-store' })
  if (!bare.ok) throw new Error(`Download failed (${bare.status})`)
  return bare.blob()
}

/** Download the full-resolution image (data URL, https, or private Blob). */
export async function downloadNoteImage(src: string, filename?: string): Promise<void> {
  const name = filename || guessImageFilename(src)
  try {
    const blob = await resolveImageBlob(decodeHtmlAttr(src.trim()))
    await shareOrDownloadFiles([{ blob, name }])
  } catch (err) {
    throw mapDownloadError(err)
  }
}

/** All safe image `src` values in note HTML (no card-preview limit). */
export function extractAllNoteImageSrcs(html: string): string[] {
  if (!html) return []
  const out: string[] = []
  const seen = new Set<string>()
  const re = /<img\b[^>]*?\bsrc\s*=\s*(["'])([\s\S]*?)\1/gi
  let match: RegExpExecArray | null
  while ((match = re.exec(html))) {
    const src = decodeHtmlAttr((match[2] || '').trim())
    if (!src || seen.has(src) || !isSafeImageSrc(src)) continue
    seen.add(src)
    out.push(src)
  }
  return out
}

/** Prefer live DOM srcs (already decoded, includes successfully loaded images). */
export function extractNoteImageSrcsFromRoot(root: ParentNode | null | undefined): string[] {
  if (!root || typeof root.querySelectorAll !== 'function') return []
  const out: string[] = []
  const seen = new Set<string>()
  for (const img of Array.from(root.querySelectorAll('img'))) {
    const raw = (img.getAttribute('src') || img.currentSrc || '').trim()
    const src = decodeHtmlAttr(raw)
    if (!src || seen.has(src) || !isSafeImageSrc(src)) continue
    // Skip broken/empty optimistic previews that never finished uploading.
    if (/^blob:/i.test(src) && img.naturalWidth === 0) continue
    seen.add(src)
    out.push(src)
  }
  return out
}

/**
 * Download every inline image in a note.
 * Collects blobs first, then shares (iOS) or saves one ZIP — multi `<a download>` is unreliable on mobile.
 */
export async function downloadAllNoteImages(
  htmlOrSrcs: string | string[],
  options?: { onProgress?: (done: number, total: number) => void },
): Promise<{ total: number; failed: number; saved: number; mode?: string; error?: string }> {
  const srcs = Array.isArray(htmlOrSrcs) ? htmlOrSrcs : extractAllNoteImageSrcs(htmlOrSrcs)
  if (srcs.length === 0) return { total: 0, failed: 0, saved: 0 }
  const files: Array<{ blob: Blob; name: string }> = []
  let failed = 0
  let firstError: string | undefined
  for (let i = 0; i < srcs.length; i += 1) {
    const src = srcs[i]!
    options?.onProgress?.(i + 1, srcs.length)
    try {
      const blob = await resolveImageBlob(decodeHtmlAttr(src.trim()))
      files.push({ blob, name: guessImageFilename(src, `ownlab-image-${i + 1}`) })
    } catch (err) {
      failed += 1
      if (!firstError) {
        firstError = err instanceof Error ? err.message : String(err || 'download failed')
      }
    }
  }
  if (files.length === 0) {
    return { total: srcs.length, failed, saved: 0, error: firstError }
  }
  const mode = await shareOrDownloadFiles(files)
  return {
    total: srcs.length,
    failed,
    saved: files.length,
    mode,
    error: failed ? firstError : undefined,
  }
}
