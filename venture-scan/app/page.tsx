import { DailyTeaser } from "@/components/DailyTeaser";
import { Hero } from "@/components/Hero";
import { IdeaExplorer } from "@/components/IdeaExplorer";
import { isStaticMode } from "@/lib/base-path";
import { catalogIdeas, catalogMeta } from "@/lib/catalog";
import { distinctValues, listIdeas } from "@/lib/db";
import { ensureSeeded } from "@/lib/scanner";

function loadIdeas() {
  if (isStaticMode()) {
    return { ideas: catalogIdeas(), meta: catalogMeta() };
  }
  try {
    ensureSeeded();
    return {
      ideas: listIdeas(),
      meta: {
        industries: distinctValues("industry"),
        sectors: distinctValues("sector"),
        countries: distinctValues("team_country"),
      },
    };
  } catch {
    return { ideas: catalogIdeas(), meta: catalogMeta() };
  }
}

export default function HomePage() {
  const { ideas, meta } = loadIdeas();

  return (
    <>
      <Hero count={ideas.length} />
      <DailyTeaser />
      <IdeaExplorer initialIdeas={ideas} meta={meta} />
    </>
  );
}
