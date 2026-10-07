import { useEffect, useState, type ImgHTMLAttributes } from 'react'

type Props = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> & {
  src: string
  /** Tried when `src` fails to load. */
  fallbackSrc?: string
}

/** Image that falls back once on error instead of leaving a broken icon. */
export function SafeImage({ src, fallbackSrc = '', alt = '', ...rest }: Props) {
  const [current, setCurrent] = useState(src)

  useEffect(() => {
    setCurrent(src)
  }, [src])

  if (!current) return null

  return (
    <img
      {...rest}
      key={current}
      src={current}
      alt={alt}
      onError={(e) => {
        rest.onError?.(e)
        if (fallbackSrc && current !== fallbackSrc) setCurrent(fallbackSrc)
      }}
    />
  )
}
