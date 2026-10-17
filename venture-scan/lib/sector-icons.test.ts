import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { knownSectorIconKeys, sectorIconId } from "./sector-icons";

describe("sectorIconId", () => {
  it("maps empty to all and known sectors to stable ids", () => {
    expect(sectorIconId("")).toBe("all");
    expect(sectorIconId("Cold Chain Logistics")).toBe("logistics");
    expect(sectorIconId("Short Video")).toBe("video");
    expect(sectorIconId("AI Coding")).toBe("ai");
    expect(sectorIconId("Banking-as-a-Service")).toBe("banking");
  });

  it("covers every sector in the ideas snapshot", () => {
    const snap = JSON.parse(
      readFileSync(join(process.cwd(), "public/data/ideas.json"), "utf8"),
    ) as { ideas: Array<{ sector: string }> };
    const sectors = [...new Set(snap.ideas.map((i) => i.sector))];
    for (const sector of sectors) {
      expect(sectorIconId(sector)).not.toBe("generic");
    }
    expect(knownSectorIconKeys().length).toBeGreaterThanOrEqual(sectors.length);
  });
});
