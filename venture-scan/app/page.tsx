import { DailyTeaser } from "@/components/DailyTeaser";
import { Hero } from "@/components/Hero";
import { IdeaExplorer } from "@/components/IdeaExplorer";
import { distinctValues, listIdeas } from "@/lib/db";
import { ensureSeeded } from "@/lib/scanner";

export const dynamic = "force-dynamic";

export default function HomePage() {
  ensureSeeded();
  const ideas = listIdeas();
  const meta = {
    industries: distinctValues("industry"),
    sectors: distinctValues("sector"),
    countries: distinctValues("team_country"),
  };

  return (
    <>
      <Hero count={ideas.length} />
      <DailyTeaser />
      <IdeaExplorer initialIdeas={ideas} meta={meta} />
    </>
  );
}
