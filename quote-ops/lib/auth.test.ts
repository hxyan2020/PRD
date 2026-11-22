import { afterEach, describe, expect, it } from "vitest";
import { getActor, isOpenAccess, requireAdmin } from "@/lib/auth";

const ORIG = { ...process.env };

afterEach(() => {
  process.env = { ...ORIG };
});

describe("open access auth", () => {
  it("defaults to open access", () => {
    delete process.env.QUOTEOPS_OPEN_ACCESS;
    expect(isOpenAccess()).toBe(true);
  });

  it("can be turned off", () => {
    process.env.QUOTEOPS_OPEN_ACCESS = "0";
    expect(isOpenAccess()).toBe(false);
  });

  it("anonymous getActor is writable when open", async () => {
    process.env.QUOTEOPS_OPEN_ACCESS = "1";
    delete process.env.CURSOR_APP_ID;
    // Simulate hosted (VERCEL set) so local-dev shortcut is not the reason
    process.env.VERCEL = "1";
    const actor = await getActor(new Request("http://localhost/api/me"));
    expect(actor.isAdmin).toBe(true);
    expect(actor.openAccess).toBe(true);
    expect(actor.role).toBe("admin");
  });

  it("requireAdmin allows anonymous writes when open", async () => {
    process.env.QUOTEOPS_OPEN_ACCESS = "1";
    process.env.VERCEL = "1";
    const result = await requireAdmin(new Request("http://localhost/api/kb", { method: "POST" }));
    expect(result instanceof Response).toBe(false);
    if (!(result instanceof Response)) {
      expect(result.isAdmin).toBe(true);
      expect(result.name).toContain("Anonymous");
    }
  });

  it("requireAdmin blocks anonymous when closed on hosted", async () => {
    process.env.QUOTEOPS_OPEN_ACCESS = "0";
    process.env.VERCEL = "1";
    delete process.env.CURSOR_APP_ID;
    const result = await requireAdmin(new Request("http://localhost/api/kb", { method: "POST" }));
    expect(result instanceof Response).toBe(true);
    if (result instanceof Response) {
      expect(result.status).toBe(401);
    }
  });
});
