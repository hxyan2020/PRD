import { flagUrl, LANGUAGES } from "../i18n/languages";
import { useI18n } from "../i18n/I18nProvider";

export function LanguagePicker() {
  const { lang, setLang } = useI18n();
  const current = LANGUAGES.find((l) => l.code === lang) ?? LANGUAGES[0];

  return (
    <label className="lang-picker">
      <span className="lang-picker__flag" aria-hidden>
        <img src={flagUrl(current.flag)} alt="" width={24} height={18} />
      </span>
      <select
        aria-label="Language"
        value={lang}
        onChange={(e) => setLang(e.target.value)}
      >
        {LANGUAGES.map((l) => (
          <option key={l.code} value={l.code}>
            {l.label}
          </option>
        ))}
      </select>
    </label>
  );
}
