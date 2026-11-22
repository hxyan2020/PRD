import { cookies } from "next/headers";
import { randomBytes } from "crypto";
import { getDb, writeAudit } from "./db";
import type { SessionUser } from "./types";

const COOKIE = "crmp_session";
const TTL_HOURS = 24;

export async function createSession(userId: number) {
  const db = getDb();
  const token = randomBytes(24).toString("hex");
  const expires = new Date(Date.now() + TTL_HOURS * 3600 * 1000).toISOString();
  db.prepare(`INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)`).run(
    token,
    userId,
    expires
  );
  db.prepare(`UPDATE users SET last_login_at = datetime('now') WHERE id = ?`).run(userId);
  const cookieStore = await cookies();
  cookieStore.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    expires: new Date(expires),
  });
  return token;
}

export async function destroySession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE)?.value;
  if (token) {
    getDb().prepare(`DELETE FROM sessions WHERE token = ?`).run(token);
  }
  cookieStore.delete(COOKIE);
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE)?.value;
  if (!token) return null;

  const row = getDb()
    .prepare(
      `SELECT u.id, u.email, u.name, u.role_code, u.department_code, u.team_id, t.name AS team_name,
              s.expires_at
       FROM sessions s
       JOIN users u ON u.id = s.user_id
       LEFT JOIN teams t ON t.id = u.team_id
       WHERE s.token = ?`
    )
    .get(token) as
    | (SessionUser & { expires_at: string })
    | undefined;

  if (!row) return null;
  if (new Date(row.expires_at).getTime() < Date.now()) {
    getDb().prepare(`DELETE FROM sessions WHERE token = ?`).run(token);
    return null;
  }

  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role_code: row.role_code,
    department_code: row.department_code,
    team_id: row.team_id,
    team_name: row.team_name,
  };
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }
  return user;
}

export function loginWithCredentials(email: string, password: string) {
  const user = getDb()
    .prepare(
      `SELECT id, email, name, role_code, status FROM users WHERE lower(email) = lower(?) AND password = ?`
    )
    .get(email, password) as
    | { id: number; email: string; name: string; role_code: string; status: string }
    | undefined;

  if (!user || user.status !== "ACTIVE") return null;
  writeAudit({ id: user.id, name: user.name }, "LOGIN", "user", String(user.id), {
    email: user.email,
  });
  return user;
}

export function rolePermissions(roleCode: string): string[] {
  const row = getDb()
    .prepare(`SELECT permissions_json FROM roles WHERE code = ?`)
    .get(roleCode) as { permissions_json: string } | undefined;
  if (!row) return [];
  return JSON.parse(row.permissions_json) as string[];
}

export function hasPermission(roleCode: string, permission: string) {
  const perms = rolePermissions(roleCode);
  if (perms.includes("*")) return true;
  if (perms.includes(permission)) return true;
  const [ns] = permission.split(".");
  if (perms.includes(`${ns}.*`)) return true;
  return false;
}
