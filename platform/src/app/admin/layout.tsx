import { getCurrentUser, rolePermissions } from "@/lib/auth";
import { AdminShell } from "@/components/AdminShell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = (await getCurrentUser())!;
  return (
    <AdminShell user={user} permissions={rolePermissions(user.role_code)}>
      {children}
    </AdminShell>
  );
}
