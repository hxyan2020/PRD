/**
 * Move large inline data:image URLs out of notebook HTML into private Blob
 * so cloud sync stays under the serverless body limit (HTTP 413).
 */
import { loadCachedAccountUser } from './notebookAccountSync'
import { uploadNotebookFile } from './notebookAttachments'
import { notebookInlineImageSrc } from './noteImage'

/** Offload data URLs larger than this (decoded-ish estimate from base64 length). */
const DATA_URL_MIN_CHARS = 48_000

const DATA_IMAGE_RE =
  /(<img\b[^>]*?\bsrc=["'])(data:image\/(?:png|jpe?g|gif|webp);base64,[a-z0-9+/=\s]+)(["'][^>]*>)/gi

function estimateBytes(dataUrl: string): number {
  const comma = dataUrl.indexOf(',')
  if (comma < 0) return dataUrl.length
  const b64 = dataUrl.slice(comma + 1).replace(/\s/g, '')
  return Math.floor((b64.length * 3) / 4)
}

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

  const matches = [...html.matchAll(DATA_IMAGE_RE)]
  if (!matches.length) return { html, replaced: 0 }

  let next = html
  let replaced = 0
  let index = 0

  for (const match of matches) {
    const full = match[0]
    const prefix = match[1]
    const dataUrl = match[2]
    const suffix = match[3]
    if (!dataUrl || dataUrl.length < DATA_URL_MIN_CHARS) continue
    if (estimateBytes(dataUrl) < 32 * 1024) continue

    const file = dataUrlToFile(dataUrl.replace(/\s/g, ''), index)
    index += 1
    if (!file) continue

    try {
      const uploaded = await uploadNotebookFile(file)
      const src = notebookInlineImageSrc(uploaded.pathname)
      const rebuilt = `${prefix}${src}${suffix}`
      next = next.replace(full, rebuilt)
      replaced += 1
    } catch {
      /* keep data URL if upload fails */
    }
  }

  return { html: next, replaced }
}
