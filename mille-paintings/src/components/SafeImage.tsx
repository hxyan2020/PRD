import { useEffect, useState, type ImgHTMLAttributes } from 'react'

type Props = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> & {
  src: string
  /** Tried when `src` fails to load. */
  fallbackSrc?: string
}

/** Image that falls back once on error instead of leaving a broken icon. */
export function SafeImage({ src, fallbackSrc = '', alt = '', className = '', ...rest }: Props) {
  const [current, setCurrent] = useState(src)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    setCurrent(src)
    setFailed(false)
  }, [src])

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
      key={current}
      src={current}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={(e) => {
        rest.onError?.(e)
        if (fallbackSrc && current !== fallbackSrc) {
          setCurrent(fallbackSrc)
          return
        }
        setFailed(true)
      }}
    />
  )
}
