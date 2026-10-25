import { DailyTeaser } from "@/components/DailyTeaser";
import { Hero } from "@/components/Hero";
import { IdeasTeaser } from "@/components/IdeasTeaser";
import { isActiveIdea } from "@/lib/archived-ideas";
import { loadIdeasForPage } from "@/lib/load-ideas";
import { readSourceIngest } from "@/lib/source-ingest";

export default function HomePage() {
  const { ideas } = loadIdeasForPage();
  const activeCount = ideas.filter(isActiveIdea).length;
  const { scannedAt } = readSourceIngest();

  return (
    <>
      <Hero count={activeCount} lastRefreshedAt={scannedAt} />
      <DailyTeaser />
      <IdeasTeaser ideas={ideas} />
    </>
  );
}
