import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { LocaleCode } from "../lib/i18n/locales";
import type { MessageKey } from "../lib/i18n/messages";

const packsDir = join(import.meta.dirname, "../lib/i18n/packs");

function loadPack(code: string): Record<MessageKey, string> {
  return JSON.parse(readFileSync(join(packsDir, `${code}.json`), "utf8")) as Record<
    MessageKey,
    string
  >;
}

/** Full UI packs for locales maintained as complete JSON overlays (217 keys). */
const COMPLETE_LOCALE_CODES = [
  "es",
  "fr",
  "de",
  "pt-BR",
  "it",
  "nl",
  "ar",
] as const satisfies readonly LocaleCode[];

export const COMPLETE_OVERLAYS: Partial<Record<LocaleCode, Record<MessageKey, string>>> =
  Object.fromEntries(
    COMPLETE_LOCALE_CODES.map((code) => [code, loadPack(code)]),
  ) as Partial<Record<LocaleCode, Record<MessageKey, string>>>;
