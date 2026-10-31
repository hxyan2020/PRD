import { DailyTeaser } from "@/components/DailyTeaser";
import { Hero } from "@/components/Hero";
import { IdeasTeaser } from "@/components/IdeasTeaser";
import { readDailyLedger } from "@/lib/daily-ledger";
import { todaysIdeas } from "@/lib/idea-day";
import { loadIdeasForPage } from "@/lib/load-ideas";
import { readSourceIngest } from "@/lib/source-ingest";

export default function HomePage() {
  const { ideas } = loadIdeasForPage();
  const todayCount = todaysIdeas(ideas).length;
  const { scannedAt } = readSourceIngest();
  const ledger = readDailyLedger();

  return (
    <>
      <Hero
        count={todayCount}
        lastRefreshedAt={scannedAt || ledger.scannedAt}
        headlineCount={ledger.headlineCount}
      />
      <DailyTeaser />
      <IdeasTeaser ideas={ideas} />
    </>
  );
}
