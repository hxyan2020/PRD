import { countryFlagUrl, flagCodesForReleaseCountry } from "./country-flags.js";
import { displayReleaseCountry } from "./display-labels.js";
import { useI18n } from "./I18n.jsx";
import { creditLabel } from "./uiText.js";

export default function CountryFlagName({ value }) {
  const { locale, t } = useI18n();
  const label = displayReleaseCountry(value, locale, t) || creditLabel(value, t);
  const codes = flagCodesForReleaseCountry(value);
  if (!codes.length) return label;
  return (
    <span className="country-name">
      <span className="country-flags" aria-hidden="true">
        {codes.map((code) => (
          <img
            key={code}
            className="country-flag"
            src={countryFlagUrl(code)}
            alt=""
            width="22"
            height="16"
            decoding="async"
          />
        ))}
      </span>
      <span>{label}</span>
    </span>
  );
}
