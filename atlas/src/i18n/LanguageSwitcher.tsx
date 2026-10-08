import { LANGUAGES, type LocaleCode } from "./languages";
import { useI18n } from "./I18nProvider";
import { FlagIcon } from "../components/FlagIcon";

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useI18n();
  const current = LANGUAGES.find((l) => l.code === locale) ?? LANGUAGES[0];
  const modern = LANGUAGES.filter((l) => l.group === "modern");
  const ancient = LANGUAGES.filter((l) => l.group === "ancient");

  return (
    <label className="lang-switcher">
      <span className="sr-only">{t("lang.choose")}</span>
      <FlagIcon
        iso={current.iso}
        flag={current.flag}
        className="lang-flag"
        title={current.englishLabel}
      />
      <select
        className="lang-select"
        value={locale}
        aria-label={t("nav.language")}
        title={t("nav.language")}
        onChange={(e) => setLocale(e.target.value as LocaleCode)}
      >
        <optgroup label={`${t("lang.modern")}`}>
          {modern.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.nativeLabel}
            </option>
          ))}
        </optgroup>
        <optgroup label={`${t("lang.ancient")}`}>
          {ancient.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.nativeLabel}
            </option>
          ))}
        </optgroup>
      </select>
    </label>
  );
}
