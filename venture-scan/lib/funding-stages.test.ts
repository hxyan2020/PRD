import { describe, expect, it } from "vitest";
import {
  collectFundingStages,
  fundingStageIconId,
  sortFundingStages,
} from "./funding-stages";

describe("funding stages", () => {
  it("sorts known stages early → late", () => {
    expect(
      sortFundingStages(["Public", "Seed", "Series B", "Pre-seed", "Acquired"]),
    ).toEqual(["Pre-seed", "Seed", "Series B", "Public", "Acquired"]);
  });

  it("collects unique stages from ideas", () => {
    expect(
      collectFundingStages([
        { fundingStage: "Series A" },
        { fundingStage: "Seed" },
        { fundingStage: "Series A" },
        {},
      ]),
    ).toEqual(["Seed", "Series A"]);
  });

  it("maps stages to icon ids", () => {
    expect(fundingStageIconId("")).toBe("all");
    expect(fundingStageIconId("Pre-seed")).toBe("preseed");
    expect(fundingStageIconId("Series C")).toBe("series");
    expect(fundingStageIconId("Public")).toBe("public");
  });
});
