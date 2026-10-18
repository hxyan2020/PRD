const MAX_EDGE = 960
/** Soft cap for notebook images stored as data URLs inside IndexedDB notes. */
const MAX_BYTES = 550_000
const ACCEPTED = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'])

export function isAllowedImageMime(type: string): boolean {
  return ACCEPTED.has(type.toLowerCase())
}

export function isSafeImageSrc(src: string): boolean {
  const value = src.trim()
  if (!value) return false
  if (/^data:image\/(png|jpe?g|gif|webp);base64,[a-z0-9+/=\s]+$/i.test(value)) return true
  if (/^https:\/\//i.test(value) && !/[\s"']/.test(value) && !/javascript:/i.test(value)) {
    return true
  }
  return false
}

function loadImage(file: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Could not read image'))
    }
    img.src = url
  })
}

async function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) reject(new Error('Could not encode image'))
        else resolve(blob)
      },
      type,
      quality,
    )
  })
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(new Error('Could not encode image'))
    reader.readAsDataURL(blob)
  })
}

/** Resize/compress a local image for notebook storage (data URL). */
export async function fileToNoteImageDataUrl(file: Blob): Promise<string> {
  const mime = (file.type || '').toLowerCase()
  if (!isAllowedImageMime(mime)) {
    throw new Error('Unsupported image type')
  }

  // Keep small GIFs as-is (animation); reject huge ones.
  if (mime === 'image/gif') {
    if (file.size > MAX_BYTES) throw new Error('Image is too large')
    return blobToDataUrl(file)
  }

  const img = await loadImage(file)
  const scale = Math.min(1, MAX_EDGE / Math.max(img.width, img.height, 1))
  const width = Math.max(1, Math.round(img.width * scale))
  const height = Math.max(1, Math.round(img.height * scale))
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not process image')
  // White fill so JPEG doesn't turn transparent PNG areas black.
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, width, height)
  ctx.drawImage(img, 0, 0, width, height)

  // Prefer JPEG for diagrams/screenshots — much smaller than PNG in notes.
  let outType = 'image/jpeg'
  let quality = 0.78
  let blob = await canvasToBlob(canvas, outType, quality)

  while (blob.size > MAX_BYTES && quality > 0.4) {
    quality -= 0.08
    blob = await canvasToBlob(canvas, outType, quality)
  }

  // Last resort: shrink dimensions further.
  if (blob.size > MAX_BYTES) {
    const shrink = Math.sqrt(MAX_BYTES / blob.size) * 0.92
    const w2 = Math.max(1, Math.round(width * shrink))
    const h2 = Math.max(1, Math.round(height * shrink))
    canvas.width = w2
    canvas.height = h2
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, w2, h2)
    ctx.drawImage(img, 0, 0, w2, h2)
    quality = 0.72
    blob = await canvasToBlob(canvas, outType, quality)
    while (blob.size > MAX_BYTES && quality > 0.38) {
      quality -= 0.08
      blob = await canvasToBlob(canvas, outType, quality)
    }
  }

  if (blob.size > MAX_BYTES) throw new Error('Image is too large')
  return blobToDataUrl(blob)
}
