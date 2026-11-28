import { describe, expect, it } from "vitest";
import {
  cycleLocale,
  dateLocale,
  detectBrowserLocale,
  isZh,
  nextLocaleLabel,
  parseStoredLocale,
} from "./locale";
import { t } from "./messages";

describe("locale helpers", () => {
  it("cycles EN → 简中 → 繁中 → EN", () => {
    expect(cycleLocale("en")).toBe("zh-CN");
    expect(cycleLocale("zh-CN")).toBe("zh-TW");
    expect(cycleLocale("zh-TW")).toBe("en");
  });

  it("labels the next language on the toggle", () => {
    expect(nextLocaleLabel("en")).toBe("简中");
    expect(nextLocaleLabel("zh-CN")).toBe("繁中");
    expect(nextLocaleLabel("zh-TW")).toBe("EN");
  });

  it("detects browser locales", () => {
    expect(detectBrowserLocale("zh-TW")).toBe("zh-TW");
    expect(detectBrowserLocale("zh-HK")).toBe("zh-TW");
    expect(detectBrowserLocale("zh-CN")).toBe("zh-CN");
    expect(detectBrowserLocale("en-US")).toBe("en");
  });

  it("parses stored locales", () => {
    expect(parseStoredLocale("zh-TW")).toBe("zh-TW");
    expect(parseStoredLocale("fr")).toBeNull();
  });

  it("marks both Chinese scripts as zh", () => {
    expect(isZh("zh-CN")).toBe(true);
    expect(isZh("zh-TW")).toBe(true);
    expect(isZh("en")).toBe(false);
  });

  it("maps date locales", () => {
    expect(dateLocale("zh-TW")).toBe("zh-TW");
    expect(dateLocale("zh-CN")).toBe("zh-CN");
    expect(dateLocale("en")).toBe("en-SG");
  });
});

describe("繁中 messages", () => {
  it("returns Traditional Chinese chrome strings", () => {
    expect(t("zh-TW", "nav.home")).toBe("首頁");
    expect(t("zh-TW", "nav.knowledge")).toBe("知識庫");
    expect(t("zh-TW", "nav.repository")).toBe("LP倉庫");
    expect(t("zh-TW", "home.scan")).toBe("掃描");
    expect(t("zh-TW", "kb.save")).toBe("儲存");
  });
});
