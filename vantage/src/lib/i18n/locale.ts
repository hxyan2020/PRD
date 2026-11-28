export type Locale = "en" | "zh";

export const LOCALE_STORAGE_KEY = "vantage-locale";

export function parseLocale(value: string | null | undefined): Locale {
  return value === "zh" ? "zh" : "en";
}

export function looksChinese(text: string): boolean {
  return /[\u3400-\u9fff]/.test(text);
}
