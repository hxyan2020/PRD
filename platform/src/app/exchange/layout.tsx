import type { Metadata } from "next";
import { getCurrentUser, rolePermissions } from "@/lib/auth";
import { ExchangeAdminShell } from "@/components/ExchangeAdminShell";
import { collectNavEvents } from "@/lib/nav-events";
import { FALLBACK_NAV_TOTALS } from "@/lib/nav-badges";
import { getDb } from "@/lib/db";

export const metadata: Metadata = {
  title: "Crypto Exchange Risk Control Plane",
  description:
    "Parallel CRMP desk for crypto-exchange risk — wallets, matching, liquidations and exchange book controls.",
  icons: {
    icon: [{ url: "/favicon.ico" }],
  },
};

function fallbackEvents() {
  return Object.fromEntries(
    Object.entries(FALLBACK_NAV_TOTALS).map(([href, count]) => [href, { count, latestAt: null }])
  );
}

/** Crypto-exchange admin mount — parallel to `/admin`, no broker chrome. */
export default async function ExchangeLayout({ children }: { children: React.ReactNode }) {
  const user = (await getCurrentUser())!;
  let navEvents = fallbackEvents();
  try {
    navEvents = collectNavEvents(getDb());
  } catch {
    navEvents = fallbackEvents();
  }
  return (
    <ExchangeAdminShell user={user} permissions={rolePermissions(user.role_code)} navEvents={navEvents}>
      {children}
    </ExchangeAdminShell>
  );
}
