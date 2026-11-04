import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { PLATFORM_URLS } from "@/lib/docs/urls";
import { PageHeader, Badge } from "@/components/ui";

export default async function UrlsCatalogPage() {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role_code, "admin.access")) redirect("/admin");

  const categories = Array.from(new Set(PLATFORM_URLS.map((u) => u.category)));

  return (
    <div>
      <PageHeader
        title="URL Catalog"
        subtitle="All admin pages, demo surfaces, APIs and local data paths for the CRMP prototype."
        actions={
          <Link className="btn btn-primary" href="/admin/messenger">
            Open Demo Messenger
          </Link>
        }
      />

      <div className="space-y-6">
        {categories.map((cat) => (
          <section key={cat} className="panel p-4">
            <h2 className="font-[family-name:var(--font-display)] text-lg">{cat}</h2>
            <div className="mt-3 table-wrap">
              <table className="data">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Path</th>
                    <th>Description</th>
                    <th>Permission</th>
                  </tr>
                </thead>
                <tbody>
                  {PLATFORM_URLS.filter((u) => u.category === cat).map((u) => (
                    <tr key={u.path}>
                      <td className="font-semibold">{u.title}</td>
                      <td>
                        {u.path.startsWith("/") ? (
                          <Link className="text-teal-800 underline break-all" href={u.path}>
                            {u.path}
                          </Link>
                        ) : (
                          <code className="text-xs">{u.path}</code>
                        )}
                      </td>
                      <td className="text-sm text-[var(--muted)]">{u.description}</td>
                      <td>
                        {u.permission ? (
                          <Badge className="bg-slate-100 text-slate-700 border-slate-200">{u.permission}</Badge>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
