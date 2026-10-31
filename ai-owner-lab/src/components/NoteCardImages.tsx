import { useEffect, useMemo, useState } from 'react'
import {
  extractInlineImageSrcs,
  imageAttachments,
  resolveAttachmentImageUrl,
} from '../lib/noteCardImages'
import type { NotebookAttachment } from '../lib/notebookAttachments'

type Props = {
  html: string
  attachments?: NotebookAttachment[]
  /** Max thumbs to render. */
  limit?: number
}

export function NoteCardImages({ html, attachments, limit = 4 }: Props) {
  const inline = useMemo(() => extractInlineImageSrcs(html, limit), [html, limit])
  const imageAtts = useMemo(
    () => imageAttachments(attachments).slice(0, Math.max(0, limit - inline.length)),
    [attachments, limit, inline.length],
  )
  const attKey = useMemo(() => imageAtts.map((a) => a.pathname).join('\0'), [imageAtts])
  const [attUrls, setAttUrls] = useState<string[]>([])

  useEffect(() => {
    let cancelled = false
    if (!imageAtts.length) {
      setAttUrls([])
      return
    }
    void (async () => {
      const urls: string[] = []
      for (const att of imageAtts) {
        const url = await resolveAttachmentImageUrl(att.pathname)
        if (url) urls.push(url)
      }
      if (!cancelled) setAttUrls(urls)
    })()
    return () => {
      cancelled = true
    }
  }, [attKey, imageAtts])

  const srcs = [...inline, ...attUrls].slice(0, limit)
  if (!srcs.length) return null

  return (
    <div className="notebook-entry-images" aria-hidden="true">
      {srcs.map((src, index) => (
        <img key={`${index}-${src.slice(0, 64)}`} src={src} alt="" loading="lazy" decoding="async" />
      ))}
    </div>
  )
}
