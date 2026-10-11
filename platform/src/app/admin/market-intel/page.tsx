import { redirect } from "next/navigation";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { AdminPageHeader } from "@/components/AdminPageHeader";
import { MarketIntelBoard } from "@/components/MarketIntelBoard";
import {
  listMarketIntelFindings,
  listMarketIntelOutbox,
  listMarketIntelScans,
  listMarketIntelSources,
  seedMarketIntel,
} from "@/lib/market-intel/scanner";
import { getDb } from "@/lib/db";
import { readSearchParams } from "@/lib/static-export";

type MiTab = "findings" | "messenger" | "sources" | "scans";

function asMiTab(v: string | undefined): MiTab | undefined {
  if (v === "findings" || v === "messenger" || v === "sources" || v === "scans") return v;
  return undefined;
}

export default async function MarketIntelPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string; tab?: string }>;
}) {
  const user = await getCurrentUser();
  if (
    !user ||
    !(
      hasPermission(user.role_code, "monitor.read") ||
      hasPermission(user.role_code, "ai.read") ||
      hasPermission(user.role_code, "sources.read")
    )
  ) {
    redirect("/admin");
  }

  const sp = await readSearchParams(searchParams);
  const initialTab = asMiTab(sp.tab);

  seedMarketIntel();
  const settings = getDb()
    .prepare(`SELECT key, value FROM platform_settings WHERE key LIKE 'market_intel.%'`)
    .all() as Array<{ key: string; value: string }>;
  const indicator = getDb()
    .prepare(`SELECT * FROM monitor_indicators WHERE monitor_id = 'M2-MKT-INTEL'`)
    .get() as React.ComponentProps<typeof MarketIntelBoard>["initial"]["indicator"];

  return (
    <div>
      <AdminPageHeader pageKey="market-intel" />
      <MarketIntelBoard
        initialTab={initialTab}
        initial={{
          findings: listMarketIntelFindings(80) as React.ComponentProps<typeof MarketIntelBoard>["initial"]["findings"],
          scans: listMarketIntelScans(40) as React.ComponentProps<typeof MarketIntelBoard>["initial"]["scans"],
          sources: listMarketIntelSources() as React.ComponentProps<typeof MarketIntelBoard>["initial"]["sources"],
          outbox: listMarketIntelOutbox(40) as React.ComponentProps<typeof MarketIntelBoard>["initial"]["outbox"],
          indicator,
          settings,
        }}
      />
    </div>
  );
}
