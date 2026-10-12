import type { MessageKey } from "./messages";
import { categoryMessageKey } from "./messages";

type TFn = (key: MessageKey, vars?: Record<string, string>) => string;

/** Translate a catalogue category id, falling back to the catalog label. */
export function categoryLabel(t: TFn, id: string, fallback: string): string {
  const key = categoryMessageKey(id);
  return key ? t(key) : fallback;
}
