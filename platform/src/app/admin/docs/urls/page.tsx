import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { PLATFORM_URLS, PUBLIC_ADMIN_URL, PUBLIC_MESSENGER_URL } from "@/lib/docs/urls";
import { AdminPageHeader } from "@/components/AdminPageHeader";
import { T } from "@/components/T";
import { OwnerIdentityPanel } from "@/components/OwnerIdentityPanel";
import { UrlCatalogBoard } from "@/components/UrlCatalogBoard";

export default async function UrlsCatalogPage() {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role_code, "admin.access")) redirect("/admin");

  const counts = {
    pages: PLATFORM_URLS.filter((u) => u.path.startsWith("/admin") || u.path === "/login").length,
    apis: PLATFORM_URLS.filter((u) => u.category === "API").length,
    tables: PLATFORM_URLS.filter((u) => u.category === "DB Tables" || u.category === "Data").length,
  };

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

      <div className="panel p-3 sm:p-4 mb-4 text-sm text-[var(--muted)]">
        <T k="urls.cheat" />
      </div>

      <UrlCatalogBoard seed={PLATFORM_URLS} />
    </div>
  );
}
