import type { AuthSession, AuthUser, StoredUser } from "../types/auth";

export const USERS_KEY = "ludus-atlas-users-v1";
export const SESSION_KEY = "ludus-atlas-session-v1";
export const AUTH_EVENT = "ludus-atlas-auth-change";

function emitAuthChange() {
  window.dispatchEvent(new CustomEvent(AUTH_EVENT));
}

function readUsers(): StoredUser[] {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as StoredUser[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeUsers(users: StoredUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function toPublic(user: StoredUser): AuthUser {
  return { id: user.id, email: user.email, createdAt: user.createdAt };
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function bytesToHex(bytes: ArrayBuffer | Uint8Array) {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  return [...arr].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function hexToBytes(hex: string) {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

async function hashPassword(password: string, saltHex: string) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: hexToBytes(saltHex),
      iterations: 120_000,
      hash: "SHA-256",
    },
    keyMaterial,
    256,
  );
  return bytesToHex(bits);
}

function randomHex(bytes = 16) {
  const buf = new Uint8Array(bytes);
  crypto.getRandomValues(buf);
  return bytesToHex(buf);
}

export function validateEmail(email: string): string | null {
  const e = normalizeEmail(email);
  if (!e) return "Email is required.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return "Enter a valid email address.";
  return null;
}

export function validatePassword(password: string): string | null {
  if (!password) return "Password is required.";
  if (password.length < 8) return "Password must be at least 8 characters.";
  return null;
}

export async function register(
  email: string,
  password: string,
): Promise<{ user: AuthUser } | { error: string }> {
  const emailError = validateEmail(email);
  if (emailError) return { error: emailError };
  const passwordError = validatePassword(password);
  if (passwordError) return { error: passwordError };

  const users = readUsers();
  const normalized = normalizeEmail(email);
  if (users.some((u) => u.email === normalized)) {
    return { error: "An account with this email already exists." };
  }

  const salt = randomHex(16);
  const passwordHash = await hashPassword(password, salt);
  const user: StoredUser = {
    id: `user_${randomHex(8)}`,
    email: normalized,
    salt,
    passwordHash,
    createdAt: new Date().toISOString(),
  };
  users.push(user);
  writeUsers(users);

  const session = createSession(user);
  persistSession(session);
  return { user: toPublic(user) };
}

export async function login(
  email: string,
  password: string,
): Promise<{ user: AuthUser } | { error: string }> {
  const emailError = validateEmail(email);
  if (emailError) return { error: emailError };
  if (!password) return { error: "Password is required." };

  const users = readUsers();
  const normalized = normalizeEmail(email);
  const user = users.find((u) => u.email === normalized);
  if (!user) return { error: "Incorrect email or password." };

  const hash = await hashPassword(password, user.salt);
  if (hash !== user.passwordHash) {
    return { error: "Incorrect email or password." };
  }

  persistSession(createSession(user));
  return { user: toPublic(user) };
}

function createSession(user: StoredUser): AuthSession {
  return {
    userId: user.id,
    email: user.email,
    token: randomHex(24),
    createdAt: new Date().toISOString(),
  };
}

function persistSession(session: AuthSession) {
  // Persists across browser restarts until logout ("stay logged in").
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  emitAuthChange();
}

export function logout() {
  localStorage.removeItem(SESSION_KEY);
  emitAuthChange();
}

export function getSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as AuthSession;
    if (!session?.userId || !session?.email || !session?.token) return null;

    // Ensure the user still exists in the local account store.
    const user = readUsers().find((u) => u.id === session.userId);
    if (!user) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export function getCurrentUser(): AuthUser | null {
  const session = getSession();
  if (!session) return null;
  const user = readUsers().find((u) => u.id === session.userId);
  return user ? toPublic(user) : null;
}
