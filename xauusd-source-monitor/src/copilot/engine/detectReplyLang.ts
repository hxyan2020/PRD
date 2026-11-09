import type { AppLang } from '../../i18n/messages'

/**
 * Infer reply language from the user's input text.
 * UI locale must not drive answer language — only the typed/pasted facts do.
 * Falls back when the input has no linguistic signal (e.g. screenshot-only).
 */
export function detectReplyLang(text: string, fallback: AppLang = 'zh-Hant'): AppLang {
  const s = String(text || '')
  const cjk = (s.match(/[\u3040-\u30ff\u3400-\u9fff\uf900-\ufaff]/g) || []).length
  const latin = (s.match(/[A-Za-z]/g) || []).length
  if (cjk === 0 && latin === 0) return fallback
  // Tickers like XAUUSD add Latin noise; a few CJK chars still mean Chinese input.
  if (cjk >= 3) return 'zh-Hant'
  if (latin >= 8 && cjk < 3) return 'en'
  if (cjk > 0 && cjk >= latin) return 'zh-Hant'
  if (latin > 0) return 'en'
  return fallback
}
