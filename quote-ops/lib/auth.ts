import { getIdentity, requireTeamRole, type VerifiedIdentity } from "../cursor/identity";

export type Actor = {
  sub: string;
  email: string;
  name: string;
  isAdmin: boolean;
  verified: boolean;
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

export async function getActor(request: Request): Promise<Actor> {
  const identity = await getIdentity(request);
  if (!identity.verified) {
    return { sub: "", email: "", name: "", isAdmin: false, verified: false };
  }
  const email = (identity.email || "").toLowerCase();
  const allow = adminEmailAllowlist();
  let isAdmin = false;

  if (identity.kind === "person") {
    if (identity.appVisibility === "team") {
      const narrowed = requireTeamRole(identity, ["admin"]);
      isAdmin = !(narrowed instanceof Response);
    } else {
      // private app: allowlisted emails, or any verified person when allowlist empty (local/dev)
      isAdmin = allow.size === 0 || allow.has(email);
    }
    if (allow.size > 0 && !allow.has(email)) isAdmin = false;
    if (allow.size > 0 && allow.has(email)) isAdmin = true;
  }

  // Local simulated viewer is team admin in identity.dev
  if (identity.simulated && identity.kind === "person") {
    isAdmin = true;
  }

  return {
    sub: identity.sub,
    email: identity.email || "",
    name: identity.name || identity.email || "viewer",
    isAdmin,
    verified: true,
  };
}

export async function requireAdmin(request: Request): Promise<Actor | Response> {
  const actor = await getActor(request);
  // Local/dev without published identity gate: allow writes
  if (!process.env.CURSOR_APP_ID && !process.env.VERCEL) {
    return {
      ...actor,
      isAdmin: true,
      verified: true,
      sub: actor.sub || "local-dev",
      email: actor.email || "dev@example.com",
      name: actor.name || "Local Admin",
    };
  }
  if (!actor.verified) {
    return Response.json({ error: "unauthorized", reason: "not_signed_in" }, { status: 401 });
  }
  if (!actor.isAdmin) {
    return Response.json({ error: "forbidden", reason: "admin_only" }, { status: 403 });
  }
  return actor;
}

export function actorLabel(actor: Actor | VerifiedIdentity): string {
  if ("email" in actor && actor.email) return actor.email;
  if ("name" in actor && actor.name) return String(actor.name);
  return "unknown";
}
