import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { formatRefreshTimestamp } from "./format";

describe("formatRefreshTimestamp", () => {
  it("renders the daily-scan zone with a UTC+8 label", () => {
    // 2026-10-25T00:40:19.228Z → 08:40 in Asia/Shanghai
    const stamp = formatRefreshTimestamp("2026-10-25T00:40:19.228Z", "en-US");
    expect(stamp).toContain("UTC+8");
    expect(stamp).toMatch(/2026/);
    expect(stamp).toMatch(/08:40|8:40/);
  });

  it("wires last refresh under the homepage hero CTA", () => {
    const hero = readFileSync(path.join(process.cwd(), "components/Hero.tsx"), "utf8");
    const page = readFileSync(path.join(process.cwd(), "app/page.tsx"), "utf8");
    expect(hero).toContain("hero.lastRefresh");
    expect(hero).toContain("hero.catalogue");
    expect(hero).toContain('href="/ideas"');
    expect(page).toContain("readSourceIngest");
    expect(page).toContain("lastRefreshedAt");
  });
});
