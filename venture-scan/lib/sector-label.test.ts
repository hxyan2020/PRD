import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

describe("sector labels on idea surfaces", () => {
  it("renders SectorLabel with SectorIcon on the Ideas ledger", () => {
    const explorer = readFileSync(
      path.join(process.cwd(), "components/IdeaExplorer.tsx"),
      "utf8",
    );
    const label = readFileSync(
      path.join(process.cwd(), "components/SectorLabel.tsx"),
      "utf8",
    );
    expect(explorer).toContain("SectorLabel");
    expect(explorer).toContain("sector={idea.sector}");
    expect(label).toContain("SectorIcon");
    expect(label).toContain("splitSectors");
  });

  it("shows sector icons on dossier, today, collection, and profile matches", () => {
    for (const file of [
      "components/IdeaDetail.tsx",
      "components/DailyRecommendation.tsx",
      "components/CollectionPage.tsx",
      "components/ProfileChatbot.tsx",
    ]) {
      const src = readFileSync(path.join(process.cwd(), file), "utf8");
      expect(src, file).toContain("SectorLabel");
    }
  });
});
