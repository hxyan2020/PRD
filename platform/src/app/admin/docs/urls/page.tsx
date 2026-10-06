import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { PLATFORM_URLS, PUBLIC_ADMIN_URL, PUBLIC_MESSENGER_URL, PUBLIC_CS_DESK_URL, PUBLIC_CS_DASHBOARD_URL, PUBLIC_CS_LOG_URL, PUBLIC_CS_PORTAL_URL, ORIGINAL_CRMP_ADMIN_URL } from "@/lib/docs/urls";
import { AdminPageHeader } from "@/components/AdminPageHeader";
import { T } from "@/components/T";
import { OwnerIdentityPanel } from "@/components/OwnerIdentityPanel";
import { UrlCatalogBoard } from "@/components/UrlCatalogBoard";

export default async function UrlsCatalogPage() {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role_code, "admin.access")) redirect("/admin");

  const counts = {
    pages: PLATFORM_URLS.filter((u) => u.path.startsWith("/admin") || u.path === "/login" || u.path === "/cs").length,
    apis: PLATFORM_URLS.filter((u) => u.category === "API").length,
    tables: PLATFORM_URLS.filter((u) => u.category === "DB Tables" || u.category === "Data").length,
    cs: PLATFORM_URLS.filter((u) => u.category === "CS / TR").length,
  };

  return (
    <div>
      <AdminPageHeader
        pageKey="urls"
        actions={
          <div className="action-row">
            <Link className="btn" href="/cs">
              <T k="cs.portalLink" />
            </Link>
            <Link className="btn" href="/admin/cs-desk">
              <T k="home.csDeskCta" />
            </Link>
            <Link className="btn" href="/admin/cs-dashboard">
              <T k="home.csDashCta" />
            </Link>
            <Link className="btn" href="/admin/cs-log">
              <T k="home.csLogCta" />
            </Link>
            <Link className="btn btn-primary" href="/admin/messenger">
              <T k="common.openMessenger" />
            </Link>
          </div>
        }
      />
      <OwnerIdentityPanel />

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 mb-4">
        {[
          { label: <T k="urls.pages" />, value: String(counts.pages), key: "pages" },
          { label: <T k="urls.apis" />, value: String(counts.apis), key: "apis" },
          { label: <T k="urls.data" />, value: String(counts.tables), key: "data" },
          { label: <T k="urls.csCount" />, value: String(counts.cs), key: "cs" },
          { label: <T k="urls.portalLabel" />, value: "/cs", key: "portal" },
          { label: <T k="urls.deskLabel" />, value: "/admin/cs-desk", key: "desk" },
          { label: <T k="urls.dashLabel" />, value: "/admin/cs-dashboard", key: "dash" },
          { label: <T k="urls.logLabel" />, value: "/admin/cs-log", key: "log" },
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
          <span className="font-semibold"><T k="urls.plusLabel" />: </span>
          <a className="text-teal-900 underline break-all" href={PUBLIC_ADMIN_URL}>
            {PUBLIC_ADMIN_URL}
          </a>
        </p>
        <p className="mt-2">
          <span className="font-semibold"><T k="urls.messengerLabel" />: </span>
          <a className="text-teal-900 underline break-all" href={PUBLIC_MESSENGER_URL}>
            {PUBLIC_MESSENGER_URL}
          </a>
        </p>
        <p className="mt-2">
          <span className="font-semibold"><T k="urls.deskLabel" />: </span>
          <a className="text-teal-900 underline break-all" href={PUBLIC_CS_DESK_URL}>
            {PUBLIC_CS_DESK_URL}
          </a>
        </p>
        <p className="mt-2">
          <span className="font-semibold"><T k="urls.dashLabel" />: </span>
          <a className="text-teal-900 underline break-all" href={PUBLIC_CS_DASHBOARD_URL}>
            {PUBLIC_CS_DASHBOARD_URL}
          </a>
        </p>
        <p className="mt-2">
          <span className="font-semibold"><T k="urls.logLabel" />: </span>
          <a className="text-teal-900 underline break-all" href={PUBLIC_CS_LOG_URL}>
            {PUBLIC_CS_LOG_URL}
          </a>
        </p>
        <p className="mt-2">
          <span className="font-semibold"><T k="urls.portalLabel" />: </span>
          <a className="text-teal-900 underline break-all" href={PUBLIC_CS_PORTAL_URL}>
            {PUBLIC_CS_PORTAL_URL}
          </a>
        </p>
        <p className="mt-3">
          <span className="font-semibold"><T k="urls.frozenLabel" />: </span>
          <a className="text-teal-900 underline break-all" href={ORIGINAL_CRMP_ADMIN_URL}>
            {ORIGINAL_CRMP_ADMIN_URL}
          </a>
        </p>
      </div>

      <div className="panel p-3 sm:p-4 mb-4 text-sm border-cyan-200 bg-cyan-50 text-cyan-950" data-testid="url-cs-cheat">
        <p><T k="urls.csCheat" /></p>
        <p className="mt-2">
          <a className="text-cyan-900 underline" href="#url-cat-cs-tr">
            <T k="urls.jumpCs" />
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
