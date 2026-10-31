import { AdminPageShell } from '../components/AdminPageShell';
import { useLocale } from '../i18n/locale';

export function PlaceholderPage({ title }: { title?: string }) {
  const { t } = useLocale();
  return (
    <AdminPageShell title={title}>
      <div className="under-development">{t('功能开发中', 'Under Development')}</div>
    </AdminPageShell>
  );
}
