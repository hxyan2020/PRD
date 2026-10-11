import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { mirrorEncodedBrackets } from "./mirror-brackets";

describe("mirrorEncodedBrackets", () => {
  it("copies [slug] folders to %5Bslug%5D", () => {
    const dir = mkdtempSync(path.join(os.tmpdir(), "or-br-"));
    const src = path.join(dir, "chunks", "app", "[slug]");
    mkdirSync(src, { recursive: true });
    writeFileSync(path.join(src, "page.js"), "ok");
    mirrorEncodedBrackets(dir);
    expect(readFileSync(path.join(dir, "chunks", "app", "%5Bslug%5D", "page.js"), "utf8")).toBe("ok");
    rmSync(dir, { recursive: true, force: true });
  });
});
