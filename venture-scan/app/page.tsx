import { DailyTeaser } from "@/components/DailyTeaser";
import { Hero } from "@/components/Hero";
import { IdeasTeaser } from "@/components/IdeasTeaser";
import { loadIdeasForPage } from "@/lib/load-ideas";

export default function HomePage() {
  const { ideas } = loadIdeasForPage();

  return (
    <>
      <Hero count={ideas.length} />
      <DailyTeaser />
      <IdeasTeaser count={ideas.length} />
    </>
  );
}
