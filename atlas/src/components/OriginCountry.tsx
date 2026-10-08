import { countryWithFlag, flagForCountry, isoForCountry } from "../lib/countryFlags";
import { FlagIcon } from "./FlagIcon";

type Props = {
  /** Display label (may be localized). */
  country: string;
  /** English catalog key for flag lookup when `country` is localized. */
  countryKey?: string;
  className?: string;
};

/** Flag + origin country label for meta rows. */
export function OriginCountry({ country, countryKey, className }: Props) {
  const key = countryKey ?? country;
  const iso = isoForCountry(key);
  return (
    <span className={className ? `origin-country ${className}` : "origin-country"}>
      <FlagIcon iso={iso} flag={flagForCountry(key)} className="country-flag" title={country} />
      <span className="origin-country-name">{country}</span>
    </span>
  );
}

export { countryWithFlag, flagForCountry, isoForCountry };
