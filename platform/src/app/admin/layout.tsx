import { getCurrentUser, rolePermissions } from "@/lib/auth";
import { AdminShell } from "@/components/AdminShell";
import { collectNavEvents } from "@/lib/nav-events";
import { getDb } from "@/lib/db";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = (await getCurrentUser())!;
  let navEvents = {};
  try {
    navEvents = collectNavEvents(getDb());
  } catch {
    navEvents = {};
  }
  return (
    <AdminShell user={user} permissions={rolePermissions(user.role_code)} navEvents={navEvents}>
      {children}
    </AdminShell>
  );
}
