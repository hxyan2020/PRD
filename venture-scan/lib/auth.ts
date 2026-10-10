import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import {
  createSession,
  createUser,
  deleteSession,
  findUserByEmail,
  getSessionUser,
  type PublicUser,
} from "./users";

const SESSION_COOKIE = "vs_session";
const SESSION_DAYS = 30;

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [algo, salt, hash] = stored.split("$");
  if (algo !== "scrypt" || !salt || !hash) return false;
  const next = scryptSync(password, salt, 64);
  const prev = Buffer.from(hash, "hex");
  if (prev.length !== next.length) return false;
  return timingSafeEqual(prev, next);
}

function sessionSecret(): string {
  return process.env.VENTURE_SCAN_SESSION_SECRET || "venture-scan-dev-secret-change-me";
}

export function signSessionToken(sessionId: string): string {
  const sig = createHmac("sha256", sessionSecret()).update(sessionId).digest("hex");
  return `${sessionId}.${sig}`;
}

export function parseSessionToken(token: string | undefined | null): string | null {
  if (!token) return null;
  const [sessionId, sig] = token.split(".");
  if (!sessionId || !sig) return null;
  const expected = createHmac("sha256", sessionSecret()).update(sessionId).digest("hex");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  return sessionId;
}

export function validateCredentials(email: string, password: string): string | null {
  const normalized = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) return "Enter a valid email address.";
  if (password.length < 8) return "Password must be at least 8 characters.";
  return null;
}

export async function registerUser(
  email: string,
  password: string,
): Promise<{ user: PublicUser } | { error: string; status: number }> {
  const err = validateCredentials(email, password);
  if (err) return { error: err, status: 400 };
  const normalized = email.trim().toLowerCase();
  if (findUserByEmail(normalized)) {
    return { error: "An account with that email already exists.", status: 409 };
  }
  const user = createUser(normalized, hashPassword(password));
  await establishSession(user.id);
  return { user };
}

export async function loginUser(
  email: string,
  password: string,
): Promise<{ user: PublicUser } | { error: string; status: number }> {
  const err = validateCredentials(email, password);
  if (err) return { error: err, status: 400 };
  const user = findUserByEmail(email.trim().toLowerCase());
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return { error: "Invalid email or password.", status: 401 };
  }
  await establishSession(user.id);
  return {
    user: { id: user.id, email: user.email, createdAt: user.createdAt },
  };
}

export async function logoutUser(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  const sessionId = parseSessionToken(token);
  if (sessionId) deleteSession(sessionId);
  jar.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function currentUser(): Promise<PublicUser | null> {
  const jar = await cookies();
  const sessionId = parseSessionToken(jar.get(SESSION_COOKIE)?.value);
  if (!sessionId) return null;
  return getSessionUser(sessionId);
}

async function establishSession(userId: string): Promise<void> {
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const session = createSession(userId, expiresAt);
  const jar = await cookies();
  jar.set(SESSION_COOKIE, signSessionToken(session.id), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}
