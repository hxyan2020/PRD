import { countryWithFlag, flagForCountry } from "../lib/countryFlags";
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
  const flag = flagForCountry(countryKey ?? country);
  return (
    <span className={className ? `origin-country ${className}` : "origin-country"}>
      <FlagIcon flag={flag} className="country-flag" />
      {country}
    </span>
  );
}

export { countryWithFlag, flagForCountry };
