import { IdeaExplorer } from "@/components/IdeaExplorer";
import { loadIdeasForPage } from "@/lib/load-ideas";

export const metadata = {
  title: "Ideas · VentureScan",
  description:
    "Browse every sourced startup idea and fundraising signal in the VentureScan ledger.",
};

export default function IdeasPage() {
  const { ideas, meta } = loadIdeasForPage();

  return (
    <div className="pt-4 sm:pt-6">
      <IdeaExplorer initialIdeas={ideas} meta={meta} />
    </div>
  );
}
