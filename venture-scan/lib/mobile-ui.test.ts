import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

describe("mobile UI affordances", () => {
  it("keeps a mobile nav drawer in the site header", () => {
    const src = readFileSync(
      path.join(process.cwd(), "components/SiteHeader.tsx"),
      "utf8",
    );
    expect(src).toContain("mobile-nav");
    expect(src).toContain("md:hidden");
    expect(src).toContain("sticky top-0");
    expect(src).toContain("/sources");
    expect(src).toContain("nav.sources");
  });

  it("defines mobile-friendly button and field sizing", () => {
    const css = readFileSync(path.join(process.cwd(), "app/globals.css"), "utf8");
    expect(css).toContain("min-height: 44px");
    expect(css).toContain("btn-block-mobile");
    expect(css).toContain("safe-area-inset-bottom");
    expect(css).toContain("idea-dossier-actions");
  });

  it("anchors idea dossiers at the top of the page on open", () => {
    const detail = readFileSync(
      path.join(process.cwd(), "components/IdeaDetail.tsx"),
      "utf8",
    );
    const scroll = readFileSync(
      path.join(process.cwd(), "components/ScrollToTop.tsx"),
      "utf8",
    );
    expect(detail).toContain('id="idea-top"');
    expect(detail).toContain("ScrollToTop");
    expect(detail).toContain("SectorIcon");
    expect(scroll).toContain("useLayoutEffect");
    expect(scroll).toContain("scrollRestoration");
    expect(scroll).toContain("window.scrollTo");
  });
});
