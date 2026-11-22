import { getIdentity, requireTeamRole, type VerifiedIdentity } from "../cursor/identity";

export type Actor = {
  sub: string;
  email: string;
  name: string;
  isAdmin: boolean;
  verified: boolean;
  role: "admin" | "viewer" | "anonymous";
  /** Temporary open mode: anyone may query and edit. */
  openAccess: boolean;
};

function adminEmailAllowlist(): Set<string> {
  const raw = process.env.QUOTEOPS_ADMIN_EMAILS?.trim() ?? "";
  return new Set(
    raw
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean),
  );
}

function isLocalDevHost(): boolean {
  return !process.env.CURSOR_APP_ID && !process.env.VERCEL;
}

/**
 * Temporary open collaboration mode.
 * Default ON. Set QUOTEOPS_OPEN_ACCESS=0 (or false/off) to restore admin-gated writes.
 */
export function isOpenAccess(): boolean {
  const raw = (process.env.QUOTEOPS_OPEN_ACCESS ?? "1").trim().toLowerCase();
  return raw !== "0" && raw !== "false" && raw !== "off" && raw !== "no";
}

export async function getActor(request: Request): Promise<Actor> {
  const openAccess = isOpenAccess();
  const identity = await getIdentity(request);

  if (!identity.verified) {
    if (openAccess) {
      return {
        sub: "anonymous",
        email: "",
        name: "Anonymous editor",
        isAdmin: true,
        verified: false,
        role: "admin",
        openAccess: true,
      };
    }
    return {
      sub: "",
      email: "",
      name: "",
      isAdmin: false,
      verified: false,
      role: "anonymous",
      openAccess: false,
    };
  }

  const email = (identity.email || "").toLowerCase();
  const allow = adminEmailAllowlist();
  let isAdmin = false;

  if (identity.kind === "person") {
    if (identity.appVisibility === "team") {
      // Team apps: Cursor team admin role, optionally narrowed by allowlist.
      const narrowed = requireTeamRole(identity, ["admin"]);
      isAdmin = !(narrowed instanceof Response);
    } else {
      // Private apps: only explicit allowlist (never “any signed-in user”).
      isAdmin = allow.size > 0 && allow.has(email);
    }
    // Explicit deny / allow always wins when allowlist is configured.
    if (allow.size > 0) {
      isAdmin = allow.has(email);
    }
  }

  // Local simulated viewer (identity.dev) is admin for local UX only.
  if (identity.simulated && identity.kind === "person" && isLocalDevHost()) {
    isAdmin = true;
  }

  if (openAccess) isAdmin = true;

  return {
    sub: identity.sub,
    email: identity.email || "",
    name: identity.name || identity.email || "viewer",
    isAdmin,
    verified: true,
    role: isAdmin ? "admin" : "viewer",
    openAccess,
  };
}

/** All mutating API routes must go through this. */
export async function requireAdmin(request: Request): Promise<Actor | Response> {
  // Temporary open mode: anyone (including anonymous) may write.
  if (isOpenAccess() || isLocalDevHost()) {
    const actor = await getActor(request);
    return {
      ...actor,
      isAdmin: true,
      verified: actor.verified || isLocalDevHost(),
      role: "admin",
      openAccess: isOpenAccess(),
      sub: actor.sub || (isLocalDevHost() ? "local-dev" : "anonymous"),
      email: actor.email || (isLocalDevHost() ? "dev@example.com" : ""),
      name: actor.name || (isLocalDevHost() ? "Local Admin" : "Anonymous editor"),
    };
  }

  const actor = await getActor(request);
  if (!actor.verified) {
    return Response.json(
      { error: "unauthorized", reason: "not_signed_in", message: "Sign in required" },
      { status: 401 },
    );
  }
  if (!actor.isAdmin) {
    return Response.json(
      {
        error: "forbidden",
        reason: "admin_only",
        message: "Only admins can create or modify knowledge",
      },
      { status: 403 },
    );
  }
  return actor;
}

export function actorLabel(actor: Actor | VerifiedIdentity): string {
  if ("email" in actor && actor.email) return actor.email;
  if ("name" in actor && actor.name) return String(actor.name);
  return "unknown";
}
