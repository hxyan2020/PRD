import { getIdentity, requireTeamRole, type VerifiedIdentity } from "../cursor/identity";

export type Actor = {
  sub: string;
  email: string;
  name: string;
  isAdmin: boolean;
  verified: boolean;
  role: "admin" | "viewer" | "anonymous";
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

export async function getActor(request: Request): Promise<Actor> {
  const identity = await getIdentity(request);
  if (!identity.verified) {
    return {
      sub: "",
      email: "",
      name: "",
      isAdmin: false,
      verified: false,
      role: "anonymous",
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

  return {
    sub: identity.sub,
    email: identity.email || "",
    name: identity.name || identity.email || "viewer",
    isAdmin,
    verified: true,
    role: isAdmin ? "admin" : "viewer",
  };
}

/** All mutating API routes must go through this. */
export async function requireAdmin(request: Request): Promise<Actor | Response> {
  // Local/dev without published identity gate: allow writes for smoke tests.
  if (isLocalDevHost()) {
    const actor = await getActor(request);
    return {
      ...actor,
      isAdmin: true,
      verified: true,
      role: "admin",
      sub: actor.sub || "local-dev",
      email: actor.email || "dev@example.com",
      name: actor.name || "Local Admin",
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
