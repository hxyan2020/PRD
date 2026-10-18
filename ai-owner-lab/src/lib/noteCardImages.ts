import { isSafeImageSrc } from './noteImage'
import {
  attachmentIconKind,
  notebookFileDownloadUrl,
  type NotebookAttachment,
} from './notebookAttachments'

/** Pull safe image URLs from note HTML (data URLs / https). */
export function extractInlineImageSrcs(html: string, limit = 4): string[] {
  if (!html) return []
  const out: string[] = []
  const seen = new Set<string>()
  const re = /<img\b[^>]*\bsrc\s*=\s*(["'])(.*?)\1/gi
  let match: RegExpExecArray | null
  while ((match = re.exec(html)) && out.length < limit) {
    const src = (match[2] || '').trim()
    if (!src || seen.has(src) || !isSafeImageSrc(src)) continue
    seen.add(src)
    out.push(src)
  }
  return out
}

export function imageAttachments(attachments: NotebookAttachment[] | undefined): NotebookAttachment[] {
  if (!attachments?.length) return []
  return attachments.filter((a) => attachmentIconKind(a.name, a.contentType) === 'image')
}

/** Resolve a private attachment to a short-lived display URL. */
export async function resolveAttachmentImageUrl(pathname: string): Promise<string | null> {
  try {
    const res = await fetch(notebookFileDownloadUrl(pathname), {
      credentials: 'include',
      headers: { Accept: 'application/json' },
    })
    if (!res.ok) return null
    const body = (await res.json()) as { url?: string }
    return body.url || null
  } catch {
    return null
  }
}
