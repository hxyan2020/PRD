import { describe, expect, it } from "vitest";
import { filterHdRelevantImages } from "@/lib/images";

describe("filterHdRelevantImages", () => {
  it("rejects logos, ads, and low-res thumbs", () => {
    const filtered = filterHdRelevantImages([
      {
        url: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/logo.png/120px-logo.png",
        alt: "Site logo",
        width: 120,
        height: 120,
        credit: "x",
        sourceUrl: "https://en.wikipedia.org/wiki/X",
      },
      {
        url: "https://upload.wikimedia.org/wikipedia/commons/4/4a/Cosmic_microwave_background.jpg",
        alt: "CMB map",
        width: 1600,
        height: 900,
        credit: "Wikimedia",
        sourceUrl: "https://en.wikipedia.org/wiki/CMB",
      },
      {
        url: "https://evil.example/ads/banner.jpg",
        alt: "Buy now",
        width: 1200,
        height: 800,
        credit: "ad",
        sourceUrl: "https://evil.example",
      },
    ]);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].url).toContain("Cosmic_microwave_background");
  });
});
