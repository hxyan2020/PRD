import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { PLATFORM_URLS, PUBLIC_ADMIN_URL, PUBLIC_MESSENGER_URL } from "@/lib/docs/urls";
import { Badge } from "@/components/ui";
import { AdminPageHeader } from "@/components/AdminPageHeader";
import { T } from "@/components/T";
import { EnZh } from "@/components/EnZh";
import { OwnerIdentityPanel } from "@/components/OwnerIdentityPanel";

export default async function UrlsCatalogPage() {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role_code, "admin.access")) redirect("/admin");

  const categories = Array.from(new Set(PLATFORM_URLS.map((u) => u.category)));
  const counts = {
    pages: PLATFORM_URLS.filter((u) => u.path.startsWith("/admin") || u.path === "/login").length,
    apis: PLATFORM_URLS.filter((u) => u.category === "API").length,
    tables: PLATFORM_URLS.filter((u) => u.category === "DB Tables" || u.category === "Data").length,
  };

  const categoryLabel = (cat: string) => (
    <EnZh
      en={cat}
      zh={
        (
          {
            Auth: "驗證",
            Home: "首頁",
            Risk: "風險",
            AI: "AI",
            Messenger: "Messenger",
            Org: "組織",
            System: "系統",
            Docs: "文件",
            API: "API",
            Data: "資料",
            "DB Tables": "資料表",
          } as Record<string, string>
        )[cat] || cat
      }
    />
  );

  return (
    <div>
      <AdminPageHeader
        pageKey="urls"
        actions={
            <Link className="btn btn-primary" href="/admin/messenger">
              <T k="common.openMessenger" />
            </Link>
        }
      />
      <OwnerIdentityPanel />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 mb-4">
        {[
          { label: <T k="urls.pages" />, value: String(counts.pages), key: "pages" },
          { label: <T k="urls.apis" />, value: String(counts.apis), key: "apis" },
          { label: <T k="urls.data" />, value: String(counts.tables), key: "data" },
          { label: <T k="urls.inbox" />, value: "/admin/messenger", key: "inbox" },
        ].map((c) => (
          <div key={c.key} className="panel p-3 sm:p-4">
            <div className="text-[10px] sm:text-xs uppercase tracking-[0.08em] text-[var(--muted)]">{c.label}</div>
            <div className="mt-1 font-semibold text-sm sm:text-base break-word">{c.value}</div>
          </div>
        ))}
      </div>

      <div className="panel p-3 sm:p-4 mb-4 text-sm border-teal-200 bg-teal-50 text-teal-950">
        <p><T k="urls.publicNote" /></p>
        <p className="mt-2">
          <a className="text-teal-900 underline break-all" href={PUBLIC_ADMIN_URL}>
            {PUBLIC_ADMIN_URL}
          </a>
        </p>
        <p className="mt-2">
          <a className="text-teal-900 underline break-all" href={PUBLIC_MESSENGER_URL}>
            {PUBLIC_MESSENGER_URL}
          </a>
        </p>
      </div>

      <div className="panel p-3 sm:p-4 mb-4 text-sm text-[var(--muted)]"><T k="urls.cheat" /></div>

      <div className="space-y-6">
        {categories.map((cat) => (
          <section key={cat} className="panel p-4">
            <h2 className="font-[family-name:var(--font-display)] text-lg">{categoryLabel(cat)}</h2>
            <div className="mt-3 table-wrap">
              <table className="data">
                <thead>
                  <tr>
                    <th><EnZh en="Title" zh="名稱" /></th>
                    <th><EnZh en="Path" zh="路徑" /></th>
                    <th><EnZh en="Description" zh="說明" /></th>
                    <th><EnZh en="Permission" zh="權限" /></th>
                  </tr>
                </thead>
                <tbody>
                  {PLATFORM_URLS.filter((u) => u.category === cat).map((u) => (
                    <tr key={`${u.category}-${u.path}`}>
                      <td className="font-semibold">{u.title}</td>
                      <td>
                        {u.path.startsWith("/") ? (
                          <Link
                            className="text-teal-800 underline break-all"
                            href={u.path.includes("[") ? u.path.replace("[id]", "1").replace("[code]", "SKILL-ABOOK-RATIO") : u.path}
                          >
                            {u.path}
                          </Link>
                        ) : (
                          <code className="text-xs break-all">{u.path}</code>
                        )}
                      </td>
                      <td className="text-sm text-[var(--muted)]">{u.description}</td>
                      <td>
                        <div className="flex flex-wrap gap-1">
                          {u.path.startsWith("/") || u.category === "API" ? (
                            <Badge className="bg-teal-50 text-teal-900 border-teal-200">
                              <EnZh en="Public" zh="公開" />
                            </Badge>
                          ) : null}
                          {u.permission ? (
                            <Badge className="bg-slate-100 text-slate-700 border-slate-200">{u.permission}</Badge>
                          ) : null}
                        </div>
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
