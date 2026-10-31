import { AdminPageShell } from '../components/AdminPageShell';

export function PlaceholderPage({ title }: { title?: string }) {
  return (
    <AdminPageShell title={title}>
      <div className="under-development">功能开发中</div>
    </AdminPageShell>
  );
}
