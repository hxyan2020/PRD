import { useState } from 'react'
import { CONTENT_ADMIN } from '../auth/users'
import { useLocale } from '../i18n/locale'

/** View-only notice + raise-to-admin helper for Skills / Knowledge / memory. */
export function ContentAdminBanner({ surface }: { surface: 'skills' | 'knowledge' | 'memory' }) {
  const { t } = useLocale()
  const [copied, setCopied] = useState(false)

  const raiseText = [
    `Raise to ${CONTENT_ADMIN.name} (${CONTENT_ADMIN.email})`,
    `Surface: ${surface}`,
    'Request: please update the following (describe change):',
    '',
  ].join('\n')

  const copyRaise = async () => {
    try {
      await navigator.clipboard.writeText(raiseText)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  return (
    <aside className="admin-gate-banner" role="status">
      <p className="admin-gate-text">{t('adminOnlyWrite')}</p>
      <button type="button" className="archive-btn" onClick={copyRaise}>
        {copied ? t('adminRaiseCopied') : t('adminRaiseToYan')}
      </button>
    </aside>
  )
}
