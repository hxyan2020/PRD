import { describe, expect, it } from "vitest";
import {
  filterHdRelevantImages,
  resolveWikimediaOriginal,
} from "@/lib/images";

describe("filterHdRelevantImages", () => {
  it("keeps only HD relevant source images", () => {
    const filtered = filterHdRelevantImages(
      [
        {
          url: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/Site_logo.png/120px-Site_logo.png",
          alt: "Site logo",
          width: 120,
          height: 120,
          credit: "x",
          sourceUrl: "https://en.wikipedia.org/wiki/X",
        },
        {
          url: "https://upload.wikimedia.org/wikipedia/commons/4/4a/Cosmic_microwave_background.jpg",
          alt: "Cosmic microwave background map",
          width: 1600,
          height: 900,
          credit: "Wikimedia",
          sourceUrl: "https://en.wikipedia.org/wiki/CMB",
        },
        {
          url: "https://upload.wikimedia.org/wikipedia/commons/9/9a/Simulation_diagram.png",
          alt: "Diagram",
          width: 800,
          height: 600,
          credit: "Wikimedia",
          sourceUrl: "https://en.wikipedia.org/wiki/Simulation",
        },
        {
          url: "https://evil.example/ads/banner.jpg",
          alt: "Buy now sponsor banner",
          width: 1920,
          height: 1080,
          credit: "ad",
          sourceUrl: "https://evil.example",
        },
        {
          url: "https://upload.wikimedia.org/wikipedia/commons/1/1a/Unknown_dims.jpg",
          alt: "No size metadata",
          width: 0,
          height: 0,
          credit: "Wikimedia",
          sourceUrl: "https://en.wikipedia.org/wiki/X",
        },
      ],
      { topicHint: "cosmic microwave background" },
    );
    expect(filtered).toHaveLength(1);
    expect(filtered[0].url).toContain("Cosmic_microwave_background");
  });

  it("rejects ads and logos even when HD-sized", () => {
    const filtered = filterHdRelevantImages([
      {
        url: "https://upload.wikimedia.org/wikipedia/commons/2/2a/Wikipedia_logo_HD.png",
        alt: "Wikipedia logo",
        width: 1920,
        height: 1080,
        credit: "Wikimedia",
        sourceUrl: "https://en.wikipedia.org/wiki/X",
      },
      {
        url: "https://upload.wikimedia.org/wikipedia/commons/3/3a/Sponsor_banner_ad.jpg",
        alt: "Sponsor advert",
        width: 1920,
        height: 1080,
        credit: "Wikimedia",
        sourceUrl: "https://en.wikipedia.org/wiki/X",
      },
    ]);
    expect(filtered).toHaveLength(0);
  });

  it("resolves wikimedia thumb paths to originals", () => {
    expect(
      resolveWikimediaOriginal(
        "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Prof_Nick_Bostrom_324-1.jpg/330px-Prof_Nick_Bostrom_324-1.jpg",
      ),
    ).toBe(
      "https://upload.wikimedia.org/wikipedia/commons/3/3a/Prof_Nick_Bostrom_324-1.jpg",
    );
  });
});
