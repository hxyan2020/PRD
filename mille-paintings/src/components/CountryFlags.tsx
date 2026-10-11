import { flagUrl } from '../i18n/languages'
import { flagsForCountry } from '../lib/countryFlags'
import './CountryFlags.css'

export function CountryFlags({
  country,
  label,
  displayName,
  size = 'md',
}: {
  country: string
  /** When true, show country text beside the flags. */
  label?: boolean
  /** Optional localized label; flags still resolve from `country`. */
  displayName?: string
  size?: 'sm' | 'md'
}) {
  const flags = flagsForCountry(country)
  const text = displayName || country
  if (!flags.length && !label) return null

  return (
    <span className={`country-flags size-${size}`}>
      {flags.map((f) => (
        <img
          key={f.code}
          className="country-flag"
          src={flagUrl(f.code)}
          alt=""
          title={f.title}
          loading="lazy"
          decoding="async"
          onError={(e) => {
            ;(e.currentTarget as HTMLImageElement).style.display = 'none'
          }}
        />
      ))}
      {label ? <span className="country-flags-text">{text}</span> : null}
    </span>
  )
}
