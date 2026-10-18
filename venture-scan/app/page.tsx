import { DailyTeaser } from "@/components/DailyTeaser";
import { Hero } from "@/components/Hero";
import { IdeasTeaser } from "@/components/IdeasTeaser";
import { isActiveIdea } from "@/lib/archived-ideas";
import { loadIdeasForPage } from "@/lib/load-ideas";

export default function HomePage() {
  const { ideas } = loadIdeasForPage();
  const activeCount = ideas.filter(isActiveIdea).length;

  return (
    <>
      <Hero count={activeCount} />
      <DailyTeaser />
      <IdeasTeaser count={activeCount} />
    </>
  );
}
