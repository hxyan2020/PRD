import type { LocaleCode } from "./locales";
import type { MessageKey } from "./messages";

export type Pack = Record<MessageKey, string>;

/**
 * Dynamically merge optional JSON packs when present.
 * Packs live in lib/i18n/packs/{locale}.json and override English.
 */
export function mergePack(en: Pack, pack: Partial<Pack> | null | undefined): Pack {
  if (!pack) return { ...en };
  return { ...en, ...pack } as Pack;
}

export type PackMap = Partial<Record<Exclude<LocaleCode, "en">, Partial<Pack>>>;
