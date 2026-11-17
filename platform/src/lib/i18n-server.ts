import { cookies } from "next/headers";
import { parseUiLocale, UI_LOCALE_COOKIE, type UiLocale } from "@/lib/i18n";
import { isStaticExport } from "@/lib/static-export";

export async function getUiLocale(): Promise<UiLocale> {
  if (isStaticExport()) return "en";
  try {
    const jar = await cookies();
    return parseUiLocale(jar.get(UI_LOCALE_COOKIE)?.value);
  } catch {
    return "en";
  }
}
