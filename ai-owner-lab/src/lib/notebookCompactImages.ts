/**
 * Move inline data:image URLs out of notebook HTML into private Blob
 * so cloud sync stays under the serverless body limit (HTTP 413).
 */
import { loadCachedAccountUser } from './notebookAccountSync'
import { uploadNotebookFile } from './notebookAttachments'
import { notebookInlineImageSrc } from './noteImage'

/** Offload almost all embedded images when signed in (keep tiny icons local). */
const DATA_URL_MIN_CHARS = 8_000

const DATA_URL_RE =
  /data:image\/(?:png|jpe?g|gif|webp);base64,[a-z0-9+/=\s]+/gi

function mimeToExt(dataUrl: string): string {
  const m = /^data:image\/([\w+.-]+);/i.exec(dataUrl)
  const raw = (m?.[1] || 'png').toLowerCase().replace('jpeg', 'jpg')
  if (raw === 'jpg' || raw === 'png' || raw === 'gif' || raw === 'webp') return raw
  return 'png'
}

function dataUrlToFile(dataUrl: string, index: number): File | null {
  const match = /^data:(image\/[\w+.-]+);base64,([a-z0-9+/=\s]+)$/i.exec(dataUrl)
  if (!match) return null
  const mime = match[1].toLowerCase()
  const b64 = match[2].replace(/\s/g, '')
  try {
    const binary = atob(b64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
    const ext = mimeToExt(dataUrl)
    return new File([bytes], `note-image-${index}.${ext}`, { type: mime })
  } catch {
    return null
  }
}

export async function replaceLargeDataImagesInHtml(html: string): Promise<{
  html: string
  replaced: number
}> {
  if (!html || !html.includes('data:image')) return { html, replaced: 0 }
  if (!loadCachedAccountUser()) return { html, replaced: 0 }

  const unique = new Map<string, string>()
  const found = html.match(DATA_URL_RE) || []
  for (const raw of found) {
    const dataUrl = raw.replace(/\s/g, '')
    if (dataUrl.length < DATA_URL_MIN_CHARS) continue
    if (!unique.has(dataUrl)) unique.set(dataUrl, raw)
  }
  if (!unique.size) return { html, replaced: 0 }

  let next = html
  let replaced = 0
  let index = 0

  for (const [dataUrl, original] of unique) {
    const file = dataUrlToFile(dataUrl, index)
    index += 1
    if (!file) continue
    try {
      const uploaded = await uploadNotebookFile(file)
      const src = notebookInlineImageSrc(uploaded.pathname)
      next = next.split(original).join(src)
      if (original !== dataUrl) next = next.split(dataUrl).join(src)
      replaced += 1
    } catch {
      /* keep data URL if upload fails */
    }
  }

  return { html: next, replaced }
}
