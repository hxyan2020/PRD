import { describe, expect, it } from "vitest";
import { DATA_SOURCES } from "../data-sources";
import {
  localizeCountry,
  localizeLanguage,
  localizeRegion,
  localizeSource,
} from "./localize-source";
import { LOCALES } from "./locales";

describe("localizeSource", () => {
  it("localizes zh-CN desk fields for TechCrunch", () => {
    const src = DATA_SOURCES.find((s) => s.id === "techcrunch")!;
    const view = localizeSource(src, "zh-CN");
    expect(view.description).toBe("全球创业与融资新闻专线。");
    expect(view.language).toBe("英语");
    expect(view.region).toBe("全球 / 北美");
    expect(view.countries).toContain("美国");
    expect(view.countries).toContain("英国");
    expect(view.description).not.toBe(src.description);
  });

  it("keeps English source unchanged for en locale", () => {
    const src = DATA_SOURCES[0];
    expect(localizeSource(src, "en")).toBe(src);
  });

  it("covers every source id in every locale pack", () => {
    for (const locale of LOCALES) {
      if (locale.code === "en") continue;
      for (const source of DATA_SOURCES) {
        const view = localizeSource(source, locale.code);
        expect(view.description, `${locale.code}.${source.id}`).toBeTruthy();
        expect(view.description).not.toMatch(/Suggested go-forward|PH\d/);
      }
    }
  });

  it("localizes country, language, and region helpers", () => {
    expect(localizeCountry("United States", "zh-CN")).toBe("美国");
    expect(localizeLanguage("English / Arabic", "zh-CN")).toBe("英语 / 阿拉伯语");
    expect(localizeRegion("Global / North America", "zh-CN")).toBe("全球 / 北美");
  });
});
