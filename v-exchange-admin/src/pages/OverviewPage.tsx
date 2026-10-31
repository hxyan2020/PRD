import { AdminPageShell } from '../components/AdminPageShell';
import { useLocale } from '../i18n/locale';

export function OverviewPage() {
  const { t } = useLocale();
  return (
    <AdminPageShell title={t('总览', 'Overview')}>
      <p style={{ color: '#666', margin: 0 }}>
        {t(
          'MatchingManagement 管理后台总览 — 请从左侧菜单选择功能模块。',
          'MatchingManagement admin overview — select a module from the sidebar.',
        )}
      </p>
    </AdminPageShell>
  );
}
