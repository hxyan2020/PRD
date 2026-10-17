import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { LANGUAGES, type Language } from "./languages";
import { translate, type MessageKey } from "./messages";

const LANG_KEY = "seen.lang.v1";

interface I18nValue {
  lang: string;
  language: Language;
  setLang: (code: string) => void;
  t: (key: MessageKey, vars?: Record<string, string>) => string;
}

const I18nContext = createContext<I18nValue | null>(null);

function detectLang(): string {
  try {
    const saved = localStorage.getItem(LANG_KEY);
    if (saved && LANGUAGES.some((l) => l.code === saved)) return saved;
  } catch {
    /* ignore */
  }
  const nav = navigator.language;
  const exact = LANGUAGES.find((l) => l.code === nav);
  if (exact) return exact.code;
  const base = nav.split("-")[0];
  if (base === "zh") {
    return /hant|tw|hk/i.test(nav) ? "zh-Hant" : "zh-Hans";
  }
  const fuzzy = LANGUAGES.find((l) => l.code === base || l.code.startsWith(base));
  return fuzzy?.code ?? "en";
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState(detectLang);

  const setLang = (code: string) => {
    setLangState(code);
    localStorage.setItem(LANG_KEY, code);
  };

  const language = LANGUAGES.find((l) => l.code === lang) ?? LANGUAGES[0];

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = language.dir ?? "ltr";
  }, [lang, language.dir]);

  const value = useMemo<I18nValue>(
    () => ({
      lang,
      language,
      setLang,
      t: (key, vars) => translate(lang, key, vars),
    }),
    [lang, language],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n outside provider");
  return ctx;
}
