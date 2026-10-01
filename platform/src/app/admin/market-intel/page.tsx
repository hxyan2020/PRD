import { redirect } from "next/navigation";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { PageHeader } from "@/components/ui";
import { MarketIntelBoard } from "@/components/MarketIntelBoard";
import {
  listMarketIntelFindings,
  listMarketIntelOutbox,
  listMarketIntelScans,
  listMarketIntelSources,
  seedMarketIntel,
} from "@/lib/market-intel/scanner";
import { getDb } from "@/lib/db";

export default async function MarketIntelPage() {
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

  seedMarketIntel();
  const settings = getDb()
    .prepare(`SELECT key, value FROM platform_settings WHERE key LIKE 'market_intel.%'`)
    .all() as Array<{ key: string; value: string }>;
  const indicator = getDb()
    .prepare(`SELECT * FROM monitor_indicators WHERE monitor_id = 'M2-MKT-INTEL'`)
    .get() as React.ComponentProps<typeof MarketIntelBoard>["initial"]["indicator"];

  return (
    <div>
      <PageHeader
        title="Market Intelligence"
        subtitle="5-minute scan of news, social and official channels that can move LP prices on Vantage forex, index, commodity, futures and crypto — pushed to a dedicated messenger group and wired as indicator M2-MKT-INTEL."
      />
      <MarketIntelBoard
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
