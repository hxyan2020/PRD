import { redirect } from "next/navigation";
import { getCurrentUser, hasPermission, rolePermissions } from "@/lib/auth";
import { AdminShell } from "@/components/AdminShell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!hasPermission(user.role_code, "admin.access")) redirect("/login");
  const permissions = rolePermissions(user.role_code);
  return (
    <AdminShell user={user} permissions={permissions}>
      {children}
    </AdminShell>
  );
}
