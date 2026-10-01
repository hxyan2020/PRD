"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { NAV_ITEMS } from "@/lib/nav";
import { cn } from "@/lib/utils";
import type { SessionUser } from "@/lib/types";
import { LogOut } from "lucide-react";

export function AdminShell({
  user,
  permissions,
  children,
}: {
  user: SessionUser;
  permissions: string[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const can = (perm: string) => permissions.includes("*") || permissions.includes(perm);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-[260px_1fr]">
      <aside className="bg-[var(--sidebar)] text-[var(--sidebar-ink)] px-4 py-5 flex flex-col gap-6">
        <div>
          <div className="text-[0.7rem] uppercase tracking-[0.18em] text-teal-200/80">Vantage Markets</div>
          <div className="mt-1 font-[family-name:var(--font-display)] text-xl text-white">CRMP Admin</div>
          <div className="mt-1 text-xs text-slate-300">Centralised Risk Management Platform</div>
        </div>

        <nav className="flex flex-col gap-1 flex-1">
          {NAV_ITEMS.filter((item) => can(item.permission)).map((item) => {
            const active = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition",
                  active ? "bg-white/12 text-white" : "text-slate-300 hover:bg-white/8 hover:text-white"
                )}
              >
                <Icon size={16} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-xs">
          <div className="font-semibold text-white">{user.name}</div>
          <div className="mt-0.5 text-slate-300">{user.email}</div>
          <div className="mt-2 flex flex-wrap gap-1">
            <span className="badge border-teal-400/30 bg-teal-400/10 text-teal-100">{user.role_code}</span>
            {user.department_code && (
              <span className="badge border-white/20 bg-white/10 text-slate-100">{user.department_code}</span>
            )}
          </div>
          <button onClick={logout} className="mt-3 inline-flex items-center gap-1.5 text-slate-300 hover:text-white">
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </aside>

      <main className="min-w-0">
        <header className="border-b border-[var(--line)] bg-white/80 backdrop-blur px-6 py-4 sticky top-0 z-10">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-xs uppercase tracking-[0.14em] text-[var(--muted)]">Admin Control Plane</div>
              <div className="font-[family-name:var(--font-display)] text-lg text-[var(--ink)]">
                Risk · Ops · AI · System
              </div>
            </div>
            <div className="text-right text-xs text-[var(--muted)]">
              <div>Messenger: <strong className="text-[var(--ink)]">Lark</strong></div>
              <div>Indicators: <strong className="text-[var(--ink)]">Monitor 2.0</strong></div>
            </div>
          </div>
        </header>
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
