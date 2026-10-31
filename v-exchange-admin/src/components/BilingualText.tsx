import type { ReactNode } from 'react'
import { useLocale } from '../i18n/LocaleContext'

type Props = {
  /** Chinese source string (glossary key) */
  name: string
  /** Optional custom node when you need extra styling around the label */
  children?: (label: string) => ReactNode
}

/** Renders a field/page label in 中文, EN, or EN / 中文 per header toggle. */
export function BilingualText({ name, children }: Props) {
  const { label } = useLocale()
  const text = label(name)
  return <>{children ? children(text) : text}</>
}
