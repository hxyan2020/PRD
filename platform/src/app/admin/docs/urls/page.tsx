import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { PLATFORM_URLS } from "@/lib/docs/urls";
import { PageHeader, Badge } from "@/components/ui";

export default async function UrlsCatalogPage() {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role_code, "admin.access")) redirect("/admin");

  const categories = Array.from(new Set(PLATFORM_URLS.map((u) => u.category)));
  const counts = {
    pages: PLATFORM_URLS.filter((u) => u.path.startsWith("/admin") || u.path === "/login" || u.path === "/admin").length,
    apis: PLATFORM_URLS.filter((u) => u.category === "API").length,
    tables: PLATFORM_URLS.filter((u) => u.category === "DB Tables" || u.category === "Data").length,
  };

  return (
    <div>
      <PageHeader
        title="URL Catalog"
        subtitle="Admin pages, APIs, local SQLite path, and core DB tables for the CRMP prototype."
        actions={
          <Link className="btn btn-primary" href="/admin/messenger">
            Open Demo Messenger
          </Link>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 mb-4">
        {[
          { label: "Admin / auth pages", value: String(counts.pages) },
          { label: "API routes", value: String(counts.apis) },
          { label: "Data / tables", value: String(counts.tables) },
          { label: "Demo inbox", value: "/admin/messenger" },
        ].map((c) => (
          <div key={c.label} className="panel p-3 sm:p-4">
            <div className="text-[10px] sm:text-xs uppercase tracking-[0.08em] text-[var(--muted)]">{c.label}</div>
            <div className="mt-1 font-semibold text-sm sm:text-base break-word">{c.value}</div>
          </div>
        ))}
      </div>

      <div className="panel p-3 sm:p-4 mb-4 text-sm text-[var(--muted)]">
        Demo Messenger actions: <code>show_evidence</code> · <code>chat</code> · <code>escalate</code> ·{" "}
        <code>dismiss</code> · <code>close</code> · <code>recommend</code> → double-confirm → Vantage admin ref ·{" "}
        <code>checker_approve</code> when required.
      </div>

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
                    <tr key={`${u.category}-${u.path}`}>
                      <td className="font-semibold">{u.title}</td>
                      <td>
                        {u.path.startsWith("/") ? (
                          <Link className="text-teal-800 underline break-all" href={u.path.includes("[") ? u.path.replace("[id]", "1") : u.path}>
                            {u.path}
                          </Link>
                        ) : (
                          <code className="text-xs break-all">{u.path}</code>
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
