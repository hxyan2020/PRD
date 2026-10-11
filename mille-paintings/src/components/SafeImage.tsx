import { useEffect, useMemo, useState, type ImgHTMLAttributes } from 'react'

type Props = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> & {
  src: string
  /** Tried when `src` fails to load. */
  fallbackSrc?: string
  /** Extra URLs to try after src / fallbackSrc (deduped). */
  candidates?: string[]
  /** Called when every candidate fails (or src is empty). */
  onAllFailed?: () => void
}

type Attempt = { url: string; noReferrer: boolean }

function buildAttempts(src: string, fallbackSrc: string, candidates: string[]): Attempt[] {
  const urls: string[] = []
  const seen = new Set<string>()
  for (const u of [src, fallbackSrc, ...candidates]) {
    const trimmed = (u || '').trim()
    if (!trimmed || seen.has(trimmed)) continue
    seen.add(trimmed)
    urls.push(trimmed)
  }
  const attempts: Attempt[] = []
  for (const url of urls) {
    // Prefer no-referrer first (Commons / many museums), then retry with default referrer.
    attempts.push({ url, noReferrer: true })
    attempts.push({ url, noReferrer: false })
  }
  return attempts
}

/** Image that walks candidates (and referrer modes) instead of leaving a broken icon. */
export function SafeImage({
  src,
  fallbackSrc = '',
  candidates = [],
  alt = '',
  className = '',
  onAllFailed,
  ...rest
}: Props) {
  const attempts = useMemo(
    () => buildAttempts(src, fallbackSrc, candidates),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [src, fallbackSrc, candidates.join('\0')],
  )
  const [index, setIndex] = useState(0)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    setIndex(0)
    setFailed(false)
  }, [attempts])

  useEffect(() => {
    if (!attempts.length) onAllFailed?.()
  }, [attempts, onAllFailed])

  const current = attempts[index]

  if (!current || failed) {
    return (
      <div
        className={`safe-image-fallback ${className}`.trim()}
        role="img"
        aria-label={alt || 'Image unavailable'}
      >
        <span>{alt || 'Image unavailable'}</span>
      </div>
    )
  }

  return (
    <img
      {...rest}
      className={className}
      key={`${current.url}|${current.noReferrer ? 'nr' : 'r'}`}
      src={current.url}
      alt={alt}
      referrerPolicy={current.noReferrer ? 'no-referrer' : undefined}
      onError={(e) => {
        rest.onError?.(e)
        if (index + 1 < attempts.length) {
          setIndex((i) => i + 1)
          return
        }
        setFailed(true)
        onAllFailed?.()
      }}
    />
  )
}
